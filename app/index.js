import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { StatusBar } from 'expo-status-bar';
import { Lock, User, Phone, Eye, EyeOff, Fingerprint } from 'lucide-react-native';
import { router } from 'expo-router';

// Authentication + Onboarding Screen Component
export default function AuthScreen() {
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef(null);
  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // State to track auth screen (login, register)
  const [currentScreen, setCurrentScreen] = useState('login');
  
  // User data states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Biometric authentication states
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  
  // Form validation states
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Check onboarding + auth state
  useEffect(() => {
    (async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const onboardingDone = await AsyncStorage.getItem('onboardingDone');
        const justLoggedOut = await AsyncStorage.getItem('justLoggedOut');
        setShowOnboarding(onboardingDone !== 'true');
        
        if (justLoggedOut === 'true') {
          await AsyncStorage.removeItem('justLoggedOut');
          setShowOnboarding(false);
        }
        
        if (userData && isLoggedIn === 'true') {
          router.replace('/(tabs)');
          return;
        }
        
        // Check biometric support and settings
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricSupported(compatible);
        
        const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
        if (biometricEnabled === 'true') {
          setIsBiometricEnabled(true);
        }
      } catch (error) {
        console.log('Error checking auth status:', error);
      }
    })();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingDone', 'true');
      setShowOnboarding(false);
    } catch (e) {
      console.log('completeOnboarding error', e);
      setShowOnboarding(false);
    }
  };

  const handleNextSlide = () => {
    try {
      const next = activeSlide + 1;
      if (next < 3 && sliderRef.current && sliderRef.current.scrollTo) {
        sliderRef.current.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        setActiveSlide(next);
      } else {
        completeOnboarding();
      }
    } catch (e) {
      console.log('handleNextSlide error', e);
      completeOnboarding();
    }
  };

  const onScrollSlides = (e) => {
    const x = e?.nativeEvent?.contentOffset?.x ?? 0;
    const idx = Math.round(x / SCREEN_WIDTH);
    if (!Number.isNaN(idx)) setActiveSlide(idx);
  };

  const sendSignupOtp = async (targetPhone) => {
    try {
      const code = '000000';
      setGeneratedOtp(code);
      await AsyncStorage.setItem('signupOtp', JSON.stringify({ phone: targetPhone, code, createdAt: new Date().toISOString() }));
      setShowOtpModal(true);
      Alert.alert('OTP Sent', `Enter the OTP sent to ${targetPhone}. For demo: ${code}`);
    } catch (e) {
      console.log('sendSignupOtp error', e);
    }
  };

  const handleRegister = async () => {
    setNameError('');
    setPhoneError('');
    setPasswordError('');
    let isValid = true;
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else {
      if (phone.length !== 12) {
        setPhoneError(`Please enter exactly 12 characters (current: ${phone.length})`);
        isValid = false;
      }
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    if (!isValid) return;
    setIsLoading(true);
    try {
      const userData = {
        name: name.trim(),
        phone: phone.trim(),
        password: password,
        isVerified: false,
      };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setIsLoading(false);
      await sendSignupOtp(userData.phone);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Registration Failed', 'An error occurred during registration.');
      console.log('Registration error:', error);
    }
  };

  const handleLogin = async () => {
    setPhoneError('');
    setPasswordError('');
    let isValid = true;
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }
    if (!isValid) return;
    setIsLoading(true);
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        if (userData.phone === phone.trim() && userData.password === password) {
          if (!userData.isVerified) {
            setIsLoading(false);
            await sendSignupOtp(userData.phone);
            Alert.alert('Verification Required', 'Please verify your account to continue.');
            return;
          }
          await AsyncStorage.setItem('isLoggedIn', 'true');
          setIsLoading(false);
          router.replace('/(tabs)');
        } else {
          setIsLoading(false);
          Alert.alert('Login Failed', 'Invalid phone number or password.');
        }
      } else {
        setIsLoading(false);
        Alert.alert('Login Failed', 'No user found. Please register first.');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Login Failed', 'An error occurred during login.');
      console.log('Login error:', error);
    }
  };

  // Function to handle biometric authentication
  const handleBiometricAuth = async () => {
    if (!isBiometricSupported) {
      Alert.alert('Not Supported', 'Biometric authentication is not supported on this device.');
      return;
    }
    
    try {
      // Check if user has enrolled biometrics
      const biometricRecords = await LocalAuthentication.isEnrolledAsync();
      if (!biometricRecords) {
        Alert.alert('Not Enrolled', 'No biometrics found. Please set up biometrics in your device settings.');
        return;
      }
      
      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access MegaSafe',
        fallbackLabel: 'Use password',
      });
      
      if (result.success) {
        // Retrieve stored user data
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          await AsyncStorage.setItem('isLoggedIn', 'true');
          // Navigate to tabs
          router.replace('/(tabs)');
        } else {
          Alert.alert('Login Failed', 'No user found. Please register first.');
        }
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during biometric authentication.');
      console.log('Biometric auth error:', error);
    }
  };

  // Render Login Screen
  const renderLoginScreen = () => {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://r2-pub.rork.com/attachments/mpxwld4hth7tk8rr32ccb' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.appName}>MegaSafe</Text>
            <Text style={styles.tagline}>Secure. Simple. Safe.</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Phone color="#5CCEF4" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={(text) => {
                  // Allow digits and special characters like +
                  setPhone(text);
                }}
                keyboardType="phone-pad"
                maxLength={12}
                testID="phoneInput"
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            
            <View style={styles.inputContainer}>
              <Lock color="#5CCEF4" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="passwordInput"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff color="#5CCEF4" size={20} /> : 
                  <Eye color="#5CCEF4" size={20} />
                }
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={isLoading}
              testID="loginButton"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            {isBiometricSupported && isBiometricEnabled && (
              <TouchableOpacity 
                style={styles.biometricButton} 
                onPress={handleBiometricAuth}
              >
                <Fingerprint color="#FFA500" size={24} />
                <Text style={styles.biometricText}>Login with Biometrics</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => setCurrentScreen('register')}>
                <Text style={styles.switchButton}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // Render Registration Screen
  const renderRegisterScreen = () => {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://r2-pub.rork.com/attachments/mpxwld4hth7tk8rr32ccb' }} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.appName}>MegaSafe</Text>
            <Text style={styles.tagline}>Create your secure account</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <User color="#5CCEF4" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                testID="nameInput"
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            
            <View style={styles.inputContainer}>
              <Phone color="#5CCEF4" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (12 characters)"
                value={phone}
                onChangeText={(text) => {
                  // Allow digits and special characters like +
                  setPhone(text);
                }}
                keyboardType="phone-pad"
                maxLength={12}
                testID="phoneInput"
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            
            <View style={styles.inputContainer}>
              <Lock color="#5CCEF4" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="passwordInput"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff color="#5CCEF4" size={20} /> : 
                  <Eye color="#5CCEF4" size={20} />
                }
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleRegister}
              disabled={isLoading}
              testID="registerButton"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => setCurrentScreen('login')}>
                <Text style={styles.switchButton}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  useEffect(() => {
    if (showOtpModal) {
      setOtpDigits(['', '', '', '', '', '']);
      setOtpInput('');
      setTimeout(() => {
        if (otpRefs.current && otpRefs.current[0] && otpRefs.current[0].focus) {
          otpRefs.current[0].focus();
        }
      }, 150);
    }
  }, [showOtpModal]);

  const handleOtpChange = (index, text) => {
    const clean = String(text || '').replace(/[^0-9]/g, '');
    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split('');
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (typeof arr[i] !== 'undefined') next[i] = arr[i];
      }
      setOtpDigits(next);
      setOtpInput(next.join(''));
      const last = Math.min(5, index + arr.length);
      setTimeout(() => { otpRefs.current[Math.min(5, last)]?.focus && otpRefs.current[Math.min(5, last)]?.focus(); }, 0);
      return;
    }
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    setOtpInput(next.join(''));
    if (clean && index < 5) {
      setTimeout(() => { otpRefs.current[index + 1]?.focus && otpRefs.current[index + 1]?.focus(); }, 0);
    }
  };

  const handleOtpKeyPress = (index, e) => {
    if (e?.nativeEvent?.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus && otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    try {
      const inputCode = (otpDigits.join('') || otpInput).trim();
      const expected = generatedOtp || '000000';
      if (inputCode === expected) {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) {
          const obj = JSON.parse(stored);
          obj.isVerified = true;
          await AsyncStorage.setItem('userData', JSON.stringify(obj));
        }
        setShowOtpModal(false);
        setOtpInput('');
        setOtpDigits(['', '', '', '', '', '']);
        Alert.alert('Verified', 'Your account has been verified. Please log in.');
        setCurrentScreen('login');
      } else {
        Alert.alert('Invalid OTP', 'Please check the code and try again.');
      }
    } catch (e) {
      console.log('verifyOtp error', e);
    }
  };

  return (
    <>
      <StatusBar style="auto" />

      {showOnboarding ? (
        <View style={styles.onboardingContainer} testID="onboarding">
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollSlides}
            scrollEventThrottle={16}
          >
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}> 
              <Image source={{ uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop' }} style={styles.slideImage} />
              <Text style={styles.slideTitle}>Welcome to MegaSafe</Text>
              <Text style={styles.slideText}>Save, borrow, and pay securely across your Osusu groups.</Text>
            </View>
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}> 
              <Image source={{ uri: 'https://images.unsplash.com/photo-1556741533-f6acd6478e6a?q=80&w=1200&auto=format&fit=crop' }} style={styles.slideImage} />
              <Text style={styles.slideTitle}>Transparent by Design</Text>
              <Text style={styles.slideText}>Track contributions and loans with receipts and audit trail.</Text>
            </View>
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}> 
              <Image source={{ uri: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1200&auto=format&fit=crop' }} style={styles.slideImage} />
              <Text style={styles.slideTitle}>Connected Payments</Text>
              <Text style={styles.slideText}>Mobile money and bank transfers—unified in one wallet.</Text>
            </View>
          </ScrollView>
          <View style={styles.dotsRow}>
            {[0,1,2].map(i => (
              <View key={i} style={[styles.dot, activeSlide === i ? styles.dotActive : null]} />
            ))}
          </View>
          <View style={styles.onboardingActions}>
            <TouchableOpacity onPress={completeOnboarding} style={styles.skipBtn} testID="skipOnboarding">
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextSlide} style={styles.nextBtn} testID="nextOnboarding">
              <Text style={styles.nextText}>{activeSlide === 2 ? 'Get Started' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {currentScreen === 'login' && renderLoginScreen()}
          {currentScreen === 'register' && renderRegisterScreen()}
        </>
      )}

      <Modal visible={showOtpModal} transparent animationType="fade" onRequestClose={() => setShowOtpModal(false)}>
        <View style={styles.otpModalOverlay}>
          <View style={styles.otpModalContent}>
            <Text style={styles.otpModalTitle}>Verify OTP</Text>
            <View style={styles.otpBoxesRow}>
              {[0,1,2,3,4,5].map((i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={styles.otpDigitInput}
                  value={otpDigits[i]}
                  onChangeText={(t) => handleOtpChange(i, t)}
                  onKeyPress={(e) => handleOtpKeyPress(i, e)}
                  keyboardType="number-pad"
                  maxLength={1}
                  testID={`otpBox-${i}`}
                  returnKeyType="next"
                />
              ))}
            </View>
            <View style={styles.otpActions}>
              <TouchableOpacity style={styles.otpCancelButton} onPress={() => { setShowOtpModal(false); setOtpInput(''); setOtpDigits(['', '', '', '', '', '']); }} testID="otpCancelBtn">
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.otpVerifyButton} onPress={verifyOtp} testID="verifyOtpBtn">
                <Text style={styles.otpVerifyText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#5CCEF4',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#FFA500',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
  },
  biometricText: {
    color: '#FFA500',
    fontSize: 16,
    marginLeft: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  switchButton: {
    color: '#5CCEF4',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  otpModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  otpModalContent: { width: '85%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  otpModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  otpActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  otpCancelButton: { flex: 1, backgroundColor: '#FFA500', borderRadius: 8, height: 48, alignItems: 'center', justifyContent: 'center' },
  otpCancelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  otpVerifyButton: { flex: 2, backgroundColor: '#2563eb', borderRadius: 8, height: 48, alignItems: 'center', justifyContent: 'center' },
  otpVerifyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  otpBoxesRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  otpDigitInput: { width: 48, height: 48, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, textAlign: 'center', fontSize: 18, backgroundColor: '#f9fafb' },

  onboardingContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  slideImage: { width: '100%', height: 260, borderRadius: 16, marginBottom: 24 },
  slideTitle: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 8, textAlign: 'center' },
  slideText: { fontSize: 16, color: '#555', textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  dotActive: { backgroundColor: '#FFA500', width: 16 },
  onboardingActions: { flexDirection: 'row', width: '85%', maxWidth: 380, gap: 12, marginTop: 16 },
  skipBtn: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#eee', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  skipText: { color: '#666', fontSize: 16, fontWeight: '600' },
  nextBtn: { flex: 2, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFA500' },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});