import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          accNum: '40817840255510079245',
          accName: 'Текущий счет',
          balance: { amount: 0, currency: 'USD' },
          status: { code: 'NORMAL', value: 'Открыт' },
          bic: '044525985',
          openDate: '2016-06-10T00:00:00.000+0300',
          paySign: true,
          withdrawalSign: true,
          contractName: 'PKB31950000000000042',
          name: 'ДЕБЕТОВАЯ-КАРТА-ПРЕСТИЖ(RUR)-USD',
          idExt: '3458846',
          bsc: 'TWR',
          updateTime: 1570352981552,
          productType: 'CURRENT',
          amountVisible: true,
          preferentialRate: false,
          '@type': 'current'
        },
        {
          cardId: '422652078',
          maskCardNum: '434147******1234',
          virtualCardNum: '56C61E1359340168E0530A42961E6D6E',
          tariffPlan: {},
          name: 'Путешествия/VISA',
          bic: '044525985',
          cardType: 'ВИЗА КЛАССИК 2Y DDA',
          paySystem: 'VISA',
          balance: { amount: 0, currency: 'USD' },
          status: { code: 'NORMAL', value: 'Активна' },
          externalId: '422652078',
          designCode: 'PKB VISA Classic',
          designFileName: 'https://ib.open.ru/webbank/image/card-design/wb-small/c34164510bd36c888ce3893f19a6418b.jpg',
          cardExpDate: '2019-09-30T00:00:00.000+0300',
          main: true,
          bankName: 'Openbank',
          bsc: 'TWR',
          startDate: '2017-08-01T00:00:00.000+0300',
          lastTransactionDate: '2019-09-30T00:00:00.000+0300',
          type: 'debit',
          productType: 'CARD',
          cardPC: 'TWO',
          idExt: '3458846',
          holderName: 'NIKOLAY NIKOLAEV',
          applePayAllowed: false,
          mbCardDesignFull: 'https://ib.open.ru/webbank/image/card-design/mb-full/c34164510bd36c888ce3893f19a6418b.png',
          mbHalfCardDesign: 'https://ib.open.ru/webbank/image/card-design/mb-half/c34164510bd36c888ce3893f19a6418b.png',
          accNum: '40817840255510079245',
          accName: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          paySystemPC: 'TWO',
          resident: true,
          pinChangeAvailable: false,
          reissueInfo: { available: false, free: false },
          amountVisible: true,
          updateTime: 1570352979438,
          smsInfo: { status: 'Inactive', cardId: '422652078' },
          creditLimit: 0,
          preferentialRate: false,
          productCode: 'ДЕБЕТОВАЯ-КАРТА-ПРЕСТИЖ(RUR)-USD',
          smsInfoAvailable: false
        }
      ],
      {
        products: [
          {
            id: '422652078',
            type: 'card'
          },
          {
            id: '40817840255510079245',
            type: 'account'
          }
        ],
        account: {
          id: '40817840255510079245',
          type: 'ccard',
          title: 'Путешествия/VISA',
          instrument: 'USD',
          syncID: [
            '434147******1234',
            '40817840255510079245'
          ],
          available: 0
        }
      }
    ]
  ])('converts card with current account', (apiAccounts, item) => {
    expect(convertAccounts(apiAccounts)).toEqual([item])
  })
})
