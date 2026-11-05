import { Account, AccountType } from '../../../../../types/zenmoney'
import { convertTransactions } from '../../../converters'
import { groupTransactions } from '../../../transfers'

// Both complete observed funding records from active-deposit-history.json, 2026-11-04.
it('groups actual funding of a deposit account once while preserving both bank IDs', () => {
  const raw = [
    {
      id: 960007,
      amount: 1000,
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
      details: 'Взнос вклада , договор № ДФ/TEST0000001 ИВАНОВ ИВАН ИВАНОВИЧ',
      payeeName: 'Иванов Иван Иванович',
      payerAccount: '40817810000000000001',
      operDate: '04.11.2026',
      pfmIcon: 'pfm-income',
      pfmIconObject: {
        icon: 'pfm-income',
        iconColor: 'FFFFFF',
        backgroundColor: 'F89494'
      },
      pfmOperationId: 960007,
      payeeAccountNumber: '42304810000000000007',
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
      operDateTime: '04.11.2026 17:00 мск',
      accountId: 920007,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    },
    {
      id: 960008,
      amount: -1000,
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
      details: 'ИВАНОВ ИВАН ИВАНОВИЧ//Взнос вклада , договор № ДФ/TEST0000001 ИВАНОВ ИВАН ИВАНОВИЧ',
      payerAccount: '40817810000000000001',
      operDate: '04.11.2026',
      pfmIcon: 'pfm-other',
      pfmIconObject: {
        icon: 'pfm-other',
        iconColor: 'FFFFFF',
        backgroundColor: 'B5BCD1'
      },
      pfmOperationId: 960008,
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
      operDateTime: '04.11.2026 17:00 мск',
      accountId: 920001,
      mccCodeAndCategory: '',
      canSaveTemplate: false,
      dpTransferChina: false
    }
  ]
  const accounts: Account[] = [
    {
      id: '920001',
      type: AccountType.ccard,
      title: 'Зарплатный',
      instrument: 'RUB',
      syncIds: [
        '2200********0001',
        '40817810000000000001'
      ],
      balance: 1206,
      archived: false
    },
    {
      id: '920007',
      type: AccountType.deposit,
      startDate: new Date('2026-11-03T17:00:00.000Z'),
      startBalance: 1000,
      percent: 7,
      capitalization: false,
      endDateOffsetInterval: 'day',
      endDateOffset: 91,
      payoffInterval: 'month',
      payoffStep: 1,
      title: 'Зарплатный максимум!',
      instrument: 'RUB',
      syncIds: [
        '42304810000000000007'
      ],
      balance: 1000,
      archived: false
    }
  ]
  const converted = accounts.flatMap(account => convertTransactions(raw.filter(item => String(item.accountId) === account.id), account, new Date('2026-11-03T21:00:00Z'), undefined, accounts, raw))
  expect(converted).toEqual([
    {
      groupKeys: [
        '["deposit-own","920001","920007","RUB",1000,"2026-11-04T14:00:00.000Z"]'
      ],
      date: new Date('2026-11-04T14:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '960008',
          account: {
            id: '920001'
          },
          sum: -1000,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'ИВАНОВ ИВАН ИВАНОВИЧ//Взнос вклада , договор № ДФ/TEST0000001 ИВАНОВ ИВАН ИВАНОВИЧ'
    },
    {
      groupKeys: [
        '["deposit-own","920001","920007","RUB",1000,"2026-11-04T14:00:00.000Z"]'
      ],
      date: new Date('2026-11-04T14:00:00.000Z'),
      hold: false,
      movements: [
        {
          id: '960007',
          account: {
            id: '920007'
          },
          sum: 1000,
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
      comment: 'Взнос вклада , договор № ДФ/TEST0000001 ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ])
  expect(groupTransactions(converted)).toEqual([
    {
      movements: [
        {
          id: '960008',
          account: {
            id: '920001'
          },
          sum: -1000,
          fee: 0,
          invoice: null
        },
        {
          id: '960007',
          account: {
            id: '920007'
          },
          sum: 1000,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2026-11-04T14:00:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Взнос вклада , договор № ДФ/TEST0000001 ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ])
  expect(groupTransactions([...converted].reverse())).toEqual([
    {
      movements: [
        {
          id: '960008',
          account: {
            id: '920001'
          },
          sum: -1000,
          fee: 0,
          invoice: null
        },
        {
          id: '960007',
          account: {
            id: '920007'
          },
          sum: 1000,
          fee: 0,
          invoice: null
        }
      ],
      date: new Date('2026-11-04T14:00:00.000Z'),
      hold: false,
      merchant: null,
      comment: 'Взнос вклада , договор № ДФ/TEST0000001 ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ])
})
