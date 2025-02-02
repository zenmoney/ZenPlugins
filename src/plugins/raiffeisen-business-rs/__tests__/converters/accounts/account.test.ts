import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it('converts accounts', () => {
    expect(convertAccounts([
      {
        ShortAccountNumber: '265163031000946641',
        ProductDescriptionAL: null,
        AccountType: 'Transakcioni depoziti preduzetnika',
        IsEbankingAccount: null,
        OrganizationUnit: '163',
        ItemTypeOfLastChange: null,
        CurrencyCode: 'RSD',
        CurrencyCodeNumeric: '941',
        AccountNumber: '265163031000946641',
        BlockedAmount: null,
        AccountCustomName: null,
        fwStatus: 1,
        LastChangeDate: null,
        LastChangedAmount: null,
        SubsystemProductID: null,
        fwNamespace: 'SagaBG.SeP.CorporateOutput',
        Status: null,
        IBANNumber: null,
        BankAccountID: 40002001,
        RetailAccountNumber: null,
        AccountStatusDescription: 'aktivan',
        Balance: 23484.52,
        AccountStatus: '0',
        OrderTypeName: null,
        Group: 'Dinarski račun',
        ID: -1,
        Blocked: 'N',
        ProductDescriptionEN: null,
        ProductCodeCore: '501',
        AvailableBalance: 6208.95,
        fwType: 'aoCorporateAccountBalancePreview'
      },
      {
        ShortAccountNumber: '265100000039246639',
        ProductDescriptionAL: null,
        AccountType: 'Devizni tekući računi preduzetnika',
        IsEbankingAccount: null,
        OrganizationUnit: '163',
        ItemTypeOfLastChange: null,
        CurrencyCode: 'USD',
        CurrencyCodeNumeric: '840',
        AccountNumber: '265100000039246639',
        BlockedAmount: null,
        AccountCustomName: null,
        fwStatus: 1,
        LastChangeDate: null,
        LastChangedAmount: null,
        SubsystemProductID: null,
        fwNamespace: 'SagaBG.SeP.CorporateOutput',
        Status: null,
        IBANNumber: 'RS35265100000039246639',
        BankAccountID: 50022000,
        RetailAccountNumber: null,
        AccountStatusDescription: 'aktivan',
        Balance: 10450,
        AccountStatus: '0',
        OrderTypeName: null,
        Group: 'Devizni račun',
        ID: -1,
        Blocked: 'N',
        ProductDescriptionEN: null,
        ProductCodeCore: '120',
        AvailableBalance: 10450,
        fwType: 'aoCorporateAccountBalancePreview'
      }
    ])).toEqual([
      {
        ProductCodeCore: '501',
        balance: 6208.95,
        creditLimit: 0,
        id: '265163031000946641RSD',
        instrument: 'RSD',
        syncIds: ['265163031000946641RSD'],
        title: '265163031000946641RSD',
        type: 'checking'
      },
      {
        ProductCodeCore: '120',
        balance: 10450,
        creditLimit: 0,
        id: '265100000039246639USD',
        instrument: 'USD',
        syncIds: ['265100000039246639USD'],
        title: '265100000039246639USD',
        type: 'checking'
      }])
  })
})
