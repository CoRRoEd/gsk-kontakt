import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

// РЕГИСТРИРУЕМ ЛОКАЛЬНЫЙ ШРИФТ (берем из папки public)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf') },
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'), fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: 'Roboto' },
  header: { fontSize: 18, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  section: { marginBottom: 15 },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 120, fontWeight: 'bold', color: '#555' },
  value: { flex: 1 },
  total: { marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderColor: '#000', fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
});

export default function InvoiceDocument({ charge, owner, garage, cooperative }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{cooperative.name}</Text>
        
        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.label}>ИНН:</Text><Text style={styles.value}>{cooperative.inn}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Адрес:</Text><Text style={styles.value}>{cooperative.address}</Text></View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' }}>
          СЧЕТ НА ОПЛАТУ № {charge.id.substring(0, 8).toUpperCase()}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Период:</Text>
            <Text style={styles.value}>
              {new Date(charge.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.row}><Text style={styles.label}>Плательщик:</Text><Text style={styles.value}>{owner.fullName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Лицевой счет:</Text><Text style={styles.value}>Ряд {garage.row} · Блок {garage.block} · Бокс {garage.number}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Назначение:</Text><Text style={styles.value}>Оплата электроэнергии</Text></View>
        </View>

        <View style={{ marginTop: 20, borderTopWidth: 1, borderColor: '#ccc', paddingTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Расход: {Number(charge.consumptionT1)} кВт·ч</Text>
            <Text style={{ marginTop: 5 }}>Тариф: {Number(charge.tariffT1).toFixed(2)} руб./кВт·ч</Text>
        </View>

        <Text style={styles.total}>ИТОГО К ОПЛАТЕ: {Number(charge.amount).toFixed(2)} руб.</Text>
      </Page>
    </Document>
  );
}