const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')

notesRouter.get('/', async (request, response) => {
  const notes = await Note.find({}).populate('user', { username: 1, name: 1 })
  response.json(notes)
})

notesRouter.get('/:id', async (request, response) => {

  const note = await Note.findById(request.params.id)
  if (note) {
    response.json(note)
  } else {
    response.status(404).end()
  }

})

notesRouter.post('/', async (request, response) => {
  const body = request.body
  console.log('body.userid', body.userId ?? '')
  const user = await User.findById(body.userId)
  console.log('user', user)
  const note = new Note( {
    content: body.content,
    important : Boolean(body.important) || false,
    user:  user === null ? '' : user.id
  })


  const savedNote = await note.save()
  user.notes =  user.notes.concat(savedNote._id)
  await user.save()

  response.status(201).json(savedNote)

})

notesRouter.delete('/:id', async (request, response) => {

  await Note.findByIdAndDelete(request.params.id)
  response.status(204).end()

})


notesRouter.put('/:id', (request, response, next) => {

  const { content, important }  = request.body



  Note.findByIdAndUpdate(
    request.params.id,
    { content, important },
    { new:true, runValidators: true, context: 'query' })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})

module.exports = notesRouter