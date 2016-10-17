// require and init

var temp_data = {};
var playlist  = [];

var host = {
    dir : __dirname + '/host/',
    port: 50085,
    ip  : '127.0.0.1'
};

var client = {
    dir : __dirname + '/client/',
    port: 50080,
    ip  : '192.168.42.1'
};

var express = require('express');
host.app    = express();
client.app  = express();

var http      = require('http');
host.server   = http.Server(  host.app);
client.server = http.Server(client.app);

var socket_io = require('socket.io');
host.io       = socket_io(  host.server);
client.io     = socket_io(client.server);

// http

var fs = require('fs');
fs.readdir(host.dir + 'public/wav', function(err, audio_sources){
    var movie_names = [];
    var length = audio_sources.length;
    for(var i = 0; i < length; i++){
        movie_names[i]
            = audio_sources[i].replace(/(.*)(?:\.([^.]+$))/, '$1');
        audio_sources[i] = 'wav/' + audio_sources[i];
    }
    temp_data.movie_names   = movie_names;
    temp_data.audio_sources = audio_sources;
});

var ejs = require('ejs');

host.app.set('views', host.dir + 'views');
client.app.set('views', client.dir + 'views');

host.app.set('view engine', 'html');
client.app.set('view engine', 'html');

host.app.engine('html', ejs.renderFile);
client.app.engine('html', ejs.renderFile);

host.app.use('/', express.static(host.dir + 'public'));

host.app.get('/', function(req, res){
    res.render('index', temp_data);
});

client.app.use('/', express.static(client.dir + 'public'));

client.app.get('/', function(req, res){
    res.render('index', temp_data);
});

// io
host.io.on('connection', function(host_socket){
    console.log('host connected');
    playlist = [];
    client.io.emit('init_playlist_for_client', playlist);
    host_socket.on('playlist_changed_from_host',
                   function(msg, mode){
                       switch(mode){
                       case 'push':
                           playlist.push(msg);
                           break;
                       case 'unshift':
                           playlist.unshift(msg);
                           break;
                       case 'shift':
                           var del_msg = playlist.shift();
                           if(del_msg != msg){
                               console.log(
                                   'ERROR: unshifted message is wrong!')
                           }
                           break;
                       }
                       client.io.emit('playlist_changed_to_client',
                                      msg, mode);
                   });
});

client.io.on('connection', function(client_socket){
    console.log('client connected');
    client_socket.emit('init_playlist_for_client', playlist);
    client_socket.on('msg_from_client', function(msg, mode){
        console.log(mode + ': ' + msg);
        host.io.emit('msg_to_host', msg, mode);
    });
});

// start listening
host.server.listen(host.port, host.ip, function(){
    console.log(
        'host.server start listening on '+ host.ip +':'+ host.port
    );
});

client.server.listen(client.port, client.ip, function(){
    console.log(
        'client.server start listening on '+ client.ip +':'+ client.port
    );
});
