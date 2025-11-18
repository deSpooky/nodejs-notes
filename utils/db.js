const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../db/notes.json')

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    const init = { lastId: 0, notes: [] }
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2))
  }
}

function readDb() {
  ensureDb()
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function findById(db, id) {
  return db.notes.find(n => n.id === id)
}

function findByTitle(db, title) {
  return db.notes.find(n => n.title === title)
}

module.exports = {
  readDb,
  writeDb,
  findById,
  findByTitle
}
