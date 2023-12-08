import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import * as Stats from 'stats.js';
import objMesh from './utils/objecthandler.js';
import websocket from './utils/websocket.js';
// import minshaders from './utils/shaders.js';
// Minishaders will be saved for a later implementation to have a lightweigth shader for the vertices and faces

const sphereSize = {
    value: 0.1
}
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
const scale = {
    value: 1
}

let holdingx = false;
let holdingy = false;
let holdingz = false;
let obj = new objMesh();
let selected = [];
let spheregroup = new THREE.Group();
let faces = new THREE.Group();
let hover;
let drawfaces = false;
let drawvertices = true;
let mouseRay = new THREE.Raycaster();
let mousePos = new THREE.Vector2();

//Adjust raycaster thresholds
mouseRay.params.Points.threshold = 0.1;
mouseRay.params.Line.threshold = 0.1;

//Stats for debugging
var fps = Stats();
fps.showPanel(0);
fps.domElement.style.position = 'absolute';
fps.domElement.style.top = '0px';
fps.domElement.style.left = '0px';
document.body.appendChild(fps.domElement);

var ms = new Stats();
ms.showPanel(1);
ms.domElement.style.position = 'absolute';
ms.domElement.style.top = '0px';
ms.domElement.style.left = '80px';
document.body.appendChild(ms.domElement);


//Given a transform, apply it to the vertices and the spheres
function transformVertices(transforms) {
    for (let i = 0; i < transforms.indices.length; i++) {
        let holdVertex = obj.vertices[transforms.indices[i]];
        holdVertex[0] += transforms.translation.x;
        holdVertex[1] += transforms.translation.y;
        holdVertex[2] += transforms.translation.z;
        obj.vertices[transforms.indices[i]] = holdVertex;
        let holdTranslate = new THREE.Vector3(transforms.translation.x, transforms.translation.y, transforms.translation.z);
        holdTranslate = holdTranslate.multiplyScalar(scale.value);
        spheregroup.children[transforms.indices[i]].position.add(holdTranslate);
    }
}

//Given a vertex, return the index of the vertex in the spheregroup
function getIndexFromVertex(vertex) {
    for (let i = 0; i < spheregroup.children.length; i++) {
        if (spheregroup.children[i].position.equals(vertex)) {
            return i;
        }
    }
    return -1;
}

//Create a file input for uploading OBJ files
const fileInput = document.createElement('input');

