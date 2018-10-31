import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'
import { colors } from 'uPortMobile/lib/styles/globalStyles'

import Menu from 'uPortMobile/lib/components/shared/Menu'
import MenuItem from 'uPortMobile/lib/components/shared/MenuItem'
import Avatar from 'uPortMobile/lib/components/shared/Avatar'
import Icon from 'react-native-vector-icons/Ionicons'

import { connections } from 'uPortMobile/lib/selectors/identities'
import { hdRootAddress, seedConfirmedSelector } from 'uPortMobile/lib/selectors/hdWallet'
import { currentAvatar, currentName } from 'uPortMobile/lib/selectors/identities'

const Chevron = () => <Icon name={Platform.OS === 'ios' ? 'ios-arrow-forward-outline' : 'md-arrow-forward'} color={colors.grey216} style={{marginLeft: 16}} size={20} />

class Settings extends React.Component {

    static navigatorStyle = {
        largeTitle: true,
        drawUnderNavBar: true,
        navBarTransparent: false,
        navBarTranslucent: false,
        navBarBackgroundColor: colors.brand,
        navBarButtonColor: colors.white,
        navBarTextColor: colors.white,
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <Menu>  
                    <TouchableHighlight style={styles.profileButton} underlayColor={colors.grey216} onPress={() => this.props.navigator.push({screen: 'screen.User'})}>
                        <View style={styles.profileButtonContent}>
                            <View style={{padding: 15}}><Avatar source={this.props.user.avatar} /></View>
                            <View style={{flex: 1}}>
                                <Text style={{fontSize: 20, fontFamily: 'Montserrat'}}>{ this.props.user.name }</Text>
                            </View>
                            <Chevron />    
                        </View>
                    </TouchableHighlight>
                    <MenuItem title='About' destination='settings.main' navigator={this.props.navigator} topBorder />
                    <MenuItem title='Advanced' destination='uport.advanced' navigator={this.props.navigator} />
                        {
                            this.props.hasHDWallet && 
                            <MenuItem title='Account Recovery'
                                danger={!this.props.seedConfirmed}
                                value={this.props.seedConfirmed ? undefined : 'Account At Risk'}
                                destination='backup.seedInstructions'
                                navigator={this.props.navigator}
                            />
                        }
                        {   
                            this.props.hasHDWallet && 
                            <MenuItem
                                title='Account Back Up'
                                destination='backup.dataInstructions'
                                navigator={this.props.navigator}
                            />
                        }
                    <MenuItem title='Try uPort' navigator={this.props.navigator} destination='advanced.try-uport' last />
                </Menu>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EAEAEA'
    },
    profileButton: {
        paddingRight: 15,
        marginVertical: 50,
        borderBottomColor: colors.white216,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.white216,
        borderTopWidth: StyleSheet.hairlineWidth,
        backgroundColor: colors.white
    },
    profileButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    }
})

const mapStateToProps = (state) => {
    return {
      user: {
        avatar: currentAvatar(state),
        name: currentName(state),
      },
      connections: connections(state) || [],
      hasHDWallet: !!hdRootAddress(state),
      seedConfirmed: seedConfirmedSelector(state)
    }
  }
  export default connect(mapStateToProps)(Settings)