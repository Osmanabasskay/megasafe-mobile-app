import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';

export default function ChatRoom() {
  const { chatId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('chat:'+chatId);
        setMessages(raw ? JSON.parse(raw) : []);
      } catch (e) { console.log('[Chat] load', e); }
    })();
  }, [chatId]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const msg = { id: Date.now().toString(), text: trimmed, ts: Date.now(), sender: 'you' };
    const next = [...messages, msg];
    setMessages(next);
    setInput('');
    await AsyncStorage.setItem('chat:'+chatId, JSON.stringify(next));
    setTimeout(()=> listRef.current?.scrollToEnd?.({ animated: true }), 100);
  };

  const title = String(chatId||'').length>12 ? `${String(chatId).slice(0,10)}...` : String(chatId||'');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>{title}</Text></View>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.flex1}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i)=>i.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender==='you'?styles.mine:styles.theirs]}>
              <Text style={[styles.text, item.sender==='you'?styles.textMine:styles.textTheirs]}>{item.text}</Text>
              <Text style={styles.time}>{new Date(item.ts).toLocaleTimeString()}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 12 }}
        />
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a message" />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
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
  headerTitle: { fontWeight: '800', fontFamily: 'Montserrat', color: '#00157f' },
  flex1: { flex: 1 },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 10, marginVertical: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#FFA500' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  text: { fontSize: 16 },
  textMine: { color: '#fff' },
  textTheirs: { color: '#333' },
  time: { fontSize: 10, color: '#fff', opacity: 0.8, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 22, paddingHorizontal: 14, marginRight: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFA500', alignItems: 'center', justifyContent: 'center' },
});
