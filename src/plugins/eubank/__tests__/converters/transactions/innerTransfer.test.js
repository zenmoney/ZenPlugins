import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'KZT',
    type: 'ccard'
  }

  const accountsByNumber = {
    KZ129480006A01694659: {
      id: '1694659',
      instrument: 'KZT'
    },
    KZ88948KZT00607005VS: {
      id: '07005VS',
      instrument: 'KZT'
    },
    KZ94948USD00607001ZA: {
      id: '07001ZA',
      instrument: 'USD'
    },
    KZ439480006A03477834: {
      id: '03477834',
      instrument: 'KZT'
    },
    KZ57948KZT006070060X: {
      id: '070060X',
      instrument: 'KZT'
    },
    KZ329480004A02216160: {
      id: '2216160',
      instrument: 'KZT'
    },
    KZ67948KZT00406001SD: {
      id: '06001SD',
      instrument: 'KZT'
    },
    KZ409480003A02098501: {
      id: '2098501',
      instrument: 'KZT'
    },
    KZ28948KZT43506002UE: {
      id: '06002UE',
      instrument: 'KZT'
    },
    KZ80948KZT14406005UL: {
      id: '06005UL',
      instrument: 'KZT'
    },
    KZ369480007A03352296: {
      id: 'account',
      instrument: 'KZT'
    }
  }

  it.each([
    [
      [
        {
          id: 'MOVEMENT_7068076529',
          type: 'MOVEMENT',
          executionDate: 1589262900000,
          status: 'DONE',
          transactionDate: 1589262900000,
          dateCreated: 1589262900000,
          amount: 2000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ57948KZT006070060X',
          totalAmount: 2000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_314 (SM.BANK ОТКРЫТИЕ СЧЕТА (ТУРБОДЕПОЗИТ SMARTBANK MOBILE 24 МЕС) ПЕРЕВОДОМ С КАРТ. СЧЕТА KZ439480006A03477834 ДЛЯ ЖУРАВСКАЯ Т.А. ИИН:700514400017 (SB зачисл из W4)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1589262900000),
          movements: [
            {
              id: 'MOVEMENT_7068076529',
              account: { id: 'account' },
              invoice: null,
              sum: 2000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ439480006A03477834_KZ57948KZT006070060X_15892_2000', '15892629_2000'],
          merchant: null,
          comment: 'ОТКРЫТИЕ СЧЕТА (ТУРБОДЕПОЗИТ SMARTBANK MOBILE 24 МЕС) ПЕРЕВОДОМ С КАРТ. СЧЕТА KZ439480006A03477834 ДЛЯ ЖУРАВСКАЯ Т.А. ИИН:700514400017 (SB зачисл из W4)'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_7233715106',
          type: 'MOVEMENT',
          executionDate: 1588234500000,
          status: 'DONE',
          transactionDate: 1588234500000,
          dateCreated: 1588234500000,
          amount: 500000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ88948KZT00607005VS',
          totalAmount: 500000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_314 SM.BANK ПЕР. С КАРТ.СЧЕТА KZ129480006A01694659 НА СЧЕТ KZ88948KZT00607005VS (SB зачисл из W4)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1588234500000),
          movements: [
            {
              id: 'MOVEMENT_7233715106',
              account: { id: 'account' },
              invoice: null,
              sum: 500000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ129480006A01694659_KZ88948KZT00607005VS_15882_500000', '15882345_500000'],
          merchant: null,
          comment: 'ПЕР. С КАРТ.СЧЕТА KZ129480006A01694659 НА СЧЕТ KZ88948KZT00607005VS (SB зачисл из W4)'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_6932860336',
          type: 'MOVEMENT',
          executionDate: 1590343200000,
          status: 'DONE',
          transactionDate: 1590380341000,
          dateCreated: 1590380341000,
          amount: 50000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ439480006A03477834',
          totalAmount: 50000,
          totalAmountCurrency: 'KZT',
          purpose: 'SMART BANK Credit from Николаев Николай Николаевич; KZ57948KZT006070060X (INT)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1590380341000),
          movements: [
            {
              id: 'MOVEMENT_6932860336',
              account: { id: 'account' },
              invoice: null,
              sum: 50000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ439480006A03477834_KZ57948KZT006070060X_15903_50000', '15903803_50000'],
          merchant: null,
          comment: 'SMART BANK Credit from Николаев Николай Николаевич; KZ57948KZT006070060X (INT)'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_2731571736',
          type: 'MOVEMENT',
          executionDate: 1591007460000,
          status: 'DONE',
          transactionDate: 1591007460000,
          dateCreated: 1591007460000,
          amount: -50000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ88948KZT00607005VS',
          totalAmount: -50000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР.СО СЧЕТА KZ88948KZT00607005VS НА КАРТ.СЧЕТ KZ129480006A01694659 (SB списание в W4)'
        },
        {
          id: 'MOVEMENT_9515084829',
          type: 'MOVEMENT',
          executionDate: 1591001340000,
          status: 'DONE',
          transactionDate: 1591001340000,
          dateCreated: 1591001340000,
          amount: 50000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ88948KZT00607005VS',
          totalAmount: 50000,
          totalAmountCurrency: 'KZT',
          purpose: 'СТОРНО_КНП_324 SM.BANK ПЕР.СО СЧЕТА KZ88948KZT00607005VS НА КАРТ.СЧЕТ KZ129480006A01694659 (SB зачисл из W4)'
        },
        {
          id: 'MOVEMENT_4729505962',
          type: 'MOVEMENT',
          executionDate: 1590999480000,
          status: 'DONE',
          transactionDate: 1590999480000,
          dateCreated: 1590999480000,
          amount: -50000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ88948KZT00607005VS',
          totalAmount: -50000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР.СО СЧЕТА KZ88948KZT00607005VS НА КАРТ.СЧЕТ KZ129480006A01694659 (SB списание в W4)'
        },
        {
          id: 'MOVEMENT_6254889814',
          type: 'MOVEMENT',
          executionDate: 1590736800000,
          status: 'DONE',
          transactionDate: 1590736800000,
          dateCreated: 1590736800000,
          amount: 950000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ88948KZT00607005VS',
          totalAmount: 950000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_314 SM.BANK ПЕР. С КАРТ.СЧЕТА KZ129480006A01694659 НА СЧЕТ KZ88948KZT00607005VS (SB зачисл из W4)'
        },
        {
          id: 'MOVEMENT_5786662460',
          type: 'MOVEMENT',
          executionDate: 1588852380000,
          status: 'DONE',
          transactionDate: 1588852380000,
          dateCreated: 1588852380000,
          amount: -50000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ88948KZT00607005VS',
          totalAmount: -50000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР.СО СЧЕТА KZ88948KZT00607005VS НА КАРТ.СЧЕТ KZ129480006A01694659 (SB списание в W4)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1591007460000),
          movements: [
            {
              id: 'MOVEMENT_2731571736',
              account: { id: '07005VS' },
              invoice: null,
              sum: -50000,
              fee: 0
            },
            {
              id: null,
              account: { id: '1694659' },
              invoice: null,
              sum: 50000,
              fee: 0
            }
          ],
          merchant: null,
          comment: 'ПЕР.СО СЧЕТА KZ88948KZT00607005VS НА КАРТ.СЧЕТ KZ129480006A01694659 (SB списание в W4)'
        },
        {
          hold: false,
          date: new Date(1590999480000),
          movements: [
            {
              id: 'MOVEMENT_4729505962',
              account: { id: 'account' },
              invoice: null,
              sum: -50000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ88948KZT00607005VS_KZ129480006A01694659_15909_50000', '15909994_50000'],
          merchant: null,
          comment: 'ПЕР.СО СЧЕТА KZ88948KZT00607005VS НА КАРТ.СЧЕТ KZ129480006A01694659 (SB списание в W4)'
        },
        {
          hold: false,
          date: new Date(1590736800000),
          movements: [
            {
              id: 'MOVEMENT_6254889814',
              account: { id: 'account' },
              invoice: null,
              sum: 950000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ129480006A01694659_KZ88948KZT00607005VS_15907_950000', '15907368_950000'],
          merchant: null,
          comment: 'ПЕР. С КАРТ.СЧЕТА KZ129480006A01694659 НА СЧЕТ KZ88948KZT00607005VS (SB зачисл из W4)'
        },
        {
          hold: false,
          date: new Date(1588852380000),
          movements: [
            {
              id: 'MOVEMENT_5786662460',
              account: { id: 'account' },
              invoice: null,
              sum: -50000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ88948KZT00607005VS_KZ129480006A01694659_15888_50000', '15888523_50000'],
          merchant: null,
          comment: 'ПЕР.СО СЧЕТА KZ88948KZT00607005VS НА КАРТ.СЧЕТ KZ129480006A01694659 (SB списание в W4)'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_6857090615',
          type: 'MOVEMENT',
          executionDate: 1595872800000,
          status: 'DONE',
          transactionDate: 1595930206000,
          dateCreated: 1595930206000,
          amount: -7500,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ329480004A02216160',
          totalAmount: -7500,
          totalAmountCurrency: 'KZT',
          purpose: 'SMART BANK Debit to Николаев Николай Николаевич; KZ67948KZT00406001SD (INT)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1595930206000),
          movements: [
            {
              id: 'MOVEMENT_6857090615',
              account: { id: 'account' },
              invoice: null,
              sum: -7500,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ329480004A02216160_KZ67948KZT00406001SD_15959_7500', '15959302_7500'],
          merchant: null,
          comment: 'SMART BANK Debit to Николаев Николай Николаевич; KZ67948KZT00406001SD (INT)'
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_5529088762',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1598182635000,
          amount: -6311.8,
          amountCurrency: 'KZT',
          accountSource: 'KZ389480005A00449730',
          totalAmount: -6311.8,
          totalAmountCurrency: 'KZT',
          purpose: 'CH Debit Acc KAZ Almaty Perevod s karty na kartu'
        },
        {
          id: 'RESERVED_AMOUNT_6736870112',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1598182636000,
          amount: -6311.8,
          amountCurrency: 'KZT',
          accountSource: 'KZ259480005A02527122',
          totalAmount: 6311.8,
          totalAmountCurrency: 'KZT',
          purpose: 'CH Credit Acc KAZ Almaty Perevod s karty na kartu'
        }
      ],
      [
        {
          hold: true,
          date: new Date(1598182635000),
          movements: [
            {
              id: 'RESERVED_AMOUNT_5529088762',
              account: { id: 'account' },
              invoice: null,
              sum: -6311.8,
              fee: 0
            }
          ],
          groupKeys: [null, null, '15981826_6311.8'],
          merchant: null,
          comment: 'CH Debit Acc KAZ Almaty Perevod s karty na kartu'
        },
        {
          hold: true,
          date: new Date(1598182636000),
          movements: [
            {
              id: 'RESERVED_AMOUNT_6736870112',
              account: { id: 'account' },
              invoice: null,
              sum: 6311.8,
              fee: 0
            }
          ],
          groupKeys: [null, null, '15981826_6311.8'],
          merchant: null,
          comment: 'CH Credit Acc KAZ Almaty Perevod s karty na kartu'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_9776153813',
          type: 'MOVEMENT',
          executionDate: 1599632160000,
          status: 'DONE',
          transactionDate: 1599632160000,
          dateCreated: 1599632160000,
          amount: 20000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ28948KZT43506002UE',
          totalAmount: 20000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_191 SM.BANK ПЕР. С КАРТ.СЧЕТА KZ409480003A02098501 НА СЧЕТ KZ28948KZT43506002UE (SB зачисл из W4)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1599632160000),
          movements: [
            {
              id: 'MOVEMENT_9776153813',
              account: { id: 'account' },
              invoice: null,
              sum: 20000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ409480003A02098501_KZ28948KZT43506002UE_15996_20000', '15996321_20000'],
          merchant: null,
          comment: 'ПЕР. С КАРТ.СЧЕТА KZ409480003A02098501 НА СЧЕТ KZ28948KZT43506002UE (SB зачисл из W4)'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_1277399059',
          type: 'MOVEMENT',
          executionDate: 1606492260000,
          status: 'DONE',
          transactionDate: 1606492260000,
          dateCreated: 1606492260000,
          amount: -8000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          totalAmount: -8000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_324 SM.BANK ПЕР.СО СЧЕТА KZ80948KZT14406005UL НА КАРТ.СЧЕТ KZ369480007A03352296 (SB списание в W4)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1606492260000),
          movements: [
            {
              id: 'MOVEMENT_1277399059',
              account: { id: 'account' },
              invoice: null,
              sum: -8000,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ80948KZT14406005UL_KZ369480007A03352296_16064_8000', '16064922_8000'],
          merchant: null,
          comment: 'ПЕР.СО СЧЕТА KZ80948KZT14406005UL НА КАРТ.СЧЕТ KZ369480007A03352296 (SB списание в W4)'
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_7181962485',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1606492298000,
          amount: -8000,
          amountCurrency: 'KZT',
          accountSource: 'KZ369480007A03352296',
          totalAmount: 8000,
          totalAmountCurrency: 'KZT',
          purpose: 'CH Credit Acc '
        }
      ],
      [
        {
          hold: true,
          date: new Date(1606492298000),
          movements: [
            {
              id: 'RESERVED_AMOUNT_7181962485',
              account: { id: 'account' },
              invoice: null,
              sum: 8000,
              fee: 0
            }
          ],
          groupKeys: [null, null, '16064922_8000'],
          merchant: null,
          comment: 'CH Credit Acc'
        }
      ]
    ],
    [
      [
        {
          id: 'MOVEMENT_2118622814',
          type: 'MOVEMENT',
          executionDate: 1610867640000,
          status: 'DONE',
          transactionDate: 1610867640000,
          dateCreated: 1610867640000,
          amount: 23000,
          amountCurrency: 'KZT',
          fee: 0,
          feeCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          totalAmount: 23000,
          totalAmountCurrency: 'KZT',
          purpose: 'КНП_314 SM.BANK ПЕР. С КАРТ.СЧЕТА KZ369480007A03352296 НА СЧЕТ KZ80948KZT14406005UL (SB зачисл из W4)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1610867640000),
          movements:
            [
              {
                id: 'MOVEMENT_2118622814',
                account: { id: 'account' },
                invoice: null,
                sum: 23000,
                fee: 0
              }
            ],
          groupKeys: [null, 'KZ369480007A03352296_KZ80948KZT14406005UL_16108_23000', '16108676_23000'],
          merchant: null,
          comment: 'ПЕР. С КАРТ.СЧЕТА KZ369480007A03352296 НА СЧЕТ KZ80948KZT14406005UL (SB зачисл из W4)'
        }
      ]
    ],
    [
      [
        {
          id: 'RESERVED_AMOUNT_9119696963',
          type: 'RESERVED_AMOUNT',
          executionDate: 0,
          status: 'RESERVED',
          dateCreated: 1610867670000,
          amount: -23000,
          amountCurrency: 'KZT',
          accountSource: 'KZ369480007A03352296',
          totalAmount: -23000,
          totalAmountCurrency: 'KZT',
          purpose: 'CH Debit Acc'
        }
      ],
      [
        {
          hold: true,
          date: new Date(1610867670000),
          movements:
            [
              {
                id: 'RESERVED_AMOUNT_9119696963',
                account: { id: 'account' },
                invoice: null,
                sum: -23000,
                fee: 0
              }
            ],
          groupKeys: [null, null, '16108676_23000'],
          merchant: null,
          comment: 'CH Debit Acc'
        }
      ]
    ]
  ])('converts inner transfer', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account, accountsByNumber)).toEqual(transaction)
  })

  const rubAccount = {
    id: '06005UL',
    instrument: 'KZT',
    type: 'deposit',
    syncID: [
      'KZ80948KZT14406005UL'
    ]
  }
  const rubAccountsByNumber = {
    KZ80948KZT14406005UL: {
      id: '06005UL',
      instrument: 'KZT',
      syncID: [
        'KZ80948KZT144060058576'
      ]
    },
    KZ369480007A03352296: {
      id: '3352296',
      instrument: 'KZT',
      syncID: [
        'KZ369480007A03352296'
      ]
    }
  }
  it.each([
    [
      [
        {
          id: 'ORDER_2727297543', // Эта транзакция относится к счету KZ80948KZT14406005UL
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
          dateSigned: 1611116400433,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1611116400433,
          dateCreated: 1611116400433,
          orderNumber: 42015792,
          orderType: 'TSLF',
          amount: 5000,
          amountCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL', // Эта транзакция относится к счету KZ80948KZT14406005UL поэтому должно быть   sum: -5000
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 5000,
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
          dateScheduled: 1611116400433,
          dateTill: 0,
          recipientCountryCode: '',
          recipientCountryName: null,
          recipientBankBIC: 'EURIKZKA',
          correspondentBankBIC: '',
          subAccountCurrency: '',
          senderSubAccountCurrency: '',
          corporate: false,
          receiverBIN: '',
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
          hold: false,
          date: new Date(1611116400433),
          movements:
            [
              {
                id: 'ORDER_2727297543',
                account: { id: '06005UL' },
                invoice: null,
                sum: -5000, // Эта транзакция относится к счету KZ80948KZT14406005UL поэтому должно быть   sum: -5000
                fee: 0
              }
            ],
          groupKeys: [
            '42015792',
            'KZ369480007A03352296_KZ80948KZT14406005UL_16111_5000',
            '16111164_5000'
          ],
          merchant: null,
          comment: null
        }
      ]
    ],
    [
      [
        {
          id: 'ORDER_7238786683', // account=KZ80948KZT14406005UL&page=0&pageSize=50',
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
          dateSigned: 1618467288027,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1618467288027,
          dateCreated: 1618467288010,
          orderNumber: 45945483,
          orderType: 'TSLF',
          amount: 10000,
          amountCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 10000,
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
          dateScheduled: 1618467288010,
          dateTill: 0,
          recipientCountryCode: '',
          recipientCountryName: null,
          recipientBankBIC: 'EURIKZKA',
          correspondentBankBIC: '',
          subAccountCurrency: '',
          senderSubAccountCurrency: '',
          corporate: false,
          receiverBIN: '',
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
          hold: false,
          date: new Date(1618467288010),
          movements:
            [
              {
                id: 'ORDER_7238786683',
                account: { id: '06005UL' },
                invoice: null,
                sum: -10000, // Должен быть минус, а был плюс
                fee: 0
              }
            ],
          groupKeys: [
            '45945483',
            'KZ369480007A03352296_KZ80948KZT14406005UL_16184_10000',
            '16184672_10000'
          ],
          merchant: null,
          comment: null
        }
      ]
    ]
  ])('converts inner_1 transfer', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, rubAccount, rubAccountsByNumber)).toEqual(transaction)
  })

  const kztAccount = {
    id: '3352296-KZT',
    instrument: 'KZT',
    type: 'ccard',
    syncID: [
      'KZ369480007A03352296'
    ]
  }
  const kztAccountsByNumber = {
    KZ80948KZT14406005UL: {
      id: '06005UL',
      instrument: 'KZT',
      syncID: [
        'KZ80948KZT14406005UL'
      ]
    },
    KZ369480007A03352296: {
      id: '3352296',
      instrument: 'KZT',
      syncID: [
        'KZ369480007A03352296'
      ]
    }
  }
  it.each([
    [
      [
        {
          id: 'ORDER_2078629360', // Эта транзакция относится к счету KZ369480007A03352296
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
          dateSigned: 1611116400433,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1611116400433,
          dateCreated: 1611116400433,
          orderNumber: 42015792,
          orderType: 'TSLF',
          amount: 5000,
          amountCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL', // Эта транзакция относится к счету KZ369480007A03352296 поэтому должно быть   sum: 5000
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 5000,
          totalAmountCurrency: 'KZT',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: 'KZ369480007A03352296', // На этот счет с KZ80948KZT14406005UL
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
          dateScheduled: 1611116400433,
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
          hold: false,
          date: new Date(1611116400433),
          movements:
            [
              {
                id: 'ORDER_2078629360',
                account: { id: '3352296-KZT' },
                invoice: null,
                sum: 5000, // Эта транзакция относится к счету KZ369480007A03352296 поэтому должно быть   sum: 5000
                fee: 0
              }
            ],
          merchant: null,
          comment: null,
          groupKeys: [
            '42015792',
            'KZ369480007A03352296_KZ80948KZT14406005UL_16111_5000',
            '16111164_5000'
          ]
        }
      ]
    ],
    [
      [
        {
          id: 'ORDER_3734906285', // account=KZ369480007A03352296&page=2&pageSize=50',
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
          dateSigned: 1618467288027,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1618467288027,
          dateCreated: 1618467288010,
          orderNumber: 45945483,
          orderType: 'TSLF',
          amount: 10000,
          amountCurrency: 'KZT',
          accountSource: 'KZ80948KZT14406005UL',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 10000,
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
          dateScheduled: 1618467288010,
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
          hold: false,
          date: new Date(1618467288010),
          movements:
            [
              {
                id: 'ORDER_3734906285',
                account: { id: '3352296-KZT' },
                invoice: null,
                sum: 10000, // Должен быть плюс, и был плюс
                fee: 0
              }
            ],
          groupKeys: [
            '45945483',
            'KZ369480007A03352296_KZ80948KZT14406005UL_16184_10000',
            '16184672_10000'
          ],
          merchant: null,
          comment: null
        }
      ]
    ]
  ])('converts inner_2 transfer', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, kztAccount, kztAccountsByNumber)).toEqual(transaction)
  })

  const AccountOut = {
    id: '2903638',
    instrument: 'KZT',
    syncID: [
      'KZ199480006A02903638'
    ]
  }
  const AccountsByNumber1 = {
    KZ199480006A02903638: {
      id: '2903638',
      instrument: 'KZT',
      syncID: [
        'KZ199480006A02903638'
      ]
    },
    KZ94948RUB0060400071: {
      id: '0400071',
      instrument: 'RUB',
      syncID: [
        'KZ94948RUB0060400071'
      ]
    }
  }
  it.each([
    [
      [
        {
          id: 'ORDER_5022505148',
          type: 'ORDER',
          executionDate: 0,
          personId: 6310680,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'Карточный счёт',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '213',
          dateSigned: 1609231454537,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1609231454537,
          dateCreated: 1609231454520,
          orderNumber: 41224171,
          orderType: 'TSLF',
          amount: 30000,
          amountCurrency: 'RUB',
          accountSource: 'KZ199480006A02903638',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 30000,
          totalAmountCurrency: 'RUB',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: 'KZ94948RUB0060400071',
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
          dateScheduled: 1609231454520,
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
          reasonDetails: 'To RS; ПОТАПОВ ДМИТРИЙ ОЛЕГОВИЧ; KZ94948RUB0060400071'
        }
      ],
      [
        {
          hold: false,
          date: new Date('2020-12-29T08:44:14.520Z'),
          movements:
            [
              {
                id: 'ORDER_5022505148',
                account: { id: '2903638' },
                invoice: {
                  instrument: 'RUB',
                  sum: -30000
                },
                sum: -30000, // Эта транзакция относится к счету KZ199480006A02903638 поэтому должно быть   sum: -30000
                fee: 0
              }
            ],
          merchant: null,
          comment: null,
          groupKeys: [
            '41224171',
            'KZ94948RUB0060400071_KZ199480006A02903638_16092_30000',
            '16092314_30000'
          ]
        }
      ]
    ]
  ])('converts_1 inner_2 transfer', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, AccountOut, AccountsByNumber1)).toEqual(transaction)
  })

  const AccountIn = {
    id: '0400071',
    instrument: 'RUB',
    syncID: [
      'KZ94948RUB0060400071'
    ]
  }
  const AccountsByNumber2 = {
    KZ199480006A02903638: {
      id: '2903638',
      instrument: 'KZT',
      syncID: [
        'KZ199480006A02903638'
      ]
    },
    KZ94948RUB0060400071: {
      id: '0400071',
      instrument: 'RUB',
      syncID: [
        'KZ94948RUB0060400071'
      ]
    }
  }
  it.each([
    [
      [
        {
          id: 'ORDER_1222863012',
          type: 'ORDER',
          executionDate: 0,
          personId: 6310680,
          urgent: false,
          template: false,
          parentOrderId: 0,
          accountName: 'Карточный счёт',
          receiverPhone: '',
          receiverBic: '',
          message: '',
          knpId: '213',
          dateSigned: 1609231454537,
          secoId: '9',
          transferMethodId: '',
          status: 'DONE',
          transactionDate: 1609231454537,
          dateCreated: 1609231454520,
          orderNumber: 41224171,
          orderType: 'TSLF',
          amount: 30000,
          amountCurrency: 'RUB',
          accountSource: 'KZ199480006A02903638',
          fee: 0,
          feeCurrency: 'KZT',
          totalAmount: 30000,
          totalAmountCurrency: 'RUB',
          recipientName: 'Николаев Николай Николаевич',
          accountRecipient: 'KZ94948RUB0060400071',
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
          dateScheduled: 1609231454520,
          dateTill: 0,
          recipientCountryCode: '',
          recipientCountryName: null,
          recipientBankBIC: 'EURIKZKA',
          correspondentBankBIC: '',
          subAccountCurrency: '',
          senderSubAccountCurrency: '',
          corporate: false,
          receiverBIN: '',
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
          hold: false,
          date: new Date('2020-12-29T08:44:14.520Z'),
          movements:
            [
              {
                id: 'ORDER_1222863012',
                account: { id: '0400071' },
                invoice: null,
                sum: 30000, // Эта транзакция относится к счету KZ94948RUB0060400071 поэтому должно быть   sum: 30000
                fee: 0
              }
            ],
          merchant: null,
          comment: null,
          groupKeys: [
            '41224171',
            'KZ94948RUB0060400071_KZ199480006A02903638_16092_30000',
            '16092314_30000'
          ]
        }
      ]
    ]
  ])('converts_2 inner_2 transfer', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, AccountIn, AccountsByNumber2)).toEqual(transaction)
  })
})
