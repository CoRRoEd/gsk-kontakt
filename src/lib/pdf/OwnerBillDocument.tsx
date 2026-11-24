import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import path from 'path';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf') },
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'), fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Roboto', color: '#000' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  qrBox: { width: 90, height: 90, borderWidth: 1, borderColor: '#ccc', padding: 5 },
  qrImage: { width: '100%', height: '100%' },
  rightHeader: { alignItems: 'flex-end', width: '70%' },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  lcBox: { backgroundColor: '#ffcccc', padding: 5, borderWidth: 1, borderColor: '#000', marginBottom: 5 },
  lcText: { fontSize: 14, fontWeight: 'bold' },
  infoText: { fontSize: 9, textAlign: 'right', marginBottom: 2 },
  
  table: { marginTop: 15, borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#f0f0f0', padding: 5 },
  tableRow: { flexDirection: 'row', padding: 5 },
  col1: { width: '40%', borderRightWidth: 1, borderColor: '#000', paddingRight: 5 },
  col2: { width: '20%', textAlign: 'center', borderRightWidth: 1, borderColor: '#000' },
  col3: { width: '20%', textAlign: 'center', borderRightWidth: 1, borderColor: '#000' },
  col5: { width: '20%', textAlign: 'center', fontWeight: 'bold' },

  section: { marginTop: 15 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 150, color: '#555' },
  value: { flex: 1, fontWeight: 'bold' },
  
  footer: { marginTop: 20, fontSize: 8, color: '#333', lineHeight: 1.4 }
});

export default function OwnerBillDocument({ charge, owner, garage, qrDataUrl }: any) {
  const periodStr = new Date(charge.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const amount = Number(charge.amount).toFixed(2);
  const lcStr = `Ряд ${garage.row} - Бокс ${garage.number}`;

  // Словарь названий услуг
  const serviceNames: Record<string, string> = {
    electricity: 'Электроэнергия',
    membership_fee: 'Членский взнос',
    targeted_fee: 'Целевой взнос',
    maintenance_fee: 'Содержание и ремонт',
    penalty: 'Пени / Штраф',
    debt_carryover: 'Старый долг'
  };
  
  const serviceName = serviceNames[charge.paymentType] || 'Услуги ГСК';
  const isElectricity = charge.paymentType === 'electricity';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.headerRow}>
          <View style={styles.qrBox}>
            {qrDataUrl && <Image src={qrDataUrl} style={styles.qrImage} />}
          </View>
          
          <View style={styles.rightHeader}>
            <Text style={styles.title}>ГСК «Контакт»</Text>
            <Text style={styles.infoText}>ИНН 2902027646</Text>
            <Text style={styles.infoText}>Р/с 40703810804000000059</Text>
            <Text style={styles.infoText}>БИК 041117601</Text>
            
            <View style={styles.lcBox}>
              <Text style={styles.lcText}>Л/С: {lcStr}</Text>
            </View>
            
            <Text style={styles.infoText}>Период: {periodStr}</Text>
            <Text style={styles.infoText}>ФИО: {owner.fullName}</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 5 }}>
              Всего к оплате: {amount} руб.
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Услуга</Text>
            <Text style={styles.col2}>Начислено</Text>
            <Text style={styles.col3}>Оплачено</Text>
            <Text style={styles.col5}>Итого к оплате</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>{serviceName}</Text>
            <Text style={styles.col2}>{amount}</Text>
            <Text style={styles.col3}>0.00</Text>
            <Text style={styles.col5}>{amount}</Text>
          </View>
        </View>

        {/* Блок с показаниями выводим ТОЛЬКО если это электроэнергия */}
        {isElectricity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Показания счётчика</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Предыдущее показание:</Text>
              <Text style={styles.value}>{Number(charge.prevT1 || 0)} кВт·ч</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Текущее показание:</Text>
              <Text style={styles.value}>{Number(charge.consumptionT1 || 0) + Number(charge.prevT1 || 0)} кВт·ч</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Расход за период:</Text>
              <Text style={styles.value}>{Number(charge.consumptionT1 || 0)} кВт·ч</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Тариф:</Text>
              <Text style={styles.value}>{Number(charge.tariffT1 || 0).toFixed(2)} руб./кВт·ч</Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>Уважаемые потребители!</Text>
          <Text>Вы можете оплатить квитанцию, отсканировав QR-код в мобильном приложении банка.</Text>
          <Text>Наведите камеру телефона на QR-код в левом верхнем углу. Сумма и реквизиты подставятся автоматически.</Text>
          <Text style={{ marginTop: 5 }}>Оплатить также можно в отделениях банков по указанным выше реквизитам.</Text>
        </View>

      </Page>
    </Document>
  );
}