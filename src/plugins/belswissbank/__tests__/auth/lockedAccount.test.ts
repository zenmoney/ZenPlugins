import fetchMock from 'fetch-mock'
import { Api } from '../../api'
import { BankMessageError, ZPAPIError } from '../../../../errors'

// mail_inbound 162316, belswissbank build 169, auth/login, 2026-10-15.
const rejectedLogin = {
  header: 'К сожалению, Ваша учетная запись заблокирована!',
  code: 'MAS-0073',
  message: 'Для восстановления доступа сбросьте пароль или повторите попытку позже'
}

beforeEach(() => {
  global.ZenMoney = {
    getData: () => ({ model: 'test', manufacturer: 'test', ip: '192.168.1.1', osVersion: '30', androidId: 'test' })
  } as unknown as typeof ZenMoney
  // [model] The salt only supplies the encryption precondition for the observed login response.
  fetchMock.post('https://mobile.bsb.by/api/v1/authentication-management/free-zone/auth/salt', { status: 200, body: 'test-salt' })
})
afterEach(() => fetchMock.restore())

it('shows the verbatim recovery instruction for the observed locked customer', async () => {
  fetchMock.post('https://mobile.bsb.by/api/v1/authentication-management/free-zone/auth/login', { status: 400, body: rejectedLogin })
  const result = new Api({ username: 'test', password: 'test' }).login(false)
  await expect(result).rejects.toBeInstanceOf(BankMessageError)
  await expect(result).rejects.toHaveProperty('bankMessage', rejectedLogin.message)
})

it('[model] preserves transport failures as reportable errors', async () => {
  // A network failure must not be mistaken for a blocked customer.
  const failure = new Error('transport failed')
  fetchMock.post('https://mobile.bsb.by/api/v1/authentication-management/free-zone/auth/login', { throws: failure })
  const result = new Api({ username: 'test', password: 'test' }).login(false)
  await expect(result).rejects.toBe(failure)
  await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
})
