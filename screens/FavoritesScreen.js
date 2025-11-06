import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
// 1. Import เครื่องมือ Firebase
import { db, auth } from '../firebaseConfig';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // 2. Import useNavigation

export default function FavoritesScreen() {
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const navigation = useNavigation(); // 3. สร้างตัวแปร navigation

  useEffect(() => {
    // 4. ถ้ายังไม่ Login ไม่ต้องทำอะไร
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // 5. สร้าง query ไปยังคอลเล็กชัน 'favorites' ของผู้ใช้คนนี้
    const q = query(
      collection(db, 'users', currentUser.uid, 'favorites')
    );

    // 6. ใช้ onSnapshot เพื่อให้รายการอัปเดต Real-time
    // (เมื่อเรากด "หัวใจ" หน้านี้ก็จะอัปเดตตามทันที)
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const favorites = [];
      querySnapshot.forEach((doc) => {
        // 7. เราจะเอา doc.id (ซึ่งคือ recipeId) และข้อมูล (name, imageUrl)
        favorites.push({
          id: doc.id, // นี่คือ ID ของ "สูตรอาหาร"
          ...doc.data() // นี่คือ name, imageUrl ที่เราเก็บไว้
        });
      });
      setFavoriteRecipes(favorites);
      setLoading(false);
    });

    // 8. คืนค่าฟังก์ชัน unsubscribe เมื่อ component ปิด
    return () => unsubscribe();
    
  }, [currentUser]); // 9. ให้ทำงานใหม่เมื่อ 'currentUser' เปลี่ยน (เช่น ตอน Login/Logout)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  // 10. ถ้าไม่ได้ Login
  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด</Text>
      </View>
    );
  }
  
  // 11. ถ้ารายการโปรดว่างเปล่า
  if (favoriteRecipes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>คุณยังไม่มีรายการโปรด</Text>
      </View>
    );
  }

  // 12. โค้ดสำหรับแสดงผลรายการ (เหมือน MenuListScreen)
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuItem}
      // 13. เมื่อกด ให้พาไปหน้า Detail
      onPress={() => navigation.navigate('HomeStack', { 
        screen: 'RecipeDetail',
        params: { recipeId: item.id, name: item.name },
      })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}
      <Text style={styles.menuText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={favoriteRecipes}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={styles.container}
    />
  );
}

// 14. Styles (คล้ายๆ MenuListScreen)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  menuImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#b61111ff',
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});