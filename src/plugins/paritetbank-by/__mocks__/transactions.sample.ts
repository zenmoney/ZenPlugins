/**
 *
 * Additional data can be added here to expand known formats of bank API returns.
 *
 * Ensure that eath test data piece doesn't contain personal information, and each field match
 * other objects by references (e.g. contractNumber or syncIDs)
 *
 * **/

import { FetchTransaction } from '../types/fetch'

export const TEST_TRANSACTIONS = {
  // FOR CARD ACCOUNT
  8479823740280: [
    // [0] Transfer from card to account
    {
      paymentId: '1101',
      diType: 'DEPOSIT_OR_TRANSFER',
      payCode: 'P2A',
      paymentDate: 1760733347000,
      payName: 'Перевод с карты на счет',
      operationType: 'Cписание',
      amount: -1.45,
      currency: '978',
      personalAccount: '425367558876986',
      rrn: '1001',
      authCode: '0',
      commission: 0.0,
      commissionCurrency: '978',
      operationStatus: 'Исполнен',
      attrRecords: [
        {
          code: '745',
          name: 'Номер договора зачисления',
          value: '425367558876986'
        },
        {
          code: '989',
          name: 'ID операции',
          value: '0'
        },
        {
          code: '990',
          name: 'ID2 операции',
          value: '0'
        }
      ]
    },
    // [1] Payment at shop
    {
      contractNumber: '8479823740280',
      payCode: 'BPC',
      paymentDate: 1760639353000,
      sourceOfPayment: 'EUR card*2947',
      payName: 'SHOP "EVROOPT"',
      operationType: 'Пополнение',
      mcc: '5411',
      amount: -11.73,
      currency: '933',
      operationLocation: 'BY MINSK',
      servicePoint: 'SHOP "EVROOPT"',
      rrn: '1002',
      operationStatus: 'В обработке'
    },
    // [2] Payment at shop
    {
      contractNumber: '8479823740280',
      payCode: 'BPC',
      paymentDate: 1760636802000,
      sourceOfPayment: 'EUR card*2947',
      payName: 'SUPERMARKET "GREEN-25"',
      operationType: 'Пополнение',
      mcc: '5411',
      amount: -4.49,
      currency: '933',
      operationLocation: 'BY G. MINSK',
      servicePoint: 'SUPERMARKET "GREEN-25"',
      rrn: '1003',
      operationStatus: 'В обработке'
    },
    // [3] Card top-up in the bank
    {
      contractNumber: '8479823740280',
      payCode: 'BPC',
      paymentDate: 1760635997000,
      sourceOfPayment: 'EUR card*2947',
      payName: 'DO CBU-2 PARITETBANK PVN',
      operationType: 'Пополнение',
      mcc: '6010',
      amount: 20.00,
      currency: '933',
      operationLocation: 'BLR MINSK',
      servicePoint: 'DO CBU-2 PARITETBANK PVN',
      rrn: '1004',
      operationStatus: 'В обработке'
    },
    // [4] Cash withdraw in ATM
    {
      contractNumber: '8479823740280',
      payCode: 'BPC',
      paymentDate: 1760635229000,
      sourceOfPayment: 'EUR card*2947',
      payName: 'URM CBU 2 PARITET ATM',
      operationType: 'Пополнение',
      mcc: '6011',
      amount: -20.00,
      currency: '933',
      operationLocation: 'BY MINSK',
      servicePoint: 'URM CBU 2 PARITET ATM',
      rrn: '1005',
      operationStatus: 'В обработке'
    },
    // [5] Card top-up by ERIP
    {
      contractNumber: '8479823740280',
      payCode: 'BPC',
      paymentDate: 1760634806000,
      sourceOfPayment: 'EUR card*2947',
      payName: 'POPOLNENIE KART. PARITET',
      operationType: 'Пополнение',
      mcc: '4900',
      amount: 50.00,
      currency: '933',
      operationLocation: 'BLR MINSK',
      servicePoint: 'POPOLNENIE KART. PARITET',
      rrn: '1007',
      operationStatus: 'В обработке'
    }
  ] as FetchTransaction[],
  425367558876986: [
    // [0] Mobile top-up by ERIP
    {
      paymentId: '1102',
      diType: 'ERIP',
      payCode: 'ERIP',
      paymentDate: 1761226603000,
      payName: 'life:) по № телефона',
      operationType: 'Cписание',
      amount: -1.0,
      currency: '933',
      personalAccount: '25000',
      commission: 0.0,
      commissionCurrency: '933',
      operationStatus: 'Исполнен',
      attrRecords: [
        {
          code: '745',
          name: 'ЛС',
          value: '25000'
        },
        {
          code: '989',
          name: 'ID операции RETAIL',
          value: '0'
        }
      ]
    },
    // [1] Transfer from account to card
    {
      paymentId: '1103',
      diType: 'DEPOSIT_OR_TRANSFER',
      payCode: 'A2P',
      paymentDate: 1760733602000,
      payName: 'Перевод со счета на карту',
      operationType: 'Cписание',
      amount: -1.0,
      currency: '978',
      personalAccount: '0000********1111',
      commission: 0.0,
      commissionCurrency: '978',
      operationStatus: 'Исполнен',
      attrRecords: [
        {
          code: '989',
          name: 'ID операции',
          value: '0'
        },
        {
          code: '990',
          name: 'ID2 операции',
          value: '0'
        }
      ]
    },
    // [2] Transfer from card to account
    {
      contractNumber: '425367558876986',
      payCode: 'SCMAP',
      paymentDate: 1760733349000,
      sourceOfPayment: 'Текущий счет в белорусских рублях Online',
      payName: 'On-line пополнение со списанием со счета в другой валюте',
      operationType: 'Зачисление',
      amount: 5.0,
      currency: 'BYN',
      operationStatus: 'Исполнен',
      operationId: '1201'
    },
  ]
}
