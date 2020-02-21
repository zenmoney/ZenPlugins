import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        currentRecommendedPayment:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        marketingName: 'Кредитная карта. ТП 14.7 RUB',
        creationDate: { milliseconds: 1549670400000 },
        tariffFileHash: '3de0844d-a0e8-4790-ae29-0d1488e6a487',
        authorizationsAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 3855.05
          },
        accountIconType: 'MC_ACCOUNT_RUB',
        lastPaymentDate: { milliseconds: 1581668796290 },
        feeNextChargeDate: { milliseconds: 1584133200000 },
        trancheMonthlyPaymentRemaining:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        accountGroup: 'Кредитные карты',
        lastStatementDebtAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 13768.87
          },
        moneyAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 122108.89
          },
        restructuringAccount: false,
        hidden: false,
        currency: { code: 643, name: 'RUB', strCode: '643' },
        loyalty:
          [
            {
              programId: '60',
              amount: 22,
              amountPartial: 22,
              creditLimit: 0,
              usedCreditLimit: 0,
              currentAmount: 0,
              pendingBalance: 1157,
              currentAmountPartial: 0,
              pendingBalancePartial: 1157,
              yearRedeemSum: 32560,
              loyalty: 'Tinkoff Drive',
              name: 'Tinkoff Drive',
              loyaltySteps: 2,
              loyaltyPointsId: 1,
              loyaltyPointsName: 'Баллы',
              loyaltyImagine: true,
              partialCompensation: false,
              primeLoyaltyId: '60',
              primeLoyaltyGroupId: 10,
              bonusPrediction: 978,
              extraBonusIfSpend: 215,
              needToSpend: 3600
            }
          ],
        currentMinimalPayment:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        duedate: { milliseconds: 1582502400000 },
        lastStatementDate: { milliseconds: 1580601600000 },
        partNumber: 'TFPV14.7',
        sumPurchases: 3855.05,
        name: 'Кредитный счет Tinkoff Drive',
        tariffInfo: { lowRate: 0, interestRate: 29.9 },
        nextStatementDate: { milliseconds: 1583010000000 },
        totalExpense:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 35185.19
          },
        totalIncome:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 52681
          },
        accountType: 'Credit',
        debtAmountWithAuths:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 61891.11
          },
        creditLimit:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 184000
          },
        status: 'NORM',
        imported: false,
        clientUnverifiedFlag: 'ClientVerified',
        rate: 0,
        trancheMonthlyPayment:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 5910
          },
        debtAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 58036.06
          },
        cardNumbers:
          [
            {
              pinSet: true,
              statusCode: 'NORM',
              activated: true,
              availableBalance:
                {
                  currency: { code: 643, name: 'RUB', strCode: '643' },
                  value: 122108.89
                },
              cardDesign: 'c62185eb8187af9323366bdb8f404899',
              reissued: false,
              id: '50491018',
              status: 'Активна',
              paymentSystem: 'MC',
              creationDate: { milliseconds: 1549659600000 },
              position: 1,
              ucid: '1050175955',
              hce: false,
              name: 'Tinkoff Drive',
              expirationStatus: 'normal',
              expiration: { milliseconds: 1709154000000 },
              value: '521324******7824',
              primary: true
            },
            {
              pinSet: true,
              statusCode: 'NORM',
              activated: true,
              cardIssueType: '4',
              availableBalance:
                {
                  currency: { code: 643, name: 'RUB', strCode: '643' },
                  value: 122108.89
                },
              cardDesign: 'c62185eb8187af9323366bdb8f404899',
              reissued: false,
              id: '50564909',
              status: 'Активна',
              paymentSystem: 'MC',
              creationDate: { milliseconds: 1549832400000 },
              position: 2,
              ucid: '1050249848',
              hce: false,
              name: 'Tinkoff Drive',
              expirationStatus: 'normal',
              expiration: { milliseconds: 1711832400000 },
              value: '521324******1242',
              primary: false
            }
          ],
        afterNextStatementDate: { milliseconds: 1585688400000 },
        id: '0363487824'
      },
      {
        id: '0363487824',
        type: 'ccard',
        title: 'Кредитный счет Tinkoff Drive',
        instrument: 'RUB',
        syncID: [
          '521324******7824',
          '521324******1242',
          '0363487824'
        ],
        balance: -61891.11,
        creditLimit: 184000,
        totalAmountDue: 13768.87,
        gracePeriodEndDate: new Date(1582502400000)
      }
    ],
    [
      {
        currentRecommendedPayment:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        marketingName: 'Кредитная карта. ТП 14.13 RUB',
        creationDate: { milliseconds: 1581465600000 },
        tariffFileHash: '60990389-72ec-4f2d-bd5f-a948211183df',
        authorizationsAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        accountIconType: 'MC_ACCOUNT_RUB',
        lastPaymentDate: { milliseconds: 1582303748601 },
        feeNextChargeText: 'не взимается',
        accountGroup: 'Кредитные карты',
        lastStatementDebtAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        moneyAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 150000
          },
        restructuringAccount: false,
        hidden: false,
        currency: { code: 643, name: 'RUB', strCode: '643' },
        loyalty:
          [
            {
              programId: '69',
              amount: 75,
              amountPartial: 75,
              creditLimit: 0,
              usedCreditLimit: 0,
              currentAmount: 0,
              pendingBalance: 0,
              currentAmountPartial: 0,
              pendingBalancePartial: 0,
              yearRedeemSum: 0,
              loyalty: 'YandexPlus',
              name: 'Яндекс.Плюс',
              loyaltySteps: 1,
              loyaltyPointsId: 3,
              loyaltyPointsName: 'Rubles',
              loyaltyImagine: true,
              partialCompensation: false,
              primeLoyaltyId: '69',
              primeLoyaltyGroupId: 0
            }
          ],
        currentMinimalPayment:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        lastStatementDate: { milliseconds: 1581465600000 },
        partNumber: 'TFPV14.13',
        sumPurchases: 0,
        name: 'Кредитный счет Яндекс.Плюс',
        tariffInfo: { lowRate: 0, interestRate: 15 },
        nextStatementDate: { milliseconds: 1585515600000 },
        totalExpense:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 7621.77
          },
        totalIncome:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 7621.77
          },
        accountType: 'Credit',
        debtAmountWithAuths:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        creditLimit:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 150000
          },
        status: 'NORM',
        imported: false,
        clientUnverifiedFlag: 'ClientVerified',
        rate: 0,
        debtAmount:
          {
            currency: { code: 643, name: 'RUB', strCode: '643' },
            value: 0
          },
        cardNumbers:
          [
            {
              pinSet: true,
              statusCode: 'NORM',
              activated: true,
              availableBalance:
                {
                  currency: { code: 643, name: 'RUB', strCode: '643' },
                  value: 150000
                },
              cardDesign: '65e84fa67b9763669220ea8f6baa1ba8',
              reissued: false,
              id: '68666491',
              status: 'Активна',
              paymentSystem: 'MC',
              creationDate: { milliseconds: 1581454800000 },
              position: 1,
              ucid: '1070244389',
              hce: false,
              name: 'Яндекс.Плюс',
              expirationStatus: 'normal',
              expiration: { milliseconds: 1740690000000 },
              value: '521324******5234',
              primary: true
            }
          ],
        afterNextStatementDate: { milliseconds: 1588194000000 },
        id: '0463878255'
      },
      {
        id: '0463878255',
        type: 'ccard',
        title: 'Кредитный счет Яндекс.Плюс',
        instrument: 'RUB',
        syncID: [
          '521324******5234',
          '0463878255'
        ],
        balance: 0,
        creditLimit: 150000,
        totalAmountDue: null,
        gracePeriodEndDate: null
      }
    ]
  ])('converts credit card', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
