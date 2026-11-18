import {SceneObject} from "../scene-object.js";

const vertexGLSL = await fetch("./box.vert.glsl").then(res => res.text());
const fragmentGLSL = await fetch("./box.frag.glsl").then(res => res.text());

export class Box extends SceneObject {
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

        // make a GPU buffer for the normals
        this._normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this._normals), this.gl.STATIC_DRAW);

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
    // let's say that a scene object is passed here with all info we need to render this object
    draw(scene) {
        // bind attributes here

        // this code links the vertex buffer on the GPU to the correct attribute in the vertex shader
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._vertexBuffer);
        const posAttribLocation = this.gl.getAttribLocation(this._shaderProgram, "a_position");
        this.gl.vertexAttribPointer(posAttribLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(posAttribLocation);

        // also link the normal buffer to an attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._normalBuffer);
        const normalAttribLocation = this.gl.getAttribLocation(this._shaderProgram, "a_normal");
        this.gl.vertexAttribPointer(normalAttribLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(normalAttribLocation);

        // this tells the gpu to pull indices from our index buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        this.gl.useProgram(this._shaderProgram);

        // set uniforms here

        // I think each light in our scene needs to be passed into the shaders as a uniform
        // for now we can just set some common properties
        // so we will need to have access here to the lights and camera

        // we need to pull all the lights from the scene and then pass them to the shader program
        // we need to put a limit on the number of lights as well as tell the shader how many lights have been passed, and also what kind of lights

        // let's just assume that scene has a pointLights array and a spotLights array
        const pointLights = scene.pointLights;
        const spotLights = scene.spotLights;
        // pass them as uniforms

        const maxLights = 10;
        // just grab the first 10
        const spotLightCount = Math.min(spotLights.length, maxLights);
        const pointLightCount = Math.min(pointLights.length, maxLights);

        this.gl.uniform1i(
            this.gl.getUniformLocation(this._shaderProgram, "u_spotLightCount"),
            spotLightCount
        );

        // to fill a uniform that is an array of a struct we need to do it one property at a time
        for (let i = 0; i < spotLightCount; i++) {
            const spotLight = spotLights[i];
            this.gl.uniformMatrix4fv(
                this.gl.getUniformLocation(this._shaderProgram, `u_spotLights[${i}].transform`),
                spotLight.transform.toArray()
            );
            this.gl.uniform4fv(
                this.gl.getUniformLocation(this._shaderProgram, `u_spotLights[${i}].color`),
                spotLight.lightColor.toArray()
            );
            this.gl.uniform1f(
                this.gl.getUniformLocation(this._shaderProgram, `u_spotLights[${i}].innerCutoffAngle`),
                spotLight.innerCutoffAngleDegrees
            );
            this.gl.uniform1f(
                this.gl.getUniformLocation(this._shaderProgram, `u_spotLights[${i}].outerCutoffAngle`),
                spotLight.outerCutoffAngleDegrees
            );
        }

        // now pack the point lights

        this.gl.uniform1i(
            this.gl.getUniformLocation(this._shaderProgram, "u_pointLightCount"),
            pointLightCount
        );

        for (let i = 0; i < pointLightCount; i++) {
            const pointLight = pointLights[i];
            this.gl.uniformMatrix4fv(
                this.gl.getUniformLocation(this._shaderProgram, `u_pointLights[${i}].transform`),
                pointLight.transform.toArray()
            );
            this.gl.uniform4fv(
                this.gl.getUniformLocation(this._shaderProgram, `u_pointLights[${i}].color`),
                pointLight.lightColor.toArray()
            );
        }

        // let's now pass the view matrix in as a uniform
        // the view matrix is the inverse of the camera's transform matrix
        // let's assume the scene has a camera
        const camera = scene.camera;
        const viewMatrix = camera.transform.toInverse();

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this._shaderProgram, "u_viewMatrix"),
            viewMatrix.toArray()
        );

        // we also should pass the camera's transform since it's needed to calculate the specular
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this._shaderProgram, "u_cameraTransform"),
            camera.transform.toArray()
        );

        // pass an ambient light color
        const ambientLightColor = scene.ambientLightColor;
        this.gl.uniform4fv(
            this.gl.getUniformLocation(this._shaderProgram, "u_ambientLightColor"),
            ambientLightColor.toArray()
        );


        // let's pass an object color uniform

        const colorUniformLocation = this.gl.getUniformLocation(this._shaderProgram, "u_objectColor");
        this.gl.uniform4fv(colorUniformLocation, this.objectColor.toArray());

        // let's pass this object's transform matrix
        const transformUniformLocation = this.gl.getUniformLocation(this._shaderProgram, "u_objectTransform");
        this.gl.uniformMatrix4fv(transformUniformLocation, false, this.transform.toArray());

        // now finally draw
        // the count is the number of indices, unsigned short is the type of the indices (Uint16)
        this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
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

    // okay we need to have 4 vertices per face so that we can give each vertex its own normal
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

            // 4 corners of right face
            this._width/2, this._height/2, this._depth/2, // +x +y +z    top left of right face 8
            this._width/2, -this._height/2, this._depth/2, // +x, -y, +z  bottom left of right face 9
            this._width/2, -this._height/2, -this._depth/2, // +x, -y, -z  bottom right 10
            this._width/2, this._height/2, -this._depth/2, // +x, +y, -z top right  11

            // left face
            // top left
            // -x +y -z
            // bottom left
            // -x -y -z
            // bottom right
            // -x -y +z
            // top right
            // -x +y +z
            -this._width/2, this._height/2, -this._depth/2, //  12
            -this._width/2, -this._height/2, -this._depth/2, // 13
            -this._width/2, -this._height/2, this._depth/2, //  14
            -this._width/2, this._height/2, this._depth/2, //   15

            // front face
            // top left
            // -x +y +z
            // bottom left
            // -x -y +z
            // bottom right
            // +x -y +z
            // top right
            // +x +y +z
            -this._width/2, this._height/2, this._depth/2, //   16
            -this._width/2, -this._height/2, this._depth/2, //  17
            this._width/2, -this._height/2, this._depth/2, //   18
            this._width/2, this._height/2, this._depth/2, //    19

            // back face
            // top left
            // +x +y -z
            // bottom left
            // +x -y -z
            // bottom right
            // -x -y -z
            // top right
            // -x +y -z
            this._width/2, this._height/2, -this._depth/2, //   20
            this._width/2, -this._height/2, -this._depth/2, //  21
            -this._width/2, -this._height/2, -this._depth/2, // 22
            -this._width/2, this._height/2, -this._depth/2 //   23
        ];
    }

    // normals
    // each vertex gets a normal
    _normals = [
        // top face
        // all pointing up
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // bottom face
        // pointing down
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // right face
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // left face
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // front face
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // back face
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1
    ];

    get normals() {
        return this._normals;
    }

    _updateVertexBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this._vertices), this.gl.DYNAMIC_DRAW);
    }

    // 8 vertices
    get vertices() {
        return this._vertices;
    }

    // okay let's redo the indices
    // there are 6 faces, 24 vertices, 2 triangles per face, 12 triangles, 3 vertices per triangle, 36 indices
    _indices = [
        // top face
        // bottom left triangle
        0, 1, 2,
        // top left triangle
        0, 2, 3,

        // bottom face
        // make sure to go counterclockwise relative to the normal
        4, 6, 5,
        4, 7, 6,

        // right face 8, 9, 10, 11
        8, 9, 10,
        8, 10, 11,

        // left face 12, 13, 14, 15
        12, 13, 14,
        12, 14, 15,

        // front face 16 17 18 19
        16, 17, 18,
        16, 18, 19,

        // back face 20, 21, 22, 23
        20, 21, 22,
        20, 22, 23

    ];

    get indices() {
        return this._indices;
    }
}



















