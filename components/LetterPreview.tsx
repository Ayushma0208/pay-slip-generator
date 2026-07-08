'use client'

import { resolveDocumentFont, resolveDocumentFontZoom } from '@/lib/documentFonts'
import { formatDateDDMonthYYYY } from '@/lib/utils'
import type { Employee, LetterData, Settings } from '@/types'

interface LetterPreviewProps {
  employee: Employee | null
  settings: Settings
  letter: LetterData
  /** Optional per-generation font override (does not require changing Settings). */
  documentFontOverride?: string
}

export default function LetterPreview({
  employee,
  settings,
  letter,
  documentFontOverride,
}: LetterPreviewProps) {
  const fontFamily = resolveDocumentFont(documentFontOverride ?? settings.document_font)
  const documentZoom = resolveDocumentFontZoom(settings.document_font_size)

  const wrapperStyle: React.CSSProperties = {
    width: 794,
    maxWidth: '100%',
    height: 'auto',
    maxHeight: 1123,
    backgroundColor: '#ffffff',
    fontFamily,
    padding: '40px 48px 36px',
    boxSizing: 'border-box',
    color: '#111827',
    fontSize: 13,
    lineHeight: 1.55,
    position: 'relative',
    overflow: 'hidden',
  }

  const pStyle: React.CSSProperties = {
    margin: '0 0 12px 0',
    textAlign: 'justify',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  }

  if (!employee) {
    return (
      <div
        id="printable-document"
        className="letter-root"
        style={{
          zoom: documentZoom,
        }}
      >
        <div
          style={{
            ...wrapperStyle,
            minHeight: 280,
            textAlign: 'center',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Select an employee to preview letter
        </div>
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
    <div id="printable-document" className="letter-root" style={{ zoom: documentZoom }}>
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
                style={{ height: 40, objectFit: 'contain', flexShrink: 0 }}
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
            marginTop: 16,
            marginBottom: 20,
            width: '100%',
          }}
        />

        <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          {letterDate}
        </div>

        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{employee.name}</div>
        <div
          style={{
            fontSize: 12,
            color: '#6b7280',
            fontWeight: 400,
            marginBottom: 16,
          }}
        >
          Employee ID: {employee.employee_id}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'underline',
            marginBottom: 14,
          }}
        >
          {subject}
        </div>

        <div style={{ marginBottom: 12 }}>Dear {employee.name},</div>

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

        <div style={{ marginTop: 24, marginBottom: 20 }}>Yours sincerely,</div>

        <div>
          {settings.signature_url && (
            <img
              src={settings.signature_url}
              alt="Signature"
              style={{ height: 44, objectFit: 'contain', display: 'block' }}
            />
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 6 }}>
            {settings.signatory_name}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{settings.signatory_designation}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{company}</div>
        </div>

        <div
          className="letter-footer"
          style={{
            marginTop: 28,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 10,
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
