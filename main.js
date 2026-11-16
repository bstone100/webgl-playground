import {createProgram, createShader, drawTriangle, resizeCanvasToDisplaySize} from "./helpers.js";

const canvas = document.querySelector("canvas");

const gl = canvas.getContext("webgl2");

// output black to the canvas
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// we need to get our shaders as text
const vertexGLSL = await fetch("./vertex.glsl").then(res => res.text());
const fragmentGLSL = await fetch("./fragment.glsl").then(res => res.text());

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexGLSL);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentGLSL);

const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");

// this is a buffer on the GPU
const positionBuffer = gl.createBuffer();

// ARRAY_BUFFER is a bind point
// you bind a resource to a bind point, then other functions refer to the resource through the bind point
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const vertexArrayObject = gl.createVertexArray();
gl.bindVertexArray(vertexArrayObject);
gl.enableVertexAttribArray(positionAttributeLocation);

const size = 2;
const type = gl.FLOAT;
const normalize = false;
const stride = 0;
const offset = 0;

gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

resizeCanvasToDisplaySize(canvas);

gl.viewport(0, 0, canvas.width, canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);



const triangles = [
    {
        vertices: [
            0, 0,
            -0.5, 0,
            -0.5, 0.5
        ],
        color: {
            r: 1,
            g: 0,
            b: 0
        }
    },
    {
        vertices: [
            0, 0,
            0.5, 0,
            0.5, 0.5
        ],
        color: {
            r: 0,
            g: 1,
            b: 0
        }
    },
    {
        vertices: [
            0, 0,
            -0.5, -0.5,
            0.5, -0.5
        ],
        color: {
            r: 0,
            g: 0,
            b: 1
        }
    }
];

for (const triangle of triangles) {
    drawTriangle(triangle.vertices, triangle.color);
}













