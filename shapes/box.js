import {SceneObject} from "../scene-object.js";

export class Box extends SceneObject {
    constructor(props = {}, gl) {
        super(props, gl);

        const {
            width = 0.5,
            height = 0.5,
            depth = 0.5
        } = props;

        this.width = width;
        this.height = height;
        this.depth = depth;

        this.setUp();
    }

    get vertices() {
        return [
            // 4 corners of top face
            this.width/2, this.height/2, this.depth/2, // +x, +y, +z    0   top left of top face
            this.width/2, this.height/2, -this.depth/2, // +x, +y, -z   1   bottom left of top face
            -this.width/2, this.height/2, -this.depth/2, // -x, +y, -z  2   bottom right of top face
            -this.width/2, this.height/2, this.depth/2, // -x, +y, +z   3   top right of top face

            // 4 corners of bottom face
            this.width/2, -this.height/2, this.depth/2, // +x, -y, +z   4   top left of bottom face
            this.width/2, -this.height/2, -this.depth/2, // +x, -y, -z   5   bottom left of bottom face
            -this.width/2, -this.height/2, -this.depth/2, // -x, -y, -z 6   bottom right of bottom face
            -this.width/2, -this.height/2, this.depth/2, // -x, -y, +z  7   top right of bottom face

            // 4 corners of right face
            this.width/2, this.height/2, this.depth/2, // +x +y +z    top left of right face 8
            this.width/2, -this.height/2, this.depth/2, // +x, -y, +z  bottom left of right face 9
            this.width/2, -this.height/2, -this.depth/2, // +x, -y, -z  bottom right 10
            this.width/2, this.height/2, -this.depth/2, // +x, +y, -z top right  11

            // left face
            // top left
            // -x +y -z
            // bottom left
            // -x -y -z
            // bottom right
            // -x -y +z
            // top right
            // -x +y +z
            -this.width/2, this.height/2, -this.depth/2, //  12
            -this.width/2, -this.height/2, -this.depth/2, // 13
            -this.width/2, -this.height/2, this.depth/2, //  14
            -this.width/2, this.height/2, this.depth/2, //   15

            // front face
            // top left
            // -x +y +z
            // bottom left
            // -x -y +z
            // bottom right
            // +x -y +z
            // top right
            // +x +y +z
            -this.width/2, this.height/2, this.depth/2, //   16
            -this.width/2, -this.height/2, this.depth/2, //  17
            this.width/2, -this.height/2, this.depth/2, //   18
            this.width/2, this.height/2, this.depth/2, //    19

            // back face
            // top left
            // +x +y -z
            // bottom left
            // +x -y -z
            // bottom right
            // -x -y -z
            // top right
            // -x +y -z
            this.width/2, this.height/2, -this.depth/2, //   20
            this.width/2, -this.height/2, -this.depth/2, //  21
            -this.width/2, -this.height/2, -this.depth/2, // 22
            -this.width/2, this.height/2, -this.depth/2 //   23
        ];
    }

    #normals = [
        // top face
        // all pointing up
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // bottom face
        // pointing down
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // right face
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // left face
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // front face
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // back face
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1
    ];

    get normals() {
        return this.#normals;
    }

    // okay let's redo the indices
    // there are 6 faces, 24 vertices, 2 triangles per face, 12 triangles, 3 vertices per triangle, 36 indices
    #indices = [
        // top face
        // bottom left triangle
        0, 1, 2,
        // top left triangle
        0, 2, 3,

        // bottom face
        // make sure to go counterclockwise relative to the normal
        4, 6, 5,
        4, 7, 6,

        // right face 8, 9, 10, 11
        8, 9, 10,
        8, 10, 11,

        // left face 12, 13, 14, 15
        12, 13, 14,
        12, 14, 15,

        // front face 16 17 18 19
        16, 17, 18,
        16, 18, 19,

        // back face 20, 21, 22, 23
        20, 21, 22,
        20, 22, 23
    ];

    get indices() {
        return this.#indices;
    }

    get indicesCount() {
        return 36;
    }

}



















