import chalk from 'chalk'
import * as readline from 'readline'

import * as tools from './tools.js'
import { question, sleep } from './utils.js'
import Wallet from './wallet.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function main() {
  try {
    console.log(chalk.cyan.bold('\nTRON Wallet Tool\n'))

    const network = await tools.selectNetwork(rl)
    const wallet = new Wallet(network, './wallets')
    console.log(chalk.green(`\nConnected to ${network} network\n`))

    let running = true
    let firstLoop = true

    while (running) {
      if (!firstLoop) {
        await sleep(1000)
      }
      firstLoop = false

      console.clear()
      await tools.displayInfo(wallet)
      tools.displayMenu()

      const choice = await question(rl, chalk.green('Select an option (enter number): '))

      switch (choice.trim()) {
        case '1':
          await tools.createWallet(rl, wallet)
          break
        case '2':
          await tools.transferTRX(rl, wallet)
          break
        case '3':
          await tools.transferUSDT(rl, wallet)
          break
        case '4':
          await tools.validateAddress(rl, wallet)
          break
        case '5':
          tools.showFaucet(wallet)
          break
        case '0':
          console.log(chalk.cyan('\nbye!\n'))
          running = false
          break
        default:
          console.log(chalk.red('\nInvalid choice, please enter 0-5'))
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
