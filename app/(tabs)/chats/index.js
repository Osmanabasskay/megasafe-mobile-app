import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users, MessageSquarePlus } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ChatsHome() {
  const [groups, setGroups] = useState([]);
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [gs, ud] = await Promise.all([
          AsyncStorage.getItem('availableGroups'),
          AsyncStorage.getItem('userData'),
        ]);
        const g = gs ? JSON.parse(gs) : [];
        setGroups(g);
        const me = ud ? JSON.parse(ud) : { phone: 'guest' };
        const uniques = new Map();
        g.forEach((gr) => (gr.membersList || []).forEach((m) => { if (m.phone) uniques.set(m.phone, m); }));
        uniques.delete(me.phone);
        setPeople(Array.from(uniques.values()));
      } catch (e) { console.log('[Chats] load', e); }
    })();
  }, []);

  const filteredGroups = groups.filter((g) => (g.name||'').toLowerCase().includes(q.toLowerCase()));
  const filteredPeople = people.filter((p) => (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.phone||'').includes(q));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>
      <View style={styles.searchBar}>
        <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Search groups or people" />
      </View>
      <FlatList
        ListHeaderComponent={<Text style={styles.section}>Groups</Text>}
        data={filteredGroups}
        keyExtractor={(i)=>i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/(tabs)/chats/${item.id}`)}>
            <Users color="#FFA500" size={18} />
            <Text style={styles.rowText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={<>
          <Text style={styles.section}>People</Text>
          {filteredPeople.map((p)=> (
            <TouchableOpacity key={p.id || p.phone} style={styles.row} onPress={() => router.push(`/(tabs)/chats/${encodeURIComponent(p.phone||p.id)}`)}>
              <MessageSquarePlus color="#5CCEF4" size={18} />
              <Text style={styles.rowText}>{p.name} • {p.phone}</Text>
            </TouchableOpacity>
          ))}
        </>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: '800', color: '#333' },
  searchBar: { padding: 12, backgroundColor: '#fff' },
  searchInput: { height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, color: '#666', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowText: { color: '#333', fontWeight: '600' },
});
