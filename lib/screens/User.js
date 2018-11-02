import React from 'react'
import { ScrollView, TouchableOpacity, StyleSheet, View, SafeAreaView, Dimensions, Text, ImageBackground, TextInput, Share} from 'react-native'
import { toJs, get } from 'mori'
import moment from 'moment'
import { connect } from 'react-redux'
import { colors } from 'uPortMobile/lib/styles/globalStyles'
import { externalIdentities, currentAddress , ownClaims} from 'uPortMobile/lib/selectors/identities'
import { capitalizeFirstLetter } from 'uPortMobile/lib/utilities/string'
import { OnboardingButton } from 'uPortMobile/lib/components/shared/Button'
import { editMyInfo, updateShareToken } from 'uPortMobile/lib/actions/myInfoActions'
import FeatherIcon from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { debounce } from 'lodash'
import { addClaims,addImage } from 'uPortMobile/lib/actions/uportActions'
import photoSelectionHandler from 'uPortMobile/lib/utilities/photoSelection'

const USER_FIELDS = ['name', 'email', 'country', 'phone', 'avatar']
const { height, width } = Dimensions.get('window');

class User extends React.Component {

    static navigatorStyle = {
        largeTitle: false,
        navBarNoBorder: true,
        navBarButtonColor: colors.white,
        navBarTextColor: colors.white,
    }

    constructor(props) {
        super(props)
        
        this.state = {
            editMode: false
        }

        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this))
        this.photoSelection = this.photoSelection.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    componentDidMount() {
        this.setDefaultButtons()
    }

    setDefaultButtons() {
        FeatherIcon.getImageSource('edit', 26, '#FFFFFF').then(edit => {
            this.props.navigator.setButtons({
                rightButtons: [
                    {
                        id: 'edit',
                        icon: edit
                    }
                ]
            })
        })
    }
    
    setEditModeButtons() {
        this.props.navigator.setButtons({
            rightButtons: [
                {
                    title: 'Save',
                    id: 'save',
                },
                {
                    title: 'Cancel',
                    id: 'cancel',
                }
            ]
        })
    }

    photoSelection () {
        photoSelectionHandler({
            cameraStatus: this.props.cameraStatus,
            photoStatus: this.props.photoStatus,
            segmentId: this.props.segmentId,
            addFn: this.props.editMyInfo
        })
    }

    showQRCode() {
        const url = `https://id.uport.me/req/${this.props.shareToken}`

        this.props.navigator.showModal({
            screen: 'uport.QRCodeModal',
            passProps: {
              title: this.props.name,
              url,
              onClose: this.props.navigator.dismissModal
            },
            navigatorStyle: {
              navBarHidden: true,
              screenBackgroundColor: 'white'
            }
        })
    }

    showQShareDialog() {
        const url = `https://id.uport.me/req/${this.props.shareToken}`

        Share.share({
            url,
            message: `${this.props.name}\n\n${url}`,
            title: `Share contact`
          }, {
            dialogTitle: `Share contact`
        })
    }

    onNavigatorEvent (event) { // this is the onPress handler for the two buttons together
        if (event.type === 'NavBarButtonPress') { // this is the event type for button presses
          if (event.id === 'edit') { // this is the same id field from the static navigatorButtons definition
            this.setState({editMode: true})
            this.setEditModeButtons()
          }
          if (event.id === 'save') {
            this.handleSubmit()
            this.setState({editMode: false})
            this.setDefaultButtons()
          }
          if (event.id === 'cancel') {
            this.setState({editMode: false})
            this.setDefaultButtons()
            this.handleCancel()
          }
        }
    }

    photoSelection () {
        photoSelectionHandler({
            cameraStatus: this.props.cameraStatus,
            photoStatus: this.props.photoStatus,
            segmentId: this.props.segmentId,
            addFn: this.props.editMyInfo
        })
    }

    handleChange (change) {
        this.props.editMyInfo(change)
    }

    handleCancel () {
        const change = {}
        USER_FIELDS.map(attr => {
          change[attr] = this.props.userData[attr]
        })
        this.props.editMyInfo(change)
        this.setState({editing: false})
    }

    changed () {
        const change = {}
        USER_FIELDS.map((attr) => {
          if (this.props[attr] !== this.props.userData[attr]) {
            change[attr] = this.props[attr]
          }
        })
        return change
    }
    
    handleSubmit () {
        const change = this.changed()
        delete change['avatar']
        if (Object.keys(change).length > 0) {
          this.props.storeOwnClaim(this.props.address, change)
        }
        if (this.props.avatar && this.props.avatar.data) {
          // console.log('Avatar', this.props.avatar)
          this.props.addImage(this.props.address, 'avatar', this.props.avatar)
        }
        this.props.updateShareToken(this.props.address)
      }

    expirationItem(exp) {
        let expirationDate = exp && exp >= 1000000000000 ? moment.unix(Math.floor(exp / 1000)) : moment.unix(exp)

        return expirationDate.isValid()
            ? moment(expirationDate).format('LLL')
            : 'No Expiration'
      }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <ImageBackground source={this.props.avatar} resizeMode="cover" style={styles.bannerTop}>
                    {
                        this.state.editMode &&
                            <TouchableOpacity onPress={this.photoSelection} style={styles.editButton}><Text style={{color: '#FFFFFF'}}>Update profile image</Text></TouchableOpacity>
                    }
                    {
                        this.state.editMode
                            ? <View style={[styles.titleWrapper, styles.titleWrapperEdit]}>
                                <TextInput onChangeText={(value) => this.handleChange({name: value})} style={[styles.bannerTitle, styles.bannerTitleEdit]}>{ this.props.name }</TextInput>
                              </View>
                            : <View style={[styles.titleWrapper]}>
                                <Text style={styles.bannerTitle}>{ this.props.name }</Text>
                              </View>
                    } 
                    <Text style={styles.bannerSubTitle}>{ this.props.address }</Text>
                </ImageBackground>
                <View style={styles.buttonRow}>
                    <View style={styles.buttonContainer}>
                        <OnboardingButton
                            disabled={this.state.editMode}
                            onPress={() => this.showQRCode() } 
                            style={{borderColor: colors.brand}} >
                            <Text style={{fontFamily: 'Montserrat'}}>QR Code</Text>
                        </OnboardingButton>
                    </View>
                    <View style={styles.buttonContainer}>
                        <OnboardingButton
                            disabled={this.state.editMode}
                            onPress={() => this.showQShareDialog() }
                            style={{borderColor: colors.brand}} >
                            <Text style={{fontFamily: 'Montserrat'}}>Share</Text>
                        </OnboardingButton>
                    </View>
                </View>
                <ScrollView 
                    contentContainerStyle={styles.container}>
                    {
                        this.state.editMode 
                        ?   <View style={styles.content}>
                                <View style={[styles.infoRow, {marginTop: 10}]}>
                                    <Text style={styles.infoTitle}>EMAIL</Text>
                                    <TextInput value={this.props.email} autoCapitalize='none' placeholder={'Enter Email'} onChangeText={(value) => this.handleChange({email: value})} style={[styles.infoContent, styles.infoContentEdit]} />
                                </View>
                                <View style={[styles.infoRow]}>
                                    <Text style={styles.infoTitle}>LOCATION</Text>
                                    <TextInput value={this.props.country} autoCapitalize='none' placeholder={'Enter Email'} onChangeText={(value) => this.handleChange({country: value})} style={[styles.infoContent, styles.infoContentEdit]} />
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoTitle}>PHONE</Text>
                                    <TextInput value={this.props.phone} autoCapitalize='none' placeholder={'Enter Email'} onChangeText={(value) => this.handleChange({phone: value})} style={[styles.infoContent, styles.infoContentEdit]} />
                                </View>
                            </View>
                        
                        :   <View style={styles.content}>
                                <View style={[styles.infoRow, {marginTop: 10}]}>
                                    <Text style={styles.infoTitle}>EMAIL</Text>
                                    <Text style={[styles.infoContent]}>{ this.props.email }</Text>
                                </View>
                                <View style={[styles.infoRow]}>
                                    <Text style={styles.infoTitle}>LOCATION</Text>
                                    <Text style={[styles.infoContent]}>{ this.props.country }</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoTitle}>PHONE</Text>
                                    <Text style={[styles.infoContent]}>{ this.props.phone }</Text>
                                </View>                     
                            </View>
                    }
                </ScrollView>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bannerTop: {
        backgroundColor: colors.brand,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        height: height / 3
    },
    editButton: {
        position: 'absolute', 
        alignSelf: 'center', 
        bottom: 150, 
        padding: 10, 
        borderRadius: 5, 
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 15
    },
    titleText: {
        fontFamily: 'Montserrat',
        fontSize: 25,
        color: '#333333',
        paddingBottom: 5
    },
    subtitleText: {
        color: '#AAAAAA',
        paddingBottom: 5,
    },
    bannerTitle: {
        padding: 15,
        fontFamily: 'Montserrat',
        fontSize: 30,
        color: '#FFFFFF',
        width: '100%'
    },
    bannerTitleEdit: {
        color: '#333333',
    },
    titleWrapper: {
        width: '100%',
        marginBottom: 5,
    },
    titleWrapperEdit: {
        backgroundColor: 'rgba(255, 250, 236, 0.7)',
    },
    bannerSubTitle: {
        paddingLeft: 15,
        paddingBottom: 15,
        fontFamily: 'Montserrat',
        fontSize: 12,
        color: '#FFFFFF'
    },
    buttonRow: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#AAAAAA',
        flexDirection: 'row',
    },
    buttonContainer: {
        flex: 1
    },
    infoRow: {
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#AAAAAA'
    },
    infoTitle: {
        color: '#AAAAAA',
        fontSize: 12,
        paddingBottom: 5
    },
    infoContent: {
        color: '#333333',
        fontSize: 14,
        paddingVertical: 10
    },
    infoContentEdit: {
        backgroundColor: '#FFFAEC',
    },
})

