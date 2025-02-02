import { AccountType } from '../../../../../types/zenmoney'
import { convertWalletToAccount, convertJettonToAccount } from '../../../converters'

describe('convertWalletToAccount', () => {
  it('should correctly convert ton accounts', async () => {
    const wallets = [
      {
        raw: { address: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr', balance: 16793400000 },
        converted: {
          id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr',
          type: AccountType.ccard,
          title: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr',
          instrument: 'TON',
          balance: 16.79,
          available: 16.79,
          creditLimit: 0,
          syncIds: ['UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr']
        }
      },
      {
        raw: { address: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4sVGcQ', balance: 0 },
        converted: {
          id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4sVGcQ',
          type: AccountType.ccard,
          title: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4sVGcQ',
          instrument: 'TON',
          balance: 0,
          available: 0,
          creditLimit: 0,
          syncIds: ['UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4sVGcQ']
        }
      }
    ]
    for (const { raw, converted } of wallets) {
      expect(convertWalletToAccount(raw)).toEqual(converted)
    }
  })
})

describe('convertJettonToAccount', () => {
  it('should correctly convert jetton account', async () => {
    const wallets = [
      {
        raw: {
          address: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sQCC1',
          balance: 167934000,
          jetton: '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE',
          jettonType: 'USDT',
          title: 'TON Any Jetton Name',
          owner: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4sVGcQ',
          decimals: 6
        },
        converted: {
          id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sQCC1',
          type: AccountType.ccard,
          title: 'TON Any Jetton Name',
          instrument: 'USDT',
          balance: 167.93,
          available: 167.93,
          creditLimit: 0,
          syncIds: ['UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sQCC1']
        }
      },
      {
        raw: {
          address: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sQQQ1',
          balance: 171934,
          jetton: '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621QVX',
          jettonType: 'MYTICKER',
          title: 'TON Any Jetton Name 2',
          owner: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h4sVGcQ',
          decimals: 6
        },
        converted: {
          id: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sQQQ1',
          type: AccountType.ccard,
          title: 'TON Any Jetton Name 2',
          instrument: 'MYTICKER',
          balance: 0.17,
          available: 0.17,
          creditLimit: 0,
          syncIds: ['UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sQQQ1']
        }
      }
    ]
    for (const { raw, converted } of wallets) {
      expect(convertJettonToAccount(raw)).toEqual(converted)
    }
  })
})
