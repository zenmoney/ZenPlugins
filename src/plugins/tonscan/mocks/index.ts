import fetchMock from 'fetch-mock'
import { TonRawTransactions, RawJettonTransfer, AddressBook, RawJettons, RawWallet, Preferences } from '../api'

export const preferencesMock: Preferences = {
  wallets: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr'
}

export const walletResponseMock: RawWallet = {
  balance: 129823563643
}

export const jettonsResponseMock: RawJettons = {
  jetton_wallets: [
    {
      address: '0:A70DB41F5EB71A6A6B6A5A0B1A033C46F5635F67B25C811B16159204D5844D44',
      balance: 8000000,
      jetton: '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE'
    },
    {
      address: '0:A70DB41F5EB71A6A6B6A5A0B1A033C46F5635F67B25C811B16159204D5811D4C',
      balance: 8000000,
      jetton: '0:B113A994B5024A16719F69139328EB759596C38A25F59028T146FECDC3641BFB' // Unsupported jetton, will be filtered out
    }
  ]
}

export const tonTransactionResponseMock: TonRawTransactions = {
  transactions: [
    {
      in_msg: {
        hash: 'vNoHxFdN+bl3wy7g52Tl3Va7eKM71hDLm64g6haL1fQ=',
        source: '0:A107678CA051B84E1B84B19E9E86504F2895CE8CDC6547907BA8A64D188BF6E7',
        destination: '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58',
        value: 46190000000,
        created_at: 1718810887
      },
      out_msgs: [
        {
          hash: 'udQ9QJFZl+28cVfny6CiZu8n+AYY7VWszp1uKXMMv04=',
          source: '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58',
          destination: '0:A107678CA051B84E1B84B19E9E86504F2895CE8CDC6547907BA8A64D188BF6E7',
          value: 41000000000,
          created_at: 1718810887
        }
      ]
    },
    {
      in_msg: {
        hash: 'vNoHxFdN+bl3wy7g52TlVVa7eKM71hDLm64g6haL1AQ=',
        source: '0:A107678CA051B84E1B84B19E9E86504F2895CE8CDC6547907BA8A64D188BF6E7',
        destination: '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58',
        value: 3500000, // 0.0035 TON < 0.01, will be filtered out
        created_at: 1718810987
      },
      out_msgs: []
    }
  ],
  address_book: {
    '0:A107678CA051B84E1B84B19E9E86504F2895CE8CDC6547907BA8A64D188BF6E7': { user_friendly: 'EQChB2eMoFG4ThuEsZ6ehlBPKJXOjNxlR5B7qKZNGIv256Da' },
    '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58': { user_friendly: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr' }
  }
}

export const jettonsTransfersResponseMock: RawJettonTransfer = {
  jetton_transfers: [
    {
      transaction_hash: 'Iu1byKIIiIscIUICwIplNohqzlKJlqypafLX+VeyQSg=',
      source: '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58',
      destination: '0:5225808CAB7270BB522D5092759C091CAE03EF23325963CAA97EE3C4681E1DC5',
      amount: 10000000,
      transaction_now: 1718424875
    },
    {
      transaction_hash: 'Iu1byKIIiIscIUICwIplNohqzlKJlqypafLX+VeyQSg=',
      source: '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58',
      destination: '0:5225808CAB7270BB522D5092759C091CAE03EF23325963CAA97EE3C4681E1DC5',
      amount: 26790000,
      transaction_now: 1718424876
    },
    {
      transaction_hash: 'Iu1byKIIiIscIUICwIplNohqzlKJlqypafLX+VeyVSB=',
      source: '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58',
      destination: '0:5225808CAB7270BB522D5092759C091CAE03EF23325963CAA97EE3C4681E1DC5',
      amount: 2000, // 0.002 USDT < 0.01, will be filtered out
      transaction_now: 1718424875
    }
  ]
}

export const jettonsAddressBookResponseMock: AddressBook = {
  '0:A70DB41F5EB71A6A6B6A5A0B1A033C46F5635F67B25C811B16159204D5844D44': { user_friendly: 'EQCnDbQfXrcaamtqWgsaAzxG9WNfZ7JcgRsWFZIE1YRNRHYY' }
}

export const addressBookResponseMock: AddressBook = {
  '0:18AA8E2EED51747DAE033C079B93883D941CAD8F65459F2EE9CD7474B6B8ED5D': { user_friendly: 'EQAYqo4u7VF0fa4DPAebk4g9lBytj2VFny7pzXR0trjtXQaO' },
  '0:2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58': { user_friendly: 'UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr' },
  '0:5225808CAB7270BB522D5092759C091CAE03EF23325963CAA97EE3C4681E1DC5': { user_friendly: 'UQBSJYCMq3Jwu1ItUJJ1nAkcrgPvIzJZY8qpfuPEaB4dxZri' }
}

export function mockEndPoints (): void {
  fetchMock.once('https://toncenter.com/api/v3/wallet?address=UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr', {
    status: 200,
    body: walletResponseMock
  })
  fetchMock.once('https://toncenter.com/api/v3/jetton/wallets?owner_address=UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr', {
    status: 200,
    body: jettonsResponseMock
  })
  fetchMock.once('https://toncenter.com/api/v3/addressBook?address=0%3AA70DB41F5EB71A6A6B6A5A0B1A033C46F5635F67B25C811B16159204D5844D44', {
    status: 200,
    body: jettonsAddressBookResponseMock
  })
  fetchMock.once('https://toncenter.com/api/v3/transactions?account=UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr&start_utime=1717185600&end_utime=1718913599&limit=30&offset=0&sort=desc', {
    status: 200,
    body: tonTransactionResponseMock
  })
  fetchMock.once('https://toncenter.com/api/v3/jetton/transfers?address=UQAgNvaIcIodgH_lFKyS5WQLUKeaZXYVcwBNArOm1h1sWGcr&jetton_master=0%3AB113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE&start_utime=1717185600&end_utime=1718913599&limit=50&offset=0&sort=desc', {
    status: 200,
    body: jettonsTransfersResponseMock
  })
  fetchMock.once('https://toncenter.com/api/v3/addressBook?address=0%3A2036F688708A1D807FE514AC92E5640B50A79A65761573004D02B3A6D61D6C58&address=0%3A5225808CAB7270BB522D5092759C091CAE03EF23325963CAA97EE3C4681E1DC5', {
    status: 200,
    body: addressBookResponseMock
  })
}
