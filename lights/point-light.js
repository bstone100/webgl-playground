import {SceneNode} from "../scene-node.js";
import {Color} from "../math/color.js";

export class PointLight extends SceneNode {
    constructor(props) {
        super(props);

        const {
            lightColor = new Color({r: 1, g: 1, b: 1, a: 1})
        } = props;

        this.lightColor = lightColor;
    }
}