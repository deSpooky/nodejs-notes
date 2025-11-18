const express = require('express')
const router = express.Router()

const { readDb, writeDb, findById, findByTitle } = require('../utils/db')

router.get('/notes', (req, res) => {
  const db = readDb()
  if (!db.notes.length) return res.status(404).json({ message: "no notes :[" })
  res.status(200).json(db.notes)
})

router.get('/note/read/:title', (req, res) => {
  const db = readDb()
  const note = findByTitle(db, req.params.title)
  if (!note) return res.status(404).json({ message: "note not found :[" })
  res.status(200).json(note)
})

router.get('/note/:id', (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) return res.status(404).json({ message: "invalid id :[" })

  const db = readDb()
  const note = findById(db, id)
  if (!note) return res.status(404).json({ message: "note not found :[" })
  res.status(200).json(note)
})

router.post('/note', (req, res) => {
  const { title, content } = req.body
  if (!title || !content) return res.status(400).json({ message: "title and content required!!" })

  const db = readDb()
  if (db.notes.some(n => n.title === title)) {
    return res.status(409).json({ message: "note with this title already exists!!" })
  }

  const id = db.lastId + 1
  const now = new Date().toISOString()
  const note = { id, title, content, created: now, changed: now }

  db.notes.push(note)
  db.lastId = id
  writeDb(db)

  res.status(201).json(note)
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