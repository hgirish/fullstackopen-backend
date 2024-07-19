const { test, after, beforeEach } = require('node:test')

const assert = require('node:assert')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')

const Note = require('../models/note')

beforeEach(async () => {
  await Note.deleteMany({})

  /*
  console.log('cleared')
 // this does not work.
 // The problem is that every iteration of the forEach loop generates an asynchronous operation,
 // and beforeEach won't wait for them to finish executing.
  helper.initialNotes.forEach(async (note) => {
    let noteObject = new Note(note)
    await noteObject.save()
    console.log('saved')
  })
  console.log('done')
  */

  /* // Promise.all
  const noteObjects = helper.initialNotes.map(note => new Note(note))
  const promiseArray = noteObjects.map(note => note.save())
  await Promise.all(promiseArray)
  */

  for (let note of helper.initialNotes) {
    let noteObject = new Note(note)
    await noteObject.save()
  }

})

const api = supertest(app)

test('notes are returned as json', async () => {
  console.log('entered test')
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all notes are returned', async () => {
  const response = await api.get('/api/notes')

  assert.strictEqual(response.body.length, helper.initialNotes.length)
})

test('there are two notes', async () => {
  const response = await api.get('/api/notes')

  assert.strictEqual(response.body.length, helper.initialNotes.length)
})

test('the first note is about HTTP methods', async () => {
  const response = await api.get('/api/notes')

  const contents = response.body.map(e => e.content)
  assert(contents.includes('HTML is easy'))
})
after(async () => {
  await mongoose.connection.close()
})

test('a valid note can be added', async () => {
  const newNote = {
    content: 'async/await simplifies making async calls',
    important: true,
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const notesAtEnd = await helper.notesInDb()
  assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1)

  const contents = notesAtEnd.map(n => n.content)
  assert(contents.includes('async/await simplifies making async calls'))
})

test('note without content is not added', async () => {
  const newNote = {
    important: true
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(400)

  const notesAtEnd = await helper.notesInDb()

  assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
})

test.only('a specific note can be viewed', async () => {
  const notesAtStart = await helper.notesInDb()

  const noteToView = notesAtStart[0]


  const resultNote = await api
    .get(`/api/notes/${noteToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.deepStrictEqual(resultNote.body, noteToView)
})

test('a note can be deleted', async() => {
  const notesAtStart = await helper.notesInDb()
  const noteToDelete = notesAtStart[0]

  await api
    .delete(`/api/notes/${noteToDelete.id}`)
    .expect(204)

  const notesAtEnd = await helper.notesInDb()

  const contents = notesAtEnd.map(r => r.content)
  assert(!contents.includes(noteToDelete.content))

  assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1)
})