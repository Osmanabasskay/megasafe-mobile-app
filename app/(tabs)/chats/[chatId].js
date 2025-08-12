import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Linking, Alert, Animated, Easing, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Send, Mic, Camera as CameraIcon, Image as ImageIcon, Paperclip, Play, Pause, X, Check, Smile, MapPin, User as UserIcon, FileText, Headphones, Calendar, BarChart3 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

export default function ChatRoom() {
  const { chatId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const soundRef = useRef(null);
  const listRef = useRef(null);
  const [pendingAudio, setPendingAudio] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [pollQ, setPollQ] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [eventNote, setEventNote] = useState('');
  const waveAnim = useMemo(() => Array.from({ length: 8 }, () => new Animated.Value(0)), []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('chat:'+chatId);
        setMessages(raw ? JSON.parse(raw) : []);
      } catch (e) { console.log('[Chat] load', e); }
    })();
  }, [chatId]);

  useEffect(() => {
    if (isRecording) {
      const animations = waveAnim.map((v, idx) => Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 350 + idx * 20, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 350 + idx * 20, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])));
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    }
  }, [isRecording, waveAnim]);

  const persist = async (next) => {
    try { await AsyncStorage.setItem('chat:'+chatId, JSON.stringify(next)); } catch (e) { console.log('persist err', e); }
  };

  const appendMessage = async (msg) => {
    const next = [...messages, msg];
    setMessages(next);
    await persist(next);
    setTimeout(()=> listRef.current?.scrollToEnd?.({ animated: true }), 80);
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const msg = { id: Date.now().toString(), type: 'text', text: trimmed, ts: Date.now(), sender: 'you' };
    setInput('');
    await appendMessage(msg);
  };

  const pickImageFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permission required', 'Allow photo library access.'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (asset?.uri) {
        await appendMessage({ id: Date.now().toString(), type: 'image', uri: asset.uri, ts: Date.now(), sender: 'you' });
      }
      setShowAttach(false);
    } catch (e) { console.log('pickImage error', e); }
  };

  const captureWithCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permission required', 'Allow camera access.'); return; }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (asset?.uri) {
        await appendMessage({ id: Date.now().toString(), type: 'image', uri: asset.uri, ts: Date.now(), sender: 'you' });
      }
      setShowAttach(false);
    } catch (e) { console.log('capture error', e); }
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (res.canceled) return;
      const file = res.assets?.[0];
      if (file?.uri) {
        await appendMessage({ id: Date.now().toString(), type: 'file', uri: file.uri, name: file.name, mime: file.mimeType, ts: Date.now(), sender: 'you' });
      }
      setShowAttach(false);
    } catch (e) { console.log('doc pick error', e); }
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        const chunks = [];
        mr.ondataavailable = (ev) => { if (ev?.data?.size) chunks.push(ev.data); };
        mr.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            setPendingAudio({ uri: url, mime: 'audio/webm' });
            stream.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          } catch (e) { console.log('web record stop err', e); }
        };
        mr.start();
        setIsRecording(true);
      } catch (e) { console.log('web record err', e); Alert.alert('Recording failed', 'Microphone permission denied or unsupported.'); }
      return;
    }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permission required', 'Allow microphone access.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        },
      });
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e) { console.log('native record err', e); Alert.alert('Recording failed', 'Could not start recording.'); }
  };

  const stopRecording = async () => {
    if (Platform.OS === 'web') {
      try {
        const mr = mediaRecorderRef.current;
        if (mr && mr.state !== 'inactive') { mr.stop(); }
      } catch (e) { console.log('web stop err', e); }
      setIsRecording(false);
      return;
    }
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setIsRecording(false);
      setRecording(null);
      if (uri) {
        setPendingAudio({ uri, mime: Platform.OS==='ios'?'audio/wav':'audio/m4a' });
      }
    } catch (e) { console.log('stop record err', e); setIsRecording(false); setRecording(null); }
  };

  const togglePlayback = async (item) => {
    try {
      if (playingId && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingId(null);
      }
      if (playingId === item.id) return;
      if (Platform.OS === 'web') {
        try { Linking.openURL(item.uri); } catch (e) { console.log('open audio web', e); }
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: item.uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status && !status.isLoaded) return;
        if (status?.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (e) { console.log('playback err', e); setPlayingId(null); }
  };

  const title = String(chatId||'').length>12 ? `${String(chatId).slice(0,10)}...` : String(chatId||'');

  const sendPendingAudio = async () => {
    if (!pendingAudio) return;
    await appendMessage({ id: Date.now().toString(), type: 'audio', uri: pendingAudio.uri, mime: pendingAudio.mime, ts: Date.now(), sender: 'you' });
    setPendingAudio(null);
  };

  const pickAudio = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (res.canceled) return;
      const file = res.assets?.[0];
      if (file?.uri) {
        await appendMessage({ id: Date.now().toString(), type: 'file', uri: file.uri, name: file.name || 'audio', mime: file.mimeType || 'audio/*', ts: Date.now(), sender: 'you' });
      }
      setShowAttach(false);
    } catch (e) { console.log('audio pick err', e); }
  };

  const openLocation = async () => {
    try {
      if (Platform.OS === 'web') { Alert.alert('Not available', 'Location sending is not supported on web.'); return; }
      const { status } = await (await import('expo-location')).requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission required', 'Allow location access.'); return; }
      const { coords } = await (await import('expo-location')).getCurrentPositionAsync({});
      const mapsUrl = Platform.select({ ios: `http://maps.apple.com/?ll=${coords.latitude},${coords.longitude}`, default: `geo:${coords.latitude},${coords.longitude}` });
      await appendMessage({ id: Date.now().toString(), type: 'text', text: `Location: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}\n${mapsUrl}` , ts: Date.now(), sender: 'you' });
      setShowAttach(false);
    } catch (e) { console.log('loc err', e); }
  };

  const pickContact = async () => {
    try {
      if (Platform.OS === 'web') { Alert.alert('Not available', 'Contacts are not supported on web.'); return; }
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission required', 'Allow contacts access.'); return; }
      const { data } = await Contacts.getContactsAsync({ pageSize: 1 });
      if (data?.[0]) {
        const c = data[0];
        await appendMessage({ id: Date.now().toString(), type: 'text', text: `Contact: ${c.name}${c.phoneNumbers?.[0]?.number? ' | '+c.phoneNumbers[0].number : ''}`, ts: Date.now(), sender: 'you' });
      }
      setShowAttach(false);
    } catch (e) { console.log('contact err', e); }
  };

  const onVote = async (msgId, idx) => {
    try {
      const next = messages.map(m => {
        if (m.id !== msgId) return m;
        if (m.type !== 'poll') return m;
        if (!m.results) m.results = Array.from({ length: m.options.length }, () => 0);
        if (typeof m.votedIndex === 'number') {
          if (m.votedIndex === idx) return m;
          m.results[m.votedIndex] = Math.max(0, (m.results[m.votedIndex] || 0) - 1);
        }
        m.results[idx] = (m.results[idx] || 0) + 1;
        m.votedIndex = idx;
        return { ...m };
      });
      setMessages(next);
      await persist(next);
    } catch (e) { console.log('vote err', e); }
  };

  const renderItem = ({ item }) => {
    const isMine = item.sender === 'you';
    if (item.type === 'image') {
      return (
        <View style={[styles.bubble, isMine?styles.mine:styles.theirs]}>
          <Image source={{ uri: item.uri }} style={styles.image} />
          <Text style={[styles.time, isMine?styles.timeMine:styles.timeTheirs]}>{new Date(item.ts).toLocaleTimeString()}</Text>
        </View>
      );
    }
    if (item.type === 'file') {
      return (
        <TouchableOpacity style={[styles.bubble, isMine?styles.mine:styles.theirs]} onPress={() => Linking.openURL(item.uri)}>
          <View style={styles.rowCenter}>
            <Paperclip color={isMine?'#fff':'#333'} size={18} />
            <Text style={[styles.text, isMine?styles.textMine:styles.textTheirs]} numberOfLines={2}>{item.name || 'Attachment'}</Text>
          </View>
          <Text style={[styles.time, isMine?styles.timeMine:styles.timeTheirs]}>{new Date(item.ts).toLocaleTimeString()}</Text>
        </TouchableOpacity>
      );
    }
    if (item.type === 'audio') {
      const isPlaying = playingId === item.id;
      return (
        <View style={[styles.bubble, isMine?styles.mine:styles.theirs]}>
          <TouchableOpacity style={styles.audioRow} onPress={() => togglePlayback(item)}>
            {isPlaying ? <Pause color={isMine?'#fff':'#333'} size={18} /> : <Play color={isMine?'#fff':'#333'} size={18} />}
            <Text style={[styles.text, isMine?styles.textMine:styles.textTheirs]}>{isPlaying? 'Playing...' : 'Voice message'}</Text>
          </TouchableOpacity>
          <Text style={[styles.time, isMine?styles.timeMine:styles.timeTheirs]}>{new Date(item.ts).toLocaleTimeString()}</Text>
        </View>
      );
    }
    if (item.type === 'poll') {
      const total = (item.results||[]).reduce((a,b)=>a+b,0);
      return (
        <View style={[styles.bubble, isMine?styles.mine:styles.theirs]}>
          <Text style={[styles.text, isMine?styles.textMine:styles.textTheirs, { fontWeight: '700', marginBottom: 8 }]}>{item.question}</Text>
          {(item.options||[]).map((opt, idx) => {
            const count = item.results?.[idx] || 0;
            const percent = total>0 ? Math.round((count/total)*100) : 0;
            const selected = item.votedIndex === idx;
            return (
              <TouchableOpacity key={String(idx)} onPress={() => onVote(item.id, idx)} style={[styles.pollOption, selected && styles.pollOptionSelected]} testID={`pollOpt-${idx}`}>
                <Text style={[styles.pollLabel, isMine?styles.textMine:styles.textTheirs]}>{opt}</Text>
                <Text style={[styles.pollCount, isMine?styles.textMine:styles.textTheirs]}>{percent}% • {count}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={[styles.time, isMine?styles.timeMine:styles.timeTheirs]}>{new Date(item.ts).toLocaleTimeString()}</Text>
        </View>
      );
    }
    if (item.type === 'event') {
      const when = item.when ? new Date(item.when) : null;
      return (
        <View style={[styles.bubble, isMine?styles.mine:styles.theirs]}>
          <View style={styles.rowCenter}>
            <Calendar color={isMine?'#fff':'#333'} size={18} />
            <Text style={[styles.text, isMine?styles.textMine:styles.textTheirs, { fontWeight: '700' }]}>{item.title||'Event'}</Text>
          </View>
          {!!item.note && (<Text style={[styles.text, isMine?styles.textMine:styles.textTheirs]}>{item.note}</Text>)}
          {!!when && (<Text style={[styles.text, isMine?styles.textMine:styles.textTheirs, { marginTop: 6 }]}>{when.toLocaleString()}</Text>)}
          <TouchableOpacity onPress={() => Alert.alert('Reminder', 'Reminder set locally.')} style={[styles.eventBtn, { backgroundColor: isMine?'rgba(255,255,255,0.15)':'#F3F4F6' }]} testID="eventReminderBtn">
            <Text style={[styles.eventBtnText, isMine?styles.textMine:styles.textTheirs]}>Set reminder</Text>
          </TouchableOpacity>
          <Text style={[styles.time, isMine?styles.timeMine:styles.timeTheirs]}>{new Date(item.ts).toLocaleTimeString()}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.bubble, isMine?styles.mine:styles.theirs]}>
        <Text style={[styles.text, isMine?styles.textMine:styles.textTheirs]}>{item.text}</Text>
        <Text style={[styles.time, isMine?styles.timeMine:styles.timeTheirs]}>{new Date(item.ts).toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>{title}</Text></View>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.flex1}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i)=>i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          testID="messagesList"
        />
        {isRecording && (
          <View style={styles.recordingWrap} testID="recordingWave">
            <View style={styles.waveRow}>
              {waveAnim.map((v, idx) => {
                const height = v.interpolate({ inputRange: [0,1], outputRange: [8, 26] });
                return <Animated.View key={String(idx)} style={[styles.waveBar, { height }]} />;
              })}
            </View>
            <TouchableOpacity onPress={stopRecording} style={[styles.iconBtn, styles.stopBtn]} testID="stopRecBtn">
              <Text style={{ color: '#fff', fontWeight: '700' }}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
        {!!pendingAudio && !isRecording && (
          <View style={styles.pendingWrap} testID="pendingAudio">
            <TouchableOpacity onPress={() => togglePlayback({ id: 'preview', uri: pendingAudio.uri })} style={styles.audioRow}>
              <Play color="#333" size={18} />
              <Text style={styles.pendingText}>Preview voice note</Text>
            </TouchableOpacity>
            <View style={styles.pendingActions}>
              <TouchableOpacity onPress={() => setPendingAudio(null)} style={[styles.iconBtn, styles.discardBtn]} testID="discardAudio">
                <X color="#fff" size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={sendPendingAudio} style={[styles.iconBtn, styles.confirmBtn]} testID="sendAudio">
                <Check color="#fff" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showAttach && !showPollForm && !showEventForm && (
          <View style={styles.attachSheet} testID="attachSheet">
            <View style={styles.attachGrid}>
              <TouchableOpacity style={styles.attachTile} onPress={pickImageFromLibrary} testID="attGallery">
                <View style={[styles.tileIconWrap, { backgroundColor: '#E8F0FE' }]}><ImageIcon color="#1A73E8" size={22} /></View>
                <Text style={styles.tileLabel}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachTile} onPress={captureWithCamera} testID="attCamera">
                <View style={[styles.tileIconWrap, { backgroundColor: '#FFE4EF' }]}><CameraIcon color="#FF2D7A" size={22} /></View>
                <Text style={styles.tileLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachTile} onPress={openLocation} testID="attLocation">
                <View style={[styles.tileIconWrap, { backgroundColor: '#E6FFF4' }]}><MapPin color="#10B981" size={22} /></View>
                <Text style={styles.tileLabel}>Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachTile} onPress={pickContact} testID="attContact">
                <View style={[styles.tileIconWrap, { backgroundColor: '#EAF2FF' }]}><UserIcon color="#2563EB" size={22} /></View>
                <Text style={styles.tileLabel}>Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachTile} onPress={pickDocument} testID="attDocument">
                <View style={[styles.tileIconWrap, { backgroundColor: '#F1E9FF' }]}><FileText color="#7C3AED" size={22} /></View>
                <Text style={styles.tileLabel}>Document</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachTile} onPress={pickAudio} testID="attAudio">
                <View style={[styles.tileIconWrap, { backgroundColor: '#FFF1E6' }]}><Headphones color="#F97316" size={22} /></View>
                <Text style={styles.tileLabel}>Audio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachTile} onPress={() => { setShowPollForm(true); }} testID="attPoll">
                <View style={[styles.tileIconWrap, { backgroundColor: '#FFF8E6' }]}><BarChart3 color="#F59E0B" size={22} /></View>
                <Text style={styles.tileLabel}>Poll</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachTile} onPress={() => { setShowEventForm(true); }} testID="attEvent">
                <View style={[styles.tileIconWrap, { backgroundColor: '#FFEAF0' }]}><Calendar color="#EC4899" size={22} /></View>
                <Text style={styles.tileLabel}>Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showAttach && showPollForm && (
          <View style={styles.attachSheet} testID="pollForm">
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Create Poll</Text>
              <TouchableOpacity onPress={() => { setShowPollForm(false); setShowAttach(false); }} style={styles.closeBtn}><X color="#111" size={16} /></TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput value={pollQ} onChangeText={setPollQ} placeholder="Question" placeholderTextColor="#9AA0A6" style={styles.input} />
              {pollOptions.map((opt, idx) => (
                <View key={String(idx)} style={styles.rowBetween}>
                  <TextInput value={opt} onChangeText={(t)=>{
                    const copy = [...pollOptions];
                    copy[idx] = t;
                    setPollOptions(copy);
                  }} placeholder={`Option ${idx+1}`} placeholderTextColor="#9AA0A6" style={[styles.input, { flex: 1 }]} />
                  {pollOptions.length>2 && (
                    <TouchableOpacity onPress={() => { const copy=[...pollOptions]; copy.splice(idx,1); setPollOptions(copy); }} style={[styles.smallBtn, { backgroundColor: '#fee2e2' }]}><Text style={{ color: '#B91C1C' }}>Remove</Text></TouchableOpacity>
                  )}
                </View>
              ))}
              {pollOptions.length<6 && (
                <TouchableOpacity onPress={() => setPollOptions([...pollOptions, ''])} style={styles.addRowBtn} testID="addPollOption">
                  <Text style={styles.addRowText}>+ Add option</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={async ()=>{
                const cleaned = pollOptions.map(o=>o.trim()).filter(Boolean);
                if (!pollQ.trim() || cleaned.length<2) { Alert.alert('Incomplete', 'Enter a question and at least 2 options.'); return; }
                await appendMessage({ id: Date.now().toString(), type: 'poll', question: pollQ.trim(), options: cleaned, results: Array.from({ length: cleaned.length }, ()=>0), ts: Date.now(), sender: 'you' });
                setPollQ(''); setPollOptions(['','']); setShowPollForm(false); setShowAttach(false);
              }} style={[styles.primaryBtn]} testID="createPollBtn">
                <Text style={styles.primaryBtnText}>Create Poll</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {showAttach && showEventForm && (
          <View style={styles.attachSheet} testID="eventForm">
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Create Event</Text>
              <TouchableOpacity onPress={() => { setShowEventForm(false); setShowAttach(false); }} style={styles.closeBtn}><X color="#111" size={16} /></TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput value={eventTitle} onChangeText={setEventTitle} placeholder="Title (e.g. Osusu vote)" placeholderTextColor="#9AA0A6" style={styles.input} />
              <TextInput value={eventDateTime} onChangeText={setEventDateTime} placeholder="When (YYYY-MM-DD HH:MM)" placeholderTextColor="#9AA0A6" style={styles.input} />
              <TextInput value={eventNote} onChangeText={setEventNote} placeholder="Notes (optional)" placeholderTextColor="#9AA0A6" style={[styles.input, { height: 80 }]} multiline />
              <TouchableOpacity onPress={async ()=>{
                if (!eventTitle.trim() || !eventDateTime.trim()) { Alert.alert('Incomplete', 'Enter title and date/time.'); return; }
                const when = new Date(eventDateTime);
                if (isNaN(when.getTime())) { Alert.alert('Invalid date', 'Use format YYYY-MM-DD HH:MM'); return; }
                await appendMessage({ id: Date.now().toString(), type: 'event', title: eventTitle.trim(), when: when.toISOString(), note: eventNote.trim(), ts: Date.now(), sender: 'you' });
                setEventTitle(''); setEventDateTime(''); setEventNote(''); setShowEventForm(false); setShowAttach(false);
              }} style={[styles.primaryBtn]} testID="createEventBtn">
                <Text style={styles.primaryBtnText}>Create Event</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.inputRow}>
          <View style={styles.msgBar}>
            <TouchableOpacity onPress={() => {}} style={styles.msgBarIcon} testID="emojiBtn">
              <Smile color="#6B7280" size={20} />
            </TouchableOpacity>
            <TextInput style={styles.msgInput} value={input} onChangeText={setInput} placeholder="Message" placeholderTextColor="#9AA0A6" testID="msgInput" />
            <TouchableOpacity onPress={() => setShowAttach((v)=>!v)} style={styles.msgBarIcon} testID="clipBtn">
              <Paperclip color="#6B7280" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={captureWithCamera} style={[styles.msgBarIcon, { marginRight: 6 }]} testID="cameraBtn">
              <CameraIcon color="#6B7280" size={20} />
            </TouchableOpacity>
          </View>
          {input.trim().length > 0 ? (
            <TouchableOpacity style={styles.micFab} onPress={send} testID="sendFab">
              <Send color="#fff" size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.micFab} testID="micFab">
              <Mic color="#fff" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontWeight: '800', color: '#333' },
  flex1: { flex: 1 },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 10, marginVertical: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#FFA500' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  text: { fontSize: 16 },
  textMine: { color: '#fff' },
  textTheirs: { color: '#333' },
  time: { fontSize: 10, marginTop: 4 },
  timeMine: { color: '#fff', opacity: 0.85 },
  timeTheirs: { color: '#6b7280' },

  attachSheet: { backgroundColor: '#fff', marginHorizontal: 10, marginBottom: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  attachTile: { width: '23%', alignItems: 'center', marginBottom: 18 },
  tileIconWrap: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { marginTop: 8, color: '#6B7280', fontWeight: '600' },

  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  formTitle: { fontWeight: '800', color: '#111' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#111', marginBottom: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  addRowBtn: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  addRowText: { color: '#374151', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#111827', padding: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },

  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'transparent' },
  msgBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 8, height: 48 },
  msgBarIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  msgInput: { flex: 1, height: 40, color: '#111', paddingHorizontal: 8 },
  micFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },

  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 6, backgroundColor: '#F3F4F6' },
  recActive: { backgroundColor: '#ef4444' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  image: { width: 220, height: 220, borderRadius: 12, backgroundColor: '#e5e7eb' },
  recordingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff3f3', borderTopWidth: 1, borderTopColor: '#fee2e2' },
  waveRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, flex: 1 },
  waveBar: { width: 4, backgroundColor: '#ef4444', borderRadius: 2 },
  stopBtn: { backgroundColor: '#ef4444', marginRight: 0 },
  pendingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6' },
  pendingText: { color: '#333', fontWeight: '600' },
  pendingActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  discardBtn: { backgroundColor: '#9CA3AF', marginRight: 0 },
  confirmBtn: { backgroundColor: '#10B981', marginRight: 0 },

  pollOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pollOptionSelected: { borderWidth: 1, borderColor: '#10B981' },
  pollLabel: { fontWeight: '600' },
  pollCount: { opacity: 0.8 },

  eventBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, alignSelf: 'flex-start' },
  eventBtnText: { fontWeight: '700' },
});