'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Lock, Mail, Eye, EyeOff, Sparkles, Phone } from 'lucide-react'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      console.log('Attempting login with:', { email: data.email })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const result = await response.json()
      console.log('Login response:', { status: response.status, result })

      if (response.ok) {
        toast.success('Login realizado com sucesso! Redirecionando...')
        console.log('Login successful, redirecting...')
        
        setTimeout(() => {
          console.log('Redirecting to dashboard...')
          window.location.replace('/')
        }, 500)
      } else {
        console.error('Login failed:', result.error)
        toast.error(result.error || 'Falha no login')
      }
    } catch (error) {
      console.error('Network error during login:', error)
      toast.error('Erro de rede. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ontop-navy relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated background */}
      <div className="absolute inset-0 animated-gradient opacity-30"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-ontop-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-ontop-pink-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ontop-coral-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="glass-card p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-ontop-purple-500 to-ontop-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-ontop-purple-500/50">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="gradient-text">Welcome Back</span>
            </h1>
            <p className="text-gray-400 text-lg">Intelligent Phone Validation System</p>
          </div>

          {/* Demo Credentials */}
          <div className="glass-card-light p-4 mb-6 border-ontop-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-ontop-coral-400" />
              <p className="text-sm text-ontop-coral-400 font-semibold">Demo Credentials</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Admin Account:</p>
                <p className="text-xs text-gray-300">admin@whatsappvalidator.com</p>
                <p className="text-xs text-gray-300">password123</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400 font-medium">Demo User:</p>
                <p className="text-xs text-gray-300">demo@whatsappvalidator.com</p>
                <p className="text-xs text-gray-300">password123</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="input-field pl-11"
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-danger-400 text-sm mt-2">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger-400 text-sm mt-2">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary mt-6"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  Sign In Securely
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Powered by Amplemarket & Twilio APIs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
