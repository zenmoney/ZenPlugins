import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  const account = {
    id: 'account',
    instrument: 'KZT',
    type: 'ccard'
  }
  const accountsByNumber = {
    KZ80948KZT14406005UL: {
      id: '06005UL',
      instrument: 'KZT',
      type: 'checking'
    },
    KZ88948KZT00607005VS: {
      id: '07005VS',
      instrument: 'KZT'
    }
  }

  it.each([
    [
      [
        {
          id: 'MOVEMENT_4049844307',
          type: 'MOVEMENT',
          executionDate: 1589392800000,
          status: 'DONE',
          transactionDate: 1589432980000,
          dateCreated: 1589432980000,
          amount: 20000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ329480004A02216160',
          totalAmount: 20000,
          totalAmountCurrency: 'KZT',
          purpose: 'Perevod s karty na kartu Credit from KZ049480004A00046871 Николаев Николай Николаевич (INT)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1589432980000),
          movements: [
            {
              id: 'MOVEMENT_4049844307',
              account: { id: 'account' },
              invoice: null,
              sum: 20000,
              fee: 0
            },
            {
              id: null,
              account: {
                company: null,
                instrument: 'KZT',
                syncIds: ['KZ049480004A00046871'],
                type: 'ccard'
              },
              invoice: null,
              sum: -20000,
              fee: 0
            }
          ],
          merchant: {
            title: 'Николаев Николай Николаевич',
            city: null,
            country: null,
            location: null,
            mcc: null
          },
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_7436380664',
          type: 'MOVEMENT',
          executionDate: 1610725320000,
          status: 'DONE',
          transactionDate: 1610725320000,
          dateCreated: 1610725320000,
          amount: 12000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          totalAmount: 12000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР. СО СЧЕТА KZ66948KZT144070031W НА СЧЕТ KZ80948KZT14406005UL <<12000.00 KZT>> (SB зачисл)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1610725320000),
          movements:
            [
              {
                id: 'MOVEMENT_7436380664',
                account: { id: 'account' },
                invoice: null,
                sum: 12000,
                fee: 0
              },
              {
                id: null,
                account: {
                  company: null,
                  instrument: 'KZT',
                  syncIds: ['KZ66948KZT144070031W'],
                  type: 'ccard'
                },
                invoice: null,
                sum: -12000,
                fee: 0
              }
            ],
          merchant: null,
          comment: 'ПЕР. СО СЧЕТА KZ66948KZT144070031W НА СЧЕТ KZ80948KZT14406005UL <<12000.00 KZT>> (SB зачисл)'
        }
      ]
    ]
  ])('converts outer income transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account, accountsByNumber)).toEqual(transaction)
  })

  const kztAccount1 = {
    id: '06005UL',
    instrument: 'KZT',
    type: 'ccard',
    syncID: [
      'KZ80948KZT14406005UL'
    ]
  }
  const kztAccountsByNumber1 = {
    KZ80948KZT14406005UL: {
      id: '06005UL',
      instrument: 'KZT',
      syncID: [
        'KZ80948KZT14406005UL'
      ]
    }
  }
  it.each([
    [
      [
        {
          id: 'ORDER_1949252559',
          type: 'ORDER',
          executionDate: 0,
          personId: 6033288,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'ТурбоДепозит 24 мес.',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '324',
          dateSigned: 1610725343250,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1610725343250,
          dateCreated: 1610725343250,
          orderNumber: 41888036,
          orderType: 'TSLF',
          amount: 12000,
          amountCurrency: 'KZT',
          accountSource: 'KZ66948KZT144070031W',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 12000,
          totalAmountCurrency: 'KZT',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: 'KZ80948KZT14406005UL',
          recipientResident: false,
          recipientIIN: '',
          recipientAddress: '',
          recipientCountry: '',
          recipientBank: 'EURIKZKA - Евразийский Банк',
          correspondentBank: '',
          purpose: '',
          repeatsEveryWeek: false,
          repeatsEveryMonth: false,
          dateStart: 0,
          dateScheduled: 1610725343250,
          dateTill: 0,
          recipientCountryCode: '',
          recipientCountryName: null,
          recipientBankBIC: 'EURIKZKA',
          correspondentBankBIC: '',
          subAccountCurrency: '',
          senderSubAccountCurrency: '',
          corporate: false,
          receiverBIN: '',
          mcc: {
            id: null,
            title: null,
            smartBonus: null,
            type: null
          },
          sourceBin: '',
          terminalId: '',
          transCity: '',
          transCountry: '',
          reasonDetails: ''
        }
      ],
      [
        {
          hold: false,
          date: new Date(1610725343250),
          movements:
            [
              {
                id: 'ORDER_1949252559',
                account: { id: '06005UL' },
                invoice: null,
                sum: 12000,
                fee: 0
              },
              {
                id: null,
                account: {
                  company: null,
                  instrument: 'KZT',
                  syncIds: ['KZ66948KZT144070031W'],
                  type: 'ccard'
                },
                invoice: null,
                sum: -12000,
                fee: 0
              }
            ],
          merchant: null,
          comment: null
        }
      ]
    ]
  ])('converts outer income transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, kztAccount1, kztAccountsByNumber1)).toEqual(transaction)
  })
})
