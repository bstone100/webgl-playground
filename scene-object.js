import {SceneNode} from "./scene-node.js";
import {Color} from "./math/color.js";

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

}