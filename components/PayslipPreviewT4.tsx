'use client'

import { resolveDocumentFont, resolveDocumentFontZoom } from '@/lib/documentFonts'
import { numberToIndianWords } from '@/lib/numberToWords'
import { formatDateDDMonthYYYY } from '@/lib/utils'
import type { LeaveDetailRow } from '@/lib/leaveDetails'
import type { PayslipPreviewProps } from '@/types'

const PAGE_STYLE: React.CSSProperties = {
  width: 794,
  minHeight: 1123,
  height: 1123,
  backgroundColor: '#fff',
  fontSize: 11,
  color: '#000',
  padding: '32px 40px',
  boxSizing: 'border-box',
  overflow: 'hidden',
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDays(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function fmtLeave(n: number): string {
  if (n === 0) return '0'
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 6,
        marginTop: 10,
      }}
    >
      {children}
    </div>
  )
}

function LineRow({
  label,
  amount,
  bold,
}: {
  label: string
  amount?: number
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '3px 0',
        fontSize: 11,
        fontWeight: bold ? 700 : 400,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {amount !== undefined ? <span style={{ flexShrink: 0 }}>{fmt(amount)}</span> : null}
    </div>
  )
}

function GridCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '4px 0', minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          color: '#6b7280',
          marginBottom: 2,
          lineHeight: 1.3,
          whiteSpace: 'normal',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word' }}>
        {value || '—'}
      </div>
    </div>
  )
}

