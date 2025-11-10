import chalk from 'chalk'
import * as readline from 'readline'

import type { WalletSession } from './types.js'

import config from './config.js'
import { displayInfo, displayMenu, handleMenuChoice } from './menu.js'
import { question } from './utils.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function main() {
  try {
    let session: WalletSession = {
      wallet: null,
      filename: null
    }

    while (true) {
      console.clear()
      await displayInfo(session)

      const isLoaded = session.wallet !== null

      displayMenu(isLoaded)
      const choice = await question(rl, chalk.green('Select an option (enter number): '))
      const { session: result, needsPause } = await handleMenuChoice(choice.trim(), isLoaded, rl, session, config.walletDir)

      if (result === null) { break }

      session = result
      if (needsPause) {
        await question(rl, chalk.gray('\nPress Enter to continue...'))
      }
    }
  } catch (error) {
    console.error(chalk.red('\nProgram execution failed:'), error)

  } finally {
    rl.close()
    process.exit(0)
  }
}

main()
