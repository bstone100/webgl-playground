import { resizeCanvasToDisplaySize } from "./helpers.js";

const canvas = document.querySelector("canvas");

const gl = canvas.getContext("webgl2");

// output black to the canvas
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// we need to get our shaders as text
const vertexGLSL = await fetch("./vertex.glsl").then(res => res.text());
const fragmentGLSL = await fetch("./fragment.glsl").then(res => res.text());

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexGLSL);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentGLSL);

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

// this is a buffer on the GPU
const positionBuffer = gl.createBuffer();

// ARRAY_BUFFER is a bind point
// you bind a resource to a bind point, then other functions refer to the resource through the bind point
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positions = [
    0, 0,
    0, 0.5,
    0.7, 0
];

// this copies the positions onto the GPU
// gl.STATIC_DRAW is a hint that the data isn't going to change
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


const vertexArrayObject = gl.createVertexArray();
gl.bindVertexArray(vertexArrayObject);
gl.enableVertexAttribArray(positionAttributeLocation);

// these are the properties of the buffer on the GPU
// these tell the GPU how to pull data out of the buffer and stick it into the a_position attribute, so that the vertex shader can run in parallel against all of the buffer entries
// the GPU will loop through the buffer, and for each loop iteration it will extract some data from the buffer, turn that data into a vec4 a_position
// then the GPU will execute vertex.glsl in parallel, each parallel execution having a different value for vec4 a_position
// these values tell the GPU how to iterate through the buffer
// so start at the beginning of the buffer, every iteration read 2 32 bit floats, and jump forward 2 * 32 bits
// the vec4 will get its x and y from the buffer, and the z and w will be set to 0 and 1
const size = 2;
const type = gl.FLOAT;
const normalize = false;
const stride = 0;
const offset = 0;

// this binds the current ARRAY_BUFFER to the attribute
// so a_position is now bound to positionBuffer
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

// sets <canvas> internal pixel dimensions to its current css dimensions
resizeCanvasToDisplaySize(canvas);

// this tells webgl how to convert from clip space to screen space (pixels)
// clip space is [-1, 1], screen space is [0, canvas.width], [0, canvas.height]
gl.viewport(0, 0, canvas.width, canvas.height);

// make canvas transparent
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

// execute our shaders
gl.useProgram(program);

// this might be redundant
gl.bindVertexArray(vertexArrayObject);

// gl.TRIANGLES means each time the vertex shader is run 3 times, webgl will draw a triangle based on the 3 values we set gl_Position to in the vertex shader
const primitiveType = gl.TRIANGLES;
const offset2 = 0;
const count = 3; // execute the vertex shader 3 times
gl.drawArrays(primitiveType, offset2, count);










