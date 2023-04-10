var http = require('http');
var fs = require('fs');

//for rendering alg pages fastly
const Transform = require('stream').Transform;
const parser = new Transform();
const newLineStream = require('new-line');

const express = require('express');
const { response } = require('express');
const app = express()
const port = process.env.PORT || 3000;

app.use(express.static(__dirname+'/static'))
app.use(express.static(__dirname+'/api'))
app.use(express.static(__dirname+'/static/css'))

app.get("/", (req, res) => {
    res.type('html').sendFile('index.html', {root: __dirname});
})

app.use(function(req, res) {
    res.status(404).sendFile('static/404.html', {root: __dirname});
  });


app.listen(port, () => console.log(`App listening on port ${port}!`));
