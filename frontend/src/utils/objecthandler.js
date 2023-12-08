//Custom object handler for loading .obj files

//TODO: Add exporting of .obj files
export default class objMesh {
    vertices = [];
    normals = [];
    uvs = [];
    faces = [];

    constructor(obj) {
        if (obj) {
            this.vertices = obj.vertices;
            this.normals = obj.normals;
            this.uvs = obj.uvs;
            this.faces = obj.faces;
        }
    }

    //Loads an obj file from a url (In this case, the url is a local file)
    loadFromUrl(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = () => {
            if (request.status >= 200 && request.status < 400) {
                this.loadFromString(request.responseText);
                callback();
            }
        };
        request.send();
        console.log('vertices(FROM LOADFROMURL): ' + this.vertices.length);

    }

    //Loads an obj file from a string, the string is the contents of the file
    loadFromString(text) {
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length == 0 || line.charAt(0) == '#') {
                continue;
            }
            var parts = line.split(/\s+/);
            switch (parts[0]) {
                case 'v':
                    this.vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
                    break;
                case 'vn':
                    this.normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
                    break;
                case 'vt':
                    this.uvs.push([(parseFloat(parts[1]), parseFloat(parts[2]))]);
                    break;
                case 'f':
                    var face = [];
                    for (var j = 1; j < parts.length; j++) {
                        var indices = parts[j].split('/');
                        face.push([parseInt(indices[0]) - 1, parseInt(indices[1]) - 1, parseInt(indices[2]) - 1]); 
                    }

                    // Split the face into triangles
                    for (var j = 1; j < face.length - 1; j++) {
                        this.faces.push([face[0], face[j], face[j + 1]]);
                    }
                    break;
            }
        }
    }

    //Returns a mesh object that can be sent over the network
    getMesh() {
        console.log(this.vertices.length + ' vertices')
        const mesh = {
            vertices: this.vertices,
            normals: this.normals,
            uvs: this.uvs,
            faces: this.faces
        }
        return mesh;
    }

    //Deletes the mesh object
    delete(){
        delete this.vertices;
        delete this.normals;
        delete this.uvs;
        delete this.faces;
    }


}