import { Account, AccountType } from '../../../../../types/zenmoney'
import { convertTransactions } from '../../../converters'
import { groupTransactions } from '../../../transfers'

// Complete observed 2026-11-03 records, consistently sanitized. Funding/closure:
// deposit-history + counterpart-history; withdrawal: capitalization-history + deposit-counterpart-checks.

it('converts observed deposit funding sides and groups them exactly once', () => {
  const raw = [
    {
      id: 940010,
      amount: -1174624.98,
      categoryCode: 'BETWEEN.MY.ACC',
      pfmCategoryTO: {
        code: 'BETWEEN.MY.ACC',
        kind: '0',
        name: 'Перевод между моими счетами',
        enName: 'Transfer between my accounts',
        icon: null,
        color: 'afaeaf'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'ИВАНОВ ИВАН ИВАНОВИЧ//Взнос вклада , договор № ДФ/800003 ИВАНОВ ИВАН ИВАНОВИЧ',
      payerAccount: '40817810000000000002',
      operDate: '19.01.2025',
      pfmIcon: 'pfm-other',
      pfmIconObject: {
        icon: 'pfm-other',
        iconColor: 'FFFFFF',
        backgroundColor: 'B5BCD1'
      },
      pfmOperationId: 940010,
      payerName: 'Иванов Иван Иванович',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: false,
      printedFormInfo: {
        paymentAvailable: false,
        chequeAvailable: false,
        payDocumentAvailable: true
      },
      canChangeCategory: false,
      hold: false,
      operDateTime: '19.01.2025',
      accountId: 920002,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    },
    {
      id: 940011,
      amount: 1174624.98,
      categoryCode: 'OTHER.INCOME',
      pfmCategoryTO: {
        code: 'OTHER.INCOME',
        kind: '+',
        name: 'Прочие поступления',
        enName: 'Other income',
        icon: 'pfm-income',
        color: 'F89494'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'Взнос вклада , договор № ДФ/800003 ИВАНОВ ИВАН ИВАНОВИЧ',
      payeeName: 'Иванов Иван Иванович',
      payerAccount: '40817810000000000002',
      operDate: '19.01.2025',
      pfmIcon: 'pfm-income',
      pfmIconObject: {
        icon: 'pfm-income',
        iconColor: 'FFFFFF',
        backgroundColor: 'F89494'
      },
      pfmOperationId: 940011,
      payeeAccountNumber: '42307810000000000005',
      payeeBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payeeBankBic: '045004850',
      payerName: 'ИВАНОВ ИВАН ИВАНОВИЧ',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: false,
      printedFormInfo: {
        paymentAvailable: false,
        chequeAvailable: false,
        payDocumentAvailable: true
      },
      canChangeCategory: false,
      hold: false,
      operDateTime: '19.01.2025',
      accountId: 920005,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    }
  ]
  const accounts: Account[] = [
    {
      id: '920002',
      type: AccountType.checking,
      title: 'НЗ',
      instrument: 'RUB',
      syncIds: [
        '40817810000000000002'
      ],
      balance: 50000,
      archived: false
    },
    {
      id: '920005',
      type: AccountType.checking,
      savings: true,
      title: 'Капиталъ',
      instrument: 'RUB',
      syncIds: [
        '42307810000000000005'
      ],
      balance: 0,
      archived: true
    }
  ]
  const from = new Date('2023-01-01T00:00:00+03:00')
  const converted = accounts.flatMap(account => convertTransactions(raw.filter(item => String(item.accountId) === account.id), account, from, undefined, accounts, raw))
  expect(converted).toEqual([
    {
      groupKeys: [
        '["deposit-own","920002","920005","RUB",1174624.98,"2025-01-19"]'
      ],
      date: new Date('2025-01-18T21:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940010',
          account: {
            id: '920002'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'ИВАНОВ ИВАН ИВАНОВИЧ//Взнос вклада , договор № ДФ/800003 ИВАНОВ ИВАН ИВАНОВИЧ'
    },
    {
      groupKeys: [
        '["deposit-own","920002","920005","RUB",1174624.98,"2025-01-19"]'
      ],
      date: new Date('2025-01-18T21:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940011',
          account: {
            id: '920005'
          },
          sum: 1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        title: 'ИВАНОВ ИВАН ИВАНОВИЧ',
        country: null,
        city: null,
        mcc: null,
        location: null
      },
      comment: 'Взнос вклада , договор № ДФ/800003 ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ])
  expect(groupTransactions(converted)).toEqual([
    {
      movements: [
        {
          id: '940010',
          account: {
            id: '920002'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        },
        {
          id: '940011',
          account: {
            id: '920005'
          },
          sum: 1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2025-01-18T21:00:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Взнос вклада , договор № ДФ/800003 ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ])
  expect(groupTransactions([...converted].reverse())).toEqual([
    {
      movements: [
        {
          id: '940010',
          account: {
            id: '920002'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        },
        {
          id: '940011',
          account: {
            id: '920005'
          },
          sum: 1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2025-01-18T21:00:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Взнос вклада , договор № ДФ/800003 ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ])
  expect(groupTransactions(convertTransactions([raw[0]], accounts[0], from, undefined, accounts))).toEqual([
    {
      date: new Date('2025-01-18T21:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940010',
          account: {
            id: '920002'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'ИВАНОВ ИВАН ИВАНОВИЧ//Взнос вклада , договор № ДФ/800003 ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ])
})

it('converts observed deposit closure sides and groups them exactly once', () => {
  const raw = [
    {
      id: 940012,
      amount: -1174624.98,
      categoryCode: 'BETWEEN.MY.ACC',
      pfmCategoryTO: {
        code: 'BETWEEN.MY.ACC',
        kind: '0',
        name: 'Перевод между моими счетами',
        enName: 'Transfer between my accounts',
        icon: null,
        color: 'afaeaf'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'ИВАНОВ ИВАН ИВАНОВИЧ//Безналичное перечисление денежных средств',
      payerAccount: '42307810000000000005',
      operDate: '23.04.2025',
      pfmIcon: 'pfm-other',
      pfmIconObject: {
        icon: 'pfm-other',
        iconColor: 'FFFFFF',
        backgroundColor: 'B5BCD1'
      },
      pfmOperationId: 940012,
      payerName: 'Иванов Иван Иванович',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: false,
      printedFormInfo: {
        paymentAvailable: false,
        chequeAvailable: false,
        payDocumentAvailable: true
      },
      canChangeCategory: false,
      hold: false,
      operDateTime: '23.04.2025 20:43',
      accountId: 920005,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    },
    {
      id: 940013,
      amount: 1174624.98,
      categoryCode: 'OTHER.INCOME',
      pfmCategoryTO: {
        code: 'OTHER.INCOME',
        kind: '+',
        name: 'Прочие поступления',
        enName: 'Other income',
        icon: 'pfm-income',
        color: 'F89494'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'Безналичное перечисление денежных средств',
      payeeName: 'Иванов Иван Иванович',
      payerAccount: '42307810000000000005',
      operDate: '23.04.2025',
      pfmIcon: 'pfm-income',
      pfmIconObject: {
        icon: 'pfm-income',
        iconColor: 'FFFFFF',
        backgroundColor: 'F89494'
      },
      pfmOperationId: 940013,
      payeeAccountNumber: '40817810000000000002',
      payeeBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payeeBankBic: '045004850',
      payerName: 'ИВАНОВ ИВАН ИВАНОВИЧ',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: false,
      printedFormInfo: {
        paymentAvailable: false,
        chequeAvailable: false,
        payDocumentAvailable: true
      },
      canChangeCategory: false,
      hold: false,
      operDateTime: '23.04.2025 20:43',
      accountId: 920002,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    }
  ]
  const accounts: Account[] = [
    {
      id: '920005',
      type: AccountType.checking,
      savings: true,
      title: 'Капиталъ',
      instrument: 'RUB',
      syncIds: [
        '42307810000000000005'
      ],
      balance: 0,
      archived: true
    },
    {
      id: '920002',
      type: AccountType.checking,
      title: 'НЗ',
      instrument: 'RUB',
      syncIds: [
        '40817810000000000002'
      ],
      balance: 50000,
      archived: false
    }
  ]
  const from = new Date('2023-01-01T00:00:00+03:00')
  const converted = accounts.flatMap(account => convertTransactions(raw.filter(item => String(item.accountId) === account.id), account, from, undefined, accounts, raw))
  expect(converted).toEqual([
    {
      groupKeys: [
        '["deposit-own","920005","920002","RUB",1174624.98,"2025-04-23T17:43:00.000Z"]'
      ],
      date: new Date('2025-04-23T17:43:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940012',
          account: {
            id: '920005'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'ИВАНОВ ИВАН ИВАНОВИЧ//Безналичное перечисление денежных средств'
    },
    {
      groupKeys: [
        '["deposit-own","920005","920002","RUB",1174624.98,"2025-04-23T17:43:00.000Z"]'
      ],
      date: new Date('2025-04-23T17:43:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940013',
          account: {
            id: '920002'
          },
          sum: 1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        title: 'ИВАНОВ ИВАН ИВАНОВИЧ',
        country: null,
        city: null,
        mcc: null,
        location: null
      },
      comment: 'Безналичное перечисление денежных средств'
    }
  ])
  expect(groupTransactions(converted)).toEqual([
    {
      movements: [
        {
          id: '940012',
          account: {
            id: '920005'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        },
        {
          id: '940013',
          account: {
            id: '920002'
          },
          sum: 1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2025-04-23T17:43:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Безналичное перечисление денежных средств'
    }
  ])
  expect(groupTransactions([...converted].reverse())).toEqual([
    {
      movements: [
        {
          id: '940012',
          account: {
            id: '920005'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        },
        {
          id: '940013',
          account: {
            id: '920002'
          },
          sum: 1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2025-04-23T17:43:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Безналичное перечисление денежных средств'
    }
  ])
  expect(groupTransactions(convertTransactions([raw[0]], accounts[0], from, undefined, accounts))).toEqual([
    {
      date: new Date('2025-04-23T17:43:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940012',
          account: {
            id: '920005'
          },
          sum: -1174624.98,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'ИВАНОВ ИВАН ИВАНОВИЧ//Безналичное перечисление денежных средств'
    }
  ])
})

it('converts observed deposit withdrawal sides and groups them exactly once', () => {
  const raw = [
    {
      id: 940014,
      amount: -10000,
      categoryCode: 'BETWEEN.MY.ACC',
      pfmCategoryTO: {
        code: 'BETWEEN.MY.ACC',
        kind: '0',
        name: 'Перевод между моими счетами',
        enName: 'Transfer between my accounts',
        icon: null,
        color: 'afaeaf'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'Снятие со вклада',
      payerAccount: '42307810000000000003',
      purpose: 'Перевод собственных средств.\nБез налога (НДС).',
      state: {
        name: 'Исполнен',
        color: '009900',
        date: 1701582346000,
        dateS: '03.12.2023 12:45',
        code: 'successes',
        comment: 'Документ проведён'
      },
      operDate: '03.12.2023',
      pfmIcon: 'pfm-other',
      pfmIconObject: {
        icon: 'pfm-other',
        iconColor: 'FFFFFF',
        backgroundColor: 'B5BCD1'
      },
      pfmOperationId: 940014,
      payeeAccountNumber: '40817810000000000001',
      payeeBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payeeBankBic: '045004850',
      payerName: 'Иванов Иван Иванович',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: true,
      printedFormInfo: {
        paymentAvailable: true,
        chequeAvailable: true
      },
      canChangeCategory: false,
      orderId: 940015,
      orderFormType: 'DEPOSIT_WITHDRAWAL',
      hold: false,
      operDateTime: '03.12.2023 08:45 мск',
      accountId: 920003,
      mccCodeAndCategory: '',
      canSaveTemplate: true,
      showUpCommission: false,
      dpTransferChina: false
    },
    {
      id: 940016,
      amount: 10000,
      categoryCode: 'OTHER.INCOME',
      pfmCategoryTO: {
        code: 'OTHER.INCOME',
        kind: '+',
        name: 'Прочие поступления',
        enName: 'Other income',
        icon: 'pfm-income',
        color: 'F89494'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'Перевод собственных средств.\nБез налога (НДС). \n',
      payeeName: 'Иванов Иван Иванович',
      payerAccount: '42307810000000000003',
      operDate: '03.12.2023',
      pfmIcon: 'pfm-income',
      pfmIconObject: {
        icon: 'pfm-income',
        iconColor: 'FFFFFF',
        backgroundColor: 'F89494'
      },
      pfmOperationId: 940016,
      payeeAccountNumber: '40817810000000000001',
      payeeBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payeeBankBic: '045004850',
      payerName: 'ИВАНОВ ИВАН ИВАНОВИЧ',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: false,
      printedFormInfo: {
        paymentAvailable: false,
        chequeAvailable: false,
        payDocumentAvailable: true
      },
      canChangeCategory: false,
      hold: false,
      operDateTime: '03.12.2023',
      accountId: 920001,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    }
  ]
  const accounts: Account[] = [
    {
      id: '920003',
      type: AccountType.checking,
      savings: true,
      title: 'Копилка',
      instrument: 'RUB',
      syncIds: [
        '42307810000000000003'
      ],
      balance: 0,
      archived: true
    },
    {
      id: '920001',
      type: AccountType.ccard,
      title: 'Зарплатный',
      instrument: 'RUB',
      syncIds: [
        '2200********0001',
        '40817810000000000001'
      ],
      balance: 1294,
      archived: false
    }
  ]
  const from = new Date('2023-01-01T00:00:00+03:00')
  const converted = accounts.flatMap(account => convertTransactions(raw.filter(item => String(item.accountId) === account.id), account, from, undefined, accounts, raw))
  expect(converted).toEqual([
    {
      groupKeys: [
        '["deposit-own","920003","920001","RUB",10000,"2023-12-03"]'
      ],
      date: new Date('2023-12-03T05:45:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940014',
          account: {
            id: '920003'
          },
          sum: -10000,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Снятие со вклада\nПеревод собственных средств. Без налога (НДС).'
    },
    {
      groupKeys: [
        '["deposit-own","920003","920001","RUB",10000,"2023-12-03"]'
      ],
      date: new Date('2023-12-02T21:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940016',
          account: {
            id: '920001'
          },
          sum: 10000,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        title: 'ИВАНОВ ИВАН ИВАНОВИЧ',
        country: null,
        city: null,
        mcc: null,
        location: null
      },
      comment: 'Перевод собственных средств. Без налога (НДС).'
    }
  ])
  expect(groupTransactions(converted)).toEqual([
    {
      movements: [
        {
          id: '940014',
          account: {
            id: '920003'
          },
          sum: -10000,
          fee: 0,
          invoice: null
        },
        {
          id: '940016',
          account: {
            id: '920001'
          },
          sum: 10000,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2023-12-03T05:45:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Снятие со вклада'
    }
  ])
  expect(groupTransactions([...converted].reverse())).toEqual([
    {
      movements: [
        {
          id: '940014',
          account: {
            id: '920003'
          },
          sum: -10000,
          fee: 0,
          invoice: null
        },
        {
          id: '940016',
          account: {
            id: '920001'
          },
          sum: 10000,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2023-12-03T05:45:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Снятие со вклада'
    }
  ])
  expect(groupTransactions(convertTransactions([raw[0]], accounts[0], from, undefined, accounts))).toEqual([
    {
      date: new Date('2023-12-03T05:45:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940014',
          account: {
            id: '920003'
          },
          sum: -10000,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Снятие со вклада\nПеревод собственных средств. Без налога (НДС).'
    }
  ])
})

// Both complete records originate in the same Kopilka history capture.
it('preserves capitalized interest as income and an external payment as an expense', () => {
  const raw = [
    {
      id: 940017,
      amount: 19726.03,
      categoryCode: 'OTHER.INCOME',
      pfmCategoryTO: {
        code: 'OTHER.INCOME',
        kind: '+',
        name: 'Прочие поступления',
        enName: 'Other income',
        icon: 'pfm-income',
        color: 'F89494'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'Выплата процентов по договору № ДФ/800001 от 24.05.2023. ИВАНОВ ИВАН ИВАНОВИЧ . согласно распоряжению от 22.08.2023.\nНДС не предусмотрен.',
      payeeName: 'Иванов Иван Иванович',
      payerAccount: '47411810000000000021',
      operDate: '22.08.2023',
      pfmIcon: 'pfm-income',
      pfmIconObject: {
        icon: 'pfm-income',
        iconColor: 'FFFFFF',
        backgroundColor: 'F89494'
      },
      pfmOperationId: 940017,
      payeeAccountNumber: '42307810000000000003',
      payeeBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payeeBankBic: '045004850',
      payerName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: false,
      printedFormInfo: {
        paymentAvailable: false,
        chequeAvailable: false,
        payDocumentAvailable: true
      },
      canChangeCategory: false,
      hold: false,
      operDateTime: '22.08.2023',
      accountId: 920003,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    },
    {
      id: 940018,
      amount: -10000,
      categoryCode: 'TRANSFER',
      pfmCategoryTO: {
        code: 'TRANSFER',
        kind: '-',
        name: 'Переводы',
        enName: 'Transfers',
        icon: 'pfm-finance',
        color: '4DBE74'
      },
      currency: {
        shortName: 'р.',
        code: 'RUB',
        name: 'Российский рубль',
        roundDecimals: -2
      },
      details: 'Мария Ивановна И',
      payeeName: 'Мария Ивановна И\n+7 (900) 000-0001',
      payerAccount: '42307810000000000003',
      state: {
        name: 'Исполнен',
        color: '009900',
        date: 1701754762000,
        dateS: '05.12.2023 12:39 мск',
        code: 'successes'
      },
      operDate: '05.12.2023',
      pfmIcon: 'pfm-finance',
      pfmIconObject: {
        icon: 'trn_tinkoff',
        iconColor: null,
        backgroundColor: null
      },
      pfmOperationId: 940018,
      payeeBankName: 'АО "ТБанк"',
      payeeBankBic: '044525974',
      payerName: 'Иванов Иван Иванович',
      payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
      payerBankBic: '045004850',
      canSendPrintedForm: true,
      printedFormInfo: {
        paymentAvailable: false,
        chequeAvailable: true
      },
      canChangeCategory: true,
      orderId: 940019,
      orderFormType: 'TRANSFER_OTHER_OTHER_BANK_PHONE',
      hold: false,
      operDateTime: '05.12.2023 12:39 мск',
      accountId: 920003,
      mccCodeAndCategory: '',
      canSaveTemplate: true,
      sbpID: 'A33390939218182D0000000011130505',
      sbpOperDateTime: '05.12.2023 12:39 мск',
      showUpCommission: false,
      dpTransferChina: false
    }
  ]
  const account: Account = {
    id: '920003',
    type: AccountType.checking,
    savings: true,
    title: 'Копилка',
    instrument: 'RUB',
    syncIds: [
      '42307810000000000003'
    ],
    balance: 0,
    archived: true
  }
  const from = new Date('2023-01-01T00:00:00+03:00')
  expect(convertTransactions(raw, account, from)).toEqual([
    {
      date: new Date('2023-08-21T21:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940017',
          account: {
            id: '920003'
          },
          sum: 19726.03,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        title: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
        country: null,
        city: null,
        mcc: null,
        location: null
      },
      comment: 'Выплата процентов по договору № ДФ/800001 от 24.05.2023. ИВАНОВ ИВАН ИВАНОВИЧ . согласно распоряжению от 22.08.2023. НДС не предусмотрен.'
    },
    {
      date: new Date('2023-12-05T09:39:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940018',
          account: {
            id: '920003'
          },
          sum: -10000,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        title: 'Мария Ивановна И\n+7 (900) 000-0001',
        country: null,
        city: null,
        mcc: null,
        location: null
      },
      comment: 'Мария Ивановна И'
    }
  ])
  expect(convertTransactions([raw[0]], account, new Date('2023-08-21T21:00:00.000Z'), new Date('2023-08-21T21:00:00.000Z'))).toEqual([
    {
      date: new Date('2023-08-21T21:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '940017',
          account: {
            id: '920003'
          },
          sum: 19726.03,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        title: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
        country: null,
        city: null,
        mcc: null,
        location: null
      },
      comment: 'Выплата процентов по договору № ДФ/800001 от 24.05.2023. ИВАНОВ ИВАН ИВАНОВИЧ . согласно распоряжению от 22.08.2023. НДС не предусмотрен.'
    }
  ])
})

// Complete counterpart-history.json record: bank explicitly declined the transfer.
it('does not import the observed declined phone transfer as a debit', () => {
  const raw = {
    id: 940020,
    amount: -1600000,
    categoryCode: 'TRANSFER',
    pfmCategoryTO: {
      code: 'TRANSFER',
      kind: '-',
      name: 'Переводы',
      enName: 'Transfers',
      icon: 'pfm-finance',
      color: '4DBE74'
    },
    currency: {
      shortName: 'р.',
      code: 'RUB',
      name: 'Российский рубль',
      roundDecimals: -2
    },
    details: 'Иван Иванович И',
    payeeName: 'Иван Иванович И\n+7 (900) 000-0001',
    payerAccount: '40817810000000000002',
    state: {
      name: 'Отклонён',
      color: '009900',
      date: 1745401619000,
      dateS: '23.04.2025 16:46 мск',
      code: 'failed',
      comment: 'Превышен лимит переводов за день. Для изменения лимитов перейдите в Профиль - Лимиты.'
    },
    operDate: '23.04.2025',
    pfmIcon: 'pfm_stop',
    pfmIconObject: {
      icon: 'trn_raiffeisen',
      iconColor: null,
      backgroundColor: null
    },
    pfmOperationId: 940020,
    payeeBankName: 'АО "Райффайзенбанк"',
    payeeBankBic: '044525700',
    payerName: 'Иванов Иван Иванович',
    payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
    payerBankBic: '045004850',
    canSendPrintedForm: false,
    printedFormInfo: {
      paymentAvailable: false,
      chequeAvailable: false
    },
    canChangeCategory: false,
    orderId: 940021,
    orderFormType: 'TRANSFER_OTHER_OTHER_BANK_PHONE',
    hold: false,
    operDateTime: '23.04.2025 16:46 мск',
    accountId: 920002,
    mccCodeAndCategory: '',
    canSaveTemplate: true,
    sbpID: 'A51131346579501C0000040011491301',
    sbpOperDateTime: '23.04.2025 16:46 мск',
    showUpCommission: false,
    dpTransferChina: false
  }
  const account: Account = {
    id: '920002',
    type: AccountType.checking,
    title: 'НЗ',
    instrument: 'RUB',
    syncIds: [
      '40817810000000000002'
    ],
    balance: 50000,
    archived: false
  }
  expect(convertTransactions([raw], account, new Date('2025-01-01T00:00:00+03:00'))).toEqual([])
})

// Complete 2026-11-03 deposit-counterpart-checks record: interest paid to a separate account.
it('keeps deposit interest paid to another account as ordinary income there', () => {
  const raw = {
    id: 960001,
    amount: 63719.38,
    categoryCode: 'OTHER.INCOME',
    pfmCategoryTO: {
      code: 'OTHER.INCOME',
      kind: '+',
      name: 'Прочие поступления',
      enName: 'Other income',
      icon: 'pfm-income',
      color: 'F89494'
    },
    currency: {
      shortName: 'р.',
      code: 'RUB',
      name: 'Российский рубль',
      roundDecimals: -2
    },
    details: 'Выплата процентов по договору № ДФ/800003 от 19.01.2025. ИВАНОВ ИВАН ИВАНОВИЧ . согласно распоряжению от 19.04.2025.\nНДС не предусмотрен\n\n\n',
    payeeName: 'Иванов Иван Иванович',
    payerAccount: '47411810000000000001',
    operDate: '19.04.2025',
    pfmIcon: 'pfm-income',
    pfmIconObject: {
      icon: 'pfm-income',
      iconColor: 'FFFFFF',
      backgroundColor: 'F89494'
    },
    pfmOperationId: 960001,
    payeeAccountNumber: '40817810000000000002',
    payeeBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
    payeeBankBic: '045004850',
    payerName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
    payerBankName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)',
    payerBankBic: '045004850',
    canSendPrintedForm: false,
    printedFormInfo: {
      paymentAvailable: false,
      chequeAvailable: false,
      payDocumentAvailable: true
    },
    canChangeCategory: false,
    hold: false,
    operDateTime: '19.04.2025 04:57',
    accountId: 920002,
    mccCodeAndCategory: '',
    canSaveTemplate: false,
    dpTransferChina: false
  }

  const account: Account = { id: '920002', type: AccountType.checking, title: 'НЗ', instrument: 'RUB', syncIds: ['40817810000000000002'], balance: 50000, archived: false }
  expect(convertTransactions([raw], account, new Date('2025-01-01T00:00:00+03:00'))).toEqual([{
    date: new Date('2025-04-19T01:57:00.000Z'),
    hold: false,
    movements: [{ id: '960001', account: { id: '920002' }, sum: 63719.38, fee: 0, invoice: null }],
    merchant: { title: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО)', country: null, city: null, mcc: null, location: null },
    comment: 'Выплата процентов по договору № ДФ/800003 от 19.01.2025. ИВАНОВ ИВАН ИВАНОВИЧ . согласно распоряжению от 19.04.2025. НДС не предусмотрен'
  }])
})
