import { createReadStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import newLineStream from 'new-line';

export default function handler(req, res) {
  if (req.url === '/oll') {
    modifyHtml('oll', res);
  } else if (req.url === '/pll') {
    modifyHtml('pll', res);
  } else if (req.url === '/cs') {
    modifyHtml('cs', res);
  } else {
    res.status(404).sendFile('static/404.html', { root: __dirname });
  }

  async function modifyHtml(set, res) {
    const pipelineAsync = promisify(pipeline);
    const parser = new Transform({
      transform: function (data, encoding, done) {
        let str = data.toString();
        str = str.replace('setJson', [set]);
        this.push(str);
        done();
      },
    });

    await pipelineAsync(
      createReadStream('../static/set.html'),
      newLineStream(),
      parser,
      res
    );
  }
}
