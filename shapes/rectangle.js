import {SceneNode} from "../scene-node.js";

// a rectangle just needs a width and height

export class Rectangle extends SceneNode {
    constructor(props = {}) {
        super(props);

        const {
            width = 0.5,
            height = 0.5
        } = props;

        this.width = width;
        this.height = height;
    }

    // 4 vertices for each corner
    // we'll draw this rectangle on the xy plane around the origin
    get vertices() {
        return [
            -this.width/2, this.height/2, 0, // top left
            -this.width/2, -this.height/2, 0, // bottom left
            this.width/2, -this.height/2, 0, // bottom right
            this.width/2, this.height/2, 0 // top right
        ];
    }

    // 6 indices, make 2 triangles from the 4 vertices
    get indices() {
        return [
            0, // top left
            1, // bottom left
            2, // bottom right
            0, // top left
            2, // bottom right
            3 // top right
        ];
    }
}



















