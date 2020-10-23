/*
  Unit tests for the split.js utility library.
*/

// External npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Local libraries
const SplitUtilLib = require('../../lib/split')
const mockDataLib = require('./mocks/split.mocks')
let mockData

let uut
let sandbox

describe('#split.js', () => {
  beforeEach(() => {
    mockData = Object.assign({}, mockDataLib)

    uut = new SplitUtilLib({})

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#determineFeeSource', () => {
    it('should return 0 if no source has enough funds', () => {
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

    it('should return 2 if receiver wallet can pay fee in ABC', () => {
      // Simulate a new wallet on the ABC chain that has no balance on the
      // BCHN chain.
      const bchnSweeper = Object.assign({}, mockData.mockSweeper)
      bchnSweeper.receiver.balance = 0

      // Simulate a wallet on ABC that has ABC-only BCH in the web wallet to
      // pay the fee.
      mockData.mockSweeper.paper.balance = 546
      mockData.mockSweeper.receiver.balance = 500000

      const result = uut.determineFeeSource(mockData.mockSweeper, bchnSweeper)
      // console.log('result: ', result)

      assert.equal(result, 2)
    })

    it('should return 3 if receiver wallet can pay fee in BCHN', () => {
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

      assert.equal(result, 3)
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

  describe('#getDust', () => {
    it('should get dust from faucet', async () => {
      sandbox.stub(uut.axios, 'request').resolves({ data: mockData.mockGetDust })

      const addr = mockData.mockSweeper.paper.bchAddr
      // console.log(`addr: ${addr}`)

      const result = await uut.getDust(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, true)
      assert.isString(result.txid)
    })

    it('should catch and throw an error', async () => {
      try {
        sandbox.stub(uut.axios, 'request').rejects(new Error('test error'))

        const addr = mockData.mockSweeper.paper.bchAddr
        await uut.getDust(addr)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })
})
