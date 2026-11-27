import { AccountType } from '../../../../types/zenmoney'
import { convertAccounts } from '../../converters'
import { MempoolAddressInfo, Wallet } from '../../models'

function info (funded: number, spent: number): MempoolAddressInfo {
  return { funded_txo_sum: funded, spent_txo_sum: spent }
}

describe('convertAccounts', () => {
  it('складывает баланс всех адресов кошелька и переводит сатоши в μBTC', () => {
    const wallet: Wallet = { id: 'addr1', title: 'Ledger_1', addresses: ['addr1', 'addr2'] }
    const infoByAddress = new Map([
      ['addr1', info(150000000, 50000000)],
      ['addr2', info(25000000, 0)]
    ])
    expect(convertAccounts([wallet], infoByAddress)).toEqual([{
      id: 'addr1',
      type: AccountType.checking,
      title: 'Ledger_1',
      instrument: 'μBTC',
      balance: 1250000,
      syncIds: ['addr1', 'addr2']
    }])
  })

  it('адрес без данных считается нулевым и не ломает баланс', () => {
    const wallet: Wallet = { id: 'addr1', title: 'Bitcoin', addresses: ['addr1', 'addr2'] }
    const infoByAddress = new Map([['addr1', info(100000000, 0)]])
    expect(convertAccounts([wallet], infoByAddress)[0].balance).toBe(1000000)
  })

  it('каждый кошелёк даёт свой счёт', () => {
    const wallets: Wallet[] = [
      { id: 'a', title: 'Ledger_1', addresses: ['a'] },
      { id: 'b', title: 'Ledger_2', addresses: ['b'] }
    ]
    const infoByAddress = new Map([
      ['a', info(50000000, 0)],
      ['b', info(100000000, 0)]
    ])
    expect(convertAccounts(wallets, infoByAddress).map(account => account.balance)).toEqual([500000, 1000000])
  })
})
