import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('converts credit card', () => {
    expect(convertAccounts({
      card: [
        { name: 'MC Standard',
          rest: '300 000.00',
          iso: 'RUB',
          number: '518996******1234',
          loan: '1',
          account: '40817810850450139213',
          id: '3572463',
          status: '0',
          base: '1',
          nick: '',
          blocked: '0.00',
          credlim: '300 000.00',
          count: '0',
          fio: 'NIKOLAY NIKOLAEV',
          img: '',
          exp: '30.04.2023',
          holder: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          addblocked: '0.00',
          basetype: '',
          basenum: '',
          intrate: '28.9',
          ownfunds: '0.00',
          upd: '28.06.2019 11:53:05',
          mamt: '0.00',
          dudate: '',
          bsum: '0.00',
          npgrace: '0.00',
          dbtamt: '0.00',
          sett: '0',
          purchru: '',
          purchabr: '',
          cashru: '',
          cashabr: '',
          int: '',
          act: 'details|block|reissue|refillother|pay|transfer|refill|transettings|pin|travel',
          cca: '40817810850450139213',
          travel: '0',
          hide: '0' }
      ]
    })).toEqual([
      {
        product: { id: '40817810850450139213' },
        account: {
          id: '40817810850450139213',
          type: 'ccard',
          title: 'MC Standard',
          instrument: 'RUB',
          syncID: [
            '518996******1234',
            '40817810850450139213'
          ],
          balance: 0,
          creditLimit: 300000
        }
      }
    ])
  })
})
