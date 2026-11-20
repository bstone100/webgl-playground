import {SceneNode} from "./scene-node.js";
import {Mat4} from "./math/mat4.js";
import { degreesToRadians } from "./helpers.js";

export class Camera extends SceneNode {
    constructor(props = {}) {
        super(props);
        const {
            fieldOfView = 60,
        } = props;

        this.fieldOfView = fieldOfView;
    }

    // this builds a perspective projection matrix
    // see https://learnwebgl.brown37.net/08_projections/projections_perspective.html
    getPerspective(aspectRatio, near, far) {
        const top = near * Math.tan(degreesToRadians(this.fieldOfView) / 2);
        const bottom = -top;
        const right = top * aspectRatio;
        const left = -right;
        return new Mat4({
            m: [
                [2 * near / (right - left), 0, 0, -near * (right + left) / (right - left)],
                [0, 2 * near / (top - bottom), 0, -near * (top + bottom) / (top - bottom)],
                [0, 0, -(far + near) / (far - near), 2 * far * near / (near - far)],
                [0, 0, -1, 0]
            ]
        });
    }
}