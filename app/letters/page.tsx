'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSettings } from '@/context/SettingsContext'
import type { Employee, LetterData } from '@/types'
import EmployeeSearch from '@/components/EmployeeSearch'
import LetterPreview from '@/components/LetterPreview'
import DocumentPreviewFrame from '@/components/DocumentPreviewFrame'
import PrintButton from '@/components/PrintButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, getErrorMessage } from '@/lib/utils'

function mapEmployee(row: Employee): Employee {
  return row
}

const today = new Date().toISOString().split('T')[0]

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="mb-3 border-b border-border pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {title}
    </p>
  )
}

export default function LettersPage() {
  const { settings } = useSettings()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected] = useState<Employee | null>(null)
  const [letter, setLetter] = useState<LetterData>({
    letter_type: 'relieving',
    letter_date: today,
    last_working_date: today,
  })
  const [generated, setGenerated] = useState(false)

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to load employees')
      const data = await res.json()
      setEmployees(data.map(mapEmployee))
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load employees'))
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const updateLetter = <K extends keyof LetterData>(key: K, value: LetterData[K]) => {
    setLetter((prev) => ({ ...prev, [key]: value }))
    setGenerated(false)
  }

  const handleGenerate = () => {
    if (!selected) {
      toast.error('Please select an employee')
      return
    }
    setGenerated(true)
    toast.success('Letter generated')
  }

  return (
    <div className="print:max-w-none">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Letter Generator
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Create relieving and experience certificates
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row print:block">
        <div className="w-full shrink-0 space-y-6 rounded-xl border border-border bg-background p-6 lg:w-[420px] lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto print:hidden">
          <div>
            <SectionHeader title="Letter Type" />
            <div className="flex gap-2">
              <Button
                type="button"
                variant={letter.letter_type === 'relieving' ? 'default' : 'secondary'}
                className={cn('flex-1')}
                onClick={() => updateLetter('letter_type', 'relieving')}
              >
                Relieving Letter
              </Button>
              <Button
                type="button"
                variant={letter.letter_type === 'experience' ? 'default' : 'secondary'}
                className={cn('flex-1')}
                onClick={() => updateLetter('letter_type', 'experience')}
              >
                Experience Letter
              </Button>
            </div>
          </div>

          <div>
            <SectionHeader title="Employee" />
            <EmployeeSearch
              employees={employees}
              selected={selected}
              onSelect={(emp) => {
                setSelected(emp)
                setGenerated(false)
              }}
            />
          </div>

          <div>
            <SectionHeader title="Dates" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Letter Date</Label>
                <Input
                  type="date"
                  value={letter.letter_date}
                  onChange={(e) => updateLetter('letter_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Working Date</Label>
                <Input
                  type="date"
                  value={letter.last_working_date}
                  onChange={(e) => updateLetter('last_working_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button className="w-full" onClick={handleGenerate}>
              Generate Letter
            </Button>
            {generated && <PrintButton />}
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:sticky lg:top-8 lg:self-start print:w-full">
          <DocumentPreviewFrame>
            <LetterPreview employee={selected} settings={settings} letter={letter} />
          </DocumentPreviewFrame>
        </div>
      </div>
    </div>
  )
}
