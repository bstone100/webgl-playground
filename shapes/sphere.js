import {Point3} from "../math/point3.js";
import {SceneObject} from "../scene-object.js";

export class Sphere extends SceneObject {
    constructor(props = {}) {
        super(props);

        const {
            radius = 0.25,
            resolution = 25
        } = props;

        this.radius = radius;
        this.resolution = Math.max(resolution, 4);
    }

    // I'm going to go 360 degrees around the xz axis and 360 degrees around the xy axis
    // these vertices form a surface of squares
    // there are n * n vertices
    get vertices() {
        let vertices = [];

        // i loop is around the xz plane
        // j loop is around the xy plane
        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const xzAngle = i * deltaAngle;
            const cosPhi = Math.cos(xzAngle);
            const sinPhi = Math.sin(xzAngle);
            for (let j = 0; j < this.resolution; j++) {
                const xyAngle = j * deltaAngle;
                const cosTheta = Math.cos(xyAngle);
                const sinTheta = Math.sin(xyAngle);

                // compute xyz from angles, normalize, then multiply by radius
                // note that z is flipped because I want to go counterclockwise around the xz plane
                let point = new Point3({x: cosTheta * cosPhi, y: sinTheta, z: -cosTheta * sinPhi}).normalize().times(this.radius);
                vertices.push(point.x, point.y, point.z);
                // what is this vertex's index?
                // i * n + j
            }
        }

        return vertices;
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

    rotationsToIndex(xzRotations, xyRotations) {
        xzRotations = xzRotations % this.resolution;
        xyRotations = xyRotations % this.resolution;
        return xzRotations * this.resolution + xyRotations;
    }
}























