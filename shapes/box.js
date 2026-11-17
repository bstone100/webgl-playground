import {SceneNode} from "../scene-node.js";

const vertexGLSL = await fetch("./boxVertexShader.glsl").then(res => res.text());
const fragmentGLSL = await fetch("./boxFragmentShader.glsl").then(res => res.text());

export class Box extends SceneNode {
    constructor(gl, props = {}) {
        super(gl, props);

        const {
            width = 0.5,
            height = 0.5,
            depth = 0.5
        } = props;

        this._width = width;
        this._height = height;
        this._depth = depth;

        // cache
        this._updateVertices();

        // create the shader program here

        // this creates a buffer in GPU memory
        // so this._vertices is on the CPU and this._vertexBuffer is on the GPU
        this._vertexBuffer = this.gl.createBuffer();
        this._updateVertexBuffer();

        // another buffer in GPU memory
        this._indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), this.gl.STATIC_DRAW);

        // now load the shaders and make a shader program

        // make vertex shader
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vertexGLSL);
        this.gl.compileShader(vertexShader);

        // make fragment shader
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fragmentGLSL);
        this.gl.compileShader(fragmentShader);

        // make program
        this._shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this._shaderProgram, vertexShader);
        this.gl.attachShader(this._shaderProgram, fragmentShader);
        this.gl.linkProgram(this._shaderProgram);
    }

    // called every frame
    draw() {
        // this code links the vertex buffer on the GPU to the correct attribute in the vertex shader
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._vertexBuffer);
        const posAttribLocation = this.gl.getAttribLocation(this._shaderProgram, "a_position");
        this.gl.vertexAttribPointer(posAttribLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(posAttribLocation);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    }

    get width() {
        return this._width;
    }

    set width(val) {
        this._width = val;
        this._updateVertices();
        this._updateVertexBuffer();
    }

    get height() {
        return this._height;
    }

    set height(val) {
        this._height = val;
        this._updateVertices();
        this._updateVertexBuffer();
    }

    get depth() {
        return this._depth;
    }

    set depth(val) {
        this._depth = val;
        this._updateVertices();
        this._updateVertexBuffer();
    }

    _updateVertices() {
        this._vertices = [
            // 4 corners of top face
            this._width/2, this._height/2, this._depth/2, // +x, +y, +z    0   top left of top face
            this._width/2, this._height/2, -this._depth/2, // +x, +y, -z   1   bottom left of top face
            -this._width/2, this._height/2, -this._depth/2, // -x, +y, -z  2   bottom right of top face
            -this._width/2, this._height/2, this._depth/2, // -x, +y, +z   3   top right of top face

            // 4 corners of bottom face
            this._width/2, -this._height/2, this._depth/2, // +x, -y, +z   4   top left of bottom face
            this._width/2, -this._height/2, -this._depth/2 // +x, -y, -z   5   bottom left of bottom face
            -this._width/2, -this._height/2, -this._depth/2, // -x, -y, -z 6   bottom right of bottom face
            -this._width/2, -this._height/2, this._depth/2, // -x, -y, +z  7   top right of bottom face
        ];
    }

    _updateVertexBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this._vertices), this.gl.DYNAMIC_DRAW);
    }

    // 8 vertices
    get vertices() {
        return this._vertices;
    }

    // 6 faces, 2 triangles per face, 3 indices per triangle = 6 * 2 * 3 = 36 indices
    // NOTE: may need to revisit this and ensure the triangles are all counterclockwise with respect to the surface normal

    _indices = [
        // top face
        // bottom left triangle of top face
        0, 1, 2,
        // top right triangle of top face
        0, 2, 3,

        // bottom face
        // bottom left triangle of bottom face
        4, 5, 6,
        // top right triangle of bottom face
        4, 6, 7,

        // right face
        // bottom left triangle of right face
        0, 4, 5,
        // top right triangle of right face
        0, 5, 1,

        // left face
        // bottom left triangle of left face
        2, 6, 7,
        2, 7, 3,

        // front face
        // bottom left triangle of front face
        3, 7, 4,
        3, 4, 0,

        // back face
        1, 5, 6,
        1, 6, 2
    ];

    get indices() {
        return this._indices;
    }
}



















