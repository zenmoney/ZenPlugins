import { convertReceipt } from '../converters'
import source1 from './convertReceipt-01.json'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 1689.
// The adjacent fixture preserves the entire observed provider response.
test('keeps all 48 lines, source rounding, BAM and the explicit UTC timestamp', () => {
  expect(convertReceipt(source1)).toEqual({
    completeness: 'full',
    currency: 'BAM',
    operation: 'sale',
    issuedAt: {
      date: '2026-09-26',
      time: '18:47:36.14',
      utcOffsetMinutes: 0
    },
    totalAmount: '300.87',
    merchant: {
      name: '"BINGO" d.o.o. export-import Tuzla, ПОСЛОВНА ЈЕДИНИЦА број 150 "Хипермаркет" Требиње',
      address: 'Тини бб',
      identifiers: [
        {
          value: '4209253453134',
          countryCode: 'BA'
        }
      ]
    },
    items: [
      {
        name: 'ČAJ 30G SLIM AHMAD / KOM',
        quantity: '1',
        unitPrice: '6.25',
        totalAmount: '6.25'
      },
      {
        name: 'ČAJ 30G SLEEP AHMAD / KOM',
        quantity: '1',
        unitPrice: '6.25',
        totalAmount: '6.25'
      },
      {
        name: 'ČAJ 30G ENERGY AHMAD / KOM',
        quantity: '1',
        unitPrice: '6.25',
        totalAmount: '6.25'
      },
      {
        name: 'KREKERI 150G SCHAR FETTE CROCCANTI SPEC.BEZ GLUTENA / KOM',
        quantity: '1',
        unitPrice: '4.5',
        totalAmount: '4.5'
      },
      {
        name: 'VINO CRVENO 750ML KVALITETNO PLAVAC DINGAČ / KOM',
        quantity: '1',
        unitPrice: '11.45',
        totalAmount: '11.45'
      },
      {
        name: 'VINO CRVENO 187ML KUPINOVO ČOKA / KOM',
        quantity: '1',
        unitPrice: '3.5',
        totalAmount: '3.5'
      },
      {
        name: 'VODA MINERALNA 500ML KNJAZ MILOŠ / KOM',
        quantity: '4',
        unitPrice: '0.75',
        totalAmount: '3'
      },
      {
        name: 'KREKERI 140G PIZZA MARETTI / KOM',
        quantity: '1',
        unitPrice: '1.85',
        totalAmount: '1.85'
      },
      {
        name: 'NAPITAK PROTEIN 500ML ZBREGOV JAGODA / KOM',
        quantity: '1',
        unitPrice: '3.95',
        totalAmount: '3.95'
      },
      {
        name: 'SOK 750ML MRKVA-NARANDŽA 100% NATURAL ST. / KOM',
        quantity: '1',
        unitPrice: '5.55',
        totalAmount: '5.55'
      },
      {
        name: 'NAPITAK PROTEIN 500ML ZBREGOV PISTACIJA / KOM',
        quantity: '2',
        unitPrice: '3.95',
        totalAmount: '7.9'
      },
      {
        name: 'ČOKOLADNO JAJE 20G KINDER SA IGRAČKOM FERRERO ROZA / KOM',
        quantity: '2',
        unitPrice: '2.45',
        totalAmount: '4.9'
      },
      {
        name: 'SVJEŽA NEKTARINA / KG',
        quantity: '0.75',
        unitPrice: '2.9',
        totalAmount: '2.18'
      },
      {
        name: 'NAPITAK PROTEIN 500ML ZBREGOV BIJELA ČOKOLADA MALINA / KOM',
        quantity: '2',
        unitPrice: '3.95',
        totalAmount: '7.9'
      },
      {
        name: 'TOALETNI PAPIR 4SL 10KOM SOFTLY DELUXE / KOM',
        quantity: '1',
        unitPrice: '8.95',
        totalAmount: '8.95'
      },
      {
        name: 'SIR TILSIT PALADIN / KG',
        quantity: '0.426',
        unitPrice: '13.25',
        totalAmount: '5.64'
      },
      {
        name: 'GRČKI TIP JOGURTA 400G GREKOS / KOM',
        quantity: '1',
        unitPrice: '2.6',
        totalAmount: '2.6'
      },
      {
        name: 'JOGURT VOĆNI 400G ZOTT JOGOBELA MAXI CLASSIC / KOM',
        quantity: '1',
        unitPrice: '3.3',
        totalAmount: '3.3'
      },
      {
        name: 'MASLINE 400G ZELENE 4XL SA KOŠPICOM MARMARABIRLIK STAKLO / KOM',
        quantity: '1',
        unitPrice: '6.95',
        totalAmount: '6.95'
      },
      {
        name: 'DVOPEK 280G INTEGRALNI MB GRANETI BARILLA / KOM',
        quantity: '1',
        unitPrice: '4.85',
        totalAmount: '4.85'
      },
      {
        name: 'KAFA ESPRESSO 55G CLASSICO TCHIBO NESPRESSO / KOM',
        quantity: '1',
        unitPrice: '8.2',
        totalAmount: '8.2'
      },
      {
        name: 'DVOPEK 205G ORIGINAL WASA / KOM',
        quantity: '1',
        unitPrice: '4.5',
        totalAmount: '4.5'
      },
      {
        name: 'MARAMICE 15KOM ZA BIJELI VEŠ AKTIVNE DR.BECMAN / KOM',
        quantity: '1',
        unitPrice: '6.8',
        totalAmount: '6.8'
      },
      {
        name: 'MARAMICE VLAŽNE 60KOM SEPTONA ANTIBAKT.JABUKA / KOM',
        quantity: '1',
        unitPrice: '4.6',
        totalAmount: '4.6'
      },
      {
        name: 'PASTA ZA ZUBE 50ML COLGATE SMILES 6+ / KOM',
        quantity: '1',
        unitPrice: '4.15',
        totalAmount: '4.15'
      },
      {
        name: 'ULOŠCI DNEVNI 58KOM COSMEA COMFORT ALOE VERA / KOM',
        quantity: '1',
        unitPrice: '4.4',
        totalAmount: '4.4'
      },
      {
        name: 'MARAMICE 40KOM LOVAC NA BOJE K2R / KOM',
        quantity: '2',
        unitPrice: '7.95',
        totalAmount: '15.9'
      },
      {
        name: 'BOMBONJERA 204G GRIOTTE KRAŠ / KOM',
        quantity: '1',
        unitPrice: '7.75',
        totalAmount: '7.75'
      },
      {
        name: 'SAPUN TEČNI 1L GENERA NEUTRO BEZ ŠPRICE  / KOM',
        quantity: '2',
        unitPrice: '3.75',
        totalAmount: '7.5'
      },
      {
        name: 'SAPUN TEČNI 500ML GENERA MOŠUS SA ŠPRICOM / KOM',
        quantity: '2',
        unitPrice: '3.1',
        totalAmount: '6.2'
      },
      {
        name: 'SAPUN 250G VANISH / KOM',
        quantity: '1',
        unitPrice: '14.45',
        totalAmount: '14.45'
      },
      {
        name: 'DŽEM 375G SMOKVA BAKINA TAJNA / KOM',
        quantity: '1',
        unitPrice: '6.2',
        totalAmount: '6.2'
      },
      {
        name: 'DŽEM 375G DOMAĆA NARANDŽA 80% VOĆA FOODLAND / KOM',
        quantity: '1',
        unitPrice: '5.65',
        totalAmount: '5.65'
      },
      {
        name: 'PASTA ZA ZUBE 50ML COLGATE MAX WHITE ULTRA INSTANT / KOM',
        quantity: '1',
        unitPrice: '10.45',
        totalAmount: '10.45'
      },
      {
        name: 'KAFA ESPRESSO 57G LAVAZZA QUALITA ROSSA NESPRESSO / KOM',
        quantity: '1',
        unitPrice: '8.85',
        totalAmount: '8.85'
      },
      {
        name: 'KAFA ESPRESSO 50G LUNGO BORBONE NESPRESSO / KOM',
        quantity: '2',
        unitPrice: '7.45',
        totalAmount: '14.9'
      },
      {
        name: 'KAŠIKA ZA OBUĆU / KOM',
        quantity: '1',
        unitPrice: '1.5',
        totalAmount: '1.5'
      },
      {
        name: 'PIRE 200G FRUCTAL TRIPLE TWIST / KOM',
        quantity: '1',
        unitPrice: '2.95',
        totalAmount: '2.95'
      },
      {
        name: 'PUDING U ČAŠI 125G MOJA KRAVICA ČOKOLADA / KOM',
        quantity: '4',
        unitPrice: '0.85',
        totalAmount: '3.4'
      },
      {
        name: 'KOMPOT 4X118G MANDARINA BINGO / KOM',
        quantity: '1',
        unitPrice: '3.95',
        totalAmount: '3.95'
      },
      {
        name: 'PUDING U ČAŠI 125G MOJA KRAVICA VANILIJA / KOM',
        quantity: '4',
        unitPrice: '0.85',
        totalAmount: '3.4'
      },
      {
        name: 'UBRUS PAPIRNI 3SL 1KOM PERFEX PROFESSIONAL / KOM',
        quantity: '2',
        unitPrice: '3.45',
        totalAmount: '6.9'
      },
      {
        name: 'VRAT SUHI 200G ŠMEK REZANI / KOM',
        quantity: '1',
        unitPrice: '6.95',
        totalAmount: '6.95'
      },
      {
        name: 'GRČKI TIP JOGURTA 150G DUKATOS BADEM I PISTACIJA / KOM',
        quantity: '4',
        unitPrice: '1.5',
        totalAmount: '6'
      },
      {
        name: 'GRČKI TIP JOGURTA 150G DUKATOS RIBIZ I CIMET / KOM',
        quantity: '4',
        unitPrice: '1.5',
        totalAmount: '6'
      },
      {
        name: 'MARAMICE VLAŽNE 120KOM PAPILION ORIENT / KOM',
        quantity: '2',
        unitPrice: '2.6',
        totalAmount: '5.2'
      },
      {
        name: 'PASTA ZA ZUBE 75ML LACALUT WHITE+KONAC ZA ZUBE GRATIS / KOM',
        quantity: '1',
        unitPrice: '7.95',
        totalAmount: '7.95'
      },
      {
        name: 'MARAMICE VLAŽNE 100KOM UNIVERZALNE SLEEPY GREEN / KOM',
        quantity: '1',
        unitPrice: '8.45',
        totalAmount: '8.45'
      }
    ],
    id: 'KPU4VX53-KPU4VX53-28706',
    payments: [
      {
        method: 'card',
        amount: '300.87'
      }
    ]
  })
})
