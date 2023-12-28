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
import { View, Platform, ScrollView } from 'react-native'
import { Text, KeyboardAwareScrollView, Checkbox } from '../shared'
import { connectTheme, defaultTheme } from 'uPortMobile/lib/styles'
import { Button, Centered } from '../shared/Button'
import FeatherIcons from 'react-native-vector-icons/Feather'
import { dataBackup } from 'uPortMobile/lib/selectors/settings'
import { Navigation } from 'react-native-navigation'

export class DataBackupSuccess extends React.Component {
  render() {
    const { styles, colors } = this.context.theme ? this.context.theme : defaultTheme
    return (
      <ScrollView style={[styles.brandContainer, { flex: 1 }]}>
        <View style={[styles.container, styles.brandContainer]}>
          <View style={[styles.column, styles.infoBox]}>
            <Text title invert>
              Success
            </Text>
            <View style={{ paddingBottom: 30, alignItems: 'center' }}>
              <FeatherIcons size={100} name='check-circle' color={'#ffffff'} />
            </View>
            {this.props.dataBackup && (
              <Text p invert>
                You've successfully backed up your account information. If you need to recover your identity, your ID
                and all associated data will be restored. To turn backup off, please return to the menu option.
              </Text>
            )}
            {!this.props.dataBackup && (
              <Text p invert>
                You've turned off backup and deleted your data from our backup server. If you need to recovery your
                identity, no claims or app-specific accounts will be restored. To turn backup back on, please return to
                the menu option.
              </Text>
            )}
          </View>
          <Centered>
            <Button
              style={styles.invertedButton}
              textStyle={styles.invert}
              onPress={() => Navigation.popToRoot(this.props.componentId)}>
              {'Done'}
            </Button>
          </Centered>
        </View>
      </ScrollView>
    )
  }
}

DataBackupSuccess.contextTypes = {
  theme: PropTypes.object,
}

const mapStateToProps = state => {
  return {
    dataBackup: dataBackup(state),
  }
}

export const mapDispatchToProps = dispatch => {
  return {}
}
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(connectTheme(DataBackupSuccess))
