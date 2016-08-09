const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const server = app.listen(port, ()=>{
  console.log('Listening on port', port);
});
const io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/../client/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var players = [];
//Socket Listeners
io.on('connection', (socket)=>{
  //Add listeners here
  socket.emit('oldPeers', players);
  socket.broadcast.emit('newPeer', socket.id);
  players.push(socket.id);
  
  socket.on('disconnect', function(){
    io.emit('peerLeft', socket.id);
    players.splice(players.indexOf(socket.id),1);
  });
});

// serve index.html for rest
app.get('*', (req, res)=>{
  res.sendFile(path.resolve(__dirname + '/../client/public/index.html'));
});