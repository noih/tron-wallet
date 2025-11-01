import * as fs from 'fs'
import * as path from 'path'
import { TronWeb } from 'tronweb'

import type { WalletInfo, BalanceInfo, Network } from './types.js'

import config from './config.js'

export default class Wallet {
  private tronWeb: TronWeb
  private network: Network
  private walletFile: string

  private static readonly USDT_CONTRACTS: Record<Network, string> = {
    mainnet: config.network.mainnet || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    shasta: config.network.shasta || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
    nile: config.network.nile || ''
  }

  constructor(
    network: Network = 'shasta',
    walletDir = './wallets'
  ) {
    this.network = network
    this.walletFile = path.join(walletDir, `wallet-${network}.json`)

    const hosts: Record<Network, string> = {
      mainnet: 'https://api.trongrid.io',
      nile: 'https://nile.trongrid.io',
      shasta: 'https://api.shasta.trongrid.io'
    }

    this.tronWeb = new TronWeb({ fullHost: hosts[network] })

    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true })
    }
  }

  load(): WalletInfo | null {
    if (!fs.existsSync(this.walletFile)) {
      return null
    }

    const data = fs.readFileSync(this.walletFile, 'utf-8')
    return JSON.parse(data)
  }

  private saveWallet(wallet: WalletInfo, filePath: string): void {
    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, 'utf-8')
      const existingWallet: WalletInfo = JSON.parse(existingData)

      const isSameWallet = existingWallet.address === wallet.address
        && existingWallet.privateKey === wallet.privateKey
        && existingWallet.publicKey === wallet.publicKey
        && existingWallet.network === wallet.network

      if (!isSameWallet) {
        let backupFile = `${filePath}.bk`
        let counter = 2

        while (fs.existsSync(backupFile)) {
          backupFile = `${filePath}.bk${counter}`
          counter++
        }

        fs.renameSync(filePath, backupFile)
      }
    }

    fs.writeFileSync(
      filePath,
      JSON.stringify({
        ...wallet,
        lastUpdated: new Date().toISOString()
      }, null, 2),
      'utf-8'
    )
  }

  async verifyUsdtContract(): Promise<{
    name: string
    symbol: string
    decimals: number
  }> {
    const usdtContract = Wallet.USDT_CONTRACTS[this.network]
    const contract = await this.tronWeb.contract().at(usdtContract)

    const name = await contract.name().call()
    const symbol = await contract.symbol().call()
    const decimals = await contract.decimals().call()

    return {
      name,
      symbol,
      decimals: Number(decimals.toString())
    }
  }

  async create(): Promise<WalletInfo> {
    const account = await this.tronWeb.createAccount()

    const walletInfo: WalletInfo = {
      address: account.address.base58,
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      network: this.network,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    this.saveWallet(walletInfo, this.walletFile)

    return walletInfo
  }

  async getTRXBalance(address: string): Promise<string> {
    const balance = await this.tronWeb.trx.getBalance(address)
    const result = this.tronWeb.fromSun(balance)
    return typeof result === 'string' ? result : result.toString()
  }

  async getUSDTBalance(address: string): Promise<string> {
    const usdtContract = Wallet.USDT_CONTRACTS[this.network]

    this.tronWeb.setAddress(address)
    const contract = await this.tronWeb.contract().at(usdtContract)
    const balance = await contract.balanceOf(address).call()
    return (this.tronWeb.toDecimal(balance) / 1e6).toString()
  }

  async getBalances(address: string): Promise<BalanceInfo> {
    const [trx, usdt] = await Promise.all([
      this.getTRXBalance(address),
      this.getUSDTBalance(address)
    ])

    return { trx, usdt }
  }

  isValidAddress(address: string): boolean {
    return this.tronWeb.isAddress(address)
  }

  getFaucetUrl(): string {
    const urls = {
      nile: 'https://nileex.io/join/getJoinPage',
      shasta: 'https://www.trongrid.io/shasta',
      mainnet: 'No faucet on mainnet, you need to purchase real TRX'
    }
    return urls[this.network]
  }

  getExplorerUrl(address?: string): string {
    const explorers = {
      mainnet: 'https://tronscan.org',
      nile: 'https://nile.tronscan.org',
      shasta: 'https://shasta.tronscan.org'
    }

    const baseUrl = explorers[this.network]
    return address ? `${baseUrl}/#/address/${address}` : baseUrl
  }

  getUsdtContractAddress(): string | undefined {
    return Wallet.USDT_CONTRACTS[this.network]
  }

  getNetwork(): string {
    return this.network
  }

  async transferTRX(
    fromPrivateKey: string,
    toAddress: string,
    amount: string
  ): Promise<string> {
    this.tronWeb.setPrivateKey(fromPrivateKey)

    const transaction = await this.tronWeb.trx.sendTransaction(
      toAddress,
      Number(this.tronWeb.toSun(Number(amount)))
    )

    return transaction.txid
  }

  async transferUSDT(
    fromPrivateKey: string,
    toAddress: string,
    amount: string
  ): Promise<string> {
    const usdtContract = Wallet.USDT_CONTRACTS[this.network]

    this.tronWeb.setPrivateKey(fromPrivateKey)
    const contract = await this.tronWeb.contract().at(usdtContract)

    const amountInSun = this.tronWeb.toBigNumber(amount).multipliedBy(1e6)
    const transaction = await contract.transfer(
      toAddress,
      amountInSun
    ).send()

    return transaction
  }
}
