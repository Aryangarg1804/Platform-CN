import { verifyToken } from './auth'

interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'round-head' | 'public'
  roundAssigned?: number
}

// Get user from Authorization header
export function getUserFromHeader(authHeader?: string | null): AuthUser | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const user = verifyToken(token)
  return user as AuthUser | null
}

// Check if user can access this round (admin can access any round)
export function canAccessRound(user: AuthUser | null, roundNumber: number): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role === 'round-head' && user.roundAssigned === roundNumber) return true
  return false
}

// Extract round number from round-N string
export function getRoundNumber(roundStr: string): number {
  const match = (roundStr || '').match(/round-(\d+)/)
  return match ? Number(match[1]) : 1
}