import {SceneNode} from "../scene-node.js";
import {Color} from "../math/color.js";

export class SpotLight extends SceneNode {
    constructor(props) {
        super(props);

        const {
            lightColor = new Color({r: 1, g: 1, b: 1, a: 1}),
            innerCutoffAngleDegrees = 10,
            outerCutoffAngleDegrees = 12
        } = props;

        this.lightColor = lightColor;
        this.innerCutoffAngleDegrees = innerCutoffAngleDegrees;
        this.outerCutoffAngleDegrees = outerCutoffAngleDegrees;
    }
}