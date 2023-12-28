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
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { View } from 'react-native'
import { Text, KeyboardAwareScrollView, Checkbox } from '../shared'
import { defaultTheme } from 'uPortMobile/lib/styles'
import { OnboardingButton, SkipButton } from '../shared/Button'
import { hdRootAddress } from 'uPortMobile/lib/selectors/hdWallet'
import { pendingMigration } from 'uPortMobile/lib/selectors/migrations'
import { Navigation } from 'react-native-navigation'
import SCREENS from 'uPortMobile/lib/screens/Screens'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { Theme } from '@kancha'

export class SeedRecoveryInstructions extends React.Component {
  render() {
    const { styles, colors } = defaultTheme
    return (
      <View style={styles.container}>
        <KeyboardAwareScrollView overScrollMode='always'>
          <Text title>Recover Identity</Text>
          <View style={{ paddingBottom: 30, alignItems: 'center' }}>
            <MaterialCommunityIcons name='backup-restore' size={100} color={Theme.colors.primary.brand} />
          </View>
          {this.props.migrating ? (
            <Text p>
              It looks like you may have upgraded your device and the keychain was not restored. This could also be the
              result of a change in the system security settings for your device.
            </Text>
          ) : null}
          <Text p>
            To recover your account you will need to enter your 12-word Recovery Seed Phrase in the order you recieved
            them.
          </Text>
        </KeyboardAwareScrollView>
        <OnboardingButton
          onPress={() =>
            Navigation.push(this.props.componentId, {
              component: {
                name: SCREENS.RECOVERY.RestoreSeedPhrase,
                options: {
                  topBar: {
                    backButton: {
                      title: 'Back',
                      color: Theme.colors.primary.brand,
                      visible: true,
                    },
                  },
                },
              },
            })
          }>
          {'Continue'}
        </OnboardingButton>
        <SkipButton title='Cancel' onPress={() => Navigation.pop(this.props.componentId)} />
      </View>
    )
  }
}

SeedRecoveryInstructions.contextTypes = {
  theme: PropTypes.object,
}

const mapStateToProps = state => {
  return {
    existingIdentity: hdRootAddress(state),
    migrating: pendingMigration(state, 'RecoverSeed'),
  }
}

export const mapDispatchToProps = dispatch => {
  return {}
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SeedRecoveryInstructions)
