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

        this.gl.uniform1i(
            this.gl.getUniformLocation(this._shaderProgram, "u_spotLightCount"),
            spotLightCount
        );

        // to fill a uniform that is an array of a struct we need to do it one property at a time
        for (let i = 0; i < spotLightCount; i++) {
            const spotLight = spotLights[i];
            // set each of the properties
            this.gl.uniform4fv(
                this.gl.getUniformLocation(this._shaderProgram, `u_spotLights[${i}].position`),
                spotLight.transform.T.toArray() // pull the translation out of the spot light's transform
            );
        }


        // struct PointLight {
        //     vec3 position;
        //     vec3 color;
        // };
        //
        // struct SpotLight {
        //     vec3 position;
        //     vec3 direction;
        //     vec3 color;
        //     float innerCutoffAngle;
        //     float outerCutoffAngle;
        // };
        //
        // #define MAX_POINT_LIGHTS 10
        // #define MAX_SPOT_LIGHTS 10
        //
        // uniform int u_spotLightCount;
        // uniform SpotLight u_spotLights[MAX_SPOT_LIGHTS];
        //
        // uniform int u_pointLightCount;
        // uniform PointLight u_pointLights[MAX_POINT_LIGHTS];

        // let's pass an object color uniform

        const colorUniformLocation = this.gl.getUniformLocation(this._shaderProgram, "u_objectColor");
        this.gl.uniform4fv(colorUniformLocation, this.objectColor.toArray()); // pass red for now

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



















