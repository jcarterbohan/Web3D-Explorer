const io = require('socket.io')(3000, {
    cors: {
        origin: '*',
        maxHttpBufferSize: 1e8
    }
});

let connections = [];

setInterval(() => {
    if (connections.length >= 2) {
        connections[0].emit('requestMeshforAll');
    }
}, 30000);


io.on('connection', socket => {
    console.log('User ' + socket.id + ' connected');
    connections.push(socket);

    if (connections.length >= 2) {
        console.log('Requesting mesh for user ' + connections[0].id + ' from ' + socket.id + '');
        connections[0].emit('requestMeshForUser', socket.id);
    }

    socket.on('disconnect', user => {
        console.log('User ' + user.id + ' disconnected');
        connections.splice(connections.indexOf(socket), 1);
    });

    socket.on('objsend', obj => {
        console.log('Object received');
        socket.broadcast.emit('objrecieve', obj);
    }
    );

    socket.on('translatesend', translate => {
        socket.broadcast.emit('translaterecieve', translate);
    });

    socket.on('sendMeshtoAll', mesh => {
        console.log('Request for mesh received');
        socket.broadcast.emit('recievedMesh', mesh);
    });

    socket.on('sendMeshtoUser', data => {
        let user = data.user;
        let usersocket = connections.find(socket => socket.id === user);
        let mesh = data.mesh;
        console.log('Request for mesh received for user ' + usersocket.id + ' from ' + socket.id + '');
        //Send mesh to only that user
        usersocket.emit('recievedMesh', mesh);

        // socket.broadcast.to(user).emit('recievedMesh', mesh);

    });

});