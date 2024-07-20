const { after, describe, beforeEach , test }  = require('node:test')
const assert = require('node:assert')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const mongoose = require('mongoose')

describe('when there are users in db', () => {
  beforeEach(async() => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()

    const user2 = new User({ username: 'admin', passwordHash })
    await user2.save()
  })

  test('returns 2 users', async () => {
    const users = await helper.usersInDb()

    assert.strictEqual(users.length, 2)
    assert.strictEqual(users[0].username , 'root')
    assert.strictEqual(users[1].username , 'admin')
  })
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      password: 'salainen'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))

  })
})

describe('when there is initially one user in db', () => {

  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })
  test('creation fails with proper statuscode and message if username already taken', async () => {

    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'SuperUser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected \'username\' to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

describe('input validation', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation fails if username is short', async () => {

    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'joe',
      name: 'SuperUser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    console.log('result.body', result.body.error)
    //assert(result.body.error.includes('password should be at least 8 characters'))
    assert(result.body.error.includes('Path `username` (`joe`) is shorter than the minimum allowed length (4)'))
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)

  })

  test('creation fails if username contains unpermissible characters', async () => {

    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'joe$#!',
      name: 'SuperUser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    console.log('result.body', result.body.error)
    const errorMessage = `username: ${newUser.username} is not a valid username`
    //assert(result.body.error.includes('password should be at least 8 characters'))
    assert(result.body.error.includes(errorMessage))
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)

  })


  test('creation fails if password is short', async () => {

    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'superuser',
      name: 'SuperUser',
      password: 'sekret'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    console.log('result.body', result.body.error)
    assert(result.body.error.includes('password should be at least 8 characters'))
    //assert(result.body.error.includes('Path `username` (`joe`) is shorter than the minimum allowed length (4)'))
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)

  })
})

after(async () => {
  await mongoose.connection.close()
})

