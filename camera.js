import {SceneNode} from "./scene-node.js";

export class Camera extends SceneNode {
    constructor(props = {}) {
        super(props);
        const {
            fieldOfView = 60,
            focalLength = 2
        } = props;

        this.fieldOfView = fieldOfView;
        this.focalLength = focalLength;
    }
}