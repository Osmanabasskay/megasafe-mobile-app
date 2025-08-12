import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, SafeAreaView, Animated, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Users, PiggyBank, Wallet as WalletIcon, HandCoins, CreditCard, CircuitBoard, Settings as SettingsIcon, MessageCircle, BarChart3, FileText, Link as LinkIcon, Home, Building2 } from 'lucide-react-native';
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
  const [groupsPreview, setGroupsPreview] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [ud, mmRaw, banksRaw, pays, wtx, groupsRaw] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('mobileMoney'),
          AsyncStorage.getItem('linkedBanks'),
          AsyncStorage.getItem('payments'),
          AsyncStorage.getItem('walletTx'),
          AsyncStorage.getItem('availableGroups'),
        ]);
        if (ud) setUser(JSON.parse(ud));
        if (mmRaw) setMm(JSON.parse(mmRaw));
        if (banksRaw) setBanks(JSON.parse(banksRaw));
        if (pays) setPayments(JSON.parse(pays));
        if (wtx) setWalletTx(JSON.parse(wtx));
        if (groupsRaw) {
          try {
            const gs = JSON.parse(groupsRaw);
            setGroupsPreview(Array.isArray(gs) ? gs.slice(0, 5) : []);
          } catch {}
        }
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
    { key: 'link-om', label: 'Orange Money', icon: LinkIcon, color: '#f59e0b', bg: ['#0f172a', '#0b1222'], onPress: () => router.push('/(tabs)/profile'), testID: 'linkOM' },
    { key: 'link-afri', label: 'AfriMoney', icon: LinkIcon, color: '#16a34a', bg: ['#334155', '#3f4a5a'], onPress: () => router.push('/(tabs)/profile'), testID: 'linkAfri' },
    { key: 'link-qcell', label: 'QMoney', icon: LinkIcon, color: '#0ea5e9', bg: ['#111827', '#1f2937'], onPress: () => router.push('/(tabs)/profile'), testID: 'linkQcell' },
  ];

  const currency = (n) => `NLe ${new Intl.NumberFormat('en-SL', { maximumFractionDigits: 2 }).format(n)}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.bigTitle}>Transaction Summary</Text>
        <View style={styles.summaryCard}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop' }} style={styles.summaryImage} />
          <View style={{ padding: 12 }}>
            <Text style={styles.balanceValue}>{currency(totalAll)}</Text>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.activityLine}>Recent Activity: Sent NLe 500 to Group,</Text>
            <Text style={styles.activityLine}>Received NLe 1,200 from User</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Link Account</Text>
          <View style={styles.grid}>
            {grid.map((g) => (
              <FeatureTile key={g.key} label={g.label} Icon={g.icon} colors={{ icon: g.color, bg: g.bg, onPress: g.onPress, testID: g.testID }} />
            ))}
          </View>
          {!!mm && <Text style={styles.gridCaption}>Orange Money Linked</Text>}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Make Payment</Text>
          <View style={styles.grid}>
            {[ 
              { key: 'pay-mm', label: 'Pay with Mobile Money', icon: WalletIcon, color: '#fff', bg: ['#0b1222', '#0f172a'], onPress: () => router.push('/(tabs)/make-payment') },
              { key: 'pay-bank', label: 'Send via Bank', icon: Building2, color: '#0f172a', bg: ['#ffd3c2', '#ffe2d6'], onPress: () => router.push('/(tabs)/make-payment') },
              { key: 'pay-receive', label: 'Receive Payment', icon: CreditCard, color: '#0b3b2e', bg: ['#cde9db', '#bfe3d3'], onPress: () => router.push('/(tabs)/wallet') },
            ].map((g) => (
              <FeatureTile key={g.key} label={g.label} Icon={g.icon} colors={{ icon: g.color, bg: g.bg, onPress: g.onPress, testID: g.key }} />
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Savings Goals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {[{ key:'rent', title:'House Rent', sub:`${currency(2500)} / ${currency(10000)}`, bg:['#c6e0da','#86b3aa'], icon: Home }, { key:'school', title:'School Fees', sub:`${currency(1200)} / ${currency(5000)}`, bg:['#c5dee6','#7aa3b5'], icon: FileText }].map(card => (
              <PressableScale key={card.key} onPress={() => router.push('/(tabs)/savings')} testID={`goal-${card.key}`} style={{ paddingRight: 12 }}>
                <LinearGradient colors={card.bg} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.goalCard}>
                  <card.icon color="#0b1f2a" size={28} />
                </LinearGradient>
                <Text style={styles.goalTitle}>{card.title}</Text>
                <Text style={styles.goalSub}>{card.sub}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Loans</Text>
          <View style={styles.grid}>
            {[ 
              { key: 'loan-ind', label: 'Individual Loans', icon: FileText, color:'#0b3b2e', bg:['#b8d9d2','#91c3ba'], onPress: ()=>router.push('/(tabs)/loans') },
              { key: 'loan-group', label: 'Group Loans', icon: Users, color:'#093a3e', bg:['#b7d6d2','#8fbfb9'], onPress: ()=>router.push('/(tabs)/loans') },
              { key: 'loan-org', label: 'Organizational Loans', icon: Building2, color:'#0b1f2a', bg:['#dfe7e1','#cddbd3'], onPress: ()=>router.push('/(tabs)/loans') },
            ].map((g)=>(
              <FeatureTile key={g.key} label={g.label} Icon={g.icon} colors={{ icon:g.color, bg:g.bg, onPress:g.onPress, testID:g.key }} />
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>My Groups</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {(groupsPreview || []).map((g) => (
              <PressableScale key={g.id} onPress={() => router.push('/(tabs)/groups')} testID={`group-${g.id}`} style={{ paddingRight: 12 }}>
                <LinearGradient colors={['#d7e5d6','#a7c3a5']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.groupCardMini}>
                  <Text style={styles.groupLogoText}>{(g.name||'G').slice(0,1).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={styles.groupNameMini}>{g.name}</Text>
                <Text style={styles.groupSubMini}>{g.members} members, {currency(g.amount)}/{(g.frequency||'').toLowerCase()}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1 },

  bigTitle: { fontSize: 20, fontWeight: '800', color: palette.text, marginTop: 16, marginHorizontal: 16, marginBottom: 8, fontFamily: 'Montserrat' },
  summaryCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  summaryImage: { width: '100%', height: 140, backgroundColor: '#e5e7eb' },
  balanceLabel: { color: '#6b7280', marginTop: 4 },
  balanceValue: { color: '#111827', fontSize: 22, fontWeight: '800', marginTop: 8, fontFamily: 'Montserrat' },
  activityLine: { color: '#6b7280', marginTop: 4 },

  sectionBlock: { marginTop: 18 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: palette.text, marginHorizontal: 16, marginBottom: 10, fontFamily: 'Montserrat' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  featureWrap: { width: '33.3333%', padding: 8 },
  featureInner: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  iconBg: { width: 60, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileText: { marginTop: 8, fontWeight: '700', color: palette.text, fontSize: 12, textAlign: 'center', fontFamily: 'Montserrat' },
  gridCaption: { color: '#6b7280', marginLeft: 16, marginTop: -4 },

  goalCard: { width: 148, height: 120, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalTitle: { marginTop: 8, marginLeft: 4, color: palette.text, fontWeight: '700' },
  goalSub: { marginLeft: 4, color: '#6b7280', fontSize: 12 },

  groupCardMini: { width: 148, height: 120, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  groupLogoText: { fontSize: 22, fontWeight: '800', color: '#243b2f' },
  groupNameMini: { marginTop: 8, marginLeft: 4, color: palette.text, fontWeight: '700' },
  groupSubMini: { marginLeft: 4, color: '#6b7280', fontSize: 12 },
});