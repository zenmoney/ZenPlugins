import { cloneDeep, set } from 'lodash'
import fixture1 from './convertReceipt-01.json'
import { convertReceipt } from '../converters'

test('converts source case 01', () => {
  expect(convertReceipt(fixture1)).toEqual({
    completeness: 'full',
    issuedAt: {
      date: '2023-03-11',
      time: '17:56:07.000',
      utcOffsetMinutes: 0
    },
    currency: 'EUR',
    totalAmount: '123.09',
    merchant: {
      name: 'Okov d.o.o.',
      address: 'MNE, Podgorica, Josipa Sladea 6',
      identifiers: [
        {
          value: '02226782',
          countryCode: 'ME'
        }
      ]
    },
    items: [
      {
        name: 'Posuda za odl. hrane Royal 2.2l sa skalom za mjer.',
        quantity: '4',
        unitPrice: '1.99',
        totalAmount: '7.96'
      },
      {
        name: 'Drvena oklagija 52cm GP&amp;me',
        quantity: '1',
        unitPrice: '8.7',
        totalAmount: '8.7'
      },
      {
        name: 'Ocjeđivač za posuđe 45.5x35x13.5cm jednodjelni siv',
        quantity: '1',
        unitPrice: '17.99',
        totalAmount: '17.99'
      },
      {
        name: 'Poslužavnik Essential 308x430x35mm bijeli Curver',
        quantity: '2',
        unitPrice: '4.19',
        totalAmount: '8.38'
      },
      {
        name: 'Kesa 600+2x100x700',
        quantity: '1',
        unitPrice: '0.45',
        totalAmount: '0.45'
      },
      {
        name: 'Daska za rezanje fi 25x1.5cm drvena Kesper',
        quantity: '1',
        unitPrice: '4.59',
        totalAmount: '4.59'
      },
      {
        name: 'Posuda za užinu Smart Eco 1L sa poklop.i priborom',
        quantity: '2',
        unitPrice: '3.99',
        totalAmount: '7.98'
      },
      {
        name: 'Čaša za koktel Tumbler 470ml Arcoroc',
        quantity: '2',
        unitPrice: '1.89',
        totalAmount: '3.78'
      },
      {
        name: 'Cjediljka bijela Curver',
        quantity: '1',
        unitPrice: '1.49',
        totalAmount: '1.49'
      },
      {
        name: 'Garn. čaša Sensa 500ml 6/1  Schott Zwiesel',
        quantity: '1',
        unitPrice: '24.99',
        totalAmount: '24.99'
      },
      {
        name: "Renda 4-strana 'Daily' Ghidini",
        quantity: '1',
        unitPrice: '10.99',
        totalAmount: '10.99'
      },
      {
        name: 'Termos boca 400ml sa cjediljkom sort Alpina',
        quantity: '1',
        unitPrice: '9.99',
        totalAmount: '9.99'
      },
      {
        name: 'Doza za ulje Royal 800ml sa skalom za mjer. sort F',
        quantity: '1',
        unitPrice: '1.49',
        totalAmount: '1.49'
      },
      {
        name: 'P1323 Prod. kabal 3-djelni 3x1.0mm/3m sa prekidace',
        quantity: '1',
        unitPrice: '6.49',
        totalAmount: '6.49'
      },
      {
        name: 'Vezice za kablove BB 2.5x100 bijele 100/1 Index',
        quantity: '1',
        unitPrice: '0.72',
        totalAmount: '0.72'
      },
      {
        name: 'Vezice za kablove BB 2.5x140 bijele 100/1 Index',
        quantity: '1',
        unitPrice: '1.15',
        totalAmount: '1.15'
      },
      {
        name: 'Doza za ulje LH8713 170ml Utilissimi',
        quantity: '5',
        unitPrice: '1.19',
        totalAmount: '5.95'
      }
    ],
    operation: 'unknown',
    payments: [
      {
        method: 'card',
        amount: '123.09'
      }
    ]
  })
})

test('malformed source remains a conversion failure', () => {
  expect(() => convertReceipt(null)).toThrow()
})

// Retained synthetic arithmetic regression; not evidence of a captured provider response.
test('[model] multiple payments are summed exactly and absent payments stay omitted', () => {
  const data: unknown = cloneDeep(fixture1)
  assert(data != null && typeof data === 'object', 'Expected fixture object')
  set(data, 'paymentMethod', [{ typeCode: 'CARD', amount: '0.1' }, { typeCode: 'CARD', amount: '0.2' }])
  expect(convertReceipt(data).payments).toEqual([{ method: 'card', amount: '0.3' }])
  set(data, 'paymentMethod', [])
  expect(convertReceipt(data)).not.toHaveProperty('payments')
})

// Retained synthetic optional-value regression; not provider-format evidence.
test('[model] unknown unit prices stay omitted and explicit zero is preserved', () => {
  const data: unknown = cloneDeep(fixture1)
  assert(data != null && typeof data === 'object', 'Expected fixture object')
  for (const missing of [undefined, null]) {
    set(data, 'items[0].unitPriceAfterVat', missing)
    expect(convertReceipt(data).items[0]).not.toHaveProperty('unitPrice')
  }
  set(data, 'items[0].unitPriceAfterVat', 0)
  expect(convertReceipt(data).items[0].unitPrice).toBe('0')
})
