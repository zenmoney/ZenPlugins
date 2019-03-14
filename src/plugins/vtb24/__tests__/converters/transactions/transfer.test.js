import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts transfer', () => {
    expect(convertTransaction({
      __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
      debet: {
        amount: { __type: 'ru.vtb24.mobilebanking.protocol.AmountMto', sum: 10000.97, currency: {} },
        archived: false,
        cards: [],
        closeDate: null,
        contract: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
          commissionInterval: null,
          number: null,
          id: '127c2a7e-4e04-4c5e-96c8-2faab1556ba3',
          name: 'Привилегия'
        },
        details: [],
        displayName: 'Мастер счет в рублях',
        id: 'F71710FBFC614CC29030ACF227509AA1',
        isDefault: true,
        lastOperationDate: null,
        mainCard: null,
        masterAccountCards: [],
        name: 'Мастер счет в рублях',
        number: '40235280003523002672',
        openDate: new Date('Sat Dec 12 2015 00:00:00 GMT+0300'),
        overdraft: null,
        showOnMainPage: true,
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
          id: 'OPEN'
        },
        __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto'
      },
      details: 'Карта *3536 Перевод на другую карту (Р2Р)',
      feeAmount: null,
      id: '880947d1-bdd0-4c88-afd0-eb29283a1db5',
      isHold: true,
      order: null,
      processedDate: new Date('Wed Jun 27 2018 11:45:04 GMT+0300'),
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
        id: 'IN_PROGRESS'
      },
      statusName: 'В обработке',
      transactionAmount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: -59585,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          displaySymbol: '₽',
          name: 'Рубль России'
        }
      },
      transactionDate: new Date('Wed Jun 27 2018 11:45:04 GMT+0300')
    }, {
      zenAccount: {
        id: 'account'
      }
    })).toEqual({
      date: new Date('2018-06-27T11:45:04+03:00'),
      hold: true,
      income: 0,
      incomeAccount: 'account',
      outcome: 59585,
      outcomeAccount: 'account',
      _transferType: 'income',
      _transferId: 1530089104000
    })
  })
})
