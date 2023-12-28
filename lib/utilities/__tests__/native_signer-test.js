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
jest.mock('react-native-uport-signer', () => {
  let MockNativeModule = require('../../utilities/mock_native_module.js')
  const address = '0x7f2d6bb19b6a52698725f4a292e985c51cefc315'
  const privateKey = '0x3686e245890c7f997766b73a21d8e59f6385e1208831af3862574790cbc3d158'
  const publicKey = '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479'

   return MockNativeModule(address, privateKey, publicKey, '0x7f2d6bb19b6a52698725f4a292e985c51cefc319')
})

import sinon from 'sinon'

const address = '0x7f2d6bb19b6a52698725f4a292e985c51cefc315'
const root = '0x7f2d6bb19b6a52698725f4a292e985c51cefc319'
const badAddress = '0x7f2d6bb19b6a52698725f4a292e985c51cefc316'

const personalSignMessage = 'Hello World!'
const personalSignSig = {
  v: 27,
  r: '0x8785747ef765e9ac9646bcd2a7cecece08b3c922b53b82103cf43810785409bc',
  s: '0x071f2c9a1b13eaa6e7566ff639b86e094cfff111dbbb80dc1124500c9ccde38a',
}

import NativeSigner from '../native_signer'
import { RNUportSigner, RNUportHDSigner } from 'react-native-uport-signer'

describe('NativeSigner', () => {
  describe('non-hd signer', () => {
    const signer = new NativeSigner(address)
    it('should have the correct address', () => {
      expect(signer.getAddress()).toEqual(address)
    })

    it('should sign transaction', () => new Promise((resolve, reject) => {
      signer.signRawTx('f680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901c8080', (error, tx) => {
        if (error) return reject(error)
        resolve(tx)
      })
    }).then(tx => expect(tx).toEqual('f87680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901ca0809e3b5ef25f4a3b039139e2fb70f70b636eba89c77a3b01e0c71c1a36d84126a038524dfcd3e412cb6bc37f4594bbad104b6764bb14c64e42c699730106d1885a')))

    it('should use NativeSignerModule.signTx()', () => new Promise((resolve, reject) => {
      sinon.spy(RNUportSigner, 'signTx')
      signer.signRawTx('f680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901c8080', (error, tx) => {
        if (error) return reject(error)
        resolve(tx)
      })
    }).then(tx => expect(RNUportSigner.signTx.calledOnce).toBeTruthy()))

    it('should handle unsupported address', () => new Promise((resolve, reject) => {
      const badsigner = new NativeSigner(badAddress)
      badsigner.signRawTx('f680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901c8080', (error, tx) => {
        if (error) return reject(error)
        resolve(tx)
      })})
      .catch(e => expect(e.message).toEqual('Unsupported address'))
    )

    it('should personal sign a message', () => new Promise((resolve, reject) => {
      signer.personalSign(personalSignMessage, (error, sig) => {
        if (error) reject(error)
        resolve(sig)
      })
    }).then(sig => expect(sig).toEqual(personalSignSig)))
  })

  describe('hd signer', () => {
    const signer = new NativeSigner(address, `m/7696500'/0'/0'/0'`, root)
    it('should have the correct address', () => {
      expect(signer.getAddress()).toEqual(address)
    })

    it('should sign transaction', () => new Promise((resolve, reject) => {
      signer.signRawTx('f680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901c8080', (error, tx) => {
        if (error) return reject(error)
        resolve(tx)
      })
    }).then(tx => expect(tx).toEqual('f87680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901ca0809e3b5ef25f4a3b039139e2fb70f70b636eba89c77a3b01e0c71c1a36d84126a038524dfcd3e412cb6bc37f4594bbad104b6764bb14c64e42c699730106d1885a')))

    it('should use NativeHDSignerModule.signTx()', () => new Promise((resolve, reject) => {
      sinon.spy(RNUportHDSigner, 'signTx')
      signer.signRawTx('f680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901c8080', (error, tx) => {
        if (error) return reject(error)
        resolve(tx)
      })
    }).then(tx => expect(RNUportHDSigner.signTx.calledOnce).toBeTruthy())
    .then(() => expect(RNUportHDSigner.signTx.getCall(0).args[0]).toEqual(root))
    .then(() => expect(RNUportHDSigner.signTx.getCall(0).args[1]).toEqual(`m/7696500'/0'/0'/0'`)))

    it('should handle unsupported address', () => new Promise((resolve, reject) => {
      const badsigner = new NativeSigner(badAddress, `m/7696500'/0'/0'/0'`)
      badsigner.signRawTx('f680850ba43b7400832fefd8949e2068cce22de4e1e80f15cb71ef435a20a3b37c880de0b6b3a7640000890abcdef012345678901c8080', (error, tx) => {
        if (error) return reject(error)
        resolve(tx)
      })})
      .catch(e => expect(e.message).toEqual('Unsupported address'))
    )

    it('should personal sign a message', () => new Promise((resolve, reject) => {
      signer.personalSign(personalSignMessage, (error, sig) => {
        if (error) reject(error)
        resolve(sig)
      })
    }).then(sig => expect(sig).toEqual(personalSignSig)))
  })
})

