import type { Document, DocumentWithAnnotations, Code, Annotation, Passage } from './types'

function uid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

const KEY = {
  docs: 'qda:documents',
  codes: 'qda:codes',
  content: (id: string) => `qda:content:${id}`,
  anns: (id: string) => `qda:anns:${id}`,
}

const load = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
  catch { return fallback }
}
const save = (key: string, val: unknown) => localStorage.setItem(key, JSON.stringify(val))

export const api = {
  listDocuments: async (): Promise<Document[]> =>
    load<Document[]>(KEY.docs, []),

  getDocument: async (id: string): Promise<DocumentWithAnnotations> => {
    const docs = load<Document[]>(KEY.docs, [])
    const doc = docs.find(d => d.id === id)
    if (!doc) throw new Error('Not found')
    return {
      ...doc,
      content: localStorage.getItem(KEY.content(id)) ?? '',
      annotations: load<Annotation[]>(KEY.anns(id), []),
    }
  },

  createDocument: async (name: string, content: string): Promise<Document> => {
    const doc: Document = { id: uid(), name, created_at: now() }
    const docs = load<Document[]>(KEY.docs, [])
    save(KEY.docs, [doc, ...docs])
    localStorage.setItem(KEY.content(doc.id), content)
    save(KEY.anns(doc.id), [])
    return doc
  },

  deleteDocument: async (id: string): Promise<void> => {
    save(KEY.docs, load<Document[]>(KEY.docs, []).filter(d => d.id !== id))
    localStorage.removeItem(KEY.content(id))
    localStorage.removeItem(KEY.anns(id))
  },

  listCodes: async (): Promise<Code[]> =>
    load<Code[]>(KEY.codes, []),

  createCode: async (name: string, color: string, description?: string): Promise<Code> => {
    const code: Code = { id: uid(), name, color, description: description ?? null, parent_id: null, created_at: now() }
    const codes = load<Code[]>(KEY.codes, [])
    codes.push(code)
    codes.sort((a, b) => a.name.localeCompare(b.name))
    save(KEY.codes, codes)
    return code
  },

  deleteCode: async (id: string): Promise<void> => {
    save(KEY.codes, load<Code[]>(KEY.codes, []).filter(c => c.id !== id))
    for (const doc of load<Document[]>(KEY.docs, [])) {
      const anns = load<Annotation[]>(KEY.anns(doc.id), []).filter(a => a.code_id !== id)
      save(KEY.anns(doc.id), anns)
    }
  },

  getCodePassages: async (codeId: string): Promise<Passage[]> => {
    const passages: Passage[] = []
    for (const doc of load<Document[]>(KEY.docs, [])) {
      for (const ann of load<Annotation[]>(KEY.anns(doc.id), [])) {
        if (ann.code_id === codeId) passages.push({ ...ann, document_name: doc.name })
      }
    }
    return passages.sort((a, b) => a.document_name.localeCompare(b.document_name) || a.start - b.start)
  },

  createAnnotation: async (data: {
    document_id: string; code_id: string; start: number; end: number; text: string
  }): Promise<Annotation> => {
    const ann: Annotation = { id: uid(), memo: null, created_at: now(), ...data }
    const anns = load<Annotation[]>(KEY.anns(data.document_id), [])
    save(KEY.anns(data.document_id), [...anns, ann])
    return ann
  },

  deleteAnnotation: async (id: string): Promise<void> => {
    for (const doc of load<Document[]>(KEY.docs, [])) {
      const anns = load<Annotation[]>(KEY.anns(doc.id), [])
      const filtered = anns.filter(a => a.id !== id)
      if (filtered.length !== anns.length) { save(KEY.anns(doc.id), filtered); return }
    }
  },
}
