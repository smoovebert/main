import type { Document, DocumentWithAnnotations, Code, Annotation, Passage } from './types'

const BASE = 'http://localhost:8000'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  listDocuments: () => req<Document[]>('/documents'),
  getDocument: (id: string) => req<DocumentWithAnnotations>(`/documents/${id}`),
  createDocument: (name: string, content: string) =>
    req<Document>('/documents', { method: 'POST', ...json({ name, content }) }),
  deleteDocument: (id: string) => req('/documents/' + id, { method: 'DELETE' }),

  listCodes: () => req<Code[]>('/codes'),
  createCode: (name: string, color: string, description?: string) =>
    req<Code>('/codes', { method: 'POST', ...json({ name, color, description }) }),
  deleteCode: (id: string) => req('/codes/' + id, { method: 'DELETE' }),
  getCodePassages: (id: string) => req<Passage[]>(`/codes/${id}/passages`),

  createAnnotation: (data: {
    document_id: string
    code_id: string
    start: number
    end: number
    text: string
  }) => req<Annotation>('/annotations', { method: 'POST', ...json(data) }),
  deleteAnnotation: (id: string) => req('/annotations/' + id, { method: 'DELETE' }),
}
