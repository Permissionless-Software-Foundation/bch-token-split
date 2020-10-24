/* eslint-disable no-async-promise-executor */

/*
- Ensure fee can be paid, return fee source

- If paper wallet has more than one token class, throw error.

- app requests split dust from ABC chain

- app waits until ABC indexer shows dust transaction

- BCH and tokens are swept to ABC address, , including the new dust

- BCH and tokens are swept to BCHN address
*/

'use strict'

// Public npm libraries
const BCHJS = require('@psf/bch-js')
const Sweeper = require('bch-token-sweep/index')

// Constants
const ABC_FREE_MAINNET = 'https://free-main.fullstack.cash/v3/'
const BCHN_FREE_MAINNET = 'https://bchn-free-main.fullstack.cash/v3/'

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

    // Instantiate the biz-logic utility library.
    this.splitLib = new SplitLib()
  }

  // Get blockchain information for the paper wallet from each network.
  // Since constructors can not make async calls, this is the first call that
  // should be made after instantiating this library. It finishes initializing
  // the instance.
  async getBlockchainData () {
    try {
      await this.abcSweeper.populateObjectFromNetwork()
      await this.bchnSweeper.populateObjectFromNetwork()

      this.abcSweeper.paper.balance = this.abcSweeper.BCHBalanceFromPaperWallet
      this.abcSweeper.paper.utxos = this.abcSweeper.UTXOsFromPaperWallet
      // console.log('ABC Paper wallet: ', this.abcSweeper.paper)
      // console.log(`ABC Paper wallet utxos: ${JSON.stringify(this.abcSweeper.paper.utxos, null, 2)}`)

      this.bchnSweeper.paper.balance = this.bchnSweeper.BCHBalanceFromPaperWallet
      this.bchnSweeper.paper.utxos = this.bchnSweeper.UTXOsFromPaperWallet
      // console.log('BCHN Paper wallet: ', this.abcSweeper.paper)

      this.abcSweeper.receiver.balance = this.abcSweeper.BCHBalanceFromReceiver
      this.abcSweeper.receiver.utxos = this.abcSweeper.UTXOsFromReceiver
      // console.log('ABC Receiver wallet: ', this.abcSweeper.receiver)
      // console.log(`ABC Receiver wallet utxos: ${JSON.stringify(this.abcSweeper.receiver.utxos, null, 2)}`)

      this.bchnSweeper.receiver.balance = this.bchnSweeper.BCHBalanceFromReceiver
      this.bchnSweeper.receiver.utxos = this.bchnSweeper.UTXOsFromReceiver
      // console.log('BCHN Receiver wallet: ', this.bchnSweeper.receiver)
      // console.log(`BCHN Receiver wallet utxos: ${JSON.stringify(this.bchnSweeper.receiver.utxos, null, 2)}`)
    } catch (e) {
      console.error('Error in getBlockchainData()')
      // throw new Error(e.message)
      throw e
    }
  }

  // This is the macro function that orchestrates the splitting of BCH and SLP
  // tokens. This function assumes that getBlockchainData() has already been
  // executed and the instance of this class has already been populated with
  // blockchain data.
  async splitCoins (toAbcAddr, toBchnAddr) {
    try {
      // Ensure fee can be paid, return fee source
      const feeSource = this.splitLib.determineFeeSource(
        this.abcSweeper,
        this.bchnSweeper
      )
      if (!feeSource) throw new Error('Not enough BCH to pay splitting fee')

      // app requests split dust from ABC chain
      const dustTxid = await this.splitLib.getDust(this.abcSweeper)
      console.log(`txid from dust faucet: ${dustTxid}`)

      // app waits until ABC indexer shows dust transaction
      let dustArrived = false
      while (!dustArrived) {
        const now = new Date()

        console.log(`Checking that split dust was delivered... ${now.toLocaleString()}`)

        // Wait 2 seconds between retries.
        await this.splitLib.sleep(5000)

        dustArrived = await this.splitLib.verifyDust(this.abcSweeper, dustTxid)
      }

      // BCH and tokens are swept to ABC address, , including the new dust
      const hexAbc = await this.abcSweeper.sweepTo(toAbcAddr)
      // const txidAbc = await this.abcSweeper.blockchain.broadcast(hexAbc)

      // BCH and tokens are swept to BCHN address
      const hexBchn = await this.bchnSweeper.sweepTo(toBchnAddr)
      // const txidBchn = await this.bchnSweeper.blockchain.broadcast(hexBchn)

      return { hexAbc, hexBchn }
      // return { txidAbc, txidBchn }
    } catch (err) {
      console.error('Error in splitCoins()')
      throw err
    }
  }
}

module.exports = Splitter
