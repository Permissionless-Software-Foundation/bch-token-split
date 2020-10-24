/*
  Mocks for the split.js utility library.
*/

const cloneDeep = require('lodash.clonedeep')

const indexMocksLib = require('./index.mocks')
const paperMocks = cloneDeep(indexMocksLib)
const receiverMocks = cloneDeep(indexMocksLib)

const mockSweeper = {
  paper: paperMocks.mockPaperWallet,
  receiver: receiverMocks.mockReceiverWallet,
  populateObjectFromNetwork: () => undefined // A function that returns undefined.
}

const mockGetDust = {
  success: true,
  txid: '2effc98ad59b00dff24f45965ec58950d1e2103f345bd06bcd597793e487f853',
  message:
    'BCH dust sent via TXID: 2effc98ad59b00dff24f45965ec58950d1e2103f345bd06bcd597793e487f853'
}

const mockDustUtxo = {
  height: 658429,
  tx_hash: '2effc98ad59b00dff24f45965ec58950d1e2103f345bd06bcd597793e487f853',
  tx_pos: 0,
  value: 546,
  satoshis: 546,
  txid: '2effc98ad59b00dff24f45965ec58950d1e2103f345bd06bcd597793e487f853',
  vout: 0,
  isValid: false
}

module.exports = {
  mockSweeper,
  mockGetDust,
  mockDustUtxo
}
