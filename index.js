var http = require('http');
var fs = require('fs');

const express = require('express')
const app = express()
const port = 5000

app.use(express.static(__dirname))

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: __dirname})
})

app.use(function(req, res) {
    res.status(404).send('Bruh... 404...');
  });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})