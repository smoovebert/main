export interface Document {
  id: string
  name: string
  created_at: string
}

export interface DocumentWithAnnotations extends Document {
  content: string
  annotations: Annotation[]
}

export interface Code {
  id: string
  name: string
  color: string
  description: string | null
  parent_id: string | null
  created_at: string
}

export interface Annotation {
  id: string
  document_id: string
  code_id: string
  start: number
  end: number
  text: string
  memo: string | null
  created_at: string
}

export interface Passage extends Annotation {
  document_name: string
}
