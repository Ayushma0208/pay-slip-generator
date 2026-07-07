'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Users,
  FileText,
  Mail,
  Settings,
  LayoutDashboard,
  Clock,
  CalendarDays,
  LogOut,
  ClipboardList,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/payslip', label: 'Payslip', icon: FileText },
  { href: '/letters', label: 'Letters', icon: Mail },
  { href: '/admin/attendance', label: 'Attendance', icon: Clock },
  { href: '/admin/leaves', label: 'Leave Requests', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const employeeNav = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/attendance', label: 'Attendance', icon: Clock },
  { href: '/employee/leaves', label: 'My Leaves', icon: CalendarDays },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const navItems = session?.user?.role === 'ADMIN' ? adminNav : employeeNav

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-background print:hidden">
      <div className="px-4 pb-4 pt-5">
        <h1 className="text-[15px] font-bold text-text-primary">PayGen</h1>
        <p className="mt-0.5 text-[11px] text-text-muted">
          {session?.user?.role === 'ADMIN' ? 'Admin Panel' : 'Employee Portal'}
        </p>
      </div>
      <div className="mb-2 border-b border-border" />
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md py-2 pl-3 pr-3 text-[13px] transition-colors duration-150',
                active
                  ? 'border-l-[3px] border-l-accent bg-accent-light pl-[9px] font-semibold text-accent'
                  : 'border-l-[3px] border-l-transparent text-text-secondary hover:bg-accent-light hover:text-accent'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-3">
        <p className="mb-2 truncate text-[11px] text-text-muted">{session?.user?.email}</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
