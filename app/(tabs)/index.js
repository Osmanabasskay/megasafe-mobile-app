import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, SafeAreaView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Users, Wallet as WalletIcon, CreditCard, FileText, Link as LinkIcon, Home, Building2, Banknote, Coins, RotateCcw, Zap, PiggyBank, HandCoins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const palette = {
  primary: '#0B5FFF',
  orange: '#FF7A00',
  blueDark: '#0A1B3E',
  bg: '#F6F8FF',
  text: '#0F172A',
  grayCard: '#EEF2FF',
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
      <View style={styles.featureInnerSquare}>
        <LinearGradient colors={colors.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBgSquare}>
          <Icon color={colors.icon} size={24} />
        </LinearGradient>
        <Text style={styles.tileText}>{label}</Text>
      </View>
    </PressableScale>
  );
}

function SectionHeader({ title, Icon, gradient, testID }) {
  return (
    <View style={styles.headerRow}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBadge}>
        <Icon size={16} color="#fff" />
      </LinearGradient>
      <Text style={styles.sectionHeader} testID={testID}>{title}</Text>
    </View>
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
    { key: 'add-bank', label: 'Add Bank', icon: Banknote, color: '#ffffff', bg: [palette.primary, '#1449CC'], onPress: () => router.push('/(tabs)/wallet'), testID: 'addBank' },
    { key: 'link-crypto', label: 'Link Crypto', icon: Coins, color: '#ffffff', bg: [palette.orange, '#FF8F33'], onPress: () => router.push('/(tabs)/blockchain'), testID: 'linkCrypto' },
    { key: 'link-om', label: 'Orange Money', icon: LinkIcon, color: '#ffffff', bg: ['#1E293B', '#0F172A'], onPress: () => router.push('/(tabs)/profile'), testID: 'linkOM' },
  ];

  const currency = (n) => `NLe ${new Intl.NumberFormat('en-SL', { maximumFractionDigits: 2 }).format(n)}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgDecor} pointerEvents="none">
        <LinearGradient colors={["#e0ecff", "#f5f7ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bgDecorGrad} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.bigTitle}>Home</Text>
        <LinearGradient colors={[palette.primary, '#102B73']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCardNew}>
          <View style={{ padding: 16 }}>
            <Text style={styles.balanceLabelLight}>Balance</Text>
            <Text style={styles.balanceValueLight}>{currency(totalAll)}</Text>
            <View style={styles.activityRow}>
              <Text style={styles.activityLight}>Recent Activity</Text>
              <View style={styles.receivedBadge} testID="receivedBadge">
                <Text style={styles.receivedBadgeText}>Received</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <SectionHeader title="Quick Links" Icon={Zap} gradient={[palette.primary, '#2E7CFB']} testID="header-quick-links" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
            {grid.map((g) => (
              <FeatureTile key={g.key} label={g.label} Icon={g.icon} colors={{ icon: g.color, bg: g.bg, onPress: g.onPress, testID: g.testID }} />
            ))}
          </ScrollView>
          {!!mm && <Text style={styles.gridCaption}>Orange Money Linked</Text>}
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title="Payments" Icon={WalletIcon} gradient={[palette.orange, '#FF9C3B']} testID="header-payments" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
            {[ 
              { key: 'pay-mm', label: 'Mobile Money', icon: WalletIcon, color: '#ffffff', bg: [palette.primary, '#1449CC'], onPress: () => router.push('/(tabs)/make-payment') },
              { key: 'pay-bank', label: 'Send via Bank', icon: Building2, color: '#0A1B3E', bg: ['#E0ECFF', '#CFE0FF'], onPress: () => router.push('/(tabs)/make-payment') },
              { key: 'pay-receive', label: 'Receive', icon: CreditCard, color: '#0A1B3E', bg: ['#FFE2CC', '#FFD0AD'], onPress: () => router.push('/(tabs)/wallet') },
              { key: 'reverse', label: 'Reverse Payment', icon: RotateCcw, color: '#ffffff', bg: [palette.orange, '#FF8F33'], onPress: () => router.push('/(tabs)/reverse-transaction') },
            ].map((g) => (
              <FeatureTile key={g.key} label={g.label} Icon={g.icon} colors={{ icon: g.color, bg: g.bg, onPress: g.onPress, testID: g.key }} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title="Savings Goals" Icon={PiggyBank} gradient={["#34d399", "#059669"]} testID="header-savings" />
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
          <SectionHeader title="Loans" Icon={HandCoins} gradient={["#60a5fa", "#3b82f6"]} testID="header-loans" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
            {[ 
              { key: 'loan-ind', label: 'Individual Loans', icon: FileText, color:'#0b3b2e', bg:['#b8d9d2','#91c3ba'], onPress: ()=>router.push('/(tabs)/loans') },
              { key: 'loan-group', label: 'Group Loans', icon: Users, color:'#093a3e', bg:['#b7d6d2','#8fbfb9'], onPress: ()=>router.push('/(tabs)/loans') },
              { key: 'loan-org', label: 'Organizational Loans', icon: Building2, color:'#0b1f2a', bg:['#dfe7e1','#cddbd3'], onPress: ()=>router.push('/(tabs)/loans') },
            ].map((g)=>(
              <FeatureTile key={g.key} label={g.label} Icon={g.icon} colors={{ icon:g.color, bg:g.bg, onPress:g.onPress, testID:g.key }} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title="My Groups" Icon={Users} gradient={["#f59e0b", "#ef4444"]} testID="header-groups" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {(() => {
              const defaults = [
                { id: 'msc', name: 'Monthly Savers Circle', members: 24, amount: 5000, frequency: 'Monthly' },
                { id: 'wig', name: 'Weekly Investment Group', members: 18, amount: 2000, frequency: 'Weekly' },
              ];
              const list = Array.isArray(groupsPreview) && groupsPreview.length > 0 ? groupsPreview : defaults;
              return list.map((g) => (
                <PressableScale key={g.id} onPress={() => router.push('/(tabs)/groups')} testID={`group-${g.id}`} style={{ paddingRight: 12 }}>
                  <LinearGradient colors={['#FDE68A','#FCA5A5']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.groupCardMini}>
                    <Users color="#243b2f" size={26} />
                  </LinearGradient>
                  <Text style={styles.groupNameMini}>{g.name}</Text>
                  <Text style={styles.groupSubMini}>{g.members} members, {currency(g.amount)}/{(g.frequency||'').toLowerCase()}</Text>
                </PressableScale>
              ))
            })()}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  bgDecor: { position: 'absolute', top: 0, left: 0, right: 0, height: 260, zIndex: -1 },
  bgDecorGrad: { flex: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  scroll: { flex: 1 },

  bigTitle: { fontSize: 22, fontWeight: '800', color: palette.text, marginTop: 16, marginHorizontal: 16, marginBottom: 8 },

  summaryCardNew: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  balanceLabelLight: { color: '#DCE7FF' },
  balanceValueLight: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 6 },
  activityRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityLight: { color: '#E6EEFF', fontWeight: '600' },
  receivedBadge: { backgroundColor: palette.orange, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  receivedBadgeText: { color: '#FFFFFF', fontWeight: '800' },

  sectionBlock: { marginTop: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10 },
  headerBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: palette.text },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  featureWrap: { width: 168, padding: 8 },
  featureInnerSquare: { backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4, padding: 12, borderWidth: 1, borderColor: '#E6ECFF' },
  iconBgSquare: { width: 120, height: 88, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileText: { marginTop: 10, fontWeight: '800', color: palette.text, fontSize: 13, textAlign: 'center' },
  gridCaption: { color: '#6b7280', marginLeft: 16, marginTop: -4 },

  goalCard: { width: 180, height: 120, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
  goalTitle: { marginTop: 10, marginLeft: 6, color: palette.text, fontWeight: '800' },
  goalSub: { marginLeft: 6, color: '#6b7280', fontSize: 12 },

  groupCardMini: { width: 180, height: 120, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
  groupLogoText: { fontSize: 24, fontWeight: '800', color: '#243b2f' },
  groupNameMini: { marginTop: 8, marginLeft: 4, color: palette.text, fontWeight: '700' },
  groupSubMini: { marginLeft: 4, color: '#6b7280', fontSize: 12 },
});