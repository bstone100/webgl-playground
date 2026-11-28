import {SceneNode} from "./scene-node.js";
import {Color} from "./math/color.js";
import {Point3} from "./math/point3.js";
import {AABB} from "./math/aabb.js";
import {Box} from "./shapes/box.js";

const vertexGLSL = await fetch("./materials/phong.vert.glsl").then(res => res.text());
const fragmentGLSL = await fetch("./materials/phong.frag.glsl").then(res => res.text());

// a SceneObject has geometry
export class SceneObject extends SceneNode {
    #vertexBuffer;
    #normalBuffer;
    #indexBuffer;
    #shaderProgram;

    constructor(props, gl) {
        super(props);

        const {
            color = new Color({r: 1, g: 0, b: 0, a: 1})
        } = props;

        this.gl = gl; // store reference because it's needed for drawing
        this.color = color;
    }

    setUp() {
        // make vertex shader
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vertexGLSL);
        this.gl.compileShader(vertexShader);

        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            alert("vertex shader compilation error: " + this.gl.getShaderInfoLog(vertexShader));
        }

        // make fragment shader
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fragmentGLSL);
        this.gl.compileShader(fragmentShader);

        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            alert("fragment shader compilation error: " + this.gl.getShaderInfoLog(fragmentShader));
        }

        // make program
        this.#shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.#shaderProgram, vertexShader);
        this.gl.attachShader(this.#shaderProgram, fragmentShader);
        this.gl.linkProgram(this.#shaderProgram);

        if (!this.gl.getProgramParameter(this.#shaderProgram, this.gl.LINK_STATUS)) {
            alert("shader linking error: " + this.gl.getProgramInfoLog(this.#shaderProgram));
        }

        this.#vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

        // make a GPU buffer for the normals
        this.#normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);

        // another buffer in GPU memory
        this.#indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.#indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);
    }

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

        const pointLights = sceneInfo.pointLights;
        const spotLights = sceneInfo.spotLights;

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
                false,
                spotLight.getWorldTransform(sceneInfo).toArray()
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
                false,
                pointLight.getWorldTransform(sceneInfo).toArray()
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
        // there might also be no cameras in which case we'll need to make one
        const camera = sceneInfo.cameras[0];
        const cameraWorldTransform = camera.getWorldTransform(sceneInfo);
        const viewMatrix = cameraWorldTransform.toInverse();

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_viewMatrix"),
            false,
            viewMatrix.toArray()
        );

        // we also should pass the camera's transform since it's needed to calculate the specular
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_cameraWorldTransform"),
            false,
            cameraWorldTransform.toArray()
        );

        // also pass in the projection matrix
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, "u_projectionMatrix"),
            false,
            camera.getPerspective(aspectRatio).toArray()
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
            this.getWorldTransform(sceneInfo).toArray()
        );

        // now finally draw
        // the count is the number of indices, unsigned short is the type of the indices (Uint16)
        // this varies by shape, needs to come from the sub class
        // this.gl.drawElements(this.drawMode ?? this.gl.TRIANGLES, this.indicesCount, this.gl.UNSIGNED_SHORT, 0);
        const drawMode = this.drawMode === "lines" ? this.gl.LINES : this.gl.TRIANGLES;
        this.gl.drawElements(drawMode, this.indicesCount, this.gl.UNSIGNED_SHORT, 0);
    }

    // note: this should be cached and only recomputed if the vertices change
    getAABB() {
        // go through vertices and find min and max

        const min = new Point3({x: Infinity, y: Infinity, z: Infinity});
        const max = new Point3({x: -Infinity, y: -Infinity, z: -Infinity});

        // vertices are packed as a flat array
        const vertices = this.vertices;
        for (let i = 0; i < vertices.length; i += 3) {
            const vertex = new Point3({
                x: vertices[i],
                y: vertices[i + 1],
                z: vertices[i + 2]
            })

            min.x = Math.min(min.x, vertex.x);
            min.y = Math.min(min.y, vertex.y);
            min.z = Math.min(min.z, vertex.z);

            max.x = Math.max(max.x, vertex.x);
            max.y = Math.max(max.y, vertex.y);
            max.z = Math.max(max.z, vertex.z);
        }

        return new AABB({min, max});
    }

    showBoundingBoxLines() {
        // draw a wireframe box around this object using its aabb and lines
        // we probably don't want to load a shader program for each line segment
        // we should be able to take any mesh and draw it as a wireframe
        // at the very least, we should be able to reuse the vertices already declared in box.js

        // so we should be able to make a Box and then switch the mode to wireframe
        // that means the indices array will be different but the vertices and normals will be the same

        // okay I've set that up

        // need to make a new Box with draw mode "lines", and dimensions set using aabb dimensions

        const aabb = this.getAABB();
        const wireframeBox = new Box({
            width: aabb.width,
            height: aabb.height,
            depth: aabb.depth,
            drawMode: "lines"
        });

        // now need to insert the box into the scene graph so that it will get drawn next render
        // the box needs to be a child of this object because its vertices are meant to be transformed into this object's space

        // note: we don't want the wireframe box to be serialized

        this.children.push(wireframeBox);
    }

    hideBoundingBoxLines() {

    }
}

















