import { Shape } from "./shape.js";

export class Box extends Shape {
    constructor(props) {
        super(props);

        const {
            width,
            height,
            depth
        } = props;

        this.width = width ? width : 0.5;
        this.height = height ? height : 0.5;
        this.depth = depth ? depth : 0.5;
    }

    // 8 vertices
    get vertices() {
        return [
            // 4 corners of top face
            this.width/2, this.height/2, this.depth/2, // +x, +y, +z    0   top left of top face
            this.width/2, this.height/2, -this.depth/2, // +x, +y, -z   1   bottom left of top face
            -this.width/2, this.height/2, -this.depth/2, // -x, +y, -z  2   bottom right of top face
            -this.width/2, this.height/2, this.depth/2, // -x, +y, +z   3   top right of top face

            // 4 corners of bottom face
            this.width/2, -this.height/2, this.depth/2, // +x, -y, +z   4   top left of bottom face
            this.width/2, -this.height/2, -this.depth/2 // +x, -y, -z   5   bottom left of bottom face
            -this.width/2, -this.height/2, -this.depth/2, // -x, -y, -z 6   bottom right of bottom face
            -this.width/2, -this.height/2, this.depth/2, // -x, -y, +z  7   top right of bottom face
        ];
    }

    // 6 faces, 2 triangles per face, 3 indices per triangle = 6 * 2 * 3 = 36 indices
    // NOTE: may need to revisit this and ensure the triangles are all counterclockwise with respect to the surface normal
    get indices() {
        return [
            // top face
            // bottom left triangle of top face
            0, 1, 2,
            // top right triangle of top face
            0, 2, 3,

            // bottom face
            // bottom left triangle of bottom face
            4, 5, 6,
            // top right triangle of bottom face
            4, 6, 7,

            // right face
            // bottom left triangle of right face
            0, 4, 5,
            // top right triangle of right face
            0, 5, 1,

            // left face
            // bottom left triangle of left face
            2, 6, 7,
            2, 7, 3,

            // front face
            // bottom left triangle of front face
            3, 7, 4,
            3, 4, 0,

            // back face
            1, 5, 6,
            1, 6, 2
        ];
    }
}



















