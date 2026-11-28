import {SceneObject} from "../scene-object.js";
import {Point3} from "../math/point3.js";

export class Line extends SceneObject {
    constructor(props = {}, gl) {
        super(props, gl);

        const {
            p1,
            p2
        } = props;

        this.p1 = new Point3(p1);
        this.p2 = new Point3(p2);

        this.drawMode = gl.LINES;

        this.buildMesh();

        this.setUp();
    }

    #vertices = [];
    #normals = []; // not certain what it means to be a normal for a line, probably not necessary
    #indices = [];

    get vertices() {
        return this.#vertices;
    }

    get normals() {
        return this.#normals;
    }

    get indices() {
        return this.#indices;
    }

    get indicesCount() {
        return 2;
    }

    buildMesh() {
        this.#vertices.push(this.p1.x, this.p1.y, this.p1.z);
        this.#vertices.push(this.p2.x, this.p2.y, this.p2.z);

        this.#normals.push(0, 1, 0);
        this.#normals.push(0, 1, 0);

        this.#indices.push(0, 1);
    }
}























