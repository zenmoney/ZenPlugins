import { PinTanClient } from 'fints'

export async function scrape ({ preferences, fromDate, toDate }) {
  Object.assign(preferences, {
    'login': '8812412345',
    'pin': '78123'
  })
  const client = new PinTanClient({
    url: 'https://fints.ing.de/fints/',
    name: preferences.name,
    pin: preferences.pin,
    blz: 50010517
  })
  let accounts
  try {
    accounts = await client.accounts()
  } catch (e) {
    if ([
      'Fehler im Aufbau des Verschlüsselungskopfes (HNVSK)',
      'Anmeldung nur mit 10-stelliger Kontonummer und 5 bis 10-stelliger PIN möglich.'
    ].some(str => e.message.indexOf(str) >= 0)) {
      throw new InvalidPreferencesError('Неверный логин или пин')
    } else {
      throw e
    }
  }
  console.log(accounts)
  await Promise.all(accounts.map(async account => {
    const balance = await client.balance(account)
    console.log(balance)
    const statements = await client.statements(account, fromDate, toDate)
    console.log(statements)
  }))
}
