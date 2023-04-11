import { createReadStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import newLineStream from 'new-line';

module.exports = async (req, res) => {
	try {
		
		// Strip leading slash from request path
		const url = req.url.replace(/^\/+/, '')

		console.log(`Url: ${ url }`)
		const html = modifyHtml(url, res);

		if (!html) return res.status(400).send('Error: could not get page')

	} catch (err) {
		if (err.message === 'Protocol error (Page.navigate): Cannot navigate to invalid URL')
			return res.status(404).end()

		console.error(err)
		res.status(500).send('Error: Please try again.')
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
      res.setHeader('Content-Type', 'text/html'),
      res
    );
  }
}
