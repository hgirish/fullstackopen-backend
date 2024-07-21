const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('notes', { content:1,important:1 })
  response.json(users)
})

usersRouter.post('/', async (request,response) => {
  const { username, name, password } = request.body

  if (password.length < 8 ){
    return response.status(400).json({ error: 'password should be at least 8 characters' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hashSync(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

module.exports = usersRouter