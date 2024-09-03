import { createCipheriv, createDecipheriv } from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
const IV = Buffer.from(process.env.IV, 'hex')

export const encrypt = (text: string): string => {
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV)

  let encrypted = cipher.update(text)

  encrypted = Buffer.concat([encrypted, cipher.final()])

  return encrypted.toString('hex')
}

export const decrypt = (text: string): string => {
  const encryptedText = Buffer.from(text, 'hex')

  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    IV,
  )

  let decrypted = decipher.update(encryptedText)

  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}
