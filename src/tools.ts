import type { Interface } from 'readline'

import chalk from 'chalk'

import type { Network } from './types.js'

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

export async function displayInfo(wallet: Wallet) {
  const w = wallet.load()

  if (w) {
    console.log(chalk.bold('Current Wallet'))
    console.log(chalk.gray(`  Address: ${w.address}`))
    console.log(chalk.gray(`  Network: ${w.network}`))
    console.log(chalk.gray(`  Created: ${w.createdAt}`))
    console.log(chalk.gray(`  Explorer: ${wallet.getExplorerUrl(w.address)}`))

    try {
      const balances = await wallet.getBalances(w.address)
      console.log(chalk.gray(`  TRX Balance: ${balances.trx}`))
      console.log(chalk.gray(`  USDT Balance: ${balances.usdt}`))
    } catch {
      console.log(chalk.yellow('  (Failed to query balance)'))
    }
    console.log()
  } else {
    console.log(chalk.yellow('No wallet found\n'))
  }

  try {
    const contractInfo = await wallet.verifyUsdtContract()
    console.log(chalk.bold('USDT Contract'))
    console.log(chalk.gray(`  Name: ${contractInfo.name}`))
    console.log(chalk.gray(`  Symbol: ${contractInfo.symbol}`))
    console.log(chalk.gray(`  Decimals: ${contractInfo.decimals}`))
    console.log()
  } catch {
    console.log(chalk.yellow('USDT Contract (Failed to verify)\n'))
  }
}

export function displayMenu() {
  console.log(chalk.cyan.bold('Menu:'))
  console.log(chalk.white('  1. Create New Wallet'))
  console.log(chalk.white('  2. Transfer TRX'))
  console.log(chalk.white('  3. Transfer USDT'))
  console.log(chalk.white('  4. Validate Address'))
  console.log(chalk.white('  5. Show Faucet URL'))
  console.log(chalk.white('  0. Exit'))
  console.log()
}

export async function createWallet(rl: Interface, wallet: Wallet) {
  console.log(chalk.cyan('\nAction: Create New Wallet\n'))

  try {
    const existingWallet = wallet.load()
    if (existingWallet) {
      console.log(chalk.yellow('WARNING: A wallet already exists'))
      console.log(chalk.gray(`Address: ${existingWallet.address}`))
      const confirm = await question(rl, chalk.yellow('\nCreate a new wallet anyway? This will backup the existing wallet. (y/N): '))

      if (confirm.toLowerCase() !== 'y') {
        console.log(chalk.blue('Cancelled'))
        return
      }
    }

    const w = await wallet.create()
    console.log(chalk.green('New wallet created'))
    console.log(chalk.yellow('WARNING: Keep your private key safe, it cannot be recovered if lost!'))
    console.log(chalk.gray(`\nAddress: ${w.address}`))
    console.log(chalk.gray(`Network: ${w.network}`))
    console.log(chalk.gray(`Created: ${w.createdAt}`))
  } catch (error) {
    console.log(chalk.red('Failed to create wallet:'), error)
  }
}

export async function transferTRX(rl: Interface, wallet: Wallet) {
  console.log(chalk.cyan('\nAction: Transfer TRX\n'))

  const w = wallet.load()
  if (!w) {
    console.log(chalk.yellow('Please create a wallet first'))
    return
  }

  try {
    const toAddress = await question(rl, 'Enter recipient address: ')
    if (!wallet.isValidAddress(toAddress.trim())) {
      console.log(chalk.red('Invalid recipient address'))
      return
    }

    const amount = await question(rl, 'Enter amount (TRX): ')
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      console.log(chalk.red('Invalid amount'))
      return
    }

    const confirm = await question(rl, chalk.yellow(`\nTransfer ${amount} TRX to ${toAddress.trim()}? (y/N): `))
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.blue('Cancelled'))
      return
    }

    const txid = await wallet.transferTRX(w.privateKey, toAddress.trim(), amount)
    console.log(chalk.green('Transfer successful'))
    console.log(chalk.gray(`Transaction ID: ${txid}`))
  } catch (error) {
    console.log(chalk.red('Transfer failed:'), error)
  }
}

export async function transferUSDT(rl: Interface, wallet: Wallet) {
  console.log(chalk.cyan('\nAction: Transfer USDT\n'))

  const w = wallet.load()
  if (!w) {
    console.log(chalk.yellow('Please create a wallet first'))
    return
  }

  try {
    const toAddress = await question(rl, 'Enter recipient address: ')
    if (!wallet.isValidAddress(toAddress.trim())) {
      console.log(chalk.red('Invalid recipient address'))
      return
    }

    const amount = await question(rl, 'Enter amount (USDT): ')
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      console.log(chalk.red('Invalid amount'))
      return
    }

    const confirm = await question(rl, chalk.yellow(`\nTransfer ${amount} USDT to ${toAddress.trim()}? (y/N): `))
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.blue('Cancelled'))
      return
    }

    const txid = await wallet.transferUSDT(w.privateKey, toAddress.trim(), amount)
    console.log(chalk.green('Transfer successful'))
    console.log(chalk.gray(`Transaction ID: ${txid}`))
  } catch (error) {
    console.log(chalk.red('Transfer failed:'), error)
  }
}

export async function validateAddress(rl: Interface, wallet: Wallet) {
  console.log(chalk.cyan('\nAction: Validate Address\n'))

  const address = await question(rl, 'Enter address to validate: ')
  const isValid = wallet.isValidAddress(address.trim())

  if (isValid) {
    console.log(chalk.green(`${address.trim()} is a valid TRON address`))
  } else {
    console.log(chalk.red(`${address.trim()} is not a valid TRON address`))
  }
}

export function showFaucet(wallet: Wallet) {
  console.log(chalk.cyan('\nAction: Show Faucet URL\n'))

  if (wallet.getNetwork() !== 'mainnet') {
    console.log(chalk.gray(`Faucet URL: ${wallet.getFaucetUrl()}`))
    console.log(chalk.gray('Instructions: Copy your address to the faucet website to claim test TRX'))
  } else {
    console.log(chalk.yellow('No faucet on mainnet, you need to purchase real TRX'))
  }
}
