import { Jimp } from 'jimp'
import { delay, generateRandomString, takePicture } from '../../common/utils'
import { InvalidLoginOrPasswordError } from '../../errors'
import {
  authByPhoneNumber,
  authByPassword,
  verifySmsCode,
  myIdIdentify,
  myIdVerifyResult,
  getCards,
  getAccounts,
  getDeposits,
  getAllTransactions
} from './api'

export async function scrape ({ preferences, fromDate, toDate, isFirstRun }) {
  const photoFromCamera = await takePicture('jpeg')
  console.log(typeof photoFromCamera)
  console.log(photoFromCamera)
  await blobToBase64WithResolution(photoFromCamera, 480, 640)
  console.log('toBase64 complete')
  // FIRST RUN STEPS
  if (isFirstRun) {
    const deviceId = generateRandomString(16)
    ZenMoney.setData('deviceId', deviceId)
    ZenMoney.setData('sessionId', generateRandomString(16))
    ZenMoney.setData('requestId', generateRandomString(16))
    ZenMoney.saveData()

    const authPhone = await authByPhoneNumber(preferences.phone)
    if (!authPhone) {
      throw new InvalidLoginOrPasswordError('Для указанного номера телефона не найден аккаунт')
    }

    await updateToken(preferences.phone, preferences.password, preferences.isResident, preferences.pinfl, preferences.bday)
  }

  // try {
  //   return await doScrape(fromDate, toDate)
  // } catch {
  //   return {
  //     accounts: [],
  //     transactions: []
  //   }
  // }

  try {
    return await doScrape(fromDate, toDate)
  } catch {
    await updateToken(preferences.phone, preferences.password, preferences.isResident, preferences.pinfl, preferences.bday)
    return await doScrape(fromDate, toDate)
  }
}

async function blobToBase64WithResolution (blob, targetWidth, targetHeight) {
  console.log('Buffer.from begins')
  const buffer = Buffer.from(await blob.arrayBuffer())
  console.log('fromBuffer begin')
  const image = await Jimp.fromBuffer(buffer)
  console.log('fromBuffer complete')
  const resizedImage = image.resize({ w: targetWidth, h: targetHeight })
  console.log('resize complete')
  const base64String = await resizedImage.getBase64('image/jpeg')
  console.log('getBase64 complete')
  // const image = await Image.load(buffer)
  // const resizedImage = image.resize({ width: targetWidth, height: targetHeight })
  // const base64String = `data:image/jpeg;base64,${resizedImage.toBase64('image/jpeg')}`
  // return base64String
  return base64String
}

async function updateToken (phone, password, isResident, pinfl, birthDate) {
  try {
    const verificationCode = await authByPassword(phone, password)
    const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения')
    await verifySmsCode(verificationCode, smsCode)
  } catch (e) {
    if (e instanceof TemporaryError) {
      // todo необходимо пройти идентификацию через myid.uz
      await completeIdentificationOrThrow(isResident, pinfl, birthDate)

      const verificationCode = await authByPassword(phone, password)
      const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения')
      await verifySmsCode(verificationCode, smsCode)
    } else {
      throw new TemporaryError('Problems with identification')
    }
  }
}

async function completeIdentificationOrThrow (isResident, pinfl, birthDate) {
  const photoFromCamera = await takePicture('jpeg')
  const base64Image = await blobToBase64WithResolution(photoFromCamera, 480, 640)
  const jobId = await myIdIdentify(isResident, pinfl, birthDate, base64Image)
  await delay(2000)
  let verifyResult = await myIdVerifyResult(jobId)
  if (!verifyResult.success) {
    await delay(5000)
    verifyResult = await myIdVerifyResult(jobId)
    if (!verifyResult.success) {
      throw new TemporaryError(verifyResult.errorDetail)
    }
  }
}

async function doScrape (fromDate, toDate) {
  console.log(`Starting to scrape data from ${fromDate.toISOString()} to ${toDate ? toDate.toISOString() : 'now'}`)

  // Get accounts
  const cards = await getCards()
  const accounts = await getAccounts()
  const deposits = await getDeposits()

  // Get transactions
  const from = fromDate.getTime()
  const to = (toDate || new Date()).getTime()

  const cardsAndAccountsTransactions = []
  for (const cardOrAccount of cards.concat(accounts)) {
    const transactions = await getAllTransactions(cardOrAccount, from, to, false)
    cardsAndAccountsTransactions.push(...transactions)
  }

  const depositsTransactions = []
  for (const deposit of deposits) {
    const transactions = await getAllTransactions(deposit, from, to, true)
    depositsTransactions.push(...transactions)
  }

  // return data
  return {
    accounts: [
      ...cards,
      ...accounts,
      ...deposits
    ],
    transactions: [
      ...cardsAndAccountsTransactions,
      ...depositsTransactions
    ]
  }
}
