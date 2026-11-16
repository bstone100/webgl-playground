import { Shape } from "./shape.js";
import {Point3} from "../math/point3.js";

export class Cylinder extends Shape {
    constructor(props = {}) {
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

    // here's how we're going to make a cylinder
    // the top surface is a circle, made of a pizza of triangles
    // the bottom surface is the same
    // the main surface is made up of rectangular faces, each face being two triangles
    // we need 2 * (n + 1) vertices to form all of the triangles
    // cylinder is centered at origin
    get vertices() {
        // let's make the vertices for the top surface
        // that's just a circle on the xz plane, elevated by height/2

        let vertices = [];

        // I am going counterclockwise around the y axis, that's why the z value is flipped
        // need to multiply x and z by radius
        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const angle = i * deltaAngle;
            const point = new Point3({x: Math.cos(angle) * this.radius, y: this.height / 2, z: -Math.sin(angle) * this.radius});
            vertices.push(point.x, point.y, point.z);
            // index: i
            // with n = 25, indices [0, 24], [0, n - 1]
        }

        // center of top surface
        vertices.push(0, this.height / 2, 0);
        // index: n
        // with n = 25, index = 25

        // bottom surface
        for (let i = 0; i < this.resolution; i++) {
            const angle = i * deltaAngle;
            const point = new Point3({x: Math.cos(angle) * this.radius, y: -this.height / 2, z: -Math.sin(angle) * this.radius});
            vertices.push(point.x, point.y, point.z);
            // with n = 25, indices [26, 50], [n + 1, n + 1 + n - 1]
            // index: n + 1 + i
        }

        // center of bottom surface
        vertices.push(0, -this.height / 2, 0);
        // index = 51
        // index: n + 1 + n

        return vertices;
    }

    // the top and bottom surfaces are just circles, so the triangles are pizza slices
    // the main surface has n rectangular faces, each made of two triangles
    get indices() {
        // let's make top surface first
        // we need indices [0, n - 1] and n

        let indices = [];

        // top surface
        // surface normal for each triangle is pointing up
        for (let i = 0; i < this.resolution; i++) {
            // top left, bottom, top right (counterclockwise)
            indices.push((i + 1) % this.resolution, this.resolution, i);
        }

        // bottom surface
        // ensure triangles are counterclockwise relative to the surface normal which is pointing down
        for (let i = 0; i < this.resolution; i++) {
            // we should go top right, bottom, top left so that it's counterclockwise if you were looking down the surface normal
            indices.push(i, 2 * this.resolution + 1, (i + 1) % this.resolution);
        }

        // now time to make the main surface
        // there are n faces
        // each face needs two vertices from the top circle and two vertices from the bottom circle
        for (let i = 0; i < this.resolution; i++) {
            // let's list the 4 corners of this face
            // we're going to need to use i to index into the top and bottom set
            const topLeft = i;
            const topRight = (i + 1) % this.resolution;
            const bottomLeft = this.resolution + 1 + i;
            const bottomRight = this.resolution + 1 + (i + 1) % this.resolution;

            // now make two triangles from the face
            // bottom left triangle
            indices.push(topLeft, bottomLeft, bottomRight);
            indices.push(topLeft, bottomRight, topRight);
        }

        return indices;
    }
}





























