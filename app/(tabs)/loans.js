import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as ImagePicker from 'expo-image-picker';
import {
  HandCoins,
  Building2,
  FileText,
  ShieldCheck,
  Calendar,
  Clock,
  Percent,
  Users,
  Check,
  X,
  ArrowLeft,
  Download,
  CreditCard,
} from 'lucide-react-native';
import CalendarPicker from '../../components/CalendarPicker';

export default function LoansScreen() {
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState({ name: '', phone: '' });
  const [loans, setLoans] = useState([]);
  const [loanAccounts, setLoanAccounts] = useState([]);
  const [accountType, setAccountType] = useState('individual');
  const [accountForm, setAccountForm] = useState({
    fullName: '', nin: '', idFrontUrl: '', idBackUrl: '', passportUrl: '', address: '', phone: '', email: '',
    institutionName: '', headOfficeAddress: '', ceoName: '', ceoNin: '', ceoIdFrontUrl: '', ceoIdBackUrl: '', ceoPassportUrl: '',
    branchAddress: '', branchManagerName: '', branchManagerNin: '', branchManagerIdFrontUrl: '', branchManagerIdBackUrl: '', branchManagerPassportUrl: '',
    certificate1Url: '', certificate2Url: '',
    orgName: '', officeAddress: '', leaderName: '', leaderNin: '', leaderIdFrontUrl: '', leaderIdBackUrl: '', leaderPassportUrl: '',
    creatorRole: '', creatorName: '', creatorNin: '', creatorIdFrontUrl: '', creatorIdBackUrl: '', creatorPassportUrl: '',
    orgKind: 'NGO',
  });
  const [orgs, setOrgs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [groups, setGroups] = useState([]);
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [mobileMoney, setMobileMoney] = useState(null);

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  const [guarantorNin, setGuarantorNin] = useState('');
  const [guarantorIdFrontB64, setGuarantorIdFrontB64] = useState('');
  const [guarantorIdBackB64, setGuarantorIdBackB64] = useState('');

  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState('mm');
  const [selectedBankId, setSelectedBankId] = useState('');

  const [orgName, setOrgName] = useState('');
  const [orgGroupId, setOrgGroupId] = useState('');
  const [orgBankId, setOrgBankId] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [ud, ls, os, lg, gr, lb, mm, accs] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('loansData'),
          AsyncStorage.getItem('loanOrgs'),
          AsyncStorage.getItem('loanLedger'),
          AsyncStorage.getItem('availableGroups'),
          AsyncStorage.getItem('linkedBanks'),
          AsyncStorage.getItem('mobileMoney'),
          AsyncStorage.getItem('loanAccounts'),
        ]);
        if (ud) setUserData(JSON.parse(ud));
        if (ls) setLoans(JSON.parse(ls));
        if (os) setOrgs(JSON.parse(os));
        if (lg) setLedger(JSON.parse(lg));
        if (gr) setGroups(JSON.parse(gr));
        if (lb) setLinkedBanks(JSON.parse(lb));
        if (mm) setMobileMoney(JSON.parse(mm));
        if (accs) setLoanAccounts(JSON.parse(accs));
      } catch (e) {
        console.log('[Loans] load error', e);
        Alert.alert('Error', 'Failed to load loans data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const userId = useMemo(() => (userData.phone || 'guest'), [userData]);

  const trustScore = useMemo(() => {
    let score = 0;
    try {
      if (userData.name && userData.phone) score += 20;
    } catch {}
    try {
      const st = groups && Array.isArray(groups) ? groups : [];
      const inAnyGroup = st.some((g) => (g.membersList || []).some((m) => m.phone === userData.phone));
      if (inAnyGroup) score += 10;
    } catch {}
    try {
      if (mobileMoney?.number) score += 10;
    } catch {}
    try {
      if (linkedBanks && linkedBanks.length > 0) score += 10;
    } catch {}
    try {
      const _ = AsyncStorage.getItem('identityDocs');
    } catch {}
    score = Math.min(100, Math.max(20, score + 30));
    return score;
  }, [userData, groups, mobileMoney, linkedBanks]);

  const maxLoan = useMemo(() => {
    const base = 2000;
    return Math.round((base + trustScore * 150) * 100) / 100;
  }, [trustScore]);

  const formatCurrency = useCallback((n) => {
    try {
      return `NLe ${new Intl.NumberFormat('en-SL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n || 0))}`;
    } catch {
      return `NLe ${n}`;
    }
  }, []);

  const saveLoans = useCallback(async (arr) => {
    setLoans(arr);
    await AsyncStorage.setItem('loansData', JSON.stringify(arr));
  }, []);

  const saveOrgs = useCallback(async (arr) => {
    setOrgs(arr);
    await AsyncStorage.setItem('loanOrgs', JSON.stringify(arr));
  }, []);

  const saveLedger = useCallback(async (arr) => {
    setLedger(arr);
    await AsyncStorage.setItem('loanLedger', JSON.stringify(arr));
  }, []);

  const saveAccounts = useCallback(async (arr) => {
    setLoanAccounts(arr);
    await AsyncStorage.setItem('loanAccounts', JSON.stringify(arr));
  }, []);

  const calcTotals = useCallback((loan) => {
    const principal = Number(loan.amount || 0);
    const rate = Number(loan.interest || 0) / 100;
    const months = Number(loan.term || 1);
    const total = principal * (1 + rate * (months / 12));
    const paid = (loan.repayments || []).reduce((s, r) => s + Number(r.amount || 0), 0);
    const outstanding = Math.max(0, total - paid);
    const monthlyDue = total / months;
    return { total, paid, outstanding, monthlyDue };
  }, []);

  const lastHash = useMemo(() => (ledger.length > 0 ? ledger[ledger.length - 1].hash : '0x0'), [ledger]);

  const addLedger = useCallback(async (type, data) => {
    try {
      const prev = lastHash || '0x0';
      const payload = { type, data, prev, ts: Date.now() };
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify(payload));
      const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, hash: `0x${hash.slice(0, 32)}`, prev, ...payload };
      const next = [...ledger, entry];
      await saveLedger(next);
      return entry;
    } catch (e) {
      console.log('[Loans] addLedger error', e);
      return null;
    }
  }, [ledger, lastHash, saveLedger]);

  const pickGuarantorImage = useCallback(async (side) => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow photo library access to attach ID');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        base64: true,
        quality: 0.6,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [3, 2],
      });
      if (result.canceled) return;
      const asset = result.assets && result.assets[0];
      const b64 = asset?.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : '';
      if (!b64) {
        Alert.alert('Error', 'Failed to read image');
        return;
      }
      if (side === 'front') setGuarantorIdFrontB64(b64);
      else setGuarantorIdBackB64(b64);
    } catch (e) {
      console.log('[Loans] pickGuarantorImage error', e);
      Alert.alert('Error', 'Could not pick image');
    }
  }, []);

  const requestLoan = useCallback(async () => {
    const a = parseFloat(amount);
    if (trustScore < 100) { Alert.alert('Not eligible', 'Complete your Trust to 100% to request a loan'); return; }
    if (isNaN(a) || a <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    if (a > maxLoan) { Alert.alert('Limit', `Amount exceeds your limit of ${formatCurrency(maxLoan)}`); return; }
    if (!purpose.trim()) { Alert.alert('Required', 'Enter a purpose'); return; }
    const myAccount = loanAccounts.find((acc)=>acc.ownerId===userId && acc.type==='individual');
    if (!myAccount) { Alert.alert('Create Loan Account', 'Create an Individual Loan Account first (Loans → Loan Accounts)'); setView('accounts'); return; }
    if (!guarantorNin.trim()) { Alert.alert('Required', 'Enter Guarantor NIN'); return; }
    if (!guarantorIdFrontB64 || !guarantorIdBackB64) { Alert.alert('Required', 'Attach guarantor ID card photos (front and back)'); return; }
    if (!mobileMoney && (!linkedBanks || linkedBanks.length === 0)) { Alert.alert('Payment Method Needed', 'Add Mobile Money or Bank details in Profile before requesting.'); return; }
    try {
      setLoading(true);
      const loan = {
        id: Date.now().toString(),
        borrowerId: userId,
        borrowerName: userData.name || 'You',
        amount: a,
        interest: null,
        term: null,
        purpose: purpose.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        orgId: '',
        repayments: [],
        guarantor: { nin: guarantorNin.trim(), idFrontB64: guarantorIdFrontB64, idBackB64: guarantorIdBackB64 },
        payerDestinations: { mobileMoney: mobileMoney || null, bank: linkedBanks[0] || null },
        borrowerAccountSnapshot: myAccount,
      };
      const next = [...loans, loan];
      await saveLoans(next);
      await addLedger('loan-requested', { loanId: loan.id, borrowerId: loan.borrowerId, amount: a });
      Alert.alert('Requested', 'Loan request submitted. Lender will set interest and duration during approval.');
      setAmount(''); setInterest(''); setTerm(''); setPurpose(''); setGuarantorNin(''); setGuarantorIdFrontB64(''); setGuarantorIdBackB64('');
      setView('my');
    } catch (e) {
      console.log('[Loans] request error', e);
      Alert.alert('Error', 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  }, [amount, purpose, userId, userData, loans, saveLoans, addLedger, maxLoan, formatCurrency, trustScore, guarantorNin, guarantorIdFrontB64, guarantorIdBackB64, loanAccounts, mobileMoney, linkedBanks]);

  const approveLoan = useCallback(async (org, loan, params) => {
    try {
      setLoading(true);
      const rate = parseFloat(params?.interest ?? '');
      const months = parseInt(params?.term ?? '');
      if (isNaN(rate) || rate < 0) { Alert.alert('Invalid', 'Enter a valid interest %'); return; }
      if (isNaN(months) || months <= 0) { Alert.alert('Invalid', 'Enter a valid term in months'); return; }
      const next = loans.map((l) => l.id === loan.id ? { ...l, status: 'approved', orgId: org.id, interest: rate, term: months, approvedAt: new Date().toISOString() } : l);
      await saveLoans(next);
      await addLedger('loan-approved', { loanId: loan.id, orgId: org.id, interest: rate, term: months });
      Alert.alert('Approved', 'Loan approved. Proceed to disburse.');
    } catch (e) {
      console.log('[Loans] approve error', e);
      Alert.alert('Error', 'Failed to approve');
    } finally {
      setLoading(false);
    }
  }, [loans, saveLoans, addLedger]);

  const disburseLoan = useCallback(async (org, loan) => {
    try {
      setLoading(true);
      const destination = loan.payerDestinations?.mobileMoney?.number ? { method: 'mm', number: loan.payerDestinations.mobileMoney.number } : loan.payerDestinations?.bank ? { method: 'bank', bankId: loan.payerDestinations.bank.id, number: loan.payerDestinations.bank.number } : { method: 'unknown' };
      const next = loans.map((l) => l.id === loan.id ? { ...l, status: 'active', disbursedAt: new Date().toISOString(), disbursement: { amount: loan.amount, ...destination, timestamp: new Date().toISOString() } } : l);
      await saveLoans(next);
      await addLedger('loan-disbursed', { loanId: loan.id, orgId: org.id, amount: loan.amount, destination, ts: Date.now() });
      Alert.alert('Disbursed', 'Funds disbursed to borrower destination.');
    } catch (e) {
      console.log('[Loans] disburse error', e);
      Alert.alert('Error', 'Failed to disburse');
    } finally {
      setLoading(false);
    }
  }, [loans, saveLoans, addLedger]);

  const rejectLoan = useCallback(async (org, loan) => {
    try {
      setLoading(true);
      const next = loans.map((l) => l.id === loan.id ? { ...l, status: 'rejected', rejectedAt: new Date().toISOString() } : l);
      await saveLoans(next);
      await addLedger('loan-rejected', { loanId: loan.id, orgId: org.id });
      Alert.alert('Rejected', 'Loan request rejected.');
    } catch (e) {
      console.log('[Loans] reject error', e);
      Alert.alert('Error', 'Failed to reject');
    } finally {
      setLoading(false);
    }
  }, [loans, saveLoans, addLedger]);

  const repayLoan = useCallback(async () => {
    if (!selectedLoan) return;
    const amt = parseFloat(repayAmount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    if (repayMethod === 'mm' && !mobileMoney?.number) { Alert.alert('Setup Needed', 'Add Mobile Money in Profile > Payment Method'); return; }
    if (repayMethod === 'bank' && !selectedBankId) { Alert.alert('Select Bank', 'Choose a bank'); return; }
    try {
      setLoading(true);
      const totals = calcTotals(selectedLoan);
      const pay = Math.min(amt, totals.outstanding);
      const entry = { id: Date.now().toString(), amount: pay, date: new Date().toISOString(), method: repayMethod, number: repayMethod === 'mm' ? mobileMoney?.number : (linkedBanks.find((b) => b.id === selectedBankId)?.number || '') };
      const next = loans.map((l) => l.id === selectedLoan.id ? { ...l, repayments: [ ...(l.repayments || []), entry ] } : l);
      await saveLoans(next);
      await addLedger('loan-repayment', { loanId: selectedLoan.id, payerId: userId, amount: pay, method: repayMethod });
      const updatedLoan = next.find((l) => l.id === selectedLoan.id);
      setSelectedLoan(updatedLoan || null);
      setShowRepayModal(false);
      setRepayAmount(''); setSelectedBankId('');
      const postTotals = calcTotals(updatedLoan);
      if (postTotals.outstanding <= 0.01) {
        const closed = next.map((l) => l.id === selectedLoan.id ? { ...l, status: 'completed', completedAt: new Date().toISOString() } : l);
        await saveLoans(closed);
        await addLedger('loan-closed', { loanId: selectedLoan.id });
        setSelectedLoan(closed.find((l) => l.id === selectedLoan.id) || null);
        Alert.alert('Completed', 'Loan fully repaid.');
      } else {
        Alert.alert('Payment Recorded', 'Repayment saved and recorded on-chain.');
      }
    } catch (e) {
      console.log('[Loans] repay error', e);
      Alert.alert('Error', 'Failed to record repayment');
    } finally {
      setLoading(false);
    }
  }, [selectedLoan, repayAmount, repayMethod, selectedBankId, mobileMoney, linkedBanks, loans, saveLoans, addLedger, calcTotals, userId]);

  const exportPaymentsPdf = useCallback(async (loan) => {
    try {
      const totals = calcTotals(loan);
      const rows = (loan.repayments || []).map((r) => `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${r.method === 'mm' ? 'Mobile Money' : 'Bank'}</td><td style="text-align:right">${Number(r.amount).toFixed(2)}</td></tr>`).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loan Payments</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial;padding:24px}h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #eee;padding:8px;font-size:12px}th{text-align:left;background:#fafafa}footer{margin-top:16px;font-size:12px;color:#666}</style></head><body><h1>Loan Payments Receipt</h1><div>Borrower: ${loan.borrowerName || loan.borrowerId}</div><div>Loan ID: ${loan.id}</div><div>Amount: ${formatCurrency(loan.amount)} • Interest: ${loan.interest}% • Term: ${loan.term} mo</div><table><thead><tr><th>Date</th><th>Method</th><th style="text-align:right">Amount (NLe)</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No payments</td></tr>'}</tbody></table><footer>Total Repaid: ${Number(totals.paid).toFixed(2)} • Outstanding: ${Number(totals.outstanding).toFixed(2)}</footer></body></html>`;
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win && win.document) {
          win.document.write(html);
          win.document.close();
          win.focus();
          win.print();
        } else {
          await Print.printAsync({ html });
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (e) {
      console.log('[Loans] export pdf error', e);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  }, [calcTotals, formatCurrency]);

  const myLoans = useMemo(() => loans.filter((l) => l.borrowerId === userId), [loans, userId]);
  const activeOutstanding = useMemo(() => myLoans.filter((l) => l.status === 'active').reduce((s, l) => s + calcTotals(l).outstanding, 0), [myLoans, calcTotals]);

  const renderHeader = (title, onBack) => (
    <View style={styles.screenHeader}>
      {onBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} testID="backBtn">
          <ArrowLeft color="#FFA500" size={24} />
        </TouchableOpacity>
      ) : <View style={{ width: 32 }} />}
      <Text style={styles.screenTitle}>{title}</Text>
      <View style={{ width: 32 }} />
    </View>
  );

  const Terms = () => (
    <View style={[styles.card, { marginTop: 12 }]}> 
      <Text style={styles.sectionTitle}>Loan Terms & Conditions</Text>
      <Text style={styles.muted}>• Eligibility requires Trust 100% and verified identity (NIN and ID/Passport.{"\n"}
      • Providing false information leads to denial and potential suspension.{"\n"}
      • Disbursement is sent to your linked Mobile Money or Bank details.{"\n"}
      • Late or missed repayments may affect eligibility and organization rules.{"\n"}
      • By proceeding you agree to these terms.</Text>
    </View>
  );

  const renderHome = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <HandCoins color="#FFA500" size={28} />
            <View>
              <Text style={styles.headerTitle}>Loans</Text>
              <Text style={styles.headerSubtitle}>Request, manage and repay</Text>
            </View>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <ShieldCheck color="#4CAF50" size={22} />
            <Text style={styles.summaryValue}>{trustScore}%</Text>
            <Text style={styles.summaryLabel}>Trust</Text>
          </View>
          <View style={styles.summaryCard}>
            <CreditCard color="#5CCEF4" size={22} />
            <Text style={styles.summaryValue}>{formatCurrency(activeOutstanding)}</Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
          <View style={styles.summaryCard}>
            <Calendar color="#666" size={22} />
            <Text style={styles.summaryValue}>{myLoans.length}</Text>
            <Text style={styles.summaryLabel}>My Loans</Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setView('request')} testID="requestLoanBtn">
            <Text style={styles.primaryBtnText}>Request Loan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setView('my')} testID="myLoansBtn">
            <Text style={styles.secondaryBtnText}>My Loans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setView('orgs')} testID="orgsBtn">
            <Text style={styles.secondaryBtnText}>Organizations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setView('accounts')} testID="accountsBtn">
            <Text style={styles.secondaryBtnText}>Loan Accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setView('ledger')} testID="ledgerBtn">
            <Text style={styles.secondaryBtnText}>Ledger</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.limitCard}>
          <Percent color="#FFA500" size={18} />
          <Text style={styles.limitText}>Your current limit: {formatCurrency(maxLoan)}</Text>
        </View>
        <Terms />
      </ScrollView>
    </SafeAreaView>
  );

  const renderRequest = () => (
    <SafeAreaView style={styles.container}>
      {renderHeader('Request Loan', () => setView('home'))}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Limit: {formatCurrency(maxLoan)} • Trust: {trustScore}%</Text>
            <Text style={[styles.smallMuted, { marginTop: 4 }]}>You only request the amount. Interest and duration are set by the lender.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Identified Details</Text>
            {(() => {
              const acc = loanAccounts.find((a)=>a.ownerId===userId && a.type==='individual');
              if (!acc) return <Text style={styles.muted}>No Individual Loan Account yet. Create one in Accounts.</Text>;
              return (
                <View>
                  <View style={styles.kvRow}><Text style={styles.kvLabel}>Full name</Text><Text style={styles.kvValue}>{acc.data.fullName}</Text></View>
                  <View style={styles.kvRow}><Text style={styles.kvLabel}>NIN</Text><Text style={styles.kvValue}>{acc.data.nin}</Text></View>
                  <View style={styles.kvRow}><Text style={styles.kvLabel}>Address</Text><Text style={styles.kvValue}>{acc.data.address}</Text></View>
                  <View style={styles.kvRow}><Text style={styles.kvLabel}>Phone</Text><Text style={styles.kvValue}>{acc.data.phone}</Text></View>
                </View>
              );
            })()}
            <Text style={[styles.muted, { marginTop: 8 }]}>Interest rate and duration will be set by the Lender during approval.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (NLe)</Text>
            <View style={styles.inputBox}>
              <TextInput value={amount} onChangeText={(t)=>setAmount(t.replace(/[^0-9.]/g,''))} placeholder="0.00" keyboardType="numeric" style={styles.input} testID="amountInput" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Purpose</Text>
            <View style={styles.inputBox}>
              <TextInput value={purpose} onChangeText={setPurpose} placeholder="What do you need this loan for?" style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline numberOfLines={3} testID="purposeInput" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Guarantor</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Guarantor NIN</Text>
              <View style={styles.inputBox}>
                <TextInput value={guarantorNin} onChangeText={setGuarantorNin} placeholder="Enter guarantor NIN" style={styles.input} testID="guarantorNin" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Attach ID Card Photos</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, height: 44 }]} onPress={() => pickGuarantorImage('front')} testID="pickGuarantorFront">
                  <Text style={styles.secondaryBtnText}>{guarantorIdFrontB64 ? 'Replace Front' : 'Pick Front'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, height: 44 }]} onPress={() => pickGuarantorImage('back')} testID="pickGuarantorBack">
                  <Text style={styles.secondaryBtnText}>{guarantorIdBackB64 ? 'Replace Back' : 'Pick Back'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <View style={[styles.inputBox, { flex: 1, height: 120, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}> 
                  {guarantorIdFrontB64 ? <Image source={{ uri: guarantorIdFrontB64 }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={styles.smallMuted}>Front preview</Text>}
                </View>
                <View style={[styles.inputBox, { flex: 1, height: 120, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}> 
                  {guarantorIdBackB64 ? <Image source={{ uri: guarantorIdBackB64 }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={styles.smallMuted}>Back preview</Text>}
                </View>
              </View>
            </View>
          </View>

          <Terms />

          <TouchableOpacity style={styles.primaryBtn} onPress={requestLoan} disabled={loading} testID="submitLoanRequest">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Submit Request</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderLoanCard = ({ item: loan }) => {
    const totals = calcTotals(loan);
    return (
      <TouchableOpacity style={styles.card} onPress={() => { setSelectedLoan(loan); setView('loanDetails'); }} testID={`loanCard-${loan.id}`}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <HandCoins color="#FFA500" size={20} />
            <Text style={styles.cardTitle}>Loan #{loan.id.slice(-6)}</Text>
          </View>
          <View style={[styles.badge, loan.status === 'active' ? styles.badgeBlue : loan.status === 'pending' ? styles.badgeOrange : loan.status === 'completed' ? styles.badgeGreen : styles.badgeGray]}>
            <Text style={styles.badgeText}>{loan.status}</Text>
          </View>
        </View>
        <View style={styles.cardRow}><CreditCard color="#666" size={16} /><Text style={styles.cardText}>{formatCurrency(loan.amount)} • {loan.interest != null ? `${loan.interest}%` : 'interest —'} • {loan.term != null ? `${loan.term} mo` : 'term —'}</Text></View>
        <View style={styles.cardRow}><Clock color="#666" size={16} /><Text style={styles.cardText}>Outstanding: {formatCurrency(totals.outstanding)}</Text></View>
      </TouchableOpacity>
    );
  };

  const renderMyLoans = () => (
    <SafeAreaView style={styles.container}>
      {renderHeader('My Loans', () => setView('home'))}
      <ScrollView style={styles.scroll}>
        {myLoans.length === 0 ? (
          <View style={styles.emptyState}>
            <HandCoins color="#ccc" size={48} />
            <Text style={styles.emptyText}>No loans yet</Text>
          </View>
        ) : (
          <FlatList data={myLoans} renderItem={renderLoanCard} keyExtractor={(i)=>i.id} scrollEnabled={false} />
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderLoanDetails = () => {
    if (!selectedLoan) return null;
    const totals = calcTotals(selectedLoan);
    const org = orgs.find((o) => o.id === selectedLoan.orgId);
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader('Loan Details', () => setView('my'))}
        <ScrollView style={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <HandCoins color="#FFA500" size={20} />
                <Text style={styles.cardTitle}>Loan #{selectedLoan.id.slice(-6)}</Text>
              </View>
              <View style={[styles.badge, selectedLoan.status === 'active' ? styles.badgeBlue : selectedLoan.status === 'pending' ? styles.badgeOrange : selectedLoan.status === 'completed' ? styles.badgeGreen : styles.badgeGray]}>
                <Text style={styles.badgeText}>{selectedLoan.status}</Text>
              </View>
            </View>
            <View style={styles.cardRow}><Percent color="#666" size={16} /><Text style={styles.cardText}>{formatCurrency(selectedLoan.amount)} • {selectedLoan.interest != null ? `${selectedLoan.interest}%` : 'interest —'} • {selectedLoan.term != null ? `${selectedLoan.term} months` : 'term —'}</Text></View>
            <View style={styles.cardRow}><Building2 color="#666" size={16} /><Text style={styles.cardText}>Organization: {org ? org.name : '—'}</Text></View>
            <View style={styles.cardRow}><Calendar color="#666" size={16} /><Text style={styles.cardText}>Created: {new Date(selectedLoan.createdAt).toLocaleDateString()}</Text></View>
            <View style={[styles.kvRow]}>
              <Text style={styles.kvLabel}>Total Repayable</Text><Text style={styles.kvValue}>{formatCurrency(totals.total)}</Text>
            </View>
            <View style={[styles.kvRow]}>
              <Text style={styles.kvLabel}>Repaid</Text><Text style={styles.kvValue}>{formatCurrency(totals.paid)}</Text>
            </View>
            <View style={[styles.kvRow]}>
              <Text style={styles.kvLabel}>Outstanding</Text><Text style={[styles.kvValue, { color: '#e67e22' }]}>{formatCurrency(totals.outstanding)}</Text>
            </View>
            {selectedLoan.status === 'active' ? (
              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={() => setShowRepayModal(true)} testID="repayBtn">
                <Text style={styles.primaryBtnText}>Repay</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 8 }]} onPress={() => exportPaymentsPdf(selectedLoan)} testID="exportPdfBtn">
              <Download color="#FFA500" size={18} />
              <Text style={styles.secondaryBtnText}>Export PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>Payments</Text>
            {(selectedLoan.repayments || []).length === 0 ? (
              <Text style={styles.muted}>No payments yet</Text>
            ) : (
              (selectedLoan.repayments || []).map((p) => (
                <View key={p.id} style={styles.listRowBetween}>
                  <View style={styles.rowLeft}>
                    <CreditCard color="#FFA500" size={18} />
                    <View>
                      <Text style={styles.listText}>{p.method === 'mm' ? 'Mobile Money' : 'Bank'} • {new Date(p.date).toLocaleString()}</Text>
                      <Text style={styles.smallMuted}>{p.number || ''}</Text>
                    </View>
                  </View>
                  <Text style={styles.bold}>{formatCurrency(p.amount)}</Text>
                </View>
              ))
            )}
          </View>

          <Terms />
        </ScrollView>

        <Modal visible={showRepayModal} transparent animationType="fade" onRequestClose={() => setShowRepayModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Repay Loan</Text>
                <TouchableOpacity onPress={() => setShowRepayModal(false)}>
                  <X color="#666" size={22} />
                </TouchableOpacity>
              </View>
              <Text style={styles.muted}>Outstanding: {formatCurrency(totals.outstanding)}</Text>
              <View style={[styles.inputGroup, { marginTop: 10 }]}>
                <Text style={styles.inputLabel}>Amount (NLe)</Text>
                <View style={styles.inputBox}>
                  <TextInput value={repayAmount} onChangeText={(t)=>setRepayAmount(t.replace(/[^0-9.]/g,''))} placeholder="0.00" keyboardType="numeric" style={styles.input} testID="repayAmount" />
                </View>
              </View>
              <Text style={[styles.inputLabel, { marginTop: 6 }]}>Method</Text>
              {mobileMoney ? (
                <TouchableOpacity style={[styles.selector, repayMethod === 'mm' && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => { setRepayMethod('mm'); setSelectedBankId(''); }} testID="repayMethodMM">
                  <Text style={styles.selectorText}>Mobile Money • {mobileMoney.provider} ({(mobileMoney.number || '').slice(0,4)}****{(mobileMoney.number || '').slice(-2)})</Text>
                  {repayMethod === 'mm' ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
                </TouchableOpacity>
              ) : (
                <View style={styles.infoCard}><Text style={styles.muted}>No Mobile Money set. Add in Profile.</Text></View>
              )}
              <Text style={[styles.inputLabel, { marginTop: 6 }]}>Banks</Text>
              {linkedBanks.length === 0 ? (
                <View style={styles.infoCard}><Text style={styles.muted}>No banks linked. Add in Profile.</Text></View>
              ) : (
                linkedBanks.map((b) => (
                  <TouchableOpacity key={b.id} style={[styles.selector, repayMethod === 'bank' && selectedBankId === b.id && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => { setRepayMethod('bank'); setSelectedBankId(b.id); }} testID={`repayBank-${b.id}`}>
                    <Text style={styles.selectorText}>{b.bank} • {('*'.repeat(Math.max(0, (b.number || '').length - 4)))}{String(b.number || '').slice(-4)}</Text>
                    {repayMethod === 'bank' && selectedBankId === b.id ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={repayLoan} disabled={loading} testID="confirmRepay">
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  };

  const [approveParams, setApproveParams] = useState({});
  const myAdminOrgs = useMemo(() => orgs.filter((o) => o.ownerId === userId), [orgs, userId]);
  const memberOrgs = useMemo(() => orgs.filter((o) => (o.members || []).includes(userId)), [orgs, userId]);

  const createOrg = useCallback(async () => {
    if (!orgName.trim()) { Alert.alert('Required', 'Enter organization name'); return; }
    try {
      setLoading(true);
      const membersFromGroup = (() => {
        const g = groups.find((gg) => gg.id === orgGroupId);
        if (!g) return [];
        return (g.membersList || []).map((m) => m.phone || m.id).filter(Boolean);
      })();
      const org = { id: Date.now().toString(), name: orgName.trim(), ownerId: userId, groupId: orgGroupId || '', bankId: orgBankId || '', members: Array.from(new Set(membersFromGroup)) };
      const next = [...orgs, org];
      await saveOrgs(next);
      await addLedger('org-created', { orgId: org.id, name: org.name });
      setOrgName(''); setOrgGroupId(''); setOrgBankId('');
      setSelectedOrg(org);
      setView('orgDetails');
    } catch (e) {
      console.log('[Loans] create org error', e);
      Alert.alert('Error', 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  }, [orgName, orgGroupId, orgBankId, userId, groups, orgs, saveOrgs, addLedger]);

  const syncMembersFromGroup = useCallback(async (org) => {
    try {
      setLoading(true);
      const g = groups.find((gg) => gg.id === (org.groupId || ''));
      const members = g ? (g.membersList || []).map((m) => m.phone || m.id).filter(Boolean) : (org.members || []);
      const next = orgs.map((o) => o.id === org.id ? { ...o, members: Array.from(new Set(members)) } : o);
      await saveOrgs(next);
      setSelectedOrg(next.find((o) => o.id === org.id) || null);
      Alert.alert('Synced', 'Members synced from group');
    } catch (e) {
      console.log('[Loans] sync members', e);
      Alert.alert('Error', 'Failed to sync members');
    } finally {
      setLoading(false);
    }
  }, [groups, orgs, saveOrgs]);

  const renderOrgs = () => (
    <SafeAreaView style={styles.container}>
      {renderHeader('Organizations', () => setView('home'))}
      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Organization</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <View style={styles.inputBox}>
              <TextInput value={orgName} onChangeText={setOrgName} placeholder="e.g., Hope Foundation" style={styles.input} testID="orgNameInput" />
            </View>
          </View>
          <Text style={styles.inputLabel}>Link Group (optional)</Text>
          {groups.length === 0 ? (
            <View style={styles.infoCard}><Text style={styles.muted}>No groups available</Text></View>
          ) : (
            groups.map((g) => (
              <TouchableOpacity key={g.id} style={[styles.selector, orgGroupId === g.id && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setOrgGroupId(orgGroupId === g.id ? '' : g.id)} testID={`pickGroup-${g.id}`}>
                <Text style={styles.selectorText}>{g.name}</Text>
                {orgGroupId === g.id ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
              </TouchableOpacity>
            ))
          )}
          <Text style={styles.inputLabel}>Organization Bank (optional)</Text>
          {linkedBanks.length === 0 ? (
            <View style={styles.infoCard}><Text style={styles.muted}>No banks linked in Profile</Text></View>
          ) : (
            linkedBanks.map((b) => (
              <TouchableOpacity key={b.id} style={[styles.selector, orgBankId === b.id && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={() => setOrgBankId(orgBankId === b.id ? '' : b.id)} testID={`pickOrgBank-${b.id}`}>
                <Text style={styles.selectorText}>{b.bank} • {('*'.repeat(Math.max(0, (b.number || '').length - 4)))}{String(b.number || '').slice(-4)}</Text>
                {orgBankId === b.id ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={createOrg} disabled={loading} testID="createOrgBtn">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Organizations</Text>
          {myAdminOrgs.length === 0 ? (
            <View style={styles.emptyState}><Building2 color="#ccc" size={40} /><Text style={styles.emptyText}>No organizations</Text></View>
          ) : (
            myAdminOrgs.map((o) => (
              <TouchableOpacity key={o.id} style={styles.card} onPress={() => { setSelectedOrg(o); setView('orgDetails'); }} testID={`orgCard-${o.id}`}>
                <View style={styles.cardHeader}><View style={styles.cardHeaderLeft}><Building2 color="#5CCEF4" size={20} /><Text style={styles.cardTitle}>{o.name}</Text></View></View>
                <View style={styles.cardRow}><Users color="#666" size={16} /><Text style={styles.cardText}>Members: {(o.members || []).length}</Text></View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organizations I Belong To</Text>
          {memberOrgs.length === 0 ? (
            <View style={styles.emptyState}><Users color="#ccc" size={40} /><Text style={styles.emptyText}>None</Text></View>
          ) : (
            memberOrgs.map((o) => (
              <View key={o.id} style={styles.card}>
                <View style={styles.cardHeader}><View style={styles.cardHeaderLeft}><Building2 color="#5CCEF4" size={20} /><Text style={styles.cardTitle}>{o.name}</Text></View></View>
                <View style={styles.cardRow}><Users color="#666" size={16} /><Text style={styles.cardText}>Members: {(o.members || []).length}</Text></View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderOrgDetails = () => {
    if (!selectedOrg) return null;
    const pendingLoans = loans.filter((l) => l.status === 'pending' && (selectedOrg.members || []).includes(l.borrowerId));
    const approvedLoans = loans.filter((l) => l.status === 'approved' && l.orgId === selectedOrg.id);
    const activeLoans = loans.filter((l) => l.status === 'active' && l.orgId === selectedOrg.id);
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader(selectedOrg.name, () => setView('orgs'))}
        <ScrollView style={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Text style={styles.muted}>Linked Group: {selectedOrg.groupId ? (groups.find((g) => g.id === selectedOrg.groupId)?.name || selectedOrg.groupId) : 'None'}</Text>
            <Text style={styles.muted}>Bank: {selectedOrg.bankId ? (linkedBanks.find((b)=>b.id===selectedOrg.bankId)?.bank || 'Bank') : 'None'}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => syncMembersFromGroup(selectedOrg)} testID="syncMembersBtn">
                <Text style={styles.secondaryBtnText}>Sync Members</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {pendingLoans.length === 0 ? (
              <Text style={styles.muted}>No pending requests</Text>
            ) : (
              pendingLoans.map((l) => (
                <View key={l.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                  <View style={styles.rowLeft}>
                    <HandCoins color="#FFA500" size={18} />
                    <View>
                      <Text style={styles.listText}>{l.borrowerName} • {formatCurrency(l.amount)}</Text>
                      <Text style={styles.smallMuted}>#{l.id.slice(-6)}</Text>
                    </View>
                  </View>
                  <View style={[styles.row2, { marginTop: 8, paddingHorizontal: 0 }]}> 
                    <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}> 
                      <Text style={styles.inputLabel}>Interest (%)</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          value={approveParams[l.id]?.interest ?? ''}
                          onChangeText={(t)=>setApproveParams((p)=>({ ...p, [l.id]: { ...(p[l.id]||{}), interest: t.replace(/[^0-9.]/g,'') } }))}
                          placeholder="10"
                          keyboardType="numeric"
                          style={styles.input}
                          testID={`setInterest-${l.id}`}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}> 
                      <Text style={styles.inputLabel}>Term (months)</Text>
                      <View style={styles.inputBox}>
                        <TextInput
                          value={approveParams[l.id]?.term ?? ''}
                          onChangeText={(t)=>setApproveParams((p)=>({ ...p, [l.id]: { ...(p[l.id]||{}), term: t.replace(/[^0-9]/g,'') } }))}
                          placeholder="12"
                          keyboardType="number-pad"
                          style={styles.input}
                          testID={`setTerm-${l.id}`}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', paddingHorizontal: 16 }}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => approveLoan(selectedOrg, l, approveParams[l.id])} testID={`approve-${l.id}`}>
                      <Check color="#fff" size={14} />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectLoan(selectedOrg, l)} testID={`reject-${l.id}`}>
                      <X color="#fff" size={14} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>Approved (Awaiting Disbursement)</Text>
            {approvedLoans.length === 0 ? (
              <Text style={styles.muted}>None</Text>
            ) : (
              approvedLoans.map((l) => (
                <View key={l.id} style={styles.listRowBetween}>
                  <View style={styles.rowLeft}>
                    <HandCoins color="#FFA500" size={18} />
                    <Text style={styles.listText}>#{l.id.slice(-6)} • {l.borrowerName} • {formatCurrency(l.amount)}</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => disburseLoan(selectedOrg, l)} testID={`disburse-${l.id}`}>
                    <Text style={styles.primaryBtnText}>Disburse</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>Active Loans</Text>
            {activeLoans.length === 0 ? (
              <Text style={styles.muted}>None</Text>
            ) : (
              activeLoans.map((l) => {
                const t = calcTotals(l);
                return (
                  <View key={l.id} style={styles.listRowBetween}>
                    <View style={styles.rowLeft}>
                      <HandCoins color="#5CCEF4" size={18} />
                      <Text style={styles.listText}>#{l.id.slice(-6)} • {l.borrowerName}</Text>
                    </View>
                    <Text style={styles.smallMuted}>Outstanding: {formatCurrency(t.outstanding)}</Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  const renderLedger = () => (
    <SafeAreaView style={styles.container}>
      {renderHeader('Blockchain Ledger', () => setView('home'))}
      <ScrollView style={styles.scroll}>
        {ledger.length === 0 ? (
          <View style={styles.emptyState}><FileText color="#ccc" size={40} /><Text style={styles.emptyText}>No transactions</Text></View>
        ) : (
          ledger.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <FileText color="#5CCEF4" size={18} />
                  <Text style={styles.cardTitle}>{e.type}</Text>
                </View>
              </View>
              <Text style={styles.smallMuted}>Hash: {e.hash}</Text>
              <Text style={styles.smallMuted}>Prev: {e.prev}</Text>
              <Text style={styles.smallMuted}>Time: {new Date(e.ts).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderAccounts = () => (
    <SafeAreaView style={styles.container}>
      {renderHeader('Loan Accounts', () => setView('home'))}
      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Type</Text>
          {['individual','mfi','organization'].map((t)=> (
            <TouchableOpacity key={t} style={[styles.selector, accountType===t && { backgroundColor: '#fff5e6', borderColor: '#FFA500' }]} onPress={()=>setAccountType(t)} testID={`acctType-${t}`}>
              <Text style={styles.selectorText}>{t==='individual' ? 'Individual/Personal' : t==='mfi' ? 'Microfinance Institution' : 'Organization (NGO/CBO/Social Club)'}</Text>
              {accountType===t ? <Check color="#FFA500" size={18} /> : <Text style={styles.selectorArrow}>▼</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          {trustScore < 100 ? (
            <Text style={[styles.muted, { marginBottom: 8 }]}>Complete Trust to 100% to create a loan account.</Text>
          ) : null}
          {accountType === 'individual' && (
            <>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Full name</Text><View style={styles.inputBox}><TextInput value={accountForm.fullName} onChangeText={(t)=>setAccountForm({...accountForm, fullName:t})} placeholder="Full name" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>NIN</Text><View style={styles.inputBox}><TextInput value={accountForm.nin} onChangeText={(t)=>setAccountForm({...accountForm, nin:t})} placeholder="National ID Number" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Address</Text><View style={styles.inputBox}><TextInput value={accountForm.address} onChangeText={(t)=>setAccountForm({...accountForm, address:t})} placeholder="Address" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Phone</Text><View style={styles.inputBox}><TextInput value={accountForm.phone} onChangeText={(t)=>setAccountForm({...accountForm, phone:t})} placeholder="Phone" style={styles.input} keyboardType="phone-pad" /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Email (optional)</Text><View style={styles.inputBox}><TextInput value={accountForm.email} onChangeText={(t)=>setAccountForm({...accountForm, email:t})} placeholder="Email" style={styles.input} keyboardType="email-address" /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>ID Card (front URL)</Text><View style={styles.inputBox}><TextInput value={accountForm.idFrontUrl} onChangeText={(t)=>setAccountForm({...accountForm, idFrontUrl:t})} placeholder="https://..." style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>ID Card (back URL)</Text><View style={styles.inputBox}><TextInput value={accountForm.idBackUrl} onChangeText={(t)=>setAccountForm({...accountForm, idBackUrl:t})} placeholder="https://..." style={styles.input} /></View></View>
              <Text style={[styles.muted, { marginHorizontal: 16 }]}>By creating, you accept the loan Terms & Conditions.</Text>
            </>
          )}

          {accountType === 'mfi' && (
            <>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Institution Name</Text><View style={styles.inputBox}><TextInput value={accountForm.institutionName} onChangeText={(t)=>setAccountForm({...accountForm, institutionName:t})} placeholder="Institution" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Head Office Address</Text><View style={styles.inputBox}><TextInput value={accountForm.headOfficeAddress} onChangeText={(t)=>setAccountForm({...accountForm, headOfficeAddress:t})} placeholder="Address" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>CEO Name</Text><View style={styles.inputBox}><TextInput value={accountForm.ceoName} onChangeText={(t)=>setAccountForm({...accountForm, ceoName:t})} placeholder="CEO Name" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>CEO NIN</Text><View style={styles.inputBox}><TextInput value={accountForm.ceoNin} onChangeText={(t)=>setAccountForm({...accountForm, ceoNin:t})} placeholder="NIN" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>CEO ID Front URL</Text><View style={styles.inputBox}><TextInput value={accountForm.ceoIdFrontUrl} onChangeText={(t)=>setAccountForm({...accountForm, ceoIdFrontUrl:t})} placeholder="https://..." style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>CEO ID Back URL</Text><View style={styles.inputBox}><TextInput value={accountForm.ceoIdBackUrl} onChangeText={(t)=>setAccountForm({...accountForm, ceoIdBackUrl:t})} placeholder="https://..." style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Branch Address</Text><View style={styles.inputBox}><TextInput value={accountForm.branchAddress} onChangeText={(t)=>setAccountForm({...accountForm, branchAddress:t})} placeholder="Branch Address" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Branch Manager Name</Text><View style={styles.inputBox}><TextInput value={accountForm.branchManagerName} onChangeText={(t)=>setAccountForm({...accountForm, branchManagerName:t})} placeholder="Manager Name" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Branch Manager NIN</Text><View style={styles.inputBox}><TextInput value={accountForm.branchManagerNin} onChangeText={(t)=>setAccountForm({...accountForm, branchManagerNin:t})} placeholder="NIN" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Certificate 1 URL</Text><View style={styles.inputBox}><TextInput value={accountForm.certificate1Url} onChangeText={(t)=>setAccountForm({...accountForm, certificate1Url:t})} placeholder="https://..." style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Certificate 2 URL</Text><View style={styles.inputBox}><TextInput value={accountForm.certificate2Url} onChangeText={(t)=>setAccountForm({...accountForm, certificate2Url:t})} placeholder="https://..." style={styles.input} /></View></View>
              <Text style={[styles.muted, { marginHorizontal: 16 }]}>By creating, you accept the loan Terms & Conditions.</Text>
            </>
          )}

          {accountType === 'organization' && (
            <>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Organization Kind</Text><View style={styles.inputBox}><TextInput value={accountForm.orgKind} onChangeText={(t)=>setAccountForm({...accountForm, orgKind:t})} placeholder="NGO/CBO/Social Club/Institution" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Organization Name</Text><View style={styles.inputBox}><TextInput value={accountForm.orgName} onChangeText={(t)=>setAccountForm({...accountForm, orgName:t})} placeholder="Name" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Office Address</Text><View style={styles.inputBox}><TextInput value={accountForm.officeAddress} onChangeText={(t)=>setAccountForm({...accountForm, officeAddress:t})} placeholder="Address" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Leader (CEO/President)</Text><View style={styles.inputBox}><TextInput value={accountForm.leaderName} onChangeText={(t)=>setAccountForm({...accountForm, leaderName:t})} placeholder="Name" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Leader NIN</Text><View style={styles.inputBox}><TextInput value={accountForm.leaderNin} onChangeText={(t)=>setAccountForm({...accountForm, leaderNin:t})} placeholder="NIN" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Creator Role</Text><View style={styles.inputBox}><TextInput value={accountForm.creatorRole} onChangeText={(t)=>setAccountForm({...accountForm, creatorRole:t})} placeholder="CEO/President/Chairman/..." style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Creator Name</Text><View style={styles.inputBox}><TextInput value={accountForm.creatorName} onChangeText={(t)=>setAccountForm({...accountForm, creatorName:t})} placeholder="Your name" style={styles.input} /></View></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Creator NIN</Text><View style={styles.inputBox}><TextInput value={accountForm.creatorNin} onChangeText={(t)=>setAccountForm({...accountForm, creatorNin:t})} placeholder="NIN" style={styles.input} /></View></View>
              <Text style={[styles.muted, { marginHorizontal: 16 }]}>By creating, you accept the loan Terms & Conditions.</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { margin: 16 }]}
          disabled={loading || trustScore < 100}
          onPress={async ()=>{
            if (trustScore < 100) { Alert.alert('Not eligible', 'Trust must be 100%'); return; }
            try {
              setLoading(true);
              const id = Date.now().toString();
              const record = { id, type: accountType, ownerId: userId, data: { ...accountForm } };
              const next = [...loanAccounts.filter(a=>!(a.ownerId===userId && a.type===accountType)), record];
              await saveAccounts(next);
              await addLedger('loan-account-created', { id, type: accountType, ownerId: userId });
              Alert.alert('Created', 'Loan account saved');
            } catch(e) {
              console.log('[Loans] acct create error', e);
              Alert.alert('Error', 'Failed to save account');
            } finally {
              setLoading(false);
            }
          }}
          testID="saveAccountBtn"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Account</Text>}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Accounts</Text>
          {loanAccounts.filter(a=>a.ownerId===userId).length===0 ? (
            <Text style={styles.muted}>No accounts yet</Text>
          ) : (
            loanAccounts.filter(a=>a.ownerId===userId).map((a)=> (
              <View key={a.id} style={styles.listRowBetween}>
                <View style={styles.rowLeft}><HandCoins color="#FFA500" size={18} /><Text style={styles.listText}>{a.type}</Text></View>
                <Text style={styles.smallMuted}>{new Date(parseInt(a.id,10)).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <>
      {loading && view === 'home' ? null : null}
      {view === 'home' && renderHome()}
      {view === 'request' && renderRequest()}
      {view === 'my' && renderMyLoans()}
      {view === 'loanDetails' && renderLoanDetails()}
      {view === 'orgs' && renderOrgs()}
      {view === 'orgDetails' && renderOrgDetails()}
      {view === 'ledger' && renderLedger()}
      {view === 'accounts' && renderAccounts()}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flex: 1 },
  flex1: { flex: 1 },

  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  backBtn: { padding: 6 },
  screenTitle: { fontSize: 18, fontWeight: '700', color: '#333' },

  headerCard: { backgroundColor: '#fff', padding: 16, margin: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#333' },
  headerSubtitle: { color: '#666', marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  summaryValue: { marginTop: 6, fontWeight: '800', color: '#333' },
  summaryLabel: { color: '#666', fontSize: 12 },

  actionsRow: { padding: 16, gap: 10 },
  primaryBtn: { backgroundColor: '#FFA500', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#FFA500', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  secondaryBtnText: { color: '#FFA500', fontWeight: 'bold', fontSize: 16 },

  limitCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  limitText: { color: '#333', fontWeight: '600' },

  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12 },
  infoText: { color: '#444' },

  inputGroup: { marginHorizontal: 16, marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  inputBox: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 10 },
  input: { height: 48, paddingHorizontal: 12, fontSize: 16, color: '#333' },
  selector: { height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8 },
  selectorText: { color: '#333' },
  selectorArrow: { color: '#999', fontSize: 12 },

  row2: { flexDirection: 'row', paddingHorizontal: 16 },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#777', marginTop: 8 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '800', color: '#333' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cardText: { color: '#444' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  badgeBlue: { backgroundColor: '#3498db' },
  badgeOrange: { backgroundColor: '#f39c12' },
  badgeGreen: { backgroundColor: '#2ecc71' },
  badgeGray: { backgroundColor: '#95a5a6' },

  kvRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  kvLabel: { color: '#666' },
  kvValue: { color: '#333', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '85%', maxWidth: 380 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontWeight: '700', color: '#333', fontSize: 16 },

  section: { marginTop: 8 },
  sectionTitle: { marginHorizontal: 16, marginBottom: 8, fontSize: 16, fontWeight: '700', color: '#333' },
  muted: { color: '#777' },

  listRowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listText: { color: '#333', fontWeight: '600' },
  smallMuted: { color: '#999', fontSize: 12 },
  bold: { color: '#333', fontWeight: '700' },

  approveBtn: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  approveBtnText: { color: '#fff', fontWeight: '700' },
  rejectBtn: { backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rejectBtnText: { color: '#fff', fontWeight: '700' },
});
