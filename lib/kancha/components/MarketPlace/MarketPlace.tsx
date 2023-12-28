import * as React from 'react'
import { Container, Card, Text, Icon, Button } from '@kancha'
import { Image, Linking } from 'react-native'
import { Navigation } from 'react-native-navigation'

interface ServiceProviders {
  referenceId: string
  product: string
  provider: string
  url: string
  logo: string
}

interface MarketPlaceProps {
  componentId: string,
  config: any
}

const MarketPlace: React.FC<MarketPlaceProps> = props => {
  return (
    <Card>
      <Container padding>
        <Text bold type={Text.Types.H3}>
          {props.config.title}
        </Text>
      </Container>
      <Container paddingLeft paddingRight paddingBottom>
        <Text type={Text.Types.Body}>{props.config.description}</Text>
      </Container>
      <Container padding>
        {props.config.serviceProviders.map((provider: ServiceProviders) => {
          return (
            <Card key={provider.referenceId} marginBottom onPress={() => Linking.openURL(provider.url)}>
              <Container padding flexDirection={'row'} alignItems={'center'}>
                <Container>
                  <Image source={{ uri: provider.logo }} style={{ height: 30, width: 30 }} resizeMode={'cover'} />
                </Container>
                <Container flex={1} marginLeft marginRight>
                  <Text type={Text.Types.SubTitle}>{provider.provider.toUpperCase()}</Text>
                  <Text type={Text.Types.Body} bold>
                    {provider.product}
                  </Text>
                </Container>
                <Container>
                  <Icon name={'externalLink'} font={'evil'} />
                </Container>
              </Container>
            </Card>
          )
        })}
      </Container>
      <Container padding>
        <Button
          fullWidth
          type={Button.Types.Primary}
          block={Button.Block.Clear}
          buttonText={props.config.dismiss}
          onPress={() => Navigation.dismissModal(props.componentId)}
        />
      </Container>
    </Card>
  )
}

export default MarketPlace
