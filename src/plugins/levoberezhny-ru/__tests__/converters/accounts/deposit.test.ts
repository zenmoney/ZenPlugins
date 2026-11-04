import { AccountType } from '../../../../../types/zenmoney'
import { convertAccounts } from '../../../converters'

// 2026-11-04 getMyFinancesPage: complete active contract and both linked accounts.
// Provenance: active-deposit-graph.json, selected graph; personal identifiers sanitized.
it('converts the observed active monthly deposit with its quoted base rate and original term', () => {
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
            limit: 1206,
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
        availableWhenPay: 1206,
        creditWhenPay: 1206,
        fake: false,
        detailSumName: 'С учетом средств на картах',
        detailSum: 294,
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
        id: 920007,
        bankId: 29300,
        name: 'Зарплатный максимум!',
        number: '42304810000000000007',
        iban: 'RU2104500485042304810000000000007',
        permissions: {
          canPay: false,
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
            mode: 'DISABLED',
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
        creditWhenPay: 1000,
        fake: false,
        showSum: 1000,
        detailSumName: 'Средств на счете',
        detailSum: 1000,
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
          openDate: '04.11.2026'
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
        id: 930007,
        contractAccounts: [
          {
            id: 940007,
            amount: 1000,
            currentAmount: 1000,
            availableConversionAmount: 0,
            availableWithdrawalAmount: 0,
            maximumCreditAmount: null,
            minimumCreditAmount: null,
            nextInterestAmount: 4.99,
            interestPaid: 0,
            interestRate: 7,
            minimumBalance: null,
            proportion: null,
            withholdingTax: null,
            interestAccountNumber: '40817810000000000001',
            interestRateComment: 'Базовая ставка 7% годовых\r\n Надбавка 8% годовых, выплачивается за покупки на сумму не менее 20 000 рублей по всем (дебетовым и кредитным) картам Клиента в Банке "Левобережный" и при наличии зачислений заработной платы (в рамках зарплатного проекта или в индивидуальном порядке)',
            interestAccountBankBic: '045004850',
            interestAccountBankFullName: 'БАНК "ЛЕВОБЕРЕЖНЫЙ" (ПАО), БИК: 045004850',
            account: {
              id: 920007,
              number: '42304810000000000007',
              currency: {
                shortName: 'р.',
                code: 'RUB',
                name: 'Российский рубль',
                roundDecimals: -2
              },
              creditAmountsCurrency: null,
              name: 'Зарплатный максимум! (ИБ)',
              comment: 'Зарплатный максимум! (ИБ)',
              qrCode: 'F|bic=045004850|accNum=42304810000000000007|payeeName=Иванов Иван Иванович|purpose=Перевод средств'
            },
            returnAccountNumber: null,
            actions: {
              depositIn: true,
              depositOut: false,
              depositConversion: false,
              canDoStatement: true
            },
            maximumBalance: 1400000,
            minimumGuaranteedRate: null
          }
        ],
        closeDate: null,
        closeDateS: null,
        openDate: 1793725200000,
        openDateS: '04.11.2026',
        productName: 'Зарплатный максимум!',
        number: 'ДФ/TEST0000001',
        term: {
          capitalizationPeriod: 'В последний день месяца',
          conversionMode: null,
          paymentPurpose: null,
          contractPeriod: 91,
          creditEnablePeriodEnd: 1798909200000,
          creditEnablePeriodEndS: '03.01.2027',
          creditEnablePeriodStart: null,
          creditEnablePeriodStartS: '',
          expiryDate: 1801587600000,
          expiryDateS: '03.02.2027',
          lastInterestPayDate: null,
          lastInterestPayDateS: '',
          nextInterestPayDate: 1795971600000,
          nextInterestPayDateS: '30.11.2026',
          typeCode: 'time',
          prolongations: 99,
          creditEnabled: true,
          debitEnabled: false,
          lastProlongationDate: null,
          lastProlongationDateS: '',
          codes: []
        },
        lastUpdateDate: 1793800884000,
        lastUpdateDateS: '04.11.2026',
        bankId: 29300,
        ownerName: 'Иванов Иван Иванович',
        hidden: false,
        archive: false,
        background: 'deposit',
        closeEnabled: true,
        iconName: 'deposit',
        benefitLink: 'https://www.nskbl.ru/private/deposits/deposit/zarplatnyy_maksimumm/',
        curPropertyDetail: [],
        mgsHint: null,
        openRequestId: 970006
      }
    ]
  }
  expect(convertAccounts(source)).toEqual([
    {
      account: {
        id: '920001',
        type: AccountType.ccard,
        title: 'Зарплатный',
        instrument: 'RUB',
        syncIds: [
          '2200********0001',
          '40817810000000000001'
        ],
        balance: 1206,
        archived: false
      },
      fetchParams: {
        accountId: '920001'
      }
    },
    {
      account: {
        id: '920007',
        type: AccountType.deposit,
        startDate: new Date('2026-11-03T17:00:00.000Z'),
        startBalance: 1000,
        percent: 7,
        capitalization: false,
        endDateOffsetInterval: 'day',
        endDateOffset: 91,
        payoffInterval: 'month',
        payoffStep: 1,
        title: 'Зарплатный максимум!',
        instrument: 'RUB',
        syncIds: [
          '42304810000000000007'
        ],
        balance: 1000,
        archived: false
      },
      fetchParams: {
        accountId: '920007',
        historyAvailable: true
      }
    }
  ])
})
