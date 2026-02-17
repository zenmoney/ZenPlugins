/**
 *
 * Additional data can be added here to expand known formats of bank API returns.
 *
 * Ensure that an eath test data piece doesn't contain personal information, and each field matches
 * other objects by references (e.g., contractNumber or syncIDs)
 *
 * **/

import { FetchCardTransaction, FetchStatementOperation } from '../types/fetch.types'

export const TEST_CARD_TRANSACTIONS: Record<string, FetchCardTransaction[]> = {
  Ch8xqhoVt978H4A8qpjgw4vGkhi9M35r2LL45im8: [
    // [0] - Transfer to card
    {
      effectiveDate: '2026-02-13T10:21:30',
      transacName: 'P2P DEBIT',
      amount: '3.00',
      currencyIso: 'BYN',
      cardAcceptor: 'PERSON TO PERSON ZEPTER',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС6012'
    },
    // [1] - Current account top-up
    {
      effectiveDate: '2026-02-12T21:46:07',
      transacName: 'POS PURCHASE ',
      amount: '1.42',
      currencyIso: 'BYN',
      cardAcceptor: 'PEREVOD ZEPTER',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС6012'
    },
    // [2] - Transfer to card
    {
      effectiveDate: '2026-02-12T20:58:51',
      transacName: 'P2P DEBIT',
      amount: '1.00',
      currencyIso: 'BYN',
      cardAcceptor: 'PERSON TO PERSON ZEPTER',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС6012'
    },
    // [3] - Payment at a shop
    {
      effectiveDate: '2026-02-12T17:53:47',
      transacName: 'POS PURCHASE ',
      amount: '3.19',
      currencyIso: 'BYN',
      cardAcceptor: 'SHOP KOPEECHKA',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС5411'
    },
    // [4] - ERIP top-up
    {
      effectiveDate: '2026-02-12T17:31:39',
      transacName: 'POS CASH DEPOSIT',
      amount: '10.00',
      currencyIso: 'BYN',
      cardAcceptor: 'INTERNET-BANKING ZEPTERBANK',
      repeatable: false,
      transOperType: 'credit',
      transMcc: 'МСС4900'
    }
  ],
  Y2errgEX8HfZ5efNYkj3XzirAqGrN7m523zs53P5: [
    // [0] - Payment at a shop
    {
      effectiveDate: '2026-02-13T10:23:28',
      transacName: 'POS PURCHASE ',
      amount: '3.19',
      currencyIso: 'BYN',
      cardAcceptor: 'SHOP KOPEECHKA',
      repeatable: false,
      transOperType: 'debit',
      transMcc: 'МСС5411'
    },
    // [1] - Incoming transfer from a card
    {
      effectiveDate: '2026-02-13T10:21:30',
      transacName: 'P2P CREDIT',
      amount: '3.00',
      currencyIso: 'BYN',
      cardAcceptor: 'PERSON TO PERSON ZEPTER',
      repeatable: false,
      transOperType: 'credit',
      transMcc: 'МСС6012'
    },
    // [2] - Incoming transfer from a card
    {
      effectiveDate: '2026-02-12T20:58:52',
      transacName: 'P2P CREDIT',
      amount: '1.00',
      currencyIso: 'BYN',
      cardAcceptor: 'PERSON TO PERSON ZEPTER',
      repeatable: false,
      transOperType: 'credit',
      transMcc: 'МСС6012'
    }
  ]
}

