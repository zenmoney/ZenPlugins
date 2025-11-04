import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import _ from 'lodash'

export interface ConvertResult {
  product: {
    id: number
  }
  account: AccountOrCard
}

/*
  {
        "id": 220287,
        "userId": 2398406,
        "companyId": null,
        "cardRetailId": 1768314,
        "cardProductId": 2402,
        "cardLimitGroupId": 6,
        "name": "Mastercard Standard \"\u041c\u043e\u0446\u043d\u0430\u044f\"",
        "last4": "0125",
        "ibanNum": "BY24UNBS30145120002969050933",
        "cardBin": "514421061",
        "status": 0,
        "nameOnCard": "XXX XX",
        "currencies": 933,
        "rbsContract": "017517505120002969",
        "companyName": null,
        "contractNumber": 512002969,
        "contractKind": 1512,
        "stateSignature": "BETRAY",
        "cardNumber": null,
        "expiryDate": null,
        "currencyLetter": "BYN",
        "type": "RETAIL",
        "token": null,
        "stamp": null,
        "first6": null,
        "tokenizedCardProductGroupId": null,
        "isBelarus": null,
        "balance": 4.02,
        "balanceDate": 1757321925995,
        "active": true,
        "enabled": true,
        "isBlock": false,
        "isCurrent": true,
        "isExpired": false,
        "isDeleted": false,
        "isCorporate": false,
        "isCardOwner": true,
        "isIbanOwner": true,
        "isOneCardOnContract": true,
        "isExpiringWithinMonth": false,
        "isActivationPermitted": true,
        "isCryptoCourse": false,
        "isLimitChangeAvailable": true,
        "isDefaultLimitGroup": true,
        "cardLimitId": 6,
        "mpsId": 1,
        "mpsDesignId": 2,
        "isDigital": false,
        "cardDesignName": "MS",
        "accType": null,
        "cardProductGroupName": null,
        "isBestCard": true,
        "bestCardPoints": null,
        "mps": {
            "id": 1,
            "name": "Mastercard",
            "imageLink": "https://mobile.bsb.by/api/v1/free-zone-management/card-products/get-image/mps-design/2",
            "mpsDesignId": 2
        },
        "designSource": [
            {
                "id": 40,
                "name": "\u0414\u0438\u0437\u0430\u0439\u043d \u043a\u0430\u0440\u0442\u044b Mastercard Standard / MS \u041c\u043e\u0446\u043d\u0430\u044f / \u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0434\u043b\u044f \u041c\u0411 (\u043c\u0438\u043d\u0438\u0430\u0442\u044e\u0440\u043a\u0430)",
                "sourceType": "MOBILE_APP_NEW",
                "imageType": "SMALL",
                "color": null,
                "designType": "MS",
                "imageLink": "https://mobile.bsb.by/api/v1/free-zone-management/card-product-groups/images/download?path=mobile-card-product/design-old/minio_40.png",
                "description": null
            },
            {
                "id": 38,
                "name": "\u0414\u0438\u0437\u0430\u0439\u043d \u043a\u0430\u0440\u0442\u044b Mastercard Standard / MS \u041c\u043e\u0446\u043d\u0430\u044f / \u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0434\u043b\u044f \u041c\u0411 (\u043e\u0431\u043e\u0440\u043e\u0442)",
                "sourceType": "MOBILE_APP_NEW",
                "imageType": "BACK",
                "color": {
                    "id": 1,
                    "description": "\u0411\u0435\u043b\u0430\u044f \u0438\u043a\u043e\u043d\u043a\u0430 \u0438 \u0431\u0435\u043b\u044b\u0439 \u0442\u0435\u043a\u0441\u0442",
                    "icon": "#FFFFFF",
                    "text": "#FFFFFF"
                },
                "designType": "MS",
                "imageLink": "https://mobile.bsb.by/api/v1/free-zone-management/card-product-groups/images/download?path=mobile-card-product/design-old/minio_38.png",
                "description": null
            },
            {
                "id": 162,
                "name": "Mastercard Standard \"\u041c\u043e\u0446\u043d\u0430\u044f\" widget",
                "sourceType": "MOBILE_APP_NEW",
                "imageType": "WIDGET",
                "color": {
                    "id": 2,
                    "description": "\u0411\u0435\u043b\u044b\u0439 \u0442\u0435\u043a\u0441\u0442",
                    "icon": null,
                    "text": "#FFFFFF"
                },
                "designType": "MSP",
                "imageLink": "https://mobile.bsb.by/api/v1/free-zone-management/card-product-groups/images/download?path=mobile-card-product/design/1d1f4009-dd6c-4ab4-a147-b7443b977678_Mastercard Standard.png",
                "description": "Mastercard Standard \"Motsnaya\" widget design"
            },
            {
                "id": 39,
                "name": "\u0414\u0438\u0437\u0430\u0439\u043d \u043a\u0430\u0440\u0442\u044b Mastercard Standard / MS \u041c\u043e\u0446\u043d\u0430\u044f / \u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0434\u043b\u044f \u041c\u0411 (\u0433\u043b\u0430\u0432\u043d\u0430\u044f)",
                "sourceType": "MOBILE_APP_NEW",
                "imageType": "FRONT",
                "color": {
                    "id": 2,
                    "description": "\u0411\u0435\u043b\u044b\u0439 \u0442\u0435\u043a\u0441\u0442",
                    "icon": null,
                    "text": "#FFFFFF"
                },
                "designType": "MS",
                "imageLink": "https://mobile.bsb.by/api/v1/free-zone-management/card-product-groups/images/download?path=mobile-card-product/design-old/minio_39.png",
                "description": null
            }
        ],
        "isKids": false,
        "createdAt": "2024-02-19T14:08:47.585475",
        "updatedAt": "2025-09-08T11:58:45.995496",
        "expiredDateString": null,
        "expiringWithinMonthString": null,
        "isHiddenBalance": false,
        "isRenewal": false
    },
   */
