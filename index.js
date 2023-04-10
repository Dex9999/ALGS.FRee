var http = require('http');
var fs = require('fs');

const express = require('express');
const { response } = require('express');
const app = express()
const port = process.env.PORT || 3000;

app.use(express.static(__dirname+'/static'))

app.get("/", (req, res) => {
    res.type('html').sendFile('index.html', {root: __dirname});
})

app.get("/cs", (req, res) => {
    res.type('html').sendFile('static/cs.html', {root: __dirname});
})

app.use(function(req, res) {
    res.status(404).send('Bruh... 404...');
  });

app.listen(port, () => console.log(`App listening on port ${port}!`));
