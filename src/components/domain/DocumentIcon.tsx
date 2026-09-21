import { FileSpreadsheet, FileText, Presentation } from 'lucide-react'
import { documentShape } from '@/lib/attachments'

/** The icon for a document attachment, chosen by its file extension (slides, spreadsheet, or a plain document). */
export function DocumentIcon({ fileName, className }: { fileName: string | undefined; className?: string }) {
  const shape = documentShape(fileName)
  if (shape === 'presentation') return <Presentation className={className} aria-hidden="true" />
  if (shape === 'spreadsheet') return <FileSpreadsheet className={className} aria-hidden="true" />
  return <FileText className={className} aria-hidden="true" />
}