export function convertCards (apiCards: unknown[]): ConvertResult[] {
  return apiCards
    .filter(card => _.get(card, 'active') === true && _.get(card, 'isDeleted') === false && _.get(card, 'isHiddenBalance') === false)
    .map(card => {
      const currencies = _.get(card, 'currencies') as number
      const currencyLetter = _.get(card, 'currencyLetter') as string
      const instrument = (currencyLetter != null && currencyLetter !== '') ? currencyLetter : (codeToCurrencyLookup[currencies] ?? 'BYN')

      return {
        product: {
          id: Number(_.get(card, 'id'))
        },
        account: {
          id: String(_.get(card, 'id')),
          type: AccountType.ccard,
          title: _.get(card, 'name'),
          instrument,
          balance: _.get(card, 'balance'),
          syncIds: [
            String(_.get(card, 'id')),
            _.get(card, 'ibanNum'),
            _.get(card, 'last4')
          ]
        }
      }
    })
}

/*
   private final BigDecimal amount;
    private final Calendar closeDate;
    private final Long contractNumber; // cardId?
    private final Currency currency;
    private final String ibanNum;
    private final Long id;
    private final Boolean isAllIncome;
    private final Boolean isArrest;
    private final Boolean isForSmp;
    private final String name;
    private final Calendar openDate;
    private final Long userId;
  */
export function convertAccounts (apiAccounts: unknown[]): ConvertResult[] {
  return apiAccounts
    .filter(account => _.get(account, 'isArrest') === true)
    .map(account => {
      const currencyCode = _.get(account, 'currency.code') as number
      const currencyLetterCode = _.get(account, 'currency.letterCode') as string
      const instrument = (currencyLetterCode != null && currencyLetterCode !== '') ? currencyLetterCode : (codeToCurrencyLookup[currencyCode] ?? 'BYN')

      return {
        product: {
          id: Number(_.get(account, 'id'))
        },
        account: {
          id: String(_.get(account, 'id')),
          type: AccountType.checking,
          title: _.get(account, 'name'),
          instrument,
          balance: _.get(account, 'amount'),
          syncIds: [
            String(_.get(account, 'id')),
            _.get(account, 'ibanNum')
          ]
        }
      }
    })
}
/*
  {
            "id": 113710793,
            "userId": 2398406,
            "cardId": 220287,
            "paymentDate": "05/09/2025 20:34:15",
            "last4namePayer": "0125, XX XX",
            "currCode": "BYN",
            "target": "MAGAZIN SANTA-316",
            "paymentTypeId": null,
            "status": 1,
            "paymentName": null,
            "paymentType": "TRANSACTION",
            "isEnrollment": false,
            "summa": 7.42,
            "balanceBefore": 11.44,
            "balanceAfter": 4.02,
            "currencyTypePayer": "BYN",
            "statusSignature": "\u0423\u0441\u043f\u0435\u0448\u043d\u043e",
            "cardRetailIdRecipient": null,
            "commentText": null,
            "favoriteId": null
        },
  */
export function convertTransactions (apiTransactions: unknown[]): Transaction[] {
  return apiTransactions
    .map(transaction => {
      try {
        return {
          hold: false,
          date: parseDate(_.get(transaction, 'paymentDate')),
          movements: [
            {
              id: String(_.get(transaction, 'id')),
              account: { id: String(_.get(transaction, 'cardId')) },
              sum: _.get(transaction, 'summa'),
              fee: 0,
              invoice: null
            }
          ],
          merchant: {
            fullTitle: _.get(transaction, 'target'),
            mcc: null,
            location: null
          },
          comment: _.get(transaction, 'commentText')
        }
      } catch (e) {
        console.error(e, transaction)
        throw new Error('Failed to convert transaction')
      }
    })
}

function parseDate (dateString: string): Date {
  // Parse format "05/09/2025 20:34:15" -> MM/DD/YYYY HH:mm:ss
  const [datePart, timePart] = dateString.split(' ')
  const [month, day, year] = datePart.split('/').map(Number)
  const [hours, minutes, seconds] = timePart.split(':').map(Number)

  return new Date(year, month - 1, day, hours, minutes, seconds)
}
