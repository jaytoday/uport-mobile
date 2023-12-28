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
import { call, select, put, spawn } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import {
  createIdentityKeyPair,
  canSignFor,
  hasWorkingSeed,
  addressFor,
  encryptionPublicKey,
  DEFAULT_LEVEL,
} from 'uPortMobile/lib/sagas/keychain'
import { createAttestationToken } from 'uPortMobile/lib/sagas/jwt'
import { MigrationStep } from 'uPortMobile/lib/constants/MigrationActionTypes'
import { saveMessage } from 'uPortMobile/lib/actions/processStatusActions'
import { resetHub } from 'uPortMobile/lib/actions/hubActions'
import { subAccounts, currentAddress, ownClaimsMap, hasMainnetAccounts } from 'uPortMobile/lib/selectors/identities'
import { hasAttestations } from 'uPortMobile/lib/selectors/attestations'
import {
  updateIdentity,
  storeIdentity,
  storeConnection,
  storeExternalUport,
} from 'uPortMobile/lib/actions/uportActions'
import { hdRootAddress } from 'uPortMobile/lib/selectors/hdWallet'
import { resetHDWallet } from 'uPortMobile/lib/actions/HDWalletActions'
import { track } from 'uPortMobile/lib/actions/metricActions'
import { handleURL } from 'uPortMobile/lib/actions/requestActions'

import { Alert } from 'react-native'
import { dataBackup } from 'uPortMobile/lib/selectors/settings';
import { setDataBackup } from 'uPortMobile/lib/actions/settingsActions';
import { handleStartSwitchingSettingsChange } from '../hubSaga';

const step = MigrationStep.MigrateLegacy

function alertPromise(): any {
  return new Promise((resolve, reject) => {
    Alert.alert(
      'New Identity',
      // tslint:disable-next-line:max-line-length
      'Your current identity is a legacy testnet identity and is no longer supported. A new identity will now be created. If you have credentials you will be able to view them by switching identities in your user profile.',
      [
        {
          text: 'Okay',
          onPress: () => resolve('confirmed'),
        },
      ],
      { cancelable: false },
    )
  })
}

export function* alertBeforeMigration(): any {
  try {
    yield call(delay, 500)
    yield call(alertPromise)
    return yield call(migrate)
  } catch (error) {
    yield put(track('Legacy migration cancelled'))
  }
}

export function* migrate(): any {
  const oldRoot = yield select(currentAddress)
  const accounts = yield select(subAccounts, oldRoot)
  const own = (yield select(ownClaimsMap)) || {}
 
  const backedup = yield select(dataBackup)
  if (backedup) {
    yield call(handleStartSwitchingSettingsChange, { isOn: false })
  }
  for (const account of accounts) {
    const available = yield call(canSignFor, account.address)
    if (!available) {
      yield put(
        updateIdentity(account.address, {
          disabled: true,
          error: `Legacy Identity has been Disabled. Keys are no longer available.`,
        }),
      )
    }
  }

  const createOwnershipLink = (yield select(hasAttestations)) || (yield select(hasMainnetAccounts))

  let newRoot
  if (yield call(hasWorkingSeed)) {
    const account = yield call(addressFor, 0, 0)
    const encPublicKey = yield call(encryptionPublicKey, { idIndex: 0, actIndex: 0 })
    newRoot = `did:ethr:${account.address}`
    yield put(
      storeIdentity({
        address: newRoot,
        deviceAddress: account.address,
        hexaddress: account.address,
        signerType: 'KeyPair',
        recoveryType: 'seed',
        hdindex: 0,
        network: 'mainnet',
        securityLevel: DEFAULT_LEVEL,
        publicKey: account.publicKey,
        encPublicKey,
        own,
      }),
    )
  } else {
    const hdroot = yield select(hdRootAddress)
    if (hdroot) {
      yield put(resetHDWallet())
    }
    const newId = yield call(createIdentityKeyPair)
    newRoot = newId.address
    yield put(updateIdentity(newRoot, { own }))
  }

  if (createOwnershipLink) {
    yield put(storeExternalUport(oldRoot, own))
    yield put(storeConnection(newRoot, 'knows', oldRoot))
  }

  if (yield call(canSignFor, oldRoot)) {
    if (createOwnershipLink) {
      const link = yield call(createAttestationToken, oldRoot, newRoot, { owns: oldRoot })
      yield put(handleURL(`me.uport:req/${link}`, { popup: false }))
    }
  } else {
    yield put(
      updateIdentity(oldRoot, {
        disabled: true,
        error: `Legacy Test Net Identity has been Disabled`,
      }),
    )
  }
  yield put(saveMessage(step, 'New mainnet identity is created'))
  yield call(handleStartSwitchingSettingsChange, { isOn: true })
  return true
}

export default alertBeforeMigration
