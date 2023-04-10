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
app.use(express.static(__dirname+'/static/css'))

app.get("/", (req, res) => {
    res.type('html').sendFile('index.html', {root: __dirname});
})

app.get("/oll", (req, res) => {
    modifyHtml('oll', res)
})

app.get("/pll", (req, res) => {
    modifyHtml('pll', res)
})

app.get("/cs", (req, res) => {
    modifyHtml('cs', res)
})

app.use(function(req, res) {
    res.status(404).sendFile('static/404.html', {root: __dirname});
  });


app.listen(port, () => console.log(`App listening on port ${port}!`));

function modifyHtml(set, res) {
    parser._transform = function(data, encoding, done) {
        let str = data.toString();
        str = str.replace('setJson', [set]); 
        this.push(str);
        done();
      };
    fs
      .createReadStream('static/set.html')
      .pipe(newLineStream())
      .pipe(parser)
      .pipe(res);
  }