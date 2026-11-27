import {SceneNode} from "./scene-node.js";
import {Color} from "./math/color.js";
import {Point3} from "./math/point3.js";
import {AABB} from "./math/aabb.js";

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

    // note: this should be cached and only recomputed if the vertices change
    getAABB() {
        // go through vertices and find min and max

        const min = new Point3({x: Infinity, y: Infinity, z: Infinity});
        const max = new Point3({x: -Infinity, y: -Infinity, z: -Infinity});

        // vertices are packed as a flat array
        const vertices = this.vertices;
        for (let i = 0; i < vertices.length; i += 3) {
            const vertex = new Point3({
                x: vertices[i],
                y: vertices[i + 1],
                z: vertices[i + 2]
            })

            min.x = Math.min(min.x, vertex.x);
            min.y = Math.min(min.y, vertex.y);
            min.z = Math.min(min.z, vertex.z);

            max.x = Math.max(max.x, vertex.x);
            max.y = Math.max(max.y, vertex.y);
            max.z = Math.max(max.z, vertex.z);
        }

        return new AABB({min, max});
    }
}