const http = require('http'),
      url  = require('url'),
      fs   = require('fs'),
      path = require('path'),
      zlib = require("zlib"),
      port     = process.argv[2] || 8080,
      basepath = process.argv[3] || null;

http.createServer(function (req, res) {
    console.log(`${req.method} ${req.url}`);

    // parse URL
    parsedUrl = url.parse(req.url).pathname;
    parsedUrl = parsedUrl.replace("sample-data", "../sample-data"); // update path for data location

    // extract URL path
    var pathname = basepath ? `${basepath}${parsedUrl}` : `.${parsedUrl}`;

    // maps file extention to MIME types
    const mimeType = {
        '.ico' : 'image/x-icon',
        '.html': 'text/html',
        '.js'  : 'text/javascript',
        '.css' : 'text/css',
        '.png' : 'image/png',
        '.svg' : 'image/svg+xml',
        '.wasm': 'application/wasm' // This mime-type for wasm should always be configured on the server
    };

    fs.access(pathname, 'r', (err, fd) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
                console.error(`File ${pathname} not found!`);
                return;
            }
            throw err;
        }

        if (fs.statSync(pathname).isDirectory()) {
            fs.readdir(pathname, function(err, items) {
                let files = [];
                for (let i=0;i<items.length;i++) {
                    let file = pathname + items[i];
                    let ext = path.parse(file).ext;
                    if (ext == '.html') {
                        files.push(items[i]);
                    }
                }

                function getFileDisplay(files) {
                    var res = '';
                    for (let i=0;i<files.length;i++) {
                        res += '<tr><td><i class="icon icon-html"></i></td>'
                            +  '<td><a href="' + files[i] + '">' + files[i] + '</a></td></tr>';
                    }
                    return res;
                }

                res.setHeader('Content-type', 'text/html');
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                let page = ''
                  + '<html>'
                  +   '<head>'
                  +     '<title>Index of ' + pathname.substr(1) + '</title>'
                  +     '<style type="text/css">'
                  +       'i.icon {display: block; height: 16px; width: 16px;}'
                  +       'i.icon-html {background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmBJREFUeNqEUktPE1EU/mY605a+hhZTBNKRDApNrWIRA4nEBUZdmCgLNi4MK5f+FNdu3bFv1J1EXODCR1JJSMTwpqUP6NiCpe10Zjz3hj5Mm3iSybl37jnf+c53jmDbNpi9eb+6Ftcisea909bWNzNb6dwzSXKkhIt/r14+515qBqmDA8HpqKagh53XaopblpIbe+knDpFAhPab2Dw0TKvRK7lmNODzePBgZlK9oUWSpmVNdpIU8T+jaMsyMaD4MDcZVa+NhJMN00w0n6V2nN3yQgdHWZag+LzYPTomIAtT0THVtPGanmb/BbjwLFkvn2IttYGYplKyDzsHh7gdmyAWfh5zVq0Guhg4RAHFUhmfvq3j134aXo8bd+ITnMFOOovU5jbGRoZwNxFn1cxuAIcDW/sZDjA/c4u+BNxOJyxqaenpI3z88gMfPn9Hv98HQZS6RazW6kjExvFi8TGdDSy/W0Emf4LS6R8sv11BmfzSwkPcm74Jo9Ei0GZgmkw8QCOao8OXcaz/5vSZnPdnp3ApqBBLkWJE0Ci7ASzbIhCLLQ1E0iOkBDh9NpUgiUejo8oNuJwyn0YPABtn51UYFFivG3yBGCNZkuDtc/MW+ZQI3OrYpBaARCKufk3B5XIiWyhiL5ODp8+FfFHH+KiKSqWKUL8fC/NznGlPBmz+24dZjKnD0CJDcMoyW0SqXuMtHBFw7rhIAD1ErNUNafxKBNevapwu65NpEQ4FqXIA+RMd6VwBP3cPSERb6gLIFIq61+UqGWaFdcrVt/lmAuWjAi2aiMFwmOYuIJ/N6M28vwIMAMoNDyg4rcU9AAAAAElFTkSuQmCC");}'
                  +     '</style>'
                  +   '</head>'
                  +   '<body>'
                  +     '<h1>Index of ' + pathname.substr(1) + '</h1>'
                  +     '<table>'
                  +        getFileDisplay(files)
                  +     '</table>'
                  +   '</body>'
                  + '</html>';

                res.end(page);
            });
            return;
        } else if (fs.statSync(pathname).isFile()) {
            const raw = fs.createReadStream(pathname);
            // based on the URL path, extract the file extention. e.g. .js, .doc, ...
            const ext = path.parse(pathname).ext;
            // if the file is found, set Content-type and send data
            res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader("Vary", "Accept-Encoding");
            let acceptEncoding = req.headers["accept-encoding"];
            if (!acceptEncoding) {
                acceptEncoding = "";
            }
            res.statusCode = 200;
            // Note: This is not a conformant accept-encoding parser for code simplicty.
            if (/\bdeflate\b/.test(acceptEncoding) && !(/\bTrident\b/.test(req.headers['user-agent']))) {
                res.setHeader("Content-Encoding", "deflate");
                raw.pipe(zlib.createDeflate()).pipe(res);
            } else if (/\bgzip\b/.test(acceptEncoding)) {
                res.setHeader("Content-Encoding", "gzip");
                raw.pipe(zlib.createGzip()).pipe(res);
            } else if (/\bbr\b/.test(acceptEncoding)) {
                res.setHeader("Content-Encoding", "br");
                raw.pipe(zlib.createBrotliCompress()).pipe(res);
            } else {
                raw.pipe(res);
            }
        } else {
            res.statusCode(500);
            res.end();
        }
    });
}).listen(parseInt(port));

console.log(`Server listening on port ${port}`);
