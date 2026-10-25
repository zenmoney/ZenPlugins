import { parse, util } from 'protobufjs'
import cheerio from 'cheerio'

// Selected fields from buhta.kassa.v1alpha1.Receipt in the official web client:
// https://assets.buhtacdn.com/build/v541/index.07dma54z.js (captured 2026-10-25).
// Keep source decimals as strings; the public page embeds this message as base64 in __DATA__.
const message = parse(`
  syntax = "proto3";
  message Tax {
    int32 type = 1;
    bool inclusive = 2;
    string percent = 3;
    string amount = 4;
  }
  message Item {
    string name = 6;
    int32 currency = 9;
    string price = 10;
    string quantity = 11;
    string unit = 14;
    string subtotal = 15;
    string total = 16;
    repeated Tax taxes = 18;
  }
  message Payment {
    int32 type = 1;
    string amount = 2;
  }
  message Merchant {
    string name = 2;
    string tin = 4;
    string address = 5;
  }
  message Receipt {
    int32 registerId = 1;
    string id = 2;
    int32 operation = 7;
    repeated Item items = 10;
    repeated Payment payments = 11;
    int32 currency = 12;
    string subtotal = 13;
    string total = 14;
    repeated Tax taxes = 15;
    Merchant merchant = 29;
    bool cancelled = 39;
  }
`).root.lookupType('Receipt')

export function decodeReceipt (encoded: string): unknown {
  assert(encoded.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded), 'Invalid encoded receipt')
  const bytes = new Uint8Array(util.base64.length(encoded))
  util.base64.decode(encoded, bytes, 0)
  return message.toObject(message.decode(bytes), { longs: String })
}

export function readReceiptEnvelope (html: string): unknown {
  const $ = cheerio.load(html)
  const scripts = $('script').toArray().map(script => $(script).html() ?? '')
  const serialized = scripts.map(script => script.match(/^\s*window\.__DATA__\s*=\s*(\{[\s\S]*\})\s*;?\s*$/)?.[1]).filter(value => value !== undefined)
  assert(serialized.length === 1, 'Missing receipt page data')
  const payload: unknown = JSON.parse(serialized[0] as string)
  assert(payload !== null && typeof payload === 'object' && !Array.isArray(payload), 'Invalid receipt page data')
  const entries = Object.entries(payload).filter(([key]) => /:receipt\d+[a-z0-9]{26}$/i.test(key))
  assert(entries.length === 1, 'Expected one receipt response')
  return entries[0][1] as unknown
}
