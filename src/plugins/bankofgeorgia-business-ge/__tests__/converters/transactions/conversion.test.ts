import { convertToZenMoneyTransaction } from '../../../converters'
import { AccountRecord } from '../../../models'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'

// Business Online statement records (GET /api/statement/{account}/{currency}/{from}/{to}), captured from the API.
// An automatic conversion (DocumentProductGroup PLC) moved EUR to GEL between sub-accounts of the same IBAN:
// one document (shared DocumentKey) with an EUR debit and a GEL credit. Every observed PLC document had exactly
// these two entries, an EUR debit and a GEL or USD credit. Currency and AccountID are added by injectAccountInfo.
// Sanitized: names, tax ids, account numbers, document and entry ids replaced consistently;
// amounts scaled by a common factor; digits in free text replaced with zeros.
// BoG returns EntryId and DocumentKey as JSON numbers while models.ts declares strings, hence the cast.
describe('convertToZenMoneyTransaction: automatic conversion (PLC)', () => {
  it('converts each entry with its own movement and merges the conversion into one transfer', () => {
    const [eurDebit, gelCredit] = [
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
        DocumentDestinationAmount: 100.0,
        DocumentDestinationCurrency: 'EUR',
        DocumentExpiryDate: null,
        DocumentInformation: 'ავტომატური კონვერტაცია, კურსი: 0.000',
        DocumentIntermediaryInstitution: null,
        DocumentKey: 10000000001.0,
        DocumentNomination: 'ავტომატური კონვერტაცია, კურსი: 0.000',
        DocumentPayee: null,
        DocumentPayerInn: '000000001',
        DocumentPayerName: 'სახელი გვარი',
        DocumentProductGroup: 'PLC',
        DocumentRate: null,
        DocumentRateLimit: null,
        DocumentReceiveDate: '2026-10-15T00:00:00',
        DocumentRegistrationRate: null,
        DocumentSenderInstitution: null,
        DocumentSourceAmount: 100.0,
        DocumentSourceCurrency: 'EUR',
        DocumentTreasuryCode: null,
        DocumentValueDate: '2026-10-14T00:00:00',
        EntryAccountNumber: '00000000000000000001',
        EntryAccountPoint: 'CENTRAL217',
        EntryAmount: -100.0,
        EntryAmountBase: 290.74,
        EntryAmountCredit: 0.0,
        EntryAmountCreditBase: null,
        EntryAmountDebit: 100.0,
        EntryAmountDebitBase: 290.74,
        EntryComment: 'ავტომატური კონვერტაცია, კურსი: 0.000',
        EntryDate: '2026-10-14T00:00:00',
        EntryDepartment: 'CEN217',
        EntryDocumentNumber: 'PLC_CONV',
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
        DocumentDestinationAmount: 283.19,
        DocumentDestinationCurrency: 'GEL',
        DocumentExpiryDate: null,
        DocumentInformation: 'ავტომატური კონვერტაცია, კურსი: 0.000',
        DocumentIntermediaryInstitution: null,
        DocumentKey: 10000000001.0,
        DocumentNomination: 'ავტომატური კონვერტაცია, კურსი: 0.000',
        DocumentPayee: null,
        DocumentPayerInn: null,
        DocumentPayerName: null,
        DocumentProductGroup: 'PLC',
        DocumentRate: null,
        DocumentRateLimit: null,
        DocumentReceiveDate: '2026-10-15T00:00:00',
        DocumentRegistrationRate: null,
        DocumentSenderInstitution: null,
        DocumentSourceAmount: 283.19,
        DocumentSourceCurrency: 'GEL',
        DocumentTreasuryCode: null,
        DocumentValueDate: '2026-10-14T00:00:00',
        EntryAccountNumber: '00000000000000000002',
        EntryAccountPoint: 'CENTRAL217',
        EntryAmount: 283.19,
        EntryAmountBase: 283.19,
        EntryAmountCredit: 283.19,
        EntryAmountCreditBase: 283.19,
        EntryAmountDebit: 0.0,
        EntryAmountDebitBase: null,
        EntryComment: 'ავტომატური კონვერტაცია, კურსი: 0.000',
        EntryDate: '2026-10-14T00:00:00',
        EntryDepartment: 'CEN217',
        EntryDocumentNumber: 'PLC_CONV',
        EntryId: 100000000002.0,
        SenderDetails: {
          AccountNumber: '00000000000000000002',
          BankCode: 'BAGAGE22',
          BankName: 'სს "საქართველოს ბანკი"',
          Inn: null,
          Name: ''
        }
      }
    ] as unknown as AccountRecord[]

    const eurConverted = convertToZenMoneyTransaction(eurDebit)
    const gelConverted = convertToZenMoneyTransaction(gelCredit)
    expect(eurConverted).toEqual({
      hold: false,
      date: new Date('2026-10-14T00:00:00'),
      movements: [{ id: '100000000001', account: { id: 'GE00BG0000000000000000EUR' }, sum: -100, fee: 0, invoice: null }],
      merchant: null,
      comment: 'ავტომატური კონვერტაცია, კურსი: 0.000',
      groupKeys: ['10000000001']
    })
    expect(gelConverted).toEqual({
      hold: false,
      date: new Date('2026-10-14T00:00:00'),
      movements: [{ id: '100000000002', account: { id: 'GE00BG0000000000000000GEL' }, sum: 283.19, fee: 0, invoice: null }],
      merchant: { city: null, country: null, mcc: null, title: 'სახელი გვარი', location: null },
      comment: 'ავტომატური კონვერტაცია, კურსი: 0.000',
      groupKeys: ['10000000001']
    })

    expect(adjustTransactions({ transactions: [eurConverted, gelConverted] })).toEqual([
      {
        hold: false,
        date: new Date('2026-10-14T00:00:00'),
        movements: [
          { id: '100000000001', account: { id: 'GE00BG0000000000000000EUR' }, sum: -100, fee: 0, invoice: null },
          { id: '100000000002', account: { id: 'GE00BG0000000000000000GEL' }, sum: 283.19, fee: 0, invoice: null }
        ],
        merchant: null,
        comment: 'ავტომატური კონვერტაცია, კურსი: 0.000'
      }
    ])
  })

  it('keeps the EUR debit as an expense when the GEL sub-account is not synchronized', () => {
    const eurDebit = {
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
      DocumentDestinationAmount: 100.0,
      DocumentDestinationCurrency: 'EUR',
      DocumentExpiryDate: null,
      DocumentInformation: 'ავტომატური კონვერტაცია, კურსი: 0.000',
      DocumentIntermediaryInstitution: null,
      DocumentKey: 10000000001.0,
      DocumentNomination: 'ავტომატური კონვერტაცია, კურსი: 0.000',
      DocumentPayee: null,
      DocumentPayerInn: '000000001',
      DocumentPayerName: 'სახელი გვარი',
      DocumentProductGroup: 'PLC',
      DocumentRate: null,
      DocumentRateLimit: null,
      DocumentReceiveDate: '2026-10-15T00:00:00',
      DocumentRegistrationRate: null,
      DocumentSenderInstitution: null,
      DocumentSourceAmount: 100.0,
      DocumentSourceCurrency: 'EUR',
      DocumentTreasuryCode: null,
      DocumentValueDate: '2026-10-14T00:00:00',
      EntryAccountNumber: '00000000000000000001',
      EntryAccountPoint: 'CENTRAL217',
      EntryAmount: -100.0,
      EntryAmountBase: 290.74,
      EntryAmountCredit: 0.0,
      EntryAmountCreditBase: null,
      EntryAmountDebit: 100.0,
      EntryAmountDebitBase: 290.74,
      EntryComment: 'ავტომატური კონვერტაცია, კურსი: 0.000',
      EntryDate: '2026-10-14T00:00:00',
      EntryDepartment: 'CEN217',
      EntryDocumentNumber: 'PLC_CONV',
      EntryId: 100000000001.0,
      SenderDetails: {
        AccountNumber: 'GE00BG0000000000000000EUR',
        BankCode: 'BAGAGE22',
        BankName: 'სს "საქართველოს ბანკი"',
        Inn: '000000001',
        Name: 'სახელი გვარი'
      }
    } as unknown as AccountRecord

    expect(adjustTransactions({ transactions: [convertToZenMoneyTransaction(eurDebit)] })).toEqual([
      {
        hold: false,
        date: new Date('2026-10-14T00:00:00'),
        movements: [{ id: '100000000001', account: { id: 'GE00BG0000000000000000EUR' }, sum: -100, fee: 0, invoice: null }],
        merchant: null,
        comment: 'ავტომატური კონვერტაცია, კურსი: 0.000'
      }
    ])
  })
})
