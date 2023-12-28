// Copyright (C) 2018 ConsenSys AG
//
// This file is part of uPort Mobile App.
//
// uPort Mobile App is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// uPort Mobile App is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with uPort Mobile App.  If not, see <http://www.gnu.org/licenses/>.
//
import { call, select, fork, spawn } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
jest.mock('react-native-navigation', () => {
  return {
    Navigation: {}
  }
})

import { handle, check4Bytes, handleLegacy, authorize, signTransaction, handleTransactionMined, estimateGas, performGasCalculations } from '../transactionRequest.js'
import { refreshExternalUport } from '../../persona'
import { waitForUX } from 'uPortMobile/lib/utilities/performance'
import { updateActivity, updateInteractionStats, storeConnection, refreshSettings } from 'uPortMobile/lib/actions/uportActions'
import { track } from 'uPortMobile/lib/actions/metricActions.js'
import { externalProfile } from 'uPortMobile/lib/selectors/requests'
import { isMetaTxEnabled } from 'uPortMobile/lib/selectors/featureFlags'
import { currentAddress, selectedIdentity, accountsForNetwork, accountForClientIdAndNetwork } from 'uPortMobile/lib/selectors/identities'
import { networkSettingsForAddress, web3ForAddress, metaIdentityManagerSignerForAddress, metaTxMIMSignerForAddress } from 'uPortMobile/lib/selectors/chains'
import { connected, waitUntilConnected } from 'uPortMobile/lib/sagas/networkState'
import { maybeRefuel, relayTransaction } from 'uPortMobile/lib/sagas/sensui'
import { analyzeAddress, resolveMetaNonce, fetchGasPrice, resolveNonce } from 'uPortMobile/lib/sagas/blockchain'
import BN from 'bn.js'
import { fetchEthSpotPrice } from '../../blockchain.js'

const mnidAddress = '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS'
const hexAddress = '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6a'
const mnidContract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
const hexContract = '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b'
const myDid = 'did:ethr:0x9df0e9759b17f34e9123adbe6d3f25d54b72ad60'
const clientId = 'did:ethr:0x9df0e9759b17f34e9123adbe6d3f25d54b72ad61'
const network = '0x2a'
const valueHex = '0x3635c9adc5dea00000'
const value = '1000000000000000000000'
const jwt = 'JWT'
const id = '1e089e14b7251c583c0ab03ddde2f58fbb0a08ad5a479386ee339c2ec497349e'

