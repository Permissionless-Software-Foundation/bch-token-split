/*
  This is a utility library that contains several small helper functions used
  by the index.js file to split coins.
*/

// Public npm libraries
const axios = require('axios')

// Constants
// const DUST_SERVER = 'http://159.69.29.155:7654'
// const DUST_SERVER = 'https://dust-faucet.fullstack.cash'
const DUST_SERVER = 'https://dust-faucet.splitbch.com'

class SplitLib {
  constructor (config) {
    this.axios = axios

    // Donation sent to PSF during split.
    if (config && config.donation) {
      this.donation = config.donation
    } else {
      this.donation = 2000
    }
  }

  // Fee determination:
  // 0 - No proper fee source available.
  // 1 - If paper wallet has at least 0.002 BCH (on each chain), use that to pay fee.
  // 2 - else if web wallet has 0.004 Bitcoin on the preferred chain (ABC), use that to pay fee
  // 3 - else if web wallet has 0.004 Bitcoin on the other chain (BCHN), use that to pay fee.
  determineFeeSource (abcSweeper, bchnSweeper) {
    console.log(`donation: ${this.donation} satoshis`)
    let feeSource = 0

    const halfDonation = Math.floor(this.donation / 2)

    if (
      abcSweeper.paper.balance >= halfDonation &&
      bchnSweeper.paper.balance >= halfDonation
    ) {
      feeSource = 1
    } else if (abcSweeper.receiver.balance >= this.donation) {
      feeSource = 2
    } else if (bchnSweeper.receiver.balance >= this.donation) {
      feeSource = 3
    }

    return feeSource
  }

  // Request split dust from the dust faucet.
  // Returns the TXID of the dust transaction, or throws an error.
  async getDust (abcSweeper) {
    try {
      const addr = abcSweeper.paper.bchAddr

      // Request options
      const opt = {
        method: 'get',
        baseURL: `${DUST_SERVER}/coins/${addr}`,
        timeout: 10000 // Exit after 10 seconds if server does not respond.
      }
      const tokenRes = await this.axios.request(opt)

      return tokenRes.data.txid
    } catch (err) {
      console.error('Error in getDust()')
      throw err
    }
  }

  // Refreshes the ABC-chain UTXOs for the paper wallet, and tests if the
  // split ABC dust has been detected. Returns true or false.
  // This method is assumed to be called after getDust(), and takes the
  // txid as input.
  async verifyDust (abcSweeper, txid) {
    try {
      let txidFound = false

      // Refresh the UTXOs
      await abcSweeper.populateObjectFromNetwork()
      abcSweeper.paper.balance = abcSweeper.BCHBalanceFromPaperWallet
      abcSweeper.paper.utxos = abcSweeper.UTXOsFromPaperWallet

      // console.log(
      //   `verifyDust utxos: ${JSON.stringify(abcSweeper.paper.utxos, null, 2)}`
      // )

      // Loop through each UTXO.
      for (let i = 0; i < abcSweeper.paper.utxos.bchUTXOs.length; i++) {
        const thisUtxo = abcSweeper.paper.utxos.bchUTXOs[i]

        // Exit if a UTXO with a matching TXID is found.
        if (thisUtxo.tx_hash === txid) {
          txidFound = true
          break
        }
      }

      return txidFound
    } catch (err) {
      console.error('Error in verifyDust()')
      throw err
    }
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = SplitLib
