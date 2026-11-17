import {Mat4} from "./math/mat4.js";

export class SceneNode {
    constructor(gl, props) {
        const {
            transform = new Mat4
        } = props;

        this.gl = gl; // store a reference to the gl context since all the sub classes will need it to render
        this.transform = transform;
    }
}