import { convertCard } from '../../../converters'

describe('convertAccount', () => {
  it('convers card', () => {
    expect(convertCard({
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
    })).toEqual({
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
    })
  })
})
