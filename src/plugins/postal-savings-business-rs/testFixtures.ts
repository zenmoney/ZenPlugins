import { readFileSync } from 'fs'
import { join } from 'path'

export function fixture (name: string): string {
  return readFileSync(join(__dirname, '__tests__', 'fixtures', name), 'utf8')
}
