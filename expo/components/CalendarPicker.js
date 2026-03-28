import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

export default function CalendarPicker({ label = 'Pick Date', value, onChange, minDate, maxDate, testIDPrefix = 'cal' }) {
  const [visible, setVisible] = useState(false);
  const [cursor, setCursor] = useState(() => {
    try {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(value + 'T00:00:00');
      }
    } catch {}
    return new Date();
  });

  const selected = useMemo(() => {
    try { return value ? new Date(value + 'T00:00:00') : null; } catch { return null; }
  }, [value]);

  const monthMeta = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startWeekday = first.getDay();
    const days = last.getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return { y, m, cells };
  }, [cursor]);

  const format = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isDisabled = (d) => {
    if (!d) return true;
    if (minDate) {
      try { if (d < new Date(minDate + 'T00:00:00')) return true; } catch {}
    }
    if (maxDate) {
      try { if (d > new Date(maxDate + 'T00:00:00')) return true; } catch {}
    }
    return false;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        testID={`${testIDPrefix}-open`}
      >
        <View style={styles.triggerLeft}>
          <CalendarIcon color="#FFA500" size={18} />
          <Text style={styles.triggerText}>{value ? new Date(value + 'T00:00:00').toDateString() : label}</Text>
        </View>
        <Text style={styles.triggerChevron}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  testID={`${testIDPrefix}-prev`}
                  style={styles.navBtn}
                >
                  <ChevronLeft color="#333" size={20} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity
                  onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  testID={`${testIDPrefix}-next`}
                  style={styles.navBtn}
                >
                  <ChevronRight color="#333" size={20} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn} testID={`${testIDPrefix}-close`}>
                <X color="#666" size={22} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d)=>(
                <Text key={d} style={styles.weekDay}>{d}</Text>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              <View style={styles.grid}>
                {monthMeta.cells.map((d, idx) => {
                  const disabled = isDisabled(d);
                  const isSel = !!selected && d && selected.getFullYear() === d.getFullYear() && selected.getMonth() === d.getMonth() && selected.getDate() === d.getDate();
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.cell, disabled && styles.cellDisabled, isSel && styles.cellSelected]}
                      disabled={!d || disabled}
                      onPress={() => {
                        if (!d) return;
                        const v = format(d);
                        onChange && onChange(v);
                        setCursor(d);
                        setVisible(false);
                      }}
                      testID={`${testIDPrefix}-cell-${idx}`}
                    >
                      <Text style={[styles.cellText, disabled && styles.cellTextDisabled, isSel && styles.cellTextSelected]}>{d ? d.getDate() : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={() => {
                  const t = new Date();
                  const v = format(t);
                  setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
                  onChange && onChange(v);
                  setVisible(false);
                }}
                testID={`${testIDPrefix}-today`}
              >
                <Text style={styles.todayText}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', height: 50, paddingHorizontal: 15 },
  triggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  triggerText: { color: '#333', fontSize: 16 },
  triggerChevron: { color: '#666', fontSize: 12 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '90%', maxWidth: 420 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  closeBtn: { padding: 6 },
  monthTitle: { fontWeight: '700', color: '#333' },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 6 },
  weekDay: { width: `${100/7}%`, textAlign: 'center', color: '#999', fontSize: 12, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  cellDisabled: { opacity: 0.35 },
  cellSelected: { backgroundColor: '#fff5e6' },
  cellText: { color: '#333', fontWeight: '600' },
  cellTextDisabled: { color: '#999' },
  cellTextSelected: { color: '#FFA500' },

  footer: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  todayBtn: { backgroundColor: '#FFA500', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  todayText: { color: '#fff', fontWeight: '700' },
});