import { convertToZenMoneyTransaction } from '../../../converters'
import { AccountRecord } from '../../../models'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'

// Business Online statement records (GET /api/statement/{account}/{currency}/{from}/{to}), captured from the API.
// A collection order (ინკასო) made the bank convert EUR to GEL between the client's own sub-accounts
// (one document, two entries) and charge two fees in separate documents. All four have DocumentProductGroup CLN.
// Sanitized: names, tax ids, account numbers, document and entry ids replaced consistently;
// amounts scaled by a common factor; digits in free text replaced with zeros.
// BoG returns EntryId and DocumentKey as JSON numbers while models.ts declares strings, hence the cast.
const [eurLeg, gelLeg, collectionFee, conversionFee] = [
  {
    Currency: 'EUR',
    AccountID: 'GE00BG0000000000000000EUR',
    BeneficiaryDetails: {
      AccountNumber: '00000000000000000001',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: null,
      Name: ''
    },
    DocComment: null,
    DocumentActualDate: null,
    DocumentBeneficiaryInstitution: null,
    DocumentBranch: '502',
    DocumentCorrespondentAccountNumber: '00000000000000000001',
    DocumentCorrespondentBankCode: 'BAGAGE22',
    DocumentCorrespondentBankName: 'სს "საქართველოს ბანკი"',
    DocumentDepartment: 'CEN217',
    DocumentDestinationAmount: 1000.0,
    DocumentDestinationCurrency: 'EUR',
    DocumentExpiryDate: null,
    DocumentInformation: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000',
    DocumentIntermediaryInstitution: null,
    DocumentKey: 10000000001.0,
    DocumentNomination: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000',
    DocumentPayee: null,
    DocumentPayerInn: '000000001',
    DocumentPayerName: 'სახელი გვარი',
    DocumentProductGroup: 'CLN',
    DocumentRate: null,
    DocumentRateLimit: null,
    DocumentReceiveDate: '2025-05-06T00:00:00',
    DocumentRegistrationRate: null,
    DocumentSenderInstitution: null,
    DocumentSourceAmount: 1000.0,
    DocumentSourceCurrency: 'EUR',
    DocumentTreasuryCode: null,
    DocumentValueDate: '2025-05-06T00:00:00',
    EntryAccountNumber: '00000000000000000001',
    EntryAccountPoint: 'CENTRAL000',
    EntryAmount: -1000.0,
    EntryAmountBase: 3116.7,
    EntryAmountCredit: 0.0,
    EntryAmountCreditBase: null,
    EntryAmountDebit: 1000.0,
    EntryAmountDebitBase: 3116.7,
    EntryComment: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000',
    EntryDate: '2025-05-06T00:00:00',
    EntryDepartment: 'CEN217',
    EntryDocumentNumber: '000000000001',
    EntryId: 100000000001.0,
    SenderDetails: {
      AccountNumber: 'GE00BG0000000000000000EUR',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: '000000001',
      Name: 'სახელი გვარი'
    }
  },
  {
    Currency: 'GEL',
    AccountID: 'GE00BG0000000000000000GEL',
    BeneficiaryDetails: {
      AccountNumber: 'GE00BG0000000000000000GEL',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: '000000001',
      Name: 'სახელი გვარი'
    },
    DocComment: null,
    DocumentActualDate: null,
    DocumentBeneficiaryInstitution: null,
    DocumentBranch: '502',
    DocumentCorrespondentAccountNumber: '00000000000000000002',
    DocumentCorrespondentBankCode: 'BAGAGE22',
    DocumentCorrespondentBankName: 'სს "საქართველოს ბანკი"',
    DocumentDepartment: 'CEN217',
    DocumentDestinationAmount: 3116.7,
    DocumentDestinationCurrency: 'GEL',
    DocumentExpiryDate: null,
    DocumentInformation: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000',
    DocumentIntermediaryInstitution: null,
    DocumentKey: 10000000001.0,
    DocumentNomination: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000',
    DocumentPayee: null,
    DocumentPayerInn: null,
    DocumentPayerName: null,
    DocumentProductGroup: 'CLN',
    DocumentRate: null,
    DocumentRateLimit: null,
    DocumentReceiveDate: '2025-05-06T00:00:00',
    DocumentRegistrationRate: null,
    DocumentSenderInstitution: null,
    DocumentSourceAmount: 3116.7,
    DocumentSourceCurrency: 'GEL',
    DocumentTreasuryCode: null,
    DocumentValueDate: '2025-05-06T00:00:00',
    EntryAccountNumber: '00000000000000000002',
    EntryAccountPoint: 'CENTRAL000',
    EntryAmount: 3116.7,
    EntryAmountBase: 3116.7,
    EntryAmountCredit: 3116.7,
    EntryAmountCreditBase: 3116.7,
    EntryAmountDebit: 0.0,
    EntryAmountDebitBase: null,
    EntryComment: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000',
    EntryDate: '2025-05-06T00:00:00',
    EntryDepartment: 'CEN217',
    EntryDocumentNumber: '000000000001',
    EntryId: 100000000002.0,
    SenderDetails: {
      AccountNumber: '00000000000000000002',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: null,
      Name: ''
    }
  },
  {
    Currency: 'GEL',
    AccountID: 'GE00BG0000000000000000GEL',
    BeneficiaryDetails: {
      AccountNumber: '00000000000000000003',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: null,
      Name: ''
    },
    DocComment: null,
    DocumentActualDate: null,
    DocumentBeneficiaryInstitution: null,
    DocumentBranch: '502',
    DocumentCorrespondentAccountNumber: '00000000000000000003',
    DocumentCorrespondentBankCode: 'BAGAGE22',
    DocumentCorrespondentBankName: 'სს "საქართველოს ბანკი"',
    DocumentDepartment: 'CEN217',
    DocumentDestinationAmount: 6.49,
    DocumentDestinationCurrency: 'GEL',
    DocumentExpiryDate: null,
    DocumentInformation: 'ინკასოს საკომისიოს გადატანა',
    DocumentIntermediaryInstitution: null,
    DocumentKey: 10000000002.0,
    DocumentNomination: 'ინკასოს საკომისიოს გადატანა',
    DocumentPayee: null,
    DocumentPayerInn: '000000001',
    DocumentPayerName: 'სახელი გვარი',
    DocumentProductGroup: 'CLN',
    DocumentRate: null,
    DocumentRateLimit: null,
    DocumentReceiveDate: '2025-05-07T00:00:00',
    DocumentRegistrationRate: null,
    DocumentSenderInstitution: null,
    DocumentSourceAmount: 6.49,
    DocumentSourceCurrency: 'GEL',
    DocumentTreasuryCode: null,
    DocumentValueDate: '2025-05-07T00:00:00',
    EntryAccountNumber: '00000000000000000003',
    EntryAccountPoint: 'CENTRAL000',
    EntryAmount: -6.49,
    EntryAmountBase: 6.49,
    EntryAmountCredit: 0.0,
    EntryAmountCreditBase: null,
    EntryAmountDebit: 6.49,
    EntryAmountDebitBase: 6.49,
    EntryComment: 'ინკასოს საკომისიოს გადატანა',
    EntryDate: '2025-05-07T00:00:00',
    EntryDepartment: 'CEN217',
    EntryDocumentNumber: '00000002',
    EntryId: 100000000003.0,
    SenderDetails: {
      AccountNumber: 'GE00BG0000000000000000GEL',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: '000000001',
      Name: 'სახელი გვარი'
    }
  },
  {
    Currency: 'GEL',
    AccountID: 'GE00BG0000000000000000GEL',
    BeneficiaryDetails: {
      AccountNumber: '00000000000000000004',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: null,
      Name: ''
    },
    DocComment: null,
    DocumentActualDate: null,
    DocumentBeneficiaryInstitution: null,
    DocumentBranch: '502',
    DocumentCorrespondentAccountNumber: '00000000000000000004',
    DocumentCorrespondentBankCode: 'BAGAGE22',
    DocumentCorrespondentBankName: 'სს "საქართველოს ბანკი"',
    DocumentDepartment: 'CEN217',
    DocumentDestinationAmount: 46.73,
    DocumentDestinationCurrency: 'GEL',
    DocumentExpiryDate: null,
    DocumentInformation: 'ინკასოს დასაფარად კონვერტაციის საკომისიოს გადატანა',
    DocumentIntermediaryInstitution: null,
    DocumentKey: 10000000003.0,
    DocumentNomination: 'ინკასოს დასაფარად კონვერტაციის საკომისიოს გადატანა',
    DocumentPayee: null,
    DocumentPayerInn: '000000001',
    DocumentPayerName: 'სახელი გვარი',
    DocumentProductGroup: 'CLN',
    DocumentRate: null,
    DocumentRateLimit: null,
    DocumentReceiveDate: '2025-05-07T00:00:00',
    DocumentRegistrationRate: null,
    DocumentSenderInstitution: null,
    DocumentSourceAmount: 46.73,
    DocumentSourceCurrency: 'GEL',
    DocumentTreasuryCode: null,
    DocumentValueDate: '2025-05-07T00:00:00',
    EntryAccountNumber: '00000000000000000004',
    EntryAccountPoint: 'CENTRAL000',
    EntryAmount: -46.73,
    EntryAmountBase: 46.73,
    EntryAmountCredit: 0.0,
    EntryAmountCreditBase: null,
    EntryAmountDebit: 46.73,
    EntryAmountDebitBase: 46.73,
    EntryComment: 'ინკასოს დასაფარად კონვერტაციის საკომისიოს გადატანა',
    EntryDate: '2025-05-07T00:00:00',
    EntryDepartment: 'CEN217',
    EntryDocumentNumber: '00000003',
    EntryId: 100000000004.0,
    SenderDetails: {
      AccountNumber: 'GE00BG0000000000000000GEL',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"',
      Inn: '000000001',
      Name: 'სახელი გვარი'
    }
  }
] as unknown as AccountRecord[]

