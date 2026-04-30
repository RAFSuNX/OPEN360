import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
  return Buffer.from(hex, 'hex')
}

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(payload: string): string {
  const [ivHex, encryptedHex] = payload.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedText = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8')
}
