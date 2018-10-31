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
import { connect } from 'react-redux'
import { Text, View, Vibration, Platform, TouchableOpacity, Dimensions } from 'react-native'
import { windowWidth } from 'uPortMobile/lib/styles/globalStyles'
import { RNCamera } from 'react-native-camera'
import Permissions from 'react-native-permissions'
import CameraAuthDenied from './CameraAuthDenied'

// Selectors
import { hasRequest } from 'uPortMobile/lib/selectors/requests'
import { errorMessage } from 'uPortMobile/lib/selectors/processStatus'
import { cameraEnabled } from 'uPortMobile/lib/selectors/scanner'

// Actions
import { handleURL } from 'uPortMobile/lib/actions/requestActions'
import { clearMessage } from 'uPortMobile/lib/actions/processStatusActions'
import { enableCamera, disableCamera } from 'uPortMobile/lib/actions/scannerActions'
import { authorizeCamera } from 'uPortMobile/lib/actions/authorizationActions'
import { NavigationActions } from 'uPortMobile/lib/utilities/NavigationActions'

const DisabledScanner = (props) => <View style={{backgroundColor: 'black', flex: 1}} />

export class Scanner extends React.Component {

  constructor (props) {
    super(props)
    this.onBarCodeRead = this.onBarCodeRead.bind(this)
    this.toggleScannerMode = this.toggleScannerMode.bind(this)
  
    this.state = {
      hasCameraPermission: null,
      scannerEnabled: false
    }
  }

  setCamerPermissions(status) {
    this.setState({ hasCameraPermission: status === 'authorized' });
  }

  async componentDidMount() {

    let status = await Permissions.check('camera')
    if (status === 'undetermined') {
      status = await Permissions.request('camera')
    }
    this.setCamerPermissions(status)
  }

  // componentDidMount () {
  //   Permissions.check('camera').then(response => {
  //     this.props.authorizeCamera(response)
  //     if (response === 'undetermined') {
  //       Permissions.request('camera').then(response => {
  //         this.props.authorizeCamera(response)
  //       })
  //     }
  //   })
  // }

  // componentWillReceiveProps (nextProps) {
  //   if (!this.props.enabled && nextProps.enabled) {
  //     this.hasBarcode = false
  //     this.setState({scan: true})
  //   } else if (!nextProps.enabled) {
  //     this.hasBarcode = true
  //     this.setState({scan: false})
  //   } else {
  //     this.hasBarcode = false
  //     this.setState({scan: true})
  //   }
  // }

  onBarCodeRead (event) {
    if (this.hasBarcode) return
    this.hasBarcode = true
    this.props.navigator.toggleDrawer({
      side: 'right'
    })
    this.props.scanURL(event)
    this.setState({scan: false})
  }

  toggleScannerMode(enable) {

    console.tron.log('Pressed')

    this.setState({
      ...this.state,
      scannerEnabled: enable
    })
  }

  render() {
    const { hasCameraPermission } = this.state;
    console.tron.log(this.state)

    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <DisabledScanner />;
    } else {
      return (
        <View style={{flex: 1}}>
          <TouchableOpacity
            onLongPress={() => this.toggleScannerMode(true)}
            onPressOut={() => this.toggleScannerMode(false)}
            style={{borderRadius: 75, alignSelf: 'center', position: 'absolute', zIndex: 1, bottom: 100, width: 150, height: 150, borderWidth: 1, borderColor: 'red'}}
            onPressIn={() => {}}>
          </TouchableOpacity>
          {
            this.state.scannerEnabled && 
              <RNCamera
                captureAudio={false}
                style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}
                onBarCodeRead={this.onBarCodeRead.bind(this)}
              >
              <Text style={{color: 'black'}}>Enabled</Text>
              </RNCamera>
          }
        </View>
      )
    }
  }
}

  //render () {
      //return <View><Text>Hello</Text></View>
  //   if (this.props.scanError) {
  //     return (<View style={{flex: 1, width: windowWidth}}><DisabledScanner /></View>)
  //   }
  //   if (this.props.authorization.cameraAuthorized === 'denied' || this.props.authorization.cameraAuthorized === 'restricted') {
  //     return (<CameraAuthDenied navigator={this.props.navigator} />)
  //   } else if (this.props.authorization.cameraAuthorized === 'undetermined') {
  //     return (<View style={{flex: 1, width: windowWidth}}><DisabledScanner /></View>)
  //   } else if (Platform.OS === 'android' && this.state && !this.state.scan) {
  //     return (<View style={{flex: 1, width: windowWidth}}><DisabledScanner /></View>)
  //   } else if (this.state.currentAppState === 'inactive' || this.state.currentAppState === 'background') {
  //     return (<View style={{flex: 1, width: windowWidth}}><DisabledScanner /></View>)
  //   } else {
  //     return (
  //       <RNCamera
  //         captureAudio={false}
  //         style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}
  //         onBarCodeRead={this.onBarCodeRead.bind(this)}
  //         >
  //       </RNCamera>
  //     )
  //   }
  // }
  //}

const mapStateToProps = (state, ownProps) => {
  return {
    ...ownProps,
    enabled: !hasRequest(state),
    authorization: state.authorization,
    cameraEnabled: cameraEnabled(state),
    scanError: errorMessage(state, 'handleUrl')
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    scanURL: (event) => {
      if (event.data) {
        dispatch(handleURL(event.data, {postback: true}))
        Vibration.vibrate()
      }
    },
    clearError: () => {
      dispatch(clearMessage('handleUrl'))
    },
    authorizeCamera: (response) => {
      dispatch(authorizeCamera(response))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Scanner)
