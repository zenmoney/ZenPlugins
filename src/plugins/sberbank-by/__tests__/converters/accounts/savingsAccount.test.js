import { convertSavingsAccount } from '../../../converters'

describe('convertSavingsAccount', () => {
  it.each([
    [
      {
        id: '470c803e-4fa0-49af-9fd2-b9deb43677f4',
        name: 'Автошкола + машина',
        created: 1575574380000,
        closed: 1585325791000,
        status: 'OPENED',
        statusDescription: 'Закрытая копилка',
        targetAmount: 200,
        targetDate: 1583625600000,
        image: null,
        imageURL: null,
        contractCurrency: '933',
        contractId: '7824229',
        balance: 100,
        phone: '375298106295',
        email: null,
        contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
        percRate: 3,
        settings: [
          {
            id: 'a6e588d4-e9f9-40a4-a7ad-b91a168ed9aa',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '764704950',
            cardPan: '449655******0276',
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
            id: '3e674b43-1c3d-4949-be95-207251c85a7d',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '764704950',
            cardPan: '449655******0276',
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
        ibannum: 'BY95BPSB3014F000000007824229'
      },
      {
        account: {
          id: '470c803e-4fa0-49af-9fd2-b9deb43677f4',
          type: 'checking',
          title: 'Автошкола + машина',
          instrument: 'BYN',
          syncID: [
            'BY95BPSB3014F000000007824229'
          ],
          balance: 100,
          savings: true,
          archive: false
        }
      }
    ],
    [
      {
        id: '470c803e-4fa0-49af-9fd2-b9deb43677f4',
        name: 'Автошкола + машина',
        created: 1575574380000,
        closed: 1585325791000,
        status: 'CLOSED',
        statusDescription: 'Закрытая копилка',
        targetAmount: 200,
        targetDate: 1583625600000,
        image: null,
        imageURL: null,
        contractCurrency: '933',
        contractId: '7824229',
        balance: 0,
        phone: '375298106295',
        email: null,
        contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
        percRate: 3,
        settings: [
          {
            id: 'a6e588d4-e9f9-40a4-a7ad-b91a168ed9aa',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '764704950',
            cardPan: '449655******0276',
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
            id: '3e674b43-1c3d-4949-be95-207251c85a7d',
            status: 'DISABLE',
            refillType: 'INCOME',
            cardId: '764704950',
            cardPan: '449655******0276',
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
        ibannum: 'BY95BPSB3014F000000007824229'
      },
      {
        account: {
          id: '470c803e-4fa0-49af-9fd2-b9deb43677f4',
          type: 'checking',
          title: 'Автошкола + машина',
          instrument: 'BYN',
          syncID: [
            'BY95BPSB3014F000000007824229'
          ],
          balance: 0,
          savings: true,
          archive: true
        }
      }
    ],
    [
      {
        id: '2d9f51bb-f6cb-4f90-be39-c1ba0291013f',
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
        contractId: '8589770',
        balance: 100,
        phone: null,
        email: null,
        contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
        percRate: 3,
        settings: [],
        ibannum: 'BY24BPSB3014F000000008589770'
      },
      {
        account: {
          id: '2d9f51bb-f6cb-4f90-be39-c1ba0291013f',
          type: 'checking',
          title: 'Активная копилка',
          instrument: 'BYN',
          syncID: ['BY24BPSB3014F000000008589770'],
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
