export const DOCUMENT_FONTS = [
  {
    id: 'arial',
    label: 'Arial',
    css: 'Arial, Helvetica, sans-serif',
  },
  {
    id: 'calibri',
    label: 'Calibri',
    css: 'Calibri, Candara, Segoe UI, sans-serif',
  },
  {
    id: 'times',
    label: 'Times New Roman',
    css: "'Times New Roman', Times, serif",
  },
  {
    id: 'georgia',
    label: 'Georgia',
    css: "Georgia, 'Times New Roman', serif",
  },
  {
    id: 'inter',
    label: 'Inter',
    css: 'var(--font-inter), Inter, system-ui, sans-serif',
  },
  {
    id: 'roboto',
    label: 'Roboto',
    css: 'var(--font-roboto), Roboto, Arial, sans-serif',
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    css: "var(--font-open-sans), 'Open Sans', Arial, sans-serif",
  },
  {
    id: 'lora',
    label: 'Lora',
    css: 'var(--font-lora), Lora, Georgia, serif',
  },
  {
    id: 'courier',
    label: 'Courier New',
    css: "'Courier New', Courier, monospace",
  },
] as const

export type DocumentFontId = (typeof DOCUMENT_FONTS)[number]['id']

export const DEFAULT_DOCUMENT_FONT: DocumentFontId = 'arial'
export const DEFAULT_DOCUMENT_FONT_SIZE = 100

export function clampDocumentFontSize(value?: number | string | null): number {
  const n =
    typeof value === 'string'
      ? Number(value.trim())
      : typeof value === 'number'
        ? value
        : DEFAULT_DOCUMENT_FONT_SIZE

  if (!Number.isFinite(n)) {
    return DEFAULT_DOCUMENT_FONT_SIZE
  }

  return Math.max(85, Math.min(125, Math.round(n)))
}

export function resolveDocumentFontZoom(value?: number | string | null): number {
  return clampDocumentFontSize(value) / 100
}

export function resolveDocumentFont(fontId?: string | null): string {
  const match = DOCUMENT_FONTS.find((f) => f.id === fontId)
  return match?.css ?? DOCUMENT_FONTS.find((f) => f.id === DEFAULT_DOCUMENT_FONT)!.css
}

export function isDocumentFontId(value: string): value is DocumentFontId {
  return DOCUMENT_FONTS.some((f) => f.id === value)
}
