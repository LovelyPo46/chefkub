import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import CustomSplash from './screens/CustomSplash';

// 1. ⭐️ Import Firebase Auth และตัวเช็คสถานะ ⭐️
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Using a lightweight custom splash after initial load (no expo-splash-screen)

// --- Import หน้าจอทั้งหมด ---
import HomeScreen from './screens/HomeScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ProfileScreen from './screens/ProfileScreen';
import MenuListScreen from './screens/MenuListScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import PostRecipeScreen from './screens/PostRecipeScreen';
import EditRecipeScreen from './screens/EditRecipeScreen';
import MyRecipesScreen from './screens/MyRecipesScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// --- สร้าง Navigators ---
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RootStack = createStackNavigator(); // 2. ⭐️ สร้าง Stack "ราก" ⭐️

// --- (HomeStackScreen) ---
function HomeStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeCategories" 
        component={HomeScreen} 
        options={({ navigation }) => ({
          title: 'หมวดหมู่',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('PostRecipe')} 
              style={{ marginRight: 15 }}
            >
              <Ionicons name="add-circle-outline" size={28} color="tomato" />
            </TouchableOpacity>
          ),
        })} 
      />
      <Stack.Screen name="MenuList" component={MenuListScreen} options={({ route }) => ({ title: route.params.title })} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'สูตรและวิธีทำ' }} />
      <Stack.Screen name="PostRecipe" component={PostRecipeScreen} options={{ title: 'โพสต์สูตรอาหาร' }} />
      <Stack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ title: 'แก้ไขสูตรอาหาร' }} />
    </Stack.Navigator>
  );
}

// --- (ProfileStackScreen) ---
function ProfileStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'โปรไฟล์' }} />
      <Stack.Screen name="MyRecipes" component={MyRecipesScreen} options={{ title: 'สูตรของฉัน' }} />
    </Stack.Navigator>
  );
}

// 3. ⭐️ สร้าง Component "แท็บหลัก" (หน้าแอปเมื่อ Login แล้ว) ⭐️
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeStack') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'ProfileStack') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStackScreen} options={{ title: 'หน้าหลัก', headerShown: false }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'ของโปรด' }} />
      <Tab.Screen name="ProfileStack" component={ProfileStackScreen} options={{ title: 'โปรไฟล์', headerShown: false }} />
    </Tab.Navigator>
  );
}

// 4. ⭐️ นี่คือ Component หลัก (ตัวสลับ) ⭐️
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  // 7. ⭐️ useEffect นี้จะทำงาน "ครั้งเดียว" ตอนเปิดแอป ⭐️
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // No expo-splash-screen; show custom splash once when loading completes

  // 11. ⭐️ ถ้ากำลังเช็ค (loading) ให้แสดงวงกลมหมุนๆ ⭐️
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  // Show custom splash once after native splash hides
  if (showIntro) {
    return <CustomSplash onFinish={() => setShowIntro(false)} />;
  }

  // 12. ⭐️ นี่คือ "ตัวสลับ" หลัก ⭐️
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // 13. ⭐️ ถ้า Login แล้ว -> ไปหน้าแอปหลัก (MainTabs)
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          // 14. ⭐️ ถ้ายังไม่ Login -> ไปหน้า Auth
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
