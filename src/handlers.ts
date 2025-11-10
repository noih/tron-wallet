import type { Interface } from 'readline'

import chalk from 'chalk'

import type { HandlerParams, Network, WalletSession } from './types.js'

import { question } from './utils.js'
import Wallet from './wallet.js'

export async function selectNetwork(rl: Interface): Promise<Network> {
  console.log(chalk.cyan.bold('Select Network:'))
  console.log(chalk.white('  1. Mainnet (Production)'))
  console.log(chalk.white('  2. Shasta (Testnet)'))
  console.log(chalk.white('  3. Nile (Testnet)'))
  console.log()

  while (true) {
    const choice = await question(rl, chalk.green('Select network (enter number): '))

    switch (choice.trim()) {
      case '1':
        return 'mainnet'
      case '2':
        return 'shasta'
      case '3':
        return 'nile'
      default:
        console.log(chalk.red('Invalid choice, please enter 1-3'))
    }
  }
}

// Helper functions for transfers
async function validateTransferInput(
  rl: Interface,
  currencyLabel: string
): Promise<{ toAddress: string, amount: string } | null> {
  const toAddress = await question(rl, 'Enter recipient address: ')
  if (!Wallet.isValidAddress(toAddress.trim())) {
    console.log(chalk.red('Invalid recipient address'))
    return null
  }

  const amount = await question(rl, `Enter amount (${currencyLabel}): `)
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    console.log(chalk.red('Invalid amount'))
    return null
  }

  return { toAddress: toAddress.trim(), amount }
}

async function confirmTransfer(
  rl: Interface,
  amount: string,
  toAddress: string,
  currencyLabel: string
): Promise<boolean> {
  const confirm = await question(
    rl,
    chalk.yellow(`\nTransfer ${amount} ${currencyLabel} to ${toAddress}? (y/N): `)
  )

  if (confirm.toLowerCase() !== 'y') {
    console.log(chalk.blue('Cancelled'))
    return false
  }

  return true
}

function displayTransferResult(
  currency: string,
  amount: string,
  toAddress: string,
  network: Network,
  txid: string
): void {
  console.log(chalk.green('\nTransfer successful'))
  console.log(chalk.gray(`Currency: ${currency}`))
  console.log(chalk.gray(`Amount: ${amount}`))
  console.log(chalk.gray(`To: ${toAddress}`))
  console.log(chalk.gray(`Network: ${network}`))
  console.log(chalk.gray(`Transaction ID: ${txid}`))

  const explorerUrl = Wallet.getExplorerUrl(toAddress, network)
    .replace(`/address/${toAddress}`, `/transaction/${txid}`)
  console.log(chalk.gray(`Explorer: ${explorerUrl}`))
}

