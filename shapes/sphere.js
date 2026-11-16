import {Shape} from "./shape.js";

export class Sphere extends Shape {
    constructor(props) {
        super(props);

        const {
            radius,
            resolution
        } = props;

        this.radius = radius ? radius : 0.25;
        this.resolution = resolution ? Math.max(resolution, 4): 25;
    }

    // I'm going to go 360 degrees around the xz axis and 360 degrees around the xy axis
    get vertices() {
        let vertices = [];

        const deltaAngle = 2 * Math.PI / this.resolution;
        for (let i = 0; i < this.resolution; i++) {
            const xzAngle = i * deltaAngle;
            for (let j = 0; j < this.resolution; j++) {
                const xyAngle = j * deltaAngle;

                // compute xyz from angles, normalize, then multiply by radius

            }
        }
    }

    get indices() {

    }
}























