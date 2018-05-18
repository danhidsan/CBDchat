const socket = io();

//Elements
var button = document.getElementById('send');
var messages = document.getElementById('messages');

button.onclick = function(){
    
    var date = new Date();
    var payload = {
        timestamp: Date.now(),
        user: document.getElementById('user').value,
        message: document.getElementById('message').value
    };
    
    document.getElementById('user').value = "";
    document.getElementById('message').value = "";

    // al pulsar el botón se crea un evento de nuevo mensaje el socket
    socket.emit('new_message', payload);
    
}


// evento que se mantiene a la espera de que rethinkdb devuelva el mensaje que ha guardado
socket.on('message', function(data){
    console.log(data);
    $("#messages").append('<li class="list-group-item"><strong>' + data.user + ': </strong>'+ data.message +'</li>');
    
});

