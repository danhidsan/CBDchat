var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var socket = require('socket.io');
var r = require('rethinkdb');
var moment = require('moment');
var fs = require('fs');
var process = require('process');

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname + '/index.html'));
});

var io = socket(http);

// conexión del socket con el cliente
io.on('connection', function(socket){

    console.log('Connection ID: ', socket.id);
    if(io.sockets.connected[socket.id]){
        io.sockets.connected[socket.id].emit('confirm_conexion', "Cliente conectado con id: " + socket.id);
    }



    // evento que se mantiene a la espera de un nuevo mensaje
    socket.on('new_message', (data) => {

        // conexion a rethinkdb que almacena el nuevo mensaje obtenido a través del evento
        fs.readFile('./cacert', function(err, caCert) {
            r.connect({
                db: 'chat'
            }, (err, conn) => {
                if (err){
                    r.connect({
                        host: 'aws-eu-west-1-portal.8.dblayer.com',
                        port: '18890',
                        password: 'a0b11a553850b356d2ada93a493f5781',
                        db: 'chat',
                        ssl: {
                            ca: caCert
                        } 
                    }, (err, conn) => {
                        if (err) throw err;
                        r.table('messages').insert({ // almacenamos el mensaje
                            timestamp: data.timestamp,
                            user: data.user,
                            message: data.message
                        }).run(conn)
                        .then((response) => {
                            console.log(response);
                        })
                        .error((error) => {
                            console.log(error);
                        })
                    });
                };
                r.table('messages').insert({ // almacenamos el mensaje
                    timestamp: data.timestamp,
                    user: data.user,
                    message: data.message
                }).run(conn)
                .then((response) => {
                    console.log(response);
                })
                .error((error) => {
                    console.log(error);
                })
            });
        });
         
    });

    // Conexión a rethinkdb que se mantiene a la espera de un nuevo mensaje
    fs.readFile('./cacert', function(err, caCert) {
        r.connect({
            db: 'chat'
        }, (err, conn) => {
            if (err){
                r.connect(
                    {
                        host: 'aws-eu-west-1-portal.8.dblayer.com',
                        port: '18890',
                        password: 'a0b11a553850b356d2ada93a493f5781',
                        db: 'chat',
                        ssl: {
                            ca: caCert
                        } 
                    }, (err, conn) => {
                        if (err) throw err;
                        r.table('messages').changes().run(conn, (err, cursor) => {
                            if (err) throw err;
                            cursor.each((err, row) => {
                                if(err) throw err;
                                // Al recibir un nuevo mensaje mandamos un evento a la parte del cliente a través del socket
                                socket.emit('message', row.new_val);
                            });
                        });
                });
            }
            r.table('messages').changes().run(conn, (err, cursor) => {
                if (err) throw err;
                cursor.each((err, row) => {
                    if(err) throw err;
                    // Al recibir un nuevo mensaje mandamos un evento a la parte del cliente a través del socket
                    socket.emit('message', row.new_val);
                });
            });
        });
    });
    
    // evento de desconexión del usuario
    socket.on('disconnect', () => {
        console.log("Se ha desconectado", socket.id);
    });
});


http.listen((process.env.PORT || 3000), function(){
  console.log('listening on *:', (process.env.PORT || 3000));
});
