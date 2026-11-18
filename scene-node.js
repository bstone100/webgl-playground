import {Mat4} from "./math/mat4.js";

// a SceneNode has a transform but no geometry
export class SceneNode {
    constructor(props) {
        const {
            transform = new Mat4
        } = props;

        this.transform = transform;
    }
}