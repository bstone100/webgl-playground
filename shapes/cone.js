import { Shape } from "./shape.js";
import {Point3} from "../math/point3.js";

export class Cone extends Shape {
    constructor(props) {
        super(props);

        const {
            radius = 0.25,
            height = 0.5,
            resolution = 25
        } = props;

        this.radius = radius;
        this.height = height;
        this.resolution = Math.max(resolution, 4);
    }

    // the bottom surface is a circle, like a pizza, facing down
    // the main surface is triangles where two points are on the circle and the third is the apex
    get vertices() {
        // do the bottom surface first
        // will rotate around the y axis counterclockwise to get points on the xz plane, then adjust them down vertically

        let vertices = [];

        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const angle = i * deltaAngle;
            const point = new Point3({x: Math.cos(angle), y: -this.height / 2, z: -Math.sin(angle)});
            vertices.push(point.x, point.y, point.z);
        }

        // push the center of the bottom surface
        vertices.push(0, -this.height / 2, 0);

        // push the apex
        vertices.push(0, this.height / 2, 0);

        return vertices;
    }

    get indices() {
        // let's do the bottom surface first
        // remember to make the triangles counterclockwise given the surface normal is pointing down

        let indices = [];

        const bottomCenter = this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            indices.push(i, bottomCenter, (i + 1) % this.resolution);
        }

        // now do the main surface
        const apex = this.resolution + 1;
        for (let i = 0; i < this.resolution; i++) {
            indices.push(apex, i, (i + 1) % this.resolution);
        }

        return indices;
    }
}