function LeaveDetailsPage({
  rows,
  fontFamily,
}: {
  rows: LeaveDetailRow[]
  fontFamily: string
}) {
  const thStyle: React.CSSProperties = {
    border: '1px solid #d1d5db',
    padding: '8px 6px',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'center',
    backgroundColor: '#fff',
    lineHeight: 1.3,
  }

  const tdStyle: React.CSSProperties = {
    border: '1px solid #d1d5db',
    padding: '7px 6px',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 1.3,
  }

  const tdLeftStyle: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'left',
    fontWeight: 500,
  }

  return (
    <div className="payslip-t4-page payslip-page" style={{ ...PAGE_STYLE, fontFamily }}>
      <SectionTitle>Leave Details</SectionTitle>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 8,
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '22%', textAlign: 'left' }}>Leave Type</th>
            <th style={thStyle}>Opening</th>
            <th style={thStyle}>Accrued</th>
            <th style={thStyle}>Credit</th>
            <th style={thStyle}>Availed</th>
            <th style={thStyle}>Expired/Encashed</th>
            <th style={thStyle}>Closing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.leaveType}>
              <td style={tdLeftStyle}>{row.leaveType}</td>
              <td style={tdStyle}>{fmtLeave(row.opening)}</td>
              <td style={tdStyle}>{fmtLeave(row.accrued)}</td>
              <td style={tdStyle}>{fmtLeave(row.credit)}</td>
              <td style={tdStyle}>{fmtLeave(row.availed)}</td>
              <td style={tdStyle}>{fmtLeave(row.expiredEncashed)}</td>
              <td style={tdStyle}>{fmtLeave(row.closing)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PayslipPreviewT4({
  employee,
  settings,
  calc,
  month,
  year,
  customDeductions,
  leaveDetails = [],
  documentFontOverride,
}: PayslipPreviewProps) {
  const fontFamily = resolveDocumentFont(documentFontOverride ?? settings.document_font)
  const documentZoom = resolveDocumentFontZoom(settings.document_font_size)
  const pageStyle: React.CSSProperties = { ...PAGE_STYLE, fontFamily }

  if (!employee || !calc) {
    return (
      <div
        id="printable-document"
        style={{
          width: '100%',
          minHeight: 1123,
          zoom: documentZoom,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontFamily,
        }}
      >
        Select an employee to preview payslip
      </div>
    )
  }

  const emp = employee
  const c = calc
  const monthShort = month.slice(0, 3).toUpperCase()
  const netWords = numberToIndianWords(c.netPay)
  const costWords = numberToIndianWords(c.totalCost)

  const earnings: { label: string; amount: number }[] = [
    { label: 'Basic', amount: c.actualBasic },
    { label: 'HRA', amount: c.actualHRA },
    { label: 'Medical Allowance', amount: c.actualMedical },
    { label: 'Conveyance Allowance', amount: c.actualConveyance },
    { label: 'Special Allowance', amount: c.actualSpecial },
  ]
  if (c.finalSettlement > 0) {
    earnings.push({ label: 'Final Settlement', amount: c.finalSettlement })
  }

  const hrLine: React.CSSProperties = {
    border: 'none',
    borderTop: '1px solid #000',
    margin: '8px 0',
  }

  return (
    <div
      id="printable-document"
      className="payslip-t4-root"
      style={{
        width: 794,
        zoom: documentZoom,
        backgroundColor: '#fff',
      }}
    >
      <div className="payslip-t4-page payslip-page" style={pageStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{emp.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{settings.company_name || 'Company Name'}</div>
            {settings.address ? (
              <div style={{ fontSize: 10, lineHeight: 1.5, maxWidth: 360, marginTop: 2 }}>
                {settings.address}
              </div>
            ) : null}
          </div>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Logo"
              crossOrigin="anonymous"
              style={{ height: 56, objectFit: 'contain', flexShrink: 0 }}
            />
          ) : null}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 700,
            margin: '16px 0 12px',
            letterSpacing: '0.5px',
          }}
        >
          PAYSLIP {monthShort} {year}
        </div>

        <hr style={hrLine} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '8px 16px',
            marginBottom: 8,
          }}
        >
          <GridCell label="Employee Number" value={emp.employee_id} />
          <GridCell label="Date Joined" value={formatDateDDMonthYYYY(emp.joining_date)} />
          <GridCell label="Department" value={emp.department} />
          <GridCell label="Designation" value={emp.designation} />
          <GridCell label="Payment Mode" value={emp.payment_mode} />
          <GridCell label="UAN" value={emp.uan} />
          <GridCell label="PF Number" value={emp.pf_number} />
          <GridCell label="PAN Number" value={emp.pan_number} />
        </div>

        <hr style={hrLine} />

        <SectionTitle>Salary Details</SectionTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '8px 12px',
            marginBottom: 4,
          }}
        >
          <GridCell label="Actual Payable Days" value={fmtDays(c.effectivePaidDays)} />
          <GridCell label="Total Working Days" value={fmtDays(c.totalWorkingDays)} />
          <GridCell label="Loss Of Pay Days" value={fmtDays(c.lopDays)} />
          <GridCell label="Days Payable" value={String(c.daysPayable)} />
        </div>

        <hr style={hrLine} />

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionTitle>Earnings</SectionTitle>
            {earnings.map((e) => (
              <LineRow key={e.label} label={e.label} amount={e.amount} />
            ))}
            <LineRow label="Total Earnings (A)" amount={c.totalEarningsA} bold />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionTitle>PF Deductions</SectionTitle>
            <LineRow label="PF Employee" amount={c.pfEmployee} />
            <LineRow label="Total Pf Deductions (B)" amount={c.totalPfDeductionsB} bold />

            <SectionTitle>Taxes &amp; other Deductions</SectionTitle>
            <LineRow label="Professional Tax" amount={c.professionalTax} />
            {customDeductions
              .filter((d) => d.label)
              .map((d, i) => (
                <LineRow key={i} label={d.label} amount={Number(d.amount) || 0} />
              ))}
            <LineRow label="Total Taxes &amp; Other Deductions (C)" amount={c.totalTaxesDeductionsC} bold />

            {c.reimbursements.length > 0 ? (
              <>
                <SectionTitle>Reimbursements</SectionTitle>
                {c.reimbursements.map((r, i) => (
                  <LineRow key={i} label={r.label} amount={r.amount} />
                ))}
                <LineRow label="Total Reimbursements (D)" amount={c.totalReimbursementsD} bold />
              </>
            ) : null}
          </div>
        </div>

        <hr style={hrLine} />

        <div
          style={{
            backgroundColor: '#f3f4f6',
            padding: '10px 14px',
            marginBottom: 10,
          }}
        >
          <LineRow label="Net Salary Payable (A - B - C + D)" amount={c.netPay} bold />
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, lineHeight: 1.4 }}>
            Net Salary in words: {netWords}
          </div>
        </div>

        <SectionTitle>Other Components</SectionTitle>
        <LineRow label="PF - Employer" amount={c.pfEmployer} />
        <LineRow label="PF - Other Charges" amount={c.pfOtherCharges} />
        <LineRow label="Total Other Components (E)" amount={c.totalOtherComponentsE} bold />

        <div
          style={{
            backgroundColor: '#f3f4f6',
            padding: '10px 14px',
            marginTop: 10,
          }}
        >
          <LineRow label="Total Cost (A + E)" amount={c.totalCost} bold />
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, lineHeight: 1.4 }}>
            Total Cost in words: {costWords}
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 10, fontStyle: 'italic' }}>
          <strong>Note :</strong> All amounts displayed in this payslip are in <strong>INR</strong>
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 10,
            color: '#6b7280',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          This is a system generated payslip and doesn&apos;t need a signature
        </div>
      </div>

      <LeaveDetailsPage rows={leaveDetails} fontFamily={fontFamily} />
    </div>
  )
}
