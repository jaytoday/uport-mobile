import React from 'react'
import { AlertIOS, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Linking } from 'react-native'
import { toJs } from 'mori'
import { connect } from 'react-redux'
import Avatar from 'uPortMobile/lib/components/shared/Avatar'
import { NavigationActions } from 'uPortMobile/lib/utilities/NavigationActions'
import { notificationCount } from 'uPortMobile/lib/selectors/activities'
import { currentAvatar, currentName, myAccounts, contacts } from 'uPortMobile/lib/selectors/identities'
import { externalProfile } from 'uPortMobile/lib/selectors/requests'
import { colors } from 'uPortMobile/lib/styles/globalStyles'

import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Feather from 'react-native-vector-icons/Feather'

class Accounts extends React.Component {

    static navigatorStyle = {
        largeTitle: true,
        navBarTextFontFamily: 'Montserrat',
        navBarBackgroundColor: colors.brand,
        navBarButtonColor: colors.white,
        navBarTextColor: colors.white,
    }

    constructor(props){
        super(props)

        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
        this.renderCard = this.renderCard.bind(this)
    }

    onNavigatorEvent(event) { // this is the onPress handler for the two buttons together
        if (event.type == 'NavBarButtonPress') { // this is the event type for button presses
          if (event.id == 'capture') { // this is the same id field from the static navigatorButtons definition
            this.props.navigator.toggleDrawer({
                side: 'right'
            })
          }
        }
      }

    updateInAppNotificationBadge(count) {
        this.props.navigator.setTabBadge({
            tabIndex: 3,
            badge: count || null,
            badgeColor: colors.red,
        })
    }

    componentDidMount() {

        this.updateInAppNotificationBadge(this.props.unreadNoticationCount)
        
        Icon.getImageSource('qrcode-scan', 26, '#FFFFFF').then(icon => {
            this.props.navigator.setButtons({
                rightButtons: [
                    {
                      id: 'capture',
                      icon: icon
                    }
                  ]
            })
        })
    }

    renderCard({item}) {
        
        const screenConfig = {
            screen: 'screen.Account',
            largeTitle: false
        }
        const accountProfile=item.clientId ? this.props.accountProfileLookup(item.clientId) : null
        const networkName = item.network.charAt(0).toUpperCase() + item.network.slice(1).toLowerCase()

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => this.props.navigator.push({
                    screen: 'screen.Account',
                    largeTitle: false,
                    title: (accountProfile ? accountProfile.name : 'Ethereum'),
                    subTitle: networkName,
                    passProps: {
                        address: item.address,
                        network: networkName,
                        accountProfile: accountProfile
                    }
                })}
                >
                <View style={styles.cardInner}>
                    <View style={styles.header}>
                        <Text style={styles.titleText}>{ accountProfile ? accountProfile.name : 'Ethereum Account'}</Text>
                        <Text style={styles.subtitleText}>{ networkName } network</Text>
                    </View>
                    <View style={styles.banner}>
                        <Avatar size={150} style={{backgroundColor: '#50b2ca'}} source={accountProfile || {avatar: require('uPortMobile/assets/images/eth-symbol2-white.png')}} />
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    openDemoUrl(url) {
        Linking.openURL(`https://${url}`)
    }

    render() {
        return (
            <SafeAreaView style={{flex: 1}}>
                <StatusBar
                    barStyle="light-content"
                />
                {
                    this.props.accounts.length > 0
                        ? <FlatList
                            contentContainerStyle={styles.container}
                            data={this.props.accounts}
                            renderItem={this.renderCard}
                            keyExtractor={(item) => item.address}
                        /> 
                        :   <ScrollView contentContainerStyle={styles.scrollContent}>
                                <View style={styles.intro}>
                                    <Text style={styles.introtext}>
                                        Hello! Check out our demo below to get started. A unique account is created for every app you interact with. You are always in control of what you share.
                                    </Text>
                                </View>
                                <TouchableOpacity style={[styles.card, styles.demoCard]} onPress={() => this.openDemoUrl('demo.uport.me')}>
                                    <View style={styles.cardInner}>
                                        <View style={styles.header}>
                                            <Text style={styles.titleText}>Try uPort Demo</Text>
                                            <Text style={styles.subtitleText}>Tap to start the demo in your browser</Text>
                                        </View>
                                        <View style={[styles.banner]}>
                                            <Feather name='external-link' size={100} color={'rgba(255,255,255, 0.6)'}/>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                        </ScrollView>
                }
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    intro: {
        paddingVertical: 18,
        paddingBottom: 120,
        paddingHorizontal: 25,
        backgroundColor: '#FFFAEC',
        margin: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#F3EAD3'
    },
    introtext: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
    },
    container: {
        alignItems: 'center',
        paddingTop: 30
    },
    scrollContent: {
        
    },
    card: {
        alignSelf: 'center',
        width: 330,
        height: 300,
        shadowOpacity: 0.2,
        shadowRadius: 25,
        shadowColor: '#000000',
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        borderRadius: 5,
    },
    demoCard: {
        top: -110
    },
    cardInner: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 5,
    },
    header: {
        padding: 15
    },
    titleText: {
        fontFamily: 'Montserrat',
        fontSize: 25,
        paddingBottom: 5,
        color: '#333333'
    },
    subtitleText: {
        fontSize: 14,
        color: '#888888'
    },
    banner: {
        backgroundColor: '#50b2ca',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

const mapStateToProps = (state) => {
    return {
      unreadNoticationCount: notificationCount(state),
      accounts: myAccounts(state),
      accountProfileLookup: (clientId) => toJs(externalProfile(state, clientId))
    }
  }
  
  export const mapDispatchToProps = (dispatch) => {
    return {
    }
  }
  
  export default connect(mapStateToProps, mapDispatchToProps)(Accounts)