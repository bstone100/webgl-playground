import {Point3} from "../math/point3.js";
import {SceneObject} from "../scene-object.js";
import {polarToCartesian} from "../math/utils.js";
import {Vec3} from "../math/vec3.js";

export class Cylinder extends SceneObject {
    constructor(props = {}, gl) {
        super(props, gl);

        const {
            radius = 0.25,
            height = 0.5,
            resolution = 25
        } = props;

        this.radius = radius;
        this.height = height;
        this.resolution = Math.max(resolution, 4);

        this.buildMesh();

        this.setUp();
    }

    // I'm going to rewrite the code to make the mesh to make it cleaner

    #vertices = [];
    #normals = [];
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
        return this.#indices.length;
    }

    // let's make the vertices, normals, and indices in one function
    buildMesh() {
        // do the top surface first
        // it's just a circle offset at y = height / 2
        // do the vertices, normals, indices together

        const topCenter = new Point3({x: 0, y: this.height / 2, z: 0});
        this.#vertices.push(topCenter.x, topCenter.y, topCenter.z);
        this.#normals.push(0, 1, 0); // pointing up
        const indexOfTopCenter = 0;
        const indexStartOfTopCircle = indexOfTopCenter + 1;

        // do top surface edge vertices
        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const theta = i * deltaAngle;
            // for x and z
            const point2 = polarToCartesian({
                radius: this.radius,
                theta
            });
            const y = this.height / 2;

            this.#vertices.push(point2.x, y, point2.y);
            this.#normals.push(0, 1, 0); // pointing up

            const indexOfVertex = indexStartOfTopCircle + i;
            const indexOfNextVertex = indexStartOfTopCircle + (i + 1) % this.resolution;

            // make a triangle
            this.#indices.push(indexOfNextVertex, indexOfTopCenter, indexOfVertex);
        }

        // do bottom surface

        const bottomCenter = new Point3({x: 0, y: -this.height / 2, z: 0});
        this.#vertices.push(bottomCenter.x, bottomCenter.y, bottomCenter.z);
        this.#normals.push(0, -1, 0);
        const indexOfBottomCenter = indexStartOfTopCircle + this.resolution;
        const indexStartOfBottomCircle = indexOfBottomCenter + 1;

        for (let i = 0; i < this.resolution; i++) {
            const theta = i * deltaAngle;
            const point2 = polarToCartesian({
                radius: this.radius,
                theta
            });
            const y = -this.height / 2;

            this.#vertices.push(point2.x, y, point2.y);
            this.#normals.push(0, -1, 0);

            const indexOfVertex = indexStartOfBottomCircle + i;
            const indexOfNextVertex = indexStartOfBottomCircle + (i + 1) % this.resolution;

            // make a triangle: go in reverse order so that its counterclockwise when looking from the bottom
            this.#indices.push(indexOfVertex, indexOfBottomCenter, indexOfNextVertex);
        }

        // now do main surface

        // we need to go around the circumference making a vertex on the top and bottom
        // we can copy the values from the existing vertices

        const indexStartOfMainSurface = indexStartOfBottomCircle + this.resolution;

        for (let i = 0; i < this.resolution; i++) {
            const theta = i * deltaAngle;
            const point2 = polarToCartesian({
                radius: this.radius,
                theta
            });

            // make two vertices: top then bottom
            this.#vertices.push(point2.x, this.height / 2, point2.y);
            this.#vertices.push(point2.x, -this.height / 2, point2.y);

            // both have normals pointing outward
            const normal = new Vec3({x: point2.x, y: 0, z: point2.y}).normalize();
            this.#normals.push(normal.x, normal.y, normal.z);
            this.#normals.push(normal.x, normal.y, normal.z);

            // now make a triangle

            const indexOfTopLeftVertex = indexStartOfMainSurface + i * 2;
            const indexOfBottomLeftVertex = indexOfTopLeftVertex + 1;

            const iNext = (i + 1) % this.resolution;
            const indexOfTopRightVertex = indexStartOfMainSurface + iNext * 2
            const indexOfBottomRightVertex = indexOfTopRightVertex + 1;

            // make two triangles
            this.#indices.push(indexOfTopLeftVertex, indexOfBottomLeftVertex, indexOfBottomRightVertex); // bottom left triangle
            this.#indices.push(indexOfTopLeftVertex, indexOfBottomRightVertex, indexOfTopRightVertex);
        }
    }
}





























