import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'KZT'
  }
  it.each([
    [
      [
        {
          id: 'MOVEMENT_6201226754',
          type: 'MOVEMENT',
          executionDate: 1585245600000,
          status: 'DONE',
          transactionDate: 1585290867000,
          dateCreated: 1585290867000,
          amount: -15000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -15000,
          totalAmountCurrency: 'KZT',
          purpose: 'ATM KAZ KOSTANAY MAGAZIN 29'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1585290867000),
          movements: [
            {
              id: 'MOVEMENT_6201226754',
              account: { id: 'account' },
              invoice: null,
              sum: -15000,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'cash',
                instrument: 'KZT',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: 15000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'ATM KAZ KOSTANAY MAGAZIN 29'
        }
      ]
    ]
  ])('converts cash transfer outcome', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
})

describe('convertTransaction USD', () => {
  const account = {
    id: 'account',
    instrument: 'USD'
  }
  it.each([
    [
      [
        {
          id: 'MOVEMENT_6201226754',
          type: 'MOVEMENT',
          executionDate: 1585245600000,
          status: 'DONE',
          transactionDate: 1585290867000,
          dateCreated: 1585290867000,
          amount: -2451,
          amountCurrency: 'USD',
          fee: 0,
          feeCurrency: 'USD',
          accountSource: 'KZ799480008A02824084',
          totalAmount: -2451,
          totalAmountCurrency: 'USD',
          purpose: 'Cash KAZ ALMATY POS06916 RKO609 2',
          personId: 0,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: '',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '',
          dateSigned: null,
          secoId: '',
          transferMethodId: '',
          mcc: {
            id: 6010,
            title: 'Финансовые учреждения – снятие наличности вручную',
            smartBonus: false,
            type: {
              id: 1000075,
              title: 'Переводы/Cнятие',
              category: {
                id: 'FINC',
                title: 'Фин. операции',
                visible: true
              },
              code: ''
            }
          },
          sourceBin: '0001',
          terminalId: 'POS06916',
          transCity: 'ALMATY',
          transCountry: 'KAZ',
          reasonDetails: ''
        }
      ],
      [
        {
          hold: false,
          date: new Date(1585290867000),
          movements: [
            {
              id: 'MOVEMENT_6201226754',
              account: { id: 'account' },
              invoice: null,
              sum: -2451,
              fee: 0
            },
            {
              id: null,
              account: {
                type: 'cash',
                instrument: 'USD',
                company: null,
                syncIds: null
              },
              invoice: null,
              sum: 2451,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Cash KAZ ALMATY POS06916 RKO609 2'
        }
      ]
    ]
  ])('converts cash transfer outcome', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account)).toEqual(transaction)
  })
})
