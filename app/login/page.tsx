'use client'

import { Suspense } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import LoginForm from '@/components/LoginForm'
import MuiProvider from '@/components/MuiProvider'

function LoginFallback() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  )
}

export default function LoginPage() {
  return (
    <MuiProvider>
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </MuiProvider>
  )
}
