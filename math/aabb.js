import {Point3} from "./point3.js";

export class AABB {
    constructor(props) {
        const {
            min,
            max
        } = props;

        this.min = new Point3(min);
        this.max = new Point3(max);
    }

    get right() {
        return this.max.x
    }

    get left() {
        return this.min.x;
    }

    get top() {
        return this.max.y;
    }

    get bottom() {
        return this.min.y;
    }

    get front() {
        return this.max.z;
    }

    get back() {
        return this.min.z;
    }

    get width() {
        return this.right - this.left;
    }

    get height() {
        return this.top - this.bottom;
    }

    get depth() {
        return this.front - this.back;
    }

    // return a t value
    intersectPlane(ray, plane) {
        switch (plane) {
            case "right": return (this.right - ray.origin.x) / ray.direction.x;
            case "left": return (this.left - ray.origin.x) / ray.direction.x;
            case "top": return (this.top - ray.origin.y) / ray.direction.y;
            case "bottom": return (this.bottom - ray.origin.y) / ray.direction.y;
            case "front": return (this.front - ray.origin.z) / ray.direction.z;
            case "back": return (this.back - ray.origin.z) / ray.direction.z;
        }
    }

    testPlaneIntersection(p, face) {
        switch (face) {
            case "right":
            case "left": return p.y > this.bottom && p.y < this.top && p.z > this.back && p.z < this.front;
            case "top":
            case "bottom": return p.x > this.left && p.x < this.right && p.z > this.back && p.z < this.front;
            case "front":
            case "back": return p.x > this.left && p.x < this.right && p.y > this.bottom && p.y < this.top;
        }
    }

    // check all faces, return useful info
    hitTest(ray) {
        let minT = Infinity;
        let hit = false;
        for (const face of ["right", "left", "top", "bottom", "front", "back"]) {
            const t = this.intersectPlane(ray, face);
            if (t < 0) continue;
            const p = ray.at(t);
            const valid = this.testPlaneIntersection(p, face);
            if (valid) {
                hit = true;
                minT = Math.min(minT, t);
            }
        }
        return {
            hit,
            minT
        };
    }
}
























