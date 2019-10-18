import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    {
      id: 'a0cbde56-6b1e-4d8d-8588-0e3767199551',
      companyId: '5b3ee23f-071d-4da4-b31e-a7d10408df59',
      status: 'Canceled',
      category: 'Credit',
      contragentName: '',
      contragentInn: '',
      contragentKpp: '',
      contragentBankAccountNumber: '',
      contragentBankName: '',
      contragentBankBic: '',
      currency: 'RUR',
      amount: 1,
      bankAccountNumber: '40802810470014241168',
      paymentPurpose: 'Операция списания средств с карты 521355%2606 YANDEX.TAXI\\MOSCOW\\RU',
      created: '2019-09-01T00:00:00',
      docNumber: '',
      absId: '',
      ibsoId: '0',
      kbk: '',
      oktmo: '',
      paymentBasis: '',
      taxCode: '',
      taxDocNum: '',
      taxDocDate: '',
      payerStatus: '',
      uin: ''
    }
  ])('skips specific transaction', (apiTransaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toBeNull()
  })
})
