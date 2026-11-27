import {SceneObject} from "../scene-object.js";
import {polarToCartesian} from "../math/utils.js";

export class Circle extends SceneObject {
    constructor(props = {}, gl) {
        super(props, gl);

        const {
            radius = 0.25,
            resolution = 25 // how many triangles to build the circle out of
        } = props;

        this.radius = radius;
        this.resolution = Math.max(resolution, 4);

        this.setUp();
    }

    // we will be making n triangles
    // each triangle shares two vertices with its two neighbors
    // all triangles share a vertex at the origin
    // there will be n + 1 vertices
    // we should start at 0 degrees and go radially around the origin, increasing by 2pi/n degrees
    // vertex is at radius * unit vector
    // unit vector at theta is (cos(theta), sin(theta))

    // this is a circle flat on the xy plane
    get vertices() {
        let vertices = [];

        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const angle = i * deltaAngle;
            const point = polarToCartesian({
                radius: this.radius,
                theta: angle
            });
            vertices.push(point.x, point.y, 0);
        }

        // add a vertex in the center of the circle
        vertices.push(0, 0, 0);
        return vertices;
    }

    // all facing +z
    get normals() {
        let normals = [];
        for (let i = 0; i < this.resolution + 1; i++) {
            normals.push(0, 0, 1);
        }
        return normals;
    }

    // n triangles, 3 indices per triangle
    get indices() {
        let indices = [];

        for (let i = 0; i < this.resolution; i++) {
            indices.push((i + 1) % this.resolution, this.resolution, i);
        }

        return indices;
    }

    get indicesCount() {
        return this.resolution * 3;
    }
}




















