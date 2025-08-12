import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';

const palette = {
  bg: '#F7F7FA',
  text: '#0F172A',
  sub: '#6B7280',
  card: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  orange: '#FF7A00',
};

export default function ReverseTransactionScreen() {
  const [payments, setPayments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('payments');
        const list = raw ? JSON.parse(raw) : [];
        const sorted = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPayments(sorted);
      } catch (e) {
        console.log('[ReverseTx] load payments error', e);
        Alert.alert('Error', 'Failed to load transactions');
      }
    })();
  }, []);

  const selected = useMemo(() => (payments || []).find((p) => p.id === selectedId), [payments, selectedId]);

  const isWithinOneHour = useMemo(() => {
    if (!selected?.date) return false;
    try {
      const diffMs = Date.now() - new Date(selected.date).getTime();
      return diffMs <= 60 * 60 * 1000;
    } catch {
      return false;
    }
  }, [selected]);

  const canSubmit = !!selected && !!password && !submitting && isWithinOneHour && !selected?.reversed;

  const formatAmount = useCallback((n) => {
    const val = Number(n || 0);
    return `NLe ${new Intl.NumberFormat('en-SL', { maximumFractionDigits: 2 }).format(val)}`;
  }, []);

  const formatDate = useCallback((iso) => {
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString('en-GB');
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `${date} ${time}`;
    } catch {
      return iso;
    }
  }, []);

  const attemptReverse = async () => {
    if (!selected) return;
    if (!password) { Alert.alert('Required', 'Enter your password to proceed'); return; }
    if (!isWithinOneHour) { Alert.alert('Unavailable', 'Reversal is only possible within 1 hour of the original transaction'); return; }
    if (selected.reversed) { Alert.alert('Already reversed', 'This transaction was already reversed'); return; }

    setSubmitting(true);
    console.log('[ReverseTx] attempting reversal', selected.id);
    try {
      const raw = await AsyncStorage.getItem('payments');
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((x) => x.id === selected.id);
      if (idx === -1) { throw new Error('Transaction not found'); }

      list[idx] = { ...list[idx], reversed: true, reversedAt: new Date().toISOString() };

      const walletRaw = await AsyncStorage.getItem('walletTx');
      const wallet = walletRaw ? JSON.parse(walletRaw) : [];
      const refund = { id: `refund_${selected.id}`, type: 'topup', amount: Number(selected.amount || 0), note: `Reversal refund for ${selected.id}`, date: new Date().toISOString() };

      await AsyncStorage.multiSet([
        ['payments', JSON.stringify(list)],
        ['walletTx', JSON.stringify([refund, ...wallet])],
      ]);

      setPayments(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setPassword('');
      Alert.alert('Reversal requested', 'If the reversal is successful, funds will be returned to your account.');
      router.back();
    } catch (e) {
      console.log('[ReverseTx] reverse error', e);
      Alert.alert('Error', e?.message ?? 'Failed to request reversal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" testID="backBtn"><ArrowLeft color={palette.text} /></TouchableOpacity>
        <Text style={styles.title}>Reverse Transaction</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionTitle}>Select Transaction</Text>

        {(payments || []).slice(0, 15).map((tx) => (
          <TouchableOpacity
            key={tx.id}
            onPress={() => setSelectedId(tx.id === selectedId ? '' : tx.id)}
            style={[styles.txItem, selectedId === tx.id && styles.txItemActive]}
            testID={`pickTx-${tx.id}`}
          >
            <Image source={{ uri: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.txName}>{tx.note?.replace(/^Group Payment - /, '') || 'Payment'}</Text>
              <Text style={styles.txSub} numberOfLines={1}>{(tx.payerId ? 'Sent' : 'Sent')} • {formatAmount(tx.amount)} • {formatDate(tx.date)}</Text>
            </View>
            <Text style={[styles.chev, selectedId === tx.id && { color: palette.primary }]}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Confirmation</Text>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmText}>You are about to attempt to reverse the following transaction:</Text>

          {selected ? (
            <View style={styles.confirmTxRow}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop' }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.txName}>{selected.note?.replace(/^Group Payment - /, '') || 'Payment'}</Text>
                <Text style={styles.txSub}>{(selected.payerId ? 'Sent' : 'Sent')} • {formatAmount(selected.amount)} • {formatDate(selected.date)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.txSub}>Select a transaction above</Text>
          )}

          <Text style={[styles.disclaimer, { marginTop: 8 }]}>Reversal may not be possible depending on the recipient’s bank/provider and the transaction status. Reversals are typically only possible within 1 hour of the original transaction. If the reversal is successful, the funds will be returned to your account.</Text>

          <View style={{ marginTop: 12 }}>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                testID="reversePassword"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          disabled={!canSubmit}
          onPress={attemptReverse}
          style={[styles.primaryBtn, (!canSubmit) && { opacity: 0.5 }]}
          testID="attemptReversalBtn"
        >
          <ShieldCheck color="#fff" />
          <Text style={styles.primaryBtnText}>{submitting ? 'Processing...' : 'Attempt Reversal'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: palette.bg },
  title: { fontSize: 18, fontWeight: '800', color: palette.text },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: palette.text, marginTop: 12, marginHorizontal: 16, marginBottom: 8 },

  txItem: { marginHorizontal: 16, marginBottom: 8, backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, borderColor: palette.border, padding: 12, flexDirection: 'row', alignItems: 'center' },
  txItemActive: { borderColor: palette.primary, backgroundColor: '#F0F6FF' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  txName: { fontWeight: '700', color: palette.text },
  txSub: { color: palette.sub, marginTop: 2 },
  chev: { color: '#9CA3AF', fontSize: 24, marginLeft: 8 },

  confirmCard: { backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, borderColor: palette.border, padding: 12, marginHorizontal: 16 },
  confirmText: { color: palette.text, marginBottom: 10, fontWeight: '600' },
  confirmTxRow: { flexDirection: 'row', alignItems: 'center' },
  disclaimer: { color: palette.sub },

  inputBox: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: '#F9FAFB' },
  input: { height: 48, paddingHorizontal: 12, color: palette.text },

  primaryBtn: { marginHorizontal: 16, marginTop: 16, height: 50, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
});
