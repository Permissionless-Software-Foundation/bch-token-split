/*
  Unit tests for the split.js utility library.
*/

// External npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

// Local libraries
const SplitUtilLib = require('../../lib/split')
const mockDataLib = require('./mocks/split.mocks')
let mockData

let uut
let sandbox

describe('#split.js', () => {
  beforeEach(() => {
    mockData = cloneDeep(mockDataLib)

    uut = new SplitUtilLib({})

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should use default dust server if no config passed', () => {
      const DUST_SERVER_ABC = 'https://abc-dust.splitbch.com'
      const DUST_SERVER_BCHN = 'https://bchn-dust.splitbch.com'

      const thisUut = new SplitUtilLib({})

      assert.equal(thisUut.dustServerAbc, DUST_SERVER_ABC)
      assert.equal(thisUut.dustServerBchn, DUST_SERVER_BCHN)
    })

    it('should use a different dust server', () => {
      const config = {
        dustServerAbc: 'http://localhost:1234'
      }
      const thisUut = new SplitUtilLib(config)

      assert.equal(thisUut.dustServerAbc, config.dustServerAbc)
    })
  })

  describe('#determineFeeSource', () => {
    it('should return 0 if no source has enough funds', () => {
      mockData.mockSweeper.paper.balance = 546
      mockData.mockSweeper.receiver.balance = 546

      const result = uut.determineFeeSource(
        mockData.mockSweeper,
        mockData.mockSweeper
      )
      // console.log('result: ', result)

      assert.equal(result, 0)
    })

    it('should return 1 if paper wallet can pay fee', () => {
      mockData.mockSweeper.paper.balance = 500000

      const result = uut.determineFeeSource(
        mockData.mockSweeper,
        mockData.mockSweeper
      )
      // console.log('result: ', result)

      assert.equal(result, 1)
    })

    it('should return 3 if receiver wallet can pay fee in ABC', () => {
      // Simulate a new wallet on the ABC chain that has no balance on the
      // BCHN chain.
      const bchnSweeper = cloneDeep(mockData.mockSweeper)
      bchnSweeper.receiver.balance = 0

      // Simulate a wallet on ABC that has ABC-only BCH in the web wallet to
      // pay the fee.
      mockData.mockSweeper.paper.balance = 546
      mockData.mockSweeper.receiver.balance = 500000

      const result = uut.determineFeeSource(mockData.mockSweeper, bchnSweeper)
      // console.log('result: ', result)

      assert.equal(result, 3)
    })

    it('should return 2 if receiver wallet can pay fee in BCHN', () => {
      // Simulate a new wallet on the BCHN chain that has no balance on the
      // ABC chain.
      const abcSweeper = {
        paper: {
          wif: 'KxtteuKQ2enad5jH2o5eGkSaTgas49kWmvADW6qqhLAURrxuUo7m',
          ecPair: {},
          bchAddr: 'bitcoincash:qqcun9hyykrlcfwpkgakryk55mdnuczvt5qpys6z7v',
          slpAddr: 'simpleledger:qqcun9hyykrlcfwpkgakryk55mdnuczvt5v60t0zqj',
          balance: 0
        },
        receiver: {
          wif: 'L3nSksvTtHHBRP3HNMDhy6hDKpu88PQvrLGzLJn3FYX2diKqC1GD',
          ecPair: {},
          bchAddr: 'bitcoincash:qzqruj9asxmql7rlzwhw7qlq8mmwc256pgqxcah5pc',
          slpAddr: 'simpleledger:qzqruj9asxmql7rlzwhw7qlq8mmwc256pgvanxz5lx',
          balance: 0
        }
      }

      const bchnSweeper = {
        paper: {
          wif: 'KxtteuKQ2enad5jH2o5eGkSaTgas49kWmvADW6qqhLAURrxuUo7m',
          ecPair: {},
          bchAddr: 'bitcoincash:qqcun9hyykrlcfwpkgakryk55mdnuczvt5qpys6z7v',
          slpAddr: 'simpleledger:qqcun9hyykrlcfwpkgakryk55mdnuczvt5v60t0zqj',
          balance: 546
        },
        receiver: {
          wif: 'L3nSksvTtHHBRP3HNMDhy6hDKpu88PQvrLGzLJn3FYX2diKqC1GD',
          ecPair: {},
          bchAddr: 'bitcoincash:qzqruj9asxmql7rlzwhw7qlq8mmwc256pgqxcah5pc',
          slpAddr: 'simpleledger:qzqruj9asxmql7rlzwhw7qlq8mmwc256pgvanxz5lx',
          balance: 500000
        }
      }

      const result = uut.determineFeeSource(abcSweeper, bchnSweeper)
      // console.log('result: ', result)

      assert.equal(result, 2)
    })

    it('should return 0 for improper input', () => {
      try {
        mockData.mockSweeper.paper.balance = 'this should generate an error'
        mockData.mockSweeper.receiver.balance = 'this should generate an error'

        const result = uut.determineFeeSource(
          mockData.mockSweeper,
          mockData.mockSweeper
        )
        // console.log('result: ', result)

        assert.equal(result, 0)
      } catch (err) {
        console.log(err)
      }
    })
  })

  describe('#getDustAbc', () => {
    it('should get dust from faucet', async () => {
      sandbox
        .stub(uut.axios, 'request')
        .resolves({ data: mockData.mockGetDust })

      const result = await uut.getDustAbc(mockData.mockSweeper)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })

    it('should catch and throw an error', async () => {
      try {
        // Mock live network calls.
        sandbox.stub(uut.axios, 'request').rejects(new Error('test error'))

        await uut.getDustAbc(mockData.mockSweeper)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getDustBchn', () => {
    it('should get dust from faucet', async () => {
      sandbox
        .stub(uut.axios, 'request')
        .resolves({ data: mockData.mockGetDust })

      const result = await uut.getDustBchn(mockData.mockSweeper)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })

    it('should catch and throw an error', async () => {
      try {
        // Mock live network calls.
        sandbox.stub(uut.axios, 'request').rejects(new Error('test error'))

        await uut.getDustBchn(mockData.mockSweeper)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#verifyDustAbc', () => {
    it('should return true if TXID matches', async () => {
      // Add the mock dust UTXO to the mocked Sweeper instance.
      // mockData.mockSweeper.paper.utxos = cloneDeep(
      //   mockDataLib.mockSweeper.paper.utxos
      // )
      // mockData.mockSweeper.paper.utxos.bchUtxos.push(mockData.mockDustUtxo)
      mockData.mockSweeper.UTXOsFromPaperWallet = {
        bchUTXOs: [mockData.mockDustUtxo]
      }

      // Get the txid from the mock returned value of getDust()
      const txid = mockData.mockGetDust.txid

      const result = await uut.verifyDustAbc(mockData.mockSweeper, txid)
      assert.equal(result, true)
    })

    it('should return false if TXID is not found', async () => {
      // Get the txid from the mock returned value of getDust()
      const txid = mockData.mockGetDust.txid
      mockData.mockSweeper.UTXOsFromPaperWallet = {
        bchUTXOs: [mockData.mockSweeper.paper.utxos.bchUtxos]
      }

      const result = await uut.verifyDustAbc(mockData.mockSweeper, txid)
      assert.equal(result, false)
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error.
        sandbox
          .stub(mockData.mockSweeper, 'populateObjectFromNetwork')
          .rejects(new Error('test error'))

        const txid = mockData.mockGetDust.txid

        await uut.verifyDustAbc(mockData.mockSweeper, txid)
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#verifyDustBchn', () => {
    it('should return true if TXID matches', async () => {
      // Add the mock dust UTXO to the mocked Sweeper instance.
      // mockData.mockSweeper.paper.utxos = cloneDeep(
      //   mockDataLib.mockSweeper.paper.utxos
      // )
      // mockData.mockSweeper.paper.utxos.bchUtxos.push(mockData.mockDustUtxo)
      mockData.mockSweeper.UTXOsFromPaperWallet = {
        bchUTXOs: [mockData.mockDustUtxo]
      }

      // Get the txid from the mock returned value of getDust()
      const txid = mockData.mockGetDust.txid

      const result = await uut.verifyDustBchn(mockData.mockSweeper, txid)
      assert.equal(result, true)
    })

    it('should return false if TXID is not found', async () => {
      // Get the txid from the mock returned value of getDust()
      const txid = mockData.mockGetDust.txid
      mockData.mockSweeper.UTXOsFromPaperWallet = {
        bchUTXOs: [mockData.mockSweeper.paper.utxos.bchUtxos]
      }

      const result = await uut.verifyDustBchn(mockData.mockSweeper, txid)
      assert.equal(result, false)
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error.
        sandbox
          .stub(mockData.mockSweeper, 'populateObjectFromNetwork')
          .rejects(new Error('test error'))

        const txid = mockData.mockGetDust.txid

        await uut.verifyDustBchn(mockData.mockSweeper, txid)
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#sleep', () => {
    it('should sleep for 10 mS', async () => {
      await uut.sleep(10)
    })
  })
})
