import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react-native';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BarChart3 color="#FFA500" />
          <Text style={styles.title}>Analytics</Text>
        </View>
        <Text style={styles.subtitle}>Overview of your finances</Text>

        <View style={styles.card}>
          <View style={styles.row}><TrendingUp color="#5CCEF4" /><Text style={styles.metric}>Monthly Contributions: NLe 5,200</Text></View>
          <View style={styles.row}><PieChart color="#62DDBD" /><Text style={styles.metric}>Savings vs Loans: 60% / 40%</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Groups</Text>
          <Text style={styles.item}>• Family Osusu – NLe 2,100</Text>
          <Text style={styles.item}>• Friends Pot – NLe 1,500</Text>
          <Text style={styles.item}>• Workmates – NLe 1,000</Text>
        </View>
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
  cardTitle: { fontWeight: '800', color: '#333', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metric: { color: '#333', fontWeight: '700' },
  item: { color: '#333', marginTop: 4 },
});
