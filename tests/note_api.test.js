const { test, after, beforeEach, describe } = require('node:test')

const assert = require('node:assert')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcrypt')
const Note = require('../models/note')
const User = require('../models/user')
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

describe('when there is initially some notes saved', () => {
  beforeEach(async () => {
    await Note.deleteMany()
    await Note.insertMany(helper.initialNotes)
  })

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

})

describe('viewing a specific note', () => {


  test('succeeds with a valid id', async () => {
    const notesAtStart = await helper.notesInDb()

    const noteToView = notesAtStart[0]

    const resultNote = await api
      .get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(resultNote.body, noteToView)
  })

  test('fails with statuscode 404 if note does not exist', async () => {
    const validNonExistingId = await helper.nonExistingId

    await api
      .get(`/api/notes/${validNonExistingId}`)
      .expect(400)
  })

  test('fails with statuscode 400 id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/api/notes/${invalidId}`)
      .expect(400)
  })

})

describe('addition of a new note', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'randomuser', passwordHash })

    await user.save()
  })

  test('succeeds with valid data', async () => {
    const users = await helper.usersInDb()
    const userId = users[0].id
    const newNote = {
      content: 'async/await simplifies making async calls',
      important: true,
      userId: userId
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

  test('fails with status code 400 if data is invalid', async () => {
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

  test('fails with status code 400 if user is not supplied', async () => {
    const newNote = {
      content: 'async/await simplifies making async calls',
      important: true,
    }

    await api
      .post('/api/notes')
      .send(newNote)
      .expect(400)


    const notesAtEnd = await helper.notesInDb()

    assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
  })

  test.only('fails with status code 400 if valid userId is not supplied', async () => {
    const newNote = {
      content: 'async/await simplifies making async calls',
      important: true,
      userId: '5a3d5da59070081a82a3445'
    }

    const result = await api
      .post('/api/notes')
      .send(newNote)
      .expect(400)


    const notesAtEnd = await helper.notesInDb()

    assert.strictEqual(notesAtEnd.length, helper.initialNotes.length)
    console.log('eror: ', result.body.error)
    assert(result.body.error.includes('malformatted id'))
  })

  test('fails with status code 400 if data is invalid', async () => {
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

})


describe('deletion of a note', () => {


  test('succeeds with status code 204 if id is valid', async() => {
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

})



after(async () => {
  await mongoose.connection.close()
})






