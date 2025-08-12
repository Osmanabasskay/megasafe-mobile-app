import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Pencil, Users, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ChatsHome() {
  const [groups, setGroups] = useState([]);
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('direct');

  useEffect(() => {
    (async () => {
      try {
        console.log('[Chats] loading data');
        const [gs, ud] = await Promise.all([
          AsyncStorage.getItem('availableGroups'),
          AsyncStorage.getItem('userData'),
        ]);

        let g = [];
        try { g = gs ? JSON.parse(gs) : []; } catch { g = []; }

        if (!Array.isArray(g) || g.length === 0) {
          const sampleGroups = [
            {
              id: 'grp-devs',
              name: 'Dev Team',
              lastMessage: 'Standup at 10:00, don’t be late ⏰',
              membersList: [
                { phone: '+15550001', name: 'Alice Johnson', avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=256&auto=format&fit=crop' },
                { phone: '+15550002', name: 'Bob Lee', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop' },
                { phone: '+15550003', name: 'Chris Wong', avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=crop' },
              ],
            },
            {
              id: 'grp-hike',
              name: 'Weekend Hikers',
              lastMessage: 'Trail starts 6am. Bring water 🥾',
              membersList: [
                { phone: '+15550004', name: 'Diana Prince', avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=crop' },
                { phone: '+15550005', name: 'Ethan Hunt', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop' },
              ],
            },
          ];
          g = sampleGroups;
          try { await AsyncStorage.setItem('availableGroups', JSON.stringify(sampleGroups)); } catch (e) { console.log('[Chats] seed groups persist err', e); }
        }

        setGroups(Array.isArray(g) ? g : []);

        const me = ud ? JSON.parse(ud) : { phone: 'guest' };

        const sampleDirects = [
          { phone: '+15550006', name: 'Femi Ade', avatarUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=256&auto=format&fit=crop', lastMessage: 'Send the invoice when free.' },
          { phone: '+15550007', name: 'Grace Kim', avatarUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop', lastMessage: 'Thanks! Received 👌' },
          { phone: '+15550008', name: 'Hassan Ali', avatarUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop', lastMessage: 'Lunch tomorrow?' },
        ];

        const uniques = new Map();
        (g || []).forEach((gr) => (gr.membersList || []).forEach((m) => { if (m && m.phone) uniques.set(m.phone, m); }));
        sampleDirects.forEach((m) => { if (m && m.phone) uniques.set(m.phone, m); });
        uniques.delete(me?.phone);
        setPeople(Array.from(uniques.values()));
      } catch (e) {
        console.log('[Chats] load error', e);
      }
    })();
  }, []);

  const filteredGroups = useMemo(() => groups.filter((g) => (g?.name || '').toLowerCase().includes(q.toLowerCase())), [groups, q]);
  const filteredPeople = useMemo(() => people.filter((p) => (p?.name || '').toLowerCase().includes(q.toLowerCase()) || (p?.phone || '').includes(q)), [people, q]);

  const Header = useMemo(() => (
    <View style={styles.header} testID="chatHeader">
      <Text style={styles.title}>Messages</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => console.log('compose tapped')} style={styles.iconBtn} testID="composeBtn">
        <Pencil color="#111" size={20} />
      </TouchableOpacity>
    </View>
  ), []);

  const SearchBar = (
    <View style={styles.searchWrap} testID="searchWrap">
      <Search color="#9AA0A6" size={18} />
      <TextInput
        style={styles.searchInput}
        value={q}
        onChangeText={setQ}
        placeholder="Search"
        placeholderTextColor="#9AA0A6"
        autoCorrect={false}
        testID="searchInput"
      />
    </View>
  );

  const Tabs = (
    <View style={styles.tabs} testID="tabs">
      <TouchableOpacity style={[styles.tabItem, tab === 'groups' && styles.tabActive]} onPress={() => setTab('groups')} testID="tabGroups">
        <Text style={[styles.tabLabel, tab === 'groups' && styles.tabLabelActive]}>Groups</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tabItem, tab === 'direct' && styles.tabActive]} onPress={() => setTab('direct')} testID="tabDirect">
        <Text style={[styles.tabLabel, tab === 'direct' && styles.tabLabelActive]}>Direct Messages</Text>
      </TouchableOpacity>
    </View>
  );

  const Empty = (
    <View style={styles.empty} testID="emptyState">
      <Text style={styles.emptyText}>No conversations yet</Text>
    </View>
  );

  const renderGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={() => router.push(`/(tabs)/chats/${item?.id}`)}
      testID={`group-${item?.id}`}
    >
      <View style={styles.avatarWrap}>
        <View style={[styles.avatarCircle, { backgroundColor: '#FDE7C4' }]}> 
          <Users color="#C9832B" size={20} />
        </View>
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item?.name ?? 'Group'}</Text>
        <Text style={styles.itemSubtitle} numberOfLines={1}>{item?.lastMessage ?? 'Start the conversation'}</Text>
      </View>
    </TouchableOpacity>
  );

  const Avatar = ({ uri, name }) => {
    const initials = (name || '').split(' ').map((s) => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
    if (uri) {
      return (
        <Image source={{ uri }} style={styles.avatarImage} resizeMode="cover" />
      );
    }
    return (
      <View style={[styles.avatarCircle, { backgroundColor: '#F5E8FF' }]}> 
        <Text style={styles.avatarInitials}>{initials || '?'}</Text>
      </View>
    );
  };

  const renderPerson = ({ item }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={() => router.push(`/(tabs)/chats/${encodeURIComponent(item?.phone || item?.id)}`)}
      testID={`dm-${item?.phone || item?.id}`}
    >
      <View style={styles.avatarWrap}>
        <Avatar uri={item?.avatarUrl} name={item?.name} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item?.name ?? 'Unknown'}</Text>
        <Text style={styles.itemSubtitle} numberOfLines={1}>{item?.lastMessage ?? item?.phone ?? ''}</Text>
      </View>
    </TouchableOpacity>
  );

  const data = tab === 'groups' ? filteredGroups : filteredPeople;
  const renderItem = tab === 'groups' ? renderGroup : renderPerson;

  return (
    <SafeAreaView style={styles.container}>
      {Header}
      <View style={styles.content}>
        {SearchBar}
        {Tabs}
        <FlatList
          data={data}
          keyExtractor={(i, idx) => (i?.id || i?.phone || String(idx))}
          renderItem={renderItem}
          ListEmptyComponent={Empty}
          contentContainerStyle={data.length === 0 ? styles.listEmptyPad : undefined}
          testID="chatList"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  iconBtn: { position: 'absolute', right: 20, padding: 6, borderRadius: 18, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 16, paddingTop: 8, flex: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 14, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, color: '#111', fontSize: 16 },
  tabs: { flexDirection: 'row', gap: 24, paddingTop: 14, paddingBottom: 6 },
  tabItem: { paddingBottom: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1F2937' },
  tabLabel: { color: '#8A8F98', fontWeight: '600' },
  tabLabelActive: { color: '#1F2937' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', marginRight: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEE' },
  avatarInitials: { color: '#7C3AED', fontWeight: '700' },
  itemBody: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#F1F3F5', paddingBottom: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  itemSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: '#9AA0A6' },
  listEmptyPad: { flexGrow: 1 },
});