//From the objMesh class, load the mesh into the scene
function loadMeshFromObj() {
    scene.remove(spheregroup);
    scene.remove(faces);

    spheregroup = new THREE.Group();
    let tempvertices = [];
    let tempfaces = [];
    for (let i = 0; i < obj.vertices.length; i++) {
        tempvertices.push(new THREE.Vector3(obj.vertices[i][0], obj.vertices[i][1], obj.vertices[i][2]));
    }
    for (let i = 0; i < obj.faces.length; i++) {
        tempfaces.push(new THREE.Vector3(obj.faces[i][0][0], obj.faces[i][1][0], obj.faces[i][2][0]));
    }

    for (let i = 0; i < tempfaces.length; i++) {
        let geometry = new THREE.BufferGeometry();
        let vertices = new Float32Array([
            tempvertices[tempfaces[i].x].x, tempvertices[tempfaces[i].x].y, tempvertices[tempfaces[i].x].z,
            tempvertices[tempfaces[i].y].x, tempvertices[tempfaces[i].y].y, tempvertices[tempfaces[i].y].z,
            tempvertices[tempfaces[i].z].x, tempvertices[tempfaces[i].z].y, tempvertices[tempfaces[i].z].z
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        let mesh = new THREE.Mesh(geometry, material);
        faces.add(mesh);
    }
    if (drawfaces) {
        scene.add(faces);
    }

    let spherePrototype = new THREE.SphereBufferGeometry(0.01, 32, 32);
    let sphereMaterial = new THREE.MeshBasicMaterial({ faces: THREE.DoubleSide });
    for (let i = 0; i < obj.vertices.length; i++) {
        let sphereclone = spherePrototype.clone();
        let materialclone = sphereMaterial.clone();
        let sphere = new THREE.Mesh(sphereclone, materialclone);
        sphere.position.set(obj.vertices[i][0], obj.vertices[i][1], obj.vertices[i][2]);
        sphere.material.color.set(0x00ff00);
        spheregroup.add(sphere);
    }
    if (drawvertices) {
        scene.add(spheregroup);
    }

}

//Load an OBJ file from a URL
function loadMeshFromFile(file_path) {
    obj = new objMesh();
    obj.loadFromUrl(file_path, () => {
        loadMeshFromObj();
        let mesh = obj.getMesh();
        socket.sendObj(mesh);
    });

    console.log(obj.vertices.length + ' vertices');

}


//Load a mesh from a mesh object and delete the old mesh
function loadNewObj(new_mesh) {
    obj.delete();
    obj = new objMesh(new_mesh);
    loadMeshFromObj();
}

//Return the mesh object
function getobj(){
    return obj.getMesh();
}

//Initialize the websocket connection and set the callbacks
const socket = new websocket(loadNewObj, transformVertices, getobj);
socket.connect();


//Create a file input for uploading OBJ files
fileInput.type = 'file';
fileInput.addEventListener('change', (event) => {
    loadMeshFromFile(URL.createObjectURL(event.target.files[0]));
    console.log(event.target.files[0].name);
}
);


//GUI for changing the sphere size, model scale, and drawing vertices and faces
const gui = new dat.GUI()
gui.add(sphereSize, 'value').min(0.1).max(1).step(0.05).name('Sphere Size').onChange(() => {
    for (let i = 0; i < spheregroup.children.length; i++) {
        spheregroup.children[i].scale.set(sphereSize.value, sphereSize.value, sphereSize.value);
    }
})
gui.add(scale, 'value', 1, 10).name('Model Scale');
gui.add(fileInput, 'click').name('Upload OBJ');

gui.add({ drawvertices: drawvertices }, 'drawvertices').name('Draw Vertices').onChange(() => {
    drawvertices = !drawvertices;
    if (drawvertices) {
        scene.add(spheregroup);
    }
    else {
        scene.remove(spheregroup);
    }
});
gui.add({ drawfaces: drawfaces }, 'drawfaces').name('Draw Faces').onChange(() => {
    drawfaces = !drawfaces;
    if (drawfaces) {
        scene.add(faces);
    }
    else {
        scene.remove(faces);
    }
});


//Event listeners for selecting vertices
document.addEventListener('click', (event) => {
    if (hover) {
        if (event.shiftKey) {
            selected.push(hover);
            hover.material.color.set(0xff0000);
        }
        else if (event.ctrlKey) {
            selected.splice(selected.indexOf(hover), 1);
            hover.material.color.set(0x00ff00);
        }
    }
}
);

//Event listeners for translating vertices
document.addEventListener('keydown', (event) => {
    if (event.key == 'x') {
        holdingx = true;
    }
    else if (event.key == 'y') {
        holdingy = true;
    }
    else if (event.key == 'z') {
        holdingz = true;
    }
}
);

document.addEventListener('keyup', (event) => {
    if (event.key == 'x') {
        holdingx = false;
    }
    else if (event.key == 'y') {
        holdingy = false;
    }
    else if (event.key == 'z') {
        holdingz = false;
    }
}
);

document.addEventListener('mousemove', (event) => {
    if (!controls.enabled) {
        let transformation = new THREE.Vector3(0, 0, 0);
        if (event.buttons == 1) {
            if (holdingx) {
                for (let i = 0; i < selected.length; i++) {
                    selected[i].position.x += event.movementX / 100;
                    transformation.x += event.movementX / 100;
                }
            }
            else if (holdingy) {
                for (let i = 0; i < selected.length; i++) {
                    selected[i].position.y += event.movementY / 100;
                    transformation.y += event.movementY / 100;
                }
            }
            else if (holdingz) {
                for (let i = 0; i < selected.length; i++) {
                    selected[i].position.z += event.movementY / 100;
                    transformation.z += event.movementY / 100;
                }
            }
            else {
                let forward = new THREE.Vector3();
                camera.getWorldDirection(forward);
                forward.normalize();

                for (let i = 0; i < selected.length; i++) {
                    selected[i].position.add(forward.clone().multiplyScalar(event.movementY / 100));
                }

                transformation.add(forward.clone().multiplyScalar(event.movementY / 100));

            }
        }


        let transformation_normal = transformation.clone().divideScalar(scale.value);

        let transforms = {
            indices: [],
            translation: transformation_normal
        }

        for (let i = 0; i < selected.length; i++) {
            transforms.indices.push(getIndexFromVertex(selected[i].position.divideScalar(scale.value)));
        }

        socket.socket.emit('translatesend', transforms);
    }
}
);

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();


let camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
scene.add(camera);


window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


//Mouse position
document.addEventListener('mousemove', (event) => {
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
);



//Grid to help with orientation
var grid = new THREE.GridHelper(100, 10);
scene.add(grid);



//Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight);



//Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true;
controls.enableRotate = true;
controls.minDistance = 1;
controls.zoomSpeed = 0.5;


//On pressing the 'p' key, toggle orbit controls
document.addEventListener('keydown', (event) => {
    if (event.key == 'p') {
        controls.enabled = !controls.enabled;
    }
    else if (event.key == 'c') {
        for (let i = 0; i < selected.length; i++) {
            selected[i].material.color.set(0x00ff00);
        }
        selected = [];
    }
}
);


camera.position.set(0, 0, 5);


//Animation loop
function animate() {

    fps.begin();
    ms.begin();

    if (spheregroup.children.length > 0) {
        spheregroup.scale.set(scale.value, scale.value, scale.value);
    }

    if(faces.children.length > 0){
        faces.scale.set(scale.value, scale.value, scale.value);
    }

    //Update the raycaster
    spheregroup.updateMatrixWorld();
    mouseRay.setFromCamera(mousePos, camera);


    //Split the spheregroup into chunks to avoid lag within the raycaster
    let childrensplit = [];
    let i, j, temparray, chunk = 500;
    for (i = 0, j = spheregroup.children.length; i < j; i += chunk) {
        temparray = spheregroup.children.slice(i, i + chunk);
        childrensplit.push(temparray);
    }

    for (let i = 0; i < childrensplit.length; i++) {
        let intersects = mouseRay.intersectObjects(childrensplit[i], true);
        if (intersects.length > 0) {
            if (hover != intersects[0].object) {
                if (hover) {
                    hover.material.color.set(0x00ff00);
                }
                hover = intersects[0].object;
                hover.material.color.set(0x808080);
            }
        }
        else {
            if (hover) {
                hover.material.color.set(0x00ff00);
            }
            hover = null;
        }
    }

    //Change the color of the selected vertices
    for (let i = 0; i < selected.length; i++) {
        selected[i].material.color.set(0xff0000);
    }


    renderer.render(scene, camera);

    ms.end();
    fps.end();

    requestAnimationFrame(animate);
    controls.update();
}
animate();