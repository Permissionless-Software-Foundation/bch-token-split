/*
  Mocks for the split.js utility library.
*/

const indexMocksLib = require('./index.mocks')
const paperMocks = Object.assign({}, indexMocksLib)
const receiverMocks = Object.assign({}, indexMocksLib)

const mockSweeper = {
  paper: paperMocks.mockPaperWallet,
  receiver: receiverMocks.mockReceiverWallet
}

const mockGetDust = {
  success: true,
  txid: '2effc98ad59b00dff24f45965ec58950d1e2103f345bd06bcd597793e487f853',
  message:
    'BCH dust sent via TXID: 2effc98ad59b00dff24f45965ec58950d1e2103f345bd06bcd597793e487f853'
}

module.exports = {
  mockSweeper,
  mockGetDust
}
