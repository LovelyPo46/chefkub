import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth'; // 1. ⭐️ เปลี่ยนเป็น signIn

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันสำหรับเข้าสู่ระบบ
  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('ผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      // 2. ⭐️ เรียกใช้ฟังก์ชัน signIn
      await signInWithEmailAndPassword(auth, email, password);
      // (เมื่อสำเร็จ onAuthStateChanged ใน App.js จะทำงาน)
    } catch (error) {
      Alert.alert('เข้าสู่ระบบผิดพลาด', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>ยินดีต้อนรับกลับ!</Text>

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
          placeholder="รหัสผ่าน"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" color="tomato" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => navigation.navigate('Register')} // 3. ⭐️ ปุ่มสลับไปหน้า Register
        >
          <Text style={styles.switchButtonText}>ยังไม่มีบัญชี? สร้างบัญชีใหม่</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// (Styles ทั้งหมดเหมือน RegisterScreen.js)
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