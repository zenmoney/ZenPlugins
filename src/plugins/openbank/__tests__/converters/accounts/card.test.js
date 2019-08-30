import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          'cardId': '8388244',
          'maskCardNum': '5586********7823',
          'virtualCardNum': '55865769020V7823',
          'tariffPlan': { 'name': 'Opencard', 'tariffInfoURL': 'https://cdn.open.ru/storage/files/tariff_opencard.pdf' },
          'bic': '044525297',
          'cardType': 'PayPass MasterCard World',
          'paySystem': 'Master Card',
          'balance': { 'amount': 21044.33, 'currency': 'RUR' },
          'status': { 'code': 'NORMAL', 'value': 'Активна' },
          'externalId': '8388244',
          'designCode': '*MC World PayPass (Смарт)',
          'designFileName': 'https://ib.open.ru/webbank/image/card-design/wb-small/9e1c15752c0c8ae4712d371f6e17d967.jpg',
          'cardExpDate': '2023-06-30T00:00:00.000+0300',
          'main': true,
          'bankName': 'Openbank',
          'bsc': '3C',
          'startDate': '2019-06-01T00:00:00.000+0300',
          'lastTransactionDate': '2019-08-13T00:00:00.000+0300',
          'type': 'debit',
          'productType': 'CARD',
          'prodGroup': '713',
          'cardPC': 'WAY4',
          'idExt': '8106794',
          'holderName': 'NIKOLAY NIKOLAEV',
          'applePayAllowed': true,
          'mbCardDesignFull': 'https://ib.open.ru/webbank/image/card-design/mb-full/9e1c15752c0c8ae4712d371f6e17d967.png',
          'mbHalfCardDesign': 'https://ib.open.ru/webbank/image/card-design/mb-half/9e1c15752c0c8ae4712d371f6e17d967.png',
          'overdue': false,
          'loyaltyInfo': {
            'bonusInfo': { 'type': 'openCard', 'totalValue': 1084.56, 'compensationBlockedByOverdue': false },
            'freeP2PLimit': 20000.0,
            'freeP2PMaxLimit': 20000.0,
            'freeP2PCurrentSum': 0.0
          },
          'accNum': '40817810380003320020',
          'accName': 'Николаев Николай Николаевич',
          'paySystemPC': 'WAY4',
          'resident': true,
          'pinChangeAvailable': true,
          'reissueInfo': { 'available': true, 'free': true, 'term': 'Перевыпуск занимает до 5 рабочих дней', 'days': '5' },
          'amountVisible': true,
          'updateTime': 1565870749045,
          'creditLimit': 0.0,
          'preferentialRate': true,
          'issueType': 'PERSO',
          'accBackSystemClientId': '8106794',
          'smsInfoAvailable': true
        }
      ],
      {
        products: [
          {
            id: '8388244',
            type: 'card'
          }
        ],
        account: {
          id: '40817810380003320020',
          type: 'ccard',
          title: 'Opencard',
          instrument: 'RUR',
          syncID: [
            '5586********7823',
            '40817810380003320020'
          ],
          available: 21044.33
        }
      }
    ],
    [
      [
        {
          cardId: '8580520',
          maskCardNum: '5586********8933',
          virtualCardNum: '55865877913V8933',
          tariffPlan:
            {
              name: 'Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard.pdf'
            },
          name: 'Света',
          bic: '044525297',
          cardType: 'PayPass MasterCard World',
          paySystem: 'Master Card',
          balance: { amount: 4097.06, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8580520',
          designCode: '*MC World PayPass (Смарт)',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/9e1c15752c0c8ae4712d371f6e17d967.jpg',
          cardExpDate: '2023-07-31T00:00:00.000+0300',
          main: false,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2019-07-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-15T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          prodGroup: '713',
          cardPC: 'WAY4',
          idExt: '3387812',
          holderName: 'NIKOLAIDA NIKOLAEVA',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/9e1c15752c0c8ae4712d371f6e17d967.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/9e1c15752c0c8ae4712d371f6e17d967.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo: { type: 'openCard', compensationBlockedByOverdue: false },
              freeP2PLimit: 20000,
              freeP2PMaxLimit: 20000,
              freeP2PCurrentSum: 0
            },
          accNum: '40817810780003792345',
          accName: 'Николаев Николай Николаевич',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1565901946186,
          creditLimit: 0,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '3387812',
          smsInfoAvailable: true
        },
        {
          cardId: '8387265',
          maskCardNum: '5586********6723',
          virtualCardNum: '55865745970V6723',
          tariffPlan:
            {
              name: 'Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard.pdf'
            },
          name: 'Толик',
          bic: '044525297',
          cardType: 'PayPass MasterCard World',
          paySystem: 'Master Card',
          balance: { amount: 4097.06, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8387265',
          designCode: '*MC World PayPass (Смарт)',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/9e1c15752c0c8ae4712d371f6e17d967.jpg',
          cardExpDate: '2023-06-30T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2019-06-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-15T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          prodGroup: '713',
          cardPC: 'WAY4',
          idExt: '3387812',
          holderName: 'NIKOLAY NIKOLAEV',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/9e1c15752c0c8ae4712d371f6e17d967.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/9e1c15752c0c8ae4712d371f6e17d967.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo:
                {
                  type: 'openCard',
                  totalValue: 2186.39,
                  compensationBlockedByOverdue: false
                },
              freeP2PLimit: 20000,
              freeP2PMaxLimit: 20000,
              freeP2PCurrentSum: 0
            },
          accNum: '40817810780003792345',
          accName: 'Николаев Николай Николаевич',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1565901946180,
          creditLimit: 0,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '3387812',
          smsInfoAvailable: true
        }
      ],
      {
        products: [
          {
            id: '8580520',
            type: 'card'
          },
          {
            id: '8387265',
            type: 'card'
          }
        ],
        account: {
          id: '40817810780003792345',
          type: 'ccard',
          title: 'Opencard',
          instrument: 'RUR',
          syncID: [
            '5586********8933',
            '5586********6723',
            '40817810780003792345'
          ],
          available: 4097.06
        }
      }
    ],
    [
      [
        {
          cardId: '8064014',
          maskCardNum: '4058********0954',
          virtualCardNum: '40585489524V0954',
          tariffPlan:
            {
              name: 'Кредитная Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard_credit.pdf'
            },
          bic: '044525297',
          cardType: 'Visa Gold Rewards',
          paySystem: 'VISA',
          balance: { amount: 72401.74, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8064014',
          designCode: '*Visa Rewards EMV PayWave_Smart_white',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/103cee0b58b4352a17080c3640d95332.jpg',
          cardExpDate: '2023-04-30T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2019-04-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-07T00:00:00.000+0300',
          type: 'credit',
          productType: 'CARD',
          prodGroup: '712',
          cardPC: 'WAY4',
          idExt: '7833816',
          holderName: 'NIKOLAY NIKOLAEV',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/103cee0b58b4352a17080c3640d95332.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/103cee0b58b4352a17080c3640d95332.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo:
                {
                  type: 'openCard',
                  totalValue: 1367.04,
                  compensationBlockedByOverdue: false
                }
            },
          accNum: '40817810580001495803',
          accName: 'Николаев Николай Николаевич',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1565940899832,
          creditLimit: 100000,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '7833816',
          smsInfoAvailable: true
        }
      ],
      {
        products: [
          {
            id: '8064014',
            type: 'card'
          }
        ],
        account: {
          id: '40817810580001495803',
          type: 'ccard',
          title: 'Кредитная Opencard',
          instrument: 'RUR',
          syncID: [
            '4058********0954',
            '40817810580001495803'
          ],
          available: 72401.74,
          creditLimit: 100000
        }
      }
    ],
    [
      [
        {
          cardId: '434651093',
          maskCardNum: '416038******7923',
          virtualCardNum: '5AB21A689F060090E0530A42961EBE6E',
          tariffPlan: {},
          bic: '044525985',
          cardType: 'PKB Visa Electron PERM',
          paySystem: 'VISA',
          balance: { amount: 2523.78, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '434651093',
          designCode: 'PKB VISA Electron',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/267c78f96bee46230d8cc2e2f2320322.jpg',
          cardExpDate: '2019-10-31T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: 'TWR',
          startDate: '2017-10-01T00:00:00.000+0300',
          lastTransactionDate: '2019-07-31T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          cardPC: 'TWO',
          idExt: '4421565',
          holderName: 'NIKOLAY NIKOLAEV',
          applePayAllowed: false,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/267c78f96bee46230d8cc2e2f2320322.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/267c78f96bee46230d8cc2e2f2320322.png',
          overdue: false,
          accNum: '40817810555511271980',
          accName: 'Николаев Николай Николаевич',
          paySystemPC: 'TWO',
          resident: true,
          pinChangeAvailable: false,
          reissueInfo: { available: false, free: false },
          amountVisible: true,
          updateTime: 1566364197898,
          creditLimit: 0,
          preferentialRate: false,
          smsInfoAvailable: false
        }
      ],
      {
        products: [
          {
            id: '434651093',
            type: 'card'
          }
        ],
        account: {
          id: '40817810555511271980',
          type: 'ccard',
          title: 'PKB Visa Electron PERM',
          instrument: 'RUR',
          syncID: [
            '416038******7923',
            '40817810555511271980'
          ],
          available: 2523.78
        }
      }
    ],
    [
      [
        {
          cardId: '12155984',
          maskCardNum: '4627********0125',
          virtualCardNum: '12155984',
          tariffPlan: {},
          name: 'Visa Gold',
          bic: '044525175',
          cardType: 'Visa Gold',
          paySystem: 'VISA',
          balance: { amount: 0, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '12155984',
          designCode: 'vrkk02',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/b5028790c76c692359ef479ebb678759.jpg',
          cardExpDate: '2021-05-01T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: 'BINRBO',
          startDate: '2017-05-24T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          cardPC: 'BIN',
          idExt: '128996879000',
          holderName: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          applePayAllowed: false,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/b5028790c76c692359ef479ebb678759.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/b5028790c76c692359ef479ebb678759.png',
          overdue: false,
          accNum: '-',
          accName: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          paySystemPC: 'BIN',
          resident: true,
          pinChangeAvailable: false,
          reissueInfo: { available: false, free: false },
          amountVisible: true,
          updateTime: 1566299543964,
          preferentialRate: false,
          inn: '7706092528',
          restrictions:
            [
              'DEPOSIT_OPEN',
              'OFFER',
              'DEPOSIT_CLOSE_DESTINATION',
              'INVEST_UK',
              'METAL_OPEN',
              'PIN_CHANGE',
              'ACCUMULATION_OPEN',
              'METAL_BUY',
              'CONVERSION',
              'SMS_INFO',
              'METAL_SELL',
              'TRANSACTIONS',
              'FREE_REQUISITES',
              'PHONE',
              'BLOCK_UNBLOCK',
              'INVEST_BROKER'
            ],
          smsInfoAvailable: false
        }
      ],
      {
        products: [
          {
            id: '12155984',
            type: 'card'
          }
        ],
        account: {
          id: '4627********0125',
          type: 'ccard',
          title: 'Visa Gold',
          instrument: 'RUR',
          syncID: [
            '4627********0125'
          ],
          available: 0
        }
      }
    ],
    [
      [
        {
          cardId: '12155984',
          maskCardNum: '4627********9209',
          virtualCardNum: '12155984',
          tariffPlan: {},
          name: 'Visa Gold',
          bic: '044525175',
          cardType: 'Visa Gold',
          paySystem: 'VISA',
          balance: { amount: 0, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '12155984',
          designCode: 'vrkk02',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/b5028790c76c692359ef479ebb678759.jpg',
          cardExpDate: '2021-05-01T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: 'BINRBO',
          startDate: '2017-05-24T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          cardPC: 'BIN',
          idExt: '128996879000',
          holderName: 'Николаева Николаида Николаевна',
          applePayAllowed: false,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/b5028790c76c692359ef479ebb678759.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/b5028790c76c692359ef479ebb678759.png',
          accNum: '-',
          accName: 'Николаева Николаида Николаевна',
          paySystemPC: 'BIN',
          resident: true,
          pinChangeAvailable: false,
          reissueInfo: { available: false, free: false },
          amountVisible: true,
          updateTime: 1566887901815,
          smsInfo: { status: 'Inactive', cardId: '12155984' },
          preferentialRate: false,
          restrictions:
            [
              'TRANSACTIONS',
              'PIN_CHANGE',
              'OFFER',
              'DEPOSIT_CLOSE_DESTINATION',
              'INVEST_BROKER',
              'DEPOSIT_OPEN',
              'METAL_SELL',
              'SMS_INFO',
              'INVEST_UK',
              'ACCUMULATION_OPEN',
              'METAL_BUY',
              'FREE_REQUISITES',
              'BLOCK_UNBLOCK',
              'METAL_OPEN',
              'CONVERSION',
              'PHONE'
            ],
          smsInfoAvailable: false
        },
        {
          cardId: '8493076',
          maskCardNum: '4627********9209',
          virtualCardNum: '46275828344V9209',
          tariffPlan:
            {
              name: 'Кредитная Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard_credit.pdf'
            },
          bic: '044525297',
          cardType: 'Visa Gold Credit',
          paySystem: 'VISA',
          balance: { amount: 48453.06, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8493076',
          designCode: 'Синяя птица VISA БИНБанк',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/d2e31c4914ec7f9c8d6c632f09000ac3.jpg',
          cardExpDate: '2021-05-31T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2017-05-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-22T00:00:00.000+0300',
          type: 'credit',
          productType: 'CARD',
          prodGroup: '712',
          cardPC: 'WAY4',
          idExt: '3597505',
          holderName: 'NIKOLAIDA NIKOLAEVA',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/d2e31c4914ec7f9c8d6c632f09000ac3.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/d2e31c4914ec7f9c8d6c632f09000ac3.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo:
                {
                  type: 'openCard',
                  totalValue: 311.68,
                  compensationBlockedByOverdue: false
                }
            },
          accNum: '40817810380003898234',
          accName: 'Николаева Николаида Николаевна',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1566887902245,
          smsInfo: { status: 'Active', phone: '79608704822', cardId: '8493076' },
          creditLimit: 54000,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '3597505',
          smsInfoAvailable: true
        },
        {
          cardId: '12155985',
          maskCardNum: '4627********8142',
          virtualCardNum: '12155985',
          tariffPlan: {},
          name: 'Visa Gold',
          bic: '044525175',
          cardType: 'Visa Gold',
          paySystem: 'VISA',
          balance: { amount: 0, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '12155985',
          designCode: 'vrkk02',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/b5028790c76c692359ef479ebb678759.jpg',
          cardExpDate: '2020-10-01T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: 'BINRBO',
          startDate: '2016-10-27T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          cardPC: 'BIN',
          idExt: '128996879000',
          holderName: 'Николаева Николаида Николаевна',
          applePayAllowed: false,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/b5028790c76c692359ef479ebb678759.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/b5028790c76c692359ef479ebb678759.png',
          accNum: '-',
          accName: 'Николаева Николаида Николаевна',
          paySystemPC: 'BIN',
          resident: true,
          pinChangeAvailable: false,
          reissueInfo: { available: false, free: false },
          amountVisible: true,
          updateTime: 1566887901821,
          smsInfo: { status: 'Inactive', cardId: '12155985' },
          preferentialRate: false,
          restrictions:
            [
              'TRANSACTIONS',
              'PIN_CHANGE',
              'OFFER',
              'DEPOSIT_CLOSE_DESTINATION',
              'INVEST_BROKER',
              'DEPOSIT_OPEN',
              'METAL_SELL',
              'SMS_INFO',
              'INVEST_UK',
              'ACCUMULATION_OPEN',
              'METAL_BUY',
              'FREE_REQUISITES',
              'BLOCK_UNBLOCK',
              'METAL_OPEN',
              'CONVERSION',
              'PHONE'
            ],
          smsInfoAvailable: false
        },
        {
          cardId: '8491452',
          maskCardNum: '4627********8142',
          virtualCardNum: '46275828346V8142',
          tariffPlan:
            {
              name: 'Opencard',
              tariffInfoURL: 'https://cdn.open.ru/storage/files/tariff_opencard.pdf'
            },
          bic: '044525297',
          cardType: 'Visa Gold Credit',
          paySystem: 'VISA',
          balance: { amount: 0, currency: 'RUR' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '8491452',
          designCode: 'Синяя птица VISA БИНБанк',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/d2e31c4914ec7f9c8d6c632f09000ac3.jpg',
          cardExpDate: '2020-10-31T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: '3C',
          startDate: '2016-10-01T00:00:00.000+0300',
          lastTransactionDate: '2019-08-26T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          prodGroup: '713',
          cardPC: 'WAY4',
          idExt: '3597505',
          holderName: 'Николаева Николаида Николаевна',
          applePayAllowed: true,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/d2e31c4914ec7f9c8d6c632f09000ac3.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/d2e31c4914ec7f9c8d6c632f09000ac3.png',
          overdue: false,
          loyaltyInfo:
            {
              bonusInfo:
                {
                  type: 'openCard',
                  totalValue: 311.68,
                  compensationBlockedByOverdue: false
                },
              freeP2PLimit: 20000,
              freeP2PMaxLimit: 20000,
              freeP2PCurrentSum: 0
            },
          accNum: '40817810180003609151',
          accName: 'Николаева Николаида Николаевна',
          paySystemPC: 'WAY4',
          resident: true,
          pinChangeAvailable: true,
          reissueInfo:
            {
              available: true,
              free: true,
              term: 'Перевыпуск занимает до 5 рабочих дней',
              days: '5'
            },
          amountVisible: true,
          updateTime: 1566887902253,
          smsInfo: { status: 'Inactive', cardId: '8491452' },
          creditLimit: 0,
          preferentialRate: true,
          issueType: 'PERSO',
          accBackSystemClientId: '3597505',
          smsInfoAvailable: true
        }
      ],
      [
        {
          products: [
            {
              id: '8493076',
              type: 'card'
            }
          ],
          account: {
            id: '40817810380003898234',
            type: 'ccard',
            title: 'Кредитная Opencard',
            instrument: 'RUR',
            syncID: [
              '4627********9209',
              '40817810380003898234'
            ],
            available: 48453.06,
            creditLimit: 54000
          }
        },
        {
          products: [
            {
              id: '8491452',
              type: 'card'
            }
          ],
          account: {
            id: '40817810180003609151',
            type: 'ccard',
            title: 'Opencard',
            instrument: 'RUR',
            syncID: [
              '4627********8142',
              '40817810180003609151'
            ],
            available: 0
          }
        }
      ]
    ]
  ])('converts card', (apiAccounts, item) => {
    if (!Array.isArray(item)) {
      item = [item]
    }
    expect(convertAccounts(apiAccounts)).toEqual(item)
  })
})
