import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, SafeAreaView, Animated, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Users, PiggyBank, Wallet as WalletIcon, HandCoins, CreditCard, CircuitBoard, Settings as SettingsIcon, MessageCircle, BarChart3, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const palette = {
  primary: '#00157f',
  teal: '#14B8A6',
  gold: '#FFA500',
  green: '#22C55E',
  coral: '#F97316',
  bg: '#F9FAFB',
  text: '#111827',
  grayCard: '#F3F4F6',
};

function PressableScale({ onPress, children, style, testID }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.8} testID={testID}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function FeatureTile({ label, Icon, colors }) {
  return (
    <PressableScale onPress={colors.onPress} testID={colors.testID} style={styles.featureWrap}>
      <View style={styles.featureInner}>
        <LinearGradient colors={colors.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBg}>
          <Icon color={colors.icon} size={22} />
        </LinearGradient>
        <Text style={styles.tileText}>{label}</Text>
      </View>
    </PressableScale>
  );
}

export default function HomeScreen() {
  const [user, setUser] = useState({ name: '', phone: '' });
  const [mm, setMm] = useState(null);
  const [banks, setBanks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [walletTx, setWalletTx] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [ud, mmRaw, banksRaw, pays, wtx] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('mobileMoney'),
          AsyncStorage.getItem('linkedBanks'),
          AsyncStorage.getItem('payments'),
          AsyncStorage.getItem('walletTx'),
        ]);
        if (ud) setUser(JSON.parse(ud));
        if (mmRaw) setMm(JSON.parse(mmRaw));
        if (banksRaw) setBanks(JSON.parse(banksRaw));
        if (pays) setPayments(JSON.parse(pays));
        if (wtx) setWalletTx(JSON.parse(wtx));
      } catch (e) {
        console.log('[Home] load error', e);
        Alert.alert('Error', 'Failed to load data');
      }
    })();
  }, []);

  const userId = useMemo(() => (user.phone || 'guest'), [user]);

  const walletBalance = useMemo(() => {
    try {
      const top = (walletTx || []).filter(t => t.type === 'topup').reduce((s, t) => s + Number(t.amount || 0), 0);
      const out = (walletTx || []).filter(t => t.type === 'spend' || t.type === 'withdraw').reduce((s, t) => s + Number(t.amount || 0), 0);
      return Math.max(0, top - out);
    } catch {
      return 0;
    }
  }, [walletTx]);

  const groupContrib = useMemo(() => {
    try {
      return (payments || []).filter(p => p.groupId && (p.payerId ? p.payerId === userId : true)).reduce((s, p) => s + Number(p.amount || 0), 0);
    } catch { return 0; }
  }, [payments, userId]);

  const goalsContrib = useMemo(() => {
    try {
      return (payments || []).filter(p => String(p.note || '').startsWith('Savings Deposit - ')).reduce((s, p) => s + Number(p.amount || 0), 0);
    } catch { return 0; }
  }, [payments]);

  const totalAll = walletBalance + groupContrib + goalsContrib;

  const grid = [
    { key: 'groups', label: 'Groups', icon: Users, color: '#22C55E', bg: ['#DCFCE7', '#BBF7D0'], onPress: () => router.push('/(tabs)/groups'), testID: 'goGroups' },
    { key: 'savings', label: 'Savings', icon: PiggyBank, color: '#FBBF24', bg: ['#FEF9C3', '#FDE68A'], onPress: () => router.push('/(tabs)/savings'), testID: 'goSavings' },
    { key: 'wallet', label: 'Wallet', icon: WalletIcon, color: '#14B8A6', bg: ['#CCFBF1', '#99F6E4'], onPress: () => router.push('/(tabs)/wallet'), testID: 'goWallet' },
    { key: 'loan', label: 'Loan', icon: HandCoins, color: '#F97316', bg: ['#FFEDD5', '#FED7AA'], onPress: () => router.push('/(tabs)/loans'), testID: 'goLoans' },
    { key: 'pay', label: 'Make Payment', icon: CreditCard, color: '#3B82F6', bg: ['#DBEAFE', '#BFDBFE'], onPress: () => router.push('/(tabs)/make-payment'), testID: 'goMakePayment' },
    { key: 'chats', label: 'Chats', icon: MessageCircle, color: '#A855F7', bg: ['#F3E8FF', '#E9D5FF'], onPress: () => router.push('/(tabs)/chats'), testID: 'goChats' },
    { key: 'reports', label: 'Reports', icon: FileText, color: '#6B7280', bg: ['#F3F4F6', '#E5E7EB'], onPress: () => router.push('/(tabs)/reports'), testID: 'goReports' },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, color: '#06B6D4', bg: ['#CFFAFE', '#A5F3FC'], onPress: () => router.push('/(tabs)/analytics'), testID: 'goAnalytics' },
    { key: 'chain', label: 'Blockchain', icon: CircuitBoard, color: '#1D4ED8', bg: ['#DBEAFE', '#93C5FD'], onPress: () => router.push('/(tabs)/profile?to=chain'), testID: 'goBlockchain' },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, color: '#374151', bg: ['#E5E7EB', '#D1D5DB'], onPress: () => router.push('/(tabs)/profile'), testID: 'goSettings' },
  ];

  const currency = (n) => {
    try {
      return `NLe ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(n ?? 0))}`;
    } catch (e) {
      try {
        return `NLe ${Number(n ?? 0).toFixed(2)}`;
      } catch {
        return `NLe 0.00`;
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 28 }}>
        <LinearGradient colors={[palette.primary, '#0F2A6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.headerGreet}>{user.name ? `Hello, ${user.name.split(' ')[0]}` : 'Welcome back, Friend!'}</Text>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceValue}>{currency(totalAll)}</Text>
              <View style={styles.miniTotalsRow}>
                <View style={styles.miniPill}><Text style={styles.miniPillText}>Wallet: {currency(walletBalance)}</Text></View>
                <View style={styles.miniPill}><Text style={styles.miniPillText}>Groups: {currency(groupContrib)}</Text></View>
                <View style={styles.miniPill}><Text style={styles.miniPillText}>Goals: {currency(goalsContrib)}</Text></View>
              </View>
            </View>
            <PressableScale onPress={() => router.push('/(tabs)/profile')} testID="editProfileFromHome">
              <View style={styles.avatarWrap}>
                <Image source={{ uri: 'https://i.pravatar.cc/100?img=15' }} style={styles.avatar} />
              </View>
            </PressableScale>
          </View>
        </LinearGradient>

        <View style={styles.quickRow}>
          <PressableScale onPress={() => router.push('/(tabs)/wallet')} testID="quickWallet" style={styles.quickPill}>
            <LinearGradient colors={[palette.teal, '#2DD4BF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickInner}>
              <WalletIcon color="#052e2b" size={18} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.quickLabel}>Wallet</Text>
                <Text style={styles.quickAmount}>{currency(walletBalance)}</Text>
              </View>
            </LinearGradient>
          </PressableScale>
          <PressableScale onPress={() => router.push('/(tabs)/groups')} testID="quickGroups" style={styles.quickPill}>
            <LinearGradient colors={[palette.green, '#34D399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickInner}>
              <Users color="#064e3b" size={18} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.quickLabel}>Groups</Text>
                <Text style={styles.quickAmount}>{currency(groupContrib)}</Text>
              </View>
            </LinearGradient>
          </PressableScale>
          <PressableScale onPress={() => router.push('/(tabs)/savings')} testID="quickGoals" style={styles.quickPill}>
            <LinearGradient colors={[palette.gold, '#FDE68A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickInner}>
              <PiggyBank color="#7c2d12" size={18} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.quickLabel}>Goals</Text>
                <Text style={styles.quickAmount}>{currency(goalsContrib)}</Text>
              </View>
            </LinearGradient>
          </PressableScale>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.grid}>
            {grid.map((g) => (
              <FeatureTile key={g.key} label={g.label} Icon={g.icon} colors={{ icon: g.color, bg: g.bg, onPress: g.onPress, testID: g.testID }} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }} style={{ marginLeft: -4 }}>
            {mm && (
              <PressableScale onPress={() => router.push('/(tabs)/profile')} testID="pmMM" style={styles.pmCardWrap}>
                <View style={styles.pmCard}>
                  <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Mtn-logo.jpg' }} style={styles.pmLogo} />
                  <Text style={styles.pmTitle}>{mm.provider || 'Mobile Money'}</Text>
                  <Text style={styles.pmSub}>{String(mm.number||'').slice(0,4)}****{String(mm.number||'').slice(-2)}</Text>
                </View>
              </PressableScale>
            )}
            {(banks||[]).map((b) => (
              <PressableScale key={b.id} onPress={() => router.push('/(tabs)/profile')} testID={`pmBank-${b.id}`} style={styles.pmCardWrap}>
                <View style={styles.pmCard}>
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png' }} style={styles.pmLogo} />
                  <Text style={styles.pmTitle}>{b.bank || 'Bank'}</Text>
                  <Text style={styles.pmSub}>{'*'.repeat(Math.max(0, String(b.number||'').length-4))}{String(b.number||'').slice(-4)}</Text>
                </View>
              </PressableScale>
            ))}
            <PressableScale onPress={() => router.push('/(tabs)/profile')} testID="pmAdd" style={styles.pmCardWrap}>
              <View style={[styles.pmCard, { borderStyle: 'dashed', borderWidth: 2, borderColor: palette.primary, backgroundColor: '#fff' }]}>
                <Text style={[styles.pmTitle, { color: palette.primary }]}>+ Add Payment Method</Text>
              </View>
            </PressableScale>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1 },

  headerCard: { margin: 20, marginBottom: 10, borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  headerGreet: { color: '#E5E7EB', fontSize: 16, fontWeight: '700' },
  balanceLabel: { color: '#C7D2FE', marginTop: 6 },
  balanceValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 2 },
  miniTotalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  miniPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  miniPillText: { color: '#E5E7EB', fontWeight: '700' },

  quickRow: { paddingHorizontal: 20, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  quickPill: { flex: 1, marginRight: 10 },
  quickInner: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
  quickLabel: { color: '#052e2b', fontWeight: '700', fontSize: 12 },
  quickAmount: { color: '#052e2b', fontWeight: '900', fontSize: 14 },

  section: { paddingHorizontal: 20, marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: palette.text, marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  featureWrap: { width: '33.3333%', padding: 6 },
  featureInner: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tileText: { marginTop: 8, fontWeight: '700', color: palette.text, fontSize: 12, textAlign: 'center' },

  pmCardWrap: { paddingRight: 12, paddingLeft: 4 },
  pmCard: { width: 160, height: 96, backgroundColor: palette.grayCard, borderRadius: 14, padding: 12, alignItems: 'flex-start', justifyContent: 'center' },
  pmLogo: { width: 28, height: 28, borderRadius: 6, marginBottom: 8 },
  pmTitle: { color: palette.text, fontWeight: '800' },
  pmSub: { color: '#6B7280', fontSize: 12 },

  avatarWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: 46, height: 46 },
});