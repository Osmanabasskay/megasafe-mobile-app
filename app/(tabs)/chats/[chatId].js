import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Send, Mic, Square } from 'lucide-react-native';

export default function ChatRoom() {
  const { chatId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('chat:'+chatId);
        setMessages(raw ? JSON.parse(raw) : []);
      } catch (e) { console.log('[Chat] load', e); }
    })();
  }, [chatId]);

  const saveMessages = async (next) => {
    try {
      await AsyncStorage.setItem('chat:'+chatId, JSON.stringify(next));
      console.log('[Chat] saved', next.length);
    } catch (e) {
      console.log('[Chat] save error', e);
      Alert.alert('Error', 'Failed to save message');
    }
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const msg = { type: 'text', id: Date.now().toString(), text: trimmed, ts: Date.now(), sender: 'you' };
    const next = [...messages, msg];
    setMessages(next);
    setInput('');
    await saveMessages(next);
    setTimeout(()=> listRef.current?.scrollToEnd?.({ animated: true }), 100);
  };

  const startRecording = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not supported', 'Voice recording is currently available on web preview.');
      return;
    }
    try {
      console.log('[Voice] request mic');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      const chunks = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mr.onerror = (e) => console.log('[Voice] error', e);
      mr.onstop = async () => {
        console.log('[Voice] stopped');
        clearInterval(recordTimerRef.current);
        setIsRecording(false);
        setRecordSecs(0);
        try {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const base64 = await blobToBase64(blob);
          const msg = { type: 'audio', id: Date.now().toString(), ts: Date.now(), sender: 'you', mime: 'audio/webm', base64 };
          const next = [...messages, msg];
          setMessages(next);
          await saveMessages(next);
          setTimeout(()=> listRef.current?.scrollToEnd?.({ animated: true }), 100);
        } catch (err) {
          console.log('[Voice] process error', err);
          Alert.alert('Recording failed', 'Could not process audio');
        } finally {
          try { stream.getTracks().forEach(t=>t.stop()); } catch {}
        }
      };
      mr.start();
      console.log('[Voice] started');
      setIsRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(()=> setRecordSecs((s)=> s+1), 1000);
    } catch (e) {
      console.log('[Voice] start error', e);
      Alert.alert('Microphone blocked', 'Please allow mic access to record.');
    }
  };

  const stopRecording = () => {
    if (Platform.OS !== 'web') return;
    try {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        mr.stop();
      }
    } catch (e) {
      console.log('[Voice] stop error', e);
    }
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const title = String(chatId||'').length>12 ? `${String(chatId).slice(0,10)}...` : String(chatId||'');

  const renderMessage = ({ item }) => {
    const isMine = item.sender === 'you';
    return (
      <View style={[styles.bubble, isMine?styles.mine:styles.theirs]} testID={`msg-${item.id}`}>
        {item.type === 'audio' ? (
          Platform.OS === 'web' ? (
            <audio controls src={`data:${item.mime};base64,${item.base64}`} style={{ width: 220 }} />
          ) : (
            <Text style={[styles.text, isMine?styles.textMine:styles.textTheirs]}>Audio message</Text>
          )
        ) : (
          <Text style={[styles.text, isMine?styles.textMine:styles.textTheirs]}>{item.text}</Text>
        )}
        <Text style={[styles.time, isMine?styles.timeLight:styles.timeDark]}>{new Date(item.ts).toLocaleTimeString()}</Text>
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
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 12 }}
        />
        <View style={styles.inputRow}>
          <TouchableOpacity accessibilityRole="button" testID="record-btn" style={[styles.micBtn, isRecording && styles.micBtnActive]} onPress={isRecording ? stopRecording : startRecording}>
            {isRecording ? <Square color="#fff" size={18} /> : <Mic color="#fff" size={18} />}
          </TouchableOpacity>
          {isRecording ? (
            <View style={styles.recordingPill}>
              <View style={styles.dot} />
              <Text style={styles.recordingText}>Recording {recordSecs}s</Text>
            </View>
          ) : (
            <TextInput testID="chat-input" style={styles.input} value={input} onChangeText={setInput} placeholder="Type a message or hold mic" />
          )}
          {!isRecording && (
            <TouchableOpacity style={styles.sendBtn} onPress={send} accessibilityRole="button" testID="send-btn">
              <Send color="#fff" size={18} />
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
  headerTitle: { fontWeight: '800', fontFamily: 'Montserrat', color: '#00157f' },
  flex1: { flex: 1 },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 10, marginVertical: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#FFA500' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  text: { fontSize: 16 },
  textMine: { color: '#fff' },
  textTheirs: { color: '#333' },
  time: { fontSize: 10, marginTop: 2 },
  timeLight: { color: '#fff', opacity: 0.8 },
  timeDark: { color: '#666' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 22, paddingHorizontal: 14, marginRight: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00157f', alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  micBtnActive: { backgroundColor: '#C1271D' },
  recordingPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 44, borderRadius: 22, backgroundColor: '#FFF2F0', borderWidth: 1, borderColor: '#FFD6D1', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
});
