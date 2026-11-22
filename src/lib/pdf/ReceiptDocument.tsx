import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// РЕГИСТРИРУЕМ ШРИФТ
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: 'Roboto' }, // ПРИМЕНЯЕМ
  header: { fontSize: 18, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  section: { marginBottom: 15 },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 150, fontWeight: 'bold', color: '#555' },
  value: { flex: 1 },
  total: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderColor: '#ccc', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 10, color: '#888' },
});

export default function ReceiptDocument({ receipt, ownerName, cooperative }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{cooperative.name}</Text>
        
        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.label}>ИНН:</Text><Text style={styles.value}>{cooperative.inn}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Адрес:</Text><Text style={styles.value}>{cooperative.address}</Text></View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 20, textAlign: 'center' }}>
          КВИТАНЦИЯ № {receipt.number}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.label}>Дата выдачи:</Text><Text style={styles.value}>{new Date(receipt.issuedAt).toLocaleDateString('ru-RU')}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Плательщик:</Text><Text style={styles.value}>{ownerName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Назначение:</Text><Text style={styles.value}>Оплата электроэнергии</Text></View>
          <View style={styles.row}><Text style={styles.label}>ID операции:</Text><Text style={styles.value}>{receipt.paymentId}</Text></View>
        </View>

        <View style={{ marginTop: 30, borderTopWidth: 1, borderColor: '#000', paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: 'bold' }}>ИТОГО К ОПЛАТЕ:</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{Number(receipt.amount).toFixed(2)} руб.</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Документ сформирован автоматически системой ГСК «Контакт». Не требует подписи и печати.
        </Text>
      </Page>
    </Document>
  );
}