describe('#handle()', () => {
  describe('account selection', () => {
    describe('with from value', () => {
      describe('using MNIDs', () => {
        const payload = {
          to: mnidContract,
          from: mnidAddress,
          value: valueHex,
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          network,
          id,
          target: mnidAddress,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
        it('sets up correct request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [spawn(refreshSettings), undefined],
              [select(currentAddress), mnidAddress],
              [select(externalProfile, clientId), undefined],
              [select(selectedIdentity, mnidAddress), {address: mnidAddress}],
              [select(accountForClientIdAndNetwork, network, clientId), null],
              [select(accountsForNetwork, network), [{address: mnidAddress}]],
              [fork(analyzeAddress, {address: mnidContract}), undefined],
              [fork(refreshExternalUport, {clientId: clientId}), undefined],
              [spawn(performGasCalculations, request)]
            ])
            .put(updateInteractionStats(mnidAddress, mnidContract, 'request'))
            .fork(refreshExternalUport, { clientId: clientId })
            .spawn(performGasCalculations, request)
            .returns(request)
            .run()
        })
      })
      describe('using hex', () => {
        const payload = {
          to: hexContract,
          from: hexAddress,
          value: valueHex,
          net: network,
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          network,
          id,
          target: mnidAddress,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
        it('sets up correct request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [select(currentAddress), mnidAddress],
              [select(selectedIdentity, mnidAddress), {address: mnidAddress}],
              [select(externalProfile, clientId), undefined],
              [select(accountForClientIdAndNetwork, network, clientId), null],
              [select(accountsForNetwork, network), [{address: mnidAddress}]],
              [fork(analyzeAddress, {address: mnidContract}), undefined],
              [fork(refreshExternalUport, {clientId: clientId}), undefined],
              [spawn(performGasCalculations, request)]
            ])
            .put(updateInteractionStats(mnidAddress, hexContract, 'request'))
            .fork(refreshExternalUport, { clientId: clientId })
            .spawn(performGasCalculations, request)
            .returns(request)
            .run()
        })
      })

      describe('mismatch of networks', () => {
        const payload = {
          to: mnidContract,
          from: mnidAddress,
          value: valueHex,
          net: '0x1',
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          id,
          network: '0x1',
          target: mnidAddress,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas',
          error: `Network requested (0x1) is not the same as encoded in to address ${mnidContract}`
        }
        it('returns an error request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [select(currentAddress), mnidAddress],
              [select(selectedIdentity, mnidAddress), {address: mnidAddress}],
              [select(externalProfile, clientId), undefined],
              [select(accountForClientIdAndNetwork, '0x1', clientId), null],
              [select(accountsForNetwork, '0x1'), [{address: mnidAddress}]],
              [fork(refreshExternalUport, {clientId: clientId}), undefined]
            ])
            .not.spawn(performGasCalculations, request)
            .returns(request)
            .run()
        })
      })

      describe('from in payload is not available', () => {
        const payload = {
          to: mnidContract,
          from: mnidAddress,
          value: valueHex,
          net: network,
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          network,
          id,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas',
          error: `The provided from account ${mnidAddress} does not exist in your wallet`
        }
        it('returns an error request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [select(currentAddress), myDid],
              [select(selectedIdentity, mnidAddress), null],
              [select(externalProfile, clientId), undefined],
              [select(accountForClientIdAndNetwork, network, clientId), null],
              [select(accountsForNetwork, network), []],
              [fork(refreshExternalUport, {clientId: clientId}), undefined]
            ])
            .not.spawn(performGasCalculations, request)
            .returns(request)
            .run()
        })
      })
    })

    describe('without from account', () => {
      describe('select default account if it matches network', () => {
        const payload = {
          to: mnidContract,
          value: valueHex,
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          network,
          id,
          target: mnidAddress,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
        it('sets up correct request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [select(currentAddress), mnidAddress],
              [select(externalProfile, clientId), undefined],
              // [select(selectedIdentity, mnidAddress), {address: mnidAddress}],
              [select(accountForClientIdAndNetwork, network, clientId), null],
              [select(accountsForNetwork, network), [{address: mnidAddress}]],
              [fork(analyzeAddress, {address: mnidContract}), undefined],
              [fork(refreshExternalUport, {clientId: clientId}), undefined],
              [spawn(performGasCalculations, request)]
            ])
            .put(updateInteractionStats(mnidAddress, mnidContract, 'request'))
            .fork(refreshExternalUport, { clientId: clientId })
            .spawn(performGasCalculations, request)
            .returns(request)
            .run()
        })
      })

      describe('find valid non segregated account and use it', () => {
        const payload = {
          to: mnidContract,
          value: valueHex,
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          network,
          id,
          target: mnidAddress,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
        it('sets up correct request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [select(currentAddress), myDid],
              [select(externalProfile, clientId), undefined],
              [select(accountForClientIdAndNetwork, network, clientId), null],
              [select(accountsForNetwork, network), [{address: mnidAddress}]],
              [fork(analyzeAddress, {address: mnidContract}), undefined],
              [fork(refreshExternalUport, {clientId: clientId}), undefined],
              [spawn(performGasCalculations, request)]
            ])
            .spawn(performGasCalculations, request)
            .put(updateInteractionStats(mnidAddress, mnidContract, 'request'))
            .fork(refreshExternalUport, {clientId: clientId})
            .returns(request)
            .run()
        })
      })

      describe('find valid segregated account and use it', () => {
        const payload = {
          to: mnidContract,
          value: valueHex,
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          network,
          id,
          target: mnidAddress,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
        it('sets up correct request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [select(currentAddress), myDid],
              [select(externalProfile, clientId), undefined],
              [select(accountForClientIdAndNetwork, network, clientId), {address: mnidAddress}],
              [fork(analyzeAddress, {address: mnidContract}), undefined],
              [fork(refreshExternalUport, {clientId: clientId}), undefined],
              [spawn(performGasCalculations, request)]
            ])
            .spawn(performGasCalculations, request)
            .put(updateInteractionStats(mnidAddress, mnidContract, 'request'))
            .fork(refreshExternalUport, {clientId: clientId})
            .returns(request)
            .run()
        })
      })

      describe('returns error message if no valid account is available', () => {
        const payload = {
          to: mnidContract,
          value: valueHex,
          iss: clientId,
          callback: 'https://chasqui.uport.me/bla/blas'
        }
        const request = {
          to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
          value,
          valueEth: 1000,
          network,
          id,
          error: `You do not have an account supporting network (${network})`,
          client_id: clientId,
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
        it('sets up correct request', () => {
          return expectSaga(handle, payload, jwt, id)
            .provide([
              [select(currentAddress), myDid],
              [select(externalProfile, clientId), undefined],
              [select(accountForClientIdAndNetwork, network, clientId), null],
              [select(accountsForNetwork, network), []]
            ])
            .returns(request)
            .run()
        })
      })
    })
  })

  describe('gas limit', () => {
    const payload = {
      to: mnidContract,
      from: mnidAddress,
      value: valueHex,
      gas: '0x76c0',
      gasPrice: '0x9184e72a000',
      iss: clientId,
      callback: 'https://chasqui.uport.me/bla/blas'
    }
    const request = {
      to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
      value,
      valueEth: 1000,
      network,
      id,
      target: mnidAddress,
      client_id: clientId,
      gas: 30400,
      gasPrice: 10000000000000,
      callback_url: 'https://chasqui.uport.me/bla/blas'
    }
    it('sets up correct request', () => {
      return expectSaga(handle, payload, jwt, id)
        .provide([
          [select(currentAddress), mnidAddress],
          [select(externalProfile, clientId), undefined],
          [select(selectedIdentity, mnidAddress), {address: mnidAddress}],
          [select(accountForClientIdAndNetwork, network, clientId), null],
          [select(accountsForNetwork, network), [{address: mnidAddress}]],
          [fork(analyzeAddress, {address: mnidContract}), undefined],
          [fork(refreshExternalUport, {clientId: clientId}), undefined],
          [spawn(performGasCalculations, request)]
        ])
        .spawn(performGasCalculations, request)
        .put(updateInteractionStats(mnidAddress, mnidContract, 'request'))
        .fork(refreshExternalUport, {clientId: clientId})
        .returns(request)
        .run()
    })
  })

  describe('function calls', () => {
    describe('handles data attribute', () => {
      const data = '0x010203040506070809000a'
      const fnSig = '01020304'
      const payload = {
        to: mnidContract,
        from: mnidAddress,
        data,
        iss: clientId,
        callback: 'https://chasqui.uport.me/bla/blas'
      }
      const request = {
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        data,
        fnSig,
        network,
        id,
        target: mnidAddress,
        client_id: clientId,
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      it('sets up correct request', () => {
        return expectSaga(handle, payload, jwt, id)
          .provide([
            [select(currentAddress), mnidAddress],
            [select(externalProfile, clientId), undefined],
            [select(selectedIdentity, mnidAddress), {address: mnidAddress}],
            [select(accountForClientIdAndNetwork, network, clientId), null],
            [select(accountsForNetwork, network), [{address: mnidAddress}]],
            [fork(analyzeAddress, {address: mnidContract}), undefined],
            [fork(refreshExternalUport, {clientId: clientId}), undefined],
            [spawn(check4Bytes, request), undefined],
            [spawn(performGasCalculations, request)]
          ])
          .spawn(performGasCalculations, request)
          .put(updateInteractionStats(mnidAddress, mnidContract, 'request'))
          .fork(refreshExternalUport, {clientId: clientId})
          .spawn(check4Bytes, request)
          .returns(request)
          .run()
      })
    })

    describe('handles fn attribute', () => {
      const data = '6cb927d800000000000000000000000000000000000000000000000000000000deadbeef0000000000000000000000000000000000000000000000000000000000000005'
      const fnSig = '6cb927d8'
      const fn = 'transfer(address 0xdeadbeef, uint 5)'
      const abi = {
        name: 'transfer',
        types: [ 'address', 'uint' ],
        args: [ '0xdeadbeef', '5' ] 
      }
      const payload = {
        to: mnidContract,
        from: mnidAddress,
        fn,
        iss: clientId,
        callback: 'https://chasqui.uport.me/bla/blas'
      }
      const request = {
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        data,
        fn,
        fnSig,
        network,
        id,
        abi,
        target: mnidAddress,
        client_id: clientId,
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      it('sets up correct request', () => {
        return expectSaga(handle, payload, jwt, id)
          .provide([
            [select(currentAddress), mnidAddress],
            [select(externalProfile, clientId), undefined],
            [select(selectedIdentity, mnidAddress), {address: mnidAddress}],
            [select(accountForClientIdAndNetwork, network, clientId), null],
            [select(accountsForNetwork, network), [{address: mnidAddress}]],
            [fork(refreshExternalUport, {clientId: clientId}), undefined],
            [fork(analyzeAddress, {address: mnidContract}), undefined],
            [spawn(check4Bytes, request), undefined],
            [spawn(performGasCalculations, request)]
          ])
          .spawn(performGasCalculations, request)
          .put(updateInteractionStats(mnidAddress, mnidContract, 'request'))
          .fork(refreshExternalUport, {clientId: clientId})
          .not.spawn(check4Bytes, request)
          .returns(request)
          .run()
      })
    })
  })
})

