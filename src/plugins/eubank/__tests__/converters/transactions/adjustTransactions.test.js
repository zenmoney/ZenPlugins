import { convertTransactions } from '../../../converters'

describe('adjustTransactions', () => {
  const account1 = {
    id: '06005UL',
    type: 'deposit',
    title: '*05UL',
    instrument: 'KZT',
    syncID: ['KZ80948KZT14406005UL'],
    balance: 5172260.1,
    startBalance: 1000,
    startDate: new Date('2020-03-17T00:00:00+0600'),
    percent: 8.6,
    capitalization: true,
    endDateOffsetInterval: 'year',
    endDateOffset: 2,
    payoffInterval: 'month',
    payoffStep: 1
  }
  const accountsByNumber1 = {
    KZ80948KZT14406005UL: {
      id: '06005UL',
      instrument: 'KZT',
      syncID: [
        'KZ80948KZT14406005UL'
      ]
    },
    KZ369480007A03352296: {
      id: '3352296-KZT',
      instrument: 'KZT',
      syncID: [
        'KZ369480007A03352296',
        '530496******4853'
      ]
    }
  }

  it.each([
    [
      [
        {
          id: 'MOVEMENT_1107198783',
          type: 'MOVEMENT',
          executionDate: 1620906960000,
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
          status: 'DONE',
          transactionDate: 1620906960000,
          dateCreated: 1620906960000,
          amount: -2500,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          totalAmount: -2500,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР.СО СЧЕТА KZ80948KZT14406005UL НА КАРТ.СЧЕТ KZ369480007A03352296 (SB списание в W4)',
          mcc: { id: null, title: null, smartBonus: null, type: null },
          sourceBin: '',
          terminalId: '',
          transCity: '',
          transCountry: '',
          reasonDetails: ''
        },
        {
          id: 'MOVEMENT_7826385122',
          type: 'MOVEMENT',
          executionDate: 1620906960000,
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
          status: 'DONE',
          transactionDate: 1620906960000,
          dateCreated: 1620906960000,
          amount: -2500,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          totalAmount: -2500,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР.СО СЧЕТА KZ80948KZT14406005UL НА КАРТ.СЧЕТ KZ369480007A03352296 (SB списание в W4)',
          mcc: { id: null, title: null, smartBonus: null, type: null },
          sourceBin: '',
          terminalId: '',
          transCity: '',
          transCountry: '',
          reasonDetails: ''
        }
      ],
      [
        {
          movements:
            [
              {
                id: 'MOVEMENT_1107198783',
                account: { id: '06005UL' },
                invoice: null,
                sum: -2500,
                fee: 0
              }
            ],
          date: new Date(1620906960000),
          hold: false,
          merchant: null,
          comment: 'ПЕР.СО СЧЕТА KZ80948KZT14406005UL НА КАРТ.СЧЕТ KZ369480007A03352296 (SB списание в W4)',
          groupKeys: [
            null,
            'KZ80948KZT14406005UL_KZ369480007A03352296_16209_2500',
            '16209069_2500'
          ]
        }
      ]
    ]
  ])('converts duplicate transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account1, accountsByNumber1)).toEqual(transaction)
  })

  const account2 = {
    id: '3352296-KZT',
    type: 'ccard',
    title: '*4853-KZT',
    instrument: 'KZT',
    syncID: ['KZ369480007A03352296', '530496******4853'],
    balance: 3942.09
  }
  const accountsByNumber2 = {
    KZ80948KZT14406005UL: {
      id: '06005UL',
      instrument: 'KZT',
      syncID: [
        'KZ80948KZT14406005UL'
      ]
    },
    KZ369480007A03352296: {
      id: '3352296-KZT',
      instrument: 'KZT',
      syncID: [
        'KZ369480007A03352296',
        '530496******4853'
      ]
    }
  }

  it.each([
    [
      [
        {
          id: 'ORDER_5068631965',
          type: 'ORDER',
          executionDate: 0,
          personId: 6033288,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'Own 2020',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '324',
          dateSigned: 1620906954183,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1620906954183,
          dateCreated: 1620906954167,
          orderNumber: 47528348,
          orderType: 'TSLF',
          amount: 2500,
          amountCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 2500,
          totalAmountCurrency: 'KZT',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: 'KZ369480007A03352296',
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
          dateScheduled: 1620906954167,
          dateTill: 0,
          recipientCountryCode: '',
          recipientCountryName: null,
          recipientBankBIC: 'EURIKZKA',
          correspondentBankBIC: '',
          subAccountCurrency: '',
          senderSubAccountCurrency: '',
          corporate: false,
          receiverBIN: '',
          mcc:
            {
              id: 6012,
              title: 'Финансовые учреждения',
              smartBonus: false,
              type:
                {
                  id: 1000075,
                  title: 'Переводы/Cнятие',
                  category: { id: 'FINC', title: 'Фин. операции', visible: true },
                  code: ''
                }
            },
          sourceBin: '',
          terminalId: 'SB000001',
          transCity: 'LOCAL',
          transCountry: 'KAZ',
          reasonDetails: 'From RS; Николаев Николай Николаевич; KZ80948KZT14406005UL'
        },
        {
          id: 'ORDER_4793151399',
          type: 'ORDER',
          executionDate: 0,
          personId: 6033288,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'Own 2020',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '324',
          dateSigned: 1620906954183,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1620906954183,
          dateCreated: 1620906954167,
          orderNumber: 47528348,
          orderType: 'TSLF',
          amount: 2500,
          amountCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 2500,
          totalAmountCurrency: 'KZT',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: 'KZ369480007A03352296',
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
          dateScheduled: 1620906954167,
          dateTill: 0,
          recipientCountryCode: '',
          recipientCountryName: null,
          recipientBankBIC: 'EURIKZKA',
          correspondentBankBIC: '',
          subAccountCurrency: '',
          senderSubAccountCurrency: '',
          corporate: false,
          receiverBIN: '',
          mcc:
            {
              id: 6012,
              title: 'Финансовые учреждения',
              smartBonus: false,
              type:
                {
                  id: 1000075,
                  title: 'Переводы/Cнятие',
                  category: { id: 'FINC', title: 'Фин. операции', visible: true },
                  code: ''
                }
            },
          sourceBin: '',
          terminalId: 'SB000001',
          transCity: 'LOCAL',
          transCountry: 'KAZ',
          reasonDetails: 'From RS; Николаев Николай Николаевич; KZ80948KZT14406005UL'
        }
      ],
      [
        {
          movements:
            [
              {
                id: 'ORDER_5068631965',
                account: { id: '3352296-KZT' },
                invoice: null,
                sum: 2500,
                fee: 0
              }
            ],
          date: new Date(1620906954167),
          hold: false,
          merchant: null,
          comment: null,
          groupKeys: [
            '47528348',
            'KZ369480007A03352296_KZ80948KZT14406005UL_16209_2500',
            '16209069_2500'
          ]
        }
      ]
    ]
  ])('converts duplicate transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account2, accountsByNumber2)).toEqual(transaction)
  })
})
