import { convertTransactions } from '../../../converters'

describe('Test transfer', () => {
  it('Test transfer', () => {
    expect(
      convertTransactions(
        [
          {
            CurrencyCode: 'RSD',
            ID: -1,
            TransactionID: '1941240332404852#7#12#93212325063',
            ProcessedDate: '2024-02-02T00:00:00',
            CurrentBalance: 5335.4,
            CurrencyCodeNumeric: 941,
            ChequeCardNumber: null,
            fwStatus: 1,
            ClientDescription: 'Dinarsko knjigovodstvo',
            ToDate: '2024-02-10T00:00:00',
            CreditAmount: 0,
            TransactionBeneficiary: 'Naplata Swift troškova za nostro doznake sa računa za devizno poslovanje',
            fwNamespace: 'SagaBG.SeP.RetailOutput',
            IBANNumber: null,
            ClientAddress: 'TestAddress ',
            SocialIdentityNumber: '2804991660056',
            DebitAmount: 1464.52,
            PreviousBalance: 0,
            Reference: '93212325063',
            AccountNumber: '111111111111111111',
            SalesAgreementNumber: null,
            FromDate: '2024-02-01T00:00:00',
            Description: 'Naplata Swift troškova za nostro doznake sa računa za devizno poslovanje',
            ClientLocality: '11030 BEOGRAD-ČUKARICA',
            Note: 'Provizija po ino placanju za referencu  93212325063 Usluga oslobođena PDV-a bez prava na odbitak, prema članu 25. zakona o PDV-u',
            ValueDate: '2024-02-02T00:00:00',
            ComplaintNumber: '1941240332404852000007',
            TransactionType: 'Fee',
            BeneficiaryAccount: 'ME00000000000000000000',
            ProductCodeCore: 33,
            AmountTotal: 5335.4,
            ClientName: 'TEST TEST',
            fwType: 'aoRetailAccountTurnoverPreview',
            Details: {
              s_Note_st: 'Provizija po ino placanju za referencu  93212325063 / test doo Usluga oslobođena PDV-a bez prava na odbitak, prema članu 25. zakona o PDV-u',
              m_Date: null,
              DebtorAddress: 'TestAddress ',
              c_CurrencyCode_tx: null,
              c_CalculationDate: null,
              dev_cred_address_locality: ' ',
              DebtorLocality: 'BEOGRAD-ČUKARICA',
              dev_Charge: 'OUR',
              Reference: null,
              c_CardNumber: null,
              m_CommissionAmount: null,
              s_ValueDate: '2024-02-02T00:00:00',
              m_DebtorCurrencyCodeNumeric: null,
              dev_CreditorAddressCountry: 499,
              UserAccount: 'ME00000000000000000000',
              p2p_DebtorGroup: null,
              m_DebtorAmount: null,
              p2p_CurrencyCodeNumeric: null,
              CommissionAmount: 2789.62,
              m_UserCurrencyCode: null,
              p2p_PaymentCode: null,
              e_DebtorAlias: null,
              mpay_payment_type: null,
              p2p_CurrencyCode: null,
              p2p_RealizationDate: null,
              m_BankLocality: null,
              UserAddress: 'Montenegro',
              CurrencyCodeNumeric: 978,
              m_UserID: null,
              Model: null,
              s_ProcessedDate: '2024-02-02T00:00:00',
              fwNamespace: 'SagaBG.SeP.RetailOutput',
              Alias: null,
              Priority: null,
              s_CurrencyCodeNumeric: 941,
              c_DomesticAmount: null,
              e_DebtorAccount: '222222222222222222',
              s_OrderNumber: '1941240332404852',
              m_JobDescription: null,
              m_AmountTotal: null,
              m_UserAmount: null,
              CurrencyCode: 'EUR',
              ReceiveDate: '2024-02-02T10:00:04',
              m_DebtorName: null,
              ValueDate: '2024-02-02T00:00:00',
              e_UserAlias: null,
              c_TerminalID: null,
              s_StatementID: null,
              e_Channel: '27',
              DebtorAccount: '222222222222222222',
              e_ID: '1140090089',
              e_UserLocality: ' ',
              dev_SpecAmount: 1450,
              p2p_CreateDate: null,
              ID: -1,
              m_DebtorCurrencyCode: null,
              m_CommissionPercentage: null,
              dev_cred_address_postal_code: null,
              DebtorName: 'TEST TEST',
              m_DebtorGroup: null,
              dev_SpecCurrency: 'EUR',
              fwStatus: 1,
              m_ExchangeNumber: null,
              dev_cred_bank_address_postal: null,
              m_UserAlias: null,
              e_DebtorLocality: 'BEOGRAD-ČUKARICA',
              m_PayDeskNumber: null,
              dev_cred_address_line: 'Montenegro',
              dev_SpecPurposeCode: 760,
              c_DebtorDetails: null,
              PaymentAmount: 1450,
              p2p_Amount: null,
              CommissionCurrencyCodeNumeric: 941,
              m_JobType: null,
              OrderNumber_pp: 93212325063,
              dev_BulkId: 93212325063,
              ReceiverReference: null,
              iBankingCreditorTypeFRN: 'legal',
              m_DebtorAlias: null,
              m_CommissionCurrencyCodeNumeric: null,
              UserLocality: ' ',
              c_AuthorizationID: null,
              s_CurrencyCode: 'RSD',
              m_Course: null,
              dev_PersonalNumber: '2804991660056',
              dev_SpecInvoiceYear: null,
              tn_ValueDate: null,
              m_Basics: null,
              e_UserAccount: 'ME00000000000000000000',
              mpay_sales_point_code: null,
              s_AccountPurpose: 'Transakcioni račun za redovno poslovanje FL',
              c_Reference: null,
              dev_cred_bank_address_line: '2A ARSENIJA BOLJEVICA',
              PaymentCode: null,
              s_Alias: null,
              PaymentStatusName: null,
              dev_cred_bank_address_country: 'CRNA GORA',
              dev_SpecPaymentDescription: 'Sport i rekreacija',
              s_PaymentBasis: 760,
              End2endID: null,
              s_Group: '111111111111111111',
              m_TransactionID: null,
              p2p_Alias: null,
              m_DebtorID: null,
              iBankingProcessedDateCoreFRN: '2024-02-02T10:00:05.47',
              c_Date_tx: null,
              PaymentPurpose: 'training fee',
              c_Alias: null,
              s_ConfirmationDate: '2024-02-02T10:00:05',
              dev_creditor_bank: 'ERSTE BANK AD PODGORICA',
              m_UserGroup: null,
              m_UserName: null,
              dev_SpecialMark: null,
              UserName: 'test doo',
              m_CommissionCurrencyCode: null,
              dev_CreditorBankSwiftCode: 'OPPOMEPG',
              m_ExchangeName: null,
              dev_SwiftMessage: '',
              PaymentState: null,
              s_Amount: 1464.52,
              dev_Status: 'executed',
              p2p_Status: null,
              m_Operator: null,
              m_UserCurrencyCodeNumeric: null,
              p2p_IssueDate: null,
              dev_AuthorizationType: 'FMTBSIGN',
              dev_ComissionAccount: '111111111111111111',
              m_OrderNumber: null,
              m_UserType: null,
              c_Amount_tx: null,
              dev_SpecInvoiceNumber: '-1',
              m_ExchangeOfficeLocality: null
            }
          },
          {
            CurrencyCode: 'RSD',
            ID: -1,
            TransactionID: '1941240332404852#3#12#93212325063',
            ProcessedDate: '2024-02-02T00:00:00',
            CurrentBalance: 5335.4,
            CurrencyCodeNumeric: 941,
            ChequeCardNumber: null,
            fwStatus: 1,
            ClientDescription: 'Dinarsko knjigovodstvo',
            ToDate: '2024-02-10T00:00:00',
            CreditAmount: 0,
            TransactionBeneficiary: 'Naplata provizije za nostro doznake sa računa za devizno poslovanje',
            fwNamespace: 'SagaBG.SeP.RetailOutput',
            IBANNumber: null,
            ClientAddress: 'TestAddress ',
            SocialIdentityNumber: '2804991660056',
            DebitAmount: 1325.1,
            PreviousBalance: 0,
            Reference: '93212325063',
            AccountNumber: '111111111111111111',
            SalesAgreementNumber: null,
            FromDate: '2024-02-01T00:00:00',
            Description: 'Naplata provizije za nostro doznake sa računa za devizno poslovanje',
            ClientLocality: '11030 BEOGRAD-ČUKARICA',
            Note: 'Provizija po ino placanju za referencu  93212325063 / test doo Usluga oslobođena PDV-a bez prava na odbitak, prema članu 25. zakona o PDV-u',
            ValueDate: '2024-02-02T00:00:00',
            ComplaintNumber: '1941240332404852000003',
            TransactionType: 'Fee',
            BeneficiaryAccount: 'ME00000000000000000000',
            ProductCodeCore: 33,
            AmountTotal: 6799.92,
            ClientName: 'TEST TEST',
            fwType: 'aoRetailAccountTurnoverPreview',
            Details: {
              mpay_merchant_code: null,
              CommissionCurrencyCode: 'RSD',
              p2p_Message: null,
              e_UserName: 'test doo',
              tn_Description: null,
              fwType: 'aoFullTransactionDetails',
              p2p_ExpiryDate: null,
              dev_cred_bank_address_locality: 'PODGORICA',
              e_DebtorName: 'TEST TEST',
              s_Note_st: 'Provizija po ino placanju za referencu  93212325063 / test doo Usluga oslobođena PDV-a bez prava na odbitak, prema članu 25. zakona o PDV-u',
              m_Date: null,
              DebtorAddress: 'TestAddress ',
              c_CurrencyCode_tx: null,
              c_CalculationDate: null,
              dev_cred_address_locality: ' ',
              DebtorLocality: 'BEOGRAD-ČUKARICA',
              dev_Charge: 'OUR',
              Reference: null,
              c_CardNumber: null,
              m_CommissionAmount: null,
              s_ValueDate: '2024-02-02T00:00:00',
              m_DebtorCurrencyCodeNumeric: null,
              dev_CreditorAddressCountry: 499,
              UserAccount: 'ME00000000000000000000',
              p2p_DebtorGroup: null,
              m_DebtorAmount: null,
              p2p_CurrencyCodeNumeric: null,
              CommissionAmount: 2789.62,
              m_UserCurrencyCode: null,
              p2p_PaymentCode: null,
              e_DebtorAlias: null,
              mpay_payment_type: null,
              p2p_CurrencyCode: null,
              p2p_RealizationDate: null,
              m_BankLocality: null,
              UserAddress: 'Montenegro',
              CurrencyCodeNumeric: 978,
              m_UserID: null,
              Model: null,
              s_ProcessedDate: '2024-02-02T00:00:00',
              fwNamespace: 'SagaBG.SeP.RetailOutput',
              Alias: null,
              Priority: null,
              s_CurrencyCodeNumeric: 941,
              c_DomesticAmount: null,
              e_DebtorAccount: '222222222222222222',
              s_OrderNumber: '1941240332404852',
              m_JobDescription: null,
              m_AmountTotal: null,
              m_UserAmount: null,
              CurrencyCode: 'EUR',
              ReceiveDate: '2024-02-02T10:00:04',
              m_DebtorName: null,
              ValueDate: '2024-02-02T00:00:00',
              e_UserAlias: null,
              c_TerminalID: null,
              s_StatementID: null,
              e_Channel: '27',
              DebtorAccount: '222222222222222222',
              e_ID: '1140090089',
              e_UserLocality: ' ',
              dev_SpecAmount: 1450,
              p2p_CreateDate: null,
              ID: -1,
              m_DebtorCurrencyCode: null,
              m_CommissionPercentage: null,
              dev_cred_address_postal_code: null,
              DebtorName: 'TEST TEST',
              m_DebtorGroup: null,
              dev_SpecCurrency: 'EUR',
              fwStatus: 1,
              m_ExchangeNumber: null,
              dev_cred_bank_address_postal: null,
              m_UserAlias: null,
              e_DebtorLocality: 'BEOGRAD-ČUKARICA',
              m_PayDeskNumber: null,
              dev_cred_address_line: 'Montenegro',
              dev_SpecPurposeCode: 760,
              c_DebtorDetails: null,
              PaymentAmount: 1450,
              p2p_Amount: null,
              CommissionCurrencyCodeNumeric: 941,
              m_JobType: null,
              OrderNumber_pp: 93212325063,
              dev_BulkId: 93212325063,
              ReceiverReference: null,
              iBankingCreditorTypeFRN: 'legal',
              m_DebtorAlias: null,
              m_CommissionCurrencyCodeNumeric: null,
              UserLocality: ' ',
              c_AuthorizationID: null,
              s_CurrencyCode: 'RSD',
              m_Course: null,
              dev_PersonalNumber: '2804991660056',
              dev_SpecInvoiceYear: null,
              tn_ValueDate: null,
              m_Basics: null,
              e_UserAccount: 'ME00000000000000000000',
              mpay_sales_point_code: null,
              s_AccountPurpose: 'Transakcioni račun za redovno poslovanje FL',
              c_Reference: null,
              dev_cred_bank_address_line: '2A ARSENIJA BOLJEVICA',
              PaymentCode: null,
              s_Alias: null,
              PaymentStatusName: null,
              dev_cred_bank_address_country: 'CRNA GORA',
              dev_SpecPaymentDescription: 'Sport i rekreacija',
              s_PaymentBasis: 760,
              End2endID: null,
              s_Group: '111111111111111111',
              m_TransactionID: null,
              p2p_Alias: null,
              m_DebtorID: null,
              iBankingProcessedDateCoreFRN: '2024-02-02T10:00:05.47',
              c_Date_tx: null,
              PaymentPurpose: 'training fee',
              c_Alias: null,
              s_ConfirmationDate: '2024-02-02T10:00:05',
              dev_creditor_bank: 'ERSTE BANK AD PODGORICA',
              m_UserGroup: null,
              m_UserName: null,
              dev_SpecialMark: null,
              UserName: 'test doo',
              m_CommissionCurrencyCode: null,
              dev_CreditorBankSwiftCode: 'OPPOMEPG',
              m_ExchangeName: null,
              dev_SwiftMessage: '',
              PaymentState: null,
              s_Amount: 1325.1,
              dev_Status: 'executed',
              p2p_Status: null,
              m_Operator: null,
              m_UserCurrencyCodeNumeric: null,
              p2p_IssueDate: null,
              dev_AuthorizationType: 'FMTBSIGN',
              dev_ComissionAccount: '111111111111111111',
              m_OrderNumber: null,
              m_UserType: null,
              c_Amount_tx: null,
              dev_SpecInvoiceNumber: '-1',
              m_ExchangeOfficeLocality: null
            }
          },
          {
            CurrencyCode: 'RSD',
            ID: -1,
            TransactionID: '1941240332395195#11##',
            ProcessedDate: '2024-02-02T00:00:00',
            CurrentBalance: 5335.4,
            CurrencyCodeNumeric: 941,
            ChequeCardNumber: null,
            fwStatus: 1,
            ClientDescription: 'Dinarsko knjigovodstvo',
            ToDate: '2024-02-10T00:00:00',
            CreditAmount: 5714.56,
            TransactionBeneficiary: 'menjacnica prodaja',
            fwNamespace: 'SagaBG.SeP.RetailOutput',
            IBANNumber: null,
            ClientAddress: 'TestAddress ',
            SocialIdentityNumber: '2804991660056',
            DebitAmount: 0,
            PreviousBalance: 0,
            Reference: '1941240332395195000011',
            AccountNumber: '111111111111111111',
            SalesAgreementNumber: null,
            FromDate: '2024-02-01T00:00:00',
            Description: 'Elektronsko bankarstvo - otkup efektive',
            ClientLocality: '11030 BEOGRAD-ČUKARICA',
            Note: 'EB 1140090083 - kupoprodaja efektive preko WEB-a',
            ValueDate: '2024-02-02T00:00:00',
            ComplaintNumber: '1941240332395195000011',
            TransactionType: 'ExchSell',
            BeneficiaryAccount: null,
            ProductCodeCore: 33,
            AmountTotal: 8125.02,
            ClientName: 'TEST TEST',
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
              s_Note_st: 'EB 1140090083 - kupoprodaja efektive preko WEB-a',
              m_Date: '2024-02-02T09:59:00',
              DebtorAddress: null,
              c_CurrencyCode_tx: null,
              c_CalculationDate: null,
              dev_cred_address_locality: null,
              DebtorLocality: null,
              dev_Charge: null,
              Reference: null,
              c_CardNumber: null,
              m_CommissionAmount: 0,
              s_ValueDate: '2024-02-02T00:00:00',
              m_DebtorCurrencyCodeNumeric: 978,
              dev_CreditorAddressCountry: null,
              UserAccount: null,
              p2p_DebtorGroup: null,
              m_DebtorAmount: 50,
              p2p_CurrencyCodeNumeric: null,
              CommissionAmount: null,
              m_UserCurrencyCode: 'RSD',
              p2p_PaymentCode: null,
              e_DebtorAlias: null,
              mpay_payment_type: null,
              p2p_CurrencyCode: null,
              p2p_RealizationDate: null,
              m_BankLocality: 'BEOGRAD',
              UserAddress: null,
              CurrencyCodeNumeric: null,
              m_UserID: '2804991660056',
              Model: null,
              s_ProcessedDate: '2024-02-02T00:00:00',
              fwNamespace: 'SagaBG.SeP.RetailOutput',
              Alias: null,
              Priority: null,
              s_CurrencyCodeNumeric: 941,
              c_DomesticAmount: null,
              e_DebtorAccount: null,
              s_OrderNumber: '1941240332395195',
              m_JobDescription: 'Potvrda o otkupu stranih sredstava placanja',
              m_AmountTotal: 5714.56,
              m_UserAmount: 5714.56,
              CurrencyCode: null,
              ReceiveDate: null,
              m_DebtorName: 'TEST TEST',
              ValueDate: null,
              e_UserAlias: null,
              c_TerminalID: null,
              s_StatementID: null,
              e_Channel: '27',
              DebtorAccount: '222222222222222222',
              e_ID: null,
              e_UserLocality: null,
              dev_SpecAmount: null,
              p2p_CreateDate: null,
              ID: -1,
              m_DebtorCurrencyCode: 'EUR',
              m_CommissionPercentage: 0,
              dev_cred_address_postal_code: null,
              DebtorName: 'TEST TEST',
              m_DebtorGroup: '222222222222222222',
              dev_SpecCurrency: null,
              fwStatus: 1,
              m_ExchangeNumber: 322924924915,
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
              m_JobType: 'O',
              OrderNumber_pp: null,
              dev_BulkId: null,
              ReceiverReference: null,
              iBankingCreditorTypeFRN: null,
              m_DebtorAlias: null,
              m_CommissionCurrencyCodeNumeric: 941,
              UserLocality: null,
              c_AuthorizationID: null,
              s_CurrencyCode: 'RSD',
              m_Course: 114.2911,
              dev_PersonalNumber: null,
              dev_SpecInvoiceYear: null,
              tn_ValueDate: null,
              m_Basics: 796,
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
              s_PaymentBasis: null,
              End2endID: null,
              s_Group: '111111111111111111',
              m_TransactionID: 1140090083,
              p2p_Alias: null,
              m_DebtorID: '2804991660056',
              iBankingProcessedDateCoreFRN: null,
              c_Date_tx: null,
              PaymentPurpose: null,
              c_Alias: null,
              s_ConfirmationDate: '2024-02-02T09:59:22',
              dev_creditor_bank: null,
              m_UserGroup: '111111111111111111',
              m_UserName: 'TEST TEST',
              dev_SpecialMark: null,
              UserName: null,
              m_CommissionCurrencyCode: 'RSD',
              dev_CreditorBankSwiftCode: null,
              m_ExchangeName: 'Raiffeisen banka a.d. Beograd',
              dev_SwiftMessage: null,
              PaymentState: null,
              s_Amount: 5714.56,
              dev_Status: null,
              p2p_Status: null,
              m_Operator: 8932,
              m_UserCurrencyCodeNumeric: 941,
              p2p_IssueDate: null,
              dev_AuthorizationType: null,
              dev_ComissionAccount: null,
              m_OrderNumber: '1941240332395195',
              m_UserType: '2804991660056',
              c_Amount_tx: null,
              dev_SpecInvoiceNumber: null,
              m_ExchangeOfficeLocality: 'Raiffeisen banka a.d. ,ĐORĐA STANOJEVIĆA 16'
            }
          },
          {
            CurrencyCode: 'EUR',
            ID: -1,
            TransactionID: '1941240338338940#1#12#93212325063',
            ProcessedDate: '2024-02-02T00:00:00',
            CurrentBalance: null,
            CurrencyCodeNumeric: 978,
            ChequeCardNumber: null,
            fwStatus: 1,
            ClientDescription: 'Dinarsko knjigovodstvo',
            ToDate: '2024-02-10T00:00:00',
            CreditAmount: 0,
            TransactionBeneficiary: 'test doo',
            fwNamespace: 'SagaBG.SeP.RetailOutput',
            IBANNumber: 'RS35222222222222222222',
            ClientAddress: 'TestAddress ',
            SocialIdentityNumber: '2804991660056',
            DebitAmount: 1450,
            PreviousBalance: null,
            Reference: '93212325063',
            AccountNumber: '222222222222222222',
            SalesAgreementNumber: null,
            FromDate: '2024-02-01T00:00:00',
            Description: 'Prenos pri disponibilteskoj overi',
            ClientLocality: '11030 BEOGRAD-ČUKARICA',
            Note: 'Prenos na pokrice za placanje, ref.: 93212325063',
            ValueDate: '2024-02-02T00:00:00',
            ComplaintNumber: '1941240338338940000001',
            TransactionType: 'PmtIno',
            BeneficiaryAccount: 'ME00000000000000000000',
            ProductCodeCore: 25,
            AmountTotal: null,
            ClientName: 'TEST TEST',
            fwType: 'aoRetailAccountTurnoverPreview',
            Details: {
              mpay_merchant_code: null,
              CommissionCurrencyCode: 'RSD',
              p2p_Message: null,
              e_UserName: 'test doo',
              tn_Description: null,
              fwType: 'aoFullTransactionDetails',
              p2p_ExpiryDate: null,
              dev_cred_bank_address_locality: 'PODGORICA',
              e_DebtorName: 'TEST TEST',
              s_Note_st: 'Prenos na pokrice za placanje, ref.: 93212325063',
              m_Date: null,
              DebtorAddress: 'TestAddress ',
              c_CurrencyCode_tx: null,
              c_CalculationDate: null,
              dev_cred_address_locality: ' ',
              DebtorLocality: 'BEOGRAD-ČUKARICA',
              dev_Charge: 'OUR',
              Reference: null,
              c_CardNumber: null,
              m_CommissionAmount: null,
              s_ValueDate: '2024-02-02T00:00:00',
              m_DebtorCurrencyCodeNumeric: null,
              dev_CreditorAddressCountry: 499,
              UserAccount: 'ME00000000000000000000',
              p2p_DebtorGroup: null,
              m_DebtorAmount: null,
              p2p_CurrencyCodeNumeric: null,
              CommissionAmount: 2789.62,
              m_UserCurrencyCode: null,
              p2p_PaymentCode: null,
              e_DebtorAlias: null,
              mpay_payment_type: null,
              p2p_CurrencyCode: null,
              p2p_RealizationDate: null,
              m_BankLocality: null,
              UserAddress: 'Montenegro',
              CurrencyCodeNumeric: 978,
              m_UserID: null,
              Model: null,
              s_ProcessedDate: '2024-02-02T00:00:00',
              fwNamespace: 'SagaBG.SeP.RetailOutput',
              Alias: null,
              Priority: null,
              s_CurrencyCodeNumeric: 978,
              c_DomesticAmount: null,
              e_DebtorAccount: '222222222222222222',
              s_OrderNumber: '1941240338338940',
              m_JobDescription: null,
              m_AmountTotal: null,
              m_UserAmount: null,
              CurrencyCode: 'EUR',
              ReceiveDate: '2024-02-02T10:00:04',
              m_DebtorName: null,
              ValueDate: '2024-02-02T00:00:00',
              e_UserAlias: null,
              c_TerminalID: null,
              s_StatementID: null,
              e_Channel: '27',
              DebtorAccount: '222222222222222222',
              e_ID: '1140090089',
              e_UserLocality: ' ',
              dev_SpecAmount: 1450,
              p2p_CreateDate: null,
              ID: -1,
              m_DebtorCurrencyCode: null,
              m_CommissionPercentage: null,
              dev_cred_address_postal_code: null,
              DebtorName: 'TEST TEST',
              m_DebtorGroup: null,
              dev_SpecCurrency: 'EUR',
              fwStatus: 1,
              m_ExchangeNumber: null,
              dev_cred_bank_address_postal: null,
              m_UserAlias: null,
              e_DebtorLocality: 'BEOGRAD-ČUKARICA',
              m_PayDeskNumber: null,
              dev_cred_address_line: 'Montenegro',
              dev_SpecPurposeCode: 760,
              c_DebtorDetails: null,
              PaymentAmount: 1450,
              p2p_Amount: null,
              CommissionCurrencyCodeNumeric: 941,
              m_JobType: null,
              OrderNumber_pp: 93212325063,
              dev_BulkId: 93212325063,
              ReceiverReference: null,
              iBankingCreditorTypeFRN: 'legal',
              m_DebtorAlias: null,
              m_CommissionCurrencyCodeNumeric: null,
              UserLocality: ' ',
              c_AuthorizationID: null,
              s_CurrencyCode: 'EUR',
              m_Course: null,
              dev_PersonalNumber: '2804991660056',
              dev_SpecInvoiceYear: null,
              tn_ValueDate: null,
              m_Basics: null,
              e_UserAccount: 'ME00000000000000000000',
              mpay_sales_point_code: null,
              s_AccountPurpose: 'A vista računi fizičkih lica u stranoj valuti',
              c_Reference: null,
              dev_cred_bank_address_line: '2A ARSENIJA BOLJEVICA',
              PaymentCode: null,
              s_Alias: null,
              PaymentStatusName: null,
              dev_cred_bank_address_country: 'CRNA GORA',
              dev_SpecPaymentDescription: 'Sport i rekreacija',
              s_PaymentBasis: 760,
              End2endID: null,
              s_Group: '222222222222222222',
              m_TransactionID: null,
              p2p_Alias: null,
              m_DebtorID: null,
              iBankingProcessedDateCoreFRN: '2024-02-02T10:00:05.47',
              c_Date_tx: null,
              PaymentPurpose: 'training fee',
              c_Alias: null,
              s_ConfirmationDate: '2024-02-02T13:22:02',
              dev_creditor_bank: 'ERSTE BANK AD PODGORICA',
              m_UserGroup: null,
              m_UserName: null,
              dev_SpecialMark: null,
              UserName: 'test doo',
              m_CommissionCurrencyCode: null,
              dev_CreditorBankSwiftCode: 'OPPOMEPG',
              m_ExchangeName: null,
              dev_SwiftMessage: '',
              PaymentState: null,
              s_Amount: 1450,
              dev_Status: 'executed',
              p2p_Status: null,
              m_Operator: null,
              m_UserCurrencyCodeNumeric: null,
              p2p_IssueDate: null,
              dev_AuthorizationType: 'FMTBSIGN',
              dev_ComissionAccount: '111111111111111111',
              m_OrderNumber: null,
              m_UserType: null,
              c_Amount_tx: null,
              dev_SpecInvoiceNumber: '-1',
              m_ExchangeOfficeLocality: null
            }
          },
          {
            CurrencyCode: 'EUR',
            ID: -1,
            TransactionID: '1941240332395195#1##',
            ProcessedDate: '2024-02-02T00:00:00',
            CurrentBalance: null,
            CurrencyCodeNumeric: 978,
            ChequeCardNumber: null,
            fwStatus: 1,
            ClientDescription: 'Dinarsko knjigovodstvo',
            ToDate: '2024-02-10T00:00:00',
            CreditAmount: 0,
            TransactionBeneficiary: 'menjacnica prodaja',
            fwNamespace: 'SagaBG.SeP.RetailOutput',
            IBANNumber: 'RS35222222222222222222',
            ClientAddress: 'TestAddress ',
            SocialIdentityNumber: '2804991660056',
            DebitAmount: 50,
            PreviousBalance: null,
            Reference: '1941240332395195000001',
            AccountNumber: '222222222222222222',
            SalesAgreementNumber: null,
            FromDate: '2024-02-01T00:00:00',
            Description: 'Elektronsko bankarstvo - otkup efektive',
            ClientLocality: '11030 BEOGRAD-ČUKARICA',
            Note: 'EB 1140090083 - kupoprodaja efektive preko WEB-a',
            ValueDate: '2024-02-02T00:00:00',
            ComplaintNumber: '1941240332395195000001',
            TransactionType: 'ExchSell',
            BeneficiaryAccount: null,
            ProductCodeCore: 25,
            AmountTotal: null,
            ClientName: 'TEST TEST',
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
              s_Note_st: 'EB 1140090083 - kupoprodaja efektive preko WEB-a',
              m_Date: '2024-02-02T09:59:00',
              DebtorAddress: null,
              c_CurrencyCode_tx: null,
              c_CalculationDate: null,
              dev_cred_address_locality: null,
              DebtorLocality: null,
              dev_Charge: null,
              Reference: null,
              c_CardNumber: null,
              m_CommissionAmount: 0,
              s_ValueDate: '2024-02-02T00:00:00',
              m_DebtorCurrencyCodeNumeric: 978,
              dev_CreditorAddressCountry: null,
              UserAccount: null,
              p2p_DebtorGroup: null,
              m_DebtorAmount: 50,
              p2p_CurrencyCodeNumeric: null,
              CommissionAmount: null,
              m_UserCurrencyCode: 'RSD',
              p2p_PaymentCode: null,
              e_DebtorAlias: null,
              mpay_payment_type: null,
              p2p_CurrencyCode: null,
              p2p_RealizationDate: null,
              m_BankLocality: 'BEOGRAD',
              UserAddress: null,
              CurrencyCodeNumeric: null,
              m_UserID: '2804991660056',
              Model: null,
              s_ProcessedDate: '2024-02-02T00:00:00',
              fwNamespace: 'SagaBG.SeP.RetailOutput',
              Alias: null,
              Priority: null,
              s_CurrencyCodeNumeric: 978,
              c_DomesticAmount: null,
              e_DebtorAccount: null,
              s_OrderNumber: '1941240332395195',
              m_JobDescription: 'Potvrda o otkupu stranih sredstava placanja',
              m_AmountTotal: 5714.56,
              m_UserAmount: 5714.56,
              CurrencyCode: null,
              ReceiveDate: null,
              m_DebtorName: 'TEST TEST',
              ValueDate: null,
              e_UserAlias: null,
              c_TerminalID: null,
              s_StatementID: null,
              e_Channel: '27',
              DebtorAccount: '222222222222222222',
              e_ID: null,
              e_UserLocality: null,
              dev_SpecAmount: null,
              p2p_CreateDate: null,
              ID: -1,
              m_DebtorCurrencyCode: 'EUR',
              m_CommissionPercentage: 0,
              dev_cred_address_postal_code: null,
              DebtorName: 'TEST TEST',
              m_DebtorGroup: '222222222222222222',
              dev_SpecCurrency: null,
              fwStatus: 1,
              m_ExchangeNumber: 322924924915,
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
              m_JobType: 'O',
              OrderNumber_pp: null,
              dev_BulkId: null,
              ReceiverReference: null,
              iBankingCreditorTypeFRN: null,
              m_DebtorAlias: null,
              m_CommissionCurrencyCodeNumeric: 941,
              UserLocality: null,
              c_AuthorizationID: null,
              s_CurrencyCode: 'EUR',
              m_Course: 114.2911,
              dev_PersonalNumber: null,
              dev_SpecInvoiceYear: null,
              tn_ValueDate: null,
              m_Basics: 796,
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
              s_PaymentBasis: null,
              End2endID: null,
              s_Group: '222222222222222222',
              m_TransactionID: 1140090083,
              p2p_Alias: null,
              m_DebtorID: '2804991660056',
              iBankingProcessedDateCoreFRN: null,
              c_Date_tx: null,
              PaymentPurpose: null,
              c_Alias: null,
              s_ConfirmationDate: '2024-02-02T09:59:22',
              dev_creditor_bank: null,
              m_UserGroup: '111111111111111111',
              m_UserName: 'TEST TEST',
              dev_SpecialMark: null,
              UserName: null,
              m_CommissionCurrencyCode: 'RSD',
              dev_CreditorBankSwiftCode: null,
              m_ExchangeName: 'Raiffeisen banka a.d. Beograd',
              dev_SwiftMessage: null,
              PaymentState: null,
              s_Amount: 50,
              dev_Status: null,
              p2p_Status: null,
              m_Operator: 8932,
              m_UserCurrencyCodeNumeric: 941,
              p2p_IssueDate: null,
              dev_AuthorizationType: null,
              dev_ComissionAccount: null,
              m_OrderNumber: '1941240332395195',
              m_UserType: '2804991660056',
              c_Amount_tx: null,
              dev_SpecInvoiceNumber: null,
              m_ExchangeOfficeLocality: 'Raiffeisen banka a.d. ,ĐORĐA STANOJEVIĆA 16'
            }
          }
        ]
      )).toEqual([
      {
        hold: false,
        date: new Date('2024-02-02T00:00:00'),
        movements: [
          {
            id: '1941240332404852#7#12#93212325063',
            account: {
              id: '111111111111111111RSD'
            },
            invoice: null,
            sum: -1464.52,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Naplata Swift troškova za nostro doznake sa računa za devizno poslovanje',
          mcc: null,
          location: null
        },
        comment: 'Provizija po ino placanju za referencu  93212325063 / test doo Usluga oslobođena PDV-a bez prava na odbitak, prema članu 25. zakona o PDV-u'
      },
      {
        hold: false,
        date: new Date('2024-02-02T00:00:00'),
        movements: [
          {
            id: '1941240332404852#3#12#93212325063',
            account: {
              id: '111111111111111111RSD'
            },
            invoice: null,
            sum: -1325.1,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Naplata provizije za nostro doznake sa računa za devizno poslovanje',
          mcc: null,
          location: null
        },
        comment: 'Provizija po ino placanju za referencu  93212325063 / test doo Usluga oslobođena PDV-a bez prava na odbitak, prema članu 25. zakona o PDV-u'
      },
      {
        hold: false,
        date: new Date('2024-02-02T00:00:00'),
        movements: [
          {
            id: '1941240332395195#11##',
            account: {
              id: '111111111111111111RSD'
            },
            invoice: null,
            sum: 5714.56,
            fee: 0
          },
          {
            id: '1941240332395195#1##',
            account: {
              id: '222222222222222222EUR'
            },
            invoice: null,
            sum: -50,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Elektronsko bankarstvo - otkup efektive',
          mcc: null,
          location: null
        },
        comment: 'EB 1140090083 - kupoprodaja efektive preko WEB-a'
      },
      {
        hold: false,
        date: new Date('2024-02-02T00:00:00'),
        movements: [
          {
            id: '1941240338338940#1#12#93212325063',
            account: {
              id: '222222222222222222EUR'
            },
            invoice: null,
            sum: -1450,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Prenos pri disponibilteskoj overi',
          mcc: null,
          location: null
        },
        comment: 'Prenos na pokrice za placanje, ref.: 93212325063'
      }
    ])
  })
})
