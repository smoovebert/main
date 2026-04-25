import { useState } from 'react'
import type { Document } from '../types'

interface Props {
  documents: Document[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string, content: string) => void
  onDelete: (id: string) => void
}

export default function DocumentList({ documents, selectedId, onSelect, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    onAdd(name.trim(), content.trim())
    setName('')
    setContent('')
    setAdding(false)
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <button className="btn btn-sm btn-primary" onClick={() => setAdding(v => !v)}>
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {adding && (
        <form className="add-form" onSubmit={handleSubmit}>
          <input
            className="input"
            placeholder="Document name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <textarea
            className="textarea"
            placeholder="Paste your text here…"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={8}
          />
          <button className="btn btn-primary btn-full" type="submit">
            Add Document
          </button>
        </form>
      )}

      <ul className="item-list">
        {documents.map(doc => (
          <li
            key={doc.id}
            className={`item ${selectedId === doc.id ? 'active' : ''}`}
            onClick={() => onSelect(doc.id)}
          >
            <span className="item-icon">◻</span>
            <span className="item-name">{doc.name}</span>
            <button
              className="item-delete"
              onClick={e => { e.stopPropagation(); onDelete(doc.id) }}
              title="Delete document"
            >
              ×
            </button>
          </li>
        ))}
        {documents.length === 0 && !adding && (
          <li className="empty-list">No documents yet</li>
        )}
      </ul>
    </div>
  )
}
