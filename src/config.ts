import * as dotenv from 'dotenv'

dotenv.config()

const config = {
  network: {
    mainnet: process.env.MAINNET_USDT_CONTRACT,
    shasta: process.env.SHASTA_USDT_CONTRACT,
    nile: process.env.NILE_USDT_CONTRACT
  }
}

export default config
