import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

// Подключаем наш локальный шрифт
Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf') },
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'), fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Roboto' },
  section: { flex: 1, marginBottom: 20 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  formTitle: { fontSize: 10, textAlign: 'right', marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-end' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, alignItems: 'flex-end' },
  label: { fontSize: 8, color: '#333', width: 160, borderBottomWidth: 1, borderColor: '#000', paddingBottom: 1 },
  labelShort: { fontSize: 8, color: '#333', width: 80, borderBottomWidth: 1, borderColor: '#000', paddingBottom: 1 },
  value: { fontSize: 11, flex: 1, paddingLeft: 5, borderBottomWidth: 1, borderColor: '#000', paddingBottom: 1 },
  valueRight: { fontSize: 11, width: 100, textAlign: 'left', paddingLeft: 5, borderBottomWidth: 1, borderColor: '#000', paddingBottom: 1 },
  caption: { fontSize: 7, color: '#666', position: 'absolute', top: -10 },
  dashedLine: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#000', marginVertical: 20 },
  signature: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  signatureLine: { borderTopWidth: 1, borderColor: '#000', width: 150, marginTop: 15, paddingTop: 2, fontSize: 8, textAlign: 'center' },
});

const bankDetails = {
  name: 'ГСК «Контакт»',
  inn: '2902027646',
  account: '40703810804000000059',
  bank: 'Отделение 8637 Сбербанка России г. Архангельск',
  bic: '041117601',
  corrAccount: '30101810100000000601'
};

export default function InvoiceDocument({ charge, owner, garage, cooperative }: any) {
  const periodStr = new Date(charge.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('ru-RU');
  const garageInfo = `Ряд ${garage.row} · Блок ${garage.block} · Бокс ${garage.number}`;
  const totalAmount = Number(charge.amount).toFixed(2);

  // Компонент для отрисовки одной половины (Извещение или Квитанция)
  const PdkBlock = ({ title }: { title: string }) => (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.formTitle}>Форма № ПД-4</Text>

      <View style={styles.row}>
        <Text style={styles.value}>{bankDetails.name}</Text>
      </View>
      <Text style={{ fontSize: 7, color: '#666', marginBottom: 5 }}>(наименование получателя платежа)</Text>

      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', flex: 1, marginRight: 10 }}>
          <Text style={styles.value}>{bankDetails.inn}</Text>
        </View>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Text style={styles.value}>{bankDetails.account}</Text>
        </View>
      </View>
      <View style={styles.rowBetween}>
        <Text style={{ fontSize: 7, color: '#666', width: '50%' }}>(ИНН получателя платежа)</Text>
        <Text style={{ fontSize: 7, color: '#666', width: '50%' }}>(номер счёта получателя платежа)</Text>
      </View>

      <View style={{ marginTop: 5 }}>
        <View style={styles.row}>
          <Text style={styles.value}>{bankDetails.bank}</Text>
        </View>
        <Text style={{ fontSize: 7, color: '#666', marginBottom: 5 }}>(наименование банка)</Text>

        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', flex: 1, marginRight: 10 }}>
            <Text style={styles.value}>{bankDetails.bic}</Text>
          </View>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <Text style={styles.value}>{bankDetails.corrAccount}</Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: 7, color: '#666', width: '50%' }}>(БИК)</Text>
          <Text style={{ fontSize: 7, color: '#666', width: '50%' }}>Кор./сч.</Text>
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <View style={styles.row}>
          <Text style={styles.value}>Оплата электроэнергии за {periodStr}</Text>
        </View>
        <Text style={{ fontSize: 7, color: '#666', marginBottom: 5 }}>(наименование платежа)</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Ф.И.О. плательщика:</Text>
        <Text style={styles.value}>{owner.fullName}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Адрес плательщика:</Text>
        <Text style={styles.value}>{garageInfo}</Text>
      </View>
      
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', flex: 1, marginRight: 10 }}>
          <Text style={styles.labelShort}>Сумма платежа:</Text>
          <Text style={styles.valueRight}>{totalAmount}</Text>
        </View>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Text style={styles.labelShort}>Плата за услуги:</Text>
          <Text style={styles.valueRight}>0.00</Text>
        </View>
      </View>

      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', flex: 1, marginRight: 10 }}>
          <Text style={styles.labelShort}>Итого:</Text>
          <Text style={styles.valueRight}>{totalAmount}</Text>
        </View>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Text style={styles.labelShort}>Дата:</Text>
          <Text style={styles.valueRight}>{todayStr}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 8, marginTop: 10, lineHeight: 1.2 }}>
        С условиями приёма указанной в платёжном документе суммы, в т.ч. с суммой взимаемой платы за услуги банка, ознакомлен и согласен.
      </Text>

      <View style={styles.signature}>
        <View>
          <Text style={{ fontSize: 8 }}>Плательщик (подпись):</Text>
          <View style={styles.signatureLine}></View>
        </View>
        <View>
          <Text style={{ fontSize: 8 }}>Кассир</Text>
          <View style={styles.signatureLine}></View>
        </View>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdkBlock title="Извещение" />
        
        {/* Линия отреза */}
        <View style={styles.dashedLine} />
        
        <PdkBlock title="Квитанция" />
      </Page>
    </Document>
  );
}