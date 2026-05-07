'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Truck, Mail, Phone, Eye, EyeOff, Shield } from 'lucide-react'
import AuthService from '@/services/auth'
import { useDispatch } from 'react-redux'
import { login } from '@/redux/slices/auth/authSlice'
import { useRouter } from 'next/navigation'

type AuthMethod = 'mobile-password' | 'mobile-otp' | 'email-password' | 'email-otp'

const LoginMain = () => {
  const dispatch=useDispatch();
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email-password')
  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
    password: '',
    otp: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSendOTP = async () => {
    setLoading(true)
    try {
      // Add your OTP sending logic here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setOtpSent(true)
      setError('')
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload={
        identifier:authMethod.includes('mobile')?formData.mobile:formData.email,
        password:formData.password,
      }
      const response=await AuthService.Login(payload)
      console.log('Login attempt with:', authMethod, formData)
      if(response?.status===200){
        const {tokens,user}=response.data?.data;
        localStorage.setItem('accessToken',tokens.accessToken)
        localStorage.setItem('refreshToken',tokens.refreshToken)
        localStorage.setItem('user',JSON.stringify(user))
        dispatch(login({
          user,
          tokens
        }))
        router.push('/dashboard')
      }

    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{
    const token=localStorage.getItem('accessToken');
    if(token){
      router.push('/dashboard')
    }
  },[])

  const getInputValue = () => {
    if (authMethod.includes('mobile')) return formData.mobile
    return formData.email
  }

  const getInputPlaceholder = () => {
    if (authMethod.includes('mobile')) return 'Enter your mobile number'
    return 'Enter your email address'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Turant Logistics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Admin Dashboard</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your admin dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Authentication Method Selection */}
            {/* <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="col-span-2 mb-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">Choose Login Method</Label>
              </div>
              
              <Button
                type="button"
                variant={authMethod === 'mobile-password' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setAuthMethod('mobile-password')
                  setOtpSent(false)
                  setError('')
                }}
                className="text-xs h-8"
              >
                <Phone className="h-3 w-3 mr-1" />
                Mobile + Password
              </Button>

              <Button
                type="button"
                variant={authMethod === 'mobile-otp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setAuthMethod('mobile-otp')
                  setOtpSent(false)
                  setError('')
                }}
                className="text-xs h-8"
              >
                <Phone className="h-3 w-3 mr-1" />
                Mobile + OTP
              </Button>

              <Button
                type="button"
                variant={authMethod === 'email-password' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setAuthMethod('email-password')
                  setOtpSent(false)
                  setError('')
                }}
                className="text-xs h-8"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email + Password
              </Button>

              <Button
                type="button"
                variant={authMethod === 'email-otp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setAuthMethod('email-otp')
                  setOtpSent(false)
                  setError('')
                }}
                className="text-xs h-8"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email + OTP
              </Button>
            </div> */}

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Mobile/Email Input */}
              <div className="space-y-2">
                <Label htmlFor="contact">
                  {authMethod.includes('mobile') ? 'Mobile Number' : 'Email Address'}
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-3">
                    {authMethod.includes('mobile') ? (
                      <Phone className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Mail className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <Input
                    id="contact"
                    type={authMethod.includes('mobile') ? 'tel' : 'email'}
                    placeholder={getInputPlaceholder()}
                    value={getInputValue()}
                    onChange={(e) => handleInputChange(
                      authMethod.includes('mobile') ? 'mobile' : 'email',
                      e.target.value
                    )}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password Input (for password methods) */}
              {authMethod.includes('password') && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3">
                      <Shield className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* OTP Section (for OTP methods) */}
              {authMethod.includes('otp') && (
                <div className="space-y-2">
                  {!otpSent ? (
                    <Button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading || !getInputValue()}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <div className="flex gap-2">
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={formData.otp}
                          onChange={(e) => handleInputChange('otp', e.target.value)}
                          maxLength={6}
                          className="flex-1"
                          required
                        />
                        <Button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                        >
                          Resend
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || (authMethod.includes('otp') && !otpSent)}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Forgot Password Link (only for password methods) */}
              {authMethod.includes('password') && (
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500 underline"
                    onClick={() => {
                      // Add forgot password logic
                      console.log('Forgot password clicked')
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2026 Turant Logistics. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginMain