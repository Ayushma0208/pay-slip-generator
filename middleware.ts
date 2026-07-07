import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const adminRoutes = ['/employees', '/payslip', '/letters', '/settings', '/admin']
const employeeRoutes = ['/employee']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    if (pathname === '/login') {
      if (req.nextauth.token) {
        const dest = role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard'
        return NextResponse.redirect(new URL(dest, req.url))
      }
      return NextResponse.next()
    }

    if (role === 'EMPLOYEE') {
      const isAdminRoute = adminRoutes.some(
        (r) => pathname === r || pathname.startsWith(r + '/')
      )
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/employee/dashboard', req.url))
      }
    }

    if (role === 'ADMIN') {
      const isEmployeeOnly =
        employeeRoutes.some((r) => pathname === r || pathname.startsWith(r + '/')) &&
        !pathname.startsWith('/admin')
      if (isEmployeeOnly) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/login') return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/employees/:path*',
    '/payslip/:path*',
    '/letters/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/employee/:path*',
    '/login',
  ],
}
