import Ajv2020 from 'ajv/dist/2020'
import type { SchemaObject } from 'ajv'
import addFormats from 'ajv-formats'
import type { PluginCashbacksPayload } from '../../types/cashback'
import schema from './payload.schema.json'

const ajv = new Ajv2020({ strict: true, allErrors: true })
addFormats(ajv)
const validate = ajv.compile<PluginCashbacksPayload>(schema as SchemaObject)

export function assertCashbackPayload (value: unknown): asserts value is PluginCashbacksPayload {
  if (!validate(value)) {
    throw new Error('Invalid cashback payload: ' + ajv.errorsText(validate.errors, { dataVar: 'payload', separator: '; ' }))
  }
}
