import type { Interface } from 'readline'

import chalk from 'chalk'

import type { MenuOption, WalletSession } from './types.js'

import * as handlers from './handlers.js'
import Wallet from './wallet.js'

export const menuOptions: MenuOption[] = [
  {
    key: '1',
    label: 'Create New Wallet',
    requiresWallet: null,
    needsPause: true,
    handler: handlers.createWallet
  },
  {
    key: '2',
    label: 'Load Wallet',
    requiresWallet: null,
    needsPause: true,
    handler: handlers.loadWallet
  },
  {
    key: '3',
    label: 'Validate Address',
    requiresWallet: null,
    needsPause: true,
    handler: handlers.validateAddress
  },
  {
    key: '4',
    label: 'Transfer TRX',
    requiresWallet: true,
    needsPause: true,
    handler: handlers.transferTRX
  },
  {
    key: '5',
    label: 'Transfer USDT',
    requiresWallet: true,
    needsPause: true,
    handler: handlers.transferUSDT
  },
  {
    key: '6',
    label: 'Show Faucet URL',
    requiresWallet: true,
    needsPause: true,
    handler: handlers.displayFaucet
  }
]

export function displayMenu(walletLoaded: boolean): void {
  console.log(chalk.cyan.bold('Menu:'))

  menuOptions.forEach((option) => {
    const shouldShow = option.requiresWallet === null
      || option.requiresWallet === walletLoaded

    if (shouldShow) {
      console.log(chalk.white(`  ${option.key}. ${option.label}`))
    }
  })

  console.log(chalk.white('  0. Exit'))
  console.log()
}

export async function handleMenuChoice(
  choice: string,
  walletLoaded: boolean,
  rl: Interface,
  session: WalletSession,
  walletDir: string
): Promise<{ session: WalletSession | null, needsPause: boolean }> {
  // Exit option
  if (choice === '0') {
    console.log(chalk.cyan('\nbye!\n'))
    return { session: null, needsPause: false }
  }

  // Find matching option
  const option = menuOptions.find(
    (opt) => opt.key === choice
      && (opt.requiresWallet === null || opt.requiresWallet === walletLoaded)
  )

  if (option) {
    const newSession = await option.handler({ rl, session, walletDir })
    return { session: newSession, needsPause: option.needsPause }
  }

  const validOptions = menuOptions
    .filter((opt) => opt.requiresWallet === null || opt.requiresWallet === walletLoaded)
    .map((opt) => opt.key)
    .filter((key, idx, arr) => arr.indexOf(key) === idx) // unique
    .join(', ')

  console.log(chalk.red(`\nInvalid choice, please enter 0 or ${validOptions}`))
  return { session, needsPause: false }
}

export async function displayInfo(session: WalletSession) {
  const { wallet, filename } = session

  if (wallet) {
    console.log(chalk.bold('Wallet'))
    if (filename) {
      console.log(chalk.gray(`  File: ${filename}`))
    }
    console.log(chalk.gray(`  Address: ${wallet.address}`))
    console.log(chalk.gray(`  Network: ${wallet.network}`))
    console.log(chalk.gray(`  Created: ${wallet.createdAt}`))
    console.log(chalk.gray(`  Explorer: ${Wallet.getExplorerUrl(wallet.address, wallet.network)}`))

    try {
      const balances = await Wallet.getBalances(wallet)
      console.log(chalk.gray(`  TRX Balance: ${balances.trx}`))
      console.log(chalk.gray(`  USDT Balance: ${balances.usdt}`))
    } catch (error) {
      console.log(chalk.yellow(`  (Failed to query balance: ${error})`))
    }
    console.log()

    try {
      const contractInfo = await Wallet.verifyUsdtContract(wallet.address, wallet.network)
      console.log(chalk.bold('USDT Contract'))
      console.log(chalk.gray(`  Name: ${contractInfo.name}`))
      console.log(chalk.gray(`  Symbol: ${contractInfo.symbol}`))
      console.log(chalk.gray(`  Decimals: ${contractInfo.decimals}`))
      console.log()
    } catch (error) {
      console.log(chalk.yellow(`USDT Contract (Failed to verify: ${error})\n`))
    }
  } else {
    console.log(chalk.yellow('No wallet loaded\n'))
  }
}
