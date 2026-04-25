import { useState, useEffect } from 'react'
import type { Document, DocumentWithAnnotations, Code } from './types'
import { api } from './api'
import DocumentList from './components/DocumentList'
import CodePanel from './components/CodePanel'
import DocumentViewer from './components/DocumentViewer'
import QueryView from './components/QueryView'

type View = 'coding' | 'query'
type SidebarTab = 'documents' | 'codes'

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [codes, setCodes] = useState<Code[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [currentDoc, setCurrentDoc] = useState<DocumentWithAnnotations | null>(null)
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null)
  const [view, setView] = useState<View>('coding')
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('documents')

  useEffect(() => {
    loadDocuments()
    loadCodes()
  }, [])

  useEffect(() => {
    if (selectedDocId) loadDoc(selectedDocId)
  }, [selectedDocId])

  async function loadDocuments() {
    setDocuments(await api.listDocuments())
  }

  async function loadCodes() {
    setCodes(await api.listCodes())
  }

  async function loadDoc(id: string) {
    setCurrentDoc(await api.getDocument(id))
  }

  async function handleAddDocument(name: string, content: string) {
    const doc = await api.createDocument(name, content)
    await loadDocuments()
    setSelectedDocId(doc.id)
    setView('coding')
  }

  async function handleDeleteDocument(id: string) {
    await api.deleteDocument(id)
    if (selectedDocId === id) {
      setSelectedDocId(null)
      setCurrentDoc(null)
    }
    await loadDocuments()
  }

  async function handleAddCode(name: string, color: string, description?: string) {
    await api.createCode(name, color, description)
    await loadCodes()
  }

  async function handleDeleteCode(id: string) {
    await api.deleteCode(id)
    if (selectedCodeId === id) setSelectedCodeId(null)
    await loadCodes()
    if (currentDoc) await loadDoc(currentDoc.id)
  }

  async function handleAnnotate(codeId: string, start: number, end: number, text: string) {
    if (!currentDoc) return
    await api.createAnnotation({ document_id: currentDoc.id, code_id: codeId, start, end, text })
    await loadDoc(currentDoc.id)
  }

  async function handleDeleteAnnotation(annId: string) {
    await api.deleteAnnotation(annId)
    if (currentDoc) await loadDoc(currentDoc.id)
  }

  function handleCodeClick(codeId: string) {
    setSelectedCodeId(codeId)
    setView('query')
  }

  const selectedCode = codes.find(c => c.id === selectedCodeId) ?? null

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="header-logo">QDA</span>
          <span className="header-subtitle">Qualitative Data Analysis</span>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${view === 'coding' ? 'active' : ''}`}
            onClick={() => setView('coding')}
          >
            Coding
          </button>
          <button
            className={`nav-btn ${view === 'query' ? 'active' : ''}`}
            onClick={() => setView('query')}
          >
            Query
          </button>
        </nav>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${sidebarTab === 'documents' ? 'active' : ''}`}
              onClick={() => setSidebarTab('documents')}
            >
              Documents ({documents.length})
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === 'codes' ? 'active' : ''}`}
              onClick={() => setSidebarTab('codes')}
            >
              Codes ({codes.length})
            </button>
          </div>

          {sidebarTab === 'documents' && (
            <DocumentList
              documents={documents}
              selectedId={selectedDocId}
              onSelect={id => { setSelectedDocId(id); setView('coding') }}
              onAdd={handleAddDocument}
              onDelete={handleDeleteDocument}
            />
          )}

          {sidebarTab === 'codes' && (
            <CodePanel
              codes={codes}
              selectedId={selectedCodeId}
              onSelect={handleCodeClick}
              onAdd={handleAddCode}
              onDelete={handleDeleteCode}
            />
          )}
        </aside>

        <main className="content">
          {view === 'coding' && (
            currentDoc ? (
              <DocumentViewer
                doc={currentDoc}
                codes={codes}
                onAnnotate={handleAnnotate}
                onDeleteAnnotation={handleDeleteAnnotation}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">◻</div>
                <h2>No document open</h2>
                <p>Add a document in the sidebar and click it to start coding.</p>
              </div>
            )
          )}

          {view === 'query' && (
            selectedCode ? (
              <QueryView code={selectedCode} />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <h2>No code selected</h2>
                <p>Click a code in the Codes panel to see all its passages.</p>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  )
}
