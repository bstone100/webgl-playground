import {SceneNode} from "../scene-node.js";
import {Color} from "../math/color.js";

export class SpotLight extends SceneNode {
    constructor(props = {}) {
        super(props);

        const {
            color = new Color({r: 1, g: 1, b: 1, a: 1}),
            innerCutoffAngleDegrees = 10,
            outerCutoffAngleDegrees = 12
        } = props;

        this.color = color;
        this.innerCutoffAngleDegrees = innerCutoffAngleDegrees;
        this.outerCutoffAngleDegrees = outerCutoffAngleDegrees;
    }
}