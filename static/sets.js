module.exports = (req, res) => {
    if(req.url === '/oll') {
        modifyHtml('oll', res)
    } else if(req.url === '/pll') {
        modifyHtml('pll', res)
    } else if(req.url === '/cs') {  
        modifyHtml('cs', res)
    } else {
        res.status(404).send(req.url, {root: __dirname});
    }

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
}
