import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FileText, Download } from 'lucide-react-native';

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <FileText color="#FFA500" />
          <Text style={styles.title}>Reports</Text>
        </View>
        <Text style={styles.subtitle}>Export receipts and statements</Text>

        <TouchableOpacity style={styles.card} testID="reportOsusu">
          <Text style={styles.cardTitle}>Osusu Contributions</Text>
          <Text style={styles.cardDesc}>Generate PDF receipts for group payments</Text>
          <View style={styles.download}><Download color="#FFA500" size={18} /><Text style={styles.downloadText}>Generate PDF</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} testID="reportLoans">
          <Text style={styles.cardTitle}>Loans</Text>
          <Text style={styles.cardDesc}>Payment history and outstanding balance</Text>
          <View style={styles.download}><Download color="#FFA500" size={18} /><Text style={styles.downloadText}>Generate PDF</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} testID="reportTransfers">
          <Text style={styles.cardTitle}>Transfers</Text>
          <Text style={styles.cardDesc}>Mobile money and bank transactions</Text>
          <View style={styles.download}><Download color="#FFA500" size={18} /><Text style={styles.downloadText}>Generate PDF</Text></View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#333' },
  subtitle: { color: '#666', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontWeight: '800', color: '#333' },
  cardDesc: { color: '#666', marginTop: 4 },
  download: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  downloadText: { color: '#FFA500', fontWeight: '700' },
});
