import { Mat4 } from "../math/mat4.js";

export class Shape {
    constructor(props) {

        const {
            transform = new Mat4
        } = props;

        this.transform = transform;
    }
}