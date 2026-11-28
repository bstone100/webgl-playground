import {Vec3} from "../math/vec3.js";
import {SceneObject} from "../scene-object.js";
import {polarToCartesian, sphericalToCartesian} from "../math/utils.js";

export class Torus extends SceneObject {
    constructor(props = {}, gl) {
        super(props, gl);

        const {
            minorRadius = 0.25,
            majorRadius = 0.5,
            resolution = 25
        } = props;

        this.minorRadius = minorRadius;
        this.majorRadius = majorRadius;
        this.resolution = Math.max(resolution, 4);

        this.buildMesh();

        this.setUp();
    }

    // do vertices and normals together using spherical and polar coordinates
    #vertices = [];
    #normals = [];

    get vertices() {
        return this.#vertices;
    }

    get normals() {
        return this.#normals;
    }

    buildMesh() {
        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const phi = i * deltaAngle;

            const majorOriginToMinorOrigin = sphericalToCartesian({
                radius: this.majorRadius,
                theta: Math.PI / 2,
                phi
            });
            for (let j = 0; j < this.resolution; j++) {
                const theta = j * deltaAngle;

                const minorOriginToSurface = sphericalToCartesian({
                    radius: this.minorRadius,
                    theta,
                    phi
                })

                const vertex = majorOriginToMinorOrigin.plus(minorOriginToSurface);
                this.#vertices.push(vertex.x, vertex.y, vertex.z);

                const normal = minorOriginToSurface.normalize();
                this.#normals.push(normal.x, normal.y, normal.z);
            }
        }
    }

    get indicesCount() {
        return this.resolution * this.resolution * 6;
    }

    // the vertices are going to form rectangular faces across the surface
    // we need to identify each face and then break it into two triangles
    // this should be quite similar to how we get the indices from a sphere
    // actually it's identical to how we get the indices from a sphere
    get indices() {
        let indices = [];

        // outer loop traces around the y axis counterclockwise (xz plane rotations)
        // inner loop traces around the z axis counterclockwise (xy plane rotations)
        for (let xzRotations = 0; xzRotations < this.resolution; xzRotations++) {
            for (let xyRotations = 0; xyRotations < this.resolution; xyRotations++) {
                const bottomLeft = this.rotationsToIndex(xzRotations, xyRotations);
                const topLeft = this.rotationsToIndex(xzRotations, xyRotations + 1);
                const bottomRight = this.rotationsToIndex(xzRotations + 1, xyRotations);
                const topRight = this.rotationsToIndex(xzRotations + 1, xyRotations + 1);

                // triangles
                indices.push(topLeft, bottomLeft, bottomRight);
                indices.push(topLeft, bottomRight, topRight);
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























