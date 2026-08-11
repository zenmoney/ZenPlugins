import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'UAH'
  }
  it.each([
    [
      {
        id: 'fa50019ca8687e50000bb9c30335c1b15d1dcaad',
        rrn: '020610907450',
        operationTime: '2020-07-24T11:48:28.000+0000',
        transAmount: { currency: 'UAH', value: '200.00' },
        totalAmount: { currency: 'UAH', value: '200.00' },
        authCode: '576233',
        effectiveFrom: '2020-07-24',
        processedOn: '2020-07-24',
        location:
        {
          city: 'CHERNIGIV',
          country: 'UKR',
          merchant: 'BRANCH 10024-072'
        },
        description: 'Поповнення карткового рахунку через АТМ Note Acceptance BRANCH 10024-072 CHERNIGIV UKRAINE',
        isDisputeAvailable: false,
        contractId: '29f96377b355e7bb3e4609f8f4e862d4a361f8b0',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        fees: {},
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-07-24T11:48:28.000+0000'),
        movements: [
          {
            id: 'fa50019ca8687e50000bb9c30335c1b15d1dcaad',
            account: { id: 'account' },
            invoice: null,
            sum: 200.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -200.00,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        id: 'f9430891961e58535eeeef8df377c1c831345940',
        rrn: '018210963160',
        operationTime: '2020-06-30T13:27:02.000+0000',
        transAmount: { currency: 'UAH', value: '-200.00' },
        totalAmount: { currency: 'UAH', value: '-200.00' },
        authCode: '576203',
        effectiveFrom: '2020-06-30',
        processedOn: '2020-06-30',
        location:
        {
          city: 'CHERNIGIV',
          country: 'UKR',
          merchant: 'BRANCH 10024-072'
        },
        description: 'ATM BRANCH 10024-072 CHERNIGIV UKRAINE',
        merchantCategory: 'cash',
        isDisputeAvailable: false,
        contractId: '29f96377b355e7bb3e4609f8f4e862d4a361f8b0',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isOnline: false,
        isDataComplete: true,
        isRecurrent: false,
        allowRepeat: false,
        withInvoice: false,
        isInstalmentLinked: false,
        conversionInstalmentEnabled: false,
        status: 'success',
        allowReversal: false,
        fees: {},
        allowRest: false,
        transAmountDetails: []
      },
      {
        hold: false,
        date: new Date('2020-06-30T13:27:02.000+0000'),
        movements: [
          {
            id: 'f9430891961e58535eeeef8df377c1c831345940',
            account: { id: 'account' },
            invoice: null,
            sum: -200.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 200.00,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        id: '7895ad739e28352bb7650002dfda4a2aba1367cd',
        rrn: '134061156866',
        operationTime: '2021-12-06T11:30:16.000+0000',
        channel: 'MB',
        responseCode: 'successful_operation',
        operationType: 'payment',
        transAmount: {
          currency: 'UAH',
          value: '-500.00'
        },
        isDisputeAvailable: false,
        contractId: 'b14cd5758badcc93321fde89868db347ab008f36',
        isAuth: false,
        isReversal: false,
        isReversed: false,
        isDataComplete: false,
        withInvoice: false,
        isRecurrent: false,
        allowRepeat: true,
        isOnline: true,
        status: 'success',
        allowReversal: false,
        service:
          {
            id: 'GENERATE_2COMPONENT_CASH_CODE',
            name: 'Cash withdrawal without a card',
            allowTemplate: false,
            allowPeriodic: false,
            allowThreshold: false,
            allowInternational: false,
            allowBonusPayment: false,
            active: true,
            shortFields: { CUSTOM_IDT: '0501234567' },
            customIdtEditMask: 'PHONE10'
          },
        allowRest: true,
        fees: {}
      },
      {
        comment: null,
        date: new Date('2021-12-06T11:30:16.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '7895ad739e28352bb7650002dfda4a2aba1367cd',
            invoice: null,
            sum: -500
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'UAH',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 500,
            fee: 0
          }
        ]
      }
    ]
  ])('converts cash transfers', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