const eurOutcome = {
  hold: false,
  date: new Date('2025-05-06T00:00:00'),
  movements: [
    {
      id: '100000000001',
      account: { id: 'GE00BG0000000000000000EUR' },
      sum: -1000,
      fee: 0,
      invoice: null
    }
  ],
  merchant: null,
  comment: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000'
}

const gelIncome = {
  hold: false,
  date: new Date('2025-05-06T00:00:00'),
  movements: [
    {
      id: '100000000002',
      account: { id: 'GE00BG0000000000000000GEL' },
      sum: 3116.7,
      fee: 0,
      invoice: null
    }
  ],
  merchant: null,
  comment: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000'
}

const collectionFeeOutcome = {
  hold: false,
  date: new Date('2025-05-07T00:00:00'),
  movements: [
    {
      id: '100000000003',
      account: { id: 'GE00BG0000000000000000GEL' },
      sum: -6.49,
      fee: 0,
      invoice: null
    }
  ],
  merchant: null,
  comment: 'ინკასოს საკომისიოს გადატანა'
}

const conversionFeeOutcome = {
  hold: false,
  date: new Date('2025-05-07T00:00:00'),
  movements: [
    {
      id: '100000000004',
      account: { id: 'GE00BG0000000000000000GEL' },
      sum: -46.73,
      fee: 0,
      invoice: null
    }
  ],
  merchant: null,
  comment: 'ინკასოს დასაფარად კონვერტაციის საკომისიოს გადატანა'
}

