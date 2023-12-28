import * as React from 'react'
import { Image, TouchableOpacity, Linking } from 'react-native'
import { Container, Text, Card, Colors, Icon, Theme } from '@kancha'

export interface SignPostCardType {
  id: string
  title: string
  subtitle: string
  logo: string
  url: string
  headerColor: string
  content: {
    description?: string
    list?: string[]
    footNote?: string
  }
}

interface SignPostProps {
  card: SignPostCardType
  onPress: () => void
}

const SignPost: React.FC<SignPostProps> = ({ card, onPress }) => {
  return (
    <Card marginBottom>
      <TouchableOpacity onPress={onPress}>
        <Container
          padding
          backgroundColor={card.headerColor}
          flexDirection={'row'}
          alignItems={'flex-start'}
          justifyContent={'center'}>
          <Container marginRight>
            <Image source={{ uri: card.logo }} style={{ width: 40, height: 40, borderRadius: 5 }} />
          </Container>
          <Container flex={1}>
            <Text textColor={'#ffffff'} type={Text.Types.SubTitle}>
              {card.subtitle}
            </Text>
            <Text bold textColor={'#ffffff'} type={Text.Types.H3}>
              {card.title}
            </Text>
          </Container>
          <Icon name="externalLink" font="feather" color={'#ffffff'} />
        </Container>
      </TouchableOpacity>
      <Container flex={1} paddingTop paddingLeft paddingBottom paddingRight={30}>
        {card.content.description && (
          <Container>
            <Text>{card.content.description}</Text>
          </Container>
        )}
        {card.content.list && (
          <Container>
            {card.content.list.map((item: string) => {
              return (
                <Container key={item} marginBottom={10} flexDirection={'row'} alignItems={'center'}>
                  <Container marginRight>
                    <Icon size={20} name="checkbox_checked" color={Theme.colors.primary.accessories} />
                  </Container>
                  <Text textColor={Colors.DARK_GREY} type={Text.Types.ListItemNote}>
                    {item}
                  </Text>
                </Container>
              )
            })}
          </Container>
        )}
        {card.content.footNote && (
          <Container paddingTop>
            <Text type={Text.Types.ListItemNote}>{card.content.footNote}</Text>
          </Container>
        )}
      </Container>
    </Card>
  )
}

export default SignPost
