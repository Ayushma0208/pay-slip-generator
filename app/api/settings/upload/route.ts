import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const prefix = String(formData.get('prefix') || 'asset')

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'png'
  const filename = `${prefix}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'company')
  await mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const url = `/uploads/company/${filename}`
  return NextResponse.json({ url })
}
