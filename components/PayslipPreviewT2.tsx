'use client'

import { numberToIndianWords } from '@/lib/numberToWords'
import { formatDateDDMonthYYYY } from '@/lib/utils'
import type { PayslipPreviewProps } from '@/types'

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: '#9ca3af',
  letterSpacing: '0.5px',
  marginBottom: 2,
}

const valueStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#1a1a1a',
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || '—'}</div>
    </div>
  )
}

export default function PayslipPreviewT2({
  employee,
  settings,
  calc,
  month,
  year,
  customDeductions,
  payDate,
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
          backgroundColor: '#fafaf8',
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        Select an employee to preview payslip
      </div>
    )
  }

  const emp = employee
  const c = calc
  const monthTag = `#${month.slice(0, 3).toUpperCase()}${year}`
  const contactLine = [settings.phone, settings.email].filter(Boolean).join(' | ')

  const thRow: React.CSSProperties = {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#9ca3af',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e5e7eb',
    padding: '6px 0',
    textAlign: 'left',
  }

  const tdRow: React.CSSProperties = {
    padding: '5px 0',
    fontSize: 11,
    borderBottom: '1px solid #f3f4f6',
  }

  return (
    <div
      id="printable-document"
      className="payslip-t2-root"
      style={{
        width: '100%',
        minHeight: '1123px',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#fafaf8',
      }}
    >
      <div
        className="payslip-t2-page"
        style={{
          width: '794px',
          minHeight: '1123px',
          backgroundColor: '#ffffff',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: '12px',
          color: '#1a1a1a',
          padding: '36px 52px',
          paddingBottom: '48px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
            flexShrink: 0,
          }}
        >
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Company Logo"
              style={{
                height: '68px',
                width: 'auto',
                maxWidth: '200px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#1a1a1a',
              }}
            >
              {settings.company_name}
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '4px',
                color: '#1a1a1a',
              }}
            >
              PAYSLIP
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{monthTag}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a', marginBottom: 16, flexShrink: 0 }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16,
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: '#9ca3af',
                letterSpacing: '1px',
                marginBottom: 4,
              }}
            >
              PAYSLIP FOR:
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
              {settings.company_name || 'Company Name'}
            </div>
            {settings.address ? (
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>{settings.address}</div>
            ) : null}
            {contactLine ? (
              <div style={{ fontSize: 11, color: '#6b7280' }}>{contactLine}</div>
            ) : null}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: '#9ca3af',
                letterSpacing: '1px',
                marginBottom: 4,
              }}
            >
              PAY PERIOD:
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {month} {year}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              Pay Date: {formatDateDDMonthYYYY(payDate)}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              Days: {c.effectivePaidDays} days (LOP: {c.lopDays})
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px 24px',
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          <Field label="Employee Name" value={emp.name} />
          <Field label="Employee ID" value={emp.employee_id} />
          <Field label="Designation" value={emp.designation} />
          <Field label="Department" value={emp.department} />
          <Field label="Date of Joining" value={formatDateDDMonthYYYY(emp.joining_date)} />
          <Field label="Payment Mode" value={emp.payment_mode} />
          <Field label="Bank Name" value={emp.bank_name} />
          <Field label="Bank Account" value={emp.bank_account} />
          <Field label="PAN Number" value={emp.pan_number} />
          <Field label="PF Number" value={emp.pf_number} />
        </div>

        <div className="payslip-t2-body" style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#9ca3af',
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            EARNINGS
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thRow}>DESCRIPTION</th>
                <th style={{ ...thRow, textAlign: 'right' }}>STANDARD</th>
                <th style={{ ...thRow, textAlign: 'right' }}>ACTUAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdRow}>Basic Salary</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.stdBasic)}</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.actualBasic)}</td>
              </tr>
              <tr>
                <td style={tdRow}>House Rent Allowance</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.stdHRA)}</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.actualHRA)}</td>
              </tr>
              <tr>
                <td style={tdRow}>Medical Allowance</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.stdMedical)}</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.actualMedical)}</td>
              </tr>
              <tr>
                <td style={tdRow}>Conveyance Allowance</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.stdConveyance)}</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.actualConveyance)}</td>
              </tr>
              <tr>
                <td style={tdRow}>Special Allowance</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.stdSpecial)}</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.actualSpecial)}</td>
              </tr>
              {c.finalSettlement > 0 ? (
                <tr>
                  <td style={tdRow}>Final Settlement</td>
                  <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.finalSettlement)}</td>
                  <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.finalSettlement)}</td>
                </tr>
              ) : null}
              <tr>
                <td
                  style={{
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderTop: '1px solid #1a1a1a',
                  }}
                >
                  GROSS EARNINGS
                </td>
                <td
                  style={{
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderTop: '1px solid #1a1a1a',
                    textAlign: 'right',
                  }}
                />
                <td
                  style={{
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderTop: '1px solid #1a1a1a',
                    textAlign: 'right',
                  }}
                >
                  {fmt(c.totalEarningsA)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#9ca3af',
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            DEDUCTIONS
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thRow}>DESCRIPTION</th>
                <th style={{ ...thRow, textAlign: 'right' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdRow}>Provident Fund (12% of Basic)</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.pfEmployee)}</td>
              </tr>
              <tr>
                <td style={tdRow}>Professional Tax</td>
                <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(c.professionalTax)}</td>
              </tr>
              {customDeductions.map((d, i) =>
                d.label ? (
                  <tr key={i}>
                    <td style={tdRow}>{d.label}</td>
                    <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(Number(d.amount) || 0)}</td>
                  </tr>
                ) : null
              )}
              <tr>
                <td
                  style={{
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderTop: '1px solid #1a1a1a',
                  }}
                >
                  TOTAL DEDUCTIONS
                </td>
                <td
                  style={{
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderTop: '1px solid #1a1a1a',
                    textAlign: 'right',
                  }}
                >
                  {fmt(c.totalDeductions)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {c.reimbursements.length > 0 ? (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#9ca3af',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              REIMBURSEMENTS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {c.reimbursements.map((r, i) => (
                  <tr key={i}>
                    <td style={tdRow}>{r.label}</td>
                    <td style={{ ...tdRow, textAlign: 'right' }}>{fmt(r.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td
                    style={{
                      padding: '10px 0',
                      fontSize: 12,
                      fontWeight: 700,
                      borderTop: '1px solid #1a1a1a',
                    }}
                  >
                    TOTAL REIMBURSEMENTS
                  </td>
                  <td
                    style={{
                      padding: '10px 0',
                      fontSize: 12,
                      fontWeight: 700,
                      borderTop: '1px solid #1a1a1a',
                      textAlign: 'right',
                    }}
                  >
                    {fmt(c.totalReimbursementsD)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}

        <div
          style={{
            borderTop: '2px solid #1a1a1a',
            paddingTop: 10,
            paddingBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#9ca3af',
              }}
            >
              TOTAL NET PAYABLE
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>
              {fmt(c.netPay)}
            </div>
          </div>
          <div style={{ maxWidth: 280, textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>Amount in Words:</div>
            <div style={{ fontSize: 11, fontStyle: 'italic', color: '#1a1a1a', marginTop: 4 }}>
              {numberToIndianWords(c.netPay)}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: 8,
            marginBottom: 14,
            fontSize: 11,
            color: '#6b7280',
          }}
        >
          Bank: {emp.bank_name} | A/C: {emp.bank_account} | PAN: {emp.pan_number} | Mode:{' '}
          {emp.payment_mode}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 10,
          }}
        >
          <div style={{ textAlign: 'right' }}>
            {settings.signature_url ? (
              <img
                src={settings.signature_url}
                alt="Signature"
                style={{ height: 40, objectFit: 'contain', display: 'block', marginBottom: 4 }}
              />
            ) : null}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
              {settings.signatory_name}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{settings.signatory_designation}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{settings.company_name}</div>
          </div>
        </div>

        <div
          className="payslip-t2-footer"
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: '#9ca3af',
            fontStyle: 'italic',
            flexShrink: 0,
            marginTop: 16,
          }}
        >
          <span>This is a system generated payslip and doesn&apos;t need a signature</span>
          <span>Page No: 1 of 1</span>
        </div>
      </div>
    </div>
  )
}
