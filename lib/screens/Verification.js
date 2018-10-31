import React from 'react'
import { ScrollView, RefreshControl, Clipboard, Share, StyleSheet, View, SafeAreaView, Dimensions, Text } from 'react-native'
import { toJs, get } from 'mori'
import { connect } from 'react-redux'
import { colors } from 'uPortMobile/lib/styles/globalStyles'
import { externalIdentities, currentAddress } from 'uPortMobile/lib/selectors/identities'
import { capitalizeFirstLetter } from 'uPortMobile/lib/utilities/string'
import moment from 'moment'

import FeatherIcon from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'

import { OnboardingButton } from 'uPortMobile/lib/components/shared/Button'

const { height, width } = Dimensions.get('window');

class Verification extends React.Component {

    static navigatorStyle = {
        largeTitle: false,
        drawUnderNavBar: true,
        navBarNoBorder: true,
        navBarBackgroundColor: '#3A8BC6',
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

    // showLightBox () {
    //     this.props.navigator.showLightBox({
    //         screen: 'uport.accountFunding',
    //             passProps: {
    //             address: this.props.address,
    //             accountProfile: this.props.accountProfile
    //         },
    //         style: {
    //             backgroundBlur: 'none', // 'dark' / 'light' / 'xlight' / 'none' - the type of blur on the background
    //             backgroundColor: '#00000080'
    //         }
    //     })
    // }

    expirationItem(exp) {
        let expirationDate = exp && exp >= 1000000000000 ? moment.unix(Math.floor(exp / 1000)) : moment.unix(exp)

        return expirationDate.isValid()
            ? moment(expirationDate).format('LLL')
            : 'No Expiration'
      }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.bannerTop}>
                    <Text style={styles.bannerTitle}>{ this.props.verification.claim[this.props.claimType[0]] || this.props.verification.claim[this.props.claimType[0].toLowerCase()]}</Text>
                    <Text style={styles.bannerSubTitle}>{ this.props.claimType } claim</Text>
                    <Text style={styles.bannerSubTitle}></Text>
                </View>
                {/* <View style={styles.buttonRow}>
                    <OnboardingButton 
                        onPress={() => this.showLightBox()} 
                        style={{borderColor: colors.brand}} >
                        <Text style={{fontFamily: 'Montserrat'}}>Fund Account</Text>
                    </OnboardingButton>
                </View> */}
                <ScrollView 
                    contentContainerStyle={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.subtitleText}>CLAIM ISSUER</Text>
                        <Text style={styles.titleText}>{ this.props.issuer.name }</Text>
                        <View style={[styles.infoRow, {marginTop: 10}]}>
                            <Text style={styles.infoTitle}>EXPIRY</Text>
                            <Text style={styles.infoContent}>{ this.expirationItem(this.props.verification.exp) }</Text>
                        </View>
                        <View style={[styles.infoRow]}>
                            <Text style={styles.infoTitle}>DESCRIPTION</Text>
                            <Text style={styles.infoContent}>{ this.props.issuer.description }</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoTitle}>URL</Text>
                            <Text style={styles.infoContent}>{ this.props.issuer.url }</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoTitle}>DID</Text>
                            <Text style={styles.infoContent}>{ this.props.address }</Text>
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
        backgroundColor: '#3A8BC6',
        alignItems: 'center',
        justifyContent: 'center',
        height: height / 4
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
        paddingTop: 10,
        fontFamily: 'Montserrat',
        fontSize: 30,
        color: '#FFFFFF'
    },
    bannerSubTitle: {
        fontFamily: 'Montserrat',
        fontSize: 18,
        color: '#FFFFFF'
    },
    buttonRow: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#AAAAAA'
    },
    infoRow: {
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#AAAAAA'
    },
    infoTitle: {
        color: '#3A8BC6',
        fontSize: 12,
        paddingBottom: 5
    },
    infoContent: {
        color: '#333333',
        fontSize: 14
    },
})

const mapStateToProps = (state, ownProps) => {
    return {
        address: ownProps.verification.sub,
        issuer: toJs(get(externalIdentities(state), ownProps.verification.iss)) || {}
    }
}
  
const mapDispatchToProps = (dispatch) => {
    return {
        removeAttestation: (address, token) => dispatch(removeAttestation(address, token)),
        authorizeRequest: (activity) => dispatch(authorizeRequest(activity.id)),
        cancelRequest: (activity) => dispatch(cancelRequest(activity.id))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Verification)