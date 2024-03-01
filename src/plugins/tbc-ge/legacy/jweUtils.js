import jose from 'node-jose'

export async function encryptJWEUsingJSONKey (data, rawKey) {
  const key = await jose.JWK.asKey(rawKey, 'json')
  return await encryptJWE(data, key)
}

export async function encryptJWEUsingObjectKey (data, rawKey) {
  const key = await jose.JWK.asKey(rawKey)
  return await encryptJWE(data, key)
}

async function encryptJWE (data, key) {
  const enc = jose.JWE.createEncrypt({
    format: 'compact',
    contentAlg: 'A128CBC-HS256',
    fields: { alg: 'RSA1_5' }
  }, { key, reference: false })
  return await enc.update(data).final()
}
