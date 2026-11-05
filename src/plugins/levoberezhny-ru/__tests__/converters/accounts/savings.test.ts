import { convertAccounts } from '../../../converters'

// Observed 2026-11-03 getMyFinancesPage: four complete deposit contracts,
// their complete overlapping account records and the two payment accounts.
// Private provenance: research/2026-11-03/{accounts,deposits}.json; public-safe identifiers.
it('ignores all initially closed deposits and retains known deposits with their history plans', () => {
  const source = {
    accounts: [
      {
        id: 920001,
        bankId: 29300,
        name: 'Зарплатный',
        number: '40817810000000000001',
        iban: 'RU5904500485040817810000000000001',
        permissions: {
          canPay: true,
          canDepositExchange: false,
          debitAvailable: true,
          creditAvailable: true,
          canTransferToOtherBanks: true,
          canTransferToOtherClients: true,
          canPayFsgAndZk: true,
          canDoStatement: true,
          onlineRateAvailable: false,
          onlineRateViaPartnerAvailable: false,
          canUpdateLoanInfo: false,
          closeEnabled: false
        },
        setting: {
          cardsForServiceDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForOwnDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForOwnKt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForOtherDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardToCardForOtherBank: {
            mode: 'WITH_CARDS',
            cardInfoCodes: [
              'CARD.1-3'
            ]
          },
          cardToCardForOwnBank: {
            mode: 'WITH_CARDS',
            cardInfoCodes: [
              'CARD.1-3'
            ]
          },
          cardToCardKt: {
            mode: 'WITH_CARDS',
            cardInfoCodes: [
              'CARD.1-3'
            ]
          },
          cardsForPhoneTransfer: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForDpDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCommCurTransfer: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForFpsDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForFpsBudgetDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForBonusTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForQrFpsDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForCrDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForCrKt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          }
        },
        currency: {
          shortName: 'р.',
          code: 'RUB',
          name: 'Российский рубль',
          roundDecimals: -2
        },
        limits: [
          {
            limit: 1294,
            cards: [
              {
                auxInfoCode: 'CARD.1-3',
                typeId: 'MIR',
                num: '2200 **** **** 0001',
                limitId: '1',
                name: 'МИР Supreme',
                status: 'WORK',
                expireDate: 1824915600000,
                expireDateForCard: '10/27',
                expireDateS: '31.10.2027',
                allowStatement: true,
                showTransSchemes: true,
                canLock: true,
                canUnlock: false,
                hceEnabled: false,
                iconName: 'lb_mir_supreme',
                cardHolderName: 'EXPRESS CARD',
                panMode: 'NONE',
                canChoosePeriodInStatement: true,
                hidden: false,
                virtual: false,
                digitalCard: false,
                digitalCardAttributesEnabled: false,
                canAddToApplePay: false,
                canAddToAndroidPay: false,
                primary: true,
                canReissue: false,
                canClose: false,
                showLimitsAndTransScheme: true,
                changePinEnabled: true,
                pinEncryptionMethod: 'A128GCM',
                cashWithdrawalByQrCode: true,
                cardReissueEnabled: true,
                changePinByUrlEnabled: false,
                canChooseBonusTransfer: false,
                availablePersonalLoyaltyCabinet: false,
                availableOnlineCashback: false,
                smsNotification: false,
                cardActivationEnabled: false,
                plasticCardAttributesEnabled: false
              },
              {
                auxInfoCode: 'CARD.1-1',
                typeId: 'MASTERCARD',
                num: '5493 **** **** 0002',
                limitId: '1',
                name: 'MasterCard Standard',
                status: 'CLOSE',
                expireDate: 1677517200000,
                expireDateForCard: '02/23',
                expireDateS: '28.02.2023',
                allowStatement: false,
                showTransSchemes: false,
                canLock: false,
                canUnlock: false,
                hceEnabled: false,
                iconName: 'BIN_549307_BANK_LEVOBEREZHNYJ_MC_STANDART_01012013_sysdate',
                cardHolderName: 'IVAN IVANOV',
                panMode: 'NONE',
                canChoosePeriodInStatement: false,
                hidden: true,
                virtual: false,
                digitalCard: false,
                digitalCardAttributesEnabled: false,
                canAddToApplePay: false,
                canAddToAndroidPay: false,
                primary: true,
                canReissue: false,
                canClose: false,
                showLimitsAndTransScheme: true,
                changePinEnabled: false,
                cashWithdrawalByQrCode: false,
                cardReissueEnabled: false,
                changePinByUrlEnabled: false,
                canChooseBonusTransfer: false,
                availablePersonalLoyaltyCabinet: false,
                availableOnlineCashback: false,
                smsNotification: false,
                cardActivationEnabled: false,
                plasticCardAttributesEnabled: false
              },
              {
                auxInfoCode: 'CARD.1-2',
                typeId: 'VISA',
                num: '4738 **** **** 0003',
                limitId: '1',
                name: 'Visa Classic',
                status: 'CLOSE',
                expireDate: 1680195600000,
                expireDateForCard: '03/23',
                expireDateS: '31.03.2023',
                allowStatement: false,
                showTransSchemes: false,
                canLock: false,
                canUnlock: false,
                hceEnabled: false,
                iconName: 'Visa_Classic',
                cardHolderName: 'IVAN IVANOV',
                panMode: 'NONE',
                canChoosePeriodInStatement: false,
                hidden: true,
                virtual: false,
                digitalCard: false,
                digitalCardAttributesEnabled: false,
                canAddToApplePay: false,
                canAddToAndroidPay: false,
                primary: true,
                canReissue: false,
                canClose: false,
                showLimitsAndTransScheme: true,
                changePinEnabled: false,
                cashWithdrawalByQrCode: false,
                cardReissueEnabled: false,
                changePinByUrlEnabled: false,
                canChooseBonusTransfer: false,
                availablePersonalLoyaltyCabinet: false,
                availableOnlineCashback: false,
                smsNotification: false,
                cardActivationEnabled: false,
                plasticCardAttributesEnabled: false
              }
            ],
            amounts: []
          }
        ],
        show: true,
        availableWhenPay: 1294,
        creditWhenPay: 1294,
        fake: false,
        detailSumName: 'С учетом средств на картах',
        detailSum: 3000,
        codes: [
          {
            name: 'Задолженность за обслуживание карты',
            value: '0',
            type: 'STRING',
            code: 'BANK.CARD_SRV_DEBT'
          }
        ],
        details: {
          ownerFio: 'Иванов Иван Иванович',
          openDate: '16.09.2014'
        },
        hidden: false,
        archive: false,
        background: 'account',
        showHouseAndUtilityExecutors: false,
        qrCode: 'F|bic=045004850|accNum=40817810000000000001|payeeName=Иванов Иван Иванович|purpose=Перевод средств',
        sbpayAccountBannerEnabled: false
      },
      {
        id: 920002,
        bankId: 29300,
        name: 'НЗ',
        number: '40817810000000000002',
        iban: 'RU0404500485040817810000000000002',
        permissions: {
          canPay: true,
          canDepositExchange: false,
          debitAvailable: true,
          creditAvailable: true,
          canTransferToOtherBanks: true,
          canTransferToOtherClients: true,
          canPayFsgAndZk: true,
          canDoStatement: true,
          onlineRateAvailable: false,
          onlineRateViaPartnerAvailable: false,
          canUpdateLoanInfo: false,
          closeEnabled: false
        },
        setting: {
          cardsForServiceDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForOwnDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForOwnKt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForOtherDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardToCardForOtherBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardForOwnBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardKt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForPhoneTransfer: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForDpDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCommCurTransfer: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForFpsDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForFpsBudgetDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForBonusTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForQrFpsDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForCrDt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          },
          cardsForCrKt: {
            mode: 'WITHOUT_CARDS',
            cardInfoCodes: []
          }
        },
        currency: {
          shortName: 'р.',
          code: 'RUB',
          name: 'Российский рубль',
          roundDecimals: -2
        },
        limits: [],
        show: true,
        availableWhenPay: 50000,
        creditWhenPay: 50000,
        fake: false,
        showSum: 50000,
        detailSumName: 'Средств на счете',
        detailSum: 50000,
        codes: [
          {
            name: 'Задолженность за обслуживание карты',
            value: '0',
            type: 'STRING',
            code: 'BANK.CARD_SRV_DEBT'
          }
        ],
        details: {
          ownerFio: 'Иванов Иван Иванович',
          openDate: '09.07.2018'
        },
        hidden: false,
        archive: false,
        background: 'account',
        showHouseAndUtilityExecutors: false,
        qrCode: 'F|bic=045004850|accNum=40817810000000000002|payeeName=Иванов Иван Иванович|purpose=Перевод средств',
        sbpayAccountBannerEnabled: false,
        docId: 940001
      },
      {
        id: 920004,
        bankId: 29300,
        name: 'Снежинка (ИБ)',
        number: '42305810000000000004',
        iban: 'RU6504500485042305810000000000004',
        permissions: {
          canPay: false,
          canDepositExchange: false,
          debitAvailable: false,
          creditAvailable: false,
          canTransferToOtherBanks: false,
          canTransferToOtherClients: false,
          canPayFsgAndZk: false,
          canDoStatement: true,
          onlineRateAvailable: false,
          onlineRateViaPartnerAvailable: false,
          canUpdateLoanInfo: false,
          closeEnabled: false
        },
        setting: {
          cardsForServiceDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOwnDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOwnKt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOtherDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardForOtherBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardForOwnBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardKt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForPhoneTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForDpDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCommCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForFpsDt: null,
          cardsForFpsBudgetDt: null,
          cardsForBonusTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForQrFpsDt: null,
          cardsForCrDt: null,
          cardsForCrKt: null
        },
        currency: {
          shortName: 'р.',
          code: 'RUB',
          name: 'Российский рубль',
          roundDecimals: -2
        },
        limits: [],
        show: false,
        availableWhenPay: 0,
        creditWhenPay: 0,
        fake: false,
        closeDateS: '07.07.2024',
        showSum: 0,
        detailSumName: 'Средств на счете',
        detailSum: 0,
        details: {
          ownerFio: 'Иванов Иван Иванович',
          openDate: '08.01.2024'
        },
        hidden: false,
        archive: false,
        background: 'account',
        showHouseAndUtilityExecutors: false,
        sbpayAccountBannerEnabled: false
      },
      {
        id: 920003,
        bankId: 29300,
        name: 'Копилка (ИБ)',
        number: '42307810000000000003',
        iban: 'RU9704500485042307810000000000003',
        permissions: {
          canPay: false,
          canDepositExchange: false,
          debitAvailable: false,
          creditAvailable: false,
          canTransferToOtherBanks: false,
          canTransferToOtherClients: false,
          canPayFsgAndZk: false,
          canDoStatement: true,
          onlineRateAvailable: false,
          onlineRateViaPartnerAvailable: false,
          canUpdateLoanInfo: false,
          closeEnabled: false
        },
        setting: {
          cardsForServiceDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOwnDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOwnKt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOtherDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardForOtherBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardForOwnBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardKt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForPhoneTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForDpDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCommCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForFpsDt: null,
          cardsForFpsBudgetDt: null,
          cardsForBonusTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForQrFpsDt: null,
          cardsForCrDt: null,
          cardsForCrKt: null
        },
        currency: {
          shortName: 'р.',
          code: 'RUB',
          name: 'Российский рубль',
          roundDecimals: -2
        },
        limits: [],
        show: false,
        availableWhenPay: 0,
        creditWhenPay: 0,
        fake: false,
        closeDateS: '08.01.2024',
        showSum: 0,
        detailSumName: 'Средств на счете',
        detailSum: 0,
        details: {
          ownerFio: 'Иванов Иван Иванович',
          openDate: '24.05.2023'
        },
        hidden: false,
        archive: false,
        background: 'account',
        showHouseAndUtilityExecutors: false,
        sbpayAccountBannerEnabled: false
      },
      {
        id: 920005,
        bankId: 29300,
        name: 'Капиталъ_4.90.4 (ИБ)',
        number: '42307810000000000005',
        iban: 'RU6204500485042307810000000000005',
        permissions: {
          canPay: false,
          canDepositExchange: false,
          debitAvailable: false,
          creditAvailable: false,
          canTransferToOtherBanks: false,
          canTransferToOtherClients: false,
          canPayFsgAndZk: false,
          canDoStatement: true,
          onlineRateAvailable: false,
          onlineRateViaPartnerAvailable: false,
          canUpdateLoanInfo: false,
          closeEnabled: false
        },
        setting: {
          cardsForServiceDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOwnDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOwnKt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForOtherDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardForOtherBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardForOwnBank: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardToCardKt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForPhoneTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForDpDt: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForCommCurTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForFpsDt: null,
          cardsForFpsBudgetDt: null,
          cardsForBonusTransfer: {
            mode: 'DISABLED',
            cardInfoCodes: []
          },
          cardsForQrFpsDt: null,
          cardsForCrDt: null,
          cardsForCrKt: null
        },
        currency: {
          shortName: 'р.',
          code: 'RUB',
          name: 'Российский рубль',
          roundDecimals: -2
        },
        limits: [],
        show: false,
        availableWhenPay: 0,
        creditWhenPay: 0,
        fake: false,
        closeDateS: '23.04.2025',
        showSum: 0,
        detailSumName: 'Средств на счете',
        detailSum: 0,
        details: {
          ownerFio: 'Иванов Иван Иванович',
          openDate: '19.01.2025'
        },
        hidden: false,
        archive: false,
        background: 'account',
        showHouseAndUtilityExecutors: false,
        sbpayAccountBannerEnabled: false
      }
    ],
    deposits: [
      {
        id: 930006,
        contractAccounts: [
          {
            id: 940002,
            amount: 100000,
            currentAmount: null,
            availableConversionAmount: 0,
            availableWithdrawalAmount: 0,
            maximumCreditAmount: null,
            minimumCreditAmount: 3000,
            nextInterestAmount: null,
            interestPaid: 0.03,
            interestRate: 6.25,
            minimumBalance: null,
            proportion: null,
            withholdingTax: 0,
            interestAccountNumber: '42305810000000000006',
            interestRateComment: '6.25% годовых',
            interestAccountBankBic: '045004850',
            interestAccountBankFullName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО), БИК: 045004850',
            account: {
              id: 920006,
              number: '42305810000000000006',
              currency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              creditAmountsCurrency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              name: 'Копилка+ ИБ',
              comment: 'Копилка+ ИБ',
              qrCode: 'F|bic=045004850|accNum=42305810000000000006|payeeName=Иванов Иван Иванович|purpose=Перевод средств'
            },
            returnAccountNumber: '40817810000000000002',
            actions: {
              depositIn: false,
              depositOut: false,
              depositConversion: false,
              canDoStatement: false
            },
            maximumBalance: null,
            minimumGuaranteedRate: null
          }
        ],
        closeDate: null,
        closeDateS: '22.05.2019',
        openDate: 1558371600000,
        openDateS: '21.05.2019',
        productName: 'Копилка+ ИБ',
        number: 'ДФ/800000',
        term: {
          capitalizationPeriod: 'Относительный. Каждые 90 дн.',
          conversionMode: null,
          paymentPurpose: null,
          contractPeriod: 270,
          creditEnablePeriodEnd: 1573923600000,
          creditEnablePeriodEndS: '17.11.2019',
          creditEnablePeriodStart: null,
          creditEnablePeriodStartS: '',
          expiryDate: 1581699600000,
          expiryDateS: '15.02.2020',
          lastInterestPayDate: null,
          lastInterestPayDateS: '',
          nextInterestPayDate: null,
          nextInterestPayDateS: null,
          typeCode: 'time',
          prolongations: 98,
          creditEnabled: true,
          debitEnabled: true,
          lastProlongationDate: 1558458000000,
          lastProlongationDateS: '22.05.2019',
          codes: []
        },
        lastUpdateDate: 1558552267000,
        lastUpdateDateS: '23.05.2019',
        bankId: 29300,
        ownerName: 'Иванов Иван Иванович',
        hidden: false,
        archive: false,
        background: 'deposit',
        closeEnabled: false,
        iconName: 'deposit',
        benefitLink: null,
        curPropertyDetail: [],
        mgsHint: null,
        openRequestId: 940003
      },
      {
        id: 930003,
        contractAccounts: [
          {
            id: 940004,
            amount: 1000000,
            currentAmount: null,
            availableConversionAmount: 0,
            availableWithdrawalAmount: 0,
            maximumCreditAmount: null,
            minimumCreditAmount: 3000,
            nextInterestAmount: null,
            interestPaid: 42658.94,
            interestRate: 8,
            minimumBalance: null,
            proportion: null,
            withholdingTax: 0,
            interestAccountNumber: '42307810000000000003',
            interestRateComment: '8.00% годовых',
            interestAccountBankBic: '045004850',
            interestAccountBankFullName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО), БИК: 045004850',
            account: {
              id: 920003,
              number: '42307810000000000003',
              currency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              creditAmountsCurrency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              name: 'Копилка (ИБ)',
              comment: 'Копилка (ИБ)',
              qrCode: 'F|bic=045004850|accNum=42307810000000000003|payeeName=Иванов Иван Иванович|purpose=Перевод средств'
            },
            returnAccountNumber: '40817810000000000002',
            actions: {
              depositIn: false,
              depositOut: false,
              depositConversion: false,
              canDoStatement: true
            },
            maximumBalance: null,
            minimumGuaranteedRate: null
          }
        ],
        closeDate: null,
        closeDateS: '08.01.2024',
        openDate: 1684861200000,
        openDateS: '24.05.2023',
        productName: 'Копилка',
        number: 'ДФ/800001',
        term: {
          capitalizationPeriod: 'Каждые 90 дн.',
          conversionMode: null,
          paymentPurpose: null,
          contractPeriod: 1100,
          creditEnablePeriodEnd: 1748365200000,
          creditEnablePeriodEndS: '28.05.2025',
          creditEnablePeriodStart: null,
          creditEnablePeriodStartS: '',
          expiryDate: 1779901200000,
          expiryDateS: '28.05.2026',
          lastInterestPayDate: 1700413200000,
          lastInterestPayDateS: '20.11.2023',
          nextInterestPayDate: null,
          nextInterestPayDateS: null,
          typeCode: 'time',
          prolongations: 99,
          creditEnabled: true,
          debitEnabled: true,
          lastProlongationDate: null,
          lastProlongationDateS: '',
          codes: []
        },
        lastUpdateDate: 1704741146000,
        lastUpdateDateS: '09.01.2024',
        bankId: 29300,
        ownerName: 'Иванов Иван Иванович',
        hidden: true,
        archive: false,
        background: 'deposit',
        closeEnabled: false,
        iconName: 'deposit',
        benefitLink: 'https://www.nskbl.ru/private/deposits/deposit/kopilka4/',
        curPropertyDetail: [],
        mgsHint: null,
        openRequestId: 940005
      },
      {
        id: 930004,
        contractAccounts: [
          {
            id: 940006,
            amount: 1000000,
            currentAmount: null,
            availableConversionAmount: 0,
            availableWithdrawalAmount: 0,
            maximumCreditAmount: null,
            minimumCreditAmount: null,
            nextInterestAmount: null,
            interestPaid: 77147.54,
            interestRate: 15.6,
            minimumBalance: null,
            proportion: null,
            withholdingTax: null,
            interestAccountNumber: '40817810000000000002',
            interestRateComment: '15.60% годовых',
            interestAccountBankBic: '045004850',
            interestAccountBankFullName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО), БИК: 045004850',
            account: {
              id: 920004,
              number: '42305810000000000004',
              currency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              creditAmountsCurrency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              name: 'Снежинка (ИБ)',
              comment: 'Снежинка (ИБ)',
              qrCode: 'F|bic=045004850|accNum=42305810000000000004|payeeName=Иванов Иван Иванович|purpose=Перевод средств'
            },
            returnAccountNumber: '40817810000000000002',
            actions: {
              depositIn: false,
              depositOut: false,
              depositConversion: false,
              canDoStatement: true
            },
            maximumBalance: null,
            minimumGuaranteedRate: null
          }
        ],
        closeDate: null,
        closeDateS: '07.07.2024',
        openDate: 1704646800000,
        openDateS: '08.01.2024',
        productName: 'Снежинка',
        number: 'ДФ/800002',
        term: {
          capitalizationPeriod: 'В конце договора',
          conversionMode: null,
          paymentPurpose: null,
          contractPeriod: 181,
          creditEnablePeriodEnd: null,
          creditEnablePeriodEndS: '',
          creditEnablePeriodStart: null,
          creditEnablePeriodStartS: '',
          expiryDate: 1720285200000,
          expiryDateS: '07.07.2024',
          lastInterestPayDate: 1720285200000,
          lastInterestPayDateS: '07.07.2024',
          nextInterestPayDate: null,
          nextInterestPayDateS: null,
          typeCode: 'time',
          prolongations: 0,
          creditEnabled: false,
          debitEnabled: false,
          lastProlongationDate: null,
          lastProlongationDateS: '',
          codes: []
        },
        lastUpdateDate: 1720310370000,
        lastUpdateDateS: '07.07.2024',
        bankId: 29300,
        ownerName: 'Иванов Иван Иванович',
        hidden: true,
        archive: false,
        background: 'deposit',
        closeEnabled: false,
        iconName: 'deposit',
        benefitLink: 'https://www.nskbl.ru/private/deposits/deposit/snezhinka/',
        curPropertyDetail: [],
        mgsHint: null,
        openRequestId: 940007
      },
      {
        id: 930005,
        contractAccounts: [
          {
            id: 940008,
            amount: 1174624.98,
            currentAmount: null,
            availableConversionAmount: 0,
            availableWithdrawalAmount: 0,
            maximumCreditAmount: null,
            minimumCreditAmount: null,
            nextInterestAmount: null,
            interestPaid: 63720.67,
            interestRate: 20,
            minimumBalance: null,
            proportion: null,
            withholdingTax: null,
            interestAccountNumber: '40817810000000000002',
            interestRateComment: 'На срок до 91 дней - 22.00%; от 91 до 180 дней - 20.00% годовых; от 181 до 270 дней - 18.00% годовых; от 271 до 360 дней - 18.00',
            interestAccountBankBic: '045004850',
            interestAccountBankFullName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО), БИК: 045004850',
            account: {
              id: 920005,
              number: '42307810000000000005',
              currency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              creditAmountsCurrency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              name: 'Капиталъ_4.90.4 (ИБ)',
              comment: 'Капиталъ_4.90.4 (ИБ)',
              qrCode: 'F|bic=045004850|accNum=42307810000000000005|payeeName=Иванов Иван Иванович|purpose=Перевод средств'
            },
            returnAccountNumber: '40817810000000000002',
            actions: {
              depositIn: false,
              depositOut: false,
              depositConversion: false,
              canDoStatement: true
            },
            maximumBalance: null,
            minimumGuaranteedRate: null
          }
        ],
        closeDate: null,
        closeDateS: '23.04.2025',
        openDate: 1737219600000,
        openDateS: '19.01.2025',
        productName: 'Капиталъ',
        number: 'ДФ/800003',
        term: {
          capitalizationPeriod: 'Первые четыре периода выплата через 90 дней, далее каждые 180 дней и по истечении срока вклада',
          conversionMode: null,
          paymentPurpose: null,
          contractPeriod: 1100,
          creditEnablePeriodEnd: null,
          creditEnablePeriodEndS: '',
          creditEnablePeriodStart: null,
          creditEnablePeriodStartS: '',
          expiryDate: 1832259600000,
          expiryDateS: '24.01.2028',
          lastInterestPayDate: 1744995600000,
          lastInterestPayDateS: '19.04.2025',
          nextInterestPayDate: null,
          nextInterestPayDateS: null,
          typeCode: 'time',
          prolongations: 0,
          creditEnabled: false,
          debitEnabled: false,
          lastProlongationDate: null,
          lastProlongationDateS: '',
          codes: []
        },
        lastUpdateDate: 1745437182000,
        lastUpdateDateS: '24.04.2025',
        bankId: 29300,
        ownerName: 'Иванов Иван Иванович',
        hidden: true,
        archive: false,
        background: 'deposit',
        closeEnabled: false,
        iconName: 'deposit',
        benefitLink: 'https://www.nskbl.ru/private/deposits/deposit/kapital2/',
        curPropertyDetail: [],
        mgsHint: null,
        openRequestId: 940009
      }
    ]
  }
  expect(convertAccounts(source)).toEqual([
    {
      account: {
        id: '920001',
        type: 'ccard',
        title: 'Зарплатный',
        instrument: 'RUB',
        syncIds: [
          '2200********0001',
          '40817810000000000001'
        ],
        balance: 1294,
        archived: false
      },
      fetchParams: {
        accountId: '920001'
      }
    },
    {
      account: {
        id: '920002',
        type: 'checking',
        title: 'НЗ',
        instrument: 'RUB',
        syncIds: [
          '40817810000000000002'
        ],
        balance: 50000,
        archived: false
      },
      fetchParams: {
        accountId: '920002'
      }
    }
  ])
  expect(convertAccounts({ accounts: [...source.accounts].reverse(), deposits: [...source.deposits].reverse() }, ['920003', '920004', '920005', '920006'])).toEqual([
    {
      account: {
        id: '920002',
        type: 'checking',
        title: 'НЗ',
        instrument: 'RUB',
        syncIds: [
          '40817810000000000002'
        ],
        balance: 50000,
        archived: false
      },
      fetchParams: {
        accountId: '920002'
      }
    },
    {
      account: {
        id: '920001',
        type: 'ccard',
        title: 'Зарплатный',
        instrument: 'RUB',
        syncIds: [
          '2200********0001',
          '40817810000000000001'
        ],
        balance: 1294,
        archived: false
      },
      fetchParams: {
        accountId: '920001'
      }
    },
    {
      account: {
        id: '920005',
        type: 'checking',
        savings: true,
        title: 'Капиталъ',
        instrument: 'RUB',
        syncIds: [
          '42307810000000000005'
        ],
        balance: 0,
        archived: true
      },
      fetchParams: {
        accountId: '920005',
        historyAvailable: true
      }
    },
    {
      account: {
        id: '920004',
        type: 'deposit',
        startDate: new Date('2024-01-07T17:00:00.000Z'),
        startBalance: 1000000,
        percent: 15.6,
        capitalization: false,
        endDateOffsetInterval: 'day',
        endDateOffset: 181,
        payoffInterval: null,
        payoffStep: 0,
        title: 'Снежинка',
        instrument: 'RUB',
        syncIds: [
          '42305810000000000004'
        ],
        balance: 0,
        archived: true
      },
      fetchParams: {
        accountId: '920004',
        historyAvailable: true
      }
    },
    {
      account: {
        id: '920003',
        type: 'deposit',
        startDate: new Date('2023-05-23T17:00:00.000Z'),
        startBalance: 1000000,
        percent: 8,
        capitalization: true,
        endDateOffsetInterval: 'day',
        endDateOffset: 1100,
        payoffInterval: 'month',
        payoffStep: 3,
        title: 'Копилка',
        instrument: 'RUB',
        syncIds: [
          '42307810000000000003'
        ],
        balance: 0,
        archived: true
      },
      fetchParams: {
        accountId: '920003',
        historyAvailable: true
      }
    },
    {
      account: {
        id: '920006',
        type: 'checking',
        savings: true,
        title: 'Копилка+ ИБ',
        instrument: 'RUB',
        syncIds: [
          '42305810000000000006'
        ],
        balance: null,
        archived: true
      },
      fetchParams: {
        accountId: '920006',
        historyAvailable: false
      }
    }
  ])
})
