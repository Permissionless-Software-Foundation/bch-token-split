const assert = require('chai').assert

const BCHJS = require('@psf/bch-js')
// const bchjs = new BCHJS()

// Unit under test
const Splitter = require('../../index')
let uut

const receiverWif = 'L3nSksvTtHHBRP3HNMDhy6hDKpu88PQvrLGzLJn3FYX2diKqC1GD'
const paperWif = 'KxtteuKQ2enad5jH2o5eGkSaTgas49kWmvADW6qqhLAURrxuUo7m'

describe('#index.js', () => {
  beforeEach(async () => {
    uut = new Splitter(paperWif, receiverWif, BCHJS)
  })

  describe('#getBlockchainData', () => {
    it('should populate blockchain data', async () => {
      await uut.getBlockchainData()

      assert.isNumber(uut.abcSweeper.paper.balance)
      assert.isNumber(uut.bchnSweeper.paper.balance)
      assert.isNumber(uut.abcSweeper.receiver.balance)
      assert.isNumber(uut.bchnSweeper.receiver.balance)

      assert.property(uut.abcSweeper.paper, 'utxos')
      assert.property(uut.abcSweeper.receiver, 'utxos')
      assert.property(uut.bchnSweeper.paper, 'utxos')
      assert.property(uut.bchnSweeper.receiver, 'utxos')
    })
  })
})
