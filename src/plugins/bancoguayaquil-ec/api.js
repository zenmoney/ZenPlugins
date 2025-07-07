import { SHA256 } from 'jshashes'
import _ from 'lodash'
import { fetch as baseFetch } from '../../common/network'
import { generateUUID, generateRandomString } from '../../common/utils'

async function fetch (accesstoken, body) {
  const response = await baseFetch('https://bancavirtual.bancoguayaquil.com/GYEMCANAL/processjson', {
    method: 'POST',
    headers: {
      ...accesstoken && { accesstoken }
    },
    body,
    stringify: JSON.stringify,
    parse: (body) => JSON.parse(body)
  })
  if (response.body.CodigoRetorno !== 'OK') {
    throw new Error(`failed to get accesstoken: ${response.body.MensajeRetorno}`)
  }
  return response.body.Respuesta
}

async function getToken (preferences) {
  const uuid = ZenMoney.getData('uuid')
  const response = await fetch(null, {
    Transaccion: {
      Cabecera: {
        Operador: 'bg',
        Aplicacion: 'BM8',
        Canal: 'BMP',
        CodigoBanco: '0017',
        IdEmpresa: '1231217',
        Sucursal: '01',
        Agencia: '1',
        CodigoCaja: '001',
        Usuario: preferences.login,
        Codigo: 'AUTENTICAR',
        IdTransaccion: '0',
        Idioma: 'ES',
        AppVersion: '9.76.0',
        fingerprint: uuid,
        Dispositivo: 'ios'
      },
      Detalle: {
        FuenteInformacion: 'EASYLOGIN',
        FuenteRegistrador: 'EASYLOGIN',
        Password: preferences.password,
        Scope: 'easywebapitellerv2',
        Fingerprint: uuid,
        Operador: 'BG',
        LoginType: 'faceid_touchid'
      }
    }
  })

  const cedula = response?.DatosUsuario?.NombreCorto
  if (!cedula) {
    throw new Error('failed to get cedula')
  }

  return {
    cedula,
    accesstoken: response?.JwtUsuario?.AccessToken
  }
}

async function getPhoto () {
  if (ZenMoney.takePicture) {
    return await new Promise((resolve, reject) => {
      ZenMoney.takePicture('jpeg', (err, picture) => {
        if (err) {
          reject(err)
        } else {
          resolve(picture)
        }
      })
    })
  }

  await ZenMoney.alert('chose and upload your selfie for device registration')
  const blobs = await ZenMoney.pickDocuments(['image/*'], false)
  if (blobs.length !== 1) {
    throw new Error('at least one photo should be selected')
  }
  return blobs[0]
}

async function registerDevice (cedula) {
  const uuid = generateUUID()

  const blob = await getPhoto()
  const foto64 = Buffer.from(await blob.arrayBuffer()).toString('base64')

  await fetch(null, {
    Transaccion: {
      Cabecera: {
        Operador: 'bg',
        Aplicacion: 'BM8',
        Canal: 'BMP',
        CodigoBanco: '0017',
        IdEmpresa: '1231217',
        Sucursal: '01',
        Agencia: '1',
        CodigoCaja: '001',
        Usuario: cedula,
        Codigo: 'REGISTRAR-NUEVO-DISPOSITIVO',
        IdTransaccion: '0',
        Idioma: 'ES',
        AppVersion: '9.77.0',
        fingerprint: uuid,
        Dispositivo: 'ios'
      },
      Detalle: {
        FuenteInformacion: 'EASYLOGIN',
        FuenteRegistrador: 'WEBAPI',
        TramaREST: {
          Action: 'RegistroEquipoHabitual',
          Parameters: {},
          Data: {
            Aplicacion: 'BM8',
            // Ip: '127.0.0.1',
            Operador: 'BG',
            Identificacion: cedula,
            TipoIdentificacion: 'C',
            Foto64: foto64,
            Plantilla: '',
            Usuario: cedula,
            Marca: 'Apple',
            Modelo: 'iPhone16,1',
            Version: '1',
            FingerPrint: uuid,
            NombreEquipo: `iPhone16,1-${generateRandomString(13, '0123456789')}`
          }
        }
      }
    }
  })

  console.log(`register uuid: ${uuid}`)
  ZenMoney.setData('uuid', uuid)
  ZenMoney.saveData()
}

export async function login (preferences) {
  const data1 = await getToken(preferences)
  if (data1.accesstoken) {
    return data1
  }

  await registerDevice(data1.cedula)
  const data2 = await getToken(preferences)
  if (data2.accesstoken) {
    return data2
  }

  throw new Error('failed to get accesstoken after registration')
}

