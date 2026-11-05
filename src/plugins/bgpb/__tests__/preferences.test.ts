import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('connection settings', () => {
  it('offers bank credentials and history date without a manual token PIN', () => {
    const xml = readFileSync(resolve(__dirname, '../preferences.xml'), 'utf8')

    expect([...xml.matchAll(/key="([^"]+)"/g)].map(match => match[1])).toEqual(['login', 'password', 'startDate'])
  })
})
