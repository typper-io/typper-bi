import * as crypto from 'crypto'

export const generateSecurePassword = ({
  length = 30,
}: {
  length?: number
}) => {
  if (length < 4) {
    throw new Error('Password length must be at least 4 characters')
  }

  const charset = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
  }

  const getRandomChar = (category: string) => {
    const chars = charset[category]
    return chars[crypto.randomBytes(1)[0] % chars.length]
  }

  const passwordParts = []
  for (let i = 0; i < length; i++) {
    const category = Object.keys(charset)[crypto.randomBytes(1)[0] % 4]
    passwordParts.push(getRandomChar(category))
  }

  const shuffledPassword = shuffleArray(passwordParts).join('')

  return shuffledPassword
}

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
