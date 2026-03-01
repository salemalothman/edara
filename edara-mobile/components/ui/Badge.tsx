import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../contexts/theme-context'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  label: string
  variant?: BadgeVariant
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useTheme()

  const bgColor = {
    default: colors.primaryLight,
    success: colors.successLight,
    warning: colors.warningLight,
    danger: colors.dangerLight,
  }[variant]

  const textColor = {
    default: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[variant]

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})
