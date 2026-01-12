/**
 *
 * Additional data can be added here to expand known formats of bank API returns.
 *
 * Ensure that eath test data piece doesn't contain personal information, and each field match
 * other objects by references (e.g. contractNumber or syncIDs)
 *
 * **/

import { FetchCardAccount, FetchCurrentAccount } from '../types/fetch'

export const TEST_ACCOUNTS = {
  CARD: [
    {
      currency: 'EUR',
      openDate: 1760313600000,
      accountNumber: 'BY00POIS00000000000000001111',
      productCode: 10806,
      productName: 'Личная карточка Virtuon ONLINE - EUR (SV)',
      contractNumber: '8479823740280',
      cards: [
        {
          cardNumberMasked: '0000********1111',
          cardHash: 'IvmnkjtdvtVfazRYBqBVjgwgdf8q1A5HmcCUA+6uG834bedflLuYOrlT7nU+tMSC3U1oIFGRo8gQ==',
          cardStatus: 'ACTIVE',
          expireDate: 1856552400000,
          owner: 'JOHN DOE',
          isVirtual: true,
          balance: 7.12,
          currency: 'EUR',
          stateSignature: 'BETRAY',
          isAdditional: false,
          cardId: 508171111,
          paySystemName: 'MasterCard',
          productCode: 40016,
          name: 'EUR',
          komplatStatus: '0',
          contractNumber: '8479823740280'
        }
      ],
      ibanNum: 'BY00POIS00000000000000001111',
      contractType: 1,
      isOverdraft: false,
      contractNumberHash: 'IvmnkjtdvtVfazRYBqBVjgwgdf8q1A5HmcCUA+6uG834bedflLuYOrlT7nU+tMSC3U1oIFGRo8gQ=='
    }
  ] as FetchCardAccount[],
  CURRENT: [
    {
      currency: 'BYN',
      openDate: 1760313600000,
      accountNumber: 'BY00POIS00000000000000002222',
      productCode: 1004,
      productName: 'Текущий счет в белорусских рублях Online',
      contractNumber: '425367558876986',
      ibanNum: 'BY00POIS00000000000000002222',
      contractType: 5,
      contractNumberHash: 'IvmnkjtdvtVfazRYBqBVjgwgdf8q1A5HmcCUA+6uG834bedflLuYOrlT7nU+tMSC3U1oIFGRo8gQ==',
      balanceAmount: 1.55,
      accruedInterest: 0,
      contractId: '234234',
      interestRate: 0
    }
  ] as FetchCurrentAccount[]
}
