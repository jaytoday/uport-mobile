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
import reducer from 'uPortMobile/lib/reducers/scannerReducer.js'
import { enableCamera, disableCamera } from 'uPortMobile/lib/actions/scannerActions'

const cameraDisabled = {
  cameraEnabled: false
}

const cameraEnabled = {
  cameraEnabled: true
}

it('performs ENABLE_CAMERA', () => {
  expect(reducer(cameraDisabled, enableCamera())).toEqual(cameraEnabled)
  expect(reducer(cameraEnabled, enableCamera())).toEqual(cameraEnabled)
})

it('performs DISABLE_CAMERA', () => {
  expect(reducer(cameraDisabled, disableCamera())).toEqual(cameraDisabled)
  expect(reducer(cameraEnabled, disableCamera())).toEqual(cameraDisabled)
})

it('ignores unsupported action', () => {
  expect(reducer(undefined, {type: 'UNSUPPORTED'})).toEqual(cameraDisabled)
  expect(reducer(cameraDisabled, {type: 'UNSUPPORTED'})).toEqual(cameraDisabled)
  expect(reducer(cameraEnabled, {type: 'UNSUPPORTED'})).toEqual(cameraEnabled)
})
