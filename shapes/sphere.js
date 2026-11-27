import {SceneObject} from "../scene-object.js";
import {sphericalToCartesian} from "../math/utils.js";

export class Sphere extends SceneObject {
    constructor(props = {}, gl) {
        super(props, gl);

        const {
            radius = 0.25,
            resolution = 25
        } = props;

        this.radius = radius;
        this.resolution = Math.max(resolution, 4);

        this.setUp();
    }

    get vertices() {
        let vertices = [];

        // i loop is around the xz plane
        // j loop is around the xy plane
        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const phi = i * deltaAngle;
            for (let j = 0; j < this.resolution; j++) {
                const theta = j * deltaAngle;

                const pos = sphericalToCartesian({
                    radius: this.radius,
                    theta,
                    phi
                });

                vertices.push(pos.x, pos.y, pos.z);
            }
        }

        return vertices;
    }

    // normals for sphere vertices are simple, just normalize the vertex
    // we don't even really need to provide normals, but I'll do it anyways
    get normals() {
        let normals = [];

        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const phi = i * deltaAngle;
            for (let j = 0; j < this.resolution; j++) {
                const theta = j * deltaAngle;

                const normal = sphericalToCartesian({
                    radius: this.radius,
                    theta,
                    phi
                }).normalize();

                normals.push(normal.x, normal.y, normal.z);
            }
        }

        return normals;
    }

    // each set of 4 vertices on the surface forms a face, each face has 2 triangles, each triangle needs 3 indices
    get indices() {
        let indices = [];

        // let's go around the sphere like we did for the vertices and try to form triangles
        for (let i = 0; i < this.resolution; i++) { // around xz plane
            for (let j = 0; j < this.resolution; j++) { // around xy plane
                // let's describe the face
                // face is 4 vertices
                const bottomLeft = this.rotationsToIndex(i, j);
                const topLeft = this.rotationsToIndex(i, j + 1);
                const bottomRight = this.rotationsToIndex(i + 1, j);
                const topRight = this.rotationsToIndex(i + 1, j + 1);

                // now form two triangles from this face
                indices.push(topLeft, bottomLeft, bottomRight); // bottom left triangle
                indices.push(topLeft, bottomRight, topRight); // top right triangle
            }
        }

        return indices;
    }

    get indicesCount() {
        return this.resolution * this.resolution * 6;
    }

    rotationsToIndex(xzRotations, xyRotations) {
        xzRotations = xzRotations % this.resolution;
        xyRotations = xyRotations % this.resolution;
        return xzRotations * this.resolution + xyRotations;
    }
}























