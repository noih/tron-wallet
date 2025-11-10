import * as dotenv from 'dotenv'

dotenv.config()

const config = {
  walletDir: './wallets',
  usdtContracts: {
    mainnet: process.env.MAINNET_USDT_CONTRACT || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    shasta: process.env.SHASTA_USDT_CONTRACT || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
    nile: process.env.NILE_USDT_CONTRACT || ''
  }
}

export default config
