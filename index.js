var http = require('http');
var fs = require('fs');
var path = require('path');

const express = require('express');
const { response } = require('express');
const app = express()
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname+'/static')))
app.use(express.static(path.join(__dirname+'/api')))
app.use(express.static(path.join(__dirname+'/static/css')))

/**
 * This function checks every page requested for the link to be '/oll' and if so sends an html after replacing the text "setJson" with 'oll'
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
function checkPageForLink(req, res) {
  const url = req.url;
  if (url === '/oll'||
      url === '/pll'||
      url === '/cs') {
    const html = fs.readFileSync('static/set.html', 'utf8')
    const replacedHtml = html.toString().replace('[setJson]', req.url.replace(/\//g, ''));
    res.send(replacedHtml);
  }
}

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});

//for every link check if it matches
app.get('*', checkPageForLink);

app.get("/", (req, res) => {
    res.type('html').sendFile('index.html', {root: __dirname});
})

app.use(function(req, res) {
    res.status(404).sendFile('static/404.html', {root: __dirname});
  });


app.listen(port, () => console.log(`App listening on port ${port}!`));
