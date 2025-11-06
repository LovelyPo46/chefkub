import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert // 1. Import Alert
} from 'react-native';
import { db, auth } from '../firebaseConfig';
// 2. Import 'deleteDoc' เพิ่ม
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'; 
import { Ionicons } from '@expo/vector-icons';

export default function RecipeDetailScreen({ route, navigation }) {
  // 3. เราต้องเอา 'recipeId' มาใช้ตรงๆ
  const { recipeId, name } = route.params; 
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(true);

  const currentUser = auth.currentUser;

  // useEffect สำหรับเช็คสถานะ "ของโปรด"
  useEffect(() => {
    if (!currentUser || !recipe) {
      setLoadingFavorite(false);
      return;
    }

    const checkFavoriteStatus = async () => {
      setLoadingFavorite(true);
      const favRef = doc(db, 'users', currentUser.uid, 'favorites', recipeId);
      const docSnap = await getDoc(favRef);

      setIsFavorite(docSnap.exists());
      setLoadingFavorite(false);
    };

    checkFavoriteStatus();
  }, [recipe, currentUser]);

  // ฟังก์ชันสำหรับ "สลับ" สถานะของโปรด
  const toggleFavorite = async () => {
    if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบเพื่อบันทึกของโปรด");
      return;
    }
    
    setLoadingFavorite(true);
    const favRef = doc(db, 'users', currentUser.uid, 'favorites', recipeId);

    if (isFavorite) {
      try {
        await deleteDoc(favRef);
        setIsFavorite(false);
        alert('ลบออกจากของโปรดแล้ว');
      } catch (e) {
        console.error("Error removing favorite: ", e);
      }
    } else {
      try {
        await setDoc(favRef, {
          name: recipe.name,
          imageUrl: recipe.imageUrl || '',
          category: recipe.category || '',
        });
        setIsFavorite(true);
        alert('บันทึกในของโปรดแล้ว!');
      } catch (e) {
        console.error("Error adding favorite: ", e);
      }
    }
    setLoadingFavorite(false);
  };

  // useEffect สำหรับตั้งค่าหัวข้อ (Title)
  useEffect(() => {
    if (name) {
      navigation.setOptions({ title: name });
    }
  }, [name, navigation]);

  // useEffect สำหรับดึงข้อมูลสูตรอาหาร
  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      const docRef = doc(db, 'recipes', recipeId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // เราจะเก็บข้อมูล 'recipe' ทั้งหมด (รวมถึง authorId)
        setRecipe(docSnap.data());
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };
    fetchRecipe();
  }, [recipeId]);
  
  // 6. ⭐️ สร้างฟังก์ชันสำหรับ "ลบ" ⭐️
  const handleDelete = async () => {
    // ยืนยันก่อนลบ
    Alert.alert(
      "ยืนยันการลบ",
      "คุณแน่ใจหรือไม่ว่าต้องการลบสูตรนี้? (ไม่สามารถกู้คืนได้)",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ลบ", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 7. สั่งลบเอกสาร
              await deleteDoc(doc(db, 'recipes', recipeId));
              Alert.alert("ลบสำเร็จ", "สูตรของคุณถูกลบแล้ว");
              // 8. กลับไปหน้าก่อนหน้า (MenuList)
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting document: ", error);
              Alert.alert("ผิดพลาด", "ไม่สามารถลบสูตรได้");
            }
          }
        }
      ]
    );
  };

  if (loading || loadingFavorite) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }
  
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text>ไม่พบข้อมูลสูตรอาหาร</Text>
      </View>
    );
  }
  
  // 9. ⭐️ เช็คว่าเป็นเจ้าของโพสต์หรือไม่ ⭐️
  const isOwner = currentUser && recipe && currentUser.uid === recipe.authorId;

  return (
    <ScrollView style={styles.container}>
      {recipe.imageUrl && (
        <Image 
          source={{ uri: recipe.imageUrl }} 
          style={styles.recipeImage} 
        />
      )}
      
      {/* ปุ่ม Favorite (มีขอบ) */}
      <TouchableOpacity onPress={toggleFavorite} style={styles.favButton}>
        <Ionicons 
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={32} 
          color={isFavorite ? 'red' : 'gray'} 
        />
      </TouchableOpacity>

      <Text style={styles.title}>{recipe.name}</Text>
      
      {/* 10. ⭐️ แสดงปุ่ม "แก้ไข" และ "ลบ" ถ้าเป็นเจ้าของ ⭐️ */}
      {isOwner && (
        <View style={styles.ownerControls}>
          <TouchableOpacity 
            style={[styles.ownerButton, styles.editButton]}
            onPress={() => navigation.navigate('EditRecipe', { 
              recipeId: recipeId, // 11. ส่ง ID
              recipeData: recipe   // 12. ส่งข้อมูลเดิมไปหน้าแก้ไข
            })}
          >
            <Ionicons name="pencil" size={18} color="white" />
            <Text style={styles.ownerButtonText}>แก้ไข</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.ownerButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={18} color="white" />
            <Text style={styles.ownerButtonText}>ลบ</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.subtitle}>วัตถุดิบ:</Text>
      <Text style={styles.body}>{recipe.ingredients || '(ยังไม่ได้ใส่วัตถุดิบ)'}</Text>
      
      <Text style={styles.subtitle}>วิธีทำ:</Text>
      <Text style={styles.body}>{recipe.instructions || '(ยังไม่ได้ใส่วิธีทำ)'}</Text>
    </ScrollView>
  );
}

// 13. ⭐️ (Styles ทั้งหมด) ⭐️
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeImage: {
    width: '100%',
    height: 250,
  },
  favButton: {
    position: 'absolute',
    top: 235,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 8,
    elevation: 5,
    borderWidth: 1,        // ความหนาของขอบ
    borderColor: '#ddd',   // สีขอบ (เทาอ่อน)
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5, // ลด MarginBottom
    paddingHorizontal: 20,
    marginTop: 30,
  },
  ownerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  ownerButton: {
    flex: 1, // แบ่งครึ่ง
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#007AFF', // สีน้ำเงิน
  },
  deleteButton: {
    backgroundColor: '#FF3B30', // สีแดง
  },
  ownerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
  }
});