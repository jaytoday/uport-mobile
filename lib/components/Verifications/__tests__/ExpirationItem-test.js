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
/* globals it, expect */
import 'react-native'
import React from 'react'
import ExpirationItem from '../ExpirationItem'
import renderer from 'react-test-renderer'

describe('ExpirationItem', () => {
  it('renders ExpirationItem in seconds', () => {
    const date = 1583020800
    const tree = renderer.create(<ExpirationItem d={date} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
  it('renders ExpirationItem in milliseconds', () => {
    const date = 1583020800000
    const tree = renderer.create(<ExpirationItem d={date} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
