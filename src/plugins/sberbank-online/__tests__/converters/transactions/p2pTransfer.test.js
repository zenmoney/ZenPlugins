import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts p2p transfer', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'true',
      date: '22.05.2019T11:58:56',
      description: 'Перевод в Tинькoфф Бaнк',
      form: 'P2PExternalBankTransfer',
      from: 'MasterCard Mass 5469 55** **** 4782',
      id: '15102016922',
      imageId: {
        staticImage: { url: null }
      },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'true',
      operationAmount: {
        amount: '-10.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'EXECUTED',
      templatable: 'false',
      to: 'НИКОЛАЙ Н.',
      type: 'p2p',
      ufsId: null,
      details: {
        commission: { amount: '0.10', currency: { code: 'RUB', name: 'руб.' } },
        field: [
          {
            name: 'bankID',
            title: 'Банк получателя',
            type: 'list',
            required: 'true',
            editable: 'false',
            visible: 'true',
            listType: {
              availableValues: {
                valueItem: {
                  value: '380889694412:544243324385:284',
                  selected: 'true',
                  title: 'Tинькoфф Бaнк',
                  img: 'https://stat.online.sberbank.ru/PhizIC-res/IMG/PU/86/d0/8b/0caa88c47fdb2e144ab96b9db6_16435.jpg'
                }
              }
            },
            changed: 'false'
          },
          {
            name: 'receiverPhone',
            title: 'Номер телефона получателя',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: '9210112345' },
            changed: 'false'
          },
          {
            name: 'receiverName',
            title: 'ФИО получателя',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: 'НИКОЛАЙ Н.' },
            changed: 'false'
          },
          {
            name: 'receiverCardNumber',
            title: 'Карта получателя',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: '************4523' },
            changed: 'false'
          },
          {
            name: 'amount',
            title: 'Сумма зачисления',
            type: 'money',
            required: 'true',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '10.00' },
            changed: 'false'
          },
          {
            name: 'fromResource',
            title: 'Счет списания',
            description: '/ \n            view=true \n            code=card:51833625 \n            cards=2',
            type: 'resource',
            required: 'true',
            editable: 'false',
            visible: 'true',
            resourceType: {
              availableValues: {
                valueItem: {
                  value: 'card:51833625',
                  selected: 'true',
                  displayedValue: '5469 55** **** 4782 [MasterCard Mass]'
                }
              }
            },
            changed: 'false'
          },
          {
            name: 'operationDate',
            title: 'Дата операции',
            type: 'date',
            required: 'true',
            editable: 'false',
            visible: 'true',
            dateType: { value: '22.05.2019' },
            changed: 'false'
          },
          {
            name: 'operationTime',
            title: 'Время операции (МСК)',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: '11:58:56' },
            changed: 'false'
          },
          {
            name: 'authCode',
            title: 'Код авторизации',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: '250362' },
            changed: 'false'
          },
          {
            name: 'documentEribNumber',
            title: 'Номер документа',
            type: 'integer',
            required: 'true',
            editable: 'false',
            visible: 'true',
            integerType: { value: '15102016922' },
            changed: 'false'
          },
          {
            name: 'suip',
            title: 'Системный номер перевода',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: '750107328391KSVW' },
            changed: 'false'
          },
          {
            name: 'partnerTransferId',
            title: 'Уникальный номер операции',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: '740065535591' },
            changed: 'false'
          },
          {
            name: 'smsMessage',
            title: 'Сообщение получателю',
            type: 'string',
            maxLength: '40',
            minLength: '0',
            required: 'false',
            editable: 'false',
            visible: 'true',
            stringType: { value: 'kek' },
            changed: 'false'
          }
        ]
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-05-22T11:58:56+03:00'),
      movements: [
        {
          id: '15102016922',
          account: { id: 'account' },
          invoice: null,
          sum: -10,
          fee: -0.1
        },
        {
          id: null,
          account: {
            type: 'ccard',
            instrument: 'RUB',
            company: { id: '4902' },
            syncIds: ['4523']
          },
          invoice: null,
          sum: 10,
          fee: 0
        }
      ],
      merchant: {
        country: null,
        city: null,
        title: 'НИКОЛАЙ Н.',
        mcc: null,
        location: null
      },
      comment: 'kek'
    })
  })

  it('converts income p2p transfer', () => {
    expect(convertTransaction({
      id: '15687953579',
      ufsId: null,
      state: 'FINANCIAL',
      date: '11.06.2019T16:35:53',
      from: '4279 55** **** 5234',
      to: 'Николай Николаевич Н.',
      description: 'Входящий перевод',
      operationAmount: { amount: '33000.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardTransferIn',
      imageId: { staticImage: { url: null } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-06-11T16:35:53+03:00'),
      movements: [
        {
          id: '15687953579',
          account: { id: 'account' },
          invoice: null,
          sum: 33000,
          fee: 0
        },
        {
          id: null,
          account: {
            type: 'ccard',
            instrument: 'RUB',
            company: null,
            syncIds: ['5234']
          },
          invoice: null,
          sum: -33000,
          fee: 0
        }
      ],
      merchant: {
        country: null,
        city: null,
        title: 'Николай Николаевич Н.',
        mcc: null,
        location: null
      },
      comment: null
    })
  })
})
