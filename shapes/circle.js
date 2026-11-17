import {Point2} from "../math/point2.js";
import {SceneNode} from "../scene-node.js";

export class Circle extends SceneNode {
    constructor(props = {}) {
        super(props);

        const {
            radius = 0.25,
            resolution = 25 // how many triangles to build the circle out of
        } = props;

        this.radius = radius;
        this.resolution = Math.max(resolution, 4);
    }

    // we will be making n triangles
    // each triangle shares two vertices with its two neighbors
    // all triangles share a vertex at the origin
    // there will be n + 1 vertices
    // we should start at 0 degrees and go radially around the origin, increasing by 2pi/n degrees
    // vertex is at radius * unit vector
    // unit vector at theta is (cos(theta), sin(theta))
    get vertices() {
        let vertices = [];

        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const angle = i * deltaAngle;
            const point = new Point2({x: Math.cos(angle), y: Math.sin(angle)}).times(this.radius);
            vertices.push(point.x, point.y, 0);
        }

        vertices.push(0, 0, 0);
        return vertices;
    }

    // n triangles, 3 indices per triangle
    get indices() {
        let indices = [];

        for (let i = 0; i < this.resolution; i++) {
            indices.push((i + 1) % this.resolution, this.resolution, i);
        }

        return indices;
    }
}




















