var http = require('http');
var fs = require('fs');
var path = require('path');
const { searchWca } = require('./definitions.js')

//puppeteer stuff
let chrome = {};
let puppeteer;
if(process.env.AWS_LAMBDA_FUNCTION_VERSION){
  chrome = require('chrome-aws-lambda');
  puppeteer = require('puppeteer-core');
} else {
  puppeteer = require('puppeteer');
}

//dotenv?!?!?? How am i missing this
require('dotenv').config()
console.log(process.env)

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
  if(url === '/speedfmc' || url === '/sfmc'){
    const html = fs.readFileSync('public/speedfmc.html', 'utf8')
    res.send(html);
  }
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
  if (url.startsWith('/s/') || url.startsWith('/s%20')){
  var request = req.url.replace(/%20/g,' ').slice(3).split(' ')
  if (request.length >= 3) {
    searchWca(res, request[0].toLowerCase(), request[1].toLowerCase(), request[2].toLowerCase())
  } else {
   res.send('Format: event (eg "clock","c","clk"), region (eg "canada"), type (eg "average")')
  }
  }
  if (url === '/api'){
    getUpcomingCompetitions(res, req);
  }
  return
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

async function getUpcomingCompetitions(res, req){
  global.btoa = (str) => {
    return Buffer.from(str).toString('base64');
  };
  let options = {}

  if(process.env.AWS_LAMBDA_FUNCTION_VERSION){
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: 'new',
      ignoreHTTPSErrors: true
    };
  }
  
  (async () => {
    const browser = await puppeteer.launch(options);
  
    const page = await browser.newPage();
    try {
      await page.goto('https://www.worldcubeassociation.org/oauth/authorize?client_id=OhWPipjYJcvFnp_1bMAWxBHyOaLm9Q1GP6C3OaPfHoY&redirect_uri=https://statistics.worldcubeassociation.org&response_type=token&scope=public');
  
      await page.type('#user_login', '1olearydec@hdsb.ca');
      page.keyboard.press('Tab');
  
      await page.type('#user_password', process.env.PASS);
      page.keyboard.press('Enter');
  
      await page.waitForNavigation({ timeout: 30000 });
      const token = await page.evaluate(() => {
        return window.localStorage.getItem('token');
      });
      console.log(`Token: ${token}`);
      res.send(token);
  
    } catch (error) {
      console.error(`Error: ${error}`);
    } finally {
      await browser.close();
    }
  })();
  

}