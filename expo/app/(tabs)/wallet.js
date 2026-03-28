import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, CreditCard, PiggyBank, Users as UsersIcon } from 'lucide-react-native';

export default function WalletScreen() {
  const [tx, setTx] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [raw, pays] = await Promise.all([
          AsyncStorage.getItem('walletTx'),
          AsyncStorage.getItem('payments'),
        ]);
        if (raw) setTx(JSON.parse(raw));
        if (pays) setPayments(JSON.parse(pays));
      } catch (e) { console.log('[Wallet] load', e); }
    })();
  }, []);

  const balance = useMemo(() => {
    try {
      const top = (tx || []).filter(t => t.type === 'topup').reduce((s, t) => s + Number(t.amount || 0), 0);
      const out = (tx || []).filter(t => t.type === 'withdraw' || t.type === 'spend').reduce((s, t) => s + Number(t.amount || 0), 0);
      return Math.max(0, top - out);
    } catch { return 0; }
  }, [tx]);

  const groupsTotal = useMemo(() => {
    try { return (payments || []).filter(p => p.groupId).reduce((s, p) => s + Number(p.amount || 0), 0); } catch { return 0; }
  }, [payments]);

  const goalsTotal = useMemo(() => {
    try { return (payments || []).filter(p => String(p.note || '').startsWith('Savings Deposit - ')).reduce((s, p) => s + Number(p.amount || 0), 0); } catch { return 0; }
  }, [payments]);

  const grandTotal = balance + groupsTotal + goalsTotal;

  const save = async (list) => {
    setTx(list);
    await AsyncStorage.setItem('walletTx', JSON.stringify(list));
  };

  const addTx = async (type) => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    const entry = { id: Date.now().toString(), type, amount: n, note: note.trim(), date: new Date().toISOString() };
    await save([entry, ...tx]);
    setAmount('');
    setNote('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.rowBetween}>
      <View style={styles.rowLeft}>
        <CreditCard color={item.type === 'topup' ? '#4CAF50' : '#e67e22'} size={18} />
        <View>
          <Text style={styles.rowTitle}>{item.type === 'topup' ? 'Top up' : item.type === 'withdraw' ? 'Withdraw' : 'Spend'}</Text>
          <Text style={styles.smallMuted}>{new Date(item.date).toLocaleString()}</Text>
        </View>
      </View>
      <Text style={[styles.bold, { color: item.type === 'topup' ? '#4CAF50' : '#e67e22' }]}>NLe {Number(item.amount).toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.totalsCard}>
          <Text style={styles.totalsLabel}>Total (Wallet + Groups + Goals)</Text>
          <Text style={styles.totalsValue}>NLe {grandTotal.toFixed(2)}</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalsChip}><WalletIcon color="#FFA500" size={16} /><Text style={styles.totalsChipText}> Wallet {balance.toFixed(2)}</Text></View>
            <View style={styles.totalsChip}><UsersIcon color="#5CCEF4" size={16} /><Text style={styles.totalsChipText}> Groups {groupsTotal.toFixed(2)}</Text></View>
            <View style={styles.totalsChip}><PiggyBank color="#4CAF50" size={16} /><Text style={styles.totalsChipText}> Goals {goalsTotal.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <WalletIcon color="#FFA500" size={26} />
            <View>
              <Text style={styles.headerTitle}>Wallet</Text>
              <Text style={styles.headerSubtitle}>Balance</Text>
            </View>
          </View>
          <Text style={styles.balance}>NLe {balance.toFixed(2)}</Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={(t)=>setAmount(t.replace(/[^0-9.]/g,''))} keyboardType="numeric" />
          <TextInput style={[styles.input, { flex: 2 }]} placeholder="Note (optional)" value={note} onChangeText={setNote} />
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => addTx('topup')} testID="walletTopup">
            <ArrowDownToLine color="#fff" size={18} />
            <Text style={styles.primaryBtnText}>Top up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => addTx('withdraw')} testID="walletWithdraw">
            <ArrowUpFromLine color="#FFA500" size={18} />
            <Text style={styles.secondaryBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {tx.length === 0 ? (
            <Text style={styles.muted}>No transactions</Text>
          ) : (
            <FlatList data={tx} renderItem={renderItem} keyExtractor={(i)=>i.id} scrollEnabled={false} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flex: 1 },
  totalsCard: { backgroundColor: '#fff', margin: 16, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  totalsLabel: { color: '#666' },
  totalsValue: { fontSize: 20, fontWeight: '800', color: '#333', marginTop: 6 },
  totalsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  totalsChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5e6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  totalsChipText: { color: '#FFA500', fontWeight: '700' },

  headerCard: { backgroundColor: '#fff', margin: 16, padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#333' },
  headerSubtitle: { color: '#666' },
  balance: { fontSize: 20, fontWeight: '800', color: '#333' },
  inputRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  input: { flex: 1, height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, color: '#333' },
  actions: { padding: 16, gap: 10 },
  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: '#FFA500', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: { height: 48, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: '#FFA500', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryBtnText: { color: '#FFA500', fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { color: '#333', fontWeight: '600' },
  smallMuted: { color: '#999', fontSize: 12 },
  bold: { color: '#333', fontWeight: '800' },
});