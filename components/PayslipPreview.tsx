'use client'

import { numberToIndianWords } from '@/lib/numberToWords'
import type { PayslipPreviewProps, Settings } from '@/types'

const FONT = 'Calibri, Arial, sans-serif'
const PAGE_W = 794

const FS = {
  body: 12,
  small: 11,
  title: 13,
  company: 16,
  footer: 11,
} as const

const pageWrap: React.CSSProperties = {
  width: PAGE_W,
  minHeight: 1123,
  position: 'relative',
  backgroundColor: '#fff',
  fontFamily: FONT,
  fontSize: FS.body,
  color: '#000',
  lineHeight: 1.35,
  padding: '40px 48px',
  paddingBottom: 52,
  boxSizing: 'border-box',
  margin: '0 auto',
  overflow: 'visible',
}

const contentShell: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  overflow: 'visible',
}

const mainBox: React.CSSProperties = {
  border: '1px solid #000',
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
}

const footerBox: React.CSSProperties = {
  border: '1px solid #000',
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 16px',
  fontSize: FS.footer,
  lineHeight: 1.35,
  marginTop: 8,
  backgroundColor: '#fff',
}

const pageNumberStyle: React.CSSProperties = {
  position: 'absolute',
  right: 48,
  bottom: 40,
  margin: 0,
  padding: 0,
  textAlign: 'right',
  fontSize: FS.footer,
  lineHeight: 1.35,
  whiteSpace: 'nowrap',
}

const empTd: React.CSSProperties = {
  padding: '3px 8px',
  border: 'none',
  fontSize: FS.small,
  verticalAlign: 'top',
  backgroundColor: '#fff',
  fontFamily: FONT,
}

const EMP_LABEL_PCT = [46, 44, 42] as const
const SUMMARY_LABEL_PCT = 22

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtJoin(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

function JustifiedField({
  label,
  value,
  labelPct,
  boldValue,
}: {
  label: string
  value: string
  labelPct: number
  boldValue?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'flex-start',
        lineHeight: 1.35,
        fontSize: FS.small,
      }}
    >
      <span style={{ width: `${labelPct}%`, fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ width: '5%', textAlign: 'center', flexShrink: 0 }}>:</span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontWeight: boldValue ? 700 : 400,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function earnColBorder(col: number): React.CSSProperties {
  return {
    borderLeft: col === 0 ? '1px solid #000' : 'none',
    borderRight: '1px solid #000',
    borderTop: 'none',
    borderBottom: 'none',
  }
}

function earnTh(col: number): React.CSSProperties {
  return {
    padding: '5px 8px',
    fontSize: FS.small,
    fontWeight: 700,
    textAlign: 'center',
    backgroundColor: '#fff',
    fontFamily: FONT,
    border: 'none',
    borderBottom: '1px solid #000',
    ...earnColBorder(col),
  }
}

function earnTd(col: number, extra?: React.CSSProperties): React.CSSProperties {
  return {
    padding: '4px 8px',
    fontSize: FS.small,
    backgroundColor: '#fff',
    fontFamily: FONT,
    border: 'none',
    verticalAlign: 'top',
    ...earnColBorder(col),
    ...extra,
  }
}

function CompanyHeader({ s }: { s: Settings }) {
  const emailTel = [s.email, s.phone].filter(Boolean).join(' | ')
  const addrLines = (s.address || '').split('\n').filter(Boolean)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
      }}
    >
      <div style={{ flexShrink: 0, marginRight: 12 }}>
        {s.logo_url ? (
          <img
            src={s.logo_url}
            alt="Logo"
            style={{ height: 64, objectFit: 'contain', display: 'block' }}
          />
        ) : null}
      </div>
      <div
        style={{
          textAlign: 'right',
          flex: 1,
          minWidth: 0,
          maxWidth: '58%',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        <div style={{ fontSize: FS.company, fontWeight: 700 }}>{s.company_name || 'Company Name'}</div>
        {addrLines.length > 0
          ? addrLines.map((line, i) => (
              <div key={i} style={{ fontSize: FS.small, lineHeight: 1.6 }}>
                {line}
              </div>
            ))
          : s.address ? (
              <div style={{ fontSize: FS.small, lineHeight: 1.6 }}>{s.address}</div>
            ) : null}
        {emailTel ? <div style={{ fontSize: FS.small, lineHeight: 1.6 }}>{emailTel}</div> : null}
        {s.website ? <div style={{ fontSize: FS.small, lineHeight: 1.6 }}>{s.website}</div> : null}
      </div>
    </div>
  )
}

