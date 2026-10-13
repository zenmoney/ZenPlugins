import fixture1 from './convertReceipt-01.html'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-04-09',
      time: '16:47:00'
    },
    currency: 'KZT',
    totalAmount: '2420',
    merchant: {
      name: 'ИП ЦОЙ ОЛЕСЯ ОЛЕГОВНА',
      address: 'Республика Казахстан, г. Шымкент, р-н Аль-Фарабийский, пр. Тауке Хан, д. 11а, оф.',
      identifiers: [
        {
          value: '810816402187',
          countryCode: 'KZ'
        }
      ]
    },
    items: [
      {
        name: 'Сырники запеченные (6шт/300гр)',
        quantity: '1',
        unitPrice: '1250',
        totalAmount: '1250'
      },
      {
        name: 'Пирожки жар. в ассортименте (70 гр)',
        quantity: '2',
        unitPrice: '130',
        totalAmount: '260'
      },
      {
        name: 'Шанежка с тыквой и мясом (50 гр)',
        quantity: '1',
        unitPrice: '120',
        totalAmount: '120'
      },
      {
        name: 'Самса Уфимская с курицей (80 гр)',
        quantity: '1',
        unitPrice: '300',
        totalAmount: '300'
      },
      {
        name: 'Самса с тыквой  (75 гр)',
        quantity: '1',
        unitPrice: '175',
        totalAmount: '175'
      },
      {
        name: 'Самса с тыквой и курицей (100 гр)',
        quantity: '1',
        unitPrice: '300',
        totalAmount: '300'
      },
      {
        name: 'Пакет "Ладушки" (290х460х16) мал.',
        quantity: '1',
        unitPrice: '15',
        totalAmount: '15'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '2420'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})

// Retained synthetic locale regression; not evidence of a captured Kazakh page.
test('[model] a Kazakh month does not depend on the global locale', () => {
  const kazakh = fixture1.replace('<html lang="ru">', '<html lang="kk">').replace('9 апр 2023', '9 сәу 2023')
  expect(convertReceipt(kazakh).issuedAt).toEqual({ date: '2023-04-09', time: '16:47:00' })
})
