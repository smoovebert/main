import { useState, useRef, useCallback } from 'react'
import type { DocumentWithAnnotations, Code, Annotation } from '../types'

interface Props {
  doc: DocumentWithAnnotations
  codes: Code[]
  onAnnotate: (codeId: string, start: number, end: number, text: string) => void
  onDeleteAnnotation: (id: string) => void
}

interface SelectionState {
  start: number
  end: number
  text: string
  x: number
  y: number
}

interface Segment {
  text: string
  ann: Annotation | null
  code: Code | null
}

function buildSegments(content: string, annotations: Annotation[], codes: Code[]): Segment[] {
  const sorted = [...annotations].sort((a, b) => a.start - b.start)
  const segments: Segment[] = []
  let pos = 0

  for (const ann of sorted) {
    const start = Math.max(ann.start, pos)
    if (start >= ann.end) continue
    if (start > pos) {
      segments.push({ text: content.slice(pos, start), ann: null, code: null })
    }
    const code = codes.find(c => c.id === ann.code_id) ?? null
    segments.push({ text: content.slice(start, ann.end), ann, code })
    pos = ann.end
  }

  if (pos < content.length) {
    segments.push({ text: content.slice(pos), ann: null, code: null })
  }

  return segments
}

function getSelectionOffsets(container: Element): { start: number; end: number; text: string } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null

  const range = sel.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null

  const text = sel.toString()
  if (!text.trim()) return null

  // Count characters from container start to selection start
  const pre = document.createRange()
  pre.selectNodeContents(container)
  pre.setEnd(range.startContainer, range.startOffset)
  const start = pre.toString().length

  return { start, end: start + text.length, text }
}

export default function DocumentViewer({ doc, codes, onAnnotate, onDeleteAnnotation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [pickedCodeId, setPickedCodeId] = useState<string>('')

  const segments = buildSegments(doc.content, doc.annotations, codes)

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const offsets = getSelectionOffsets(containerRef.current)
    if (!offsets) {
      setSelection(null)
      return
    }
    setSelection({ ...offsets, x: e.clientX, y: e.clientY })
    setPickedCodeId(codes[0]?.id ?? '')
  }, [codes])

  const handleApply = () => {
    if (!selection || !pickedCodeId) return
    onAnnotate(pickedCodeId, selection.start, selection.end, selection.text)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleCancel = () => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleRemove = (ann: Annotation, code: Code | null) => {
    if (window.confirm(`Remove "${code?.name ?? 'annotation'}" from this passage?`)) {
      onDeleteAnnotation(ann.id)
    }
  }

  return (
    <div className="doc-viewer">
      <div className="doc-header">
        <h2 className="doc-title">{doc.name}</h2>
        <span className="doc-meta">
          {doc.annotations.length} annotation{doc.annotations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        ref={containerRef}
        className="doc-content"
        onMouseUp={handleMouseUp}
      >
        {segments.map((seg, i) =>
          seg.ann && seg.code ? (
            <mark
              key={i}
              className="highlight"
              style={{
                backgroundColor: seg.code.color + '33',
                borderBottom: `2px solid ${seg.code.color}`,
              }}
              title={`${seg.code.name} — click to remove`}
              onClick={() => handleRemove(seg.ann!, seg.code)}
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>

      {selection && (
        <div
          className="code-popup"
          style={{
            left: Math.min(selection.x, window.innerWidth - 290),
            top: selection.y + 14,
          }}
          onMouseDown={e => e.preventDefault()}
        >
          <div className="popup-preview">
            &ldquo;{selection.text.slice(0, 70)}{selection.text.length > 70 ? '…' : ''}&rdquo;
          </div>

          {codes.length === 0 ? (
            <p className="popup-no-codes">Create a code in the Codes panel first.</p>
          ) : (
            <>
              <select
                className="code-select"
                value={pickedCodeId}
                onChange={e => setPickedCodeId(e.target.value)}
              >
                {codes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="popup-actions">
                <button className="btn btn-primary" onClick={handleApply}>
                  Apply Code
                </button>
                <button className="btn btn-ghost" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
