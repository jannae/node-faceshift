var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    osc = require('node-osc'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    open = require('open');

app.listen(process.env.PORT || 8081);
console.log('Server running at http://127.0.0.1:8081/');
open('http://127.0.0.1:8081/');

function handler(req, res) {
    var fpath = req.url;
    var contentType = 'text/html';
    var ua = req.headers['user-agent'];
    var url_parts = url.parse(req.url);
    var ext = path.extname(url_parts.pathname)

    if (url_parts.pathname == '/dev') {
        fpath = '/dev.html';
    } else {
        fpath = '/app.html';
    }

    switch (ext) {
        case '.js':
            fpath = url_parts.href;
            contentType = 'text/javascript';
            break;
        case '.css':
            fpath = url_parts.href;
            contentType = 'text/css';
            break;
        case '.png':
            fpath = url_parts.href;
            contentType = 'image/png';
            break;
    }

    fs.readFile(__dirname + fpath, function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading ' + __dirname + fpath);
        }
        res.writeHead(200, {
            'Content-Type': contentType
        });
        res.end(data);
    });
}

var oscServer, oscClient;

io.sockets.on('connection', function(socket) {
    socket.on("config", function(obj) {
        oscServer = new osc.Server(obj.server.port, obj.server.host);
        oscClient = new osc.Client(obj.client.host, obj.client.port);

        oscClient.send('/status', socket.sessionId + ' connected');

        oscServer.on('message', function(msg, rinfo) {
            console.log(msg, rinfo);
            socket.emit("message", msg);
        });
    });
    socket.on("message", function(obj) {
        oscClient.send(obj);
    });
});


