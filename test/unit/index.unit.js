/*
  Unit tests for the main index.js file.
*/

// External npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

// Local libraries
const SplitLib = require('../../index')

let sandbox
let uut

describe('#index.js', () => {
  // Wallets used for testing.
  const receiverWIF = 'L22cDXNCqu2eWsGrZw7esnTyE91R7eZA1o7FND6pLGuEXrV8z4B8'
  const paperWIF = 'KyvkSiN6gWjQenpkKSQzDh1JphuBYhsanGN5ZCL6bTy81fJL8ank'

  // Restore the sandbox before each test.
  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new SplitLib(paperWIF, receiverWIF, BCHJS)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should instantiate the sweep library', () => {
      uut = new SplitLib(paperWIF, receiverWIF, BCHJS)

      assert.property(uut, 'abcSweeper')
      assert.property(uut, 'bchnSweeper')
    })

    it('should throw an error if paper wallet wif is not included', () => {
      try {
        uut = new SplitLib(undefined, undefined, BCHJS)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'WIF from paper wallet is required')
      }
    })

    it('should throw an error if receiver wallet wif is not included', () => {
      try {
        uut = new SplitLib(paperWIF, undefined, BCHJS)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'WIF from receiver is required')
      }
    })

    it('should throw an error if BCHJS class is not included', () => {
      try {
        uut = new SplitLib(paperWIF, receiverWIF)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'BCH-JS Class must be passed when instantiating.')
      }
    })

    it('should use a different dust server', () => {
      const config = {
        dustServer: 'http://localhost:1234'
      }
      const thisUut = new SplitLib(paperWIF, receiverWIF, BCHJS, config)

      assert.equal(thisUut.splitLib.dustServer, config.dustServer)
    })
  })

  describe('#getBlockchainData', () => {
    // Simply goes through the motions to make sure the flow is as expected.
    it('should populate blockchain data', async () => {
      sandbox.stub(uut.abcSweeper, 'populateObjectFromNetwork').resolves({})
      sandbox.stub(uut.bchnSweeper, 'populateObjectFromNetwork').resolves({})

      await uut.getBlockchainData()

      assert.property(uut.abcSweeper.receiver, 'balance')
    })

    it('should handle errors', async () => {
      try {
        sandbox
          .stub(uut.abcSweeper, 'populateObjectFromNetwork')
          .rejects(new Error('test error'))

        await uut.getBlockchainData()

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#splitCoins', () => {
    it('should return two hex transactions', async () => {
      // Mock dependent functions to force the 'happy path'.
      sandbox.stub(uut.splitLib, 'determineFeeSource').returns(1)
      sandbox.stub(uut.splitLib, 'getDust').resolves('test txid')
      sandbox.stub(uut.splitLib, 'sleep').resolves()
      sandbox.stub(uut.splitLib, 'verifyDust').resolves(true)
      sandbox.stub(uut.abcSweeper, 'sweepTo').resolves('hex1 string')
      sandbox.stub(uut.bchnSweeper, 'sweepTo').resolves('hex2 string')

      const addr = uut.abcSweeper.receiver.slpAddr

      const { hexAbc, hexBchn } = await uut.splitCoins(addr, addr)

      assert.isString(hexAbc)
      assert.isString(hexBchn)
    })

    it('should throw an error if fee can not be paid', async () => {
      try {
        sandbox.stub(uut.splitLib, 'determineFeeSource').returns(0)

        const addr = uut.abcSweeper.receiver.slpAddr

        await uut.splitCoins(addr, addr)

        assert.fail('unexpected result')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'Not enough BCH to pay splitting fee')
      }
    })
  })
})
