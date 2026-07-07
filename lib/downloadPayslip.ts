const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = root.querySelectorAll('img')
  await Promise.all(
    Array.from(imgs).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        })
    )
  )
}

async function renderPageToCanvas(
  pageEl: HTMLElement,
  html2canvas: typeof import('html2canvas').default
): Promise<HTMLCanvasElement> {
  const container = document.createElement('div')
  container.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${PAGE_WIDTH}px`,
    'background:#fff',
    'z-index:-1',
  ].join(';')

  const clone = pageEl.cloneNode(true) as HTMLElement
  clone.style.width = `${PAGE_WIDTH}px`
  clone.style.minWidth = `${PAGE_WIDTH}px`
  clone.style.maxWidth = `${PAGE_WIDTH}px`
  clone.style.minHeight = `${PAGE_HEIGHT}px`
  clone.style.transform = 'none'
  clone.style.boxSizing = 'border-box'

  container.appendChild(clone)
  document.body.appendChild(container)

  try {
    await waitForImages(clone)
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    return await html2canvas(clone, {
      scale: 2,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      windowWidth: PAGE_WIDTH,
      windowHeight: PAGE_HEIGHT,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
  } finally {
    document.body.removeChild(container)
  }
}

export async function downloadPayslipPdf(filename: string): Promise<void> {
  const root = document.getElementById('printable-document')
  if (!root) throw new Error('Payslip preview not found')

  const pageNodes = root.querySelectorAll<HTMLElement>('.payslip-page')
  const pages = pageNodes.length > 0 ? Array.from(pageNodes) : [root as HTMLElement]

  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < pages.length; i++) {
    const canvas = await renderPageToCanvas(pages[i], html2canvas)
    const imgData = canvas.toDataURL('image/png', 1.0)

    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