export async function fetchAccounts (creds) {
  const uuid = ZenMoney.getData('uuid')
  const response = await fetch(creds.accesstoken, {
    Transaccion: {
      Cabecera: {
        Operador: 'bg',
        Aplicacion: 'BMP',
        Canal: 'BMP',
        CodigoBanco: '0017',
        IdEmpresa: '1231217',
        Sucursal: '01',
        Agencia: '1',
        CodigoCaja: '001',
        Usuario: creds.cedula,
        Codigo: 'CONSULTA-EMPSERV',
        IdTransaccion: '0',
        Idioma: 'ES',
        AppVersion: '9.76.0',
        fingerprint: uuid,
        Dispositivo: 'ios'
      },
      Detalle: {
        FuenteInformacion: 'BANCAELECTRONICABG',
        FuenteRegistrador: 'WEBAPI',
        UsuarioConsulta: creds.cedula,
        CanalConsulta: 'BMP',
        NombreEmpresa: '',
        IdentificacionEmpresa: '',
        NombreEmpresaMayor: ''
      }
    }
  })

  const contract = response.Servicios.find((item) => item.DS === 'BANCA VIRTUAL')?.IDC
  if (!contract) {
    throw new Error('failed to find cotract')
  }

  const accounts = _.uniqBy(response.BancoCuentas.map((account) => {
    if (account.MC !== 'USD') {
      throw new Error(`unexpected MC (expected USD): ${account.MC} for account ${account.NC}`)
    }
    if (account.TC !== 'AHO') {
      throw new Error(`unexpected TC (expected AHO): ${account.TC} for account ${account.NC}`)
    }

    return {
      id: account.NC,
      type: 'checking',
      title: `Account ${account.NC}`,
      instrument: 'USD',
      syncIds: [account.NC],
      balance: 0
    }
  }), 'id')

  return { contract, accounts }
}

function formatDate (date) {
  const day = date.getUTCDate()
  const fDay = (day < 10) ? '0' + day : day
  const month = date.getUTCMonth() + 1
  const fMonth = (month < 10) ? '0' + month : month
  return `${date.getUTCFullYear()}${fMonth}${fDay}`
}

export async function fetchTransactions (creds, accountsData, fromDate, toDate) {
  const uuid = ZenMoney.getData('uuid')
  const transactions = []
  for (const account of accountsData.accounts) {
    const response = await fetch(creds.accesstoken, {
      Transaccion: {
        Cabecera: {
          Operador: 'bg',
          Aplicacion: 'BMP',
          Canal: 'BMP',
          CodigoBanco: '0017',
          IdEmpresa: '1231217',
          Sucursal: '01',
          Agencia: '1',
          CodigoCaja: '001',
          Usuario: creds.cedula,
          Codigo: 'OBTENER_MOVIMIENTOS-UNIFICADA',
          IdTransaccion: '0',
          Idioma: 'ES',
          AppVersion: '9.76.0',
          fingerprint: uuid,
          Dispositivo: 'ios'
        },
        Detalle: {
          FuenteInformacion: 'BANCAELECTRONICABG',
          FuenteRegistrador: 'WEBAPI',
          TramaREST: {
            Action: 'ObtenerEstadoCuentaBloques',
            Parameters: {},
            Data: {
              TipoPersona: 'P',
              // Ip: '127.0.0.1',
              IdContrato: accountsData.contract,
              Identificacion: creds.cedula,
              Llamada: 'BMP',
              TipoConsulta: 'D',
              CodServicio: 'TT',
              NumCuenta: account.id,
              FechaDesde: formatDate(new Date(Math.max(
                fromDate - 24 * 60 * 60 * 1000,
                toDate - 9 * 30 * 24 * 60 * 60 * 1000
              ))),
              FechaHasta: formatDate(new Date(toDate + 24 * 60 * 60 * 1000)),
              TipoCuenta: 'AHO'
            }
          },
          Id_Contrato: accountsData.contract
        }
      }
    })
    account.balance = parseFloat(response.Data.dtEstadoCuentaA[0].Saldo_disponible)
    for (const tx of response.Data.Movimientos) {
      const [day, month, year] = tx.fecha.split('/').map(Number)
      const date = new Date(year, month - 1, day)

      let comment = tx.referencia1
      if (comment !== '') {
        comment += ' / '
      }
      comment += tx.referencia

      transactions.push({
        hold: null,
        date,
        movements: [{
          id: new SHA256().hex(tx.cl_fecha + ':' + tx.cl_hora),
          account: { id: account.id },
          invoice: null,
          sum: parseFloat(tx.monto) * (tx.signo === '+' ? 1 : -1),
          fee: 0
        }],
        merchant: null,
        comment
      })
    }
  }
  return transactions
}
