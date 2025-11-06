import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, onSnapshot, where } from 'firebase/firestore'; // 1. Import 'where'
import { useNavigation } from '@react-navigation/native';

export default function MyRecipesScreen() {
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // 2. ⭐️ Query ที่ 'recipes' collection ⭐️
    // โดยหา 'authorId' ที่ตรงกับ 'currentUser.uid'
    const q = query(
      collection(db, 'recipes'),
      where("authorId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recipes = [];
      querySnapshot.forEach((doc) => {
        recipes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMyRecipes(recipes);
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  if (myRecipes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>คุณยังไม่ได้โพสต์สูตรอาหารใดๆ</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuItem}
      // 3. ⭐️ เมื่อกด ให้พาไปหน้า Detail (ต้องบอก Stack แม่ด้วย) ⭐️
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
      data={myRecipes}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={styles.container}
    />
  );
}

// (Styles ทั้งหมดเหมือน FavoritesScreen)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  infoText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray', },
  menuItem: { backgroundColor: 'white', padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, },
  menuImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15, },
  imagePlaceholder: { width: 60, height: 60, borderRadius: 8, marginRight: 15, backgroundColor: '#eee', },
  menuText: { fontSize: 16, fontWeight: 'bold', }
});