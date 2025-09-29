import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth'

// Rate limiting storage (in production, use Redis or similar)
const loginAttempts = new Map<string, { count: number, lastAttempt: number }>()
const MAX_ATTEMPTS_PER_IP = 10
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check IP rate limiting
    const ipAttempts = loginAttempts.get(clientIP)
    if (ipAttempts && ipAttempts.count >= MAX_ATTEMPTS_PER_IP) {
      const timeSinceLastAttempt = Date.now() - ipAttempts.lastAttempt
      if (timeSinceLastAttempt < LOCKOUT_TIME) {
        const lockoutRemaining = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 60000)
        return NextResponse.json(
          { error: `Too many login attempts. Please try again in ${lockoutRemaining} minutes.` },
          { status: 429 }
        )
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(clientIP)
      }
    }

    const { email, password } = await request.json()

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const authResult = await authenticateUser(email.trim(), password)

    if (!authResult.user) {
      // Increment IP attempts
      const currentAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 }
      loginAttempts.set(clientIP, {
        count: currentAttempts.count + 1,
        lastAttempt: Date.now()
      })

      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    // Clear IP attempts on successful login
    loginAttempts.delete(clientIP)

    const token = generateToken(authResult.user)

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role
      }
    })

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours (matching token expiration)
      path: '/'
    })

    // Set security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
