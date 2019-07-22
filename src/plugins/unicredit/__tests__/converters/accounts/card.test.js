import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('convers card', () => {
    expect(convertAccounts({
      card: [
        {
          name: 'Visa Classic +',
          rest: '15 001.83',
          iso: 'RUB',
          number: '489042******8012',
          loan: '0',
          account: '40817810350011001380',
          id: '3384975',
          status: '0',
          base: '1',
          nick: '',
          blocked: '42 838.20',
          credlim: '0.00',
          count: '0',
          fio: 'NIKOLAY NIKOLAEV',
          img: '',
          exp: '15.04.2023',
          holder: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          addblocked: '0.00',
          basetype: '',
          basenum: '',
          intrate: '0',
          ownfunds: '15 001.83',
          upd: '21.06.2019 23:48:55',
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
          act:
            'details|block|reissue|refillother|pay|transfer|refill|transettings|currconv|pin|travel',
          cca: '40817810350011001380',
          travel: '0',
          hide: '0'
        }
      ]
    })).toEqual([
      {
        product: {
          id: '40817810350011001380'
        },
        account: {
          id: '40817810350011001380',
          type: 'ccard',
          title: 'Visa Classic +',
          instrument: 'RUB',
          balance: 15001.83,
          syncID: [
            '489042******8012',
            '40817810350011001380'
          ]
        }
      }
    ])
  })

  it('converts multiple card for one account', () => {
    expect(convertAccounts({
      card: [
        {
          name: 'MC Standard+',
          rest: '30 352.66',
          iso: 'RUB',
          number: '522458******5698',
          loan: '0',
          account: '40817810850230007123',
          id: '3547298',
          status: '0',
          base: '1',
          nick: 'MC Standard+',
          blocked: '3 830.18',
          credlim: '0.00',
          count: '1',
          fio: 'NIKOLAY NIKOLAEV',
          img: '',
          exp: '31.03.2023',
          holder: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          addblocked: '0.00',
          basetype: '',
          basenum: '',
          intrate: '0',
          ownfunds: '30 352.66',
          upd: '19.07.2019 21:30:31',
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
          act: 'details|block|reissue|refillother|pay|transfer|refill|transettings|currconv|pin|travel',
          cca: '40817810850230007123',
          travel: '0',
          hide: '0'
        },
        {
          name: 'MC Unembossed',
          rest: '30 352.66',
          iso: 'RUB',
          number: '531344******7517',
          loan: '0',
          account: '40817810850230007123',
          id: '1326671',
          status: '1',
          base: '0',
          nick: 'Зарплата ТМЮ',
          blocked: '0.00',
          credlim: '0.00',
          count: '0',
          fio: 'NIKOLAY NIKOLAEV',
          img: '',
          exp: '30.04.2021',
          holder: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
          addblocked: '0.00',
          basetype: '',
          basenum: '522458******5698',
          intrate: '0',
          ownfunds: '30 352.66',
          upd: '19.07.2019 21:30:31',
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
          act: 'details|block|reissue|refillother|transettings|currconv|travel',
          cca: '40817810850230007123',
          travel: '0',
          hide: '1'
        }
      ]
    })).toEqual([
      {
        product: {
          id: '40817810850230007123'
        },
        account: {
          id: '40817810850230007123',
          type: 'ccard',
          title: 'MC Standard+',
          instrument: 'RUB',
          balance: 30352.66,
          syncID: [
            '522458******5698',
            '531344******7517',
            '40817810850230007123'
          ]
        }
      }
    ])
  })
})
