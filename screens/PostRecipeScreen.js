import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Image, 
  ScrollView, ActivityIndicator, Alert, TouchableOpacity,
  KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { db, storage, auth } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, uploadString, getDownloadURL } from 'firebase/storage';

const categories = [
  { key: 'thai', title: 'อาหารไทย' },
  { key: 'japanese', title: 'อาหารญี่ปุ่น' },
  { key: 'isaan', title: 'อาหารอีสาน' },
  { key: 'west', title: 'อาหารตะวันตก' },
  { key: 'dessert', title: 'ของหวาน' },
  { key: 'drink', title: 'เครื่องดื่ม' },
];

export default function PostRecipeScreen({ navigation }) {
  const DISABLE_IMAGE_UPLOAD = true; // โหมดไม่อัปโหลดรูปไป Firebase Storage
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('thai');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
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
      if (Platform.OS === 'ios' && perm.accessPrivileges === 'limited') {
        try { await ImagePicker.presentLimitedLibraryPickerAsync(); } catch {}
      }

      const mediaTypeImages = ImagePicker?.MediaType?.Images 
        ?? ImagePicker?.MediaType?.Image 
        ?? undefined;
      let result = await ImagePicker.launchImageLibraryAsync({
        ...(mediaTypeImages ? { mediaTypes: mediaTypeImages } : {}),
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image pick error (post):', err?.message || err);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปิดคลังภาพได้');
    }
  };

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
      const filename = `recipes/${auth.currentUser.uid}/${Date.now()}.jpg`;
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
      Alert.alert('ผิดพลาด', `ไม่สามารถอัปโหลดรูปภาพได้\n(${e?.code || 'storage/unknown'})`);
      return null;
    }
  };

  const handlePostRecipe = async () => {
    if (!auth.currentUser) {
      return Alert.alert('ผิดพลาด', 'กรุณาเข้าสู่ระบบก่อนโพสต์');
    }
    // รูปภาพไม่บังคับอีกต่อไป
    if (!name || !ingredients || !instructions) {
      return Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อเมนู วัตถุดิบ และวิธีทำ');
    }
    setUploading(true);
    try {
      let imageUrl = '';
      if (image) {
        if (DISABLE_IMAGE_UPLOAD) {
          // โหมดโลคอล: เก็บ path file:// ลง Firestore
          imageUrl = image;
        } else {
          imageUrl = await uploadImageToStorage(image) || '';
        }
      }
      await addDoc(collection(db, 'recipes'), {
        name: name,
        ingredients: ingredients,
        instructions: instructions,
        category: category,
        imageUrl: imageUrl, // อนุญาตว่างได้
        createdAt: Timestamp.now(),
        authorId: auth.currentUser.uid
      });
      setUploading(false);
      Alert.alert('สำเร็จ!', 'โพสต์สูตรอาหารของคุณเรียบร้อยแล้ว');
      navigation.goBack();
    } catch (error) {
      setUploading(false);
      console.error("Error adding document: ", error);
      Alert.alert('ผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  if (uploading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
        <Text>กำลังอัปโหลด...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.label}>เลือกรูปภาพ</Text>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <Text>คลิกเพื่อเลือกรูป</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.label}>ชื่อเมนู</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>หมวดหมู่</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                category === cat.key && styles.categoryButtonSelected
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Text style={[
                styles.categoryText,
                category === cat.key && styles.categoryTextSelected
              ]}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>วัตถุดิบ</Text>
        <TextInput
          style={styles.inputMultiline}
          value={ingredients}
          onChangeText={setIngredients}
          multiline
        />
        <Text style={styles.label}>วิธีทำ</Text>
        <TextInput
          style={styles.inputMultiline}
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />
        <TouchableOpacity 
          style={styles.postButton} 
          onPress={handlePostRecipe}
          disabled={uploading}
        >
          <Text style={styles.postButtonText}>โพสต์สูตรอาหาร</Text>
        </TouchableOpacity>
        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 15,
  },
  imagePreview: { width: '100%', height: '100%', borderRadius: 5 },
  
  // --- นี่คือจุดที่แก้ไข ---
  categoryContainer: {
    flexDirection: 'row', // ยังคงเรียงแนวนอน
    flexWrap: 'wrap', // <--- 1. เพิ่มตัวนี้ เพื่ออนุญาตให้ตัดแถว
    // justifyContent: 'space-around', // <--- 2. ลบตัวนี้ (หรือเปลี่ยนเป็น 'flex-start')
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    margin: 5, // <--- 3. เพิ่ม margin เพื่อให้ปุ่มมีระยะห่างระหว่างกันสวยงาม
  },
  // --- จบจุดที่แก้ไข ---

  categoryButtonSelected: { backgroundColor: 'tomato', borderColor: 'tomato' },
  categoryText: { color: '#333' },
  categoryTextSelected: { color: 'white', fontWeight: 'bold' },
  postButton: {
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  postButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});