import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import {
  User,
  Edit3,
  Camera,
  ShieldCheck,
  Shield,
  LogOut,
  Gift,
  BookUser,
  Contact,
  Mail,
  Phone as PhoneIcon,
  HelpCircle,
  RefreshCw,
  Check,
  X,
  Wallet,
  Banknote,
  CreditCard,
  Link as LinkIcon,
  Copy,
  Share2,
  ArrowLeft,
  ChevronRight,
  CircuitBoard,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';

export default function ProfileScreen() {
  const [screen, setScreen] = useState('overview');

  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState({ name: '', phone: '' });
  const [profilePhoto, setProfilePhoto] = useState('');

  const [nin, setNin] = useState('');
  const [ninVerified, setNinVerified] = useState(false);

  const [nokName, setNokName] = useState('');
  const [nokRelationship, setNokRelationship] = useState('Sibling');
  const [nokPhone, setNokPhone] = useState('');
  const [nokAddress, setNokAddress] = useState('');

  const defaultQ1 = 'What is the name of your first school?';
  const defaultQ2 = 'What city were you born in?';
  const defaultQ3 = 'What is your favorite childhood nickname?';
  const [secQ1, setSecQ1] = useState(defaultQ1);
  const [secQ2, setSecQ2] = useState(defaultQ2);
  const [secQ3, setSecQ3] = useState(defaultQ3);
  const [secA1, setSecA1] = useState('');
  const [secA2, setSecA2] = useState('');
  const [secA3, setSecA3] = useState('');

  const [linkedWallets, setLinkedWallets] = useState([]);
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [chainLedger, setChainLedger] = useState([]);

  const [showQuestionPicker, setShowQuestionPicker] = useState({ which: 0, visible: false });
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [walletInput, setWalletInput] = useState('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankAcctNameInput, setBankAcctNameInput] = useState('');
  const [bankAcctNumberInput, setBankAcctNumberInput] = useState('');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payNoteInput, setPayNoteInput] = useState('');
  const [payMethodInput, setPayMethodInput] = useState('Orange Money');
  const [payCategoryInput, setPayCategoryInput] = useState('Osusu Group');
  const [payDate, setPayDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [reportStart, setReportStart] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [reportEnd, setReportEnd] = useState(new Date());
  const [showReportStartPicker, setShowReportStartPicker] = useState(false);
  const [showReportEndPicker, setShowReportEndPicker] = useState(false);

  const [mmProvider, setMmProvider] = useState('Orange Money');
  const [mmNumber, setMmNumber] = useState('');

  const [showLinkOtpModal, setShowLinkOtpModal] = useState(false);
  const [linkOtpGenerated, setLinkOtpGenerated] = useState('');
  const [linkOtpInput, setLinkOtpInput] = useState('');
  const [linkContext, setLinkContext] = useState({ type: '', payload: {} });
  const [linkOtpDigits, setLinkOtpDigits] = useState(['', '', '', '', '', '']);
  const linkOtpRefs = useRef([]);

  const [docType, setDocType] = useState('id');
  const [idFrontUri, setIdFrontUri] = useState('');
  const [idBackUri, setIdBackUri] = useState('');
  const [passportUri, setPassportUri] = useState('');

  const providerOptions = ['Orange Money', 'Africell Money', 'Qcell Money'];
  const payMethodOptions = ['Orange Money', 'Africell Money', 'Qcell Money', 'Bank'];
  const payCategoryOptions = ['Osusu Group', 'Loan', 'Bank Transfer', 'Mobile Money'];

  const questionBank = [
    'What is the name of your first school?',
    'What city were you born in?',
    'What is your favorite childhood nickname?',
    "What is your mother's maiden name?",
    'What is the title of your favorite book?',
    'What is the name of your first pet?',
  ];

  useEffect(() => {
    (async () => {
      console.log('[Profile] Loading stored data...');
      try {
        const [storedUser, photo, storedNin, storedNinVerified, nok, sqa, wallets, banks, pay, mm, docs] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('profilePhoto'),
          AsyncStorage.getItem('ninNumber'),
          AsyncStorage.getItem('ninVerified'),
          AsyncStorage.getItem('nextOfKin'),
          AsyncStorage.getItem('securityQA'),
          AsyncStorage.getItem('linkedWallets'),
          AsyncStorage.getItem('linkedBanks'),
          AsyncStorage.getItem('payments'),
          AsyncStorage.getItem('mobileMoney'),
          AsyncStorage.getItem('identityDocs'),
        ]);
        if (storedUser) setUserData(JSON.parse(storedUser));
        if (photo) setProfilePhoto(photo);
        if (storedNin) setNin(storedNin);
        if (storedNinVerified === 'true') setNinVerified(true);
        if (nok) {
          const obj = JSON.parse(nok);
          setNokName(obj.name || '');
          setNokRelationship(obj.relationship || 'Sibling');
          setNokPhone(obj.phone || '');
          setNokAddress(obj.address || '');
        }
        if (sqa) {
          const obj = JSON.parse(sqa);
          setSecQ1(obj.q1 || defaultQ1);
          setSecQ2(obj.q2 || defaultQ2);
          setSecQ3(obj.q3 || defaultQ3);
          setSecA1(obj.a1 || '');
          setSecA2(obj.a2 || '');
          setSecA3(obj.a3 || '');
        }
        if (wallets) setLinkedWallets(JSON.parse(wallets));
        if (banks) setLinkedBanks(JSON.parse(banks));
        if (pay) setPayments(JSON.parse(pay));
        if (mm) {
          try {
            const obj = JSON.parse(mm);
            setMmProvider(obj.provider || 'Orange Money');
            setMmNumber(obj.number || '');
          } catch {}
        }
        if (docs) {
          try {
            const obj = JSON.parse(docs);
            setDocType(obj.type || 'id');
            setIdFrontUri(obj.idFrontUri || '');
            setIdBackUri(obj.idBackUri || '');
            setPassportUri(obj.passportUri || '');
          } catch {}
        }
      } catch (err) {
        console.log('[Profile] Failed to load data', err);
      }
    })();
  }, []);

  const params = useLocalSearchParams();
  useEffect(() => {
    try { if (params && params.to === 'chain') setScreen('chain'); } catch {}
  }, [params?.to]);

  const loadLedger = useCallback(async () => {
    try {
      const lg = await AsyncStorage.getItem('loanLedger');
      setChainLedger(lg ? JSON.parse(lg) : []);
    } catch (e) {
      console.log('[Profile] load ledger error', e);
      setChainLedger([]);
    }
  }, []);

  useEffect(() => {
    if (screen === 'chain') loadLedger();
  }, [screen, loadLedger]);

  const trustScore = useMemo(() => {
    let score = 0;
    if (userData.name && userData.phone) score += 20;
    if (profilePhoto) score += 10;
    if (nin && ninVerified) score += 25;
    if (nokName && nokPhone) score += 15;
    if (secA1 && secA2 && secA3) score += 20;
    if (linkedWallets.length > 0 || linkedBanks.length > 0) score += 10;
    if ((idFrontUri && idBackUri) || passportUri) score += 20;
    if (mmNumber) score += 10;
    return Math.min(score, 100);
  }, [userData, profilePhoto, nin, ninVerified, nokName, nokPhone, secA1, secA2, secA3, linkedWallets, linkedBanks, idFrontUri, idBackUri, passportUri, mmNumber]);

  const versionLabel = useMemo(() => {
    try {
      const v = Constants.expoConfig?.version || '1.0.0';
      return `App Version ${v}`;
    } catch (e) {
      return 'App Version 1.0.0';
    }
  }, []);

  const formatCurrency = useCallback((amount) => {
    try {
      return `NLe ${new Intl.NumberFormat('en-SL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)}`;
    } catch {
      return `NLe ${amount}`;
    }
  }, []);

  const maskPhone = (p) => (p ? `${p.slice(0, 4)}****${p.slice(-2)}` : '');
  const maskAcct = (n) => (n && n.length > 4 ? `${'*'.repeat(Math.max(0, n.length - 4))}${n.slice(-4)}` : n);
  const maskAddress = (a) => (a && a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a);

  const pickImage = useCallback(async () => {
    console.log('[Profile] pickImage tapped');
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'We need access to your photos to update your profile picture.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri || '';
        if (uri) {
          await AsyncStorage.setItem('profilePhoto', uri);
          setProfilePhoto(uri);
          Alert.alert('Updated', 'Profile picture updated successfully.');
        }
      }
    } catch (e) {
      console.log('[Profile] pickImage error', e);
      Alert.alert('Error', 'Failed to change profile picture.');
    }
  }, []);

  const handleSaveProfile = useCallback(async () => {
    console.log('[Profile] Saving profile details', userData);
    if (!userData.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    if (!userData.phone.trim() || userData.phone.trim().length !== 12) {
      Alert.alert('Validation', 'Phone must be exactly 12 characters');
      return;
    }
    try {
      await AsyncStorage.setItem('userData', JSON.stringify({
        name: userData.name.trim(),
        phone: userData.phone.trim(),
      }));
      Alert.alert('Saved', 'Profile details updated');
      setScreen('overview');
    } catch (e) {
      console.log('[Profile] Save profile error', e);
      Alert.alert('Error', 'Failed to save profile');
    }
  }, [userData]);

  const handleSaveNIN = useCallback(async () => {
    console.log('[Profile] Saving NIN');
    const trimmed = nin.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'NIN is required');
      return;
    }
    if (!/^[A-Za-z0-9]{8}$/.test(trimmed)) {
      Alert.alert('Validation', 'NIN must be exactly 8 letters or digits (no spaces or symbols)');
      return;
    }
    try {
      await AsyncStorage.setItem('ninNumber', trimmed);
      await AsyncStorage.setItem('ninVerified', 'true');
      setNinVerified(true);
      Alert.alert('NIN Registered', 'Your NIN has been saved and verified.');
      setScreen('overview');
    } catch (e) {
      console.log('[Profile] Save NIN error', e);
      Alert.alert('Error', 'Failed to save NIN');
    }
  }, [nin]);

  const handleSaveNOK = useCallback(async () => {
    console.log('[Profile] Saving Next of Kin');
    if (!nokName.trim()) return Alert.alert('Validation', 'Name is required');
    if (!nokPhone.trim() || nokPhone.trim().length !== 12) return Alert.alert('Validation', 'Phone must be exactly 12 characters');
    try {
      const data = { name: nokName.trim(), relationship: nokRelationship, phone: nokPhone.trim(), address: nokAddress.trim() };
      await AsyncStorage.setItem('nextOfKin', JSON.stringify(data));
      Alert.alert('Saved', 'Next of Kin details updated');
      setScreen('overview');
    } catch (e) {
      console.log('[Profile] Save NOK error', e);
      Alert.alert('Error', 'Failed to save Next of Kin');
    }
  }, [nokName, nokRelationship, nokPhone, nokAddress]);

  const handleSaveSecurity = useCallback(async () => {
    console.log('[Profile] Saving security questions');
    if (!secA1.trim() || !secA2.trim() || !secA3.trim()) {
      Alert.alert('Validation', 'Please answer all three security questions');
      return;
    }
    try {
      const data = { q1: secQ1, a1: secA1.trim(), q2: secQ2, a2: secA2.trim(), q3: secQ3, a3: secA3.trim() };
      await AsyncStorage.setItem('securityQA', JSON.stringify(data));
      Alert.alert('Saved', 'Security questions saved');
      setScreen('overview');
    } catch (e) {
      console.log('[Profile] Save security error', e);
      Alert.alert('Error', 'Failed to save security questions');
    }
  }, [secQ1, secA1, secQ2, secA2, secQ3, secA3]);

  const handleConfirmAddWallet = useCallback(async () => {
    const trimmed = walletInput.trim();
    if (!trimmed || trimmed.length < 10) return Alert.alert('Invalid', 'Enter a valid wallet address');
    try {
      const updated = [...linkedWallets, { id: Date.now().toString(), address: trimmed }];
      await AsyncStorage.setItem('linkedWallets', JSON.stringify(updated));
      setLinkedWallets(updated);
      setWalletInput('');
      setShowAddWalletModal(false);
      Alert.alert('Added', 'Wallet linked');
    } catch (e) {
      console.log('[Profile] Add wallet error', e);
      Alert.alert('Error', 'Failed to add wallet');
    }
  }, [walletInput, linkedWallets]);

  const sendLinkOtp = useCallback(async (type, payload) => {
    try {
      const code = '000000';
      setLinkOtpGenerated(code);
      setLinkContext({ type, payload });
      await AsyncStorage.setItem('linkingOtp', JSON.stringify({ type, code, createdAt: new Date().toISOString() }));
      setShowLinkOtpModal(true);
      Alert.alert('OTP Sent', `Enter the OTP to verify linking. For demo: ${code}`);
    } catch (e) {
      console.log('[Profile] sendLinkOtp error', e);
    }
  }, []);

  useEffect(() => {
    if (showLinkOtpModal) {
      setLinkOtpDigits(['', '', '', '', '', '']);
      setLinkOtpInput('');
      setTimeout(() => {
        if (linkOtpRefs.current && linkOtpRefs.current[0] && linkOtpRefs.current[0].focus) {
          linkOtpRefs.current[0].focus();
        }
      }, 150);
    }
  }, [showLinkOtpModal]);

  const handleConfirmAddBank = useCallback(async () => {
    if (!bankNameInput.trim() || !bankAcctNameInput.trim() || !bankAcctNumberInput.trim()) return Alert.alert('Invalid', 'Fill all fields');
    await sendLinkOtp('bank', { bank: bankNameInput.trim(), name: bankAcctNameInput.trim(), number: bankAcctNumberInput.trim() });
  }, [bankNameInput, bankAcctNameInput, bankAcctNumberInput, sendLinkOtp]);

  const handleConfirmAddPayment = useCallback(async () => {
    if (!payAmountInput.trim() || isNaN(parseFloat(payAmountInput))) return Alert.alert('Invalid', 'Enter a valid amount');
    try {
      const entry = { id: Date.now().toString(), amount: parseFloat(payAmountInput), note: payNoteInput.trim() || 'Payment', date: payDate.toISOString(), method: payMethodInput, category: payCategoryInput, receipt: `RCPT-${Date.now()}` };
      const updated = [...payments, entry];
      await AsyncStorage.setItem('payments', JSON.stringify(updated));
      setPayments(updated);
      setPayAmountInput('');
      setPayNoteInput('');
      setPayMethodInput('Orange Money');
      setPayCategoryInput('Osusu Group');
      setPayDate(new Date());
      setShowAddPaymentModal(false);
      Alert.alert('Saved', 'Payment recorded');
    } catch (e) {
      console.log('[Profile] Add payment error', e);
      Alert.alert('Error', 'Failed to add payment');
    }
  }, [payAmountInput, payNoteInput, payDate, payMethodInput, payCategoryInput, payments]);

  const handleSavePaymentMethod = useCallback(async () => {
    const trimmed = mmNumber.trim();
    const regex = /^\+\d{11}$/;
    if (!regex.test(trimmed)) {
      Alert.alert('Invalid', 'Mobile Money number must be 12 characters and start with +');
      return;
    }
    await sendLinkOtp('mm', { provider: mmProvider, number: trimmed });
  }, [mmProvider, mmNumber, sendLinkOtp]);

  const pickDocImage = useCallback(async (which) => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'We need access to your photos to upload your document.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri || '';
        if (!uri) return;
        if (which === 'front') setIdFrontUri(uri);
        if (which === 'back') setIdBackUri(uri);
        if (which === 'passport') setPassportUri(uri);
      }
    } catch (e) {
      console.log('[Profile] pickDocImage error', e);
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const handleSaveIdentity = useCallback(async () => {
    if (docType === 'id') {
      if (!idFrontUri || !idBackUri) return Alert.alert('Missing', 'Please upload both front and back of your ID card');
    } else {
      if (!passportUri) return Alert.alert('Missing', 'Please upload your passport photo');
    }
    try {
      const data = { type: docType, idFrontUri, idBackUri, passportUri };
      await AsyncStorage.setItem('identityDocs', JSON.stringify(data));
      Alert.alert('Saved', 'Identity documents saved');
      setScreen('overview');
    } catch (e) {
      console.log('[Profile] Save identity error', e);
      Alert.alert('Error', 'Failed to save identity documents');
    }
  }, [docType, idFrontUri, idBackUri, passportUri]);

  const clearIdentity = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('identityDocs');
      setIdFrontUri('');
      setIdBackUri('');
      setPassportUri('');
      Alert.alert('Cleared', 'Identity documents removed');
    } catch (e) {
      console.log('[Profile] Clear identity error', e);
    }
  }, []);

  const checkUpdates = useCallback(async () => {
    console.log('[Profile] Checking updates...');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Up to date', 'You are on the latest version.');
    }, 1200);
  }, []);

  const handleShareReferral = useCallback(async () => {
    console.log('[Profile] Sharing referral');
    const code = (userData.phone || 'MS123456789012');
    const message = `Join me on MegaSafe! Use my referral code ${code} to sign up.`;
    try {
      await Share.share({ message });
    } catch (e) {
      console.log('[Profile] Share error', e);
      Alert.alert('Error', 'Failed to open share dialog');
    }
  }, [userData.phone]);

  const handleCopyReferral = useCallback(async () => {
    console.log('[Profile] Copy referral');
    const code = (userData.phone || 'MS123456789012');
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(code);
        Alert.alert('Copied', 'Referral code copied');
      } else {
        Alert.alert('Referral Code', `${code}\n\nCopy this code manually.`);
      }
    } catch (e) {
      console.log('[Profile] Clipboard error', e);
      Alert.alert('Referral Code', `${code}`);
    }
  }, [userData.phone]);

  const handleLogout = useCallback(async () => {
    console.log('[Profile] Logout tapped');
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          try {
            const keysToClear = [
              'biometricEnabled',
              'userData',
              'signupOtp',
              'linkingOtp',
              'profilePhoto',
              'ninNumber',
              'ninVerified',
              'nextOfKin',
              'securityQA',
              'linkedWallets',
              'linkedBanks',
              'payments',
              'mobileMoney',
              'walletTx',
              'loanLedger',
              'offlineMode',
              'offlineOutbox',
              'identityDocs',
            ];
            console.log('[Profile] Clearing keys', keysToClear);
            await AsyncStorage.multiRemove(keysToClear);
            await AsyncStorage.multiSet([
              ['isLoggedIn', 'false'],
              ['onboardingDone', 'true'],
            ]);

            try {
              if (router?.dismissAll) router.dismissAll();
            } catch (e) {
              console.log('[Profile] dismissAll not available', e);
            }

            let navigated = false;
            try {
              router.replace('/');
              navigated = true;
            } catch (navErr) {
              console.log('[Profile] router.replace failed', navErr);
            }

            if (Platform.OS === 'web') {
              try { window.location.assign('/'); } catch (e) { console.log('[Profile] window.location.assign failed', e); }
            } else if (!navigated) {
              try { router.push('/'); } catch (e) { console.log('[Profile] router.push fallback failed', e); }
            }
          } catch (e) {
            console.log('[Profile] Logout error', e);
            Alert.alert('Error', 'Failed to logout');
          }
        }
      }
    ]);
  }, []);

  const SectionRow = ({ icon, title, subtitle, onPress, right }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} testID={`row-${title}`}>
      <View style={styles.rowLeft}>
        <View>{icon}</View>
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ? right : <ChevronRight color="#999" size={18} />}
    </TouchableOpacity>
  );

  const Header = ({ title, onBack }) => (
    <View style={styles.screenHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} testID="backBtn">
        <ArrowLeft color="#FFA500" size={24} />
      </TouchableOpacity>
      <Text style={styles.screenTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderOverview = () => (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <User color="#999" size={36} />
            </View>
          )}
          <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage} testID="changePhotoBtn">
            <Camera color="#fff" size={16} />
            <Text style={styles.changePhotoText}>Change</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userData.name || 'Your Name'}</Text>
          <Text style={styles.profilePhone}>{maskPhone(userData.phone)}</Text>
          <TouchableOpacity style={styles.editMini} onPress={() => setScreen('edit')} testID="editProfileBtn">
            <Edit3 color="#FFA500" size={16} />
            <Text style={styles.editMiniText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.trustCard}>
        <View style={styles.trustHeader}>
          <ShieldCheck color="#4CAF50" size={20} />
          <Text style={styles.trustTitle}>Level of Trust</Text>
        </View>
        <View style={styles.trustBarBg}>
          <View style={[styles.trustBarFill, { width: `${trustScore}%` }]} />
        </View>
        <Text style={styles.trustScore}>{trustScore}% Complete</Text>
        <Text style={styles.trustHint}>Complete your profile to increase trust and unlock features.</Text>
      </View>

      <View style={styles.sectionList}>
        <SectionRow icon={<Gift color="#FFA500" size={20} />} title="Refer & Earn" onPress={() => setScreen('refer')} />
        <SectionRow icon={<BookUser color="#5CCEF4" size={20} />} title="NIN Registration" onPress={() => setScreen('nin')} right={ninVerified ? <Check color="#4CAF50" size={18} /> : null} />
        <SectionRow icon={<Contact color="#5CCEF4" size={20} />} title="ID Verification" onPress={() => setScreen('id')} right={(passportUri || (idFrontUri && idBackUri)) ? <Check color="#4CAF50" size={18} /> : null} />
        <SectionRow icon={<CreditCard color="#FFA500" size={20} />} title="Payment Method" onPress={() => setScreen('payment')} right={mmNumber ? <Check color="#4CAF50" size={18} /> : null} />
        <SectionRow icon={<Shield color="#5CCEF4" size={20} />} title="Security Questions" onPress={() => setScreen('security')} right={(secA1&&secA2&&secA3)?<Check color="#4CAF50" size={18} />:null} />
        <SectionRow icon={<CircuitBoard color="#5CCEF4" size={20} />} title="Security Blockchain" onPress={() => setScreen('chain')} />
        <SectionRow icon={<Contact color="#5CCEF4" size={20} />} title="Next of Kin" onPress={() => setScreen('nok')} right={(nokName&&nokPhone)?<Check color="#4CAF50" size={18} />:null} />
        <SectionRow icon={<LinkIcon color="#FFA500" size={20} />} title="Linked Wallets & Banks" onPress={() => setScreen('linked')} />
        <SectionRow icon={<CreditCard color="#FFA500" size={20} />} title="Your Payments" onPress={() => setScreen('payments')} />
        <SectionRow icon={<CreditCard color="#5CCEF4" size={20} />} title="Analytics & Reports" onPress={() => setScreen('reports')} />
        <SectionRow icon={<HelpCircle color="#5CCEF4" size={20} />} title="Offline Sync" onPress={() => setScreen('offline')} />
        <SectionRow icon={<HelpCircle color="#5CCEF4" size={20} />} title="Contact Us" onPress={() => setScreen('contact')} />
        <SectionRow icon={<RefreshCw color="#5CCEF4" size={20} />} title="Check for Updates" subtitle={versionLabel} onPress={checkUpdates} right={loading ? <ActivityIndicator size="small" /> : <ChevronRight color="#999" size={18} />} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} testID="logoutBtn">
        <LogOut color="#fff" size={18} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderEditProfile = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="Edit Profile" onBack={() => setScreen('overview')} />

      <View style={styles.centerAvatarBlock}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.avatarLarge} />
        ) : (
          <View style={styles.avatarLargeFallback}>
            <User color="#999" size={48} />
          </View>
        )}
        <TouchableOpacity style={styles.changePhotoBigBtn} onPress={pickImage}>
          <Camera color="#fff" size={18} />
          <Text style={styles.changePhotoBigText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={userData.name}
            onChangeText={(t) => setUserData({ ...userData, name: t })}
            returnKeyType="next"
            blurOnSubmit={false}
            testID="editName"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number (12 characters)</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="e.g., +23288000000"
            value={userData.phone}
            onChangeText={(t) => setUserData({ ...userData, phone: t })}
            keyboardType="phone-pad"
            maxLength={12}
            returnKeyType="done"
            blurOnSubmit={false}
            testID="editPhone"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} testID="saveProfileBtn">
        <Text style={styles.primaryBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderNIN = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="NIN Registration" onBack={() => setScreen('overview')} />

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Provide your National Identification Number (NIN). We only store it securely on your device.</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>NIN (8 alphanumeric)</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Enter your NIN"
            value={nin}
            onChangeText={(t)=>setNin(t.replace(/[^A-Za-z0-9]/g, ''))}
            maxLength={8}
            returnKeyType="done"
            blurOnSubmit={false}
            testID="ninInput"
          />
        </View>
        {ninVerified ? (
          <View style={styles.verifiedRow}>
            <Check color="#4CAF50" size={18} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveNIN} testID="saveNinBtn">
        <Text style={styles.primaryBtnText}>{ninVerified ? 'Update NIN' : 'Save & Verify'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSecurity = () => (
    <View style={styles.flex1}>
      <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
        <Header title="Security Questions" onBack={() => setScreen('overview')} />

        {[{ q: secQ1, a: secA1, setQ: setSecQ1, setA: setSecA1, which: 1 }, { q: secQ2, a: secA2, setQ: setSecQ2, setA: setSecA2, which: 2 }, { q: secQ3, a: secA3, setQ: setSecQ3, setA: setSecA3, which: 3 }].map((item, idx) => (
          <View key={idx} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Question {idx + 1}</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setShowQuestionPicker({ which: item.which, visible: true })}>
              <Text style={styles.selectorText}>{item.q}</Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="Your answer"
                value={item.a}
                onChangeText={item.setA}
                returnKeyType="done"
                blurOnSubmit={false}
                testID={`answer${idx + 1}`}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveSecurity} testID="saveSecurityBtn">
          <Text style={styles.primaryBtnText}>Save Security Questions</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={showQuestionPicker.visible} animationType="slide" onRequestClose={() => setShowQuestionPicker({ which: 0, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a question</Text>
              <TouchableOpacity onPress={() => setShowQuestionPicker({ which: 0, visible: false })}>
                <X color="#666" size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {questionBank.map((q) => (
                <TouchableOpacity key={q} style={styles.modalOption} onPress={() => {
                  if (showQuestionPicker.which === 1) setSecQ1(q);
                  if (showQuestionPicker.which === 2) setSecQ2(q);
                  if (showQuestionPicker.which === 3) setSecQ3(q);
                  setShowQuestionPicker({ which: 0, visible: false });
                }}>
                  <Text style={styles.modalOptionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderNOK = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="Next of Kin" onBack={() => setScreen('overview')} />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputBox}>
          <TextInput style={styles.input} placeholder="Enter full name" value={nokName} onChangeText={setNokName} blurOnSubmit={false} testID="nokName" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Relationship</Text>
        <TouchableOpacity style={styles.selector} onPress={() => Alert.alert('Relationship', 'Enter relationship in the next field if needed.')}> 
          <Text style={styles.selectorText}>{nokRelationship}</Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>
        <View style={styles.inputBox}>
          <TextInput style={styles.input} placeholder="e.g., Sibling, Parent, Friend" value={nokRelationship} onChangeText={setNokRelationship} blurOnSubmit={false} testID="nokRelationship" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone (12 characters)</Text>
        <View style={styles.inputBox}>
          <TextInput style={styles.input} placeholder="e.g., +23288000000" value={nokPhone} onChangeText={setNokPhone} keyboardType="phone-pad" maxLength={12} returnKeyType="done" blurOnSubmit={false} testID="nokPhone" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address</Text>
        <View style={styles.inputBox}>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Enter address" value={nokAddress} onChangeText={setNokAddress} multiline numberOfLines={3} blurOnSubmit={false} testID="nokAddress" />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveNOK} testID="saveNokBtn">
        <Text style={styles.primaryBtnText}>Save Next of Kin</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRefer = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="Refer & Earn" onBack={() => setScreen('overview')} />

      <View style={styles.refCard}>
        <Gift color="#FFA500" size={28} />
        <Text style={styles.refTitle}>Invite friends and earn rewards</Text>
        <Text style={styles.refSubtitle}>Share your code and get bonuses when your friends join MegaSafe.</Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{userData.phone || 'MS123456789012'}</Text>
        </View>

        <View style={styles.refActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopyReferral} testID="copyReferral">
            <Copy color="#FFA500" size={18} />
            <Text style={styles.secondaryBtnText}>Copy Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleShareReferral} testID="shareReferral">
            <Share2 color="#fff" size={18} />
            <Text style={styles.primaryBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderLinked = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="Linked Wallets & Banks" onBack={() => setScreen('overview')} />

      <Text style={styles.sectionHeader}>Wallets</Text>
      {linkedWallets.length === 0 ? (
        <View style={styles.emptyState}>
          <Wallet color="#ccc" size={40} />
          <Text style={styles.emptyText}>No wallets linked</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {linkedWallets.map((w) => (
            <View key={w.id} style={styles.listRow}>
              <Wallet color="#5CCEF4" size={18} />
              <Text style={styles.listText}>{maskAddress(w.address)}</Text>
              <TouchableOpacity style={styles.removeChip} onPress={async () => {
                const updated = linkedWallets.filter((x) => x.id !== w.id);
                await AsyncStorage.setItem('linkedWallets', JSON.stringify(updated));
                setLinkedWallets(updated);
              }}>
                <X color="#e74c3c" size={14} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAddWalletModal(true)} testID="addWalletBtn">
        <Text style={styles.primaryBtnText}>Add Wallet</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Banks</Text>
      {linkedBanks.length === 0 ? (
        <View style={styles.emptyState}>
          <Banknote color="#ccc" size={40} />
          <Text style={styles.emptyText}>No banks linked</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {linkedBanks.map((b) => (
            <View key={b.id} style={styles.listRow}>
              <Banknote color="#FFA500" size={18} />
              <Text style={styles.listText}>{b.bank} • {maskAcct(b.number)}</Text>
              <TouchableOpacity style={styles.removeChip} onPress={async () => {
                const updated = linkedBanks.filter((x) => x.id !== b.id);
                await AsyncStorage.setItem('linkedBanks', JSON.stringify(updated));
                setLinkedBanks(updated);
              }}>
                <X color="#e74c3c" size={14} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowAddBankModal(true)} testID="addBankBtn">
        <Text style={styles.secondaryBtnText}>Add Bank</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPayments = () => {
    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return (
      <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
        <Header title="Your Payments" onBack={() => setScreen('overview')} />

        <View style={styles.summaryCard}>
          <CreditCard color="#5CCEF4" size={24} />
          <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
          <Text style={styles.summaryLabel}>Total Recorded</Text>
        </View>

        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard color="#ccc" size={40} />
            <Text style={styles.emptyText}>No payments yet</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {payments.map((p) => (
              <View key={p.id} style={styles.listRowBetween}>
                <View style={styles.rowLeft}>
                  <CreditCard color="#FFA500" size={18} />
                  <View>
                    <Text style={styles.listText}>{p.note || 'Payment'} • {p.category || 'General'}</Text>
                    <Text style={styles.smallMuted}>{new Date(p.date).toLocaleDateString()} • {p.method || 'Method'} • {p.receipt || ''}</Text>
                  </View>
                </View>
                <Text style={styles.bold}>{formatCurrency(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAddPaymentModal(true)} testID="addPaymentBtn">
          <Text style={styles.primaryBtnText}>Add Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const OfflineScreen = () => {
    const [offlineMode, setOfflineMode] = useState(false);
    const [outbox, setOutbox] = useState([]);

    useEffect(() => {
      (async () => {
        try {
          setOfflineMode((await AsyncStorage.getItem('offlineMode')) === 'true');
          const raw = await AsyncStorage.getItem('offlineOutbox');
          setOutbox(raw ? JSON.parse(raw) : []);
        } catch (e) { console.log('[Offline] load', e); }
      })();
    }, []);

    const syncNow = async () => {
      try {
        const raw = await AsyncStorage.getItem('offlineOutbox');
        const list = raw ? JSON.parse(raw) : [];
        const paymentsRaw = await AsyncStorage.getItem('payments');
        const existing = paymentsRaw ? JSON.parse(paymentsRaw) : [];
        const toApply = list.filter(i => i.kind === 'payment').map(i => i.payload);
        await AsyncStorage.setItem('payments', JSON.stringify([...existing, ...toApply]));
        await AsyncStorage.removeItem('offlineOutbox');
        setOutbox([]);
        Alert.alert('Synced', 'Offline transactions synced');
      } catch (e) {
        console.log('[Offline] sync error', e);
        Alert.alert('Error', 'Failed to sync');
      }
    };

    const toggleMode = async () => {
      try {
        const next = !offlineMode;
        setOfflineMode(next);
        await AsyncStorage.setItem('offlineMode', next ? 'true' : 'false');
        Alert.alert('Updated', next ? 'Offline mode enabled' : 'Offline mode disabled');
      } catch (e) { console.log('[Offline] toggle', e); }
    };

    return (
      <ScrollView contentContainerStyle={styles.formWrap}>
        <Header title="Offline Sync" onBack={() => setScreen('overview')} />
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Queue payments when offline and sync later. Choose automatic or manual from here.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={toggleMode} testID="toggleOfflineMode">
            <Text style={styles.primaryBtnText}>{offlineMode ? 'Disable Offline Mode' : 'Enable Offline Mode'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={syncNow} testID="syncNow">
            <Text style={styles.secondaryBtnText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Outbox</Text>
        <View style={styles.listCard}>
          {outbox.length === 0 ? (
            <Text style={styles.smallMuted}>No pending items</Text>
          ) : (
            outbox.map((i) => (
              <View key={i.payload?.id} style={styles.listRowBetween}>
                <View style={styles.rowLeft}>
                  <CreditCard color="#FFA500" size={18} />
                  <Text style={styles.listText}>{i.payload?.note || 'Payment'} • {new Date(i.payload?.date).toLocaleString()}</Text>
                </View>
                <Text style={styles.bold}>NLe {(i.payload?.amount||0).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  const renderContact = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="Contact Us" onBack={() => setScreen('overview')} />

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>We are here to help. Choose a contact method below.</Text>
      </View>

      <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('mailto:support@megasafe.app')} testID="emailUs">
        <View style={styles.rowLeft}>
          <Mail color="#5CCEF4" size={20} />
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Email</Text>
            <Text style={styles.rowSubtitle}>support@megasafe.app</Text>
          </View>
        </View>
        <ChevronRight color="#999" size={18} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('tel:+23288000000')} testID="callUs">
        <View style={styles.rowLeft}>
          <PhoneIcon color="#FFA500" size={20} />
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Phone</Text>
            <Text style={styles.rowSubtitle}>+232 88 000000</Text>
          </View>
        </View>
        <ChevronRight color="#999" size={18} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://wa.me/23288000000')} testID="whatsappUs">
        <View style={styles.rowLeft}>
          <Contact color="#25D366" size={20} />
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>WhatsApp</Text>
            <Text style={styles.rowSubtitle}>Chat with support</Text>
          </View>
        </View>
        <ChevronRight color="#999" size={18} />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderReports = () => {
    const filtered = payments.filter((p) => {
      const d = new Date(p.date);
      return d >= new Date(reportStart.setHours(0,0,0,0)) && d <= new Date(reportEnd.setHours(23,59,59,999));
    });
    const totalsByCat = filtered.reduce((acc, p) => { const k = p.category || 'General'; acc[k] = (acc[k]||0) + (p.amount||0); return acc; }, {});
    const overall = filtered.reduce((s, p)=> s + (p.amount||0), 0);

    const buildHtml = () => {
      const rows = filtered.map((p) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${new Date(p.date).toLocaleDateString()}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${p.category||'General'}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${p.method||''}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${p.receipt||''}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(p.amount||0).toFixed(2)}</td>
        </tr>`).join('');
      const totalsRows = Object.keys(totalsByCat).map((k)=>`<tr><td colspan="4" style="padding:8px;text-align:right;font-weight:700">${k}</td><td style="padding:8px;text-align:right;font-weight:700">${totalsByCat[k].toFixed(2)}</td></tr>`).join('');
      return `
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Transactions Report</title>
        </head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;padding:16px;color:#333">
          <h2 style="margin:0 0 4px">Transactions Report</h2>
          <div style="color:#666;margin-bottom:12px">${new Date(reportStart).toLocaleDateString()} – ${new Date(reportEnd).toLocaleDateString()}</div>

          <div style="margin:12px 0;padding:12px;border:1px solid #f0f0f0;border-radius:12px">
            <div style="font-weight:700;margin-bottom:8px">Totals by Category</div>
            <table style="width:100%;border-collapse:collapse">${totalsRows}</table>
            <div style="text-align:right;margin-top:8px;font-weight:800">Overall: ${overall.toFixed(2)}</div>
          </div>

          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Date</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Category</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Method</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Receipt</th>
                <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd">Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;
    };

    const onPrint = async () => {
      try {
        const html = buildHtml();
        await Print.printAsync({ html });
      } catch (e) {
        Alert.alert('Error', 'Failed to generate report');
      }
    };

    return (
      <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
        <Header title="Analytics & Reports" onBack={() => setScreen('overview')} />

        <View style={styles.summaryCard}>
          <CreditCard color="#5CCEF4" size={24} />
          <Text style={styles.summaryAmount}>{formatCurrency(overall)}</Text>
          <Text style={styles.summaryLabel}>In selected range</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Start Date</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowReportStartPicker(true)} testID="openReportStart">
            <Text style={styles.selectorText}>{new Date(reportStart).toDateString()}</Text>
            <Text style={styles.selectorArrow}>📅</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>End Date</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowReportEndPicker(true)} testID="openReportEnd">
            <Text style={styles.selectorText}>{new Date(reportEnd).toDateString()}</Text>
            <Text style={styles.selectorArrow}>📅</Text>
          </TouchableOpacity>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard color="#ccc" size={40} />
            <Text style={styles.emptyText}>No transactions in this range</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filtered.map((p)=> (
              <View key={`rp-${p.id}`} style={styles.listRowBetween}>
                <View style={styles.rowLeft}>
                  <CreditCard color="#FFA500" size={18} />
                  <View>
                    <Text style={styles.listText}>{p.category || 'General'} • {p.method || ''}</Text>
                    <Text style={styles.smallMuted}>{new Date(p.date).toLocaleDateString()} • {p.receipt || ''}</Text>
                  </View>
                </View>
                <Text style={styles.bold}>{formatCurrency(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[styles.linkOtpVerifyButton, { flex: 2 }]} onPress={onPrint} testID="printReportBtn">
            <Text style={styles.linkOtpVerifyText}>Preview & Print PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkOtpCancelButton, { flex: 1 }]} onPress={() => setScreen('overview')} testID="cancelReportBtn">
            <Text style={styles.linkOtpCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderPaymentMethod = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="Payment Method" onBack={() => setScreen('overview')} />

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Add your Mobile Money details used to pay group contributions. Supported: Orange Money, Africell Money, Qcell Money.</Text>
      </View>

      <Text style={styles.sectionHeader}>Provider</Text>
      {providerOptions.map((p) => (
        <TouchableOpacity key={p} style={[styles.selector, mmProvider === p && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setMmProvider(p)} testID={`mmProvider-${p.replace(/\s/g,'')}`}>
          <Text style={styles.selectorText}>{p}</Text>
          {mmProvider === p ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
        </TouchableOpacity>
      ))}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Mobile Money Number (12 characters)</Text>
        <View style={styles.inputBox}>
          <TextInput style={styles.input} placeholder="e.g., +23288000000" value={mmNumber} onChangeText={setMmNumber} keyboardType="phone-pad" maxLength={12} blurOnSubmit={false} testID="mmInput" />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSavePaymentMethod} testID="savePaymentMethod">
        <Text style={styles.primaryBtnText}>Save Payment Method</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderChain = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="Security Blockchain" onBack={() => setScreen('overview')} />

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Connect your crypto wallet and review the secure blockchain audit trail of transactions.</Text>
      </View>

      <Text style={styles.sectionHeader}>Crypto Connections</Text>
      {linkedWallets.length === 0 ? (
        <View style={styles.emptyState}>
          <Wallet color="#ccc" size={40} />
          <Text style={styles.emptyText}>No wallets linked</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {linkedWallets.map((w) => (
            <View key={`cw-${w.id}`} style={styles.listRow}>
              <Wallet color="#5CCEF4" size={18} />
              <Text style={styles.listText}>{maskAddress(w.address)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowAddWalletModal(true)} testID="addWalletFromChain">
          <Text style={styles.secondaryBtnText}>Add Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setScreen('linked')} testID="openManageCrypto">
          <Text style={styles.primaryBtnText}>Manage Connections</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Blockchain Audit Trail</Text>
      {chainLedger.length === 0 ? (
        <View style={styles.emptyState}>
          <CircuitBoard color="#ccc" size={40} />
          <Text style={styles.emptyText}>No entries yet</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {chainLedger.slice().reverse().map((e) => (
            <View key={`lg-${e.id}`} style={styles.listRow}>
              <CircuitBoard color="#FFA500" size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listText}>{e.type}</Text>
                <Text style={styles.smallMuted}>Hash: {e.hash}</Text>
                <Text style={styles.smallMuted}>Prev: {e.prev}</Text>
                <Text style={styles.smallMuted}>Time: {new Date(e.ts).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={loadLedger} testID="refreshLedgerBtn">
        <Text style={styles.primaryBtnText}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderIdentity = () => (
    <ScrollView contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      <Header title="ID Verification" onBack={() => setScreen('overview')} />

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Upload your government-issued ID card (front and back) or a Passport photo for security verification.</Text>
      </View>

      <Text style={styles.sectionHeader}>Select Document Type</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <TouchableOpacity style={[styles.secondaryBtn, docType === 'id' && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setDocType('id')} testID="docTypeId">
          <Text style={[styles.secondaryBtnText, { color: '#FFA500' }]}>ID Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryBtn, docType === 'passport' && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setDocType('passport')} testID="docTypePassport">
          <Text style={[styles.secondaryBtnText, { color: '#FFA500' }]}>Passport</Text>
        </TouchableOpacity>
      </View>

      {docType === 'id' ? (
        <View>
          <Text style={styles.sectionHeader}>Front of ID</Text>
          {idFrontUri ? (
            <Image source={{ uri: idFrontUri }} style={{ width: '100%', height: 180, borderRadius: 12, backgroundColor: '#eee' }} />
          ) : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => pickDocImage('front')} testID="pickFront">
            <Text style={styles.primaryBtnText}>{idFrontUri ? 'Replace Front Image' : 'Upload Front Image'}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Back of ID</Text>
          {idBackUri ? (
            <Image source={{ uri: idBackUri }} style={{ width: '100%', height: 180, borderRadius: 12, backgroundColor: '#eee' }} />
          ) : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => pickDocImage('back')} testID="pickBack">
            <Text style={styles.primaryBtnText}>{idBackUri ? 'Replace Back Image' : 'Upload Back Image'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.sectionHeader}>Passport Photo</Text>
          {passportUri ? (
            <Image source={{ uri: passportUri }} style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: '#eee' }} />
          ) : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => pickDocImage('passport')} testID="pickPassport">
            <Text style={styles.primaryBtnText}>{passportUri ? 'Replace Passport Image' : 'Upload Passport Image'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveIdentity} testID="saveIdentity">
          <Text style={styles.primaryBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={clearIdentity} testID="clearIdentity">
          <Text style={styles.secondaryBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (screen) {
      case 'edit':
        return renderEditProfile();
      case 'nin':
        return renderNIN();
      case 'security':
        return renderSecurity();
      case 'nok':
        return renderNOK();
      case 'refer':
        return renderRefer();
      case 'linked':
        return renderLinked();
      case 'payments':
        return renderPayments();
      case 'contact':
        return renderContact();
      case 'payment':
        return renderPaymentMethod();
      case 'id':
        return renderIdentity();
      case 'chain':
        return renderChain();
      case 'reports':
        return renderReports();
      case 'offline':
        return <OfflineScreen />;
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        {renderContent()}
      </KeyboardAvoidingView>

      <Modal visible={showAddWalletModal} transparent animationType="fade" onRequestClose={() => setShowAddWalletModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Wallet</Text>
              <TouchableOpacity onPress={() => setShowAddWalletModal(false)}>
                <X color="#666" size={22} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wallet Address</Text>
              <View style={styles.inputBox}>
                <TextInput value={walletInput} onChangeText={setWalletInput} style={styles.input} placeholder="Enter wallet address" autoCapitalize="none" blurOnSubmit={false} testID="walletInput" />
              </View>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmAddWallet} testID="confirmAddWallet">
              <Text style={styles.primaryBtnText}>Link Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLinkOtpModal} transparent animationType="fade" onRequestClose={() => setShowLinkOtpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Linking</Text>
              <TouchableOpacity onPress={() => setShowLinkOtpModal(false)}>
                <X color="#666" size={22} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#666', marginBottom: 8 }}>Enter the 6-digit OTP sent to your number</Text>
            <View style={styles.linkOtpBoxesRow}>
              {[0,1,2,3,4,5].map((i) => (
                <TextInput
                  key={`l-${i}`}
                  ref={(r) => { linkOtpRefs.current[i] = r; }}
                  style={styles.linkOtpDigitInput}
                  value={linkOtpDigits[i]}
                  onChangeText={(t) => {
                    const clean = String(t||'').replace(/[^0-9]/g,'');
                    if (clean.length > 1) {
                      const arr = clean.slice(0, 6).split('');
                      const next = [...linkOtpDigits];
                      for (let k = 0; k < 6; k++) { if (typeof arr[k] !== 'undefined') next[k] = arr[k]; }
                      setLinkOtpDigits(next);
                      setLinkOtpInput(next.join(''));
                      const last = Math.min(5, i + clean.length);
                      setTimeout(() => { linkOtpRefs.current[Math.min(5, last)]?.focus && linkOtpRefs.current[Math.min(5, last)]?.focus(); }, 0);
                    } else {
                      const next = [...linkOtpDigits];
                      next[i] = clean;
                      setLinkOtpDigits(next);
                      setLinkOtpInput(next.join(''));
                      if (clean && i < 5) setTimeout(() => { linkOtpRefs.current[i+1]?.focus && linkOtpRefs.current[i+1]?.focus(); }, 0);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e?.nativeEvent?.key === 'Backspace' && !linkOtpDigits[i] && i > 0) {
                      linkOtpRefs.current[i-1]?.focus && linkOtpRefs.current[i-1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  testID={`linkOtpBox-${i}`}
                  returnKeyType="next"
                />
              ))}
            </View>
            <View style={styles.linkOtpActions}>
              <TouchableOpacity style={styles.linkOtpCancelButton} onPress={() => { setShowLinkOtpModal(false); setLinkOtpInput(''); setLinkOtpDigits(['','','','','','']); }} testID="linkOtpCancelBtn">
                <Text style={styles.linkOtpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkOtpVerifyButton} onPress={async () => {
                const input = (linkOtpDigits.join('') || linkOtpInput).trim();
                const expected = linkOtpGenerated || '000000';
                if (input !== expected) {
                  Alert.alert('Invalid', 'Incorrect OTP');
                  return;
                }
                try {
                  if (linkContext.type === 'mm') {
                    const { provider, number } = linkContext.payload;
                    await AsyncStorage.setItem('mobileMoney', JSON.stringify({ provider, number }));
                    setMmProvider(provider);
                    setMmNumber(number);
                    Alert.alert('Saved', 'Payment method saved');
                    setScreen('overview');
                  }
                  if (linkContext.type === 'bank') {
                    const { bank, name, number } = linkContext.payload;
                    const updated = [...linkedBanks, { id: Date.now().toString(), bank, name, number }];
                    await AsyncStorage.setItem('linkedBanks', JSON.stringify(updated));
                    setLinkedBanks(updated);
                    setBankNameInput('');
                    setBankAcctNameInput('');
                    setBankAcctNumberInput('');
                    setShowAddBankModal(false);
                    Alert.alert('Added', 'Bank linked');
                  }
                } catch (e) {
                  console.log('[Profile] verify link OTP error', e);
                  Alert.alert('Error', 'Failed to complete linking');
                } finally {
                  setShowLinkOtpModal(false);
                  setLinkOtpInput('');
                  setLinkOtpDigits(['','','','','','']);
                }
              }} testID="verifyLinkOtpBtn">
                <Text style={styles.linkOtpVerifyText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddBankModal} transparent animationType="fade" onRequestClose={() => setShowAddBankModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bank</Text>
              <TouchableOpacity onPress={() => setShowAddBankModal(false)}>
                <X color="#666" size={22} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <View style={styles.inputBox}>
                <TextInput value={bankNameInput} onChangeText={setBankNameInput} style={styles.input} placeholder="e.g., Rokel Commercial Bank" blurOnSubmit={false} testID="bankNameInput" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <View style={styles.inputBox}>
                <TextInput value={bankAcctNameInput} onChangeText={setBankAcctNameInput} style={styles.input} placeholder="Full name" blurOnSubmit={false} testID="bankAcctNameInput" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <View style={styles.inputBox}>
                <TextInput value={bankAcctNumberInput} onChangeText={setBankAcctNumberInput} style={styles.input} placeholder="Account number" keyboardType="number-pad" blurOnSubmit={false} testID="bankAcctNumberInput" />
              </View>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmAddBank} testID="confirmAddBank">
              <Text style={styles.primaryBtnText}>Link Bank</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddPaymentModal} transparent animationType="fade" onRequestClose={() => setShowAddPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }} keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}> 
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Payment</Text>
                <TouchableOpacity onPress={() => setShowAddPaymentModal(false)}>
                  <X color="#666" size={22} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount (NLe)</Text>
                  <View style={styles.inputBox}>
                    <TextInput value={payAmountInput} onChangeText={(t)=>setPayAmountInput(t.replace(/[^0-9.]/g,''))} style={styles.input} placeholder="0.00" keyboardType="numeric" blurOnSubmit={false} testID="payAmountInput" />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category</Text>
                  {payCategoryOptions.map((c) => (
                    <TouchableOpacity key={c} style={[styles.selector, payCategoryInput === c && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setPayCategoryInput(c)} testID={`payCategory-${c.replace(/\s/g,'')}`}>
                      <Text style={styles.selectorText}>{c}</Text>
                      {payCategoryInput === c ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Method</Text>
                  {payMethodOptions.map((m) => (
                    <TouchableOpacity key={m} style={[styles.selector, payMethodInput === m && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setPayMethodInput(m)} testID={`payMethod-${m.replace(/\s/g,'')}`}>
                      <Text style={styles.selectorText}>{m}</Text>
                      {payMethodInput === m ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)} testID="openPayDatePicker">
                    <Text style={styles.selectorText}>{new Date(payDate).toDateString()}</Text>
                    <Text style={styles.selectorArrow}>📅</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Note (optional)</Text>
                  <View style={styles.inputBox}>
                    <TextInput value={payNoteInput} onChangeText={setPayNoteInput} style={styles.input} placeholder="What is this for?" blurOnSubmit={false} testID="payNoteInput" />
                  </View>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmAddPayment} testID="confirmAddPayment">
                  <Text style={styles.primaryBtnText}>Save Payment</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        initialDate={payDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={(d) => { setPayDate(d); setShowDatePicker(false); }}
      />

      <DatePickerModal
        visible={showReportStartPicker}
        initialDate={reportStart}
        onClose={() => setShowReportStartPicker(false)}
        onSelect={(d) => { setReportStart(d); setShowReportStartPicker(false); }}
      />
      <DatePickerModal
        visible={showReportEndPicker}
        initialDate={reportEnd}
        onClose={() => setShowReportEndPicker(false)}
        onSelect={(d) => { setReportEnd(d); setShowReportEndPicker(false); }}
      />
    </SafeAreaView>
  );
}

function DatePickerModal({ visible, initialDate, onClose, onSelect }) {
  const [current, setCurrent] = useState(() => new Date(initialDate || new Date()));
  const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const startWeekday = startOfMonth.getDay();
  const days = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '92%' }]}>          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pick a date</Text>
            <TouchableOpacity onPress={onClose} testID="calendarClose">
              <X color="#666" size={22} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} testID="prevMonth">
              <Text style={{ fontSize: 18 }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: '700', color: '#333' }}>{current.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} testID="nextMonth">
              <Text style={{ fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
              <Text key={d} style={{ width: 36, textAlign: 'center', color: '#999', fontWeight: '700' }}>{d}</Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: startWeekday }).map((_, i) => (
              <View key={`sp-${i}`} style={{ width: 36, height: 36 }} />
            ))}
            {days.map((d) => (
              <TouchableOpacity key={`d-${d}`} style={{ width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }} onPress={() => onSelect(new Date(current.getFullYear(), current.getMonth(), d))} testID={`day-${d}`}>
                <Text style={{ color: '#333' }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  errorTitle: { marginTop: 12, fontSize: 18, fontWeight: 'bold', color: '#333' },
  errorSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  avatarWrap: { marginRight: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  changePhotoBtn: { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#FFA500', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  changePhotoText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', fontFamily: 'Montserrat', color: '#00157f' },
  profilePhone: { marginTop: 4, color: '#666' },
  editMini: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff5e6' },
  editMiniText: { color: '#FFA500', fontWeight: '600' },

  trustCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  trustTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  trustBarBg: { height: 10, backgroundColor: '#eee', borderRadius: 6, overflow: 'hidden' },
  trustBarFill: { height: '100%', backgroundColor: '#4CAF50' },
  trustScore: { marginTop: 8, fontWeight: '700', color: '#333' },
  trustHint: { marginTop: 4, color: '#666', fontSize: 12 },

  sectionList: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 6, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  row: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTextWrap: { },
  rowTitle: { fontSize: 16, color: '#333', fontWeight: '600' },
  rowSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },

  logoutBtn: { backgroundColor: '#e74c3c', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginHorizontal: 20 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16 },
  backBtn: { padding: 4, marginRight: 8 },
  screenTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Montserrat', color: '#00157f', alignSelf: 'center' },

  formWrap: { padding: 20, paddingBottom: 40 },
  flex1: { flex: 1 },

  centerAvatarBlock: { alignItems: 'center', marginBottom: 20 },
  avatarLarge: { width: 120, height: 120, borderRadius: 60 },
  avatarLargeFallback: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  changePhotoBigBtn: { marginTop: 10, backgroundColor: '#FFA500', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  changePhotoBigText: { color: '#fff', fontWeight: '700' },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff' },
  input: { height: 48, paddingHorizontal: 14, fontSize: 16, color: '#333' },

  selector: { height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  selectorText: { fontSize: 16, color: '#333' },
  selectorArrow: { color: '#999', fontSize: 12 },

  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  infoText: { color: '#444', lineHeight: 20 },

  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  verifiedText: { color: '#4CAF50', fontWeight: '700' },

  refCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  refTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 10 },
  refSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 6 },
  codeBox: { marginTop: 16, borderWidth: 1, borderColor: '#FFA500', backgroundColor: '#fff5e6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  codeText: { fontSize: 18, fontWeight: '800', fontFamily: 'Montserrat', color: '#FFA500', letterSpacing: 2 },
  refActions: { flexDirection: 'row', gap: 12, marginTop: 16 },

  primaryBtn: { backgroundColor: '#FFA500', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 6, paddingHorizontal: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Montserrat' },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#FFA500', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 6 },
  secondaryBtnText: { color: '#FFA500', fontSize: 16, fontWeight: 'bold', fontFamily: 'Montserrat' },

  sectionHeader: { fontSize: 16, fontWeight: '700', fontFamily: 'Montserrat', color: '#00157f', marginBottom: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 18 },
  emptyText: { color: '#777', marginTop: 8 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 8, marginBottom: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  listRowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  listText: { color: '#333', fontWeight: '600' },
  removeChip: { marginLeft: 'auto', backgroundColor: '#fff0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  smallMuted: { color: '#777', fontSize: 12 },
  bold: { fontWeight: '700', color: '#333' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  summaryAmount: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 8 },
  summaryLabel: { fontSize: 12, color: '#666' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '85%', maxWidth: 420, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontWeight: '700', color: '#333', fontSize: 16 },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalOptionText: { color: '#333', fontSize: 15 },
  linkOtpBoxesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 8 },
  linkOtpDigitInput: { width: 48, height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, textAlign: 'center', fontSize: 18, backgroundColor: '#f9f9f9' },
  linkOtpActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  linkOtpCancelButton: { flex: 1, backgroundColor: '#FFA500', borderRadius: 8, height: 48, alignItems: 'center', justifyContent: 'center' },
  linkOtpCancelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkOtpVerifyButton: { flex: 2, backgroundColor: '#1877F2', borderRadius: 8, height: 48, alignItems: 'center', justifyContent: 'center' },
  linkOtpVerifyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});