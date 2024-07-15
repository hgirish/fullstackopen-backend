require("dotenv").config()
const Note = require('./models/note')

const express = require('express')

const app = express()
app.use(express.static('dist'))
app.use(express.json())

const requestLogger = (request, response, next) => {
    console.log('Method', request.method);
    console.log('Path', request.path);
    console.log('Body', request.body);
    console.log('----');
    next()
}

app.use(requestLogger)

const cors = require('cors')
app.use(cors())



/* 
let notes = [
  {
    id: 1,
    content: "HTML is easy",
    important: true
  },
  {
    id: 2,
    content: "Browser can execute only JavaScript",
    important: false
  },
  {
    id: 3,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true
  }
]
 */

app.get('/api/notes', (request, response)=>{
    Note.find({}).then(notes => {
      response.json(notes)
    })
})

app.get('/api/notes/:id', (request, response) => {
  Note.findById(request.params.id).then(note => {
    response.json(note)
  })
  .catch(error => {
    console.log(error.message)
    response.status(400).end()
  })
    
})

app.delete('/api/notes/:id', (request, response) => {
  Note.deleteOne(id=request.params.id)
  .then(() => {
    response.status(204).end()
  })
  .catch(error => {
    console.log(error.message)
    response.status(400).end()
  })
})

const generateId = () => {
    const maxId = notes.length > 0
   ? Math.max(...notes.map(n=> Number(n.id)))
   : 0
   return (maxId+1)
}
app.post('/api/notes', (request, response) => {
  const body = request.body
  if (!body.content) {
    return response.status(400).json({
        error: 'content missing'
    })
  }
  const note = {
    content: body.content,
    important : Boolean(body.important) || false,
   
  }
  note.save().then(savedNote => {
    response.json(savedNote)
  }) 
})

app.put('/api/notes/:id', (request, response) => {
 
	const body = request.body
	const note = notes.find(note => note.id === body.id)
	if (!note) {
		return response.status(400).json({error: 'missing content'})
	}
	notes = notes.filter(note => note.id !== body.id).concat(body)
	return response.json(body)
	
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({error: 'unknown endpoint'})
}
app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`)
})
