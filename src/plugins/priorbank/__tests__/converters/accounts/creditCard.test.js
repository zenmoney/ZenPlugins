import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          status: {
            respClass: '',
            respCode: 0,
            respText: '',
            module: 11,
            messageForClient: ''
          },
          clientObject: {
            id: 68683521,
            prodType: 2,
            subSystemInstanceId: 4,
            contract_id: '',
            externalId: '32008501',
            identifier: '4774',
            card_type: '4',
            cardTypeName: 'MASTERCARD',
            type: 5,
            typeName: 'Кредитная карта',
            openDate: '2019-09-06T06:49:15+03:00',
            openDateSpecified: true,
            closeDateSpecified: false,
            expDate: '2023-08-31T00:00:00+03:00',
            expDateSpecified: true,
            lastComment: 'Доступны все операции Статус карты: Активна, cтатус картсчёта: 51',
            currCode: 933,
            currIso: 'BYN',
            accessStatus: 2,
            cardStatus: 1,
            cardStatusName: 'Активна',
            cardAccStatus: 51,
            isOpen: 1,
            isLocked: 0,
            corNonCor: 2,
            corNonCorName: 'Некорпоративная',
            pkgName: 'NO_PACK',
            cardMaskedNumber: '************4774',
            cardContractNumber: '7276',
            cardRBSNumber: '<string[30]>',
            dopNonDop: 2,
            cardBin: 0,
            cardColor: '#d8c8b0 ',
            isCardMain: 0,
            contractNum: '<string[19]>',
            contractTypeInt: 0,
            contractTypeName: '',
            defaultSynonym: 'KK4774',
            customSynonym: '',
            contractOpenDateSpecified: false,
            contractCloseDate: '0001-01-01T00:00:00',
            cContractCloseDateSpecified: false,
            dealTerm: 0,
            rate: 0,
            elContractCloseDateSpecified: false,
            minAmount: 0,
            contractRest: 0,
            description: '',
            isStCashCard: 1,
            stCashCardContractId: '749171-4011-162950',
            isElDeposit: false,
            secure3D: 2,
            secure3DText: 'Есть',
            smsNotify: 6,
            smsNotifyText: 'Только бесплатные SMS',
            savings: 0,
            orderValue: 0,
            iban: '<string[0]>',
            bic: '',
            contractNumberReplenishment: '',
            contractNumberRedemption: '1714011162950',
            haveDopCards: false,
            pinAttempts: { maxPINAttempts: 3, currentPINAttempts: 0 },
            isVirtual: 0,
            isEpin: 0
          },
          balance: {
            balance: 0,
            blocked: 0,
            available: 2470,
            ownBlance: 0,
            ovl: 0,
            totalBalance: 0,
            crLimit: 0,
            addLimit: 0,
            finLimit: 0,
            creditBalance: { sum: 0, sumTotal: 0 }
          },
          equivalents: [
            { amount: 1021.92, currencyCode: 840, currency: 'USD' },
            { amount: 937.38, currencyCode: 978, currency: 'EUR' },
            { amount: 71594, currencyCode: 643, currency: 'RUB' }
          ],
          reissueFormId: '',
          expiringStatus: 0
        }
      ],
      [
        {
          id: 68683521,
          identifier: '4774',
          contract:
            {
              prodNum: 0,
              prodType: 'C',
              cardType: 'MASTERCARD',
              contractCurrIso: 'BYN',
              contractNumber: '7276',
              creditLimit: 2500,
              totalBlocked: 0,
              amountAvailable: 2470,
              addrLineA: '<string[16]>',
              addrLineB: '<string[114]>',
              addrLineC: '<string[40]>',
              message: { messageDateSpecified: false, messageString: '' },
              account:
                {
                  transCardList: [],
                  endBalance: -30,
                  beginBalance: -115,
                  plusContracr: 115,
                  minusContracr: 30,
                  feeContracr: 0
                },
              abortedContractList: []
            },
          monthDebit:
            {
              interest: 0,
              ovd: 0,
              due: 0,
              monthlyFee: 0,
              dueDateSpecified: false,
              total: 0
            },
          currentDebit: { due: 0, ovdField: 0, interest: 0, monthlyFee: 0, total: 0 }
        }
      ],
      [
        {
          id: '68683521',
          type: 'ccard',
          title: 'KK4774',
          instrument: 'BYN',
          syncID: ['4774'],
          balance: -30,
          creditLimit: 2500
        }
      ]
    ]
  ])('converts credit card', (apiAccounts, apiAccountDetails, accounts) => {
    expect(convertAccounts(apiAccounts, apiAccountDetails)).toEqual(accounts)
  })
})
