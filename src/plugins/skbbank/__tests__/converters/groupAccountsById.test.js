import { groupAccountsById } from '../../converters'

describe('groupAccountsById', () => {
  it.each([
    [
      [
        {
          id: '40817810900087654321',
          type: 'checking',
          title: 'Счет RUB',
          instrument: 'RUB',
          balance: 1000.00,
          creditLimit: 0,
          syncIds: ['40817810900087654321']
        },
        {
          id: '40817810239923082636',
          type: 'loan',
          title: 'ПЕРСОНАЛЬНОЕ ПРЕДЛОЖЕНИЕ (потребительский кредит)',
          instrument: 'RUB',
          balance: -216300,
          capitalization: true,
          percent: 26.9,
          startDate: new Date('2014-03-12T20:00:00.000Z'),
          endDateOffset: 116,
          endDateOffsetInterval: 'month',
          syncIds: ['40817810239923082636', '45507810939900624978']
        },
        {
          id: '40817810000015511074',
          type: 'ccard',
          title: 'Счет Mastercard Unembossed',
          instrument: 'RUB',
          balance: 7302.49,
          creditLimit: 0,
          syncIds: [
            '40817810000015511074',
            '548386******6004'
          ],
          storedId: 170537804
        },
        {
          id: '42305810330000000042',
          type: 'deposit',
          title: 'Исполнение желаний + (срочный вклад)',
          instrument: 'RUB',
          balance: 10000,
          capitalization: true,
          percent: 5.2,
          startDate: new Date('2020-08-07T21:00:00.000Z'),
          startBalance: 10000,
          payoffInterval: null,
          payoffStep: 0,
          endDateOffset: 270,
          endDateOffsetInterval: 'day',
          syncIds: ['42305810330000000042']
        },
        {
          id: '40817810000015511074',
          type: 'checking',
          title: 'Счет Mastercard Unembossed',
          instrument: 'RUB',
          balance: 17302.49,
          creditLimit: 0,
          syncIds: [
            '40817810000015511074',
            '548386******6004',
            '123456******7890'
          ],
          storedId: [170537804, 310720201]
        }
      ],
      {
        '40817810900087654321': { id: '40817810900087654321', instrument: 'RUB' },
        '40817810239923082636': { id: '40817810239923082636', instrument: 'RUB' },
        '45507810939900624978': { id: '40817810239923082636', instrument: 'RUB' },
        '40817810000015511074': { id: '40817810000015511074', instrument: 'RUB' },
        '548386******6004': { id: '40817810000015511074', instrument: 'RUB' },
        170537804: { id: '40817810000015511074', instrument: 'RUB' },
        310720201: { id: '40817810000015511074', instrument: 'RUB' },
        '123456******7890': { id: '40817810000015511074', instrument: 'RUB' },
        '42305810330000000042': { id: '42305810330000000042', instrument: 'RUB' }
      }
    ]
  ])('converts groupAccountsById Account', (accounts, accountsById) => {
    expect(groupAccountsById(accounts)).toEqual(accountsById)
  })
})
