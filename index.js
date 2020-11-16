/* eslint-disable no-async-promise-executor */

/*
  Basic workflow for splitting tokens:

  - Ensure fee can be paid, return fee source
  - If paper wallet has more than one token class, throw error.
  - app requests split dust from ABC chain
  - app waits until ABC indexer shows dust transaction
  - BCH and tokens are swept to ABC address, , including the new dust
  - BCH and tokens are swept to BCHN address
*/

'use strict'

// Public npm libraries
const Sweeper = require('bch-token-sweep/index')

// Constants
const ABC_FREE_MAINNET = 'https://abc.fullstack.cash/v3/'
const BCHN_FREE_MAINNET = 'https://bchn.fullstack.cash/v3/'

// Local libraries
// const TransactionLib = require('./lib/transactions')
// const Blockchain = require('./lib/blockchain')
const SplitLib = require('./lib/split')

// Constants
// const FULLSTACK_MAINNET_API_FREE = 'https://free-main.fullstack.cash/v3/'
// const DEFAULT_BCH_WRAPPER = new BCHJS({ restURL: FULLSTACK_MAINNET_API_FREE })
// const DONATION = 2000
const DONATION = 40000

class Splitter {
  constructor (wifFromPaperWallet, wifFromReceiver, BCHWrapper, config) {
    // This is the BCH Class, not an instance.
    this.BCHWrapper = BCHWrapper
    if (!BCHWrapper) {
      throw new Error('BCH-JS Class must be passed when instantiating.')
    }

    // Default to ABC.
    const bchjsAbc = new this.BCHWrapper({ restURL: ABC_FREE_MAINNET })

    // Instantiate bch-js
    this.bchjsAbc = bchjsAbc
    this.bchjsBchn = new this.BCHWrapper({ restURL: BCHN_FREE_MAINNET })

    if (!config || !config.abcToAddr) {
      throw new Error('You mus specify an ABC to-address.')
    }
    const abcToAddr = config.abcToAddr
    // console.log(`ABC send-to address: ${abcToAddr}`)

    // Instantiate and encapsulate the Sweeper library.
    this.abcSweeper = new Sweeper(
      wifFromPaperWallet,
      wifFromReceiver,
      this.bchjsAbc,
      0, // Zero donation from the ABC chain.
      abcToAddr // Specify the ABC address to send to.
    )
    this.bchnSweeper = new Sweeper(
      wifFromPaperWallet,
      wifFromReceiver,
      this.bchjsBchn,
      DONATION // Donation comes from the BCHN chain.
    )

    // Instantiate the biz-logic utility library.
    const configObj = {
      donation: DONATION,
      BCHWrapper
    }

    const DUST_SERVER_ABC = 'https://abc-dust.splitbch.com'
    const DUST_SERVER_BCHN = 'https://bchn-dust.splitbch.com'

    if (config && config.dustServerAbc) {
      configObj.dustServerAbc = config.dustServerAbc
    } else {
      configObj.dustServerAbc = DUST_SERVER_ABC
    }

    if (config && config.dustServerBchn) {
      configObj.dustServerBchn = config.dustServerBchn
    } else {
      configObj.dustServerBchn = DUST_SERVER_BCHN
    }

    this.splitLib = new SplitLib(configObj)
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

      // Recalculate the donation amount based on the balance of the paper wallet.
      const onePercent = Math.floor(this.bchnSweeper.paper.balance * 0.01)
      console.log(`onePercent: ${onePercent}`)
      if (onePercent > DONATION) {
        this.bchnSweeper.donation = onePercent
      }
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
      console.log(`fee source: ${feeSource}`)
      if (!feeSource) throw new Error('Not enough BCH to pay splitting fee')

      // app requests split dust from ABC chain
      const dustAbcTxid = await this.splitLib.getDustAbc(this.abcSweeper)
      console.log(`txid from ABC dust faucet: ${dustAbcTxid}`)

      // app requests split dust from BCHN chain
      const dustBchnTxid = await this.splitLib.getDustBchn(this.bchnSweeper)
      console.log(`txid from BCHN dust faucet: ${dustBchnTxid}`)

      // app waits until ABC indexer shows dust transaction
      let dustAbcArrived = false
      while (!dustAbcArrived) {
        const now = new Date()
        console.log(
          `Checking that ABC split dust was delivered... ${now.toLocaleString()}`
        )

        // Wait 2 seconds between retries.
        await this.splitLib.sleep(2000)

        dustAbcArrived = await this.splitLib.verifyDustAbc(
          this.abcSweeper,
          dustAbcTxid
        )
      }

      // app waits until ABC indexer shows dust transaction
      let dustBchnArrived = false
      while (!dustBchnArrived) {
        const now = new Date()
        console.log(
          `Checking that BCHN split dust was delivered... ${now.toLocaleString()}`
        )

        // Wait 2 seconds between retries.
        await this.splitLib.sleep(2000)

        dustBchnArrived = await this.splitLib.verifyDustBchn(
          this.bchnSweeper,
          dustBchnTxid
        )
      }

      // BCH and tokens are swept to BCHN address
      const hexBchn = await this.bchnSweeper.sweepTo(toBchnAddr)
      // const txidBchn = await this.bchnSweeper.blockchain.broadcast(hexBchn)

      // BCH and tokens are swept to ABC address, , including the new dust
      const hexAbc = await this.abcSweeper.sweepTo(toAbcAddr)
      // const txidAbc = await this.abcSweeper.blockchain.broadcast(hexAbc)

      return { hexAbc, hexBchn }
      // return { txidAbc, txidBchn }
    } catch (err) {
      console.error('Error in splitCoins()')
      throw err
    }
  }
}

module.exports = Splitter
