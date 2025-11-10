import type * as readline from 'readline'

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

export interface WalletSession {
  wallet: WalletInfo | null
  filename: string | null
}

export interface HandlerParams {
  rl: readline.Interface
  session: WalletSession
  walletDir: string
}

export interface MenuOption {
  key: string
  label: string
  requiresWallet: boolean | null // null = always show, true = only when loaded, false = only when not loaded
  needsPause: boolean // whether to wait for user to press Enter after action
  handler: (params: HandlerParams) => Promise<WalletSession>
}
