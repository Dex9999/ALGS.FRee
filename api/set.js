const fs = require('fs');

module.exports = async (req, res) => {
  if (req.url === '/pll' ||
    req.url === '/oll' ||
    req.url === '/cs' ||
    req.url === '/zbll'){
    // Read in the HTML file
    const html = fs.readFileSync('../static/set.html', 'utf8');

    // Replace "setJson" with req.url without slashes
    const updatedHtml = html.replace('setJson', req.url.replace(/\//g, ''));

    // Set the content type header to HTML
    res.setHeader('Content-Type', 'text/html');

    // Return the updated HTML as the response
    res.send(updatedHtml);
  } else {
    // If the req.url is not, return a 404 error
    res.status(404).send('Not Found');
  }
};
