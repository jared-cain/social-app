import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import React, {useCallback} from 'react'
import {Alert, StyleSheet, View, TouchableOpacity} from 'react-native'
import Svg, {Rect, Defs, LinearGradient, Stop} from 'react-native-svg'
import {getGradient} from '../../lib/asset-gen'
import {colors} from '../../lib/styles'

export function UserBanner({
  handle,
  isMe = false,
}: {
  handle: string
  isMe?: boolean
}) {
  const gradient = getGradient(handle)

  const renderSvg = () => (
    <Svg width="100%" height="120" viewBox="50 0 200 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={gradient[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={gradient[1]} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity="0" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad)" />
      <Rect x="0" y="0" width="400" height="100" fill="url(#grad2)" />
    </Svg>
  )

  const handleEditBanner = useCallback(() => {
    Alert.alert('TB Implemented')
  }, [])

  return isMe ? (
    <TouchableOpacity onPress={handleEditBanner}>
      {renderSvg()}
      <View style={styles.editButtonContainer}>
        <FontAwesomeIcon
          icon="camera"
          size={10}
          style={{color: colors.gray1}}
        />
      </View>
    </TouchableOpacity>
  ) : (
    renderSvg()
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.gray5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