type EmpCell = { label: string; value: string }

function chunkEmpRows(cells: EmpCell[]): EmpCell[][] {
  const rows: EmpCell[][] = []
  for (let i = 0; i < cells.length; i += 3) {
    rows.push([
      cells[i] ?? { label: '', value: '' },
      cells[i + 1] ?? { label: '', value: '' },
      cells[i + 2] ?? { label: '', value: '' },
    ])
  }
  return rows
}

const taxRows: [string, string, string, string][] = [
  ['Gross Salary', '0.00', 'House Rent Allowance', '0.00'],
  ['Income from other sources', '0.00', 'Standard Deductions', '0.00'],
  ['Annual taxable Perks', '0.00', 'Professional Tax', '0.00'],
  ['Total Income', '0.00', 'Housing Loan Interest (Section 24)', '0.00'],
  ['Total Exemptions', '0.00', 'Aggregate of Chapter VI-A', '0.00'],
  ['Total Taxable Income', '0.00', 'Others', '0.00'],
  ['Tax payable', '0.00', 'Total Exemptions', '0.00'],
  ['Surcharge & Cess Payable', '0.00', '', ''],
  ['Total tax Payable', '0.00', '', ''],
  ['Sec 89 Relief', '0.00', '', ''],
  ['Tax deducted up to last month', '0.00', '', ''],
  ['Tax deducted in current month', '0.00', '', ''],
  ['Total tax deducted till date', '0.00', '', ''],
  ['Balance tax payable', '0.00', '', ''],
]

