import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FileText } from 'lucide-react-native';

export default function BlockchainScreen() {
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const lg = await AsyncStorage.getItem('loanLedger');
        if (lg) setLedger(JSON.parse(lg));
      } catch (e) { console.log('[Blockchain] load', e); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        {ledger.length === 0 ? (
          <View style={styles.empty}><FileText color="#ccc" size={48} /><Text style={styles.emptyText}>No entries yet</Text></View>
        ) : (
          ledger.slice().reverse().map((e) => (
            <View key={e.id} style={styles.card}>
              <Text style={styles.title}>{e.type}</Text>
              <Text style={styles.small}>Hash: {e.hash}</Text>
              <Text style={styles.small}>Prev: {e.prev}</Text>
              <Text style={styles.small}>Time: {new Date(e.ts).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#777', marginTop: 8 },
  card: { backgroundColor: '#fff', margin: 16, padding: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  title: { color: '#333', fontWeight: '800', marginBottom: 6 },
  small: { color: '#999', fontSize: 12 },
});