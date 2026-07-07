'use client'

import { numberToIndianWords } from '@/lib/numberToWords'
import { formatDateDDMonthYYYY, MONTHS } from '@/lib/utils'
import type { PayslipPreviewProps } from '@/types'

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPeriodPart(dateStr: string, withYear: boolean): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const mon = MONTHS[d.getMonth()]?.slice(0, 3) ?? ''
  if (withYear) return `${day} ${mon} ${d.getFullYear()}`
  return `${day} ${mon}`
}

const cellLabel: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: '#9ca3af',
  letterSpacing: '0.5px',
  marginBottom: 3,
}

const cellValue: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#111827',
}

function GridCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={cellLabel}>{label}</div>
      <div style={cellValue}>{value || '—'}</div>
    </div>
  )
}

export default function PayslipPreviewT3({
  employee,
  settings,
  calc,
  month,
  year,
  customDeductions,
  payDate,
  fromDate,
  toDate,
}: PayslipPreviewProps) {
  if (!employee || !calc) {
    return (
      <div
        id="printable-document"
        style={{
          width: '100%',
          minHeight: '1123px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Select an employee to preview payslip
      </div>
    )
  }

  const emp = employee
  const c = calc
  const contactLine = [settings.phone, settings.email].filter(Boolean).join(' | ')
  const payPeriod = `${fmtPeriodPart(fromDate, false)} to ${fmtPeriodPart(toDate, true)}`

  const earnTh: React.CSSProperties = {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#9ca3af',
    borderBottom: '1px solid #e5e7eb',
    padding: '6px 4px',
    backgroundColor: '#ffffff',
    textAlign: 'left',
  }

  const earnTd: React.CSSProperties = {
    padding: '6px 4px',
    fontSize: 11,
    borderBottom: '1px solid #f3f4f6',
  }

  return (
    <div
      id="printable-document"
      className="payslip-t3-root"
      style={{
        width: '100%',
        minHeight: '1123px',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        className="payslip-t3-page"
        style={{
          width: '794px',
          minHeight: '1123px',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '12px',
          color: '#111827',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          paddingBottom: 8,
        }}
      >
      <div
        style={{
          backgroundColor: '#111827',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Logo"
              style={{ height: 56, objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
              {settings.company_name || 'Company'}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '4px',
            }}
          >
            PAYSLIP
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#9ca3af',
              letterSpacing: '2px',
              marginTop: 4,
            }}
          >
            FOR THE MONTH OF {month.toUpperCase()} {year}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#f9fafb',
          padding: '14px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '3px solid #f97316',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
            {settings.company_name || 'Company Name'}
          </div>
          {settings.address ? (
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{settings.address}</div>
          ) : null}
          {contactLine ? (
            <div style={{ fontSize: 11, color: '#6b7280' }}>{contactLine}</div>
          ) : null}
        </div>
        <div
          style={{
            backgroundColor: '#f97316',
            borderRadius: 8,
            padding: '12px 20px',
            textAlign: 'center',
            minWidth: 160,
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: '#ffffff',
              letterSpacing: '1px',
            }}
          >
            NET PAY
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff' }}>{fmt(c.netPay)}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
            for {c.effectivePaidDays} days
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '14px 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <GridCell label="Employee Name" value={emp.name} />
        <GridCell label="Employee ID" value={emp.employee_id} />
        <GridCell label="Designation" value={emp.designation} />
        <GridCell label="Department" value={emp.department} />
        <GridCell label="Pay Period" value={payPeriod} />
        <GridCell label="Pay Date" value={formatDateDDMonthYYYY(payDate)} />
        <GridCell label="Bank" value={emp.bank_name} />
        <GridCell label="A/C Number" value={emp.bank_account} />
      </div>

      <div
        style={{
          padding: '8px 40px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: 32,
          fontSize: 11,
          color: '#6b7280',
        }}
      >
        PAN: {emp.pan_number} | PF: {emp.pf_number} | UAN: {emp.uan} | Mode: {emp.payment_mode} |
        LOP: {c.lopDays} days
      </div>

      <div
        className="payslip-t3-body"
        style={{
          padding: '16px 40px',
          display: 'flex',
          gap: 32,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              fontWeight: 700,
              color: '#111827',
              borderBottom: '2px solid #111827',
              paddingBottom: 6,
              marginBottom: 0,
            }}
          >
            EARNINGS
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={earnTh}>COMPONENT</th>
                <th style={{ ...earnTh, textAlign: 'right' }}>STANDARD</th>
                <th style={{ ...earnTh, textAlign: 'right' }}>ACTUAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={earnTd}>Basic Salary</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.stdBasic)}</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.actualBasic)}</td>
              </tr>
              <tr>
                <td style={earnTd}>House Rent Allow.</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.stdHRA)}</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.actualHRA)}</td>
              </tr>
              <tr>
                <td style={earnTd}>Medical Allowance</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.stdMedical)}</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.actualMedical)}</td>
              </tr>
              <tr>
                <td style={earnTd}>Conveyance Allowance</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.stdConveyance)}</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.actualConveyance)}</td>
              </tr>
              <tr>
                <td style={earnTd}>Special Allowance</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.stdSpecial)}</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.actualSpecial)}</td>
              </tr>
              {c.finalSettlement > 0 ? (
                <tr>
                  <td style={earnTd}>Final Settlement</td>
                  <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.finalSettlement)}</td>
                  <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.finalSettlement)}</td>
                </tr>
              ) : null}
              <tr>
                <td
                  style={{
                    padding: '10px 4px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderTop: '2px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  GROSS EARNINGS
                </td>
                <td
                  style={{
                    padding: '10px 4px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderTop: '2px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    textAlign: 'right',
                  }}
                />
                <td
                  style={{
                    padding: '10px 4px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderTop: '2px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    textAlign: 'right',
                  }}
                >
                  {fmt(c.totalEarningsA)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              fontWeight: 700,
              color: '#111827',
              borderBottom: '2px solid #111827',
              paddingBottom: 6,
              marginBottom: 0,
            }}
          >
            DEDUCTIONS
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={earnTh}>COMPONENT</th>
                <th style={{ ...earnTh, textAlign: 'right' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={earnTd}>Provident Fund (12% of Basic)</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.pfEmployee)}</td>
              </tr>
              <tr>
                <td style={earnTd}>Professional Tax</td>
                <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(c.professionalTax)}</td>
              </tr>
              {customDeductions.map((d, i) =>
                d.label ? (
                  <tr key={i}>
                    <td style={earnTd}>{d.label}</td>
                    <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(Number(d.amount) || 0)}</td>
                  </tr>
                ) : null
              )}
              <tr>
                <td
                  style={{
                    padding: '10px 4px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderTop: '2px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  TOTAL DEDUCTIONS
                </td>
                <td
                  style={{
                    padding: '10px 4px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderTop: '2px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    textAlign: 'right',
                  }}
                >
                  {fmt(c.totalDeductions)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {c.reimbursements.length > 0 ? (
        <div style={{ padding: '0 40px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>REIMBURSEMENTS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {c.reimbursements.map((r, i) => (
                <tr key={i}>
                  <td style={earnTd}>{r.label}</td>
                  <td style={{ ...earnTd, textAlign: 'right' }}>{fmt(r.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...earnTd, fontWeight: 700 }}>TOTAL REIMBURSEMENTS</td>
                <td style={{ ...earnTd, textAlign: 'right', fontWeight: 700 }}>
                  {fmt(c.totalReimbursementsD)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      <div
        className="payslip-t3-net-row"
        style={{
          margin: '0 40px',
          borderTop: '2px solid #111827',
          paddingTop: 8,
          paddingBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>TOTAL NET PAYABLE</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
            Gross Earnings - Total Deductions
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{fmt(c.netPay)}</div>
      </div>

      <div
        style={{
          margin: '0 40px 8px',
          padding: '6px 14px',
          backgroundColor: '#f9fafb',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          fontSize: 11,
          fontStyle: 'italic',
          color: '#6b7280',
        }}
      >
        Amount in Words: {numberToIndianWords(c.netPay)}
      </div>

      <div
        style={{
          padding: '0 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 8,
        }}
      >
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 6, width: 160 }}>
          <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>Employee Signature</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {settings.signature_url ? (
            <img
              src={settings.signature_url}
              alt="Signature"
              style={{ height: 44, objectFit: 'contain', display: 'block', marginBottom: 4 }}
            />
          ) : null}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
            {settings.signatory_name}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{settings.signatory_designation}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{settings.company_name}</div>
        </div>
      </div>

      <div
        className="payslip-t3-footer"
        style={{
          backgroundColor: '#111827',
          padding: '10px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          color: '#9ca3af',
          flexShrink: 0,
          marginTop: 12,
        }}
      >
        <span>This is a system generated payslip and doesn&apos;t need a signature</span>
        <span>Page No: 1 of 1</span>
      </div>
      </div>
    </div>
  )
}
