import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native'
import { connect } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import Avatar from 'uPortMobile/lib/components/shared/Avatar'

import { contacts } from 'uPortMobile/lib/selectors/identities'

class Contacts extends React.Component {

    static navigatorStyle = {
        largeTitle: true,
        drawUnderNavBar: true,
        navBarBackgroundColor: 'rgba(92,80,202,1)',
        navBarButtonColor: '#FFFFFF',
        navBarTextColor: '#FFFFFF',
    }

    renderListItem({item}) {
        return (
            <View style={{height: 70, borderBottomColor: '#EAEAEA', borderBottomWidth: 1, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
                <Avatar size={50} source={item} />
                <Text style={{fontSize: 16, fontWeight: 'bold', flex: 1}}>{item.name ? item.name : `${item.address.slice(0, 30)}...`}</Text>
                <Icon size={20} name="chevron-right" />
            </View>
        )
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <FlatList
                    contentContainerStyle={styles.container}
                    data={this.props.contacts}
                    renderItem={this.renderListItem}
                    keyExtractor={(item) => item.key}
                />
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

const mapStateToProps = (state) => {
    return {
        contacts: contacts(state) || [],
    }
}

  export default connect(mapStateToProps)(Contacts)