import { encrypt, decrypt } from '@/lib/crypto'

process.env.ENCRYPTION_KEY = 'a'.repeat(64) // 32 bytes hex

describe('crypto', () => {
  it('encrypts a string and decrypts it back', () => {
    const original = 'This is a secret review response'
    const encrypted = encrypt(original)
    expect(encrypted).not.toBe(original)
    expect(decrypt(encrypted)).toBe(original)
  })

  it('produces different ciphertext for same input (random IV)', () => {
    const text = 'same input'
    expect(encrypt(text)).not.toBe(encrypt(text))
  })

  it('decrypts correctly after multiple encrypt/decrypt cycles', () => {
    const text = 'Round trip test'
    expect(decrypt(encrypt(text))).toBe(text)
  })

  it('throws if ENCRYPTION_KEY is wrong length', () => {
    const original = process.env.ENCRYPTION_KEY
    try {
      process.env.ENCRYPTION_KEY = 'tooshort'
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be 64 hex chars')
    } finally {
      process.env.ENCRYPTION_KEY = original
    }
  })
})
