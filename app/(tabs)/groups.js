import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import CalendarPicker from '../../components/CalendarPicker';
import * as ImagePicker from 'expo-image-picker';
import {
  Users,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  UserPlus,
  ArrowLeft,
  Check,
  X,
  ChevronRight,
  CreditCard,
  Search,
  UserCheck,
  UserX,
  ThumbsUp,
  ListOrdered,
  ImagePlus,
  Trash2,
  Minus,
  Share2,
} from 'lucide-react-native';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [topTab, setTopTab] = useState('my');

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const [groupName, setGroupName] = useState('');
  const [numberOfMembers, setNumberOfMembers] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [startDate, setStartDate] = useState('');
  const [payoutOrder, setPayoutOrder] = useState('Automatic');
  const [groupLogo, setGroupLogo] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');

  const [groupNameError, setGroupNameError] = useState('');
  const [membersError, setMembersError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [dateError, setDateError] = useState('');

  const [availableGroups, setAvailableGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showJoinConfirmModal, setShowJoinConfirmModal] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('Orange Money');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentForMemberId, setPaymentForMemberId] = useState('');

  const [joinSearch, setJoinSearch] = useState('');

  const reminderTimer = useRef(null);
  const [lastReminderSlots, setLastReminderSlots] = useState({});

  const [showAssignCollectorModal, setShowAssignCollectorModal] = useState(false);
  const [assignCollectorId, setAssignCollectorId] = useState('');
  const [assignIdImage, setAssignIdImage] = useState('');
  const [assignMembersMap, setAssignMembersMap] = useState({});
  const latestNotifIdRef = useRef(null);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  
  const [showContactPickerModal, setShowContactPickerModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [selectedContactsMap, setSelectedContactsMap] = useState({});

  const frequencyOptions = ['Daily', 'Weekly', 'Monthly'];
  const payoutOptions = ['Automatic', 'Voting'];
  const providerOptions = ['Orange Money', 'Africell Money', 'Qcell Money', 'Manual Collection'];

  const [currentUser, setCurrentUser] = useState({ id: 'guest', name: 'You', phone: '' });

  useEffect(() => {
    loadProfileAndGroups();
  }, []);

  useEffect(() => {
    if (reminderTimer.current) clearInterval(reminderTimer.current);
    reminderTimer.current = setInterval(() => {
      try {
        runReminders();
      } catch (e) { console.log('reminder tick error', e); }
    }, 60 * 1000);
    setTimeout(() => runReminders(), 2000);
    return () => { if (reminderTimer.current) clearInterval(reminderTimer.current); };
  }, [availableGroups, currentUser]);

  const loadProfileAndGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const [storedGroups, userGroupsData, userData, mobileMoney] = await Promise.all([
        AsyncStorage.getItem('availableGroups'),
        AsyncStorage.getItem('userGroups'),
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('mobileMoney'),
      ]);

      if (userData) {
        const parsed = JSON.parse(userData);
        const id = parsed.phone || 'guest';
        setCurrentUser({ id, name: parsed.name || 'You', phone: parsed.phone || '' });
      }
      if (mobileMoney) {
        try {
          const mm = JSON.parse(mobileMoney);
          if (mm?.number) setPaymentNumber(mm.number);
        } catch {}
      }

      if (storedGroups) {
        const parsed = JSON.parse(storedGroups);
        const normalized = ensureGroupShape(ensureMembersList(parsed));
        setAvailableGroups(normalized);
        await AsyncStorage.setItem('availableGroups', JSON.stringify(normalized));
      } else {
        const sampleGroups = ensureGroupShape([
          {
            id: '1',
            name: 'Monthly Savers Circle',
            members: 8,
            maxMembers: 10,
            amount: 500,
            frequency: 'Monthly',
            startDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
            status: 'Open',
            creator: 'John Doe',
            payoutOrder: 'Voting',
            membersList: [
              { id: 'john', name: 'John Doe', phone: '+23288000123', role: 'Admin' },
              { id: 'am1', name: 'A. Kamara', phone: '+23277000001', role: 'Member' },
              { id: 'am2', name: 'B. Sesay', phone: '+23277000002', role: 'Member' },
              { id: 'am3', name: 'C. Conteh', phone: '+23277000003', role: 'Member' },
              { id: 'am4', name: 'D. Koroma', phone: '+23277000004', role: 'Member' },
              { id: 'am5', name: 'E. Bangura', phone: '+23277000005', role: 'Member' },
              { id: 'am6', name: 'F. Mansaray', phone: '+23277000006', role: 'Member' },
              { id: 'am7', name: 'G. Kamara', phone: '+23277000007', role: 'Member' },
            ],
          },
          {
            id: '2',
            name: 'Weekly Investment Group',
            members: 5,
            maxMembers: 8,
            amount: 150,
            frequency: 'Weekly',
            startDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
            status: 'Open',
            creator: 'Jane Smith',
            payoutOrder: 'Voting',
            membersList: [
              { id: 'jane', name: 'Jane Smith', phone: '+23299000123', role: 'Admin' },
              { id: 'wm1', name: 'H. Kamara', phone: '+23278000001', role: 'Member' },
              { id: 'wm2', name: 'I. Sesay', phone: '+23278000002', role: 'Member' },
              { id: 'wm3', name: 'J. Conteh', phone: '+23278000003', role: 'Member' },
              { id: 'wm4', name: 'K. Koroma', phone: '+23278000004', role: 'Member' },
            ],
          },
        ]);
        await AsyncStorage.setItem('availableGroups', JSON.stringify(sampleGroups));
        setAvailableGroups(sampleGroups);
      }

      if (userGroupsData) setUserGroups(JSON.parse(userGroupsData));
    } catch (error) {
      console.log('Error loading groups data:', error);
      Alert.alert('Error', 'Failed to load groups data');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const ensureMembersList = (groups) => {
    return groups.map((g) => {
      if (!g.membersList || !Array.isArray(g.membersList) || g.membersList.length === 0) {
        const admin = { id: (g.creator || 'admin').toLowerCase().replace(/\s+/g, ''), name: g.creator || 'Admin', phone: '', role: 'Admin' };
        const placeholders = Array.from({ length: Math.max(0, (g.members || 1) - 1) }).map((_, i) => ({ id: `${g.id}-m${i + 1}`, name: `Member ${i + 1}`, phone: '', role: 'Member' }));
        return { ...g, membersList: [admin, ...placeholders] };
      }
      return { ...g };
    });
  };

  const ensureGroupShape = (groups) => {
    return groups.map((g) => {
      const membersList = g.membersList || [];
      const admin = membersList.find((m) => m.role === 'Admin');
      const base = {
        ...g,
        members: membersList.length || g.members || 1,
        joinRequests: g.joinRequests || [],
        paymentsLedger: g.paymentsLedger || [],
        payoutSchedule: g.payoutSchedule || (g.payoutOrder === 'Automatic' ? membersList.map((m) => m.id) : []),
        payoutReceived: g.payoutReceived || [],
        voting: g.voting || { currentRound: 1, rounds: [] },
        logo: g.logo || '',
        collectorAssignments: g.collectorAssignments || [],
        notifications: g.notifications || [],
      };
      if (!base.voting.rounds || !Array.isArray(base.voting.rounds)) base.voting.rounds = [];
      const withVoting = setupVotingIfNeeded(base);
      if (!admin && membersList.length > 0) {
        withVoting.membersList = [ { ...membersList[0], role: 'Admin' }, ...membersList.slice(1) ];
      }
      return withVoting;
    });
  };

  const computePriorityScore = (group, memberId) => {
    const payments = (group.paymentsLedger || []).filter((p) => p.payerId === memberId);
    const contributions = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    let freqPerMonth = 4;
    if (group.frequency === 'Monthly') freqPerMonth = 1;
    if (group.frequency === 'Weekly') freqPerMonth = 4;
    if (group.frequency === 'Daily') freqPerMonth = 30;
    const monthsSinceStart = Math.max(1, Math.floor((Date.now() - new Date(group.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const expected = monthsSinceStart * freqPerMonth * (Number(group.amount) || 1);
    const timelyScore = expected > 0 ? Math.min(1, contributions / expected) : 0;
    const trustScoresRaw = group.trustScores || {};
    const trust = trustScoresRaw[memberId] || 0;
    return timelyScore * 10 + trust;
  };

  const setupVotingIfNeeded = (group) => {
    try {
      if (group.payoutOrder !== 'Voting') return group;
      const rounds = group.voting?.rounds || [];
      const alreadyScheduled = new Set(group.payoutSchedule || []);
      const allMemberIds = (group.membersList || []).map((m) => m.id);
      const remaining = allMemberIds.filter((id) => !alreadyScheduled.has(id));
      if (remaining.length === 0) return { ...group, voting: { ...group.voting, rounds } };

      const currentRoundIndex = Math.max(0, (group.voting?.currentRound || 1) - 1);
      if (!rounds[currentRoundIndex] || rounds[currentRoundIndex]?.finalized) {
        const candidatePool = [...remaining]
          .map((id) => ({ id, score: computePriorityScore(group, id) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(5, remaining.length))
          .map((x) => x.id);
        const newRound = {
          id: currentRoundIndex + 1,
          candidates: candidatePool,
          votes: {},
          finalized: false,
          winners: [],
        };
        const nextRounds = [...rounds];
        nextRounds[currentRoundIndex] = newRound;
        return { ...group, voting: { currentRound: currentRoundIndex + 1, rounds: nextRounds } };
      }
      return group;
    } catch (e) {
      console.log('setupVotingIfNeeded error', e);
      return group;
    }
  };

  const validateCreateGroupForm = () => {
    setGroupNameError('');
    setMembersError('');
    setAmountError('');
    setDateError('');

    let isValid = true;
    if (!groupName.trim()) {
      setGroupNameError('Group name is required');
      isValid = false;
    }
    if (!numberOfMembers) {
      setMembersError('Number of members is required');
      isValid = false;
    } else if (parseInt(numberOfMembers) < 2) {
      setMembersError('Minimum 2 members required');
      isValid = false;
    } else if (parseInt(numberOfMembers) > 500) {
      setMembersError('Maximum 500 members allowed');
      isValid = false;
    }
    if (!contributionAmount) {
      setAmountError('Contribution amount is required');
      isValid = false;
    } else if (parseFloat(contributionAmount) <= 0) {
      setAmountError('Amount must be greater than 0');
      isValid = false;
    }
    if (!startDate.trim()) {
      setDateError('Start date is required');
      isValid = false;
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate)) {
        setDateError('Date format should be YYYY-MM-DD');
        isValid = false;
      } else {
        const selectedDate = new Date(startDate);
        const today = new Date();
        if (selectedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          setDateError('Start date cannot be in the past');
          isValid = false;
        }
      }
    }
    return isValid;
  };

  const saveGroups = async (groups) => {
    setAvailableGroups(groups);
    await AsyncStorage.setItem('availableGroups', JSON.stringify(groups));
  };

  const handlePickLogo = async () => {
    console.log('handlePickLogo pressed');
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'Please allow photo access to choose a logo.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled) {
        console.log('Image picking cancelled');
        return;
      }
      const asset = result.assets && result.assets[0];
      if (!asset) return;
      const mime = asset.mimeType || 'image/jpeg';
      const uri = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
      setGroupLogo(uri);
      console.log('Logo selected');
    } catch (e) {
      console.log('handlePickLogo error', e);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const applyLogoUrl = () => {
    try {
      const url = logoUrlInput.trim();
      if (!url) { Alert.alert('Invalid', 'Enter an image URL'); return; }
      if (!/^https?:\/\//i.test(url) && !url.startsWith('data:')) {
        Alert.alert('Invalid', 'URL must start with http(s) or be a data URI');
        return;
      }
      setGroupLogo(url);
      console.log('Logo set from URL');
    } catch (e) {
      console.log('applyLogoUrl error', e);
    }
  };

  const setStartInDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setStartDate(`${yyyy}-${mm}-${dd}`);
  };

  const adjustStartDate = (deltaDays) => {
    try {
      const base = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? new Date(startDate) : new Date();
      base.setDate(base.getDate() + deltaDays);
      const yyyy = base.getFullYear();
      const mm = String(base.getMonth() + 1).padStart(2, '0');
      const dd = String(base.getDate()).padStart(2, '0');
      setStartDate(`${yyyy}-${mm}-${dd}`);
    } catch (e) {
      console.log('adjustStartDate error', e);
    }
  };

  const handleCreateGroup = async () => {
    if (!validateCreateGroupForm()) return;
    setIsLoading(true);
    try {
      const creatorName = currentUser.name || 'You';
      const newGroup = ensureGroupShape([
        {
          id: Date.now().toString(),
          name: groupName.trim(),
          members: 1,
          maxMembers: parseInt(numberOfMembers),
          amount: parseFloat(contributionAmount),
          frequency,
          startDate,
          status: 'Open',
          creator: creatorName,
          payoutOrder,
          createdAt: new Date().toISOString(),
          membersList: [
            { id: currentUser.id || 'you', name: creatorName, phone: currentUser.phone || '', role: 'Admin' },
          ],
          logo: groupLogo || '',
        },
      ])[0];

      const updatedGroups = [...availableGroups, newGroup];
      await saveGroups(updatedGroups);

      const updatedUserGroups = [...userGroups, newGroup.id];
      await AsyncStorage.setItem('userGroups', JSON.stringify(updatedUserGroups));
      setUserGroups(updatedUserGroups);

      setGroupName('');
      setNumberOfMembers('');
      setContributionAmount('');
      setFrequency('Monthly');
      setStartDate('');
      setPayoutOrder('Automatic');
      setGroupLogo('');
      setLogoUrlInput('');

      setIsLoading(false);
      setCurrentScreen('home');
    } catch (error) {
      setIsLoading(false);
      console.log('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const isUserInGroup = (group) => {
    return (group.membersList || []).some((m) => m.id === currentUser.id || (!!currentUser.phone && m.phone === currentUser.phone));
  };

  const hasPendingRequestForUser = (group) => {
    return (group.joinRequests || []).some((r) => r.user?.id === currentUser.id && r.status === 'pending');
  };

  const handleJoinGroup = async (group) => {
    if (group.members >= group.maxMembers) {
      Alert.alert('Group Full', 'This group has reached its maximum capacity.');
      return;
    }
    if (isUserInGroup(group)) {
      openDetails(group);
      return;
    }
    setSelectedGroup(group);
    setShowJoinConfirmModal(true);
  };

  const confirmJoinGroup = async () => {
    if (!selectedGroup) return;
    setIsLoading(true);
    setShowJoinConfirmModal(false);
    try {
      const updatedGroups = availableGroups.map((g) => {
        if (g.id === selectedGroup.id) {
          if (hasPendingRequestForUser(g)) return g;
          const request = {
            id: `${Date.now()}-${currentUser.id}`,
            user: { id: currentUser.id, name: currentUser.name, phone: currentUser.phone },
            requestedAt: new Date().toISOString(),
            status: 'pending',
          };
          const joinRequests = [...(g.joinRequests || []), request];
          return { ...g, joinRequests };
        }
        return g;
      });
      await saveGroups(updatedGroups);
      setIsLoading(false);
      Alert.alert('Request Sent', 'Your join request was sent to the group admin.');
    } catch (error) {
      setIsLoading(false);
      console.log('Error requesting to join group:', error);
      Alert.alert('Error', 'Failed to send join request. Please try again.');
    }
    setSelectedGroup(null);
  };

  const approveJoinRequest = async (groupId, requestId) => {
    try {
      setIsLoading(true);
      const updated = availableGroups.map((g) => {
        if (g.id !== groupId) return g;
        const req = (g.joinRequests || []).find((r) => r.id === requestId);
        if (!req || req.status !== 'pending') return g;
        const exists = (g.membersList || []).some((m) => m.id === req.user.id || (!!req.user.phone && m.phone === req.user.phone));
        const newMembersList = exists ? g.membersList : [ ...(g.membersList || []), { id: req.user.id, name: req.user.name, phone: req.user.phone, role: 'Member' } ];
        const updatedRequests = (g.joinRequests || []).map((r) => r.id === requestId ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r);
        const newGroup = ensureGroupShape([{ ...g, membersList: newMembersList, members: newMembersList.length, joinRequests: updatedRequests }])[0];
        return newGroup;
      });
      await saveGroups(updated);
      const latest = updated.find((g) => g.id === groupId) || null;
      if (selectedGroup && selectedGroup.id === groupId) setSelectedGroup(latest);
      setIsLoading(false);
      Alert.alert('Approved', 'Member has been approved and added to the group.');
    } catch (e) {
      setIsLoading(false);
      console.log('approveJoinRequest error', e);
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const rejectJoinRequest = async (groupId, requestId) => {
    try {
      setIsLoading(true);
      const updated = availableGroups.map((g) => {
        if (g.id !== groupId) return g;
        const updatedRequests = (g.joinRequests || []).map((r) => r.id === requestId ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString() } : r);
        return { ...g, joinRequests: updatedRequests };
      });
      await saveGroups(updated);
      const latest = updated.find((g) => g.id === groupId) || null;
      if (selectedGroup && selectedGroup.id === groupId) setSelectedGroup(latest);
      setIsLoading(false);
      Alert.alert('Rejected', 'Join request rejected.');
    } catch (e) {
      setIsLoading(false);
      console.log('rejectJoinRequest error', e);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const formatCurrency = (amount) => {
    try {
      return `NLe ${new Intl.NumberFormat('en-SL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)}`;
    } catch {
      return `NLe ${amount}`;
    }
  };

  const getActiveRecipientId = (g) => {
    const schedule = g.payoutSchedule || [];
    const received = new Set(g.payoutReceived || []);
    const next = schedule.find((mId) => !received.has(mId));
    return next || (g.membersList?.[0]?.id || '');
  };

  const openDetails = (group) => {
    const latest = availableGroups.find((g) => g.id === group.id) || group;
    setSelectedGroup(latest);
    try { const last = (latest.notifications||[]).slice(-1)[0]; latestNotifIdRef.current = last ? last.id : null; } catch {}
    setPaymentAmount(String(latest.amount || ''));
    const activeId = getActiveRecipientId(latest);
    setPaymentForMemberId(activeId);
    setCurrentScreen('details');
  };

  const highlightText = (text, q) => {
    try {
      const query = (q || '').trim();
      if (!query) return <Text style={styles.groupName}>{text}</Text>;
      const lower = String(text || '').toLowerCase();
      const idx = lower.indexOf(query.toLowerCase());
      if (idx === -1) return <Text style={styles.groupName}>{text}</Text>;
      const before = String(text).slice(0, idx);
      const match = String(text).slice(idx, idx + query.length);
      const after = String(text).slice(idx + query.length);
      return (
        <Text style={styles.groupName}>
          <Text>{before}</Text>
          <Text style={{ color: '#FFA500', fontWeight: 'bold' }}>{match}</Text>
          <Text>{after}</Text>
        </Text>
      );
    } catch (e) {
      return <Text style={styles.groupName}>{text}</Text>;
    }
  };

  const renderGroupCard = ({ item: group }) => {
    const isUserMember = isUserInGroup(group);
    const isFull = group.members >= group.maxMembers;
    const pending = hasPendingRequestForUser(group);
    return (
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            {group.logo ? (
              <Image source={{ uri: group.logo }} style={styles.groupLogo} contentFit="cover" />
            ) : (
              <View style={styles.groupLogoPlaceholder}>
                <Text style={styles.groupLogoInitial}>{(group.name || 'G').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {highlightText(group.name, joinSearch)}
          </View>
          <View style={[styles.statusBadge, isFull ? styles.statusFull : styles.statusOpen]}>
            <Text style={[styles.statusText, isFull ? styles.statusTextFull : styles.statusTextOpen]}>{isFull ? 'Full' : 'Open'}</Text>
          </View>
        </View>
        <View style={styles.groupDetails}>
          <View style={styles.detailRow}>
            <Users color="#5CCEF4" size={16} />
            <Text style={styles.detailText}>{group.members}/{group.maxMembers} members</Text>
          </View>
          <View style={styles.detailRow}>
            <DollarSign color="#FFA500" size={16} />
            <Text style={styles.detailText}>{formatCurrency(group.amount)} {group.frequency.toLowerCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Calendar color="#666" size={16} />
            <Text style={styles.detailText}>Starts: {new Date(group.startDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock color="#666" size={16} />
            <Text style={styles.detailText}>Frequency: {group.frequency}</Text>
          </View>
        </View>
        <View style={[styles.groupActions, { flexDirection: 'row', gap: 10 }]}>
          {isUserMember ? (
            <>
              <View style={styles.joinedBadge}>
                <Check color="#4CAF50" size={16} />
                <Text style={styles.joinedText}>Joined</Text>
              </View>
              <TouchableOpacity style={[styles.joinButton, { backgroundColor: '#FFA500' }]} onPress={() => openDetails(group)} testID={`viewDetails-${group.id}`}>
                <ChevronRight color="#fff" size={16} />
                <Text style={styles.joinButtonText}>Details</Text>
              </TouchableOpacity>
            </>
          ) : pending ? (
            <>
              <View style={[styles.joinedBadge, { backgroundColor: '#fff5e6' }]}>
                <Clock color="#FFA500" size={16} />
                <Text style={[styles.joinedText, { color: '#FFA500' }]}>Pending</Text>
              </View>
              <TouchableOpacity style={[styles.joinButton, { backgroundColor: '#FFA500' }]} onPress={() => openDetails(group)}>
                <ChevronRight color="#fff" size={16} />
                <Text style={styles.joinButtonText}>Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
              onPress={() => handleJoinGroup(group)}
              disabled={isFull}
              testID={`join-${group.id}`}
            >
              <UserPlus color={isFull ? '#ccc' : '#fff'} size={16} />
              <Text style={[styles.joinButtonText, isFull && styles.joinButtonTextDisabled]}>{isFull ? 'Full' : 'Request to Join'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderFrequencyModal = () => (
    <Modal visible={showFrequencyModal} transparent animationType="slide" onRequestClose={() => setShowFrequencyModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Frequency</Text>
            <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>
          {frequencyOptions.map((option) => (
            <TouchableOpacity key={option} style={[styles.modalOption, frequency === option && styles.modalOptionSelected]} onPress={() => { setFrequency(option); setShowFrequencyModal(false); }}>
              <Text style={[styles.modalOptionText, frequency === option && styles.modalOptionTextSelected]}>{option}</Text>
              {frequency === option && <Check color="#FFA500" size={20} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderPayoutModal = () => (
    <Modal visible={showPayoutModal} transparent animationType="slide" onRequestClose={() => setShowPayoutModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payout Order</Text>
            <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>
          {payoutOptions.map((option) => (
            <TouchableOpacity key={option} style={[styles.modalOption, payoutOrder === option && styles.modalOptionSelected]} onPress={() => { setPayoutOrder(option); setShowPayoutModal(false); }}>
              <Text style={[styles.modalOptionText, payoutOrder === option && styles.modalOptionTextSelected]}>{option}</Text>
              {payoutOrder === option && <Check color="#FFA500" size={20} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderJoinConfirmModal = () => (
    <Modal visible={showJoinConfirmModal} transparent animationType="fade" onRequestClose={() => setShowJoinConfirmModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <Text style={styles.confirmTitle}>Request to Join</Text>
          {selectedGroup ? (
            <>
              <Text style={styles.confirmMessage}>Send a request to join {selectedGroup.name}. Admin approval is required.</Text>
              <View style={styles.confirmDetails}>
                <Text style={styles.confirmDetailText}>• Contribution: {formatCurrency(selectedGroup.amount)} {selectedGroup.frequency.toLowerCase()}</Text>
                <Text style={styles.confirmDetailText}>• Start Date: {new Date(selectedGroup.startDate).toLocaleDateString()}</Text>
                <Text style={styles.confirmDetailText}>• Members: {Math.min(selectedGroup.members + 1, selectedGroup.maxMembers)}/{selectedGroup.maxMembers}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowJoinConfirmModal(false); setSelectedGroup(null); }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmJoinGroup} disabled={isLoading} testID="confirmJoin">
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Send Request</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHomeScreen = () => {
    const createdByYou = availableGroups.filter((g) => (g.membersList||[]).some(m => m.role === 'Admin' && (m.id === currentUser.id || (!!currentUser.phone && m.phone === currentUser.phone))));
    const joinedByYou = availableGroups.filter((g) => isUserInGroup(g) && !(g.membersList||[]).some(m => m.role === 'Admin' && (m.id === currentUser.id || (!!currentUser.phone && m.phone === currentUser.phone))));
    const requestable = availableGroups.filter((g) => !isUserInGroup(g));

    const data = topTab === 'my' ? createdByYou : topTab === 'joined' ? joinedByYou : requestable;

    const ItemRow = ({ item }) => (
      <TouchableOpacity style={styles.listRow} onPress={() => (isUserInGroup(item) ? openDetails(item) : handleJoinGroup(item))}>
        <View style={styles.listRowIconBox}>
          <Users color="#7a6b65" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listRowTitle}>{item.name}</Text>
          <Text style={styles.listRowSubtitle}>{item.members} members</Text>
        </View>
        <ChevronRight color="#7a6b65" size={20} />
      </TouchableOpacity>
    );

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topHeaderBar}>
          <Text style={styles.topHeaderTitle}>Osusu Groups</Text>
        </View>

        <View style={styles.segmentBar}>
          <TouchableOpacity onPress={() => setTopTab('my')} style={[styles.segmentBtn, topTab === 'my' && styles.segmentBtnActive]} testID="tabMy">
            <Text style={[styles.segmentText, topTab === 'my' && styles.segmentTextActive]}>My Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTopTab('joined')} style={[styles.segmentBtn, topTab === 'joined' && styles.segmentBtnActive]} testID="tabJoined">
            <Text style={[styles.segmentText, topTab === 'joined' && styles.segmentTextActive]}>Joined Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTopTab('request')} style={[styles.segmentBtn, topTab === 'request' && styles.segmentBtnActive]} testID="tabRequest">
            <Text style={[styles.segmentText, topTab === 'request' && styles.segmentTextActive]}>Request</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}>
          <View style={styles.section}>
            {isLoadingGroups ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFA500" size="large" />
                <Text style={styles.loadingText}>Loading groups...</Text>
              </View>
            ) : data.length === 0 ? (
              <View style={styles.emptyState}>
                <Users color="#ccc" size={48} />
                <Text style={styles.emptyStateText}>{topTab === 'request' ? 'No groups available' : 'No groups yet'}</Text>
                <Text style={styles.emptyStateSubtext}>{topTab === 'request' ? 'Tap Join Existing Group below' : 'Tap Create New Group below'}</Text>
              </View>
            ) : (
              <FlatList data={data} renderItem={ItemRow} keyExtractor={(item) => item.id} scrollEnabled={false} />
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomCtas}>
          <TouchableOpacity style={styles.primaryCta} onPress={() => setCurrentScreen('create')} testID="primaryCreate">
            <Text style={styles.primaryCtaText}>Create New Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryCta} onPress={() => setCurrentScreen('join')} testID="secondaryJoin">
            <Text style={styles.secondaryCtaText}>Join Existing Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  const renderCreateGroupScreen = () => (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.screenHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
              <ArrowLeft color="#FFA500" size={24} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Create New Group</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.textInput} placeholder="Enter group name" value={groupName} onChangeText={setGroupName} maxLength={50} />
              </View>
              {groupNameError ? <Text style={styles.errorText}>{groupNameError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Logo (optional)</Text>
              {groupLogo ? (
                <View style={styles.logoPreviewRow}>
                  <Image source={{ uri: groupLogo }} style={styles.logoPreview} contentFit="cover" />
                  <TouchableOpacity style={styles.removeLogoBtn} onPress={() => { setGroupLogo(''); setLogoUrlInput(''); }} testID="removeLogoBtn">
                    <Trash2 color="#fff" size={16} />
                    <Text style={styles.removeLogoText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity style={styles.logoBtn} onPress={handlePickLogo} testID="pickLogoBtn">
                    <ImagePlus color="#FFA500" size={18} />
                    <Text style={styles.logoBtnText}>Choose Image</Text>
                  </TouchableOpacity>
                  <View style={[styles.inputContainer, { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 8, height: 50 }]}>
                    <TextInput style={[styles.textInput, { flex: 1, height: 48 }]} placeholder="Paste image URL" value={logoUrlInput} onChangeText={setLogoUrlInput} autoCapitalize="none" testID="logoUrlInput" />
                    <TouchableOpacity onPress={applyLogoUrl} style={styles.applyUrlBtn} testID="applyLogoUrlBtn">
                      <Text style={styles.applyUrlBtnText}>Use</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of Members *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter number of members"
                  value={numberOfMembers}
                  onChangeText={(text) => setNumberOfMembers(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              {membersError ? <Text style={styles.errorText}>{membersError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contribution Amount (NLe) *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter contribution amount in NLe"
                  value={contributionAmount}
                  onChangeText={(text) => setContributionAmount(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
              {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contribution Frequency *</Text>
              <TouchableOpacity style={styles.selectorContainer} onPress={() => setShowFrequencyModal(true)}>
                <Text style={styles.selectorText}>{frequency}</Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date *</Text>
              <CalendarPicker
                label="Select start date"
                value={startDate}
                onChange={setStartDate}
                minDate={new Date().toISOString().slice(0,10)}
                testIDPrefix="startDate"
              />
              <View style={styles.dateQuickRow}>
                <TouchableOpacity style={styles.quickChip} onPress={() => setStartInDays(0)} testID="quickDateToday">
                  <Calendar color="#FFA500" size={14} />
                  <Text style={styles.quickChipText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickChip} onPress={() => setStartInDays(3)} testID="quickDate3">
                  <Text style={styles.quickChipText}>+3 days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickChip} onPress={() => setStartInDays(7)} testID="quickDate7">
                  <Text style={styles.quickChipText}>+7 days</Text>
                </TouchableOpacity>
                <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustStartDate(-1)} testID="dateMinus">
                    <Minus color="#FFA500" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustStartDate(1)} testID="datePlus">
                    <Plus color="#FFA500" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
              {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payout Order *</Text>
              <TouchableOpacity style={styles.selectorContainer} onPress={() => setShowPayoutModal(true)}>
                <Text style={styles.selectorText}>{payoutOrder}</Text>
                <Text style={styles.selectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup} disabled={isLoading} testID="createBtn">
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createButtonText}>Create Group</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderJoinGroupScreen = () => {
    const availableToJoinRaw = availableGroups.filter((g) => !isUserInGroup(g) && g.members < g.maxMembers);
    const q = joinSearch.toLowerCase().trim();
    const availableToJoin = availableToJoinRaw.filter((g) => {
      if (!q) return true;
      const name = (g.name || '').toLowerCase();
      const creator = (g.creator || '').toLowerCase();
      const freq = (g.frequency || '').toLowerCase();
      const amountStr = String(g.amount ?? '').toLowerCase();
      const startStr = (g.startDate ? new Date(g.startDate).toLocaleDateString() : '').toLowerCase();
      const memberNames = (g.membersList || []).map((m) => (m.name || '').toLowerCase());
      return [name, creator, freq, amountStr, startStr, ...memberNames].some((s) => s.includes(q));
    });
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
            <ArrowLeft color="#FFA500" size={24} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Join a Group</Text>
        </View>
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={[styles.section, { paddingTop: 12 }]}>
            <View style={styles.searchBar}>
              <Search color="#666" size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search groups..."
                value={joinSearch}
                onChangeText={setJoinSearch}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                testID="joinSearchInput"
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Choose from available groups below</Text>
            {isLoadingGroups ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFA500" size="large" />
                <Text style={styles.loadingText}>Loading groups...</Text>
              </View>
            ) : (
              <FlatList
                data={availableToJoin}
                renderItem={renderGroupCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Users color="#ccc" size={48} />
                    <Text style={styles.emptyStateText}>No groups found</Text>
                    <Text style={styles.emptyStateSubtext}>Try a different search</Text>
                  </View>
                }
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  const renderJoinedGroupsScreen = () => {
    const myGroups = availableGroups.filter((g) => isUserInGroup(g));
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
            <ArrowLeft color="#FFA500" size={24} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Joined Groups</Text>
        </View>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}>
          <View style={styles.section}>
            {myGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <Users color="#ccc" size={48} />
                <Text style={styles.emptyStateText}>No joined groups yet</Text>
              </View>
            ) : (
              <FlatList data={myGroups} renderItem={renderGroupCard} keyExtractor={(item) => item.id} scrollEnabled={false} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  const castVote = async (groupId, selectedIds) => {
    try {
      setIsLoading(true);
      const updated = availableGroups.map((g) => {
        if (g.id !== groupId) return g;
        if (g.payoutOrder !== 'Voting') return g;
        const roundIndex = Math.max(0, (g.voting?.currentRound || 1) - 1);
        const rounds = g.voting?.rounds || [];
        const round = rounds[roundIndex];
        if (!round || round.finalized) return g;
        const votes = { ...(round.votes || {}) };
        votes[currentUser.id] = Array.from(new Set((selectedIds || []).filter((id) => round.candidates.includes(id)).slice(0, 2)));
        const newRound = { ...round, votes };
        const newRounds = [...rounds];
        newRounds[roundIndex] = newRound;
        return { ...g, voting: { ...g.voting, rounds: newRounds } };
      });
      await saveGroups(updated);
      const latest = updated.find((g) => g.id === groupId) || null;
      if (selectedGroup && selectedGroup.id === groupId) setSelectedGroup(latest);
      setIsLoading(false);
      Alert.alert('Vote Submitted', 'Your vote has been recorded.');
    } catch (e) {
      setIsLoading(false);
      console.log('castVote error', e);
      Alert.alert('Error', 'Failed to submit vote');
    }
  };

  const finalizeRound = async (groupId) => {
    try {
      setIsLoading(true);
      const updated = availableGroups.map((g) => {
        if (g.id !== groupId) return g;
        if (g.payoutOrder !== 'Voting') return g;
        const roundIndex = Math.max(0, (g.voting?.currentRound || 1) - 1);
        const rounds = g.voting?.rounds || [];
        const round = rounds[roundIndex];
        if (!round || round.finalized) return g;
        const tally = {};
        const voters = Object.keys(round.votes || {});
        voters.forEach((vId) => {
          (round.votes[vId] || []).forEach((cId) => {
            tally[cId] = (tally[cId] || 0) + 1;
          });
        });
        const ranked = [...round.candidates]
          .map((id) => ({ id, votes: tally[id] || 0, score: computePriorityScore(g, id) }))
          .sort((a, b) => (b.votes - a.votes) || (b.score - a.score));
        const winners = ranked.slice(0, Math.min(2, ranked.length)).map((x) => x.id);
        const newSchedule = [...(g.payoutSchedule || []), ...winners];
        const newRound = { ...round, winners, finalized: true };
        const newRounds = [...rounds];
        newRounds[roundIndex] = newRound;
        const remainingCount = (g.membersList || []).length - newSchedule.length;
        const nextRoundIndex = roundIndex + 1;
        const newVoting = { currentRound: nextRoundIndex + 1, rounds: newRounds };
        const nextGroup = ensureGroupShape([{ ...g, payoutSchedule: newSchedule, voting: newVoting }])[0];
        return nextGroup;
      });
      await saveGroups(updated);
      const latest = updated.find((g) => g.id === groupId) || null;
      if (selectedGroup && selectedGroup.id === groupId) setSelectedGroup(latest);
      setIsLoading(false);
      Alert.alert('Round Finalized', 'Voting round finalized and payout order updated.');
    } catch (e) {
      setIsLoading(false);
      console.log('finalizeRound error', e);
      Alert.alert('Error', 'Failed to finalize round');
    }
  };

  const markRecipientReceived = async (groupId, memberId) => {
    try {
      const updated = availableGroups.map((g) => {
        if (g.id !== groupId) return g;
        const received = new Set(g.payoutReceived || []);
        received.add(memberId);
        return { ...g, payoutReceived: Array.from(received) };
      });
      await saveGroups(updated);
      const latest = updated.find((g) => g.id === groupId) || null;
      if (selectedGroup && selectedGroup.id === groupId) setSelectedGroup(latest);
      Alert.alert('Updated', 'Recipient marked as received.');
    } catch (e) {
      console.log('markRecipientReceived error', e);
      Alert.alert('Error', 'Failed to update recipient');
    }
  };

  const paymentSummaries = useMemo(() => {
    if (!selectedGroup) return { byRecipient: {}, recent: [] };
    const g = availableGroups.find((x) => x.id === selectedGroup.id) || selectedGroup;
    const ledger = g.paymentsLedger || [];
    const byRecipient = {};
    ledger.forEach((p) => {
      if (!byRecipient[p.forMemberId]) byRecipient[p.forMemberId] = {};
      byRecipient[p.forMemberId][p.payerId] = (byRecipient[p.forMemberId][p.payerId] || 0) + Number(p.amount || 0);
    });
    const recent = [...ledger].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    return { byRecipient, recent };
  }, [selectedGroup, availableGroups]);

  useEffect(() => {
    try {
      if (!selectedGroup) return;
      const g = availableGroups.find((x)=>x.id === selectedGroup.id) || selectedGroup;
      const last = (g.notifications||[]).slice(-1)[0];
      if (!last) return;
      if (latestNotifIdRef.current !== last.id) {
        latestNotifIdRef.current = last.id;
        Alert.alert('Group Alert', last.message);
      }
    } catch (e) { console.log('group alert popup', e); }
  }, [availableGroups, selectedGroup]);

  const timeSlots = [
    { label: '7am', h: 7 },
    { label: '2pm', h: 14 },
    { label: '7pm', h: 19 },
  ];

  const isWithinTwoDays = (iso) => {
    try {
      const d = new Date(iso);
      const diff = d.getTime() - Date.now();
      return diff <= 2 * 24 * 3600 * 1000 && diff >= 0;
    } catch { return false; }
  };

  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  };

  const hasPaidForCurrentRecipient = (g) => {
    try {
      const activeId = getActiveRecipientId(g);
      const you = currentUser.id;
      return (g.paymentsLedger || []).some((p) => p.payerId === you && p.forMemberId === activeId);
    } catch { return false; }
  };

  const runReminders = async () => {
    try {
      const todayKey = getTodayKey();
      const now = new Date();
      const hour = now.getHours();
      const mins = now.getMinutes();
      const slot = timeSlots.find((s) => s.h === hour && mins < 5);
      if (!slot) return;
      const last = lastReminderSlots[todayKey] || {};
      if (last[slot.label]) return;

      const dueGroups = (availableGroups || []).filter((g) => isUserInGroup(g) && isWithinTwoDays(g.startDate) && !hasPaidForCurrentRecipient(g));
      if (dueGroups.length > 0) {
        const names = dueGroups.map((g)=>`• ${g.name}`).join('\n');
        Alert.alert('Contribution Reminder', `You have upcoming contributions in:\n${names}`, [
          { text: 'Dismiss' },
        ]);
      }
      const next = { ...lastReminderSlots, [todayKey]: { ...(lastReminderSlots[todayKey]||{}), [slot.label]: true } };
      setLastReminderSlots(next);
      await AsyncStorage.setItem('groupReminderSlots', JSON.stringify(next));
    } catch (e) { console.log('runReminders error', e); }
  };

  useEffect(() => {
    (async () => {
      try { const raw = await AsyncStorage.getItem('groupReminderSlots'); if (raw) setLastReminderSlots(JSON.parse(raw)); } catch {}
    })();
  }, []);

  const renderDetailsScreen = () => {
    if (!selectedGroup) return null;
    const g = availableGroups.find((x) => x.id === selectedGroup.id) || selectedGroup;
    const admin = (g.membersList || []).find((m) => m.role === 'Admin');
    const others = (g.membersList || []).filter((m) => m.role !== 'Admin');
    const isAdmin = !!(g.membersList || []).find((m) => m.role === 'Admin' && (m.id === currentUser.id || (!!currentUser.phone && m.phone === currentUser.phone)));

    const activeAssignment = (g.collectorAssignments || []).find((a) => a.active);
    const isCollector = !!activeAssignment && activeAssignment.collectorId === currentUser.id;

    const roundIndex = Math.max(0, (g.voting?.currentRound || 1) - 1);
    const currentRound = g.voting?.rounds?.[roundIndex];
    const youVotes = currentRound?.votes?.[currentUser.id] || [];
    const tally = {};
    (currentRound?.candidates || []).forEach((cid) => { tally[cid] = 0; });
    Object.values(currentRound?.votes || {}).forEach((arr) => {
      (arr || []).forEach((cid) => { tally[cid] = (tally[cid] || 0) + 1; });
    });
    const activeRecipientId = getActiveRecipientId(g);
    const activeRecipient = (g.membersList || []).find((m) => m.id === activeRecipientId);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')} testID="backFromDetails">
            <ArrowLeft color="#FFA500" size={24} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{g.name}</Text>
        </View>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}>
          <View style={styles.section}>
            <View style={styles.groupCard}>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                {g.logo ? (
                  <Image source={{ uri: g.logo }} style={styles.detailLogo} contentFit="cover" />
                ) : (
                  <View style={styles.detailLogoPlaceholder}>
                    <Text style={styles.detailLogoInitial}>{(g.name || 'G').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{g.name}</Text>
                <View style={[styles.statusBadge, g.members >= g.maxMembers ? styles.statusFull : styles.statusOpen]}>
                  <Text style={[styles.statusText, g.members >= g.maxMembers ? styles.statusTextFull : styles.statusTextOpen]}>{g.members >= g.maxMembers ? 'Full' : 'Open'}</Text>
                </View>
              </View>
              <View style={styles.groupDetails}>
                <View style={styles.detailRow}>
                  <DollarSign color="#FFA500" size={16} />
                  <Text style={styles.detailText}>{formatCurrency(g.amount)} {g.frequency.toLowerCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar color="#666" size={16} />
                  <Text style={styles.detailText}>Start: {new Date(g.startDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock color="#666" size={16} />
                  <Text style={styles.detailText}>Frequency: {g.frequency}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.groupCard, { marginTop: 12 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Admin</Text>
              {admin ? (
                <View style={styles.memberRow}>
                  <Check color="#4CAF50" size={16} />
                  <Text style={styles.memberName}>{admin.name}</Text>
                  <Text style={styles.memberRole}>Admin</Text>
                </View>
              ) : (
                <Text style={styles.detailText}>No admin info</Text>
              )}

              <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 8 }]}>Members ({g.members})</Text>
              {(others.length === 0 ? [] : others).map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <Users color="#5CCEF4" size={16} />
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberRole}>Member</Text>
                </View>
              ))}
              {others.length === 0 ? <Text style={styles.detailText}>No other members yet</Text> : null}
            </View>

            {isAdmin ? (
              <View style={[styles.groupCard, { marginTop: 12 }]}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Pending Requests</Text>
                {(g.joinRequests || []).filter((r) => r.status === 'pending').length === 0 ? (
                  <Text style={styles.detailText}>No pending join requests</Text>
                ) : (
                  (g.joinRequests || []).filter((r) => r.status === 'pending').map((r) => (
                    <View key={r.id} style={[styles.memberRow, { alignItems: 'center' }]}>
                      <Users color="#666" size={16} />
                      <Text style={styles.memberName}>{r.user?.name} ({r.user?.phone || 'N/A'})</Text>
                      <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => approveJoinRequest(g.id, r.id)} testID={`approve-${r.id}`}>
                          <UserCheck color="#fff" size={14} />
                          <Text style={styles.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectJoinRequest(g.id, r.id)} testID={`reject-${r.id}`}>
                          <UserX color="#fff" size={14} />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}

            <View style={[styles.groupCard, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <ListOrdered color="#FFA500" size={18} />
                <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Payout Schedule</Text>
              </View>
              {(g.payoutSchedule || []).length === 0 ? (
                <Text style={styles.detailText}>No schedule yet. Participate in voting to create one.</Text>
              ) : (
                (g.payoutSchedule || []).map((id, idx) => {
                  const mm = (g.membersList || []).find((m) => m.id === id);
                  const received = (g.payoutReceived || []).includes(id);
                  return (
                    <View key={`${id}-${idx}`} style={[styles.memberRow, { opacity: received ? 0.6 : 1 }]}>
                      <Text style={styles.memberRole}>#{idx + 1}</Text>
                      <Text style={[styles.memberName, { marginLeft: 8 }]}>{mm?.name || id}</Text>
                      <Text style={[styles.memberRole, { marginLeft: 'auto' }]}>{received ? 'Received' : (idx === (g.payoutReceived || []).length ? 'Current' : 'Upcoming')}</Text>
                      {isAdmin && !received && idx === (g.payoutReceived || []).length ? (
                        <TouchableOpacity onPress={() => markRecipientReceived(g.id, id)} style={[styles.approveBtn, { marginLeft: 8 }]} testID={`markReceived-${id}`}>
                          <Check color="#fff" size={14} />
                          <Text style={styles.approveBtnText}>Mark Received</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>

            {g.payoutOrder === 'Voting' ? (
              <View style={[styles.groupCard, { marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <ThumbsUp color="#5CCEF4" size={18} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Voting - Round {g.voting?.currentRound || 1}</Text>
                </View>
                {!currentRound || currentRound.finalized ? (
                  <Text style={styles.detailText}>No active voting at the moment.</Text>
                ) : (
                  <>
                    {(currentRound.candidates || []).map((cid) => {
                      const m = (g.membersList || []).find((x) => x.id === cid);
                      const selected = youVotes.includes(cid);
                      return (
                        <TouchableOpacity key={cid} style={[styles.modalOption, selected && styles.modalOptionSelected]} onPress={() => {
                          let next = youVotes.includes(cid) ? youVotes.filter((x) => x !== cid) : [...youVotes, cid];
                          next = next.slice(0, 2);
                          castVote(g.id, next);
                        }} testID={`vote-${cid}`}>
                          <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>{m?.name || cid}</Text>
                          <Text style={styles.memberRole}>{tally[cid] || 0} votes</Text>
                        </TouchableOpacity>
                      );
                    })}
                    <Text style={[styles.detailText, { marginTop: 6 }]}>Tip: You can select up to 2 members.</Text>
                    {isAdmin ? (
                      <TouchableOpacity style={[styles.createButton, styles.detailButton, { marginTop: 10 }]} onPress={() => finalizeRound(g.id)} testID="finalizeRoundBtn">
                        <Text style={[styles.createButtonText, styles.detailButtonText]}>Finalize Round</Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}



            <View style={[styles.groupCard, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CreditCard color="#FFA500" size={18} />
                  <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Payments</Text>
                </View>
                {isAdmin ? (
                  <TouchableOpacity onPress={async ()=>{
                    try {
                      const alertMsg = `Reminder: Please make your ${g.frequency} contribution of ${formatCurrency(g.amount)} for ${g.name}.`;
                      const updated = availableGroups.map((gg)=>{
                        if (gg.id !== g.id) return gg;
                        const notifications = [...(gg.notifications||[]), { id: Date.now().toString(), type: 'admin-reminder', message: alertMsg, date: new Date().toISOString() }];
                        return { ...gg, notifications };
                      });
                      await saveGroups(updated);
                      Alert.alert('Sent', 'Reminder posted to group feed.');
                    } catch (e) { console.log('send admin alert', e); }
                  }} style={[styles.approveBtn, { backgroundColor: '#1877F2' }]} testID="sendAdminReminder">
                    <Text style={styles.approveBtnText}>Send Reminder</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={[styles.detailText, { marginBottom: 8 }]}>Current Recipient: {activeRecipient?.name || 'N/A'}</Text>
              <TouchableOpacity style={[styles.createButton, styles.detailButton, { flexDirection: 'row', gap: 8 }]} onPress={() => { setPaymentAmount(String(g.amount || '')); setPaymentForMemberId(activeRecipientId); const canManual = !!activeAssignment && activeAssignment.collectorId === currentUser.id; setPaymentProvider(canManual ? 'Manual Collection' : 'Orange Money'); setShowPaymentModal(true); }} testID="payContributionBtn">
                <CreditCard color="#FFA500" size={18} />
                <Text style={[styles.createButtonText, styles.detailButtonText]}>Pay Contribution</Text>
              </TouchableOpacity>

              {isAdmin ? (
                <TouchableOpacity style={[styles.createButton, styles.detailButton, { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={() => setShowAssignCollectorModal(true)} testID="assignCollectorBtn">
                  <Users color="#FFA500" size={18} />
                  <Text style={[styles.createButtonText, styles.detailButtonText]}>Collector</Text>
                </TouchableOpacity>
              ) : null}

              {isAdmin && (!!currentRound && !currentRound.finalized) ? (
                <TouchableOpacity style={[styles.detailButton, { marginTop: 8 }]} onPress={() => finalizeRound(g.id)} testID="finalizeRoundBtn">
                  <Text style={styles.detailButtonText}>Finalize Round</Text>
                </TouchableOpacity>
              ) : null}

              <View style={{ marginTop: 12 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Totals by Recipient</Text>
                {Object.keys(paymentSummaries.byRecipient || {}).length === 0 ? (
                  <Text style={styles.detailText}>No payments yet.</Text>
                ) : (
                  Object.entries(paymentSummaries.byRecipient).map(([recipientId, payerMap]) => {
                    const recip = (g.membersList || []).find((m) => m.id === recipientId);
                    return (
                      <View key={`sum-${recipientId}`} style={{ marginBottom: 10 }}>
                        <Text style={[styles.memberName, { marginBottom: 4 }]}>For {recip?.name || recipientId}</Text>
                        {Object.entries(payerMap).map(([payerId, total]) => {
                          const payer = (g.membersList || []).find((m) => m.id === payerId);
                          return (
                            <View key={`sum-${recipientId}-${payerId}`} style={styles.detailRow}>
                              <Users color="#5CCEF4" size={14} />
                              <Text style={styles.detailText}>{payer?.name || payerId}: {formatCurrency(total)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Recent Activity</Text>
                {(paymentSummaries.recent || []).length === 0 ? (
                  <Text style={styles.detailText}>No recent payments.</Text>
                ) : (
                  (paymentSummaries.recent || []).map((p) => {
                    const payer = (g.membersList || []).find((m) => m.id === p.payerId);
                    const recip = (g.membersList || []).find((m) => m.id === p.forMemberId);
                    return (
                      <View key={`p-${p.id}`} style={styles.detailRow}>
                        <DollarSign color="#FFA500" size={14} />
                        <Text style={styles.detailText}>{payer?.name || p.payerId} paid {formatCurrency(p.amount)} for {recip?.name || p.forMemberId} on {new Date(p.date).toLocaleDateString()}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <Modal visible={showPaymentModal} transparent animationType="fade" onRequestClose={() => setShowPaymentModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Record Payment</Text>
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <X color="#666" size={24} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Provider</Text>
              {(() => {
                const activeAssignmentLocal = (g.collectorAssignments || []).find((a) => a.active);
                const canManual = !!activeAssignmentLocal && activeAssignmentLocal.collectorId === currentUser.id;
                const list = canManual ? ['Manual Collection', 'Orange Money', 'Africell Money', 'Qcell Money'] : ['Orange Money', 'Africell Money', 'Qcell Money'];
                return list.map((p) => (
                  <TouchableOpacity key={p} style={[styles.modalOption, paymentProvider === p && styles.modalOptionSelected]} onPress={() => setPaymentProvider(p)} testID={`provider-${p.replace(/\s/g,'')}`}>
                    <Text style={[styles.modalOptionText, paymentProvider === p && styles.modalOptionTextSelected]}>{p}</Text>
                    {paymentProvider === p ? <Check color="#FFA500" size={18} /> : null}
                  </TouchableOpacity>
                ));
              })()}

              {paymentProvider !== 'Manual Collection' ? (
                <View style={[styles.inputGroup, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>Mobile Money Number (12 chars)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput value={paymentNumber} onChangeText={setPaymentNumber} style={styles.textInput} placeholder="e.g., +23288000000" maxLength={12} keyboardType="phone-pad" testID="mmNumber" />
                  </View>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (NLe)</Text>
                <View style={styles.inputContainer}>
                  <TextInput value={paymentAmount} onChangeText={(t)=>setPaymentAmount(t.replace(/[^0-9.]/g,''))} style={styles.textInput} placeholder="0.00" keyboardType="numeric" testID="mmAmount" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Paying For</Text>
                {(g.membersList || []).map((m) => (
                  <TouchableOpacity key={`pf-${m.id}`} style={[styles.modalOption, paymentForMemberId === m.id && styles.modalOptionSelected]} onPress={() => setPaymentForMemberId(m.id)} testID={`payFor-${m.id}`}>
                    <Text style={[styles.modalOptionText, paymentForMemberId === m.id && styles.modalOptionTextSelected]}>{m.name}</Text>
                    {paymentForMemberId === m.id ? <Check color="#FFA500" size={18} /> : null}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.createButton, styles.detailButton, { marginTop: 4 }]} 
                onPress={async () => {
                  const amt = parseFloat(paymentAmount);
                  if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
                  if (!paymentForMemberId) { Alert.alert('Select Recipient', 'Choose who you are paying for.'); return; }
                  if (paymentProvider === 'Manual Collection') {
                    const activeA = (g.collectorAssignments || []).find((a) => a.active);
                    if (!activeA || activeA.collectorId !== currentUser.id) { Alert.alert('Not Allowed', 'Manual collection is only for the assigned collector.'); return; }
                    if (!(activeA.assignedMemberIds || []).includes(paymentForMemberId)) { Alert.alert('Not Allowed', 'You are not assigned to collect from this member.'); return; }
                  } else {
                    const regex = /^\+\d{11}$/;
                    if (!regex.test(paymentNumber)) { Alert.alert('Invalid', 'Number must be exactly 12 characters and start with +'); return; }
                  }
                  try {
                    const payRaw = await AsyncStorage.getItem('payments');
                    const list = payRaw ? JSON.parse(payRaw) : [];
                    const entry = { id: Date.now().toString(), amount: amt, note: `Group Contribution - ${g.name} (${paymentProvider})`, date: new Date().toISOString(), groupId: g.id, provider: paymentProvider, number: paymentProvider === 'Manual Collection' ? '' : paymentNumber, payerId: currentUser.id, payerName: currentUser.name, forMemberId: paymentForMemberId, collectedById: paymentProvider === 'Manual Collection' ? currentUser.id : undefined };
                    const updatedList = [...list, entry];
                    await AsyncStorage.setItem('payments', JSON.stringify(updatedList));
                    const updatedGroups = availableGroups.map((gg) => {
                      if (gg.id !== g.id) return gg;
                      const paymentsLedger = [...(gg.paymentsLedger || []), entry];
                      return { ...gg, paymentsLedger };
                    });
                    await saveGroups(updatedGroups);
                    Alert.alert('Success', 'Payment recorded successfully.');
                    setShowPaymentModal(false);
                  } catch (e) {
                    console.log('Payment save error', e);
                    Alert.alert('Error', 'Failed to record payment.');
                  }
                }}
                testID="confirmPaymentBtn"
              >
                <Text style={[styles.createButtonText, styles.detailButtonText]}>Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={[styles.groupCard, { marginTop: 12 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Group Alerts</Text>
          {(g.notifications||[]).length === 0 ? (
            <Text style={styles.detailText}>No alerts yet.</Text>
          ) : (
            (g.notifications||[]).slice().reverse().slice(0,5).map((n)=> (
              <View key={`n-${n.id}`} style={[styles.detailRow, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                  <Clock color="#FFA500" size={14} />
                  <Text style={styles.detailText}>{n.message}</Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const updated = availableGroups.map((gg) => {
                        if (gg.id !== g.id) return gg;
                        const next = (gg.notifications || []).filter((x) => x.id !== n.id);
                        return { ...gg, notifications: next };
                      });
                      await saveGroups(updated);
                    } catch (e) {
                      console.log('clear alert error', e);
                      Alert.alert('Error', 'Failed to clear alert');
                    }
                  }}
                  style={styles.clearChip}
                  testID={`clearAlert-${n.id}`}
                  accessibilityLabel={`Clear alert ${n.id}`}
                >
                  <X color="#fff" size={12} />
                  <Text style={styles.clearChipText}>Clear</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {activeAssignment ? (
          <View style={[styles.groupCard, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Collector Assigned</Text>
            {(() => {
              const coll = (g.membersList || []).find(m => m.id === activeAssignment.collectorId);
              return (
                <View>
                  <Text style={styles.detailText}>Collector: {coll?.name || activeAssignment.collectorId} • Assigned on {new Date(activeAssignment.announcedAt).toLocaleString()}</Text>
                  {((activeAssignment.assignedMemberIds || []).includes(currentUser.id)) && activeAssignment.idImage ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.detailText, { marginBottom: 6 }]}>Collector ID (visible to assigned members):</Text>
                      <Image source={{ uri: activeAssignment.idImage }} style={{ width: '100%', height: 160, borderRadius: 10, backgroundColor: '#eee' }} contentFit="cover" />
                    </View>
                  ) : (
                    <Text style={[styles.detailText, { marginTop: 6 }]}>ID is shared only with assigned members.</Text>
                  )}
                </View>
              );
            })()}
          </View>
        ) : null}

        {isAdmin ? (
          <View style={[styles.groupCard, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Admin Tools</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={[styles.createButton, styles.detailButton, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                onPress={async () => {
                  try {
                    if (Platform.OS !== 'web') {
                      try {
                        const Contacts = await import('expo-contacts');
                        const perm = await Contacts.requestPermissionsAsync();
                        if (perm.status === 'granted') {
                          const res = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
                          const mapped = (res.data || []).flatMap((c) => {
                            const name = c.name || 'Unknown';
                            const phones = (c.phoneNumbers || []).map((p) => (p.number || '').replace(/\s+/g, ''));
                            return phones.filter(Boolean).map((phone) => ({ id: phone, name, phone }));
                          });
                          setContacts(mapped);
                        } else {
                          Alert.alert('Permission required', 'Please allow contacts access to add members.');
                          const raw = await AsyncStorage.getItem('myContacts');
                          setContacts(raw ? JSON.parse(raw) : []);
                        }
                      } catch (e) {
                        console.log('device contacts error', e);
                        const raw = await AsyncStorage.getItem('myContacts');
                        setContacts(raw ? JSON.parse(raw) : []);
                      }
                    } else {
                      const raw = await AsyncStorage.getItem('myContacts');
                      setContacts(raw ? JSON.parse(raw) : []);
                    }
                    setSelectedContactsMap({});
                    setShowContactPickerModal(true);
                  } catch (e) { console.log('open contacts', e); }
                }}
                testID="openContactPicker"
              >
                <UserPlus color="#FFA500" size={18} />
                <Text style={[styles.createButtonText, styles.detailButtonText]}>add member</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createButton, styles.detailButton, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                onPress={async () => {
                  try {
                    let inviteUrl = '';
                    try {
                      const Linking = await import('expo-linking');
                      inviteUrl = Linking.createURL(`/groups/invite?groupId=${encodeURIComponent(g.id)}`);
                    } catch (e) { console.log('create invite url', e); }
                    const msg = `Join our Osusu group "${g.name}". Tap to open: ${inviteUrl || ''}`.trim();
                    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
                      await navigator.share({ title: 'Osusu Invite', text: msg, url: inviteUrl || undefined });
                    } else {
                      await Share.share({ message: msg });
                    }
                  } catch (e) { console.log('share invite', e); }
                }}
                testID="sendInviteLink"
              >
                <Share2 color="#FFA500" size={18} />
                <Text style={[styles.createButtonText, styles.detailButtonText]}>invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    );
  };

  return (
    <>
      {currentScreen === 'home' && renderHomeScreen()}
      {currentScreen === 'create' && renderCreateGroupScreen()}
      {currentScreen === 'join' && renderJoinGroupScreen()}
      {currentScreen === 'joined' && renderJoinedGroupsScreen()}
      {currentScreen === 'details' && renderDetailsScreen()}
      {renderFrequencyModal()}
      {renderPayoutModal()}
      {renderJoinConfirmModal()}

      <Modal visible={showAssignCollectorModal} transparent animationType="fade" onRequestClose={() => setShowAssignCollectorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Collector</Text>
              <TouchableOpacity onPress={() => setShowAssignCollectorModal(false)}>
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>
            {selectedGroup ? (
              <>
                <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Select Collector</Text>
                {(selectedGroup.membersList || []).map((m) => (
                  <TouchableOpacity key={`coll-${m.id}`} style={[styles.modalOption, assignCollectorId === m.id && styles.modalOptionSelected]} onPress={() => setAssignCollectorId(m.id)} testID={`pickCollector-${m.id}`}>
                    <Text style={[styles.modalOptionText, assignCollectorId === m.id && styles.modalOptionTextSelected]}>{m.name} {m.role === 'Admin' ? '(Admin)' : ''}</Text>
                    {assignCollectorId === m.id ? <Check color="#FFA500" size={18} /> : null}
                  </TouchableOpacity>
                ))}

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Assign Members</Text>
                {(selectedGroup.membersList || []).filter(mm => mm.id !== assignCollectorId).map((m) => (
                  <TouchableOpacity key={`ass-${m.id}`} style={[styles.modalOption, assignMembersMap[m.id] && styles.modalOptionSelected]} onPress={() => setAssignMembersMap({ ...assignMembersMap, [m.id]: !assignMembersMap[m.id] })} testID={`toggleAssignee-${m.id}`}>
                    <Text style={[styles.modalOptionText, assignMembersMap[m.id] && styles.modalOptionTextSelected]}>{m.name}</Text>
                    {assignMembersMap[m.id] ? <Check color="#FFA500" size={18} /> : null}
                  </TouchableOpacity>
                ))}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={styles.logoBtn} onPress={async () => {
                    try {
                      if (Platform.OS !== 'web') {
                        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (perm.status !== 'granted') { Alert.alert('Permission', 'Allow photos to attach ID'); return; }
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                      if (!result.canceled) {
                        const uri = result.assets?.[0]?.uri;
                        if (uri) setAssignIdImage(uri);
                      }
                    } catch (e) { console.log('pick id', e); }
                  }} testID="pickCollectorId">
                    <ImagePlus color="#FFA500" size={18} />
                    <Text style={styles.logoBtnText}>{assignIdImage ? 'Replace ID Image' : 'Attach Collector ID Image'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.createButton, styles.detailButton, { marginTop: 12 }]} onPress={async () => {
                  try {
                    if (!assignCollectorId) { Alert.alert('Select', 'Choose a collector'); return; }
                    const picked = Object.keys(assignMembersMap).filter((k) => assignMembersMap[k]);
                    if (picked.length === 0) { Alert.alert('Select', 'Choose at least one member'); return; }
                    const updated = availableGroups.map((gg) => {
                      if (gg.id !== selectedGroup.id) return gg;
                      const currentAssignments = gg.collectorAssignments || [];
                      const deactivated = currentAssignments.map(a => ({ ...a, active: false }));
                      const assignment = { id: Date.now().toString(), collectorId: assignCollectorId, assignedMemberIds: picked, idImage: assignIdImage || '', active: true, announcedAt: new Date().toISOString() };
                      return { ...gg, collectorAssignments: [...deactivated, assignment] };
                    });
                    await saveGroups(updated);
                    setShowAssignCollectorModal(false);
                    setAssignMembersMap({});
                    setAssignIdImage('');
                    Alert.alert('Assigned', 'Collector assigned successfully.');
                  } catch (e) {
                    console.log('assign collector error', e);
                    Alert.alert('Error', 'Failed to assign collector');
                  }
                }} testID="confirmAssignCollector">
                  <Text style={[styles.createButtonText, styles.detailButtonText]}>Confirm Assignment</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={showAddMemberModal} transparent animationType="fade" onRequestClose={() => setShowAddMemberModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Member</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput value={newMemberName} onChangeText={setNewMemberName} style={styles.textInput} placeholder="e.g., Musa Kamara" testID="newMemberName" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone (12 characters)</Text>
              <View style={styles.inputContainer}>
                <TextInput value={newMemberPhone} onChangeText={setNewMemberPhone} style={styles.textInput} placeholder="e.g., +23288000000" maxLength={12} keyboardType="phone-pad" testID="newMemberPhone" />
              </View>
            </View>
            <TouchableOpacity style={[styles.createButton, styles.detailButton]} onPress={async () => {
              if (!newMemberName.trim()) { Alert.alert('Validation', 'Name is required'); return; }
              if (!newMemberPhone.trim() || newMemberPhone.trim().length !== 12) { Alert.alert('Validation', 'Phone must be 12 characters'); return; }
              try {
                const updated = availableGroups.map((gg) => {
                  if (gg.id !== selectedGroup?.id) return gg;
                  const exists = (gg.membersList || []).some((m) => m.phone === newMemberPhone.trim());
                  if (exists) return gg;
                  const newM = { id: newMemberPhone.trim(), name: newMemberName.trim(), phone: newMemberPhone.trim(), role: 'Member' };
                  const list = [ ...(gg.membersList || []), newM ];
                  return ensureGroupShape([{ ...gg, membersList: list, members: list.length }])[0];
                });
                await saveGroups(updated);
                setShowAddMemberModal(false);
                setNewMemberName('');
                setNewMemberPhone('');
                Alert.alert('Added', 'Member added to group.');
              } catch (e) { console.log('add member error', e); Alert.alert('Error', 'Failed to add member'); }
            }} testID="confirmAddMember">
              <Text style={[styles.createButtonText, styles.detailButtonText]}>Add Member</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showContactPickerModal} transparent animationType="fade" onRequestClose={() => setShowContactPickerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contacts</Text>
              <TouchableOpacity onPress={() => setShowContactPickerModal(false)}>
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Add to My Contacts</Text>
              <View style={styles.inputContainer}>
                <TextInput value={newContactName} onChangeText={setNewContactName} style={styles.textInput} placeholder="Full name" testID="contactName" />
              </View>
              <View style={[styles.inputContainer, { marginTop: 8 }] }>
                <TextInput value={newContactPhone} onChangeText={setNewContactPhone} style={styles.textInput} placeholder="Phone (e.g., +23288000000)" maxLength={12} keyboardType="phone-pad" testID="contactPhone" />
              </View>
              <TouchableOpacity style={[styles.createButton, styles.detailButton, { marginTop: 10 }]} onPress={async () => {
                if (!newContactName.trim() || !newContactPhone.trim()) { Alert.alert('Validation', 'Enter name and phone'); return; }
                if (newContactPhone.trim().length !== 12) { Alert.alert('Validation', 'Phone must be 12 characters'); return; }
                try {
                  const next = [...contacts];
                  const exists = next.some(c => c.phone === newContactPhone.trim());
                  if (!exists) {
                    next.push({ id: newContactPhone.trim(), name: newContactName.trim(), phone: newContactPhone.trim() });
                    setContacts(next);
                    await AsyncStorage.setItem('myContacts', JSON.stringify(next));
                    setNewContactName(''); setNewContactPhone('');
                  }
                } catch (e) { console.log('save contact', e); }
              }} testID="saveContact">
                <Text style={[styles.createButtonText, styles.detailButtonText]}>Save Contact</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>My Contacts ({contacts.length})</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {(contacts || []).length === 0 ? (
                <Text style={styles.detailText}>No contacts saved yet.</Text>
              ) : (
                (contacts || []).map((c) => (
                  <TouchableOpacity key={`c-${c.id}`} style={[styles.modalOption, selectedContactsMap[c.id] && styles.modalOptionSelected]} onPress={() => setSelectedContactsMap({ ...selectedContactsMap, [c.id]: !selectedContactsMap[c.id] })} testID={`pickContact-${c.id}`}>
                    <Text style={[styles.modalOptionText, selectedContactsMap[c.id] && styles.modalOptionTextSelected]}>{c.name} • {c.phone}</Text>
                    {selectedContactsMap[c.id] ? <Check color="#FFA500" size={18} /> : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={async () => {
                try {
                  const picked = (contacts || []).filter(c => selectedContactsMap[c.id]);
                  if (picked.length === 0) { Alert.alert('Select', 'Choose at least one contact'); return; }
                  const targetGroupId = selectedGroup?.id;
                  if (!targetGroupId) { Alert.alert('Error', 'No group selected'); return; }
                  const updated = availableGroups.map((gg) => {
                    if (gg.id !== targetGroupId) return gg;
                    const current = gg.membersList || [];
                    const toAdd = picked.filter(c => !current.some(m => m.phone === c.phone)).map(c => ({ id: c.phone, name: c.name, phone: c.phone, role: 'Member' }));
                    const list = [...current, ...toAdd];
                    return ensureGroupShape([{ ...gg, membersList: list, members: list.length }])[0];
                  });
                  await saveGroups(updated);
                  setShowContactPickerModal(false);
                  setSelectedContactsMap({});
                  Alert.alert('Added', 'Selected contacts added to group');
                } catch (e) { console.log('add from contacts', e); Alert.alert('Error', 'Failed to add members'); }
              }} testID="addSelectedContacts">
                <Text style={styles.approveBtnText}>Add Selected</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={async () => {
                try {
                  const picked = (contacts || []).filter(c => selectedContactsMap[c.id]);
                  if (picked.length === 0) { Alert.alert('Select', 'Choose contacts to invite'); return; }
                  const msg = encodeURIComponent(`Join our Osusu group on the app. Search for \"${selectedGroup?.name || 'our group'}\" and request to join.`);
                  const first = picked[0];
                  const url = Platform.OS === 'web' ? `mailto:?subject=Osusu%20Invite&body=${msg}` : `sms:${first.phone}?body=${msg}`;
                  try { const Linking = await import('expo-linking'); await Linking.openURL(url); } catch (e) { console.log('link open', e); Alert.alert('Invite', 'Invitation prepared. If SMS did not open, copy and send: ' + decodeURIComponent(msg)); }
                } catch (e) { console.log('invite err', e); }
              }} testID="inviteSelectedContacts">
                <Text style={styles.rejectBtnText}>Invite Selected</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },

  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#00157f', marginBottom: 5, fontFamily: 'Montserrat' },
  headerSubtitle: { fontSize: 16, color: '#666', fontFamily: 'Inter' },

  topHeaderBar: { paddingTop: 16, paddingBottom: 8, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  topHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#2b2b2b', fontFamily: 'Montserrat' },
  segmentBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segmentBtnActive: { borderBottomColor: '#000' },
  segmentText: { color: '#6b6b6b', fontWeight: '600', fontFamily: 'Inter' },
  segmentTextActive: { color: '#000' },

  actionButtons: { flexDirection: 'row', padding: 20, gap: 15 },
  actionButton: { flex: 1, backgroundColor: '#FFA500', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#FFA500' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8, fontFamily: 'Montserrat' },
  secondaryButtonText: { color: '#FFA500', fontFamily: 'Montserrat' },

  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#00157f', marginBottom: 15, fontFamily: 'Montserrat' },
  sectionSubtitle: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center', fontFamily: 'Inter' },

  groupCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  groupName: { fontSize: 18, fontWeight: 'bold', color: '#00157f', flex: 1, fontFamily: 'Montserrat' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusOpen: { backgroundColor: '#e8f5e8' },
  statusFull: { backgroundColor: '#ffeaa7' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusTextOpen: { color: '#4CAF50' },
  statusTextFull: { color: '#f39c12' },
  groupDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#333', marginLeft: 8, fontFamily: 'Inter' },
  groupActions: { alignItems: 'flex-end' },
  joinButton: { backgroundColor: '#00157f', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  joinButtonDisabled: { backgroundColor: '#f0f0f0' },
  joinButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  joinButtonTextDisabled: { color: '#ccc' },
  joinedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  joinedText: { color: '#4CAF50', fontSize: 14, fontWeight: 'bold', marginLeft: 6, fontFamily: 'Inter' },

  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  listRowIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1ebe8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listRowTitle: { fontSize: 16, fontWeight: '600', color: '#2b2b2b', fontFamily: 'Inter' },
  listRowSubtitle: { fontSize: 12, color: '#8b8b8b', marginTop: 2, fontFamily: 'Inter' },

  bottomCtas: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8, backgroundColor: 'transparent' },
  primaryCta: { backgroundColor: '#ef6c00', borderRadius: 28, height: 54, alignItems: 'center', justifyContent: 'center' },
  primaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 16, fontFamily: 'Montserrat' },
  secondaryCta: { marginTop: 12, backgroundColor: '#f5f1ee', borderRadius: 28, height: 54, alignItems: 'center', justifyContent: 'center' },
  secondaryCtaText: { color: '#2b2b2b', fontWeight: '700', fontSize: 16, fontFamily: 'Montserrat' },

  formContainer: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#00157f', marginBottom: 8, fontFamily: 'Montserrat' },
  inputContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  textInput: { height: 50, paddingHorizontal: 15, fontSize: 16, color: '#333', fontFamily: 'Inter' },
  selectorContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', height: 50, paddingHorizontal: 15 },
  selectorText: { fontSize: 16, color: '#333', fontFamily: 'Inter' },
  selectorArrow: { fontSize: 12, color: '#666' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: 5, marginLeft: 5 },
  createButton: { backgroundColor: '#FFA500', borderRadius: 28, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Montserrat' },
  detailButton: { backgroundColor: '#00157f', borderRadius: 12, height: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  detailButtonText: { color: '#FFA500', fontSize: 14, fontWeight: '700', fontFamily: 'Montserrat' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 420 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#00157f', fontFamily: 'Montserrat' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalOptionSelected: { backgroundColor: '#fff5e6' },
  modalOptionText: { fontSize: 16, color: '#333', fontFamily: 'Inter' },
  modalOptionTextSelected: { color: '#FFA500', fontWeight: 'bold' },

  confirmModalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%', maxWidth: 350 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', color: '#00157f', textAlign: 'center', marginBottom: 16, fontFamily: 'Montserrat' },
  confirmMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, fontFamily: 'Inter' },
  confirmDetails: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginBottom: 24 },
  confirmDetailText: { fontSize: 14, color: '#333', marginBottom: 8, fontFamily: 'Inter' },
  confirmActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  confirmButton: { flex: 1, backgroundColor: '#FFA500', borderRadius: 8, height: 44, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Montserrat' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#00157f', marginTop: 16, marginBottom: 8, fontFamily: 'Montserrat' },
  emptyStateSubtext: { fontSize: 14, color: '#999', textAlign: 'center', fontFamily: 'Inter' },

  loadingContainer: { alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  memberName: { color: '#00157f', fontWeight: '600', marginLeft: 4, fontFamily: 'Inter' },
  memberRole: { marginLeft: 8, color: '#999', fontSize: 12, fontFamily: 'Inter' },

  approveBtn: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  approveBtnText: { color: '#fff', fontWeight: '600', fontFamily: 'Montserrat' },
  rejectBtn: { backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rejectBtnText: { color: '#fff', fontWeight: '600', fontFamily: 'Montserrat' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, height: 44, fontFamily: 'Inter' },

  groupLogo: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f2f2f2' },
  groupLogoPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffe8cc', alignItems: 'center', justifyContent: 'center' },
  groupLogoInitial: { color: '#FFA500', fontWeight: 'bold', fontFamily: 'Montserrat' },

  detailLogo: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#f2f2f2' },
  detailLogoPlaceholder: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#ffe8cc', alignItems: 'center', justifyContent: 'center' },
  detailLogoInitial: { color: '#FFA500', fontSize: 28, fontWeight: 'bold', fontFamily: 'Montserrat' },

  logoPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoPreview: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#f2f2f2' },
  logoBtn: { borderWidth: 1, borderColor: '#FFA500', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff' },
  logoBtnText: { color: '#FFA500', fontWeight: '600', fontFamily: 'Montserrat' },
  removeLogoBtn: { backgroundColor: '#e74c3c', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeLogoText: { color: '#fff', fontWeight: '600', fontFamily: 'Montserrat' },
  applyUrlBtn: { marginLeft: 8, backgroundColor: '#FFA500', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  applyUrlBtnText: { color: '#fff', fontWeight: '700', fontFamily: 'Montserrat' },

  dateQuickRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FFA500', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  quickChipText: { color: '#FFA500', fontWeight: '600', fontFamily: 'Inter' },
  stepperBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#FFA500', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  clearChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4F5D75', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  clearChipText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: 'Montserrat' },
});