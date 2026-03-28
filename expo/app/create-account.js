import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Eye, EyeOff } from 'lucide-react-native';

export default function CreateAccountScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = useMemo(() => {
    return phone.trim().length >= 7 && password.length >= 6 && confirm === password;
  }, [phone, password, confirm]);

  const onNext = useCallback(async () => {
    try {
      console.log('[CreateAccount] onNext tapped');
      if (!isValid) {
        Alert.alert('Incomplete', 'Please fill all fields correctly.');
        return;
      }
      setLoading(true);
      const payload = { phone: phone.trim(), password };
      await AsyncStorage.setItem('pendingSignup', JSON.stringify(payload));
      await AsyncStorage.setItem('signupOtp', JSON.stringify({ phone: payload.phone, code: '000000', createdAt: new Date().toISOString() }));
      setLoading(false);
      router.push('/verify-otp');
    } catch (e) {
      console.log('[CreateAccount] onNext error', e);
      setLoading(false);
      Alert.alert('Error', 'Could not continue. Please try again.');
    }
  }, [isValid, phone, password]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container} testID="createAccountScreen">
          <Stack.Screen options={{ headerShown: false }} />

          <View style={styles.bgWrap} pointerEvents="none">
            <Image source={{ uri: 'https://r2-pub.rork.com/attachments/yztqb8hpvcrzl97rpj5mq' }} style={styles.bgTopLeft} resizeMode="cover" />
            <Image source={{ uri: 'https://r2-pub.rork.com/attachments/jceo6xgtlvsynbr7ci89f' }} style={styles.bgTopRight} resizeMode="cover" />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Create{"\n"}Account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputRow}>
              <View style={styles.flagBox}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w20/sl.png' }}
                  style={styles.flag}
                />
                <Text style={styles.dropdownCaret}>▾</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Your number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={20}
                testID="phoneInput"
              />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!show1}
                testID="passwordInput"
              />
              <TouchableOpacity onPress={() => setShow1(v => !v)} accessibilityRole="button" testID="togglePass1">
                {show1 ? <EyeOff color="#7a7a7a" /> : <Eye color="#7a7a7a" />} 
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!show2}
                testID="confirmInput"
              />
              <TouchableOpacity onPress={() => setShow2(v => !v)} accessibilityRole="button" testID="togglePass2">
                {show2 ? <EyeOff color="#7a7a7a" /> : <Eye color="#7a7a7a" />} 
              </TouchableOpacity>
            </View>

            <View style={styles.dots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { opacity: isValid && !loading ? 1 : 0.5 }]}
              disabled={!isValid || loading}
              onPress={onNext}
              testID="nextBtn"
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Next</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" testID="cancelCreate">
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 24, paddingHorizontal: 20 },
  bgWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  bgTopLeft: { position: 'absolute', top: 0, left: 0, width: 220, height: 220, opacity: 0.2, borderBottomRightRadius: 120 },
  bgTopRight: { position: 'absolute', top: -10, right: -30, width: 200, height: 220, opacity: 0.9, borderBottomLeftRadius: 120 },
  header: { marginTop: 48 },
  title: { fontSize: 36, fontWeight: '800', color: '#111' },
  form: { marginTop: 24 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f7',
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 14,
  },
  flagBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  flag: { width: 20, height: 14, borderRadius: 2 },
  dropdownCaret: { color: '#777' },
  input: { flex: 1, fontSize: 16 },
  dots: { flexDirection: 'row', gap: 8, alignSelf: 'center', marginVertical: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e6ecff' },
  dotActive: { backgroundColor: '#0A63FF' },
  primaryBtn: { backgroundColor: '#F0730A', height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', marginTop: 18, color: '#333', fontSize: 16 },
});