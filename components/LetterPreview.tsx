'use client'

import { formatDateDDMonthYYYY } from '@/lib/utils'
import type { Employee, LetterData, Settings } from '@/types'

interface LetterPreviewProps {
  employee: Employee | null
  settings: Settings
  letter: LetterData
}

export default function LetterPreview({ employee, settings, letter }: LetterPreviewProps) {
  const wrapperStyle: React.CSSProperties = {
    width: 794,
    minHeight: 1123,
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, Helvetica, sans-serif',
    padding: '48px 56px',
    paddingBottom: 56,
    boxSizing: 'border-box',
    color: '#111827',
    fontSize: 13,
    lineHeight: 1.8,
    position: 'relative',
    overflow: 'visible',
    maxWidth: '100%',
  }

  const pStyle: React.CSSProperties = {
    margin: '0 0 16px 0',
    textAlign: 'justify',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  }

  if (!employee) {
    return (
      <div
        id="printable-document"
        className="letter-root"
        style={{ ...wrapperStyle, textAlign: 'center', color: '#6b7280' }}
      >
        Select an employee to preview letter
      </div>
    )
  }

  const company = settings.company_name || 'Company Name'
  const joining = formatDateDDMonthYYYY(employee.joining_date)
  const lastWorking = formatDateDDMonthYYYY(letter.last_working_date)
  const letterDate = formatDateDDMonthYYYY(letter.letter_date)
  const isRelieving = letter.letter_type === 'relieving'
  const subject = isRelieving
    ? 'Subject: Relieving Letter'
    : 'Subject: Experience Certificate'

  return (
    <div id="printable-document" className="letter-root">
      <div className="letter-page" style={wrapperStyle}>
        {/* Letterhead */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {settings.logo_url && (
              <img
                src={settings.logo_url}
                alt="Logo"
                style={{ height: 44, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1, maxWidth: '100%' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{company}</div>
              <div
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  marginTop: 2,
                  maxWidth: 320,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {settings.address}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {[settings.phone, settings.email].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 0,
            borderTop: '2px solid #111827',
            marginTop: 20,
            marginBottom: 32,
            width: '100%',
          }}
        />

        <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
          {letterDate}
        </div>

        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{employee.name}</div>
        <div
          style={{
            fontSize: 12,
            color: '#6b7280',
            fontWeight: 400,
            marginBottom: 24,
          }}
        >
          Employee ID: {employee.employee_id}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'underline',
            marginBottom: 20,
          }}
        >
          {subject}
        </div>

        <div style={{ marginBottom: 16 }}>Dear {employee.name},</div>

        {isRelieving ? (
          <>
            <p style={pStyle}>
              This is to inform you that your resignation has been accepted and you are hereby
              relieved from your duties as <strong>{employee.designation || '—'}</strong> at{' '}
              <strong>{company}</strong>, effective <strong>{lastWorking}</strong>.
            </p>
            <p style={pStyle}>
              We acknowledge your association with us from <strong>{joining}</strong> to{' '}
              <strong>{lastWorking}</strong>. During your tenure, your professionalism,
              dedication, and contributions have been sincerely valued by the organization.
            </p>
            <p style={pStyle}>
              We wish you the very best in your future endeavors and hope you achieve great
              success in your career ahead.
            </p>
          </>
        ) : (
          <>
            <p style={pStyle}>
              This is to certify that <strong>{employee.name}</strong> (Employee ID:{' '}
              <strong>{employee.employee_id}</strong>) has successfully completed an internship
              at <strong>{company}</strong> from <strong>{joining}</strong> to{' '}
              <strong>{lastWorking}</strong>, serving as{' '}
              <strong>{employee.designation || '—'}</strong> in the{' '}
              <strong>{employee.department || '—'}</strong> department.
            </p>
            <p style={pStyle}>
              During this period, <strong>{employee.name}</strong> demonstrated excellent
              dedication, a strong work ethic, and made meaningful contributions to the team. We
              were impressed by their skills and commitment.
            </p>
            <p style={pStyle}>
              We wish <strong>{employee.name}</strong> all the best for their future and are
              confident they will excel in their career ahead.
            </p>
          </>
        )}

        <div style={{ marginTop: 32, marginBottom: 40 }}>Yours sincerely,</div>

        <div>
          {settings.signature_url && (
            <img
              src={settings.signature_url}
              alt="Signature"
              style={{ height: 48, objectFit: 'contain', display: 'block' }}
            />
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 8 }}>
            {settings.signatory_name}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{settings.signatory_designation}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{company}</div>
        </div>

        <div
          className="letter-footer"
          style={{
            marginTop: 40,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 12,
            textAlign: 'center',
            fontSize: 10,
            color: '#9ca3af',
            fontStyle: 'italic',
          }}
        >
          — This is a system generated document and doesn&apos;t need a signature. —
        </div>
      </div>
    </div>
  )
}
