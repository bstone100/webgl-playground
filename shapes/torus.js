import {Vec3} from "../math/vec3.js";
import {SceneNode} from "../scene-node.js";

export class Torus extends SceneNode {
    constructor(props = {}) {
        super(props);

        const {
            minorRadius = 0.25,
            majorRadius = 0.5,
            resolution = 25
        } = props;

        this.minorRadius = minorRadius;
        this.majorRadius = majorRadius;
        this.resolution = Math.max(resolution, 4);
    }

    // we will default the torus to be laid out on the xz plane
    // we'll do a 360 degree outer loop counterclockwise around the y axis using majorRadius
    // for each iteration in the outer loop, we'll do a 360 degree counterclockwise loop centered around the point from the outer loop
    get vertices() {
        let vertices = [];

        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const xzAngle = i * deltaAngle;
            const cosXzAngle = Math.cos(xzAngle);
            const sinXzAngle = Math.sin(xzAngle);

            // let's identify where we are
            // so this point will be the center of the circle that we're going to trace in the inner loop
            const originToTorusCenter = new Vec3({x: cosXzAngle, y: 0, z: -sinXzAngle}).times(this.majorRadius);

            // inner loop
            for (let j = 0; j < this.resolution; j++) {
                const xyAngle = j * deltaAngle;
                const cosXyAngle = Math.cos(xyAngle);
                const sinXyAngle = Math.sin(xyAngle);

                // now let's figure out where the vertex is
                // we can compute a vector as if this was a sphere and then add it to the vector from the outer loop to get the vertex

                const originToSphereSurface = new Vec3({x: cosXyAngle * cosXzAngle, y: sinXyAngle, z: -cosXyAngle * sinXzAngle}).normalize().times(this.minorRadius);

                const vertex = originToTorusCenter.plus(originToSphereSurface);
                vertices.push(vertex.x, vertex.y, vertex.z);
                // index: i * n + j
            }
        }

        return vertices;
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























