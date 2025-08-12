import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreditCard, Users } from 'lucide-react-native';

export default function MakePaymentScreen() {
  const [groups, setGroups] = useState([]);
  const [mm, setMm] = useState(null);
  const [banks, setBanks] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [forSelf, setForSelf] = useState(true);
  const [method, setMethod] = useState('mm');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [note, setNote] = useState('');
  const [user, setUser] = useState({ id: 'guest', name: 'You', phone: '' });
  const [otherPhone, setOtherPhone] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [recipientAccountName, setRecipientAccountName] = useState('');
  const [recipientAccountHolder, setRecipientAccountHolder] = useState('');
  const [showBanks, setShowBanks] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [gr, mmRaw, banksRaw, ud] = await Promise.all([
          AsyncStorage.getItem('availableGroups'),
          AsyncStorage.getItem('mobileMoney'),
          AsyncStorage.getItem('linkedBanks'),
          AsyncStorage.getItem('userData'),
        ]);
        if (gr) setGroups(JSON.parse(gr));
        if (mmRaw) setMm(JSON.parse(mmRaw));
        if (banksRaw) setBanks(JSON.parse(banksRaw));
        if (ud) {
          const u = JSON.parse(ud); setUser({ id: u.phone || 'guest', name: u.name || 'You', phone: u.phone || '' });
        }
      } catch (e) { console.log('[MakePayment] load', e); }
    })();
  }, []);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }

    if (forSelf) {
      if (method === 'mm' && !mm?.number) { Alert.alert('Setup', 'Add Mobile Money in Profile > Payment Method'); return; }
      if (method === 'bank' && !selectedBankId && !accountNumber) { Alert.alert('Bank', 'Select a linked bank or enter an account number'); return; }
    } else {
      if (method === 'mm' && !otherPhone) { Alert.alert('Phone required', 'Enter recipient mobile money number'); return; }
      if (method === 'bank') {
        if (!recipientBank) { Alert.alert('Choose bank', 'Select the recipient bank'); return; }
        if (!recipientAccountName) { Alert.alert('Account name', 'Enter the account name'); return; }
        if (!recipientAccountHolder) { Alert.alert('Account holder', 'Enter the account holder'); return; }
        if (!accountNumber) { Alert.alert('Account number', 'Enter the account number'); return; }
      }
    }

    try {
      const paymentsRaw = await AsyncStorage.getItem('payments');
      const list = paymentsRaw ? JSON.parse(paymentsRaw) : [];
      let label = 'Other Payment';
      let groupId = '';
      if (selectedGroupId) {
        const g = (groups || []).find((x) => x.id === selectedGroupId);
        label = `Group Payment - ${g ? g.name : selectedGroupId}`;
        groupId = selectedGroupId;
      } else if (forSelf) {
        label = method === 'mm' ? 'Self Mobile Money' : method === 'bank' ? 'Self Bank Deposit' : 'Self Physical Payment';
      } else {
        label = method === 'mm' ? 'Other Mobile Money' : method === 'bank' ? 'Other Bank Transfer' : 'Other Physical Payment';
      }

      const entry = {
        id: Date.now().toString(),
        amount: amt,
        note: label + (note ? ` • ${note}` : ''),
        date: new Date().toISOString(),
        groupId,
        payerId: user.id,
        method,
        number: method === 'mm'
          ? (forSelf ? (mm?.number || '') : otherPhone)
          : (forSelf ? (banks.find(b => b.id === selectedBankId)?.number || accountNumber || '') : accountNumber),
        recipient: !forSelf ? {
          phone: method === 'mm' ? otherPhone : '',
          bank: method === 'bank' ? recipientBank : '',
          accountName: method === 'bank' ? recipientAccountName : '',
          accountHolder: method === 'bank' ? recipientAccountHolder : '',
        } : undefined,
      };
      await AsyncStorage.setItem('payments', JSON.stringify([...list, entry]));
      Alert.alert('Success', 'Payment saved');
      setAmount(''); setAccountNumber(''); setNote(''); setOtherPhone(''); setRecipientBank(''); setRecipientAccountName(''); setRecipientAccountHolder('');
    } catch (e) { console.log('[MakePayment] save', e); Alert.alert('Error', 'Failed to save'); }
  };

  const maskAcct = (n) => (n && n.length > 4 ? `${'*'.repeat(Math.max(0, n.length - 4))}${n.slice(-4)}` : n);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}><CreditCard color="#FFA500" size={24} /><Text style={styles.headerText}>Make Payment</Text></View>

          <Text style={styles.label}>Osusu Groups</Text>
          {(groups || []).length === 0 ? (
            <View style={styles.infoCard}><Text style={styles.muted}>No groups found</Text></View>
          ) : (
            groups.map((g) => (
              <TouchableOpacity key={g.id} style={[styles.selector, selectedGroupId === g.id && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setSelectedGroupId(selectedGroupId === g.id ? '' : g.id)} testID={`pickPayGroup-${g.id}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Users color="#5CCEF4" size={18} />
                  <Text style={styles.selectorText}>{g.name}</Text>
                </View>
                {selectedGroupId === g.id ? <Text style={styles.selectorArrow}>✓</Text> : <Text style={styles.selectorArrow}>▼</Text>}
              </TouchableOpacity>
            ))
          )}

          <Text style={[styles.label, { marginTop: 10 }]}>Who is this for?</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.pill, forSelf && styles.pillActive]} onPress={() => setForSelf(true)} testID="forSelfBtn"><Text style={[styles.pillText, forSelf && styles.pillTextActive]}>For self</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, !forSelf && styles.pillActive]} onPress={() => setForSelf(false)} testID="forOthersBtn"><Text style={[styles.pillText, !forSelf && styles.pillTextActive]}>For others</Text></TouchableOpacity>
          </View>

          <Text style={styles.label}>Method</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.pill, method==='mm' && styles.pillActive]} onPress={() => { setMethod('mm'); setSelectedBankId(''); }} testID="methodMM"><Text style={[styles.pillText, method==='mm' && styles.pillTextActive]}>Mobile Money</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, method==='bank' && styles.pillActive]} onPress={() => setMethod('bank')} testID="methodBank"><Text style={[styles.pillText, method==='bank' && styles.pillTextActive]}>Bank</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, method==='physical' && styles.pillActive]} onPress={() => { setMethod('physical'); setSelectedBankId(''); }} testID="methodPhysical"><Text style={[styles.pillText, method==='physical' && styles.pillTextActive]}>Physical</Text></TouchableOpacity>
          </View>

          {method === 'mm' ? (
            forSelf ? (
              mm ? (
                <View style={styles.infoCard}><Text style={styles.muted}>Paying with {mm.provider} ({(mm.number||'').slice(0,4)}****{(mm.number||'').slice(-2)})</Text></View>
              ) : (
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('Setup', 'Add Mobile Money in Profile > Payment Method')} testID="setupMMFromPay"><Text style={styles.secondaryBtnText}>Add Mobile Money</Text></TouchableOpacity>
              )
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Mobile Money Number</Text>
                <View style={styles.inputBox}><TextInput testID="otherPhoneInput" style={styles.input} value={otherPhone} onChangeText={setOtherPhone} placeholder="e.g. 07XXXXXXXX" keyboardType="phone-pad" /></View>
              </View>
            )
          ) : null}

          {method === 'bank' ? (
            forSelf ? (
              banks && banks.length > 0 ? (
                banks.map((b) => (
                  <TouchableOpacity key={b.id} style={[styles.selector, selectedBankId === b.id && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setSelectedBankId(selectedBankId === b.id ? '' : b.id)} testID={`pickBank-${b.id}`}>
                    <Text style={styles.selectorText}>{b.bank} • {maskAcct(b.number)}</Text>
                    {selectedBankId === b.id ? <Text style={styles.selectorArrow}>✓</Text> : <Text style={styles.selectorArrow}>▼</Text>}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.infoCard}><Text style={styles.muted}>No linked banks. Link in Profile.</Text></View>
              )
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recipient Bank</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setShowBanks((v)=>!v)} testID="openBankDropdown">
                    <Text style={styles.selectorText}>{recipientBank || 'Choose bank'}</Text>
                    <Text style={styles.selectorArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
                {showBanks ? (
                  BANK_OPTIONS.map((name) => (
                    <TouchableOpacity key={name} style={styles.selector} onPress={() => { setRecipientBank(name); setShowBanks(false); }} testID={`bankOption-${name}`}>
                      <Text style={styles.selectorText}>{name}</Text>
                      {recipientBank === name ? <Text style={styles.selectorArrow}>✓</Text> : <Text style={styles.selectorArrow}>▼</Text>}
                    </TouchableOpacity>
                  ))
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Name</Text>
                  <View style={styles.inputBox}><TextInput testID="recipientAccountName" style={styles.input} value={recipientAccountName} onChangeText={setRecipientAccountName} placeholder="e.g. John S Doe" /></View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Holder</Text>
                  <View style={styles.inputBox}><TextInput testID="recipientAccountHolder" style={styles.input} value={recipientAccountHolder} onChangeText={setRecipientAccountHolder} placeholder="e.g. John Doe" /></View>
                </View>
              </>
            )
          ) : null}

          {(method === 'bank' && ((forSelf && !selectedBankId) || !forSelf)) ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{forSelf ? 'Other Bank Account Number' : 'Recipient Account Number'}</Text>
              <View style={styles.inputBox}><TextInput testID="recipientAccountNumber" style={styles.input} value={accountNumber} onChangeText={setAccountNumber} placeholder="Enter account number" keyboardType="number-pad" /></View>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (NLe)</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={amount} onChangeText={(t)=>setAmount(t.replace(/[^0-9.]/g,''))} placeholder="0.00" keyboardType="numeric" /></View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <View style={styles.inputBox}><TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Reference" /></View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} testID="confirmMakePayment"><Text style={styles.primaryBtnText}>Confirm Payment</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BANK_OPTIONS = [
  'Zenith Bank',
  'GTBank',
  'United Bank for Africa',
  'Ecobank',
  'Standard Chartered',
  'Rokel Commercial Bank',
  'Sierra Leone Commercial Bank',
  'Access Bank',
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#fff' },
  headerText: { fontSize: 18, fontWeight: '800', color: '#333' },
  label: { marginHorizontal: 16, marginTop: 12, color: '#333', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  pillActive: { backgroundColor: '#fff5e6', borderColor: '#FFA500' },
  pillText: { color: '#666', fontWeight: '700' },
  pillTextActive: { color: '#FFA500' },
  selector: { height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 14, marginHorizontal: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorText: { color: '#333' },
  selectorArrow: { color: '#999', fontWeight: '800' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginHorizontal: 16, marginTop: 8 },
  muted: { color: '#777' },
  inputGroup: { marginHorizontal: 16, marginTop: 10 },
  inputLabel: { color: '#333', fontWeight: '700', marginBottom: 6 },
  inputBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff' },
  input: { height: 48, paddingHorizontal: 12, color: '#333' },
  primaryBtn: { margin: 16, height: 48, borderRadius: 12, backgroundColor: '#FFA500', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
});