const express = require('express')
const app = express()
const notesRouter = require('./routes/notes.js')

app.use(express.json())
app.use('/', notesRouter)

const PORT = 3000
app.listen(PORT, () => console.log(`server running on http://localhost:${PORT}`))