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
  if(url.startsWith('/drive')){
    getTimeToDrive(res, req);
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
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
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

async function getTimeToDrive(res, req){

  // res.send(req.query.home+req.query.location)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
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
  
  const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  // Load "https://www.google.com/maps/@43.3984736,-79.7933568,14z"
  await page.goto('https://www.google.com/maps/@43.3984736,-79.7933568,14z');

  // Resize window to 1920 x 969
  await page.setViewport({ width: 1920, height: 969 });

  // Click on <button> #hArJGc
  await page.waitForSelector('#hArJGc');
  await Promise.all([
    page.click('#hArJGc'),
    page.waitForNavigation()
  ]);

  // Fill "5176 Fernbrook ... on <input> [placeholder="Choose starting point, or click on the map..."]
  await page.waitForSelector('[placeholder="Choose starting point, or click on the map..."]:not([disabled])');
  await page.type('[placeholder="Choose starting point, or click on the map..."]', req.query.home);

  // Press Tab on input
  await page.waitForSelector('[placeholder="Choose starting point, or click on the map..."]');
  await page.keyboard.press('Tab');

  // Press Tab on button
  await page.waitForSelector('.fC7rrc:nth-child(1) [aria-label="Search"]');
  await page.keyboard.press('Tab');

  // Fill "ApplebyCollege" on <input> [placeholder="Choose destination, or click on the map..."]
  await page.waitForSelector('[placeholder="Choose destination, or click on the map..."]:not([disabled])');
  await page.type('[placeholder="Choose destination, or click on the map..."]', req.query.location);

  // Press Enter on input
  await page.waitForSelector('[placeholder="Choose destination, or click on the map..."]');
  await page.keyboard.press('Enter');

  // Click on <div> "17 min 12.5 km via Burloa..."
  await page.waitForSelector('#section-directions-trip-0');
  await Promise.all([
    page.click('#section-directions-trip-0'),
    page.waitForNavigation()
  ]);

  // Click on <div> "17 min (12.5 km) via Burl..."
  await page.waitForSelector('.PNEhTd');
  await page.click('.PNEhTd');

  // Click on <span> "17 min (12.5 km)"
  await page.waitForSelector('.yIkJof > span');
  await page.click('.yIkJof > span');

  // Click on <span> "17 min"
  await page.waitForSelector('span > .delay-light');
  await page.click('span > .delay-light');

  const spanVal =  await page.$eval('span > .delay-light', el => el.innerText);
  console.log(spanVal); // test

  const oui =  await page.$eval('.PNEhTd', el => el.innerText);
  res.send(oui.slice(0,-74));

  await browser.close();
})();
  

}