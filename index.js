/* eslint-disable no-async-promise-executor */

/*
- Ensure fee can be paid, return fee source

- If paper wallet has more than one token class, throw error.

- app requests dust from ABC chain

- app waits until ABC indexer shows dust transaction

- BCH and tokens are swept to BCHN address, including the new dust

- BCH and tokens are swept to ABC address
*/

'use strict'

// Public npm libraries
const BCHJS = require('@psf/bch-js')
const Sweeper = require('bch-token-sweep/index')
const axios = require('axios')

// Constants
const ABC_FREE_MAINNET = 'https://free-main.fullstack.cash/v3/'
const BCHN_FREE_MAINNET = 'https://bchn-free-main.fullstack.cash/v3/'
// const DUST_SERVER = 'http://159.69.29.155:7654'

// Local libraries
// const TransactionLib = require('./lib/transactions')
// const Blockchain = require('./lib/blockchain')
const SplitLib = require('./lib/split')

// Constants
// const FULLSTACK_MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
// const DEFAULT_BCH_WRAPPER = new BCHJS({ restURL: FULLSTACK_MAINNET_API_FREE })

class Splitter {
  constructor (wifFromPaperWallet, wifFromReceiver, BCHWrapper) {
    // Default to ABC.
    const bchjsAbc = new BCHJS({ restURL: ABC_FREE_MAINNET })

    // super(wifFromPaperWallet, wifFromReceiver, bchjsAbc)

    // Instantiate bch-js
    this.bchjsAbc = bchjsAbc
    this.bchjsBchn = new BCHJS({ restURL: BCHN_FREE_MAINNET })

    // Instantiate and encapsulate the Sweeper library.
    this.abcSweeper = new Sweeper(
      wifFromPaperWallet,
      wifFromReceiver,
      this.bchjsAbc
    )
    this.bchnSweeper = new Sweeper(
      wifFromPaperWallet,
      wifFromReceiver,
      this.bchjsBchn
    )

    this.axios = axios

    const config = {
      bchjsAbc: this.bchjsAbc,
      bchjsBchn: this.bchjsBchn
    }
    this.splitLib = new SplitLib(config)
  }

  // Get blockchain information for the paper wallet from each network.
  // async getBlockchainData () {
  //   try {
  //     await this.abcSweeper.populateObjectFromNetwork()
  //     await this.bchnSweeper.populateObjectFromNetwork()
  //
  //     this.abcSweeper.paper.balance = this.abcSweeper.BCHBalanceFromPaperWallet
  //     this.abcSweeper.paper.utxos = this.abcSweeper.UTXOsFromPaperWallet
  //     // console.log('ABC Paper wallet: ', this.abcSweeper.paper)
  //
  //     this.bchnSweeper.paper.balance = this.bchnSweeper.BCHBalanceFromPaperWallet
  //     this.bchnSweeper.paper.utxos = this.bchnSweeper.UTXOsFromPaperWallet
  //     // console.log('BCHN Paper wallet: ', this.abcSweeper.paper)
  //
  //     this.abcSweeper.receiver.balance = this.abcSweeper.BCHBalanceFromReceiver
  //     this.abcSweeper.receiver.utxos = this.abcSweeper.UTXOsFromReceiver
  //     // console.log('ABC Receiver wallet: ', this.abcSweeper.receiver)
  //
  //     this.bchnSweeper.receiver.balance = this.bchnSweeper.BCHBalanceFromReceiver
  //     this.bchnSweeper.receiver.utxos = this.bchnSweeper.UTXOsFromReceiver
  //     // console.log('BCHN Receiver wallet: ', this.bchnSweeper.receiver)
  //   } catch (e) {
  //     console.error('Error in getBlockchainData(): ', e)
  //     // throw new Error(e.message)
  //     throw e
  //   }
  // }

  // Fee determination:
  // 0 - No proper fee source available.
  // 1 - If paper wallet has at least 0.002 BCH (on each chain), use that to pay fee.
  // 2 - else if web wallet has 0.004 Bitcoin on the preferred chain (ABC), use that to pay fee
  // 3 - else if web wallet has 0.004 Bitcoin on the other chain (BCHN), use that to pay fee.
  // determineFeeSource () {
  //   try {
  //     let feeSource = 0
  //
  //     if (
  //       this.abcSweeper.paper.balance >= 0.002 &&
  //       this.bchnSweeper.paper.balance >= 0.002
  //     ) {
  //       feeSource = 1
  //     } else if (this.abcSweeper.receiver.balance >= 0.004) {
  //       feeSource = 2
  //     } else if (this.bchnSweeper.receiver.balance >= 0.004) {
  //       feeSource = 3
  //     }
  //
  //     return feeSource
  //   } catch (err) {
  //     console.error('Error in determineFee()')
  //     throw err
  //   }
  // }

  // Request split dust from the dust faucet.
  // async getDust (addr) {
  //   try {
  //     // Request options
  //     const opt = {
  //       method: 'get',
  //       baseURL: `${DUST_SERVER}/coins/${addr}`,
  //       timeout: 10000 // Exit after 10 seconds if server does not respond.
  //     }
  //     const tokenRes = await this.axios.request(opt)
  //
  //     return tokenRes.data
  //   } catch (err) {
  //     console.error('Error in getDust()')
  //     throw err
  //   }
  // }
}

module.exports = Splitter
