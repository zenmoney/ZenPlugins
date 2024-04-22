import { accountDetailsToId, convertAccount } from './converters'
import { AccountDetails, PSAccount } from './models'
import { fetchAccountData } from './fetchApi'

function accountCardKey (accountId: string): string {
  return `account/${accountId}/card`
}

export async function fetchAccount (accountDetails: AccountDetails): Promise<PSAccount> {
  const accountId = accountDetailsToId(accountDetails)
  let cardNumber = ZenMoney.getData(accountCardKey(accountId)) as string | null | undefined

  if (cardNumber === undefined) {
    cardNumber = await readCardNumber(`Enter card number for account ${accountDetails.id} (optional):`)
    ZenMoney.setData(accountCardKey(accountId), cardNumber)
    ZenMoney.saveData()
  }

  const rawData = await fetchAccountData(accountDetails)
  const account = convertAccount(accountDetails, rawData)
  if (cardNumber !== null) {
    account.syncIds.push(cardNumber)
  }

  return {
    ...account,
    cardNumber,
    rawData
  }
}

async function readCardNumber (prompt: string): Promise<string | null> {
  let cardNumber: string | undefined
  while (cardNumber === undefined) {
    const input = (await ZenMoney.readLine(prompt, { inputType: 'number' }) ?? '').replace(/\D/g, '')
    if (input.length === 16) {
      cardNumber = input
    } else {
      await ZenMoney.alert('Card number should contain exactly 16 digits. You can leave the field empty if you don\'t have a card')
    }
  }
  return cardNumber === '' || cardNumber === '0' ? null : cardNumber
}
