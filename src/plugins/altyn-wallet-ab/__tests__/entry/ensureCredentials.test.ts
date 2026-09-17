import { ensureCredentials } from '../../index'
import { InvalidPreferencesError } from '../../../../errors'

// Заглушка глобального ZenMoney: нужна только на вызовах, не при импорте
global.ZenMoney = {
  readLine: jest.fn(),
  getData: jest.fn(),
  setData: jest.fn(),
  saveData: jest.fn()
} as any

describe('ensureCredentials — интерактивный дозапрос токена/PIN', () => {
  afterEach(() => { jest.clearAllMocks() })

  it('не спрашивает ничего, когда настройки заполнены', async () => {
    const result = await ensureCredentials({ token: ' token ', pin: ' 1234 ' })
    expect(result).toEqual({ token: 'token', pin: '1234' })
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
    expect(ZenMoney.getData).not.toHaveBeenCalled()
  })

  it('спрашивает через readLine и сохраняет ответ', async () => {
    ;(ZenMoney.getData as jest.Mock).mockReturnValue(null)
    ;(ZenMoney.readLine as jest.Mock)
      .mockResolvedValueOnce('fresh-token')
      .mockResolvedValueOnce('4321')

    const result = await ensureCredentials({ token: '', pin: '' })

    expect(result).toEqual({ token: 'fresh-token', pin: '4321' })
    expect(ZenMoney.readLine).toHaveBeenCalledTimes(2)
    expect(ZenMoney.setData).toHaveBeenCalledWith('token', 'fresh-token')
    expect(ZenMoney.setData).toHaveBeenCalledWith('pin', '4321')
    expect(ZenMoney.saveData).toHaveBeenCalledTimes(2)
  })

  it('берёт сохранённый ранее ответ без переспрашивания', async () => {
    ;(ZenMoney.getData as jest.Mock).mockImplementation((key: string) => key === 'token' ? 'saved-token' : '9999')

    const result = await ensureCredentials({ token: '', pin: '' })

    expect(result).toEqual({ token: 'saved-token', pin: '9999' })
    expect(ZenMoney.readLine).not.toHaveBeenCalled()
  })

  it('бросает InvalidPreferencesError при отказе от ввода', async () => {
    ;(ZenMoney.getData as jest.Mock).mockReturnValue(null)
    ;(ZenMoney.readLine as jest.Mock).mockResolvedValue(null)

    const error: unknown = await ensureCredentials({ token: '', pin: '1234' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(InvalidPreferencesError)
    expect((error as InvalidPreferencesError).message).toContain('токен')
  })
})
