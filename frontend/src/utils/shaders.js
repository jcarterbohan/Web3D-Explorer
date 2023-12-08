export default class minshaders {
    static vertexShader = `
    void main(){
        vec4 modelViewPosition=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*modelViewPosition;
    }
    `

    static fragmentShader = `
    uniform vec3 color;
    void main(){
    gl_FragColor=vec4(vColor,1.);
    }
    `
}