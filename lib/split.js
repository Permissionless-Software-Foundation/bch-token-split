/*
  This is a utility library that contains several small helper functions used
  by the index.js file to split coins.
*/

// Public npm libraries
const axios = require('axios')

// Constants
const DUST_SERVER = 'http://159.69.29.155:7654'
const SPLIT_FEE = 400000

class SplitLib {
  constructor (config) {
    this.bchjsAbc = config.bchjsAbc
    this.bchjsBchn = config.bchjsBchn

    this.axios = axios
  }

  // Fee determination:
  // 0 - No proper fee source available.
  // 1 - If paper wallet has at least 0.002 BCH (on each chain), use that to pay fee.
  // 2 - else if web wallet has 0.004 Bitcoin on the preferred chain (ABC), use that to pay fee
  // 3 - else if web wallet has 0.004 Bitcoin on the other chain (BCHN), use that to pay fee.
  determineFeeSource (abcSweeper, bchnSweeper) {
    let feeSource = 0

    if (
      abcSweeper.paper.balance >= SPLIT_FEE / 2 &&
      bchnSweeper.paper.balance >= SPLIT_FEE / 2
    ) {
      feeSource = 1
    } else if (abcSweeper.receiver.balance >= SPLIT_FEE) {
      feeSource = 2
    } else if (bchnSweeper.receiver.balance >= SPLIT_FEE) {
      feeSource = 3
    }

    return feeSource
  }

  // Request split dust from the dust faucet.
  async getDust (addr) {
    try {
      // Request options
      const opt = {
        method: 'get',
        baseURL: `${DUST_SERVER}/coins/${addr}`,
        timeout: 10000 // Exit after 10 seconds if server does not respond.
      }
      const tokenRes = await this.axios.request(opt)

      return tokenRes.data
    } catch (err) {
      console.error('Error in getDust()')
      throw err
    }
  }
}

module.exports = SplitLib
