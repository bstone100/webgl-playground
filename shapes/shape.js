import { Mat4 } from "../math/mat4.js";

export class Shape {
    constructor(props) {

        const {
            transform
        } = props;

        this.transform = transform ? transform : new Mat4;
    }
}