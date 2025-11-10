import * as fs from 'fs'
import * as path from 'path'
import { TronWeb } from 'tronweb'

import type { WalletInfo, BalanceInfo, Network } from './types.js'

import config from './config.js'

export default class Wallet {
  private static readonly USDT_CONTRACTS: Record<Network, string> = {
    mainnet: config.usdtContracts.mainnet,
    shasta: config.usdtContracts.shasta,
    nile: config.usdtContracts.nile
  }

  private static readonly TRON_HOSTS: Record<Network, string> = {
    mainnet: 'https://api.trongrid.io',
    nile: 'https://nile.trongrid.io',
    shasta: 'https://api.shasta.trongrid.io'
  }

  private static getTronWeb(network: Network): TronWeb {
    return new TronWeb({ fullHost: Wallet.TRON_HOSTS[network] })
  }

  static listWallets(walletDir: string): string[] {
    if (!fs.existsSync(walletDir)) {
      return []
    }

    return fs
      .readdirSync(walletDir)
      .filter((file) => file.endsWith('.json') && !file.match(/\.bk\d*$/))
  }

  static loadWallet(walletDir: string, filename: string): WalletInfo | null {
    const filePath = path.join(walletDir, filename)

    if (!fs.existsSync(filePath)) {
      return null
    }

    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  }

  private static saveWallet(wallet: WalletInfo, filePath: string) {
    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, 'utf-8')
      const existingWallet: WalletInfo = JSON.parse(existingData)

      const isSameWallet = existingWallet.address === wallet.address
        && existingWallet.privateKey === wallet.privateKey
        && existingWallet.publicKey === wallet.publicKey
        && existingWallet.network === wallet.network

      if (!isSameWallet) {
        let counter = 1
        let backupFile = `${filePath}.bk${counter}`

        while (fs.existsSync(backupFile)) {
          counter++
          backupFile = `${filePath}.bk${counter}`
        }

        fs.renameSync(filePath, backupFile)
      }
    }

    return fs.writeFileSync(
      filePath,
      JSON.stringify({ ...wallet, lastUpdated: new Date().toISOString() }, null, 2),
      'utf-8'
    )
  }

  static async createWallet(
    walletDir: string,
    network: Network,
    name: string
  ): Promise<{ wallet: WalletInfo, filename: string }> {
    // Ensure wallet directory exists
    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true })
    }

    const tronWeb = Wallet.getTronWeb(network)
    const account = await tronWeb.createAccount()

    const wallet: WalletInfo = {
      address: account.address.base58,
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      network,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    const filename = `${name}-${network}.json`
    const walletFile = path.join(walletDir, filename)
    Wallet.saveWallet(wallet, walletFile)

    return { wallet, filename }
  }

  static async verifyUsdtContract(address: string, network: Network): Promise<{
    name: string
    symbol: string
    decimals: number
  }> {
    const tronWeb = Wallet.getTronWeb(network)
    const usdtContract = Wallet.USDT_CONTRACTS[network]

    if (!usdtContract) {
      throw new Error(`USDT contract address not configured for ${network}. Please set ${network.toUpperCase()}_USDT_CONTRACT in .env file`)
    }

    tronWeb.setAddress(address)
    const contract = await tronWeb.contract().at(usdtContract)

    const name = await contract.name().call()
    const symbol = await contract.symbol().call()
    const decimals = await contract.decimals().call()

    return {
      name,
      symbol,
      decimals: Number(decimals.toString())
    }
  }

  static async getTRXBalance(address: string, network: Network): Promise<string> {
    const tronWeb = Wallet.getTronWeb(network)
    const balance = await tronWeb.trx.getBalance(address)
    const result = tronWeb.fromSun(balance)
    return typeof result === 'string' ? result : result.toString()
  }

  static async getUSDTBalance(address: string, network: Network): Promise<string> {
    const tronWeb = Wallet.getTronWeb(network)
    const usdtContract = Wallet.USDT_CONTRACTS[network]

    if (!usdtContract) {
      throw new Error(`USDT contract address not configured for ${network}. Please set ${network.toUpperCase()}_USDT_CONTRACT in .env file`)
    }

    tronWeb.setAddress(address)
    const contract = await tronWeb.contract().at(usdtContract)
    const balance = await contract.balanceOf(address).call()
    return (tronWeb.toDecimal(balance) / 1e6).toString()
  }

  static async getBalances(walletInfo: WalletInfo): Promise<BalanceInfo> {
    const [trx, usdt] = await Promise.all([
      Wallet.getTRXBalance(walletInfo.address, walletInfo.network),
      Wallet.getUSDTBalance(walletInfo.address, walletInfo.network)
    ])

    return { trx, usdt }
  }

  static isValidAddress(address: string): boolean {
    // Use mainnet TronWeb instance for validation
    const tronWeb = Wallet.getTronWeb('mainnet')
    return tronWeb.isAddress(address)
  }

  static getFaucetUrl(network: Network): string {
    const urls = {
      nile: 'https://nileex.io/join/getJoinPage',
      shasta: 'https://www.trongrid.io/shasta',
      mainnet: 'No faucet on mainnet, you need to purchase real TRX'
    }
    return urls[network]
  }

  static getExplorerUrl(address: string, network: Network): string {
    const explorers = {
      mainnet: 'https://tronscan.org',
      nile: 'https://nile.tronscan.org',
      shasta: 'https://shasta.tronscan.org'
    }

    return `${explorers[network]}/#/address/${address}`
  }

  static async transferTRX(
    walletInfo: WalletInfo,
    toAddress: string,
    amount: string
  ): Promise<string> {
    const tronWeb = Wallet.getTronWeb(walletInfo.network)
    tronWeb.setPrivateKey(walletInfo.privateKey)

    const transaction = await tronWeb.trx.sendTransaction(
      toAddress,
      Number(tronWeb.toSun(Number(amount)))
    )

    return transaction.txid
  }

  static async transferUSDT(
    walletInfo: WalletInfo,
    toAddress: string,
    amount: string
  ): Promise<string> {
    const tronWeb = Wallet.getTronWeb(walletInfo.network)
    const usdtContract = Wallet.USDT_CONTRACTS[walletInfo.network]

    if (!usdtContract) {
      throw new Error(`USDT contract address not configured for ${walletInfo.network}. Please set ${walletInfo.network.toUpperCase()}_USDT_CONTRACT in .env file`)
    }

    tronWeb.setPrivateKey(walletInfo.privateKey)
    const contract = await tronWeb.contract().at(usdtContract)

    const amountInSun = tronWeb.toBigNumber(amount).multipliedBy(1e6)
    const transaction = await contract.transfer(
      toAddress,
      amountInSun
    ).send()

    return transaction
  }
}
