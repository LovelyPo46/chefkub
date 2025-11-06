import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  Alert, ActivityIndicator, TextInput,
  ScrollView,
  Platform,
  Linking
} from 'react-native';
import { auth, db, storage } from '../firebaseConfig';
import { signOut, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, uploadString, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const DISABLE_IMAGE_UPLOAD = true; // โหมดไม่อัปโหลดรูปไป Firebase Storage
  const currentUser = auth.currentUser;
  const [imageUri, setImageUri] = useState(null);
  const [nickname, setNickname] = useState('');
  const [myRecipesCount, setMyRecipesCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // [useEffect 1] - โหลดข้อมูลโปรไฟล์
  useEffect(() => {
    if (currentUser) {
      setImageUri(currentUser.photoURL);
      setNickname(currentUser.displayName || '');
      const fetchProfileData = async () => {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.nickname) setNickname(data.nickname);
          if (data.photoURL) setImageUri(data.photoURL);
        }
        setLoading(false);
      };
      fetchProfileData();
    }
  }, [currentUser]);

  // [useEffect 2] - นับจำนวนสูตร
  useEffect(() => {
    if (currentUser) {
      const q = query(
        collection(db, 'recipes'),
        where("authorId", "==", currentUser.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setMyRecipesCount(querySnapshot.size);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  // ฟังก์ชันเลือกรูป
  const pickImage = async () => {
    try {
      // ตรวจสิทธิ์ก่อน แล้วค่อยร้องขอแบบ accessPrivileges: 'all' (iOS)
      let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      if (!perm.granted) {
        Alert.alert(
          'ขออภัย',
          'ต้องการสิทธิ์เข้าถึงคลังภาพเพื่อเลือกรูป',
          [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'เปิดการตั้งค่า', onPress: () => Linking.openSettings?.() }
          ]
        );
        return;
      }
      // กรณี iOS เลือกแบบ Limited ให้เปิดตัวเลือกเพิ่มรูปที่เข้าถึงได้
      if (Platform.OS === 'ios' && perm.accessPrivileges === 'limited') {
        try { await ImagePicker.presentLimitedLibraryPickerAsync(); } catch {}
      }

      const mediaTypeImages = ImagePicker?.MediaType?.Images 
        ?? ImagePicker?.MediaType?.Image 
        ?? undefined;
      let result = await ImagePicker.launchImageLibraryAsync({
        ...(mediaTypeImages ? { mediaTypes: mediaTypeImages } : {}),
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image pick error (profile):', err?.message || err);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปิดคลังภาพได้');
    }
  };

  // ฟังก์ชันอัปโหลดรูป (Helper)
  const uploadImageToStorage = async (uri) => {
    try {
      // แปลงไฟล์จาก URI -> Blob (พยายาม fetch ก่อน, ถ้าไม่สำเร็จใช้ XHR)
      const uriToBlob = async (u) => {
        try {
          const res = await fetch(u);
          const b = await res.blob();
          return b;
        } catch (err) {
          return await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () { resolve(xhr.response); };
            xhr.onerror = function () { reject(new TypeError('Network request failed')); };
            xhr.responseType = 'blob';
            xhr.open('GET', u, true);
            xhr.send(null);
          });
        }
      };

      const blob = await uriToBlob(uri);

      const filename = `profile/${currentUser.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      const contentType = (blob && blob.type) ? blob.type : 'image/jpeg';
      let downloadURL;
      try {
        await uploadBytesResumable(storageRef, blob, { contentType });
        downloadURL = await getDownloadURL(storageRef);
      } catch (errResum) {
        console.warn('Resumable upload failed, fallback to uploadBytes', errResum?.code || errResum);
        try {
          await uploadBytes(storageRef, blob, { contentType });
          downloadURL = await getDownloadURL(storageRef);
        } catch (errBytes) {
          console.warn('uploadBytes failed, fallback to base64 uploadString', errBytes?.code || errBytes);
          // Base64 fallback
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          await uploadString(storageRef, base64, 'base64', { contentType });
          downloadURL = await getDownloadURL(storageRef);
        }
      }
      if (blob && typeof blob.close === 'function') {
        blob.close();
      }
      return downloadURL;
    } catch (e) {
      console.error('Upload error', e?.code, e?.message, e?.customData?.serverResponse || e);
      return null;
    }
  };

  // ฟังก์ชัน "บันทึกโปรไฟล์"
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setUploading(true);
    try {
      let finalImageUrl = currentUser.photoURL || null;
      if (imageUri && imageUri.startsWith('file://')) {
        if (DISABLE_IMAGE_UPLOAD) {
          // โหมดโลคอล: เก็บ path file:// ไว้ในโปรไฟล์
          finalImageUrl = imageUri;
        } else {
          const downloadURL = await uploadImageToStorage(imageUri);
          if (downloadURL) finalImageUrl = downloadURL;
        }
      }
      await updateProfile(currentUser, {
        displayName: nickname,
        ...(finalImageUrl ? { photoURL: finalImageUrl } : {})
      });
      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(docRef, {
        nickname: nickname,
        ...(finalImageUrl ? { photoURL: finalImageUrl } : {})
      }, { merge: true });
      Alert.alert('สำเร็จ', 'บันทึกโปรไฟล์เรียบร้อย');
    } catch (error) {
      console.error("Error saving profile: ", error);
      Alert.alert('ผิดพลาด', error.message);
    }
    setUploading(false);
  };
  
  // ฟังก์ชัน "ออกจากระบบ"
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('ออกจากระบบสำเร็จ');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }
  
  if (!currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#888" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.emailText}>{currentUser.email}</Text>
        <Text style={styles.label}>ชื่อเล่น</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="ใส่ชื่อเล่นของคุณ"
        />
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveProfile} 
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>บันทึกโปรไฟล์</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => navigation.navigate('MyRecipes')}
      >
        <Text style={styles.menuButtonText}>สูตรของฉัน</Text>
        <Text style={styles.menuButtonCount}>{myRecipesCount} สูตร</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuButton, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// (Styles ทั้งหมดเหมือนเดิม)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  profileHeader: { alignItems: 'center', backgroundColor: 'white', padding: 20, marginBottom: 10, },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 15, },
  emailText: { fontSize: 16, color: 'gray', marginBottom: 20, },
  label: { alignSelf: 'flex-start', marginLeft: '5%', fontSize: 14, color: '#333', },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, fontSize: 16, width: '90%', marginBottom: 20, },
  saveButton: { backgroundColor: 'tomato', padding: 12, borderRadius: 8, width: '90%', alignItems: 'center', },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', },
  menuButton: { backgroundColor: 'white', padding: 15, marginHorizontal: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, },
  menuButtonText: { fontSize: 16, },
  menuButtonCount: { fontSize: 16, color: 'gray', },
  logoutButton: { backgroundColor: '#FF3B30', },
  logoutButtonText: { fontSize: 16, color: 'white', fontWeight: 'bold', textAlign: 'center', width: '100%', }
});
