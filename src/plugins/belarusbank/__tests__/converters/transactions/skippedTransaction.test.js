import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  const account = {
    id: 'accountId',
    type: 'card',
    title: 'Карта 2222',
    balance: 10.18,
    instrument: 'BYN',
    syncID: ['accountId', '2222'],
    raw: {
      balance: '10.18',
      cardNum: '1111********2222',
      currency: 'BYN',
      id: 'BY75 AKBB 3014 1000 0222 3303 0000',
      transactionsData: {
        action: 'long/long/link',
        additional: [
          '\'viewns_Z7_HASH001_:ClientCardsDataForm\'',
          '\'viewns_Z7_HASH001_:ClientCardsDataForm:accountContainer:0:ns_Z7_HASH001_j_id4\'',
          '\'accountNumber\'',
          '\'500011001111\''
        ],
        encodedURL: '/wps/myportal/ibank/!ut/p/a1/LONGLONGHASH/dl5/d5/HASH56/pw/Z7_HASH001/res/id=pagesQCPclientCardsQCPclientCardList.xhtml/c=cacheLevelPage/=/',
        viewState: '/s/BLA/BLA/BLA+bla+bLa+Blabla/ha12sh='
      },
      type: 'card'
    }
  }

  it.each([
    [
      {
        accountID: 'accountId',
        comment: 'Смена ПИН-кода',
        date: '21.04.2022',
        debitFlag: '-',
        fee: '3.00',
        inAccountCurrency: 'BYN',
        inAccountSum: '0.00',
        operationCurrency: 'BYN',
        operationSum: '0.00',
        place: 'OBSCHEZHIT.VGMU BR.200 ATM/6011',
        status: 'operResultOk',
        time: '23:00:27'
      },
      null
    ]
  ])('converts skipped transactions', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [account])).toEqual(transaction)
  })
})
