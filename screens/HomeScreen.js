import React from 'react';
import { 
  // 1. Import FlatList เพิ่ม
  FlatList, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  View // View ยังต้องใช้สำหรับ overlay
} from 'react-native';

// array 'categories' เหมือนเดิม
const categories = [
  { 
    key: 'thai', 
    title: 'อาหารไทย', 
    image: require('../assets/category_thai.jpg') 
  },
  { 
    key: 'japanese', 
    title: 'อาหารญี่ปุ่น', 
    image: require('../assets/category_japanese.jpg') 
  },
  { 
    key: 'isaan', 
    title: 'อาหารอีสาน', 
    image: require('../assets/category_isaan.jpg') 
  },
  { 
    key: 'dessert', 
    title: 'ของหวาน', 
    image: require('../assets/category_dessert.jpg') 
  },
  { 
    key: 'west', 
    title: 'อาหารตะวันตก', 
    image: require('../assets/category_west.jpg') 
  },
  { 
    key: 'drink', 
    title: 'เครื่องดื่ม', 
    image: require('../assets/category_drink.jpg') 
  },
  // ... (คุณสามารถเพิ่มหมวดหมู่อื่นๆ ที่นี่ได้อีก)
];

export default function HomeScreen({ navigation }) {

  const onCategoryPress = (categoryKey, categoryTitle) => {
    navigation.navigate('MenuList', { 
      category: categoryKey,
      title: categoryTitle 
    });
  };

  // 2. สร้างฟังก์ชันสำหรับ render แต่ละรายการใน FlatList
  const renderCategoryItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.categoryButton} 
        onPress={() => onCategoryPress(item.key, item.title)}
      >
        <ImageBackground
          source={item.image} 
          style={styles.imageBackground}
          imageStyle={styles.imageStyle} 
        >
          <View style={styles.overlay} /> 
          <Text style={styles.categoryText}>{item.title}</Text>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  // 3. เปลี่ยน JSX ให้ใช้ <FlatList>
  return (
    <FlatList
      style={styles.container} // style หลักของ list
      contentContainerStyle={styles.listContentContainer} // style ของ "เนื้อหา" ข้างใน (เพื่อให้ padding เลื่อนตาม)
      data={categories} // 4. ส่ง array 'categories' เข้าไป
      renderItem={renderCategoryItem} // 5. บอก FlatList ให้ใช้ฟังก์ชันที่เราสร้าง
      keyExtractor={(item) => item.key} // 6. บอก FlatList ว่า key ของแต่ละรายการคืออะไร
    />
  );
}

// 7. อัปเดต Styles
const styles = StyleSheet.create({
  container: {
    flex: 1, // ทำให้ list ขยายเต็มจอ
    backgroundColor: '#f5f5f5',
  },
  listContentContainer: {
    // ย้าย padding มาไว้ที่นี่ เพื่อให้ขอบบนและล่างเลื่อนได้
    padding: 15,
  },
  categoryButton: {
    height: 120,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    borderRadius: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  }
});