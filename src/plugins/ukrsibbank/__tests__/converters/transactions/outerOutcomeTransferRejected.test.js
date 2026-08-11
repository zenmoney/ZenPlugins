import { convertTransaction } from '../../../converters'

describe('converts outer outcome transfer', () => {
  const account = { id: '0123456789' }
  const transaction = {
    __type: 'com.ukrsibbank.client.protocol.transaction.TransactionMto',
    id: '15DCA10C443A4E29BBD72DEC9B6DC4A6',
    alias: 'Переказ на карту 537512****3456',
    statusText: 'Rejected',
    userTool: 'MC DEBIT EUROSAFE НПК **** 2345',
    manual: false,
    splitted: false,
    canPrint: false,
    canRepeat: false,
    canSplit: false,
    canSaveTemplate: false,
    canSaveStandingOrder: false,
    canSaveSubscription: false,
    canDelete: false,
    type: {
      __type: 'com.ukrsibbank.client.protocol.transaction.TransactionTypeMto',
      name: 'EXPENSE'
    },
    status: {
      __type: 'com.ukrsibbank.client.protocol.transaction.TransactionStatusMto',
      name: 'REJECTED'
    },
    category: null,
    operationDate: '2019-01-31T07:39:56.000Z',
    operationAmount: {
      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
      sum: 0.9,
      currency: {
        __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
        name: 'UAH'
      }
    },
    blockAmount: null,
    postAmount: null,
    sender: null,
    receiver: {
      __type: 'com.ukrsibbank.client.protocol.transaction.TransactionParticipantMto',
      name: null,
      tool: 'Карта **** 0123',
      bankName: null
    },
    parameters: []
  }

  it('returns null', () => {
    expect(convertTransaction(transaction, account)).toBeNull()
  })
})
