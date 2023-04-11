import { createReadStream, readFile } from 'fs';
import { promisify } from 'util';

export default async function handler(req, res) {
  if (req.url === '/oll') {
    await modifyHtml('oll', res);
  } else if (req.url === '/pll') {
    await modifyHtml('pll', res);
  } else if (req.url === '/cs') {
    await modifyHtml('cs', res);
  } else {
    res.status(404).sendFile('static/404.html', { root: __dirname });
  }
}

/**
 * Modifies the HTML file with the given set
 * @param {string} set The set to modify the HTML with
 * @param {Response} res The response object
 */
async function modifyHtml(set, res) {
  const pipelineAsync = promisify(pipeline);
  const html = await readFile('../static/set.html');
  const modifiedHtml = html.replace('setJson', [set]);
  res.send(modifiedHtml);
}
