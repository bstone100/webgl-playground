import {SceneNode} from "./scene-node.js";
import {Color} from "./math/color.js";
import {Point3} from "./math/point3.js";

// a SceneObject has geometry
export class SceneObject extends SceneNode {
    constructor(props, gl) {
        super(props);

        const {
            color = new Color({r: 1, g: 0, b: 0, a: 1})
        } = props;

        this.gl = gl; // store reference because it's needed for drawing
        this.color = color;
    }

    getAABB() {
        // go through vertices and find min and max

        let min, max;

        // vertices are packed as a flat array
        const vertices = this.vertices;
        for (let i = 0; i < vertices.length; i += 3) {
            const vertex = new Point3({
                x: vertices[i],
                y: vertices[i + 1],
                z: vertices[i + 2]
            })
        }
    }
}