const mapStateToProps = (state, ownProps) => {
    const userData = toJs(ownClaims(state)) || {}
    return {
      ...ownProps,
      avatar: typeof state.myInfo.changed.avatar !== 'undefined' ? state.myInfo.changed.avatar : userData.avatar,
      name: typeof state.myInfo.changed.name !== 'undefined' ? state.myInfo.changed.name : userData.name,
      email: typeof state.myInfo.changed.email !== 'undefined' ? state.myInfo.changed.email : userData.email,
      country: typeof state.myInfo.changed.country !== 'undefined' ? state.myInfo.changed.country : userData.country,
      phone: typeof state.myInfo.changed.phone !== 'undefined' ? state.myInfo.changed.phone : userData.phone,
      userData,
      address: currentAddress(state),
      shareToken: state.myInfo.shareToken
    }
  }
  export const mapDispatchToProps = (dispatch) => {
    return {
      storeOwnClaim: (address, claims) => {
        dispatch(addClaims(address, claims))
      },
      editMyInfo: change => {
        dispatch(editMyInfo(change))
      },
      addImage: (address, claimType, image) => {
        dispatch(addImage(address, claimType, image))
      },
      updateShareToken: (address) => {
        dispatch(updateShareToken(address))
      }
    }
  }
  
  export default connect(mapStateToProps, mapDispatchToProps)(User)