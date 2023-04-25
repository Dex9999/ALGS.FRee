var http = require('http');
var fs = require('fs');
var path = require('path');

//express stuff
const express = require('express');
const { response } = require('express');
const app = express()
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname+'/public')))
app.use(express.static(path.join(__dirname+'/api')))
app.use(express.static(path.join(__dirname+'/public/css')))

/**
 * This function checks every page requested for the link to be '/oll' and if so sends an html after replacing the text "setJson" with 'oll'
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function checkPageForLink(req, res) {
  const url = req.url;
  if (url === '/oll'||
      url === '/pll'||
      url === '/cs') {
    const set = req.url.replace(/\//g, '')
    const json = await fetchFromMongoDB(set);
    const html = fs.readFileSync('public/set.html', 'utf8')
    const replacedHtml = html.toString().replace('{setJson}', json);
    console.log(replacedHtml)
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
    res.type('html').sendFile('public/index.html', {root: __dirname});
})

app.get("/speedfmc", (req, res) => {
    res.type('html').send('public/speedfmc.html', {root: __dirname});
})

app.use(function(req, res) {
    res.status(404).sendFile('public/404.html', {root: __dirname});
  });


app.listen(port, () => console.log(`App listening on port ${port}!`));

async function fetchFromMongoDB(set){
  //mongoose stuff
  const mongoose = require('mongoose');
  mongoose.set('strictQuery', false);
  await mongoose.connect(process.env.MONGOURI);
  console.log('Connected to MongoDB!');

  const Case = require('./cubeSchema.js');
  return await Case.find({},{'_id':0});
}
