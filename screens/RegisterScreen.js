import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันสำหรับลงทะเบียน
  const handleRegister = async () => {
    if (email === '' || password === '') {
      Alert.alert('ผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      // 1. สร้างผู้ใช้ใหม่ใน Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);
      // (เมื่อสำเร็จ onAuthStateChanged ใน App.js จะทำงานอัตโนมัติ)
    } catch (error) {
      // 2. แสดง Error
      Alert.alert('ลงทะเบียนผิดพลาด', error.message);
      setLoading(false);
    }
    // (เราไม่ต้อง setLoading(false) ตอนสำเร็จ เพราะ App.js จะสลับหน้าไปแล้ว)
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>สร้างบัญชีใหม่</Text>

        <TextInput
          style={styles.input}
          placeholder="อีเมล"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // ⭐️ ซ่อนรหัสผ่าน
        />

        {loading ? (
          <ActivityIndicator size="large" color="tomato" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>ลงทะเบียน</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => navigation.navigate('Login')} // 3. ปุ่มสลับไปหน้า Login
        >
          <Text style={styles.switchButtonText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// (Styles ทั้งหมด)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: 'tomato',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchButtonText: {
    color: 'tomato',
    fontSize: 14,
  }
});