export async function loadWallet({ rl, session, walletDir }: HandlerParams): Promise<WalletSession> {
  console.log(chalk.cyan('\nAction: Load Wallet\n'))

  try {
    if (session.wallet) {
      console.log(chalk.yellow('Current wallet is loaded:'))
      console.log(chalk.gray(`  Address: ${session.wallet.address}`))
      console.log(chalk.gray(`  Network: ${session.wallet.network}\n`))
    }

    const wallets = Wallet.listWallets(walletDir)

    if (wallets.length === 0) {
      console.log(chalk.yellow('No wallets found in the wallets directory'))
      return session
    }

    console.log(chalk.white('Available wallets:'))
    wallets.forEach((file, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${file}`))
    })
    console.log()

    const choice = await question(rl, chalk.green('Select wallet to load (enter number or 0 to cancel): '))
    const index = parseInt(choice.trim()) - 1

    if (index === -1) {
      console.log(chalk.blue('Cancelled'))
      return session
    }

    if (index < 0 || index >= wallets.length) {
      console.log(chalk.red('Invalid choice'))
      return session
    }

    const selectedFile = wallets[index]
    const loadedWallet = Wallet.loadWallet(walletDir, selectedFile)

    if (loadedWallet) {
      console.log(chalk.green('Wallet loaded successfully'))
      console.log(chalk.gray(`Address: ${loadedWallet.address}`))
      console.log(chalk.gray(`Network: ${loadedWallet.network}`))
      return {
        wallet: loadedWallet,
        filename: selectedFile
      }
    }

    console.log(chalk.red('Failed to load wallet'))
    return session
  } catch (error) {
    console.log(chalk.red('Failed to load wallet:'), error)
    return session
  }
}

export async function createWallet({ rl, session, walletDir }: HandlerParams): Promise<WalletSession> {
  console.log(chalk.cyan('\nAction: Create New Wallet\n'))

  try {
    const network = await selectNetwork(rl)

    console.log()
    const name = (await question(rl, chalk.green('Enter wallet name: '))).trim()

    if (!name) {
      console.log(chalk.red('Wallet name cannot be empty'))
      return session
    }

    const { wallet, filename } = await Wallet.createWallet(walletDir, network, name)

    console.log(chalk.green('New wallet created and loaded'))
    console.log(chalk.yellow('WARNING: Keep your private key safe, it cannot be recovered if lost!'))
    console.log(chalk.gray(`\nAddress: ${wallet.address}`))
    console.log(chalk.gray(`Network: ${wallet.network}`))
    console.log(chalk.gray(`Created: ${wallet.createdAt}`))

    return {
      wallet,
      filename
    }
  } catch (error) {
    console.log(chalk.red('Failed to create wallet:'), error)
    return session
  }
}

async function transfer(
  currency: 'TRX' | 'USDT',
  { rl, session }: HandlerParams
): Promise<WalletSession> {
  console.log(chalk.cyan(`\nAction: Transfer ${currency}\n`))

  if (!session.wallet) {
    console.log(chalk.yellow('Please load a wallet first'))
    return session
  }

  try {
    const input = await validateTransferInput(rl, currency)
    if (!input) return session

    const confirmed = await confirmTransfer(rl, input.amount, input.toAddress, currency)
    if (!confirmed) return session

    const txid = currency === 'TRX'
      ? await Wallet.transferTRX(session.wallet, input.toAddress, input.amount)
      : await Wallet.transferUSDT(session.wallet, input.toAddress, input.amount)

    displayTransferResult(currency, input.amount, input.toAddress, session.wallet.network, txid)
  } catch (error) {
    console.log(chalk.red('Transfer failed:'), error)
  }

  return session
}

export async function transferTRX(params: HandlerParams): Promise<WalletSession> {
  return transfer('TRX', params)
}

export async function transferUSDT(params: HandlerParams): Promise<WalletSession> {
  return transfer('USDT', params)
}

export async function validateAddress({ rl, session }: HandlerParams): Promise<WalletSession> {
  console.log(chalk.cyan('\nAction: Validate Address\n'))

  const address = await question(rl, 'Enter address to validate: ')
  const isValid = Wallet.isValidAddress(address.trim())

  if (isValid) {
    console.log(chalk.green(`${address.trim()} is a valid TRON address`))
  } else {
    console.log(chalk.red(`${address.trim()} is not a valid TRON address`))
  }

  return session
}

export async function displayFaucet({ session }: HandlerParams): Promise<WalletSession> {
  console.log(chalk.cyan('\nAction: Show Faucet URL\n'))

  if (!session.wallet) {
    console.log(chalk.yellow('Please load a wallet first'))
    return session
  }

  if (session.wallet.network !== 'mainnet') {
    console.log(chalk.gray(`Faucet URL: ${Wallet.getFaucetUrl(session.wallet.network)}`))
    console.log(chalk.gray('Instructions: Copy your address to the faucet website to claim test TRX'))
  } else {
    console.log(chalk.yellow('No faucet on mainnet, you need to purchase real TRX'))
  }

  return session
}
