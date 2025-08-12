import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyOtpScreen() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);

  useEffect(() => {
    setTimeout(() => refs.current[0]?.focus?.(), 150);
  }, []);

  const onChange = (i, t) => {
    const val = String(t || '').replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus?.();
  };

  const onVerify = useCallback(async () => {
    try {
      const code = digits.join('');
      const stored = await AsyncStorage.getItem('signupOtp');
      const obj = stored ? JSON.parse(stored) : null;
      if (!obj) {
        Alert.alert('Error', 'OTP not found.');
        return;
      }
      if (code !== '000000') {
        Alert.alert('Invalid', 'Please check the code and try again.');
        return;
      }
      const pending = await AsyncStorage.getItem('pendingSignup');
      if (pending) {
        const p = JSON.parse(pending);
        const userData = { name: '', phone: p.phone, password: p.password, isVerified: true };
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
      await AsyncStorage.setItem('isLoggedIn', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      console.log('[VerifyOtp] error', e);
      Alert.alert('Error', 'Could not verify.');
    }
  }, [digits]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container} testID="verifyOtpScreen">
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.bgWrap} pointerEvents="none">
          <Image source={{ uri: 'https://r2-pub.rork.com/attachments/yztqb8hpvcrzl97rpj5mq' }} style={styles.bgTopLeft} resizeMode="cover" />
          <Image source={{ uri: 'https://r2-pub.rork.com/attachments/jceo6xgtlvsynbr7ci89f' }} style={styles.bgTopRight} resizeMode="cover" />
        </View>

        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>Enter the 6 digit code sent to your number.</Text>

        <View style={styles.otpRow}>
          {[0,1,2,3,4,5].map(i => (
            <TextInput
              key={i}
              ref={(r) => { refs.current[i] = r; }}
              style={styles.otpBox}
              maxLength={1}
              keyboardType="number-pad"
              onChangeText={(t) => onChange(i, t)}
              value={digits[i]}
              testID={`otp-${i}`}
            />
          ))}
        </View>

        <Text style={styles.resend}>Resend OTP in 00:29</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={onVerify} testID="verifyBtn">
          <Text style={styles.primaryText}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 24, paddingHorizontal: 20, alignItems: 'center' },
  bgWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  bgTopLeft: { position: 'absolute', top: 0, left: 0, width: 220, height: 220, opacity: 0.2, borderBottomRightRadius: 120 },
  bgTopRight: { position: 'absolute', top: -10, right: -30, width: 200, height: 220, opacity: 0.9, borderBottomLeftRadius: 120 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', alignSelf: 'flex-start', marginTop: 24 },
  subtitle: { fontSize: 16, color: '#333', alignSelf: 'flex-start', marginTop: 8 },
  otpRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  otpBox: { width: 50, height: 56, borderRadius: 8, borderColor: '#d1d5db', borderWidth: 1, textAlign: 'center', fontSize: 20, backgroundColor: '#fff' },
  resend: { alignSelf: 'flex-start', marginTop: 24, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#F0730A', height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 24 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', marginTop: 18, color: '#333', fontSize: 16 },
});