export const TEST_STATEMENT_TRANSACTIONS: Record<string, FetchStatementOperation[]> = {
  vc5275E7DJRNBWJaN9Ugpc86LZQ4F75Dda7xhb74: [
    // [0] - Outcoming transfer to a card
    {
      transactionDate: '2026-02-13T10:21:30',
      balanceDate: '2026-02-13',
      operationName: 'Списание P2P в устройствах банка',
      operationSum: '3.00',
      transactionSum: '3.00',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      cardPAN: '0000********1111',
      merchant: 'BLR MINSK',
      terminalLocation: 'PERSON TO PERSON ZEPTER',
      purpose: 'Списание денежных средств по картам <БелКарт> Банка согласно отчетам ОАО <Банковский процессинговый центр> от 13/02/2026',
      MCC: 'MCC 6012'
    },
    // [1] - Outcoming transfer to an account
    {
      transactionDate: '2026-02-12T21:46:07',
      balanceDate: '2026-02-13',
      operationName: 'Оплата товаров и услуг в устройствах банка',
      operationSum: '1.42',
      transactionSum: '1.42',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      cardPAN: '0000********1111',
      merchant: 'BLR MINSK',
      terminalLocation: 'PEREVOD ZEPTER',
      purpose: 'Списание денежных средств по картам <БелКарт> Банка согласно отчетам ОАО <Банковский процессинговый центр> от 13/02/2026',
      MCC: 'MCC 6012'
    },
    // [2] - Outcoming transfer to a card
    {
      transactionDate: '2026-02-12T20:58:51',
      balanceDate: '2026-02-13',
      operationName: 'Списание P2P в устройствах банка',
      operationSum: '1.00',
      transactionSum: '1.00',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      cardPAN: '0000********1111',
      merchant: 'BLR MINSK',
      terminalLocation: 'PERSON TO PERSON ZEPTER',
      purpose: 'Списание денежных средств по картам <БелКарт> Банка согласно отчетам ОАО <Банковский процессинговый центр> от 13/02/2026',
      MCC: 'MCC 6012'
    },
    // [3] - Payment at a shop
    {
      transactionDate: '2026-02-12T17:53:18',
      balanceDate: '2026-02-13',
      operationName: 'Оплата товаров и услуг в устройствах других банков',
      operationSum: '3.19',
      transactionSum: '3.19',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: -1,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      cardPAN: '0000********1111',
      merchant: 'BLR MINSK',
      terminalLocation: 'SHOP KOPEECHKA',
      purpose: 'Списание денежных средств по картам <БелКарт> Банка согласно отчетам ОАО <Банковский процессинговый центр> от 13/02/2026',
      MCC: 'MCC 5411'
    },
    // [4] - ERIP top-up
    {
      transactionDate: '2026-02-12T17:31:39',
      balanceDate: '2026-02-13',
      operationName: 'Пополнение карт-счета по карточке',
      operationSum: '10.00',
      transactionSum: '10.00',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: 1,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      cardPAN: '0000********1111',
      merchant: 'BLR MINSK',
      terminalLocation: 'INTERNET-BANKING ZEPTERBANK',
      purpose: 'Внесение наличных денежных средств в терминалах по картам <БелКарт> ЗАО <Цептер Банк> согласно отчетам ОАО <Банковский процессинговый центр> от 13/02/2026',
      MCC: 'MCC 4900'
    }
  ],
  '7eoTC9pk6A3o7EfqF7633NmBWjDW9DHp23V5k8KJ': [
    // [0] - Incoming transfer from a card
    {
      transactionDate: '2026-02-13T10:21:30',
      balanceDate: '2026-02-13',
      operationName: 'Зачисление P2P в устройствах банка (конверсия)',
      operationSum: '0.85',
      transactionSum: '3.00',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: 1,
      operationCurrency: '978',
      operationCurrencyIso: 'EUR',
      cardPAN: '0000********2222',
      merchant: 'BLR MINSK',
      terminalLocation: 'PERSON TO PERSON ZEPTER',
      purpose: 'Списание денежных средств по картам <БелКарт> Банка согласно отчетам ОАО <Банковский процессинговый центр> от 13/02/2026',
      MCC: 'MCC 6012'
    },
    // [1] - Incoming transfer from a card
    {
      transactionDate: '2026-02-12T20:58:52',
      balanceDate: '2026-02-13',
      operationName: 'Зачисление P2P в устройствах банка (конверсия)',
      operationSum: '0.28',
      transactionSum: '1.00',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: 1,
      operationCurrency: '978',
      operationCurrencyIso: 'EUR',
      cardPAN: '0000********2222',
      merchant: 'BLR MINSK',
      terminalLocation: 'PERSON TO PERSON ZEPTER',
      purpose: 'Списание денежных средств по картам <БелКарт> Банка согласно отчетам ОАО <Банковский процессинговый центр> от 13/02/2026',
      MCC: 'MCC 6012'
    }
  ],
  '3p6Kf9JU2RQW4HFE42QGVB556Sv4hgVxg4vZ7ZP2': [
    // [0] - Incoming transfer from a card
    {
      transactionDate: '2026-02-12T21:46:07',
      balanceDate: '2026-02-13',
      operationName: 'On-line пополнение вкладного/текущего счета (списание с карты)',
      operationSum: '1.42',
      transactionSum: '1.42',
      transactionCurrency: '933',
      transactionCurrencyISO: 'BYN',
      operationSign: 1,
      operationCurrency: '933',
      operationCurrencyIso: 'BYN',
      purpose: 'Online пополнение текущих счетов с банковской пластиковой карточки физических лиц ЗАО «ЦЕПТЕР БАНК»'
    }
  ]
}
