import type { AttachmentKind } from '@/types'

/** What a post may carry. Mirrors the backend (FileStorageService.storeFeedAttachment): anything else is refused there. */
export const MEDIA_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime'
export const FILE_ACCEPT =
  '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const MAX_ATTACHMENTS = 10
/** The server rejects a bigger upload (spring.servlet.multipart.max-file-size). */
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024
export const UNSUPPORTED_FILE_MESSAGE = 'Attach an image (PNG, JPG, WEBP, GIF), a video (MP4, WEBM, MOV), or a PDF, Word, PowerPoint or Excel file.'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

/** What the file is called in the UI, and which icon it gets, by extension. */
const DOCUMENTS: Record<string, { label: string; shape: DocumentShape }> = {
  pdf: { label: 'PDF', shape: 'document' },
  doc: { label: 'Word document', shape: 'document' },
  docx: { label: 'Word document', shape: 'document' },
  ppt: { label: 'PowerPoint', shape: 'presentation' },
  pptx: { label: 'PowerPoint', shape: 'presentation' },
  xls: { label: 'Excel spreadsheet', shape: 'spreadsheet' },
  xlsx: { label: 'Excel spreadsheet', shape: 'spreadsheet' },
}

export type DocumentShape = 'document' | 'presentation' | 'spreadsheet'

function extensionOf(name: string | undefined): string {
  if (!name) return ''
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/** Which kind of attachment a picked file is, or null when a post can't carry it. */
export function attachmentKindOf(file: { name: string; type: string }): AttachmentKind | null {
  if (IMAGE_TYPES.includes(file.type)) return 'image'
  if (VIDEO_TYPES.includes(file.type)) return 'video'
  const extension = extensionOf(file.name)
  if (extension === 'pdf') return 'pdf'
  return extension in DOCUMENTS ? 'file' : null
}

/** "PDF", "Word document", … for a document attachment's file name. */
export function documentLabel(fileName: string | undefined): string {
  return DOCUMENTS[extensionOf(fileName)]?.label ?? 'File'
}

export function documentShape(fileName: string | undefined): DocumentShape {
  return DOCUMENTS[extensionOf(fileName)]?.shape ?? 'document'
}
