export const KNOWN_CONTRACTS: Record<string, string> = {
  // DEX
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap V3 Router',
  '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506': 'SushiSwap Router',
  '0x2df1adb252afb77fe762586fa6c116857f163df7': 'PancakeSwap Router',

  // Bridges
  '0x0000000000000000000000000000000000000064': 'Arbitrum Bridge',
  '0x3c2269811836af69497e5f486a85d7316753cf62': 'LayerZero Endpoint',
  '0x8731d54e9d02c286767d56ac03e8037c07e01e98': 'Stargate Router',

  // Lending / Perps
  '0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2': 'Aave Lending Pool',
  '0x32dF62dc3aEd2cD6224193052Ce665DC18165841': 'Radiant Capital',
  '0x489ee077994b6658eafa855c308275ead8097c4a': 'GMX Exchange',

  // System
  '0x0000000000000000000000000000000000000000': 'System'
}

export function normalizeMerchant (addr: string, user: string): string {
  if (addr == null || addr === '') return 'Unknown'

  const a = addr.toLowerCase()
  const u = user.toLowerCase()

  if (a === u) return 'Self'

  if (KNOWN_CONTRACTS[a] != null) return KNOWN_CONTRACTS[a]

  if (a.startsWith('0x') && a.length === 42) {
    return `Contract ${addr.slice(0, 6)}…${addr.slice(-4)}`
  }

  return addr
}
