import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: string
}

interface StoredUser extends User {
  password: string
  lastLogin?: string
  loginAttempts: number
  lockedUntil?: string
}

// In a real app, this would be stored in a database with proper encryption
const DEMO_USERS: StoredUser[] = [
  {
    id: '1',
    email: 'admin@whatsappvalidator.com',
    name: 'Administrator',
    role: 'admin',
    password: '$2a$12$y7e0hpRr6aYMHaVhHuK8R.jwE27tE9h7RjFZEknInrZhzRqin04aW', // 'password123'
    createdAt: new Date().toISOString(),
    loginAttempts: 0
  },
  {
    id: '2', 
    email: 'demo@whatsappvalidator.com',
    name: 'Demo User',
    role: 'user',
    password: '$2a$12$y7e0hpRr6aYMHaVhHuK8R.jwE27tE9h7RjFZEknInrZhzRqin04aW', // 'password123'
    createdAt: new Date().toISOString(),
    loginAttempts: 0
  }
]

// Rate limiting for login attempts
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_TIME = 30 * 60 * 1000 // 30 minutes

export async function authenticateUser(email: string, password: string): Promise<{ user: User | null, error?: string }> {
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
  
  if (!user) {
    return { user: null, error: 'Invalid credentials' }
  }
  
  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const lockTimeRemaining = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000)
    return { user: null, error: `Account locked. Try again in ${lockTimeRemaining} minutes.` }
  }
  
  const isValid = await bcrypt.compare(password, user.password)
  
  if (!isValid) {
    // Increment login attempts
    user.loginAttempts += 1
    
    // Lock account if too many attempts
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_TIME).toISOString()
      return { user: null, error: 'Too many failed attempts. Account locked for 30 minutes.' }
    }
    
    return { user: null, error: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - user.loginAttempts} attempts remaining.` }
  }
  
  // Reset login attempts on successful login
  user.loginAttempts = 0
  user.lockedUntil = undefined
  user.lastLogin = new Date().toISOString()
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    }
  }
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { 
      expiresIn: '8h', // Shorter expiration for better security
      issuer: 'whatsapp-validator',
      audience: 'whatsapp-validator-users'
    }
  )
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'whatsapp-validator',
      audience: 'whatsapp-validator-users'
    }) as any
    
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      createdAt: decoded.createdAt || new Date().toISOString()
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Password strength validation
export function validatePasswordStrength(password: string): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Generate secure random password
export function generateSecurePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

// Session management
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.exp) return true
    
    const expirationTime = decoded.exp * 1000
    const currentTime = Date.now()
    const timeUntilExpiry = expirationTime - currentTime
    
    // Return true if token expires in less than 1 hour
    return timeUntilExpiry < 60 * 60 * 1000
  } catch {
    return true
  }
}

// Create a user (for future use)
export async function createUser(email: string, name: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> {
  const hashedPassword = await hashPassword(password)
  
  const newUser: StoredUser = {
    id: Date.now().toString(),
    email: email.toLowerCase(),
    name,
    role,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    loginAttempts: 0
  }
  
  // In a real app, save to database
  DEMO_USERS.push(newUser)
  
  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    createdAt: newUser.createdAt
  }
}
