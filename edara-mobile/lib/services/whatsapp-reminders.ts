import { Linking } from 'react-native'

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '965' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 8) {
      cleaned = '965' + cleaned
    }
  } else {
    cleaned = cleaned.slice(1)
  }
  return cleaned
}

export async function openWhatsApp(phone: string, message: string) {
  const normalized = normalizePhone(phone)
  const url = `whatsapp://send?phone=${normalized}&text=${encodeURIComponent(message)}`
  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) {
    await Linking.openURL(url)
  } else {
    await Linking.openURL(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`)
  }
}