describe('#handleLegacy()', () => {
  describe('simple transaction', () => {
    it('uses default address', () => {
      const address = '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS'
      const contract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
      const url = {
        pathname: contract,
        query: {
          value: valueHex,
          client_id: '0x012',
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
      }
      const request = {
        id: 123,
        type: 'sign',
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        value,
        valueEth: 1000,
        network: '0x2a',
        target: address,
        client_id: '0x012',
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      return expectSaga(handleLegacy, {id: 123, type: 'sign'}, url)
        .provide([
          [call(waitForUX), undefined],
          [select(currentAddress), address],
          [select(externalProfile, '0x012'), undefined],
          [select(accountForClientIdAndNetwork, '0x2a', '0x012'), null],
          [select(accountsForNetwork, '0x2a'), [{address}]],
          [fork(analyzeAddress, {address: mnidContract}), undefined],
          [fork(refreshExternalUport, {clientId: '0x012'}), undefined],
          [spawn(performGasCalculations, request)]
        ])
        .put(updateInteractionStats(address, contract, 'request'))
        // .put(updateInteractionStats(address, '0x012', 'request'))
        .fork(refreshExternalUport, {clientId: '0x012'})
        .spawn(performGasCalculations, request)
        .returns(request)
        .run()
    })
  })

  describe('simple transaction', () => {
    it('uses passed gasPrice', () => {
      const address = '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS'
      const contract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
      const url = {
        pathname: contract,
        query: {
          value: valueHex,
          client_id: '0x012',
          callback_url: 'https://chasqui.uport.me/bla/blas',
          gasPrice: '0x9184e72a000'
        }
      }
      const request = {
        id: 123,
        type: 'sign',
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        value,
        valueEth: 1000,
        network: '0x2a',
        target: address,
        client_id: '0x012',
        gasPrice: 10000000000000,
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      return expectSaga(handleLegacy, {id: 123, type: 'sign'}, url)
        .provide([
          [call(waitForUX), undefined],
          [select(currentAddress), address],
          [select(externalProfile, '0x012'), undefined],
          [select(accountForClientIdAndNetwork, '0x2a', '0x012'), null],
          [select(accountsForNetwork, '0x2a'), [{address}]],
          [fork(analyzeAddress, {address: mnidContract}), undefined],
          [fork(refreshExternalUport, {clientId: '0x012'}), undefined],
          [spawn(performGasCalculations, request)]
        ])
        .put(updateInteractionStats(address, contract, 'request'))
        .fork(refreshExternalUport, {clientId: '0x012'})
        .returns(request)
        .run()
    })
  })

  describe('handle request with specific network', () => {
    it('uses correct account', () => {
      const address = '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS'
      const other = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL' // other identity on same network
      const contract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
      const url = {
        pathname: contract,
        query: {
          value: valueHex,
          client_id: '0x012',
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
      }
      const request = {
        id: 123,
        type: 'sign',
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        value,
        valueEth: 1000,
        target: address,
        network: '0x2a',
        client_id: '0x012',
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      return expectSaga(handleLegacy, {id: 123, type: 'sign'}, url)
        .provide([
          [call(waitForUX), undefined],
          [select(currentAddress), address],
          [select(externalProfile, '0x012'), undefined],
          [select(accountForClientIdAndNetwork, '0x2a', '0x012'), null],
          [select(accountsForNetwork, '0x2a'), [{address}, {address: other}]],
          [fork(analyzeAddress, {address: mnidContract}), undefined],
          [fork(refreshExternalUport, {clientId: '0x012'}), undefined],
          [spawn(performGasCalculations, request)]
        ])
        .put(updateInteractionStats(address, contract, 'request'))
        // .put(updateInteractionStats(address, '0x012', 'request'))
        .fork(refreshExternalUport, { clientId: '0x012' })
        .spawn(performGasCalculations, request)
        .returns(request)
        .run()
    })

    it('uses correct segregated account', () => {
      const address = '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS'
      const other = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL' // other identity on same network
      const contract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
      const url = {
        pathname: contract,
        query: {
          value: valueHex,
          client_id: '0x012',
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
      }
      const request = {
        id: 123,
        type: 'sign',
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        value,
        valueEth: 1000,
        target: address,
        network: '0x2a',
        client_id: '0x012',
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      return expectSaga(handleLegacy, {id: 123, type: 'sign'}, url)
        .provide([
          [call(waitForUX), undefined],
          [select(currentAddress), address],
          [select(externalProfile, '0x012'), undefined],
          [select(accountForClientIdAndNetwork, '0x2a', '0x012'), {address}],
          [fork(analyzeAddress, {address: contract}), undefined],
          [fork(refreshExternalUport, {clientId: '0x012'}), undefined],
          [spawn(performGasCalculations, request)]
        ])
        .put(updateInteractionStats(address, contract, 'request'))
        // .put(updateInteractionStats(address, '0x012', 'request'))
        .fork(refreshExternalUport, { clientId: '0x012' })
        .spawn(performGasCalculations, request)
        .returns(request)
        .run()
    })

    it('uses specified target if it matches the network', () => {
      const address = '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS'
      const other = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL' // other identity on same network
      const contract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
      const url = {
        pathname: contract,
        query: {
          value: valueHex,
          client_id: '0x012',
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
      }
      const request = {
        id: 123,
        type: 'sign',
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        value,
        valueEth: 1000,
        target: address,
        network: '0x2a',
        client_id: '0x012',
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      return expectSaga(handleLegacy, {id: 123, type: 'sign', target: address}, url)
        .provide([
          [call(waitForUX), undefined],
          [select(externalProfile, '0x012'), undefined],
          [select(currentAddress), other],
          [select(selectedIdentity, address), {address}],
          [select(accountForClientIdAndNetwork, '0x2a', '0x012'), null],
          [select(accountsForNetwork, '0x2a'), [{address: other}, {address}]],
          [fork(analyzeAddress, {address: mnidContract}), undefined],
          [fork(refreshExternalUport, {clientId: '0x012'}), undefined],
          [spawn(performGasCalculations, request)]
        ])
        .put(updateInteractionStats(address, contract, 'request'))
        .fork(refreshExternalUport, {clientId: '0x012'})
        .spawn(performGasCalculations, request)
        .returns(request)
        .run()
    })

    it('uses current address if it matches the network', () => {
      const address = '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS'
      const contract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
      const url = {
        pathname: contract,
        query: {
          value: valueHex,
          client_id: '0x012',
          gas: '0xabcd',
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
      }
      const request = {
        id: 123,
        type: 'sign',
        to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
        value,
        valueEth: 1000,
        target: address,
        network: '0x2a',
        client_id: '0x012',
        gas: 43981,
        callback_url: 'https://chasqui.uport.me/bla/blas'
      }
      return expectSaga(handleLegacy, {id: 123, type: 'sign'}, url)
        .provide([
          [call(waitForUX), undefined],
          [select(currentAddress), address],
          [select(externalProfile, '0x012'), undefined],
          [select(accountForClientIdAndNetwork, '0x2a', '0x012'), null],
          [select(accountsForNetwork, '0x2a'), [{address: '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'}, {address}]],
          [fork(analyzeAddress, {address: contract}), undefined],
          [fork(refreshExternalUport, {clientId: '0x012'}), undefined],
          [spawn(performGasCalculations, request)]
        ])
        .put(updateInteractionStats(address, contract, 'request'))
        .fork(refreshExternalUport, {clientId: '0x012'})
        .spawn(performGasCalculations, request)
        .returns(request)
        .run()
    })

    it('throws an error if we have no identity supporting it', () => {
      const address = '2oTwLi6eMXvZhMv7AjKjppiyVk8iKVJ8zKY'
      const contract = '35A7s7LGbDxdsFpYYggjFjcbBHom7CGdgaL'
      const url = {
        pathname: contract,
        query: {
          value: valueHex,
          client_id: '0x012',
          callback_url: 'https://chasqui.uport.me/bla/blas'
        }
      }
      return expectSaga(handleLegacy, {id: 123, type: 'sign'}, url)
        .provide([
          [call(waitForUX), undefined],
          [select(currentAddress), address],
          [select(accountForClientIdAndNetwork, '0x2a', '0x012'), null],
          [select(accountsForNetwork, '0x2a'), []]
        ])
        .put(track('txRequest Error', {
          request: {id: 123, type: 'sign', network: '0x2a', to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b', target: undefined},
          error: 'You do not have an account supporting this network'
        }))
        .put(updateActivity(123, 'You do not have an account supporting this network'))
        .returns(undefined)
        .run()
    })
  })
})

describe('#signTransaction()', () => {
  it('sends a regular transaction', () => {
    const settings = {
      hexaddress: '0x12345',
      address: '0x12345',
      nonce: 3
    }
    const signedTx = '0x97345876345876'
    const txHash = '0x6as787b876987e98c'
    const web3 = {
      gasPrice: () => new BN(1),
      sendRawTransaction: tx => {
        expect(tx).toEqual(signedTx)
        return txHash
      },
      estimateGas: () => new BN(3000000)
    }
    const signer = {
      signTransaction: (tx, cb) => { cb(null, signedTx) }
    }
    const signerType = 'MetaIdentityManager'
    const request = {
      id: 123,
      type: 'sign',
      to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
      value: '0xf960d7fe33dc000',
      target: '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS',
      network: '0x2a',
      client_id: '0x012',
      callback_url: 'https://chasqui.uport.me/bla/blas'
    }
    return expectSaga(signTransaction, request, signerType)
      .provide([
        [call(connected), true],
        [call(waitUntilConnected), undefined],
        [select(web3ForAddress, request.target), web3],
        [select(networkSettingsForAddress, request.target), settings],
        [select(isMetaTxEnabled), false],
        [call(resolveNonce, {address: request.target}), 3],
        [select(metaIdentityManagerSignerForAddress, request.target), signer],
        [call(maybeRefuel, signedTx, settings), undefined],
        [matchers.spawn.fn(handleTransactionMined), undefined]
      ])
      .returns({ tx: txHash })
      .run()
  })

  it('sends a meta transaction', () => {
    const settings = {
      hexaddress: '0x12345',
      address: '0x12345',
      nonce: 3
    }
    const signedTx = '0x97345876345876'
    const txHash = '0x6as787b876987e98c'
    const web3 = {
      gasPrice: () => new BN(1),
      sendRawTransaction: tx => {
        expect(tx).toEqual(signedTx)
        return txHash
      },
      estimateGas: () => new BN(3000000)
    }
    const signer = {
      signTransaction: (tx, cb) => { cb(null, signedTx) }
    }
    const signerType = 'MetaIdentityManager'
    const request = {
      id: 123,
      type: 'sign',
      to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
      value: '0xf960d7fe33dc000',
      target: '35A7s7LGbDxdsFpYYggjFjcbBHom79zfciS',
      network: '0x2a',
      client_id: '0x012',
      callback_url: 'https://chasqui.uport.me/bla/blas'
    }
    return expectSaga(signTransaction, request, signerType)
      .provide([
        [call(connected), true],
        [call(waitUntilConnected), undefined],
        [select(web3ForAddress, request.target), web3],
        [select(networkSettingsForAddress, request.target), settings],
        [select(isMetaTxEnabled), true],
        [call(resolveNonce, {address: request.target}), 3],
        [call(resolveMetaNonce, settings), 6],
        [select(metaTxMIMSignerForAddress, request.target), signer],
        [call(relayTransaction, signedTx.slice(2), settings, 6), txHash],
        [matchers.spawn.fn(handleTransactionMined), undefined]
      ])
      .returns({ tx: txHash })
      .run()
  })
})

describe('performGasCalculations()', () => {
  describe('request with value', () => {
    const request = {
      to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
      value,
      valueEth: 1000,
      network,
      id,
      target: mnidAddress,
      client_id: clientId,
      callback_url: 'https://chasqui.uport.me/bla/blas'
    }
    const txCostProps = {
      gas: 3000000,
      gasPrice: 100000000,
      gasCostWei: new BN('110d9316ec000', 16).toNumber(),
      gasCost: 0.0003,
      gasCostUSD: 0.07107,
      ethSpotPrice: 236.9,
      valueUSD: 236900,
      txCost: '1000000300000000000000'
    }
    it('sets up correct request', () => {
      return expectSaga(performGasCalculations, request)
        .provide([
          [call(estimateGas, request), new BN('3000000', 10)],
          [call(fetchGasPrice, {address: mnidAddress}), new BN('100000000', 10)],
          [call(fetchEthSpotPrice), 236.9]
        ])
        .put(updateActivity(id, txCostProps))
        .run()
    })
  })

  describe('request without value', () => {
    const request = {
      to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
      network,
      id,
      target: mnidAddress,
      client_id: clientId,
      callback_url: 'https://chasqui.uport.me/bla/blas'
    }
    const txCostProps = {
      gas: 3000000,
      gasPrice: 100000000,
      gasCostWei: new BN('110d9316ec000', 16).toNumber(),
      gasCost: 0.0003,
      gasCostUSD: 0.07107,
      ethSpotPrice: 236.9,
      txCost: '300000000000000'
    }
    it('sets up correct request', () => {
      return expectSaga(performGasCalculations, request)
        .provide([
          [call(estimateGas, request), new BN('3000000', 10)],
          [call(fetchGasPrice, {address: mnidAddress}), new BN('100000000', 10)],
          [call(fetchEthSpotPrice), 236.9]
        ])
        .put(updateActivity(id, txCostProps))
        .run()
    })
  })

  describe('request with gas specified', () => {
    const request = {
      to: '0x9df0e9759b17f34e9123adbe6d3f25d54b72ad6b',
      network,
      id,
      gas: 3000000,
      target: mnidAddress,
      client_id: clientId,
      callback_url: 'https://chasqui.uport.me/bla/blas'
    }
    const txCostProps = {
      gas: 3000000,
      gasPrice: 100000000,
      gasCostWei: new BN('110d9316ec000', 16).toNumber(),
      gasCost: 0.0003,
      gasCostUSD: 0.07107,
      ethSpotPrice: 236.9,
      txCost: '300000000000000'
    }
    it('sets up correct request', () => {
      return expectSaga(performGasCalculations, request)
        .provide([
          [call(fetchGasPrice, {address: mnidAddress}), new BN('100000000', 10)],
          [call(fetchEthSpotPrice), 236.9]
        ])
        .put(updateActivity(id, txCostProps))
        .run()
    })
  })
})
