const express = require('express')
const router = express.Router()

const { readDb, writeDb, findById, findByTitle } = require('../utils/db')

function parseDate(s) {
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(s) {
  if (!s) return s
  return new Date(s)
    .toLocaleString('sv-SE', { timeZone: 'Europe/Moscow' })
    .replace('T', ' ')
}

function formatNoteForResponse(n) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    created: formatDate(n.created),
    changed: formatDate(n.changed)
  }
}

function applyFilters(notes, qs) {
  let res = notes.slice()

  if (qs.title) {
    const t = String(qs.title).toLowerCase()
    res = res.filter(n => String(n.title).toLowerCase().includes(t))
  }

  if (qs.content) {
    const t = String(qs.content).toLowerCase()
    res = res.filter(n => String(n.content).toLowerCase().includes(t))
  }

  const createdBefore = parseDate(qs.createdBefore)
  const createdAfter = parseDate(qs.createdAfter)

  if (createdBefore) res = res.filter(n => new Date(n.created) < createdBefore)
  if (createdAfter) res = res.filter(n => new Date(n.created) > createdAfter)

  const offset = Number.isNaN(Number(qs.offset)) ? 0 : Math.max(0, Number(qs.offset))
  const limit = Number.isNaN(Number(qs.limit)) ? null : (Number(qs.limit) > 0 ? Number(qs.limit) : null)

  if (limit !== null) res = res.slice(offset, offset + limit)
  else if (offset) res = res.slice(offset)

  return res
}

router.get('/notes', (req, res) => {
  const db = readDb()
  if (!db.notes.length) return res.status(404).json({ message: "no notes :[" })
  const filtered = applyFilters(db.notes, req.query)
  if (!filtered.length) return res.status(404).json({ message: "no notes match filters :[" })
  res.status(200).json(filtered.map(formatNoteForResponse))
})

router.get('/note/read/:title', (req, res) => {
  const db = readDb()
  const note = findByTitle(db, req.params.title)
  if (!note) return res.status(404).json({ message: "note not found :[" })
  res.status(200).json(formatNoteForResponse(note))
})

router.get('/note/:id', (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(404).json({ message: "invalid id :[" })
  const db = readDb()
  const note = findById(db, id)
  if (!note) return res.status(404).json({ message: "note not found :[" })
  res.status(200).json(formatNoteForResponse(note))
})

router.post('/note', (req, res) => {
  const { title, content } = req.body
  if (!title || !content) return res.status(400).json({ message: "title and content required!!" })
  const db = readDb()
  if (db.notes.some(n => n.title === title)) {
    return res.status(409).json({ message: "note with this title already exists!!" })
  }
  const id = db.lastId + 1
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Moscow' }).replace('T', ' ')
  const note = { id, title, content, created: now, changed: now }
  db.notes.push(note)
  db.lastId = id
  writeDb(db)
  res.status(201).json(formatNoteForResponse(note))
})

router.delete('/note/:id', (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(409).json({ message: "invalid id :[" })
  const db = readDb()
  const idx = db.notes.findIndex(n => n.id === id)
  if (idx === -1) return res.status(409).json({ message: "note not found :[" })
  db.notes.splice(idx, 1)
  writeDb(db)
  res.status(204).send()
})

router.put('/note/:id', (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(409).json({ message: "invalid id :[" })
  const { title, content } = req.body
  const db = readDb()
  const note = findById(db, id)
  if (!note) return res.status(409).json({ message: "note not found :[" })
  if (title && title !== note.title) {
    if (db.notes.some(n => n.title === title && n.id !== id)) {
      return res.status(409).json({ message: "another note with this title exists!!" })
    }
    note.title = title
  }
  if (content !== undefined) note.content = content
  note.changed = new Date().toISOString()
  writeDb(db)
  res.status(204).send()
})

module.exports = router