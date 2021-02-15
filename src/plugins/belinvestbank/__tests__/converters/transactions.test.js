import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  const account = {
    id: '30848200',
    type: 'card',
    title: 'Безымянная*1111',
    instrument: 'BYN',
    balance: 999.9,
    syncID: ['1111']
  }

  const tt = [
    {
      name: 'failed transaction',
      transaction: {
        status: 'ОТМЕНЕНО'
      },
      expectedTransaction: null
    },
    {
      name: 'Infinity or NaN: NaN',
      transaction: {
        date: '2020-11-25 09:31:44',
        dateResp: '2020-11-26 08:00:38',
        type: 'Оплата',
        cardAcceptor: 'COMPAY AIS IDO>MINSK BY',
        transactionAmt: '53,94',
        transactionAmtCurrency: 'BYN',
        accountAmt: '',
        accountAmtCurrency: 'BYN',
        feeAmt: 0,
        feeAmtCurrency: 'BYN',
        reflectedAccountAmt: '53,94',
        reflectedAccountAmtCurrency: 'BYN',
        reflectedFee: 0,
        reflectedFeeCurrency: 'BYN',
        balanceAmt: '',
        balanceAmtCurrency: 'BYN',
        status: 'ПРОВЕДЕНО',
        sign: '-',
        mcc: '6012',
        operationColor: '_red',
        cardNum: '**** 1343',
        trnType: 'Безналичный',
        appId: '798319',
        historyKey: 3
      },
      expectedTransaction: null
    },
    {
      name: 'cash add',
      transaction: {
        cardNum: '**** **** **** 1111',
        date: '2019-01-01 10:12:13',
        type: 'Выдача наличных',
        accountAmt: '10,13',
        status: 'ПРОВЕДЕНО',
        cardAcceptor: 'Выдача наличных в ATM'
      },
      expectedTransaction: {
        hold: false,
        date: new Date('2019-01-01T10:12:13+03:00'),
        movements: [
          {
            id: null,
            invoice: null,
            account: { id: '30848200' },
            sum: -10.13,
            fee: 0
          },
          {
            account: {
              company: null,
              instrument: 'BYN',
              syncIds: null,
              type: 'cash'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 10.13
          }
        ],
        merchant: {
          fullTitle: 'Выдача наличных в ATM',
          location: null,
          mcc: null
        },
        comment: null
      }
    },
    {
      name: 'bank fees',
      transaction: {
        date: '2019-01-01 10:12:13',
        dateResp: '2019-01-01 10:12:13',
        type: 'Оплата',
        cardAcceptor: 'SMS OPOVESCHENIE>MINSK BY',
        transactionAmt: '2,8',
        transactionAmtCurrency: 'BYN',
        accountAmt: '2,8',
        accountAmtCurrency: 'BYN',
        feeAmt: 0,
        feeAmtCurrency: 'BYN',
        reflectedAccountAmt: '2,8',
        reflectedAccountAmtCurrency: 'BYN',
        reflectedFee: 0,
        reflectedFeeCurrency: 'BYN',
        balanceAmt: '167,57',
        balanceAmtCurrency: 'BYN',
        status: 'ПРОВЕДЕНО',
        sign: '-',
        operationColor: '_red',
        cardNum: '**** 1111',
        historyKey: 3
      },
      expectedTransaction: {
        hold: false,
        date: new Date('2019-01-01T10:12:13+03:00'),
        movements: [
          {
            id: null,
            invoice: null,
            account: { id: '30848200' },
            sum: -2.8,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'SMS OPOVESCHENIE'
      }
    },
    {
      name: 'hold',
      transaction: {
        date: '2019-07-19 11:35:17',
        dateResp: '',
        type: 'Оплата',
        cardAcceptor: 'UBER>Schipol                          NL',
        transactionAmt: '0.06',
        transactionAmtCurrency: 'BYN',
        accountAmt: '0.06',
        accountAmtCurrency: 'BYN',
        feeAmt: 0,
        feeAmtCurrency: 'BYN',
        reflectedAccountAmt: '',
        reflectedAccountAmtCurrency: 'BYN',
        reflectedFee: 0,
        reflectedFeeCurrency: 'BYN',
        balanceAmt: '18,3',
        balanceAmtCurrency: 'BYN',
        status: 'ЗАБЛОКИРОВАНО',
        sign: '-',
        operationColor: '_red',
        cardNum: '**** 1111',
        historyKey: 5
      },
      expectedTransaction: {
        hold: true,
        date: new Date('2019-07-19T11:35:17+03:00'),
        movements: [
          {
            id: null,
            invoice: null,
            account: { id: '30848200' },
            sum: -0.06,
            fee: 0
          }
        ],
        merchant: {
          country: 'NL',
          city: 'Schipol',
          title: 'UBER',
          mcc: null,
          location: null
        },
        comment: null
      }
    },
    {
      name: 'Transfer',
      transaction: {
        date: '2020-10-16 15:46:10',
        dateResp: '',
        type: 'Перевод с карты на карту',
        cardAcceptor: 'VIRTUAL FOR INTERNET BANKIN>MINSK BY',
        transactionAmt: '50',
        transactionAmtCurrency: 'EUR',
        accountAmt: '50',
        accountAmtCurrency: 'EUR',
        feeAmt: 0,
        feeAmtCurrency: 'EUR',
        reflectedAccountAmt: '',
        reflectedAccountAmtCurrency: 'EUR',
        reflectedFee: 0,
        reflectedFeeCurrency: 'EUR',
        balanceAmt: '334,18',
        balanceAmtCurrency: 'EUR',
        status: 'ЗАБЛОКИРОВАНО',
        sign: '+',
        mcc: '6012',
        operationColor: '_green',
        cardNum: '**** 1111',
        trnType: 'Наличный',
        appId: '664953',
        historyKey: 0
      },
      expectedTransaction: {
        date: new Date('Fri Oct 16 2020 14:46:10 GMT+0200 (CEST)'),
        movements:
          [
            {
              id: null,
              account: { id: '30848200' },
              invoice: null,
              sum: 50,
              fee: 0
            },
            {
              account: {
                company: null,
                instrument: 'EUR',
                syncIds: null,
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: -50
            }
          ],
        merchant: null,
        comment: null,
        hold: true
      }
    },
    {
      name: 'P2P_Transfer',
      transaction: {
        date: '2020-11-26 13:45:42',
        dateResp: '2020-11-27 09:22:32',
        type: 'Другое',
        cardAcceptor: 'P2P_MTBANK>MINSK BY',
        transactionAmt: '200',
        transactionAmtCurrency: 'BYN',
        accountAmt: '79,23',
        accountAmtCurrency: 'USD',
        feeAmt: 1,
        feeAmtCurrency: 'USD',
        reflectedAccountAmt: '78,13',
        reflectedAccountAmtCurrency: 'USD',
        reflectedFee: 1.17,
        reflectedFeeCurrency: 'USD',
        balanceAmt: '2589,86',
        balanceAmtCurrency: 'USD',
        status: 'ПРОВЕДЕНО',
        sign: '-',
        mcc: '6012',
        operationColor: '_red',
        cardNum: '**** 1111',
        trnType: 'Безналичный',
        appId: '824342',
        historyKey: 5
      },
      expectedTransaction: {
        date: new Date('2020-11-26T10:45:42.000Z'),
        movements:
          [
            {
              id: null,
              account: { id: '30848200' },
              invoice: null,
              sum: -79.23,
              fee: 0
            },
            {
              account: {
                company: null,
                instrument: 'USD',
                syncIds: null,
                type: 'ccard'
              },
              fee: 0,
              id: null,
              invoice: null,
              sum: 79.23
            }
          ],
        merchant: null,
        comment: null,
        hold: false
      }
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      const transaction = convertTransaction(tc.transaction, account)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  }

  it.each([
    [
      {
        date: '2021-02-05 22:00:25',
        dateResp: '2021-02-06 12:18:20',
        type: 'ВОЗВРАТ',
        cardAcceptor: 'SHOP "WWW.BELAVIA.BY" BPSB>MINSK BY',
        transactionAmt: '',
        transactionAmtCurrency: '',
        accountAmt: '288,2',
        accountAmtCurrency: 'USD',
        feeAmt: 0,
        feeAmtCurrency: '',
        reflectedAccountAmt: '288,2',
        reflectedAccountAmtCurrency: 'USD',
        reflectedFeeCurrency: '',
        reflectedFeeIssuer: 0,
        reflectedFeeIssuerCurrency: '',
        reflectedFeeAcquirer: 0,
        reflectedFeeAcquirerCurrency: '',
        balanceAmt: '',
        balanceAmtCurrency: '',
        status: 'ПРОВЕДЕНО',
        sign: '+',
        mcc: '4511',
        operationColor: '_green',
        cardNum: '**** 8824',
        trnType: 'Наличный',
        appId: '—',
        reflectedFee: 0,
        historyKey: 0
      },
      { id: 'account1', instrument: 'USD' },
      {
        date: new Date('2021-02-05T19:00:25.000Z'),
        movements:
          [
            {
              id: null,
              account: { id: 'account1' },
              invoice: null,
              sum: 288.2,
              fee: 0
            }
          ],
        merchant: {
          country: 'BY',
          city: 'MINSK',
          title: 'SHOP "WWW.BELAVIA.BY" BPSB',
          mcc: null,
          location: null
        },
        comment: null,
        hold: false
      }
    ]
  ])('refund from another card', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
