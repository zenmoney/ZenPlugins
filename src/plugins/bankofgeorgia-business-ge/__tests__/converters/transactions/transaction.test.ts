import { convertToZenMoneyTransaction } from '../../../converters'
import { AccountRecord } from '../../../models'
import { AccountType } from '../../../../../types/zenmoney'

describe('convertToZenMoneyTransaction', () => {
  it.each([
    ['outgoing transfer', {
      Currency: 'GEL',
      AccountID: 'GE00BG0000000000000000GEL',
      EntryDate: '2023-01-01T00:00:00',
      EntryDocumentNumber: '0001',
      EntryAccountNumber: '00000000000000000000',
      EntryAmountDebit: 100.0,
      EntryAmountDebitBase: 100.0,
      EntryAmountCredit: 0.0,
      EntryAmountBase: 100.0,
      EntryAmount: -100.0,
      EntryComment: 'Tax Payment',
      EntryDepartment: 'DEPT00',
      EntryAccountPoint: 'BANK',
      DocumentProductGroup: 'PMD',
      DocumentValueDate: '2023-01-01T00:00:00',
      SenderDetails: {
        Name: 'COMPANY NAME LLC',
        Inn: '000000000',
        AccountNumber: 'GE00BG0000000000000000GEL',
        BankCode: 'BANKGE22',
        BankName: 'BANK OF GEORGIA'
      },
      BeneficiaryDetails: {
        Name: 'TAX DEPARTMENT',
        AccountNumber: '000000000',
        BankCode: 'TRESGE22',
        BankName: 'STATE TREASURY'
      },
      DocumentTreasuryCode: '000000000',
      DocumentNomination: 'Tax Payment',
      DocumentInformation: 'Tax Payment',
      DocumentSourceAmount: 100.0,
      DocumentSourceCurrency: 'GEL',
      DocumentDestinationAmount: 100.0,
      DocumentDestinationCurrency: 'GEL',
      DocumentReceiveDate: '2023-01-01T00:00:00',
      DocumentBranch: '000',
      DocumentDepartment: 'DEPT00',
      DocumentActualDate: '2023-01-01T00:00:00',
      DocumentCorrespondentAccountNumber: '000000000',
      DocumentCorrespondentBankCode: 'TRESGE22',
      DocumentCorrespondentBankName: 'STATE TREASURY',
      DocumentKey: '00000000000.0',
      EntryId: '12300000000.0',
      DocumentPayerName: 'COMPANY NAME LLC',
      DocumentPayerInn: '000000000',
      DocComment: 'TAX DEPARTMENT 000000000: 000000000 STATE TREASURY TRESGE22'
    }, {
      hold: false,
      date: new Date('2023-01-01T00:00:00'),
      movements: [
        {
          id: '12300000000.0',
          account: { id: 'GE00BG0000000000000000GEL' },
          sum: -100,
          fee: 0,
          invoice: null
        },
        {
          id: null,
          account: {
            type: AccountType.checking,
            instrument: 'GEL',
            company: { id: 'TAX DEPARTMENT' },
            syncIds: ['000000000']
          },
          sum: 100,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        country: null,
        city: null,
        title: 'TAX DEPARTMENT',
        mcc: null,
        location: null
      },
      comment: 'Tax Payment'
    }],

    ['incoming transfer', {
      Currency: 'USD',
      AccountID: 'GE00BG0000000000000000USD',
      EntryDate: '2023-01-02T00:00:00',
      EntryDocumentNumber: 'PMI000000000',
      EntryAccountNumber: 'GE00BG0000000000000001USD',
      EntryAmountDebit: 0.0,
      EntryAmountCredit: 100.0,
      EntryAmountCreditBase: 250.0,
      EntryAmountBase: 250.0,
      EntryAmount: 100.0,
      EntryComment: 'Transfer',
      EntryDepartment: 'DEPT00',
      EntryAccountPoint: 'BRANCH00',
      DocumentProductGroup: 'PMI',
      DocumentValueDate: '2023-01-02T00:00:00',
      SenderDetails: {
        Name: 'JOHN DOE',
        Inn: '000000000',
        AccountNumber: 'GE00BG0000000000000001USD',
        BankCode: 'BANKGE22',
        BankName: 'BANK OF GEORGIA'
      },
      BeneficiaryDetails: {
        Name: 'COMPANY NAME LLC',
        Inn: '000000000',
        AccountNumber: 'GE00BG0000000000000000USD',
        BankCode: 'BANKGE22',
        BankName: 'BANK OF GEORGIA'
      },
      DocumentNomination: 'Transfer',
      DocumentInformation: 'Transfer',
      DocumentSourceAmount: 100.0,
      DocumentSourceCurrency: 'USD',
      DocumentDestinationAmount: 100.0,
      DocumentDestinationCurrency: 'USD',
      DocumentReceiveDate: '2023-01-02T00:00:00',
      DocumentBranch: '000',
      DocumentDepartment: 'DEPT00',
      DocumentCorrespondentAccountNumber: 'GE00BG0000000000000001USD',
      DocumentCorrespondentBankCode: 'BANKGE22',
      DocumentCorrespondentBankName: 'BANK OF GEORGIA',
      DocumentKey: '00000000000.0',
      EntryId: '43200000000.0',
      DocumentPayerName: 'JOHN DOE',
      DocumentPayerInn: '000000000',
      DocComment: 'JOHN DOE GE00BG0000000000000001USD BANK OF GEORGIA BANKGE22'
    }, {
      hold: false,
      date: new Date('2023-01-02T00:00:00'),
      movements: [
        {
          id: '43200000000.0',
          account: { id: 'GE00BG0000000000000000USD' },
          sum: 100,
          invoice: null,
          fee: 0
        },
        {
          id: null,
          account: {
            type: AccountType.checking,
            instrument: 'USD',
            company: { id: 'JOHN DOE' },
            syncIds: ['GE00BG0000000000000001USD']
          },
          invoice: null,
          sum: 0,
          fee: 0
        }
      ],
      merchant: {
        country: null,
        city: null,
        title: 'COMPANY NAME LLC',
        mcc: null,
        location: null
      },
      comment: 'Transfer'
    }],

    ['exchange', {
      Currency: 'GEL',
      AccountID: 'GE00BG0000000000000000GEL',
      EntryDate: '2023-01-03T00:00:00',
      EntryDocumentNumber: '0000000000000000',
      EntryAccountNumber: '00000000000000000000',
      EntryAmountDebit: 0.0,
      EntryAmountCredit: 100.0,
      EntryAmountCreditBase: 100.0,
      EntryAmountBase: 100.0,
      EntryAmount: 100.0,
      EntryComment: 'Currency exchange. Rate: 2.500 Counter amount: USD40.00. Conversion',
      EntryDepartment: 'DEPT00',
      EntryAccountPoint: 'BRANCH00',
      DocumentProductGroup: 'CCO',
      SenderDetails: {
        Name: 'COMPANY NAME LLC',
        Inn: '000000000',
        AccountNumber: 'GE00BG0000000000000000USD',
        BankCode: 'BANKGE22',
        BankName: 'BANK OF GEORGIA'
      },
      BeneficiaryDetails: {
        Name: 'COMPANY NAME LLC',
        Inn: '000000000',
        AccountNumber: 'GE00BG0000000000000000GEL',
        BankCode: 'BANKGE22',
        BankName: 'BANK OF GEORGIA'
      },
      DocumentNomination: 'Conversion',
      DocumentInformation: 'Conversion',
      DocumentSourceAmount: 100.0,
      DocumentSourceCurrency: 'GEL',
      DocumentDestinationAmount: 40.00,
      DocumentDestinationCurrency: 'USD',
      DocumentReceiveDate: '2023-01-03T00:00:00',
      DocumentBranch: '000',
      DocumentDepartment: 'DEPT00',
      DocumentActualDate: '2023-01-03T00:00:00',
      DocumentExpiryDate: '2023-01-13T00:00:00',
      DocumentRateLimit: 2.500,
      DocumentRate: 2.500,
      DocumentRegistrationRate: 2.500,
      DocumentCorrespondentAccountNumber: 'GE00BG0000000000000000USD',
      DocumentCorrespondentBankCode: 'BANKGE22',
      DocumentCorrespondentBankName: 'BANK OF GEORGIA',
      DocumentKey: '00000000000.0',
      EntryId: '00000000000.0'
    }, {
      hold: false,
      date: new Date('2023-01-03T00:00:00'),
      movements: [
        {
          id: '00000000000.0',
          account: { id: 'GE00BG0000000000000000GEL' },
          sum: 100,
          fee: 0,
          invoice: null
        },
        {
          id: null,
          account: { id: 'GE00BG0000000000000000USD' },
          sum: -40,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        country: null,
        city: null,
        title: 'COMPANY NAME LLC',
        mcc: null,
        location: null
      },
      comment: 'Curren' +
        'cy exchange. Rate: 2.500 Counter amount: USD40.00. Conversion'
    }],

    ['fee', {
      Currency: 'GEL',
      AccountID: 'GE00BG0000000000000000GEL',
      EntryDate: '2023-01-04T00:00:00',
      EntryDocumentNumber: 'FEE',
      EntryAccountNumber: '00000000000000000000',
      EntryAmountDebit: 5.0,
      EntryAmountDebitBase: 5.0,
      EntryAmountCredit: 0.0,
      EntryAmountBase: 5.0,
      EntryAmount: -5.0,
      EntryComment: 'Business package service fee',
      EntryDepartment: 'DEPT00',
      EntryAccountPoint: 'BRANCH00',
      DocumentProductGroup: 'FEE',
      DocumentValueDate: '2023-01-04T00:00:00',
      SenderDetails: {
        Name: 'COMPANY NAME LLC',
        Inn: '000000000',
        AccountNumber: 'GE00BG0000000000000000GEL',
        BankCode: 'BANKGE22',
        BankName: 'BANK OF GEORGIA'
      },
      BeneficiaryDetails: {
        Name: '',
        AccountNumber: '00000000000000000000',
        BankCode: 'BANKGE22',
        BankName: 'BANK OF GEORGIA'
      },
      DocumentNomination: 'Business package service fee',
      DocumentInformation: 'Business package service fee',
      DocumentSourceAmount: 5.0,
      DocumentSourceCurrency: 'GEL',
      DocumentDestinationAmount: 5.0,
      DocumentDestinationCurrency: 'GEL',
      DocumentReceiveDate: '2023-01-05T00:00:00',
      DocumentBranch: '000',
      DocumentDepartment: 'DEPT00',
      DocumentCorrespondentAccountNumber: '00000000000000000000',
      DocumentCorrespondentBankCode: 'BANKGE22',
      DocumentCorrespondentBankName: 'BANK OF GEORGIA',
      DocumentKey: '00000000000.0',
      EntryId: '98700000000.0',
      DocumentPayerName: 'COMPANY NAME LLC',
      DocumentPayerInn: '000000000'
    }, {
      hold: false,
      date: new Date('2023-01-04T00:00:00'),
      movements: [
        {
          id: '98700000000.0',
          account: { id: 'GE00BG0000000000000000GEL' },
          sum: 0,
          fee: 5,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Business package service fee'
    }]
  ])('converts %s', (_, accountRecord, expectedTransaction) => {
    expect(convertToZenMoneyTransaction(accountRecord as AccountRecord, [accountRecord as AccountRecord])).toEqual(expectedTransaction)
  })
})
