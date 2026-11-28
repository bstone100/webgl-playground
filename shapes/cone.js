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

        // what is the normal for the apex?
        // there isn't one
        // each triangle of the main surface needs the apex normal pointing in the same direction as the other two points at the bottom edge
        // so we need to make an apex for each triangle

        // the same question applies for the vertices on the bottom edge of the main surface
        // where should their normals be pointing?
        // we can calculate the exact normal for these vertices
        // the normal is a function of x and z
        // for the normal at the apex, we can find it using a point half way between the two bottom edge vertices of a surface triangle

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

            // now what is the normal for the edge vertex
            // we know the x and z value, we need to calculate the y value
            // it is derived from the slope of the surface, which has to do with the ratio of radius to height of the cone

            // const phi = cartesianToPolar().theta;

            // we already know phi, it's part of this loop

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

            // we can push those two vertices and normals

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

    // the bottom surface is a circle, like a pizza, facing down
    // the main surface is triangles where two points are on the circle and the third is the apex
    // get vertices() {
    //     // do the bottom surface first
    //     // will rotate around the y axis counterclockwise to get points on the xz plane, then adjust them down vertically
    //
    //     let vertices = [];
    //
    //     const deltaAngle = 2 * Math.PI / this.resolution;
    //     for (let i = 0; i < this.resolution; i++) {
    //         const angle = i * deltaAngle;
    //         const point = new Point3({x: Math.cos(angle), y: -this.height / 2, z: -Math.sin(angle)});
    //         vertices.push(point.x, point.y, point.z);
    //     }
    //
    //     // push the center of the bottom surface
    //     vertices.push(0, -this.height / 2, 0);
    //
    //     // push the apex
    //     vertices.push(0, this.height / 2, 0);
    //
    //     return vertices;
    // }
    //
    // get indices() {
    //     // let's do the bottom surface first
    //     // remember to make the triangles counterclockwise given the surface normal is pointing down
    //
    //     let indices = [];
    //
    //     const bottomCenter = this.resolution;
    //     for (let i = 0; i < this.resolution; i++) {
    //         indices.push(i, bottomCenter, (i + 1) % this.resolution);
    //     }
    //
    //     // now do the main surface
    //     const apex = this.resolution + 1;
    //     for (let i = 0; i < this.resolution; i++) {
    //         indices.push(apex, i, (i + 1) % this.resolution);
    //     }
    //
    //     return indices;
    // }
}































