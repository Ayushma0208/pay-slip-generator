'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      const messages: Record<string, string> = {
        CredentialsSignin: 'Invalid email or password',
        Configuration: 'Server configuration error. Restart the dev server and try again.',
        Default: 'Sign in failed. Please try again.',
      }
      toast.error(messages[error] ?? messages.Default)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
        return
      }

      router.push(searchParams.get('callbackUrl') || '/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f8fafc' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #EB3514 100%)',
          color: '#fff',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 8,
          py: 6,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            PayGen
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, maxWidth: 420, lineHeight: 1.2 }}>
          Payroll & HR, simplified.
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 400, lineHeight: 1.7 }}>
          Manage employees, attendance, leave requests, and generate payslips — all in one place.
        </Typography>
        <Box sx={{ mt: 6, display: 'flex', gap: 4 }}>
          {['Payslips', 'Attendance', 'Leave Mgmt'].map((item) => (
            <Typography key={item} variant="body2" sx={{ opacity: 0.7 }}>
              • {item}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
            <DescriptionOutlinedIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              PayGen
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sign in with your work email and password
          </Typography>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                <TextField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                  sx={{ mt: 1, py: 1.4, fontSize: '1rem' }}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 3 }}
          >
            Contact your administrator if you need access or a password reset.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
