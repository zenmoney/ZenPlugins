import { TransactionRecordV2, TransactionUtilPayV2 } from '../../../models'

describe('utilsTransactions', () => {
  const citycomTransaction: TransactionRecordV2 = {
    transactionId: 13430293896,
    accountId: 817314809,
    entryType: 'StandardMovement',
    movementId: 'd_13430293896',
    transactionDate: null,
    localTime: null,
    repeatTransaction: null,
    setAutomaticTransfer: null,
    payback: null,
    saveAsTemplate: null,
    shareReceipt: null,
    dispute: null,
    title: 'CITYCOM;22712683;თანხა:5.00;საკ.:0.50',
    subTitle: 'TV and Internet\r\n',
    amount: -5,
    currency: 'GEL',
    categoryCode: 'UTIL_PAY',
    subCategoryCode: 'TV_INTERNET',
    isSplit: false,
    transactionSubtype: 31,
    blockedMovementDate: null,
    blockedMovementCardId: null,
    blockedMovementIban: null,
    transactionStatus: 'Green',
    isDebit: true
  }

  const citycomExpectedResult: TransactionUtilPayV2 = {
    transaction: citycomTransaction,
    amount: -5,
    merchant: 'CITYCOM',
    merchantCountry: 'Georgia'
  }

  const tbilisiEnergyTransaction: TransactionRecordV2 = {
    transactionId: 13430293898,
    accountId: 817314809,
    entryType: 'StandardMovement',
    movementId: 'd_13430293898',
    transactionDate: null,
    localTime: null,
    repeatTransaction: null,
    setAutomaticTransfer: null,
    payback: null,
    saveAsTemplate: null,
    shareReceipt: null,
    dispute: null,
    title: 'Tbilisi Energy;1014;306404771;619674293;თანხა:7.56',
    subTitle: 'Gas\r\n',
    amount: -7.56,
    currency: 'GEL',
    categoryCode: 'UTIL_PAY',
    subCategoryCode: 'GAS',
    isSplit: false,
    transactionSubtype: 31,
    blockedMovementDate: null,
    blockedMovementCardId: null,
    blockedMovementIban: null,
    transactionStatus: 'Green',
    isDebit: true
  }

  const tbilisiEnergyExpectedResult: TransactionUtilPayV2 = {
    transaction: tbilisiEnergyTransaction,
    amount: -7.56,
    merchant: 'Tbilisi Energy',
    merchantCountry: 'Georgia'
  }

  const gwpTransaction: TransactionRecordV2 = {
    transactionId: 13482750611,
    accountId: 817314809,
    entryType: 'StandardMovement',
    movementId: 'd_13482750611',
    transactionDate: null,
    localTime: null,
    repeatTransaction: null,
    setAutomaticTransfer: null,
    payback: null,
    saveAsTemplate: null,
    shareReceipt: null,
    dispute: null,
    title: 'GWP;1014;6638043;თანხა:10.01',
    subTitle: 'Other payments\r\n',
    amount: -10.01,
    currency: 'GEL',
    categoryCode: 'UTIL_PAY',
    subCategoryCode: 'OTHER_UTILITIES',
    isSplit: false,
    transactionSubtype: 31,
    blockedMovementDate: null,
    blockedMovementCardId: null,
    blockedMovementIban: null,
    transactionStatus: 'Green',
    isDebit: true
  }

  const gwpExpectedResult: TransactionUtilPayV2 = {
    transaction: gwpTransaction,
    amount: -10.01,
    merchant: 'GWP',
    merchantCountry: 'Georgia'
  }

  const silkIdTransaction: TransactionRecordV2 = {
    transactionId: 13482750603,
    accountId: 817314809,
    entryType: 'StandardMovement',
    movementId: 'd_13482750603',
    transactionDate: null,
    localTime: null,
    repeatTransaction: null,
    setAutomaticTransfer: null,
    payback: null,
    saveAsTemplate: null,
    shareReceipt: null,
    dispute: null,
    title: 'Silk-ID;1014;301102120;თანხა:35.00',
    subTitle: 'TV and Internet\r\n',
    amount: -35,
    currency: 'GEL',
    categoryCode: 'UTIL_PAY',
    subCategoryCode: 'TV_INTERNET',
    isSplit: false,
    transactionSubtype: 31,
    blockedMovementDate: null,
    blockedMovementCardId: null,
    blockedMovementIban: null,
    transactionStatus: 'Green',
    isDebit: true
  }

  const silkIdExpectedResult: TransactionUtilPayV2 = {
    transaction: silkIdTransaction,
    amount: -35,
    merchant: 'Silk-ID',
    merchantCountry: 'Georgia'
  }

  const suite: Array<[TransactionRecordV2, TransactionUtilPayV2]> = [
    [citycomTransaction, citycomExpectedResult],
    [tbilisiEnergyTransaction, tbilisiEnergyExpectedResult],
    [gwpTransaction, gwpExpectedResult],
    [silkIdTransaction, silkIdExpectedResult]
  ]

  it.each(suite)('isUtilPay', (transaction, expectedResult) => {
    const result = TransactionUtilPayV2.isUtilPay(transaction)
    expect(result).toEqual(true)
  })

  it.each(suite)('getUtilPay', (transaction, expectedResult) => {
    const result = new TransactionUtilPayV2(transaction)
    expect(result).toEqual(expectedResult)
  })
})
