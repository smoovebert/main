import sqlite3
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="QDA Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "qda.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS codes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            description TEXT,
            parent_id TEXT,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS annotations (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            code_id TEXT NOT NULL,
            start INTEGER NOT NULL,
            end INTEGER NOT NULL,
            text TEXT NOT NULL,
            memo TEXT,
            created_at TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()


init_db()


# --- Pydantic models ---

class DocumentCreate(BaseModel):
    name: str
    content: str


class CodeCreate(BaseModel):
    name: str
    color: str
    description: Optional[str] = None
    parent_id: Optional[str] = None


class AnnotationCreate(BaseModel):
    document_id: str
    code_id: str
    start: int
    end: int
    text: str
    memo: Optional[str] = None


# --- Documents ---

@app.post("/documents")
def create_document(doc: DocumentCreate):
    conn = get_db()
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO documents VALUES (?, ?, ?, ?)",
        (doc_id, doc.name, doc.content, now),
    )
    conn.commit()
    conn.close()
    return {"id": doc_id, "name": doc.name, "content": doc.content, "created_at": now}


@app.get("/documents")
def list_documents():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, created_at FROM documents ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/documents/{doc_id}")
def get_document(doc_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Not found")
    doc = dict(row)
    anns = conn.execute(
        "SELECT * FROM annotations WHERE document_id=? ORDER BY start", (doc_id,)
    ).fetchall()
    doc["annotations"] = [dict(a) for a in anns]
    conn.close()
    return doc


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    conn = get_db()
    conn.execute("DELETE FROM annotations WHERE document_id=?", (doc_id,))
    conn.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# --- Codes ---

@app.post("/codes")
def create_code(code: CodeCreate):
    conn = get_db()
    code_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO codes VALUES (?, ?, ?, ?, ?, ?)",
        (code_id, code.name, code.color, code.description, code.parent_id, now),
    )
    conn.commit()
    conn.close()
    return {
        "id": code_id,
        "name": code.name,
        "color": code.color,
        "description": code.description,
        "parent_id": code.parent_id,
        "created_at": now,
    }


@app.get("/codes")
def list_codes():
    conn = get_db()
    rows = conn.execute("SELECT * FROM codes ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.delete("/codes/{code_id}")
def delete_code(code_id: str):
    conn = get_db()
    conn.execute("DELETE FROM annotations WHERE code_id=?", (code_id,))
    conn.execute("DELETE FROM codes WHERE id=?", (code_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# --- Annotations ---

@app.post("/annotations")
def create_annotation(ann: AnnotationCreate):
    conn = get_db()
    ann_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT INTO annotations VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (ann_id, ann.document_id, ann.code_id, ann.start, ann.end, ann.text, ann.memo, now),
    )
    conn.commit()
    conn.close()
    return {
        "id": ann_id,
        "document_id": ann.document_id,
        "code_id": ann.code_id,
        "start": ann.start,
        "end": ann.end,
        "text": ann.text,
        "memo": ann.memo,
        "created_at": now,
    }


@app.delete("/annotations/{ann_id}")
def delete_annotation(ann_id: str):
    conn = get_db()
    conn.execute("DELETE FROM annotations WHERE id=?", (ann_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/codes/{code_id}/passages")
def get_code_passages(code_id: str):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT a.*, d.name as document_name
        FROM annotations a JOIN documents d ON a.document_id=d.id
        WHERE a.code_id=?
        ORDER BY d.name, a.start
        """,
        (code_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/stats")
def get_stats():
    conn = get_db()
    docs = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    codes = conn.execute("SELECT COUNT(*) FROM codes").fetchone()[0]
    anns = conn.execute("SELECT COUNT(*) FROM annotations").fetchone()[0]
    conn.close()
    return {"documents": docs, "codes": codes, "annotations": anns}
