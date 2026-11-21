import shortReceipt from './convertReceipt-02.html'
import fixture1 from './convertReceipt-01.html'
import synthetic1 from './convertReceipt-03.html'
import synthetic2 from './convertReceipt-04.html'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-05-05',
      time: '19:42:10'
    },
    currency: 'RSD',
    totalAmount: '4048.76',
    merchant: {
      name: 'UNIVEREXPORT',
      address: 'БУЛЕВАР ОСЛОБОЂЕЊА 119 Нови Сад'
    },
    items: [
      {
        name: 'DESERT COK 115G ZOTT (KOM) (Ђ)',
        quantity: '4',
        unitPrice: '68.99',
        totalAmount: '275.96'
      },
      {
        name: 'KOB.PIL.POSEB.320G (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '190.99',
        totalAmount: '190.99'
      },
      {
        name: 'CAJNA KOB.SLAJS 100G (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '229.99',
        totalAmount: '229.99'
      },
      {
        name: 'CIPIRIPI DEZERT 100G (KOM) (Ђ)',
        quantity: '4',
        unitPrice: '71.99',
        totalAmount: '287.96'
      },
      {
        name: 'ZVAKE BUBLE MINT 14G (KOM) (Ђ)',
        quantity: '3',
        unitPrice: '70.99',
        totalAmount: '212.97'
      },
      {
        name: 'VODA ROSA NEGAZ. 6L (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '199.99',
        totalAmount: '199.99'
      },
      {
        name: 'JAB FAMILY 1,5L NEC (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '182.99',
        totalAmount: '182.99'
      },
      {
        name: 'PP PILECI  BATAK 480 (KOM) (Е)',
        quantity: '1',
        unitPrice: '259.99',
        totalAmount: '259.99'
      },
      {
        name: 'KESA SA RUCKOM UNI (KOM) (Ђ)',
        quantity: '3',
        unitPrice: '19',
        totalAmount: '57'
      },
      {
        name: 'KRPA KUH  50x70 1/1 (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '299.99',
        totalAmount: '299.99'
      },
      {
        name: 'KINDER CHOCOFRESH 41 (KOM) (Ђ)',
        quantity: '2',
        unitPrice: '104.99',
        totalAmount: '209.98'
      },
      {
        name: 'MLEKO UHT MK 1,5L (KOM) (Е)',
        quantity: '1',
        unitPrice: '229.99',
        totalAmount: '229.99'
      },
      {
        name: 'PAN.ODRES.P.FILE 700 (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '683.99',
        totalAmount: '683.99'
      },
      {
        name: 'MAJONEZ CLAS 285ML D (KOM) (Ђ)',
        quantity: '1',
        unitPrice: '174.99',
        totalAmount: '174.99'
      },
      {
        name: 'EUROMAX HC 250G (KOM) (Ђ)',
        quantity: '2',
        unitPrice: '275.99',
        totalAmount: '551.98'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '4048.76'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})

// Complete page reached from the observed 128.pl redirect, 2026-11-05, receipts.csv row 7.
// Cash tender is 4000, not the applied settlement; no change evidence is available here.
test('converts the receipt reached through the short link', () => {
  expect(convertReceipt(shortReceipt)).toEqual({
    completeness: 'full',
    currency: 'RSD',
    operation: 'unknown',
    issuedAt: { date: '2025-06-01', time: '18:56:54' },
    totalAmount: '3411.97',
    merchant: { name: 'DELHAIZE SERBIA DOO BEOGRAD', address: 'СЕНТАНДРЕЈСКИ ПУТ 11 Нови Сад' },
    items: [
      { name: 'Vino crv.Mackov p.Portug.0.75l/KOM (Ђ)', quantity: '1', unitPrice: '1099', totalAmount: '1099' },
      { name: 'Cips pekarski deb.rezan 150g/KOM (Ђ)', quantity: '1', unitPrice: '189.99', totalAmount: '189.99' },
      { name: 'Min.voda spo.cap Vodavoda 1l/KOM (Ђ)', quantity: '1', unitPrice: '75.99', totalAmount: '75.99' },
      { name: 'Liker Jager. 0,5l+2x shot casa/KOM (Ђ)', quantity: '1', unitPrice: '1957', totalAmount: '1957' },
      { name: 'Fanta orange zero 0,5l PCT/KOM (Ђ)', quantity: '1', unitPrice: '89.99', totalAmount: '89.99' }
    ]
  })
})

// Synthetic receipt: shop, items and numbers are invented; only the journal layout is reproduced.
// Verified against real receipts: before 10:00 the hour has no leading zero, names wrap at the
// 40-column journal width (mid-word, after a space, or before one), "other cashless" tender.
test('converts a morning receipt with wrapped names', () => {
  expect(convertReceipt(synthetic1)).toEqual({
    completeness: 'full',
    currency: 'RSD',
    operation: 'unknown',
    issuedAt: { date: '2026-11-21', time: '07:05:09' },
    totalAmount: '1121.46',
    merchant: { name: 'TEST MARKET DOO', address: 'ТЕСТНА УЛИЦА 1 Нови Сад' },
    items: [
      { name: 'HLEB BELI 500G / KOM (Ђ)', quantity: '1', unitPrice: '65', totalAmount: '65' },
      { name: 'JOGURT NATUR 2.8% MM 1KG CASA 12345 / KOM (Ђ)', quantity: '2', unitPrice: '129.99', totalAmount: '259.98' },
      { name: 'JABUKE CRVENE / KG (Ђ)', quantity: '1.25', unitPrice: '149.99', totalAmount: '187.49' },
      { name: 'KAFA MLEVENA 200G STANDARD PAKOVANJE 2X VAKUUM / KOM (Ђ)', quantity: '1', unitPrice: '389', totalAmount: '389' },
      { name: 'SIR GAUDA NARESCI 150G MLEKARA SABAC 123 / KOM (Ђ)', quantity: '1', unitPrice: '219.99', totalAmount: '219.99' }
    ],
    payments: [{ method: 'cashless', amount: '1121.46' }]
  })
})

// Synthetic receipt, as above. Cash and a voucher add up to the total, so the printed cash is
// the applied amount; a voucher has no exact Receipt method.
test('converts cash and voucher tenders that settle the total', () => {
  expect(convertReceipt(synthetic2)).toEqual({
    completeness: 'full',
    currency: 'RSD',
    operation: 'unknown',
    issuedAt: { date: '2026-11-21', time: '19:30:00' },
    totalAmount: '1499',
    merchant: { name: 'TEST MARKET DOO', address: 'ТЕСТНА УЛИЦА 1 Нови Сад' },
    items: [
      { name: 'MASLINOVO ULJE EXTRA DEVICANSKO 1L / KOM (Ђ)', quantity: '1', unitPrice: '1499', totalAmount: '1499' }
    ],
    payments: [{ method: 'cash', amount: '999' }, { method: 'other', amount: '500', name: 'Ваучер' }]
  })
})
