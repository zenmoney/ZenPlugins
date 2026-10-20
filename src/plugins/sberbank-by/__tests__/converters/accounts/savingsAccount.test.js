import { convertSavingsAccount } from '../../../converters'

describe('convertSavingsAccount', () => {
  it.each([
    [
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Цель один + цель два',
        created: 1575574380000,
        closed: 1585325791000,
        status: 'OPENED',
        statusDescription: 'Закрытая копилка',
        targetAmount: 200,
        targetDate: 1583625600000,
        image: null,
        imageURL: null,
        contractCurrency: '933',
        contractId: '1000007',
        balance: 100,
        phone: '375290000001',
        email: null,
        contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
        percRate: 3,
        settings: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '100000008',
            cardPan: '411111******5555',
            contractId: null,
            fixedAmount: null,
            fixedSchedule: null,
            fixedPeriod: null,
            operationsPercent: 80,
            operationsMaxAmount: 400,
            created: 1581756955000,
            lastAttemptDate: null,
            lastTransferDate: 1581756955000,
            startDate: null,
            nextDate: 1581800400000
          }, {
            id: '00000000-0000-4000-8000-000000000003',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '100000008',
            cardPan: '411111******5555',
            contractId: null,
            fixedAmount: null,
            fixedSchedule: null,
            fixedPeriod: null,
            operationsPercent: 85,
            operationsMaxAmount: 400,
            created: 1581793872000,
            lastAttemptDate: null,
            lastTransferDate: 1582526374000,
            startDate: null,
            nextDate: 1583701200000
          }
        ],
        ibannum: 'BY87BPSB3014F100000000000009'
      },
      {
        account: {
          id: '00000000-0000-4000-8000-000000000001',
          type: 'checking',
          title: 'Цель один + цель два',
          instrument: 'BYN',
          syncID: [
            'BY87BPSB3014F100000000000009'
          ],
          balance: 100,
          savings: true,
          archive: false
        }
      }
    ],
    [
      {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Цель один + цель два',
        created: 1575574380000,
        closed: 1585325791000,
        status: 'CLOSED',
        statusDescription: 'Закрытая копилка',
        targetAmount: 200,
        targetDate: 1583625600000,
        image: null,
        imageURL: null,
        contractCurrency: '933',
        contractId: '1000007',
        balance: 0,
        phone: '375290000001',
        email: null,
        contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
        percRate: 3,
        settings: [
          {
            id: '00000000-0000-4000-8000-000000000002',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '100000008',
            cardPan: '411111******5555',
            contractId: null,
            fixedAmount: null,
            fixedSchedule: null,
            fixedPeriod: null,
            operationsPercent: 80,
            operationsMaxAmount: 400,
            created: 1581756955000,
            lastAttemptDate: null,
            lastTransferDate: 1581756955000,
            startDate: null,
            nextDate: 1581800400000
          }, {
            id: '00000000-0000-4000-8000-000000000003',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '100000008',
            cardPan: '411111******5555',
            contractId: null,
            fixedAmount: null,
            fixedSchedule: null,
            fixedPeriod: null,
            operationsPercent: 85,
            operationsMaxAmount: 400,
            created: 1581793872000,
            lastAttemptDate: null,
            lastTransferDate: 1582526374000,
            startDate: null,
            nextDate: 1583701200000
          }
        ],
        ibannum: 'BY87BPSB3014F100000000000009'
      },
      {
        account: {
          id: '00000000-0000-4000-8000-000000000001',
          type: 'checking',
          title: 'Цель один + цель два',
          instrument: 'BYN',
          syncID: [
            'BY87BPSB3014F100000000000009'
          ],
          balance: 0,
          savings: true,
          archive: true
        }
      }
    ],
    [
      {
        id: '00000000-0000-4000-8000-000000000004',
        name: null,
        created: 1612550526000,
        closed: null,
        status: 'ACTIVE',
        statusDescription: 'Активная копилка',
        targetAmount: 3000,
        targetDate: 1640898000000,
        image: null,
        imageURL: null,
        contractCurrency: '933',
        contractId: '1000028',
        balance: 100,
        phone: null,
        email: null,
        contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
        percRate: 3,
        settings: [],
        ibannum: 'BY15BPSB3014F100000000000044'
      },
      {
        account: {
          id: '00000000-0000-4000-8000-000000000004',
          type: 'checking',
          title: 'Активная копилка',
          instrument: 'BYN',
          syncID: ['BY15BPSB3014F100000000000044'],
          balance: 100,
          savings: true,
          archive: false
        }
      }
    ]
  ])('converts savings account', (apiAccount, account) => {
    expect(convertSavingsAccount(apiAccount)).toEqual(account)
  })
})
