'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PayslipCustomField } from '@/types'
import { useSettings } from '@/context/SettingsContext'
import { getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

function AssetUploadBox({
  label,
  imageUrl,
  uploading,
  onFile,
}: {
  label: string
  imageUrl: string
  uploading: boolean
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex-1">
      <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-4 py-5 text-center transition-colors duration-150 hover:border-accent hover:bg-accent-light disabled:opacity-50"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="mb-2 h-[60px] max-w-full object-contain"
          />
        ) : null}
        <span className="text-sm text-text-muted">
          {uploading ? 'Uploading...' : 'Click to upload'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function SettingsPage() {
  const { settings, loading, refetch } = useSettings()
  const [form, setForm] = useState({
    company_name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    signatory_name: '',
    signatory_designation: '',
    logo_url: '',
    signature_url: '',
    payslip_custom_fields: [] as PayslipCustomField[],
  })
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)

  useEffect(() => {
    if (!loading) {
      setForm({
        company_name: settings.company_name,
        address: settings.address,
        email: settings.email,
        phone: settings.phone,
        website: settings.website,
        signatory_name: settings.signatory_name,
        signatory_designation: settings.signatory_designation,
        logo_url: settings.logo_url,
        signature_url: settings.signature_url,
        payslip_custom_fields: settings.payslip_custom_fields ?? [],
      })
    }
  }, [settings, loading])

  const addCustomField = () => {
    setForm((prev) => ({
      ...prev,
      payslip_custom_fields: [...prev.payslip_custom_fields, { label: '', value: '' }],
    }))
  }

  const updateCustomField = (index: number, key: keyof PayslipCustomField, value: string) => {
    setForm((prev) => {
      const next = [...prev.payslip_custom_fields]
      next[index] = { ...next[index], [key]: value }
      return { ...prev, payslip_custom_fields: next }
    })
  }

  const removeCustomField = (index: number) => {
    setForm((prev) => ({
      ...prev,
      payslip_custom_fields: prev.payslip_custom_fields.filter((_, i) => i !== index),
    }))
  }

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const uploadAsset = async (
    file: File,
    prefix: 'logo' | 'signature',
    setUploading: (v: boolean) => void
  ): Promise<string | null> => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('prefix', prefix)
      const res = await fetch('/api/settings/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      return data.url
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Upload failed'))
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleLogoFile = async (file: File) => {
    const url = await uploadAsset(file, 'logo', setUploadingLogo)
    if (url) {
      update('logo_url', url)
      toast.success('Logo uploaded')
    }
  }

  const handleSignatureFile = async (file: File) => {
    const url = await uploadAsset(file, 'signature', setUploadingSignature)
    if (url) {
      update('signature_url', url)
      toast.success('Signature uploaded')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        id: settings.id || undefined,
        company_name: form.company_name || null,
        address: form.address || null,
        email: form.email || null,
        phone: form.phone || null,
        website: form.website || null,
        signatory_name: form.signatory_name || null,
        signatory_designation: form.signatory_designation || null,
        logo_url: form.logo_url || null,
        signature_url: form.signature_url || null,
        payslip_custom_fields: form.payslip_custom_fields.filter((f) => f.label.trim()),
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save settings')
      }

      toast.success('Settings saved')
      await refetch()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[640px] space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Company profile and document assets
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            Company Information
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={form.company_name}
                onChange={(e) => update('company_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Full Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => update('website', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold text-text-primary">Signatory Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Signatory Name</Label>
              <Input
                value={form.signatory_name}
                onChange={(e) => update('signatory_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Signatory Designation</Label>
              <Input
                value={form.signatory_designation}
                onChange={(e) => update('signatory_designation', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Payslip custom fields</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Add extra label/value rows on every payslip (e.g. CTC, grade, location).
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addCustomField}>
              Add field
            </Button>
          </div>
          <div className="space-y-2">
            {form.payslip_custom_fields.length === 0 ? (
              <p className="text-sm text-text-muted">No custom fields yet.</p>
            ) : (
              form.payslip_custom_fields.map((field, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    className="flex-1"
                    value={field.label}
                    onChange={(e) => updateCustomField(i, 'label', e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    className="flex-1"
                    value={field.value}
                    onChange={(e) => updateCustomField(i, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconLg"
                    className="shrink-0 text-text-secondary hover:bg-accent-light hover:text-accent"
                    onClick={() => removeCustomField(i)}
                    aria-label="Remove field"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold text-text-primary">Company Assets</h2>
          <div className="flex flex-col gap-6 sm:flex-row">
            <AssetUploadBox
              label="Company Logo"
              imageUrl={form.logo_url}
              uploading={uploadingLogo}
              onFile={handleLogoFile}
            />
            <AssetUploadBox
              label="Signature"
              imageUrl={form.signature_url}
              uploading={uploadingSignature}
              onFile={handleSignatureFile}
            />
          </div>
        </section>

        <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}
