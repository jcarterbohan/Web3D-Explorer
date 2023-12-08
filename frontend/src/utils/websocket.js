import { io } from 'socket.io-client';

export default class websocket {
    socket = io('http://localhost:3000')
    objhandler;
    transformhandler;
    getobj;

    constructor(objhandler, transformhandler, getobj) {
        this.objhandler = objhandler;
        this.transformhandler = transformhandler;
        this.getobj = getobj;
    }
    connect() {
        this.socket.on('connect', () => {
            console.log('connected to ' + this.socket.id);
        });
        this.socket.on('disconnect', () => {
            console.log('disconnected from ' + this.socket.id);
        });
        this.socket.on('objrecieve', (obj) => {
            if (!this.objhandler) {
                console.log('objhandler not initialized');
                return;
            }

            console.log('recieved obj');
            console.log(obj.vertices.length + ' vertices');
            this.objhandler(obj);
            this.delete(obj);            
        });
        this.socket.on('translaterecieve', (transform) => {
            if (!this.transformhandler) {
                console.log('transformhandler not initialized');
                return;
            }
            this.transformhandler(transform);
        });

        this.socket.on('requestMeshForUser', user => {
            console.log('requestMeshForUser: ' + user);
            const data = {
                user: user,
                mesh: this.getobj()
            }
            this.socket.emit('sendMeshtoUser', data);
            this.delete(data.mesh);
        });

        this.socket.on('requestMeshforAll', () => {
            console.log('requestMeshforAll');
            this.socket.emit('sendMeshtoAll', this.getobj());
        });

        this.socket.on('recievedMesh', (data) => {
            console.log('recievedMesh');
            console.log(data);
            this.objhandler(data);
            this.delete(data);
        });
    }

    delete(mesh){
        delete mesh.vertices;
        delete mesh.normals;
        delete mesh.uvs;
        delete mesh.faces;
    }

    sendObj(obj) {
        console.log('sending obj');
        console.log(obj.vertices.length + ' vertices');
        this.socket.emit('objsend', obj);
    }

}

