const config = require('./utils/config')
const mongoose = require('mongoose')
// console.log('process.argv.length', process.argv.length)
// if (process.argv.length < 3) {
//   console.log('give password as argument')
//   process.exit(1)
// }

//const password = process.argv[2]

//const url = `mongodb+srv://fullstack:${password}@clusterfullstack.pw0daih.mongodb.net/?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)

mongoose.connect(config.MONGODB_URL)

const noteSchema = new mongoose.Schema({
  content:String,
  important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

const note = new Note({
  content: 'Browser can execute only JavaScript',
  important: false,
})
note.save().then(() => {
  console.log('note saved!')
  // mongoose.connection.close()
})

const note2 = new Note({
  content: 'HTML is easy',
  important: false,
})
note2.save().then(() => {
  console.log('note saved!')
  // mongoose.connection.close()
})

Note.find({ }).then(result => {
  result.forEach(note => {
    console.log(note)
  })
  mongoose.connection.close()
})