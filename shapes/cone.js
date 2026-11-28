import {Point3} from "../math/point3.js";
import {SceneObject} from "../scene-object.js";
import {cartesianToPolar, polarToCartesian, sphericalToCartesian} from "../math/utils.js";

export class Cone extends SceneObject {
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

    buildMesh() {
        // let's build vertices, normals, and indices together
        // the main surface and the bottom surface need their own vertices because they need their own normals

        // start with the bottom face

        // bottom center
        const bottomCenter = new Point3({x: 0, y: -this.height / 2, z: 0});
        this.#vertices.push(bottomCenter.x, bottomCenter.y, bottomCenter.z);
        this.#normals.push(0, -1, 0);
        const indexOfBottomCenter = 0;
        const indexStartOfBottomCircle = indexOfBottomCenter + 1;

        const deltaAngle = 2 * Math.PI / this.resolution;
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

            this.#indices.push(indexOfVertex, indexOfBottomCenter, indexOfNextVertex);
        }

        // now build main surface

        // the surface normals can be defined in spherical coordinates
        // all of the surface normals will have the same theta value, whereas phi will vary
        // theta is the angle between the surface normal and the y axis
        // theta is a simple function of height and radius

        const indexStartOfMainSurface = indexStartOfBottomCircle + this.resolution;

        const theta = Math.atan2(this.height, this.radius);

        for (let i = 0; i < this.resolution; i++) {
            const phi = i * deltaAngle;
            const point2 = polarToCartesian({
                radius: this.radius,
                theta: phi
            });

            // for each iteration in this loop, we should make one bottom edge vertex, one apex vertex, a normal for both of them, and then one triangle using those two vertices plus the edge vertex from the next iteration

            const edgeVertex = new Point3({x: point2.x, y: -this.height / 2, z: point2.y});
            const apexVertex = new Point3({x: 0, y: this.height / 2, z: 0});

            // now we can easily grab the surface normal
            const edgeVertexNormal = sphericalToCartesian({
                radius: 1,
                theta,
                phi
            });

            // for phi add half of a rotation since the apex is in the middle of the two edge vertices
            const apexVertexNormal = sphericalToCartesian({
                radius: 1,
                theta,
                phi: phi + deltaAngle / 2
            });

            this.#vertices.push(edgeVertex.x, edgeVertex.y, edgeVertex.z);
            this.#vertices.push(apexVertex.x, apexVertex.y, apexVertex.z);

            this.#normals.push(edgeVertexNormal.x, edgeVertexNormal.y, edgeVertexNormal.z);
            this.#normals.push(apexVertexNormal.x, apexVertexNormal.y, apexVertexNormal.z);

            // now make a triangle
            const indexOfEdgeVertex = indexStartOfMainSurface + i * 2;
            const indexOfApexVertex = indexOfEdgeVertex + 1;
            const iNext = (i + 1) % this.resolution;
            const indexOfNextEdgeVertex = indexStartOfMainSurface + iNext * 2;

            this.#indices.push(indexOfApexVertex, indexOfEdgeVertex, indexOfNextEdgeVertex);
        }
    }
}































