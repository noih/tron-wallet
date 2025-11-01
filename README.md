# TRON Wallet Tool

A simple command-line utility for managing TRON wallets with support for TRX and USDT transfers.

> This is a lightweight tool designed for basic wallet operations and testing purposes.

## Features

- Create and manage TRON wallets
- Support for multiple networks (Mainnet, Shasta, Nile)
- Transfer TRX and USDT
- Check wallet balances
- Verify USDT contract information
- Address validation
- Interactive CLI interface

```bash
# install dependencies
yarn install

# start
yarn start
```

## Configuration

Before first use, you must create a `.env` file from the example:

```bash
cp .env.example .env
```

Then edit `.env` to customize USDT contract addresses for different networks:

```env
# USDT Contract Addresses
USDT_CONTRACT_MAINNET=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
USDT_CONTRACT_SHASTA=TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs
USDT_CONTRACT_NILE=
```

## Wallet Storage

Wallets are stored as JSON files in the `./wallets` directory:

- `wallet-mainnet.json`
- `wallet-shasta.json`
- `wallet-nile.json`

When creating a new wallet, existing wallets are automatically backed up with `.bk`, `.bk2`, `.bk3`, etc. suffixes.

## Security

- Private keys are stored locally in wallet JSON files
- Keep your private key safe - it cannot be recovered if lost
- Do not share your wallet files with anyone
- Use testnet networks for development and testing
