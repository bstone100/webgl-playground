import {SceneNode} from "./scene-node.js";
import {Mat4} from "./math/mat4.js";
import { degreesToRadians } from "./math/utils.js";

export class Camera extends SceneNode {
    constructor(props = {}) {
        super(props);
        const {
            fieldOfView = 60,
            near = 0.1,
            far = 1000
        } = props;

        this.fieldOfView = fieldOfView;
        this.near = near;
        this.far = far;
    }

    // this builds a perspective projection matrix
    // see https://learnwebgl.brown37.net/08_projections/projections_perspective.html
    getPerspective(aspectRatio) {
        const {top, bottom, left, right} = this.getViewport(aspectRatio, this.near, this.far);
        return new Mat4({
            m: [
                [2 * this.near / (right - left), 0, 0, -this.near * (right + left) / (right - left)],
                [0, 2 * this.near / (top - bottom), 0, -this.near * (top + bottom) / (top - bottom)],
                [0, 0, -(this.far + this.near) / (this.far - this.near), 2 * this.far * this.near / (this.near - this.far)],
                [0, 0, -1, 0]
            ]
        });
    }

    getViewport(aspectRatio) {
        const top = this.near * Math.tan(degreesToRadians(this.fieldOfView) / 2);
        const bottom = -top;
        const right = top * aspectRatio;
        const left = -right;
        return {top, bottom, right, left};
    }
}