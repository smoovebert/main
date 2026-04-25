import { useState, useEffect } from 'react'
import type { Code, Passage } from '../types'
import { api } from '../api'

interface Props {
  code: Code
}

export default function QueryView({ code }: Props) {
  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getCodePassages(code.id).then(p => {
      setPassages(p)
      setLoading(false)
    })
  }, [code.id])

  if (loading) return <div className="loading">Loading passages…</div>

  // Group passages by document
  const byDoc: Record<string, Passage[]> = {}
  for (const p of passages) {
    if (!byDoc[p.document_name]) byDoc[p.document_name] = []
    byDoc[p.document_name].push(p)
  }

  return (
    <div className="query-view">
      <div className="query-header">
        <span
          className="code-chip"
          style={{ background: code.color + '22', borderColor: code.color, color: code.color }}
        >
          {code.name}
        </span>
        <span className="query-count">
          {passages.length} passage{passages.length !== 1 ? 's' : ''}
          {' across '}
          {Object.keys(byDoc).length} document{Object.keys(byDoc).length !== 1 ? 's' : ''}
        </span>
      </div>

      {passages.length === 0 ? (
        <div className="empty-state">
          <p>No passages coded with <strong>{code.name}</strong> yet.</p>
          <p style={{ marginTop: 8 }}>Open a document, select text, and apply this code.</p>
        </div>
      ) : (
        <div className="passages-list">
          {Object.entries(byDoc).map(([docName, docPassages]) => (
            <div key={docName} className="passage-group">
              <div className="passage-doc-name">{docName}</div>
              {docPassages.map(p => (
                <blockquote
                  key={p.id}
                  className="passage-text"
                  style={{ borderLeftColor: code.color }}
                >
                  {p.text}
                </blockquote>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
