import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Line } from 'react-native-svg'
import { useTheme } from '../../contexts/theme-context'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const sizes = {
  sm: { icon: 24, text: 16 },
  md: { icon: 32, text: 20 },
  lg: { icon: 48, text: 36 },
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const { colors } = useTheme()
  const s = sizes[size]

  return (
    <View style={styles.container}>
      <Svg width={s.icon} height={s.icon} viewBox="0 0 100 100" fill="none">
        {/* Main sail */}
        <Path
          d="M52 8C52 8 78 45 78 70C78 70 52 62 52 62V8Z"
          stroke={colors.primary}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Jib sail */}
        <Path
          d="M48 18C48 18 30 50 28 70C28 70 48 62 48 62V18Z"
          stroke={colors.primary}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Hull */}
        <Path
          d="M38 72C38 72 42 82 50 82C58 82 62 72 62 72"
          stroke={colors.primary}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Waterline */}
        <Line
          x1={30}
          y1={86}
          x2={74}
          y2={86}
          stroke={colors.primary}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
      {showText && (
        <Text style={[styles.text, { color: colors.primary, fontSize: s.text }]}>Edara</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontWeight: '800' },
})
