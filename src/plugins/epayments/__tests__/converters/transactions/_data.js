describe('dummy', () => { // Только для того чтобы jest не ругался что в файле должен быть тест
  it('should be true', () => {
    expect(true).toEqual(true)
  })
})

export const cashWithdrawalApiTransaction = {
  transactionId: '111111111',
  direction: 'Out',
  operation: {
    date: '2018-11-12T13:27:47.237Z',
    type: 'CardAtmOperation',
    typeCode: 'Atm',
    displayName: 'ATM-transaction'
  },
  source: {
    type: 'card',
    identity: '1234xxxxxxxx5678'
  },
  destination: null,
  details: 'SICH BANK PAT UKR (1458.60 UAH)',
  currency: 'USD',
  fee: 2.60,
  total: 56.22,
  amount: 53.62,
  txnAmount: 1458.60,
  txnCurrency: 'UAH',
  billConvRate: 27.202536,
  state: 'Confirm'
}

export const cardLoadApiTransactions = [
  {
    transactionId: '222222222',
    direction: 'In',
    operation: {
      date: '2018-02-10T00:04:26.403Z',
      type: 'CardLoad',
      typeCode: 'Load',
      displayName: 'ePayments card load'
    },
    source: {
      type: 'card',
      identity: '1234xxxxxxxx5678'
    },
    details: 'Load (50.00 USD)',
    currency: 'USD',
    fee: 0.00,
    total: 50.0,
    amount: 50.0,
    txnAmount: 50.0,
    txnCurrency: 'USD',
    state: 'Confirm'
  },
  {
    transactionId: '333333333',
    direction: 'Out',
    operation: {
      date: '2018-02-10T00:04:24.367Z',
      type: '5',
      typeCode: 'Other',
      displayName: 'ePayments card load'
    },
    source: {
      type: 'ewallet',
      identity: '000-123456'
    },
    details: 'Card load to ePayments Card',
    currency: 'USD',
    fee: 0.0,
    total: 50.0,
    amount: 50.0,
    txnAmount: 0.0,
    txnCurrency: null,
    state: null
  }
]

export const cardUnloadApiTransactions = [
  {
    transactionId: '444444444',
    direction: 'Out',
    operation: {
      date: '2019-06-27T08:26:45.64Z',
      type: 'CardUnload',
      typeCode: 'Unload',
      displayName: 'A transfer from the ePayments card'
    },
    source: {
      type: 'card',
      identity: '1234xxxxxxxx5678'
    },
    details: 'Unload (10.00 USD)',
    currency: 'USD',
    fee: 0.00,
    total: 10.00,
    amount: 10.00,
    unRead: false,
    txnAmount: 10.00,
    txnCurrency: 'USD',
    billConvRate: 1.000000,
    state: 'Confirm'
  },
  {
    transactionId: '555555555',
    direction: 'In',
    operation: {
      date: '2019-06-27T08:26:40.83Z',
      type: '6',
      typeCode: 'Other',

      displayName: 'e-Wallet load from the ePayments card'
    },
    source: {
      type: 'ewallet',
      identity: '000-123456'
    },
    details: 'Card unload from ePayments Card',
    currency: 'USD',
    fee: 0.0,
    total: 10.0000,
    amount: 10.0000,
    unRead: true,
    txnAmount: 0.0,
    txnCurrency: null,
    refunded: null,
    billConvRate: 0.0,
    state: null
  }
]

export const walletsCurrencyExchangeApiTransactions = [
  {
    transactionId: '666666666',
    direction: 'In',
    operation: {
      date: '2019-06-27T08:02:45.373Z',
      type: '10',
      typeCode: 'Other',
      displayName: 'Transfer between the e-Wallet sections'
    },
    source: {
      type: 'ewallet',
      identity: '000-123456'
    },
    details: 'Currency exchange from USD to EUR. Rate = 0.8568',
    currency: 'EUR',
    fee: 0.0,
    total: 4.28,
    amount: 4.28,
    txnAmount: 0.0,
    txnCurrency: null,
    state: null,
    billConvRate: 0.0
  },
  {
    transactionId: '777777777',
    direction: 'Out',
    operation: {
      date: '2019-06-27T08:02:45.373Z',
      type: '10',
      typeCode: 'Other',
      displayName: 'Transfer between the e-Wallet sections'
    },
    source: {
      type: 'ewallet',
      identity: '000-123456'
    },
    details: 'Currency exchange from USD to EUR. Rate = 0.8568',
    currency: 'USD',
    fee: 0.0,
    total: 5.00,
    amount: 5.00,
    txnAmount: 0.0,
    txnCurrency: null,
    state: null,
    billConvRate: 0.0
  }
]

export const cardPosApiTransaction = {
  transactionId: '888888888',
  direction: 'Out',
  operation: {
    date: '2018-02-09T13:08:09.833Z',
    type: 'CardPostOperation',
    typeCode: 'Pos',
    displayName: 'POS-transaction'
  },
  source: {
    type: 'card',
    identity: '1234xxxxxxxx5678'
  },
  details: 'SUPERMARKET FURSHET KYIV UKR (273.82 UAH)',
  currency: 'USD',
  fee: 0.26,
  total: 10.39,
  amount: 10.13,
  unRead: false,
  txnAmount: 273.82,
  txnCurrency: 'UAH',
  startBalance: 28.23,
  endBalance: 17.84,
  billConvRate: 27.030602,
  state: 'Confirm'
}
