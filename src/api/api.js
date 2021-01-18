const express = require('express')
const app = express()
const port = 3000

app.get('/coverage', (req, res) => {
  res.json(global.__coverage__).send();
})

app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

app.use(express.static(`${process.cwd()}/dist/ui`))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})