import fetchMock from 'fetch-mock'
import { InvalidOtpCodeError, ZPAPIError } from '../../../../errors'
import { fetchConfirmTrustedDeviceV2, fetchUnTrustDeviceV2 } from '../../fetchApi'

import { DeviceData } from '../../models'

afterEach(() => fetchMock.restore())

it('reports the rejected SMS code when confirming a trusted device', async () => {
  // mail_inbound 224928, build 112. Device order/confirm, reduced to the rejection code.
  fetchMock.post('https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order/confirm', {
    status: 400, body: { code: 'WrongCode' }
  })
  await expect(fetchConfirmTrustedDeviceV2('0000', 1, [])).rejects.toBeInstanceOf(InvalidOtpCodeError)
})

it('stops when the bank fails to confirm the previous device removal', async () => {
  // mail_inbound 224928, build 112. Unset order creation and confirmation, reduced to the required fields.
  const url = 'https://rmbgwauth.tbconline.ge/devicemanagement/api/v1/device/order'
  fetchMock.post(url, { status: 200, body: { orderId: 1 } })
  fetchMock.post(`${url}/confirm`, { status: 500, body: { code: 'InternalServerError' } })
  const device = new DeviceData('model', 'device', 'manufacturer', 'model', 'android', 'Android', '10')
  const result = fetchUnTrustDeviceV2(device, 'model-session', [])
  await expect(result).rejects.toThrow('Unexpected device removal confirmation status: 500')
  await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
})
