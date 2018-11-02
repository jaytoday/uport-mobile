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
import { Text, View, Vibration, Platform, TouchableHighlight, Dimensions, SafeAreaView } from 'react-native'
import { windowWidth } from 'uPortMobile/lib/styles/globalStyles'
import { RNCamera } from 'react-native-camera'
import Permissions from 'react-native-permissions'
import CameraAuthDenied from './CameraAuthDenied'
import LottieView from 'lottie-react-native';

// Selectors
import { hasRequest } from 'uPortMobile/lib/selectors/requests'
import { errorMessage } from 'uPortMobile/lib/selectors/processStatus'
import { cameraEnabled } from 'uPortMobile/lib/selectors/scanner'

// Actions
import { handleURL } from 'uPortMobile/lib/actions/requestActions'
import { clearMessage } from 'uPortMobile/lib/actions/processStatusActions'
import { authorizeCamera } from 'uPortMobile/lib/actions/authorizationActions'
import { NavigationActions } from 'uPortMobile/lib/utilities/NavigationActions'

const { width, height } = Dimensions.get('window')

const DisabledScanner = (props) => <View style={{ backgroundColor: 'black', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 15}} ><Text style={{color: '#FFFFFF', textAlign: 'center' }}>Looks like you need to enable camera access in your settings</Text></View>

export class Scanner extends React.Component {


  constructor (props) {
    super(props)
    
    this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));

    this.onBarCodeRead = this.onBarCodeRead.bind(this)
    this.toggleScannerMode = this.toggleScannerMode.bind(this)
  
    this.state = {
      hasCameraPermission: null,
      scannerEnabled: false
    }
  }

  onNavigatorEvent(event) {

    switch(event.id) {
      case 'willAppear':
       break;
      case 'didAppear':
        break;
      case 'willDisappear':
        break;
      case 'didDisappear':
        break;
      case 'willCommitPreview':
        break;
    }
  }

  setCamerPermissions(status) {
    this.setState({ ...this.state, hasCameraPermission: status === 'authorized' });
  }

  async componentDidMount() {

    let status = await Permissions.check('camera')
    if (status === 'undetermined') {
      status = await Permissions.request('camera')
    }
    this.setCamerPermissions(status)
  }

  toggleDrawer() {
    this.props.navigator.toggleDrawer({
      side: 'right'
    })
  }

  onBarCodeRead(event) {
    if (!this.state.scannerEnabled) return

    this.animation.reset()
    this.checkAnimation.play()
    Vibration.vibrate()
    this.toggleScannerMode(false);

    setTimeout(() => {
      this.checkAnimation.reset()
      this.props.scanURL(event)
      this.toggleDrawer()
    }, 2000)
  }

  toggleScannerMode(enable) {
    this.setState({
      ...this.state,
      scannerEnabled: enable
    })
  }

  startTimer() {
    this.timeout = setTimeout(() => {
      this.toggleScannerMode(false)
      this.stopScannerTimer()
    }, 5000)
  }

  startScanner() {
    this.toggleScannerMode(true)
    this.animation.play();

    clearTimeout(this.timeout)
    this.startTimer()
  }

  stopScannerTimer() {
    clearTimeout(this.timeout)
    this.toggleScannerMode(false)
    this.animation.reset();
  }

  render() {
    const { hasCameraPermission } = this.state;
    const borderStyle = {
      borderColor: this.state.scannerEnabled ? '#333333' : 'red'
    }

    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <DisabledScanner />;
    } else {
      return (
        <View style={{flex: 1}}>
          { 
            !this.state.scannerEnabled &&
              <Text style={{color: '#FFFFFF', alignSelf: 'center', position: 'absolute', zIndex: 1, bottom: height / 4, textAlign: 'center', padding: 15}}>Point your camera at a QR code</Text>
          }
          {
            this.state.scannerEnabled &&
              <Text style={{color: '#FFFFFF', alignSelf: 'center', position: 'absolute', zIndex: 1, bottom: height / 4, textAlign: 'center', padding: 15}}>Scanning for them QRs....</Text>
          }
          <LottieView
            ref={animation => {
              this.animation = animation;
            }}
            style={{position: 'absolute', zIndex: 1, bottom: 100, alignSelf: 'center', width: width - 50, height: width}}
            source={require('uPortMobile/lib/animations/scanner.json')}
          />
          <LottieView
              loop={false}
              ref={animation => {
                this.checkAnimation = animation;
              }}
              style={{position: 'absolute', zIndex: 1, bottom: 140, alignSelf: 'center', width: 100, height: 100}}
              source={require('uPortMobile/lib/animations/check.json')}
            />
          <TouchableHighlight
            disabled={this.state.scannerEnabled}
            onPress={() => this.startScanner()}
            style={[{borderColor: 'green', borderRadius: 50, alignSelf: 'center', position: 'absolute', zIndex: 1, bottom: 80, width: 100, height: 100, borderWidth: 3, backgroundColor: 'rgba(0,0,0,0.4)'}, borderStyle]}
            onPressIn={() => {}}>
            <View></View>
          </TouchableHighlight>
          {
            <RNCamera
              captureAudio={false}
              style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}
              onBarCodeRead={this.onBarCodeRead.bind(this)}
            />
          }
        </View>
      )
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    scanURL: (event) => {
      if (event.data) {
        dispatch(handleURL(event.data, { postback: true }))
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
