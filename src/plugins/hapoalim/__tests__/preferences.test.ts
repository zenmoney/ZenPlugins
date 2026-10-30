import { readFileSync } from 'fs'
import { join } from 'path'
import { xml2js } from 'xml-js'
import get, { getArray, getOptString, getString } from '../../../types/get'

describe('Hapoalim Russian authentication settings', () => {
  it('preserves existing defaults and offers optional native login/password fields in Russian', () => {
    const document: unknown = xml2js(readFileSync(join(__dirname, '..', 'preferences.xml'), 'utf8'), { compact: false })
    const screen = getArray(document, 'elements').find(element => getOptString(element, 'name') === 'PreferenceScreen')
    const controls = getArray(screen, 'elements')
      .filter(element => getOptString(element, 'type') === 'element')
      .map(element => ({ name: getString(element, 'name'), attributes: get(element, 'attributes') }))
    expect(controls).toEqual([
      {
        name: 'ListPreference',
        attributes: {
          key: 'authenticationMethod',
          title: 'Способ входа',
          dialogTitle: 'Способ входа',
          entries: 'Прямой вход|Вход через окно банка',
          entryValues: 'direct|web',
          defaultValue: 'web',
          positiveButtonText: 'ОК',
          negativeButtonText: 'Отмена',
          summary: '||{@s}'
        }
      },
      {
        name: 'EditTextPreference',
        attributes: {
          key: 'login',
          obligatory: 'false',
          inputType: 'text',
          title: 'Логин Bank Hapoalim',
          dialogTitle: 'Логин Bank Hapoalim',
          positiveButtonText: 'ОК',
          negativeButtonText: 'Отмена',
          summary: '||{@s}'
        }
      },
      {
        name: 'EditTextPreference',
        attributes: {
          key: 'password',
          obligatory: 'false',
          inputType: 'textPassword',
          title: 'Пароль Bank Hapoalim',
          dialogTitle: 'Пароль Bank Hapoalim',
          positiveButtonText: 'ОК',
          negativeButtonText: 'Отмена',
          summary: '||***********'
        }
      },
      {
        name: 'EditTextPreference',
        attributes: {
          key: 'startDate',
          obligatory: 'true',
          inputType: 'date',
          title: 'С какой даты загружать операции',
          defaultValue: '2018-01-01T00:00:00.000Z',
          dialogTitle: 'С какой даты загружать операции',
          positiveButtonText: 'ОК',
          negativeButtonText: 'Отмена',
          summary: '|startDate|{@s}'
        }
      }
    ])
  })

  it('reports an unsupported authentication choice in Russian', () => {
    const { authenticationMethod } = jest.requireActual<{ authenticationMethod: (preferences: unknown) => string }>('../api')
    expect(() => authenticationMethod({ authenticationMethod: 'invalid' })).toThrow('Выберите поддерживаемый способ входа.')
  })
})
