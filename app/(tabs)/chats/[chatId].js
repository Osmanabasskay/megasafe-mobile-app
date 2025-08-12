import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Linking, Alert, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Send, Mic, Camera as CameraIcon, Image as ImageIcon, Paperclip, Play, Pause, X, Check } from 'lucide-react-native';
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
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={[styles.iconBtn, isRecording && styles.recActive]} testID="micBtn">
            <Mic color={isRecording?'#fff':'#555'} size={18} />
          </TouchableOpacity>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Message" testID="msgInput" />
          <TouchableOpacity onPress={captureWithCamera} style={styles.iconBtn} testID="cameraBtn">
            <CameraIcon color="#555" size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImageFromLibrary} style={styles.iconBtn} testID="imagePickerBtn">
            <ImageIcon color="#555" size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickDocument} style={styles.iconBtn} testID="docPickerBtn">
            <Paperclip color="#555" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={send} testID="sendBtn">
            <Send color="#fff" size={18} />
          </TouchableOpacity>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 6, backgroundColor: '#F3F4F6' },
  recActive: { backgroundColor: '#ef4444' },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 22, paddingHorizontal: 14, marginRight: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFA500', alignItems: 'center', justifyContent: 'center' },
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
});