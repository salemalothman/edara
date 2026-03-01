import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native'
import { useTheme } from '../../contexts/theme-context'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  icon?: React.ReactNode
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, icon }: ButtonProps) {
  const { colors } = useTheme()

  const bgColor = {
    primary: colors.primary,
    secondary: colors.inputBackground,
    danger: colors.danger,
    ghost: 'transparent',
  }[variant]

  const textColor = {
    primary: '#ffffff',
    secondary: colors.text,
    danger: '#ffffff',
    ghost: colors.primary,
  }[variant]

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor }, icon ? { marginStart: 8 } : undefined]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
})
