import { ETHER_MAINNET, BNB_MAINNET, ARBITRUM_ONE } from './config'
import type { Chain } from './types'

type ContractMap = Record<string, string>

const ETHEREUM_CONTRACTS: ContractMap = {
  // DEX
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
  '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b': 'Uniswap Universal Router',
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap Router',

  // Bridges
  '0x3ee18b2214aff97000d974cf647e7c347e8fa585': 'Wormhole Bridge',

  // Lending
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': 'Aave V2 Lending Pool',
  '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': 'Aave V3 Pool',

  // System
  '0x0000000000000000000000000000000000000000': 'System'
}

const BSC_CONTRACTS: ContractMap = {
  // DEX
  '0x10ed43c718714eb63d5aa57b78b54704e256024e': 'PancakeSwap Router',
  '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506': 'SushiSwap Router',

  // Bridges
  '0x3c2269811836af69497e5f486a85d7316753cf62': 'LayerZero Endpoint',
  '0x8731d54e9d02c286767d56ac03e8037c07e01e98': 'Stargate Router',

  // Lending
  '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4': 'Venus Protocol',

  // System
  '0x0000000000000000000000000000000000000000': 'System'
}

const ARBITRUM_CONTRACTS: ContractMap = {
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
  '0x32df62dc3aed2cd6224193052ce665dc18165841': 'Radiant Capital',
  '0x489ee077994b6658eafa855c308275ead8097c4a': 'GMX Exchange',

  // System
  '0x0000000000000000000000000000000000000000': 'System'
}

const KNOWN_CONTRACTS: Record<number, ContractMap> = {
  [ETHER_MAINNET]: ETHEREUM_CONTRACTS,
  [BNB_MAINNET]: BSC_CONTRACTS,
  [ARBITRUM_ONE]: ARBITRUM_CONTRACTS
}

export function normalizeMerchant (
  addr: string,
  userAddress: string,
  chain: Chain
): string {
  if (addr == null || addr === '') return 'Unknown'

  const a = addr.toLowerCase()
  const u = userAddress.toLowerCase()

  if (a === u) return 'Self'

  const contracts = KNOWN_CONTRACTS[chain] ?? {}
  if (contracts[a] != null) return contracts[a]

  if (a.startsWith('0x') && a.length === 42) {
    return `Contract ${addr.slice(0, 6)}…${addr.slice(-4)}`
  }

  return addr
}
