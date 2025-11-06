import React, { useEffect } from 'react';
// ลบ Text ออกจาก import
import { View, Image, StyleSheet } from 'react-native';

export default function CustomSplash({ onFinish, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish && onFinish();
    }, duration);
    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  return (
    <View style={styles.container}>
      {/* โลโก้ Chefkub แสดงนิ่งๆ */}
      <Image
        source={require('../assets/logo.png')} // ตรวจสอบ path ของรูปโลโก้
        style={styles.logo}
        resizeMode="contain"
      />
      {/* ลบ Text (ชื่อแอป) ออกไปแล้ว */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff', // พื้นหลังสีขาว
  },
  logo: {
    width: 160,
    height: 160,
  },
  // ลบ styles.title ที่ไม่จำเป็นต้องใช้ออกไปแล้ว
});