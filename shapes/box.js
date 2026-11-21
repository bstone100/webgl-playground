import {SceneObject} from "../scene-object.js";

const vertexGLSL = await fetch("./box.vert.glsl").then(res => res.text());
const fragmentGLSL = await fetch("./box.frag.glsl").then(res => res.text());

export class Box extends SceneObject {
    #vertexBuffer;
    #normalBuffer;
    #indexBuffer;
    #shaderProgram;
    
    constructor(props = {}, gl) {
        super(props, gl);

        const {
            width = 0.5,
            height = 0.5,
            depth = 0.5
        } = props;

        this.width = width;
        this.height = height;
        this.depth = depth;

        // create the shader program here

        // this creates a buffer in GPU memory
        // so this._vertices is on the CPU and this.#vertexBuffer is on the GPU
        this.#vertexBuffer = this.gl.createBuffer();
        this._updateVertexBuffer();

        // make a GPU buffer for the normals
        this.#normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);

        // another buffer in GPU memory
        this.#indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.#indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

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
        this.#shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.#shaderProgram, vertexShader);
        this.gl.attachShader(this.#shaderProgram, fragmentShader);
        this.gl.linkProgram(this.#shaderProgram);
    }

    // called every frame
    // let's say that a scene object is passed here with all info we need to render this object
    draw(sceneInfo) {
        // bind attributes here

        // this code links the vertex buffer on the GPU to the correct attribute in the vertex shader
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#vertexBuffer);
        const posAttribLocation = this.gl.getAttribLocation(this.#shaderProgram, "a_position");
        this.gl.vertexAttribPointer(posAttribLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(posAttribLocation);

        // also link the normal buffer to an attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#normalBuffer);
        const normalAttribLocation = this.gl.getAttribLocation(this.#shaderProgram, "a_normal");
        this.gl.vertexAttribPointer(normalAttribLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(normalAttribLocation);

        // this tells the gpu to pull indices from our index buffer
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.#indexBuffer);

        this.gl.useProgram(this.#shaderProgram);

        // set uniforms here

        // I think each light in our scene needs to be passed into the shaders as a uniform
        // for now we can just set some common properties
        // so we will need to have access here to the lights and camera

        // we need to pull all the lights from the scene and then pass them to the shader program
        // we need to put a limit on the number of lights as well as tell the shader how many lights have been passed, and also what kind of lights

        // let's just assume that scene has a pointLights array and a spotLights array
        const pointLights = sceneInfo.pointLights;
        const spotLights = sceneInfo.spotLights;
        // pass them as uniforms

        const maxLights = 10;
        // just grab the first 10
        const spotLightCount = Math.min(spotLights.length, maxLights);
        const pointLightCount = Math.min(pointLights.length, maxLights);

        this.gl.uniform1i(
            this.gl.getUniformLocation(this.#shaderProgram, "u_spotLightCount"),
            spotLightCount
        );

        // to fill a uniform that is an array of a struct we need to do it one property at a time
        for (let i = 0; i < spotLightCount; i++) {
            const spotLight = spotLights[i];
            this.gl.uniformMatrix4fv(
                this.gl.getUniformLocation(this.#shaderProgram, `u_spotLights[${i}].worldTransform`),
                spotLight.worldTransform.toArray()
            );
            this.gl.uniform4fv(
                this.gl.getUniformLocation(this.#shaderProgram, `u_spotLights[${i}].color`),
                spotLight.color.toArray()
            );
            this.gl.uniform1f(
                this.gl.getUniformLocation(this.#shaderProgram, `u_spotLights[${i}].innerCutoffAngle`),
                spotLight.innerCutoffAngleDegrees
            );
            this.gl.uniform1f(
                this.gl.getUniformLocation(this.#shaderProgram, `u_spotLights[${i}].outerCutoffAngle`),
                spotLight.outerCutoffAngleDegrees
            );
        }

        // now pack the point lights

        this.gl.uniform1i(
            this.gl.getUniformLocation(this.#shaderProgram, "u_pointLightCount"),
            pointLightCount
        );

        for (let i = 0; i < pointLightCount; i++) {
            const pointLight = pointLights[i];
            this.gl.uniformMatrix4fv(
                this.gl.getUniformLocation(this.#shaderProgram, `u_pointLights[${i}].worldTransform`),
                pointLight.worldTransform.toArray()
            );
            this.gl.uniform4fv(
                this.gl.getUniformLocation(this.#shaderProgram, `u_pointLights[${i}].color`),
                pointLight.color.toArray()
            );
        }

        // let's now pass the view matrix in as a uniform
        // the view matrix is the inverse of the camera's transform matrix
        // let's assume the scene has a camera
        // there might be multiple cameras but one of them will be considered active
        const camera = sceneInfo.cameras[0];
        const cameraWorldTransform = camera.worldTransform;
        const viewMatrix = cameraWorldTransform.toInverse();

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_viewMatrix"),
            viewMatrix.toArray()
        );

        // we also should pass the camera's transform since it's needed to calculate the specular
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_cameraWorldTransform"),
            cameraWorldTransform.toArray()
        );

        // also pass in the projection matrix
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        const near = 0.1;
        const far = 1000;
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_projectionMatrix"),
            camera.getPerspective(aspectRatio, near, far).toArray()
        );

        // pass an ambient light color
        const ambientLightColor = sceneInfo.ambientLights[0].color;
        this.gl.uniform4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_ambientLightColor"),
            ambientLightColor.toArray()
        );

        // gonna pass the canvas resolution
        this.gl.uniform2f(
            this.gl.getUniformLocation(this.#shaderProgram, "u_resolution"),
            this.gl.canvas.width, this.gl.canvas.height
        );


        // let's pass an object color uniform

        const colorUniformLocation = this.gl.getUniformLocation(this.#shaderProgram, "u_objectColor");
        this.gl.uniform4fv(colorUniformLocation, this.color.toArray());

        // let's pass this object's transform matrix
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_objectWorldTransform"),
            false,
            this.worldTransform.toArray()
        );

        // now finally draw
        // the count is the number of indices, unsigned short is the type of the indices (Uint16)
        this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
    }
    
    setWidth(val) {
        this.width = val;
        this._updateVertexBuffer();
    }
    
    setHeight(val) {
        this.height = val;
        this._updateVertexBuffer();
    }
    
    setDepth(val) {
        this.depth = val;
        this._updateVertexBuffer();
    }

    get vertices() {
        return [
            // 4 corners of top face
            this.width/2, this.height/2, this.depth/2, // +x, +y, +z    0   top left of top face
            this.width/2, this.height/2, -this.depth/2, // +x, +y, -z   1   bottom left of top face
            -this.width/2, this.height/2, -this.depth/2, // -x, +y, -z  2   bottom right of top face
            -this.width/2, this.height/2, this.depth/2, // -x, +y, +z   3   top right of top face

            // 4 corners of bottom face
            this.width/2, -this.height/2, this.depth/2, // +x, -y, +z   4   top left of bottom face
            this.width/2, -this.height/2, -this.depth/2 // +x, -y, -z   5   bottom left of bottom face
            -this.width/2, -this.height/2, -this.depth/2, // -x, -y, -z 6   bottom right of bottom face
            -this.width/2, -this.height/2, this.depth/2, // -x, -y, +z  7   top right of bottom face

            // 4 corners of right face
            this.width/2, this.height/2, this.depth/2, // +x +y +z    top left of right face 8
            this.width/2, -this.height/2, this.depth/2, // +x, -y, +z  bottom left of right face 9
            this.width/2, -this.height/2, -this.depth/2, // +x, -y, -z  bottom right 10
            this.width/2, this.height/2, -this.depth/2, // +x, +y, -z top right  11

            // left face
            // top left
            // -x +y -z
            // bottom left
            // -x -y -z
            // bottom right
            // -x -y +z
            // top right
            // -x +y +z
            -this.width/2, this.height/2, -this.depth/2, //  12
            -this.width/2, -this.height/2, -this.depth/2, // 13
            -this.width/2, -this.height/2, this.depth/2, //  14
            -this.width/2, this.height/2, this.depth/2, //   15

            // front face
            // top left
            // -x +y +z
            // bottom left
            // -x -y +z
            // bottom right
            // +x -y +z
            // top right
            // +x +y +z
            -this.width/2, this.height/2, this.depth/2, //   16
            -this.width/2, -this.height/2, this.depth/2, //  17
            this.width/2, -this.height/2, this.depth/2, //   18
            this.width/2, this.height/2, this.depth/2, //    19

            // back face
            // top left
            // +x +y -z
            // bottom left
            // +x -y -z
            // bottom right
            // -x -y -z
            // top right
            // -x +y -z
            this.width/2, this.height/2, -this.depth/2, //   20
            this.width/2, -this.height/2, -this.depth/2, //  21
            -this.width/2, -this.height/2, -this.depth/2, // 22
            -this.width/2, this.height/2, -this.depth/2 //   23
        ];
    }

    _updateVertexBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.DYNAMIC_DRAW);
    }

    get normals() {
        return [
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
    }

    // okay let's redo the indices
    // there are 6 faces, 24 vertices, 2 triangles per face, 12 triangles, 3 vertices per triangle, 36 indices
    get indices() {
        return [
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
    }

}



















