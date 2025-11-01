export type Network = 'mainnet' | 'nile' | 'shasta'

export interface WalletInfo {
  address: string
  privateKey: string
  publicKey: string
  network: Network
  createdAt: string
  lastUpdated: string
}

export interface BalanceInfo {
  trx: string
  usdt: string
}