const records = [eurLeg, gelLeg, collectionFee, conversionFee]

describe('convertToZenMoneyTransaction: collection order (CLN)', () => {
  it.each([
    ['EUR leg of the conversion', eurLeg, { ...eurOutcome, groupKeys: ['10000000001'] }],
    ['GEL leg of the conversion', gelLeg, { ...gelIncome, groupKeys: ['10000000001'] }],
    ['collection fee', collectionFee, { ...collectionFeeOutcome, groupKeys: ['10000000002'] }],
    ['conversion fee', conversionFee, { ...conversionFeeOutcome, groupKeys: ['10000000003'] }]
  ])('converts %s', (_, record, expected) => {
    expect(convertToZenMoneyTransaction(record, records)).toEqual(expected)
  })

  it('merges both legs of the conversion into a transfer and keeps fees as expenses', () => {
    const transactions = adjustTransactions({
      transactions: records.map(record => convertToZenMoneyTransaction(record, records))
    })
    expect(transactions).toEqual([
      {
        hold: false,
        date: new Date('2025-05-06T00:00:00'),
        movements: [eurOutcome.movements[0], gelIncome.movements[0]],
        merchant: null,
        comment: 'კონვერტაცია ინკასოს საფუძველზე, კურსი: 0.0000'
      },
      collectionFeeOutcome,
      conversionFeeOutcome
    ])
  })

  it.each([
    ['EUR', eurLeg, eurOutcome],
    ['GEL', gelLeg, gelIncome]
  ])('keeps the %s leg as is when the other leg is not in the statement', (_, record, expected) => {
    const transactions = adjustTransactions({
      transactions: [convertToZenMoneyTransaction(record, [record])]
    })
    expect(transactions).toEqual([expected])
  })
})
