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
    KZ099480405A03041019: {
      id: '3041019',
      instrument: 'KZT'
    },
    '': {
      id: '3233969',
      instrument: 'KZT'
    }
  }

  it.each([
    [
      [
        {
          id: 'MOVEMENT_1014525140',
          type: 'MOVEMENT',
          executionDate: 1596477600000,
          status: 'DONE',
          transactionDate: 1596523574000,
          dateCreated: 1596523574000,
          amount: -100,
          amountCurrency: 'KZT',
          fee: -200,
          feeCurrency: 'KZT',
          accountSource: 'KZ099480405A03041019',
          totalAmount: -300,
          totalAmountCurrency: 'KZT',
          purpose: 'CH Debit KAZ Almaty P2P_DMKM_Debit'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1596523574000),
          movements: [
            {
              id: 'MOVEMENT_1014525140',
              account: { id: 'account' },
              invoice: null,
              sum: -100,
              fee: -200
            },
            {
              id: null,
              account: {
                company: null,
                instrument: 'KZT',
                syncIds: null,
                type: 'ccard'
              },
              invoice: null,
              sum: 100,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'CH Debit KAZ Almaty P2P_DMKM_Debit'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_2852974524',
          type: 'MOVEMENT',
          executionDate: 1610721120000,
          status: 'DONE',
          transactionDate: 1610721120000,
          dateCreated: 1610721120000,
          amount: -12000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          totalAmount: -12000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР. СО СЧЕТА KZ80948KZT14406005UL НА СЧЕТ KZ66948KZT144070031W <<12000.00 KZT>> (SB списание)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1610721120000),
          movements:
            [
              {
                id: 'MOVEMENT_2852974524',
                account: { id: 'account' },
                invoice: null,
                sum: -12000,
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
                sum: 12000,
                fee: 0
              }
            ],
          merchant: null,
          comment: 'ПЕР. СО СЧЕТА KZ80948KZT14406005UL НА СЧЕТ KZ66948KZT144070031W <<12000.00 KZT>> (SB списание)'
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_1956648955',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
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
          status: 'RESERVED',
          dateCreated: 1611133429000,
          amount: 4080,
          amountCurrency: 'KZT',
          accountSource: '',
          totalAmount: 4080,
          totalAmountCurrency: 'KZT',
          purpose: 'KAZ NUR-SULTAN INJOY MEGA SW SHOP '
        }
      ],
      [
        {
          hold: true,
          date: new Date('2021-01-20T15:03:49+0600'),
          movements:
            [
              {
                id: 'RESERVED_AMOUNT_1956648955',
                account: { id: 'account' },
                invoice: null,
                sum: -4080,
                fee: 0
              }
            ],
          merchant: null,
          comment: 'KAZ NUR-SULTAN INJOY MEGA SW SHOP'
        }
      ]
    ]
  ])('converts outer outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account, accountsByNumber)).toEqual(transaction)
  })

  const rubAccount = {
    id: 'rubAccount',
    instrument: 'RUB',
    type: 'ccard'
  }
  it.each([
    [
      [
        {
          id: 'ORDER_7140110877',
          type: 'ORDER',
          executionDate: 0,
          status: 'IN_PROCESS',
          transactionDate: 1601460898627,
          dateCreated: 1601460898610,
          orderNumber: 37753422,
          orderType: 'TINT',
          amount: -14600,
          amountCurrency: 'RUB',
          accountSource: 'KZ94948RUB0060400071',
          fee: 2000,
          feeCurrency: 'KZT',
          totalAmount: -14600,
          totalAmountCurrency: 'RUB',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: '40817810800004015153',
          recipientResident: false,
          recipientIIN: '',
          recipientAddress: 'РФ, Ставропольский край, Ессентукская станица, Кооперативная 15, 357350',
          recipientCountry: 'Россия',
          recipientBank: '044525974 - АО "ТИНЬКОФФ БАНК"',
          correspondentBank: '',
          purpose: '343 Переводы клиентом денег со своего текущего счета в одном банке на свой текущий счет в другом банке.',
          repeatsEveryWeek: false,
          repeatsEveryMonth: false,
          dateStart: 0,
          dateScheduled: 1601460898610,
          dateTill: 0,
          recipientCountryCode: 'RUS',
          recipientCountryName: null,
          recipientBankBIC: '044525974',
          correspondentBankBIC: '',
          subAccountCurrency: '',
          senderSubAccountCurrency: '',
          secoId: '',
          corporate: false,
          receiverBIN: ''
        }
      ],
      [
        {
          hold: true,
          date: new Date(1601460898610),
          movements: [
            {
              id: 'ORDER_7140110877',
              account: { id: 'rubAccount' },
              invoice: null,
              sum: -14600,
              fee: 0
            },
            {
              id: null,
              account: {
                company: null,
                instrument: 'RUB',
                syncIds: ['40817810800004015153'],
                type: 'checking'
              },
              invoice: null,
              sum: 14600,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'Переводы клиентом денег со своего текущего счета в одном банке на свой текущий счет в другом банке'
        }
      ]
    ]
  ])('converts outer outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, rubAccount)).toEqual(transaction)
  })

  const usdAccount = {
    id: '040003N',
    type: 'checking',
    title: '*003N',
    instrument: 'USD',
    syncID: [
      'KZ90948USD207040003N'
    ],
    balance: 0
  }
  const usdAccountsByNumber = {
    id: '040003N',
    type: 'checking',
    title: '*003N',
    instrument: 'USD',
    syncID: [
      'KZ90948USD207040003N'
    ],
    balance: 0
  }

  it.each([
    [
      [
        {
          id: 'ORDER_1912560890',
          type: 'ORDER',
          executionDate: 0,
          personId: 1646874,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'ТурбоДепозит Smartbank 12 мес.',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '213',
          dateSigned: 1647322150970,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1647322150970,
          dateCreated: 1647322150690,
          orderNumber: 60530242,
          orderType: 'TSLF',
          amount: 42672.84,
          amountCurrency: 'KZT',
          accountSource: 'KZ41948KZT207060011P',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 42672.84,
          totalAmountCurrency: 'KZT',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: 'KZ90948USD207040003N',
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
          dateScheduled: 1647322150690,
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
          date: new Date('2022-03-15T05:29:10.690Z'), // Tue Mar 15 2022 11:29:10 GMT+0600 (+06),
          movements:
            [
              {
                id: 'ORDER_1912560890',
                account: { id: '040003N' },
                invoice: {
                  instrument: 'KZT',
                  sum: 42672.84
                },
                sum: null,
                fee: 0
              },
              {
                id: null,
                account:
                  {
                    company: null,
                    instrument: 'KZT',
                    syncIds: ['KZ41948KZT207060011P'],
                    type: 'ccard'
                  },
                invoice: null,
                sum: -42672.84,
                fee: 0
              }
            ],
          merchant: null,
          comment: null
        }
      ]
    ]
  ])('converts outer outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, usdAccount, usdAccountsByNumber)).toEqual(transaction)
  })

  const kztAccount = {
    id: '3352296-KZT',
    type: 'ccard',
    title: '*4853-KZT',
    instrument: 'KZT',
    syncID: [
      'KZ369480007A03352296',
      '530496******4853'
    ]
  }
  const kztAccountsByNumber = {
    KZ369480007A03352296: {
      id: '3352296-KZT',
      type: 'ccard',
      title: '*4853-KZT',
      instrument: 'KZT'
    }
  }

  it.each([
    [
      [
        {
          id: 'ORDER_5353220446',
          type: 'ORDER',
          executionDate: 0,
          personId: 6033288,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'MC Black',
          receiverPhone: '7071627496',
          receiverBic: 'EURIKZKA',
          message: '',
          knpId: '191',
          dateSigned: 1618467338000,
          secoId: '',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1618467338000,
          dateCreated: 1618467337987,
          orderNumber: 45945543,
          orderType: 'IIPS',
          amount: 10000,
          amountCurrency: 'KZT',
          accountSource: 'KZ369480007A03352296',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 10000,
          totalAmountCurrency: 'KZT',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: '',
          recipientResident: false,
          recipientIIN: '',
          recipientAddress: '',
          recipientCountry: '',
          recipientBank: '',
          correspondentBank: '',
          purpose: '',
          repeatsEveryWeek: false,
          repeatsEveryMonth: false,
          dateStart: 0,
          dateScheduled: 1618467337987,
          dateTill: 0,
          recipientCountryCode: '',
          recipientCountryName: null,
          recipientBankBIC: '',
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
          terminalId: 'SBW0001',
          transCity: 'ALMATY',
          transCountry: 'KAZ',
          reasonDetails: 'Николаев Николай Николаевич; KZ339480007A03680501'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1618467337987),
          movements:
            [
              {
                id: 'ORDER_5353220446',
                account: { id: '3352296-KZT' },
                invoice: null,
                sum: -10000,
                fee: 0
              },
              {
                id: null,
                account:
                  {
                    company: null,
                    instrument: 'KZT',
                    syncIds: [
                      'KZ339480007A03680501'
                    ],
                    type: 'ccard'
                  },
                invoice: null,
                sum: 10000,
                fee: 0
              }
            ],
          merchant: {
            country: null,
            city: null,
            title: 'Николаев Николай Николаевич',
            mcc: null,
            location: null
          },
          comment: null
        }
      ]
    ]
  ])('converts outer outcome transfers', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, kztAccount, kztAccountsByNumber)).toEqual(transaction)
  })
})
