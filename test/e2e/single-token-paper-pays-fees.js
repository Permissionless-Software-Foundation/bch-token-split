/*
  E2E test for sweeping a single token and paying for tx fees with the paper wallet.
  e.g. the paper wallet has both a token and BCH on it.

  Before running the test, this test will check that each wallet is set up correctly.
  If they are not set up correctly, the test will exit and indicate what is wrong
  with the set-up for the test.
*/

// These are the WIF (private keys) used to operate the test.
const receiverWif = 'KxtteuKQ2enad5jH2o5eGkSaTgas49kWmvADW6qqhLAURrxuUo7m'
const paperWif = 'L3nSksvTtHHBRP3HNMDhy6hDKpu88PQvrLGzLJn3FYX2diKqC1GD'

// Unit under test
const SplitterLib = require('../../index')

async function runTest () {
  try {
    // Instancing the library
    const splitterLib = new SplitterLib(paperWif, receiverWif)
    await splitterLib.getBlockchainData()

    await checkSetup(splitterLib)

    console.log(
      `UTXOsFromPaperWallet: ${JSON.stringify(
        splitterLib.abcSweeper.UTXOsFromPaperWallet,
        null,
        2
      )}`
    )

    const { hexAbc, hexBchn } = await splitterLib.splitCoins(
      splitterLib.abcSweeper.receiver.slpAddr,
      splitterLib.abcSweeper.receiver.slpAddr
    )
    console.log(`hex: ${hexBchn}`)

    const txid = await splitterLib.abcSweeper.blockchain.broadcast(hexAbc)

    console.log('Transaction ID', txid)
    console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`)
  } catch (error) {
    console.error('Error in test: ', error)
  }
}
runTest()

// Check to ensure the test is set up correctly.
async function checkSetup (splitterLib) {
  // console.log(
  //   `receiving wallet BCH UTXOs: ${JSON.stringify(
  //     splitterLib.UTXOsFromPaperWallet.bchUTXOs,
  //     null,
  //     2
  //   )}`
  // )
  // Ensure the Paper has a UTXO.
  if (splitterLib.abcSweeper.UTXOsFromPaperWallet.bchUTXOs.length === 0) {
    throw new Error(
      `Paper wallet does not have BCH. Send 0.00005 BCH to ${
        splitterLib.abcSweeper.paper.bchAddr
      }`
    )
  }

  // Ensure the Receiver has enough BCH to pay transaction fees.
  console.log(
    `Paper wallet balance: ${splitterLib.abcSweeper.BCHBalanceFromPaperWallet}`
  )
  if (splitterLib.abcSweeper.BCHBalanceFromPaperWallet < 5000) {
    throw new Error(
      'Paper wallet has less than 0.00005 BCH. Send that much to pay for transaction fees.'
    )
  }

  // console.log(
  //   `paper wallet SLP UTXOs: ${JSON.stringify(
  //     splitterLib.UTXOsFromPaperWallet.tokenUTXOs,
  //     null,
  //     2
  //   )}`
  // )
  if (splitterLib.abcSweeper.UTXOsFromPaperWallet.tokenUTXOs.length === 0) {
    throw new Error(
      `Paper wallet does not have any tokens! Send some SLP tokens to ${
        splitterLib.abcSweeper.paper.slpAddr
      }`
    )
  }
  console.log('Tokens found on paper wallet. Test is good to go!')
  console.log(' ')
}
