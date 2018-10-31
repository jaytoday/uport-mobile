import React from 'react'
import { ScrollView, RefreshControl, Clipboard, Share, StyleSheet, View, SafeAreaView, Dimensions, Text, ImageBackground } from 'react-native'
import { toJs, get } from 'mori'
import moment from 'moment'
import { connect } from 'react-redux'
import { colors } from 'uPortMobile/lib/styles/globalStyles'
import { externalIdentities, currentAddress , ownClaims} from 'uPortMobile/lib/selectors/identities'
import { capitalizeFirstLetter } from 'uPortMobile/lib/utilities/string'

import { editMyInfo, updateShareToken } from 'uPortMobile/lib/actions/myInfoActions'
import FeatherIcon from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingButton } from 'uPortMobile/lib/components/shared/Button'

const { height, width } = Dimensions.get('window');

class User extends React.Component {

    static navigatorStyle = {
        largeTitle: false,
        navBarNoBorder: true,
        navBarButtonColor: colors.white,
        navBarTextColor: colors.white,
    }

    componentDidMount() {

        MaterialIcon.getImageSource('qrcode-scan', 26, '#FFFFFF').then(scan => {
            FeatherIcon.getImageSource('share', 26, '#FFFFFF').then(share => {
                this.props.navigator.setButtons({
                    rightButtons: [
                        {
                            id: 'share',
                            icon: share
                        }
                    ]
                })
            })
        })
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
                    <Text style={styles.bannerTitle}>{ this.props.name }</Text>
                    <Text style={styles.bannerSubTitle}>{ this.props.address }</Text>
                </ImageBackground>
                
                <View style={styles.buttonRow}>
                    <View style={styles.buttonContainer}>
                        <OnboardingButton 
                            onPress={() => {}} 
                            style={{borderColor: colors.brand}} >
                            <Text style={{fontFamily: 'Montserrat'}}>QR Code</Text>
                        </OnboardingButton>
                    </View>
                    <View style={styles.buttonContainer}>
                        <OnboardingButton 
                            onPress={() => {}} 
                            style={{borderColor: colors.brand}} >
                            <Text style={{fontFamily: 'Montserrat'}}>Edit</Text>
                        </OnboardingButton>
                    </View>
                </View>
                <ScrollView 
                    contentContainerStyle={styles.container}>
                    <View style={styles.content}>
                        <View style={[styles.infoRow, {marginTop: 10}]}>
                            <Text style={styles.infoTitle}>EMAIL</Text>
                            <Text style={styles.infoContent}>{ this.props.email }</Text>
                        </View>
                        <View style={[styles.infoRow]}>
                            <Text style={styles.infoTitle}>LOCATION</Text>
                            <Text style={styles.infoContent}>{ this.props.country }</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoTitle}>PHONE</Text>
                            <Text style={styles.infoContent}>{ this.props.phone }</Text>
                        </View>
                    </View>
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
        paddingLeft: 15,
        paddingBottom: 10,
        fontFamily: 'Montserrat',
        fontSize: 30,
        color: '#FFFFFF'
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
        fontSize: 14
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