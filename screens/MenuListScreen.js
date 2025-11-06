import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Image // 1. Import 'Image'
} from 'react-native';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function MenuListScreen({ route, navigation }) {
  const { category } = route.params; 
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'recipes'), 
          where("category", "==", category)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedRecipes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecipes(fetchedRecipes);

      } catch (error) {
        console.error(`Error fetching recipes for ${category}: `, error);
      }
      setLoading(false);
    };

    fetchRecipes();
  }, [category]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  // 2. นี่คือส่วนที่เราจะอัปเดต (ฟังก์ชัน renderItem)
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuItem} // 3. เราจะเปลี่ยน style ของปุ่มนี้
      onPress={() => navigation.navigate('RecipeDetail', { 
        recipeId: item.id,
        name: item.name
      })}
    >
      {/* 4. ตรวจสอบว่ามี imageUrl หรือไม่ */}
      {item.imageUrl ? (
        // 5. ถ้ามี: แสดงรูปจาก URL
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.menuImage} 
        />
      ) : (
        // 6. ถ้าไม่มี: แสดงกล่องเปล่าๆ ขนาดเท่ากัน
        <View style={styles.imagePlaceholder} />
      )}
      
      {/* 7. แสดงชื่อเมนู */}
      <Text style={styles.menuText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={recipes}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={styles.container}
    />
  );
}

// 8. อัปเดต Styles ทั้งหมด
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
  menuItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row', // ⭐️ สำคัญ: ทำให้รูปกับข้อความเรียงกันแนวนอน
    alignItems: 'center', // ⭐️ สำคัญ: จัดให้อยู่กลาง (แนวตั้ง)
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15, // เว้นระยะห่างระหว่างรูปกับข้อความ
  },
  imagePlaceholder: {
    // นี่คือกล่องเปล่าๆ กรณีไม่มีรูป
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#eee', // สีเทาจางๆ
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});