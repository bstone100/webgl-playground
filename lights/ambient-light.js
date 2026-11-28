import {SceneNode} from "../scene-node.js";
import {Color} from "../math/color.js";

export class AmbientLight extends SceneNode {
    constructor(props = {}) {
        super(props);

        const {
            color = new Color({r: 0.3, g: 0.3, b: 0.3, a: 1})
        } = props;

        this.color = color;
    }
}