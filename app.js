const http = require('http');
const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
const ioServer = require("socket.io");

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function stringToBoolean(str){
    switch(str.toString().toLowerCase().trim()){
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: false;
    }
}

const port = parseInt(process.env.PORT || 36951);
const is_ssl = stringToBoolean(process.env.IS_SSL || true);
const ssl_key_path = process.env.SSL_KEY_PATH || "/home/sumairro/ssl/keys/ae2a8_1bce9_35f716bb2dccd591fc49147d23217b5e.key";
const ssl_cert_path = process.env.SSL_CERT_PATH || "/home/sumairro/ssl/certs/node_hostedsitedemo_com_ae2a8_1bce9_1591529357_0ec8cb1f31dc4cbcba105e55ffeab6fd.crt";


//set the template engine ejs
app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));

//routes
app.get('/', (req, res) => {
    app.locals.port = port;
    res.render('index')
});

var options = {}
if (is_ssl) {
    options = {
        key: fs.readFileSync(ssl_key_path),
        cert: fs.readFileSync(ssl_cert_path),
        requestCert: false,
        rejectUnauthorized: false
    };
}

var httpServer = http.createServer({}, app).listen(port, function(){
    var host = httpServer.address().address;
    var port = httpServer.address().port;
    console.log('App listening at http ws://%s:%s', host, port);
});
var httpsServer = https.createServer(options, app).listen(port, function(){
    var host = httpsServer.address().address;
    var port = httpsServer.address().port;
    console.log('App listening at https wss://%s:%s', host, port);
});

var io = new ioServer();
io.attach(httpServer);
io.attach(httpsServer);

//listen on every connection
io.on('connection', (socket) => {
    console.log('New user connected');

    //default username
    socket.username = "Anonymous";

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username;
    });

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message : data.message, username : socket.username});
    });

    //listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {username : socket.username});
    });
});
