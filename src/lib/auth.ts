import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}
export function verifyToken(token?: string) {
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}
