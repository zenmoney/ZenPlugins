/**
 *
 * Additional data can be added here to expand known formats of bank API returns.
 *
 * Ensure that an eath test data piece doesn't contain personal information, and each field matches
 * other objects by references (e.g., contractNumber or syncIDs)
 *
 * **/

import { FetchCardAccount, FetchCurrentAccount } from '../types/fetch.types'

export const TEST_ACCOUNTS: { CARD: FetchCardAccount[], CURRENT: FetchCurrentAccount[] } = {
  CARD: [
    {
      contractType: 1,
      contractKindName: 'Национальный BYN SV',
      status: '2',
      cardPAN: '0000********1111',
      expiryDate: '2030-10-31',
      cardProductKindName: 'Белкарт "Национальный" BYN SV',
      stateSignature: 'BETRAY',
      amount: '1.39',
      currency: 933,
      currencyIso: 'BYN',
      ibanNum: 'BY22ZEPT00000000000000001111',
      contractNumber: '5053951600195',
      productId: 'vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74',
      productCardId: 'Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8'
    },
    {
      contractType: 1,
      contractKindName: 'Международный EUR SV',
      status: '2',
      cardPAN: '0000********2222',
      expiryDate: '2030-10-31',
      cardProductKindName: 'Visa Gold "Международный" EUR SV',
      stateSignature: 'BETRAY',
      amount: '0.16',
      currency: 978,
      currencyIso: 'EUR',
      ibanNum: 'BY22ZEPT00000000000000002222',
      contractNumber: '5062592006073',
      productId: '7eoTC9pk6A3o7EfqF7633NmBWjDW9DHp23V5k8KJ',
      productCardId: 'Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5'
    }
  ],
  CURRENT: [
    {
      contractType: 5,
      contractKindName: 'Текущий счет в белорусских рублях',
      status: '2',
      contractCurrency: 933,
      contractCurrencyIso: 'BYN',
      contractNumber: '5050100107306',
      contractAccount: 'BY00ZEPT00000000000000001111',
      contractCurrentRest: '1.42',
      ibanNum: 'BY11ZEPT00000000000000001111',
      productId: '3p6Kf9JU2RQW4HFE42QGVB556Sv4hgVxg4vZ7ZP2'
    }
  ]
}
