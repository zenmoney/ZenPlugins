import { convertToZenMoneyTransaction } from '../../../converters'
import { AccountRecord } from '../../../models'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'

it('preserves the recorded CCO debit without fabricating a second movement', () => {
  // mail_inbound 207409, build 43: complete record; account/currency added as injectAccountInfo does.
  // Names, tax identifiers and account numbers replaced consistently for master.
  // The full source counterpart is absent from the truncated log, so no paired fixture is invented.
  const record = {
    EntryDate: '2026-09-15T00:00:00',
    EntryDocumentNumber: '2609151920000027',
    EntryAccountNumber: '00000000000000000001',
    EntryAmountDebit: 1,
    EntryAmountDebitBase: 2.61,
    EntryAmountCredit: 0,
    EntryAmountCreditBase: null,
    EntryAmountBase: 2.61,
    EntryAmount: -1,
    EntryComment: 'ვალუტის გაცვლითი ოპერაცია. კურსი:2.579 კონტრთანხა: GEL2.57. Currency Exchange',
    EntryDepartment: 'BATU08',
    EntryAccountPoint: 'BATUMI08',
    DocumentProductGroup: 'CCO',
    DocumentValueDate: '2026-09-15T00:00:00',
    SenderDetails: {
      Name: 'Test Customer',
      Inn: '000000001',
      AccountNumber: 'GE00BG0000000000000000USD',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"'
    },
    BeneficiaryDetails: {
      Name: 'Test Customer',
      Inn: '000000001',
      AccountNumber: 'GE00BG0000000000000000GEL',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"'
    },
    DocumentTreasuryCode: null,
    DocumentNomination: 'Currency Exchange',
    DocumentInformation: 'Currency Exchange',
    DocumentSourceAmount: 2.57,
    DocumentSourceCurrency: 'GEL',
    DocumentDestinationAmount: 1,
    DocumentDestinationCurrency: 'USD',
    DocumentReceiveDate: '2026-09-15T00:00:00',
    DocumentBranch: '502',
    DocumentDepartment: 'BATU08',
    DocumentActualDate: '2026-09-15T00:00:00',
    DocumentExpiryDate: '2026-09-25T00:00:00',
    DocumentRateLimit: null,
    DocumentRate: 2.579,
    DocumentRegistrationRate: 2.579,
    DocumentSenderInstitution: null,
    DocumentIntermediaryInstitution: null,
    DocumentBeneficiaryInstitution: null,
    DocumentPayee: null,
    DocumentCorrespondentAccountNumber: 'GE00BG0000000000000000GEL',
    DocumentCorrespondentBankCode: 'BAGAGE22',
    DocumentCorrespondentBankName: 'სს "საქართველოს ბანკი"',
    DocumentKey: 48962147791,
    EntryId: 125521303321,
    DocumentPayerName: 'Test Customer',
    DocumentPayerInn: '000000001',
    DocComment: null,
    AccountID: 'GE00BG0000000000000000USD',
    Currency: 'USD'
  }
  const transaction = convertToZenMoneyTransaction(record as unknown as AccountRecord)
  const expected = {
    hold: false,
    date: new Date('2026-09-15T00:00:00'),
    movements: [{ id: '125521303321', account: { id: 'GE00BG0000000000000000USD' }, sum: -1, fee: 0, invoice: null }],
    merchant: null,
    comment: 'ვალუტის გაცვლითი ოპერაცია. კურსი:2.579 კონტრთანხა: GEL2.57. Currency Exchange'
  }
  expect(transaction).toEqual({ ...expected, groupKeys: ['48962147791'] })
  expect(adjustTransactions({ transactions: [transaction] })).toEqual([expected])
})

it('preserves the recorded CCO credit without fabricating a second movement', () => {
  // mail_inbound 207409, build 43: complete record; account/currency added as injectAccountInfo does.
  // Names, tax identifiers and account numbers replaced consistently for master.
  // The full source counterpart is absent from the truncated log, so no paired fixture is invented.
  const record = {
    EntryDate: '2026-09-15T00:00:00',
    EntryDocumentNumber: '2609151920000026',
    EntryAccountNumber: '00000000000000000001',
    EntryAmountDebit: 0,
    EntryAmountDebitBase: null,
    EntryAmountCredit: 35,
    EntryAmountCreditBase: 91.32,
    EntryAmountBase: 91.32,
    EntryAmount: 35,
    EntryComment: 'ვალუტის გაცვლითი ოპერაცია. კურსი:2.639 კონტრთანხა: GEL92.37. Currency Exchange',
    EntryDepartment: 'BATU08',
    EntryAccountPoint: 'BATUMI08',
    DocumentProductGroup: 'CCO',
    DocumentValueDate: '2026-09-15T00:00:00',
    SenderDetails: {
      Name: 'Test Customer',
      Inn: '000000001',
      AccountNumber: 'GE00BG0000000000000000GEL',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"'
    },
    BeneficiaryDetails: {
      Name: 'Test Customer',
      Inn: '000000001',
      AccountNumber: 'GE00BG0000000000000000USD',
      BankCode: 'BAGAGE22',
      BankName: 'სს "საქართველოს ბანკი"'
    },
    DocumentTreasuryCode: null,
    DocumentNomination: 'Currency Exchange',
    DocumentInformation: 'Currency Exchange',
    DocumentSourceAmount: 35,
    DocumentSourceCurrency: 'USD',
    DocumentDestinationAmount: 92.37,
    DocumentDestinationCurrency: 'GEL',
    DocumentReceiveDate: '2026-09-15T00:00:00',
    DocumentBranch: '502',
    DocumentDepartment: 'BATU08',
    DocumentActualDate: '2026-09-15T00:00:00',
    DocumentExpiryDate: '2026-09-25T00:00:00',
    DocumentRateLimit: null,
    DocumentRate: 2.639,
    DocumentRegistrationRate: 2.639,
    DocumentSenderInstitution: null,
    DocumentIntermediaryInstitution: null,
    DocumentBeneficiaryInstitution: null,
    DocumentPayee: null,
    DocumentCorrespondentAccountNumber: 'GE00BG0000000000000000GEL',
    DocumentCorrespondentBankCode: 'BAGAGE22',
    DocumentCorrespondentBankName: 'სს "საქართველოს ბანკი"',
    DocumentKey: 48961946991,
    EntryId: 125528678584,
    DocumentPayerName: null,
    DocumentPayerInn: null,
    DocComment: null,
    AccountID: 'GE00BG0000000000000000USD',
    Currency: 'USD'
  }
  const transaction = convertToZenMoneyTransaction(record as unknown as AccountRecord)
  const expected = {
    hold: false,
    date: new Date('2026-09-15T00:00:00'),
    movements: [{ id: '125528678584', account: { id: 'GE00BG0000000000000000USD' }, sum: 35, fee: 0, invoice: null }],
    merchant: null,
    comment: 'ვალუტის გაცვლითი ოპერაცია. კურსი:2.639 კონტრთანხა: GEL92.37. Currency Exchange'
  }
  expect(transaction).toEqual({ ...expected, groupKeys: ['48961946991'] })
  expect(adjustTransactions({ transactions: [transaction] })).toEqual([expected])
})
