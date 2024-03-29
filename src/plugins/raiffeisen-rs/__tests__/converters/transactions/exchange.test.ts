import { convertTransfer } from '../../../converters'

describe('FX exchange', () => {
  it('FX exchange', () => {
    expect(convertTransfer({
      CurrencyCode: 'EUR',
      ID: -1,
      TransactionID: '1926240255107777#11##',
      ProcessedDate: '2024-01-25T00:00:00',
      CurrentBalance: null,
      CurrencyCodeNumeric: 978,
      ChequeCardNumber: null,
      fwStatus: 1,
      ClientDescription: 'Dinarsko knjigovodstvo',
      ToDate: '2024-01-25T00:00:00',
      CreditAmount: 1.0,
      TransactionBeneficiary: 'menjacnica kupovina',
      fwNamespace: 'SagaBG.SeP.RetailOutput',
      IBANNumber: 'RS35265057000005597777',
      ClientAddress: 'SECRET STREET 1',
      SocialIdentityNumber: '0803991667777',
      DebitAmount: 0.0,
      PreviousBalance: null,
      Reference: '7777240255107484000011',
      AccountNumber: '265057000005597777',
      SalesAgreementNumber: null,
      FromDate: '2023-12-18T00:00:00',
      Description: 'Elektronsko bankarstvo - prodaja efektive',
      ClientLocality: '11172 BEOGRAD-NOVI BEOGRAD',
      Note: 'EB 1138317777 - kupoprodaja efektive preko WEB-a',
      ValueDate: '2024-01-25T10:46:27',
      ComplaintNumber: '7777240255107484000011',
      TransactionType: 'ExchBuy',
      BeneficiaryAccount: null,
      ProductCodeCore: 541,
      AmountTotal: null,
      ClientName: 'LUCKY MAN',
      fwType: 'aoRetailAccountTurnoverPreview',
      Details: {
        mpay_merchant_code: null,
        CommissionCurrencyCode: null,
        p2p_Message: null,
        e_UserName: null,
        tn_Description: null,
        fwType: 'aoFullTransactionDetails',
        p2p_ExpiryDate: null,
        dev_cred_bank_address_locality: null,
        e_DebtorName: null,
        s_Note_st: 'EB 1138317777 - kupoprodaja efektive preko WEB-a',
        m_Date: '2024-01-25T10:46:00',
        DebtorAddress: null,
        c_CurrencyCode_tx: null,
        c_CalculationDate: null,
        dev_cred_address_locality: null,
        DebtorLocality: null,
        dev_Charge: null,
        Reference: null,
        c_CardNumber: null,
        m_CommissionAmount: 0.0,
        s_ValueDate: '2024-01-25T00:00:00',
        m_DebtorCurrencyCodeNumeric: 941,
        dev_CreditorAddressCountry: null,
        UserAccount: null,
        p2p_DebtorGroup: null,
        m_DebtorAmount: 120.06,
        p2p_CurrencyCodeNumeric: null,
        CommissionAmount: null,
        m_UserCurrencyCode: 'EUR',
        p2p_PaymentCode: null,
        e_DebtorAlias: null,
        mpay_payment_type: null,
        p2p_CurrencyCode: null,
        p2p_RealizationDate: null,
        m_BankLocality: 'BEOGRAD',
        UserAddress: null,
        CurrencyCodeNumeric: null,
        m_UserID: '0803991667777',
        Model: null,
        s_ProcessedDate: '2024-01-25T00:00:00',
        fwNamespace: 'SagaBG.SeP.RetailOutput',
        Alias: null,
        Priority: null,
        s_CurrencyCodeNumeric: 978,
        c_DomesticAmount: null,
        e_DebtorAccount: null,
        s_OrderNumber: '1926240255107777',
        m_JobDescription: 'Potvrda o prodaji stranih sredstava placanja',
        m_AmountTotal: 120.06,
        m_UserAmount: 1.0,
        CurrencyCode: null,
        ReceiveDate: null,
        m_DebtorName: 'LUCKY MAN',
        ValueDate: null,
        e_UserAlias: null,
        c_TerminalID: null,
        s_StatementID: null,
        e_Channel: '27',
        DebtorAccount: '265021000005487777',
        e_ID: null,
        e_UserLocality: null,
        dev_SpecAmount: null,
        p2p_CreateDate: null,
        ID: -1,
        m_DebtorCurrencyCode: 'RSD',
        m_CommissionPercentage: 0.0,
        dev_cred_address_postal_code: null,
        DebtorName: 'LUCKY MAN',
        m_DebtorGroup: '265021000005487777',
        dev_SpecCurrency: null,
        fwStatus: 1,
        m_ExchangeNumber: 321661287777,
        dev_cred_bank_address_postal: null,
        m_UserAlias: null,
        e_DebtorLocality: null,
        m_PayDeskNumber: 5000,
        dev_cred_address_line: null,
        dev_SpecPurposeCode: null,
        c_DebtorDetails: null,
        PaymentAmount: null,
        p2p_Amount: null,
        CommissionCurrencyCodeNumeric: null,
        m_JobType: 'P',
        OrderNumber_pp: null,
        dev_BulkId: null,
        ReceiverReference: null,
        iBankingCreditorTypeFRN: null,
        m_DebtorAlias: null,
        m_CommissionCurrencyCodeNumeric: 941,
        UserLocality: null,
        c_AuthorizationID: null,
        s_CurrencyCode: 'EUR',
        m_Course: 120.0630,
        dev_PersonalNumber: null,
        dev_SpecInvoiceYear: null,
        tn_ValueDate: null,
        m_Basics: 700,
        e_UserAccount: null,
        mpay_sales_point_code: null,
        s_AccountPurpose: 'A vista računi fizičkih lica u stranoj valuti',
        c_Reference: null,
        dev_cred_bank_address_line: null,
        PaymentCode: null,
        s_Alias: null,
        PaymentStatusName: null,
        dev_cred_bank_address_country: null,
        dev_SpecPaymentDescription: null,
        s_PaymentBasis: 898,
        End2endID: null,
        s_Group: '265057000005597777',
        m_TransactionID: 7777317075,
        p2p_Alias: null,
        m_DebtorID: '0803991667777',
        iBankingProcessedDateCoreFRN: null,
        c_Date_tx: null,
        PaymentPurpose: null,
        c_Alias: null,
        s_ConfirmationDate: '2024-01-25T10:46:27',
        dev_creditor_bank: null,
        m_UserGroup: '265057000005597777',
        m_UserName: 'LUCKY MAN',
        dev_SpecialMark: null,
        UserName: null,
        m_CommissionCurrencyCode: 'RSD',
        dev_CreditorBankSwiftCode: null,
        m_ExchangeName: 'Raiffeisen banka a.d. Beograd',
        dev_SwiftMessage: null,
        PaymentState: null,
        s_Amount: 1.0,
        dev_Status: null,
        p2p_Status: null,
        m_Operator: 8932,
        m_UserCurrencyCodeNumeric: 978,
        p2p_IssueDate: null,
        dev_AuthorizationType: null,
        dev_ComissionAccount: null,
        m_OrderNumber: '1926240255107777',
        m_UserType: '77 0927777',
        c_Amount_tx: null,
        dev_SpecInvoiceNumber: null,
        m_ExchangeOfficeLocality: 'Raiffeisen banka a.d. ,ĐORĐA STANOJEVIĆA 16'
      }
    },
    {
      CurrencyCode: 'RSD',
      ID: -1,
      TransactionID: '1926240255107777#1##',
      ProcessedDate: '2024-01-25T00:00:00',
      CurrentBalance: 134989.71,
      CurrencyCodeNumeric: 941,
      ChequeCardNumber: null,
      fwStatus: 1,
      ClientDescription: 'Dinarsko knjigovodstvo',
      ToDate: '2024-01-25T00:00:00',
      CreditAmount: 0.0,
      TransactionBeneficiary: 'menjacnica kupovina',
      fwNamespace: 'SagaBG.SeP.RetailOutput',
      IBANNumber: null,
      ClientAddress: 'SECRET STREET 1',
      SocialIdentityNumber: '0803991667777',
      DebitAmount: 120.06,
      PreviousBalance: 948.95,
      Reference: '7777240255107484000001',
      AccountNumber: '265021000005487777',
      SalesAgreementNumber: null,
      FromDate: '2023-12-18T00:00:00',
      Description: 'Elektronsko bankarstvo - prodaja efektive',
      ClientLocality: '11172 BEOGRAD-NOVI BEOGRAD',
      Note: 'EB 1138317777 - kupoprodaja efektive preko WEB-a',
      ValueDate: '2024-01-25T10:46:26',
      ComplaintNumber: '7777240255107484000001',
      TransactionType: 'ExchBuy',
      BeneficiaryAccount: null,
      ProductCodeCore: 66,
      AmountTotal: 134989.71,
      ClientName: 'LUCKY MAN',
      fwType: 'aoRetailAccountTurnoverPreview',
      Details: {
        mpay_merchant_code: null,
        CommissionCurrencyCode: null,
        p2p_Message: null,
        e_UserName: null,
        tn_Description: null,
        fwType: 'aoFullTransactionDetails',
        p2p_ExpiryDate: null,
        dev_cred_bank_address_locality: null,
        e_DebtorName: null,
        s_Note_st: 'EB 1138317777 - kupoprodaja efektive preko WEB-a',
        m_Date: '2024-01-25T10:46:00',
        DebtorAddress: null,
        c_CurrencyCode_tx: null,
        c_CalculationDate: null,
        dev_cred_address_locality: null,
        DebtorLocality: null,
        dev_Charge: null,
        Reference: null,
        c_CardNumber: null,
        m_CommissionAmount: 0.0,
        s_ValueDate: '2024-01-25T00:00:00',
        m_DebtorCurrencyCodeNumeric: 941,
        dev_CreditorAddressCountry: null,
        UserAccount: null,
        p2p_DebtorGroup: null,
        m_DebtorAmount: 120.06,
        p2p_CurrencyCodeNumeric: null,
        CommissionAmount: null,
        m_UserCurrencyCode: 'EUR',
        p2p_PaymentCode: null,
        e_DebtorAlias: null,
        mpay_payment_type: null,
        p2p_CurrencyCode: null,
        p2p_RealizationDate: null,
        m_BankLocality: 'BEOGRAD',
        UserAddress: null,
        CurrencyCodeNumeric: null,
        m_UserID: '0803991667777',
        Model: null,
        s_ProcessedDate: '2024-01-25T00:00:00',
        fwNamespace: 'SagaBG.SeP.RetailOutput',
        Alias: null,
        Priority: null,
        s_CurrencyCodeNumeric: 941,
        c_DomesticAmount: null,
        e_DebtorAccount: null,
        s_OrderNumber: '1926240255107777',
        m_JobDescription: 'Potvrda o prodaji stranih sredstava placanja',
        m_AmountTotal: 120.06,
        m_UserAmount: 1.0,
        CurrencyCode: null,
        ReceiveDate: null,
        m_DebtorName: 'LUCKY MAN',
        ValueDate: null,
        e_UserAlias: null,
        c_TerminalID: null,
        s_StatementID: null,
        e_Channel: '27',
        DebtorAccount: '265021000005487777',
        e_ID: null,
        e_UserLocality: null,
        dev_SpecAmount: null,
        p2p_CreateDate: null,
        ID: -1,
        m_DebtorCurrencyCode: 'RSD',
        m_CommissionPercentage: 0.0,
        dev_cred_address_postal_code: null,
        DebtorName: 'LUCKY MAN',
        m_DebtorGroup: '265021000005487777',
        dev_SpecCurrency: null,
        fwStatus: 1,
        m_ExchangeNumber: 321661287024,
        dev_cred_bank_address_postal: null,
        m_UserAlias: null,
        e_DebtorLocality: null,
        m_PayDeskNumber: 5000,
        dev_cred_address_line: null,
        dev_SpecPurposeCode: null,
        c_DebtorDetails: null,
        PaymentAmount: null,
        p2p_Amount: null,
        CommissionCurrencyCodeNumeric: null,
        m_JobType: 'P',
        OrderNumber_pp: null,
        dev_BulkId: null,
        ReceiverReference: null,
        iBankingCreditorTypeFRN: null,
        m_DebtorAlias: null,
        m_CommissionCurrencyCodeNumeric: 941,
        UserLocality: null,
        c_AuthorizationID: null,
        s_CurrencyCode: 'RSD',
        m_Course: 120.0630,
        dev_PersonalNumber: null,
        dev_SpecInvoiceYear: null,
        tn_ValueDate: null,
        m_Basics: 700,
        e_UserAccount: null,
        mpay_sales_point_code: null,
        s_AccountPurpose: 'Transakcioni račun za redovno poslovanje FL',
        c_Reference: null,
        dev_cred_bank_address_line: null,
        PaymentCode: null,
        s_Alias: null,
        PaymentStatusName: null,
        dev_cred_bank_address_country: null,
        dev_SpecPaymentDescription: null,
        s_PaymentBasis: 898,
        End2endID: null,
        s_Group: '265021000005487777',
        m_TransactionID: 1138317075,
        p2p_Alias: null,
        m_DebtorID: '0803991667777',
        iBankingProcessedDateCoreFRN: null,
        c_Date_tx: null,
        PaymentPurpose: null,
        c_Alias: null,
        s_ConfirmationDate: '2024-01-25T10:46:26',
        dev_creditor_bank: null,
        m_UserGroup: '265057000005597777',
        m_UserName: 'LUCKY MAN',
        dev_SpecialMark: null,
        UserName: null,
        m_CommissionCurrencyCode: 'RSD',
        dev_CreditorBankSwiftCode: null,
        m_ExchangeName: 'Raiffeisen banka a.d. Beograd',
        dev_SwiftMessage: null,
        PaymentState: null,
        s_Amount: 120.06,
        dev_Status: null,
        p2p_Status: null,
        m_Operator: 8932,
        m_UserCurrencyCodeNumeric: 978,
        p2p_IssueDate: null,
        dev_AuthorizationType: null,
        dev_ComissionAccount: null,
        m_OrderNumber: '1926240255107777',
        m_UserType: '77 0927777',
        c_Amount_tx: null,
        dev_SpecInvoiceNumber: null,
        m_ExchangeOfficeLocality: 'Raiffeisen banka a.d. ,ĐORĐA STANOJEVIĆA 16'
      }
    })).toEqual({
      comment: 'EB 1138317777 - kupoprodaja efektive preko WEB-a',
      date: new Date('2024-01-25T00:00:00'),
      hold: false,
      merchant: {
        fullTitle: 'Elektronsko bankarstvo - prodaja efektive',
        location: null,
        mcc: null
      },
      movements: [{
        account: {
          id: '265057000005597777EUR'
        },
        fee: 0,
        id: '1926240255107777#11##',
        invoice: null,
        sum: 1
      },
      {
        account: {
          id: '265021000005487777RSD'
        },
        fee: 0,
        id: '1926240255107777#1##',
        invoice: null,
        sum: -120.06
      }]
    })
  })
})
