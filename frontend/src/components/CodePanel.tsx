import { useState } from 'react'
import type { Code } from '../types'

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

interface Props {
  codes: Code[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string, color: string, description?: string) => void
  onDelete: (id: string) => void
}

export default function CodePanel({ codes, selectedId, onSelect, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), color, description.trim() || undefined)
    setName('')
    setColor(PALETTE[0])
    setDescription('')
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
            placeholder="Code name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <input
            className="input"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="color-picker">
            {PALETTE.map(c => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${color === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button className="btn btn-primary btn-full" type="submit">
            Add Code
          </button>
        </form>
      )}

      <ul className="item-list">
        {codes.map(code => (
          <li
            key={code.id}
            className={`item ${selectedId === code.id ? 'active' : ''}`}
            onClick={() => onSelect(code.id)}
          >
            <span className="code-dot" style={{ background: code.color }} />
            <span className="item-name">{code.name}</span>
            <button
              className="item-delete"
              onClick={e => { e.stopPropagation(); onDelete(code.id) }}
              title="Delete code"
            >
              ×
            </button>
          </li>
        ))}
        {codes.length === 0 && !adding && (
          <li className="empty-list">No codes yet</li>
        )}
      </ul>
    </div>
  )
}