export default function PayslipPreview({
  employee,
  settings,
  calc,
  month,
  year,
  showTaxPage,
  customDeductions,
}: PayslipPreviewProps) {
  if (!employee || !calc) {
    return (
      <div
        id="printable-document"
        style={{
          ...pageWrap,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
        }}
      >
        Select an employee to preview payslip
      </div>
    )
  }

  const emp = employee
  const c = calc
  const stdTotal = parseFloat(
    (c.stdBasic + c.stdHRA + c.stdMedical + c.stdConveyance + c.stdSpecial).toFixed(2)
  )
  const words = numberToIndianWords(c.netPay).toUpperCase()
  const fyEnd = String((parseInt(year, 10) || 0) + 1).slice(-2)
  const totalPages = showTaxPage ? 2 : 1

  const customFields = (settings.payslip_custom_fields || []).filter((f) => f.label || f.value)

  const empCells: EmpCell[] = [
    { label: 'Employee Code', value: emp.employee_id },
    { label: 'Payment Mode', value: emp.payment_mode },
    { label: 'Working Days', value: String(c.totalWorkingDays) },
    { label: 'Employee Name', value: emp.name },
    { label: 'Bank Name', value: emp.bank_name },
    { label: 'Payable Days', value: String(c.effectivePaidDays) },
    { label: 'Department', value: emp.department },
    { label: 'Bank Account', value: emp.bank_account },
    { label: 'LOP Days', value: String(c.lopDays) },
    { label: 'Date of Joining', value: fmtJoin(emp.joining_date) },
    { label: 'PAN Number', value: emp.pan_number },
    { label: '', value: '' },
    { label: 'PF Number', value: emp.pf_number },
    ...customFields.map((f) => ({ label: f.label, value: f.value })),
  ]

  const empRows = chunkEmpRows(empCells)

  const deds = [
    { label: 'Ee PF contribution', amount: c.pfEmployee },
    { label: 'Professional Tax', amount: c.professionalTax },
    ...customDeductions
      .filter((d) => d.label)
      .map((d) => ({ label: d.label, amount: Number(d.amount) || 0 })),
  ]

  const earns = [
    { l: 'Basic', s: c.stdBasic, a: c.actualBasic },
    { l: 'HRA', s: c.stdHRA, a: c.actualHRA },
    { l: 'Medical Allowance', s: c.stdMedical, a: c.actualMedical },
    { l: 'Conveyance Allowance', s: c.stdConveyance, a: c.actualConveyance },
    { l: 'Special Allowance', s: c.stdSpecial, a: c.actualSpecial },
    ...(c.finalSettlement > 0
      ? [{ l: 'Final Settlement', s: c.finalSettlement, a: c.finalSettlement }]
      : []),
  ]

  const rowN = Math.max(earns.length, deds.length, 3)

  function PageNumber({ page }: { page: number }) {
    return (
      <div className="payslip-t1-page-number" style={pageNumberStyle}>
        Page No: {page} of {totalPages}
      </div>
    )
  }

  function renderMainContent() {
    return (
      <>
        <CompanyHeader s={settings} />

        <div
          style={{
            textAlign: 'center',
            fontSize: FS.title,
            fontWeight: 700,
            padding: '4px 0 10px',
          }}
        >
          Payslip for the month of {month} {year}
        </div>

        <div style={mainBox}>
          <table
            className="emp-info-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: 'none',
              tableLayout: 'fixed',
              margin: 0,
            }}
          >
            <colgroup>
              <col style={{ width: '33%' }} />
              <col style={{ width: '37%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <tbody>
              {empRows.map((row, ri) => (
                <tr key={ri}>
                  {[0, 1, 2].map((ci) => {
                    const cell = row[ci]
                    const empty = !cell?.label
                    return (
                      <td key={ci} style={empTd}>
                        {empty ? null : (
                          <JustifiedField
                            label={cell.label}
                            value={cell.value}
                            labelPct={EMP_LABEL_PCT[ci as 0 | 1 | 2]}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: 'none',
              borderTop: '1px solid #000',
              tableLayout: 'fixed',
              margin: 0,
            }}
          >
            <colgroup>
              <col style={{ width: '35%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={earnTh(0)}>EARNINGS</th>
                <th style={earnTh(1)}>STANDARD</th>
                <th style={earnTh(2)}>ACTUAL AMOUNT</th>
                <th style={earnTh(3)}>DEDUCTIONS</th>
                <th style={earnTh(4)}>ACTUAL AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowN }).map((_, i) => {
                const e = earns[i]
                const d = deds[i]
                return (
                  <tr key={i}>
                    <td style={earnTd(0, { textAlign: 'left' })}>{e?.l ?? ''}</td>
                    <td style={earnTd(1, { textAlign: 'right' })}>{e ? fmt(e.s) : ''}</td>
                    <td style={earnTd(2, { textAlign: 'right' })}>{e ? fmt(e.a) : ''}</td>
                    <td style={earnTd(3, { textAlign: 'left' })}>{d?.label ?? ''}</td>
                    <td style={earnTd(4, { textAlign: 'right' })}>{d ? fmt(d.amount) : ''}</td>
                  </tr>
                )
              })}
              <tr>
                <td
                  style={earnTd(0, {
                    fontWeight: 700,
                    textAlign: 'left',
                    borderTop: '1px solid #000',
                    padding: '5px 8px',
                  })}
                >
                  Total :
                </td>
                <td
                  style={earnTd(1, {
                    fontWeight: 700,
                    textAlign: 'right',
                    borderTop: '1px solid #000',
                    padding: '5px 8px',
                  })}
                >
                  {fmt(stdTotal)}
                </td>
                <td
                  style={earnTd(2, {
                    fontWeight: 700,
                    textAlign: 'right',
                    borderTop: '1px solid #000',
                    padding: '5px 8px',
                  })}
                >
                  {fmt(c.totalEarningsA)}
                </td>
                <td
                  style={earnTd(3, {
                    borderTop: '1px solid #000',
                    padding: '5px 8px',
                  })}
                />
                <td
                  style={earnTd(4, {
                    fontWeight: 700,
                    textAlign: 'right',
                    borderTop: '1px solid #000',
                    padding: '5px 8px',
                  })}
                >
                  {fmt(c.totalDeductions)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #000', padding: '8px 16px 4px' }}>
            <JustifiedField label="CURRENCY" value="INR" labelPct={SUMMARY_LABEL_PCT} />
            <JustifiedField label="NET PAY" value={fmt(c.netPay)} labelPct={SUMMARY_LABEL_PCT} boldValue />
            <JustifiedField label="AMOUNT IN WORDS" value={words} labelPct={SUMMARY_LABEL_PCT} boldValue />
          </div>

          <div
            style={{
              padding: '4px 16px 8px',
              borderTop: '1px solid #000',
              fontSize: FS.small,
            }}
          >
            <span style={{ fontWeight: 700 }}>Salary details :</span>{' '}
            Fixed Monthly Salary : Rs {fmt(c.grossSalary)}
          </div>
        </div>

        <div style={footerBox}>
          This is a system generated payslip and doesn&apos;t need a signature
        </div>
      </>
    )
  }

  function renderTaxPage() {
    const taxCell: React.CSSProperties = {
      padding: '4px 8px',
      border: '1px solid #000',
      fontSize: FS.small,
      backgroundColor: '#fff',
      verticalAlign: 'top',
    }

    return (
      <div
        className="payslip-t1-page"
        style={{
          ...pageWrap,
          pageBreakBefore: 'always',
        }}
      >
        <div className="payslip-t1-content" style={contentShell}>
          <CompanyHeader s={settings} />
          <div style={{ borderTop: '1px solid #000', margin: '8px 0' }} />
          <div
            style={{
              textAlign: 'center',
              fontSize: FS.title,
              fontWeight: 700,
              padding: '4px 0 10px',
            }}
          >
            Projected Statement of Total Income Tax for the FY {year}-{fyEnd}
          </div>

          <div style={mainBox}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: 'none',
              }}
            >
              <thead>
                <tr>
                  <th colSpan={4} style={{ ...taxCell, textAlign: 'center', fontWeight: 700 }}>
                    TAX SUMMARY
                  </th>
                </tr>
                <tr>
                  <th style={{ ...taxCell, fontWeight: 700, width: '25%' }}>EARNINGS</th>
                  <th style={{ ...taxCell, width: '25%' }} />
                  <th style={{ ...taxCell, fontWeight: 700, width: '25%' }}>EXEMPTIONS</th>
                  <th style={{ ...taxCell, width: '25%' }} />
                </tr>
              </thead>
              <tbody>
                {taxRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...taxCell, fontWeight: 700 }}>{r[0]}</td>
                    <td style={{ ...taxCell, textAlign: 'right' }}>{r[1]}</td>
                    <td style={{ ...taxCell, fontWeight: 700 }}>{r[2]}</td>
                    <td style={{ ...taxCell, textAlign: 'right' }}>{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={footerBox}>
            This is a system generated payslip and doesn&apos;t need a signature
          </div>
        </div>
        <PageNumber page={2} />
      </div>
    )
  }

  return (
    <div id="printable-document" className="payslip-t1-root">
      <div className="payslip-t1-page" style={pageWrap}>
        <div className="payslip-t1-content" style={contentShell}>
          {renderMainContent()}
        </div>
        <PageNumber page={1} />
      </div>
      {showTaxPage ? renderTaxPage() : null}
    </div>
  )
}
