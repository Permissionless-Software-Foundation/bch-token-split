/*
  Mocking data for the index.js unit tests.
*/

const paperTokenUtxo = {
  height: 658428,
  tx_hash: '34f7a753de1e0fce4f5b0c91e59546a3930e9e628a4080efc7a8fa9dc190ef6d',
  tx_pos: 1,
  value: 546,
  satoshis: 546,
  txid: '34f7a753de1e0fce4f5b0c91e59546a3930e9e628a4080efc7a8fa9dc190ef6d',
  vout: 1,
  utxoType: 'token',
  transactionType: 'send',
  tokenId: '4945d652ce40e8ecfc7bf00e98128720fe51232afffe258f924c8afb0f41ec81',
  tokenTicker: 'FULLSTACK',
  tokenName: 'FullStack.cash Demo Token',
  tokenDocumentUrl: 'https://FullStack.cash',
  tokenDocumentHash: '',
  decimals: 2,
  tokenType: 1,
  tokenQty: 1,
  isValid: true
}

const paperBchUtxo = {
  height: 658428,
  tx_hash: '4b45332017fb7076b979636f9e4661b275b8291ce3581858b3806b42f822a534',
  tx_pos: 0,
  value: 11095,
  satoshis: 11095,
  txid: '4b45332017fb7076b979636f9e4661b275b8291ce3581858b3806b42f822a534',
  vout: 0,
  isValid: false
}

const mockPaperWallet = {
  wif: 'KxtteuKQ2enad5jH2o5eGkSaTgas49kWmvADW6qqhLAURrxuUo7m',
  ecPair: {},
  bchAddr: 'bitcoincash:qqcun9hyykrlcfwpkgakryk55mdnuczvt5qpys6z7v',
  slpAddr: 'simpleledger:qqcun9hyykrlcfwpkgakryk55mdnuczvt5v60t0zqj',
  balance: 11641,
  utxos: {
    tokenUtxos: [paperTokenUtxo],
    bchUtxos: [paperBchUtxo]
  }
}

const receiverBchUtxo = {
  height: 658429,
  tx_hash: '584f2fd3c0876dc4e8f913acc8fbd161f8ea6cf0afe1776ca6aca2de5b0c5cef',
  tx_pos: 0,
  value: 11099,
  satoshis: 11099,
  txid: '584f2fd3c0876dc4e8f913acc8fbd161f8ea6cf0afe1776ca6aca2de5b0c5cef',
  vout: 0,
  isValid: false
}

const mockReceiverWallet = {
  wif: 'L3nSksvTtHHBRP3HNMDhy6hDKpu88PQvrLGzLJn3FYX2diKqC1GD',
  ecPair: {},
  bchAddr: 'bitcoincash:qzqruj9asxmql7rlzwhw7qlq8mmwc256pgqxcah5pc',
  slpAddr: 'simpleledger:qzqruj9asxmql7rlzwhw7qlq8mmwc256pgvanxz5lx',
  balance: 11645,
  utxos: {
    bchUtxos: [receiverBchUtxo]
  }
}

module.exports = {
  paperBchUtxo,
  paperTokenUtxo,
  mockPaperWallet,
  receiverBchUtxo,
  mockReceiverWallet
}
