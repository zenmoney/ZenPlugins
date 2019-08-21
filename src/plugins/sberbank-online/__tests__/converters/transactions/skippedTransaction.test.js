import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('skips transaction with empty or zero operationAmount', () => {
    expect(convertTransaction({
      id: '11413628056',
      ufsId: null,
      state: 'DRAFT',
      date: '11.01.2019T06:54:29',
      from: 'Visa Gold 4279 38** **** 0346',
      to: 'ООО "КОМПАНИЯ БКС"                                                                        40701810600007906728',
      description: 'Оплата услуг',
      isMobilePayment: 'false',
      copyable: 'true',
      templatable: 'true',
      autopayable: 'true',
      type: 'jurPayment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'RurPayJurSB',
      imageId: { staticImage: { url: null } }
    })).toBeNull()

    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '31.12.2018T00:00:00',
      description: 'Капитализация по вкладу/счету',
      form: 'ExtDepositCapitalization',
      id: '6742338167',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '0.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'До востребования (руб)                    42301810755244611128',
      type: 'payment',
      ufsId: null
    })).toBeNull()
  })
})
