import {SceneObject} from "./scene-object.js";
import {SceneNode} from "./scene-node.js";
import {Camera} from "./camera.js";
import {Torus} from "./shapes/torus.js";
import {Sphere} from "./shapes/sphere.js";
import {Rectangle} from "./shapes/rectangle.js";
import {Cylinder} from "./shapes/cylinder.js";
import {Cone} from "./shapes/cone.js";
import {Circle} from "./shapes/circle.js";
import {Box} from "./shapes/box.js";
import {Vec4} from "./math/vec4.js";
import {Vec3} from "./math/vec3.js";
import {Point3} from "./math/point3.js";
import {Point2} from "./math/point2.js";
import {Mat4} from "./math/mat4.js";
import {Color} from "./math/color.js";
import {SpotLight} from "./lights/spot-light.js";
import {PointLight} from "./lights/point-light.js";
import {AmbientLight} from "./lights/ambient-light.js";
import {Vec2} from "./math/vec2.js";

export const classNameToClass = {
    "AmbientLight": AmbientLight,
    "PointLight": PointLight,
    "SpotLight": SpotLight,
    "Color": Color,
    "Mat4": Mat4,
    "Point2": Point2,
    "Point3": Point3,
    "Vec2": Vec2,
    "Vec3": Vec3,
    "Vec4": Vec4,
    "Box": Box,
    "Circle": Circle,
    "Cone": Cone,
    "Cylinder": Cylinder,
    "Rectangle": Rectangle,
    "Sphere": Sphere,
    "Torus": Torus,
    "Camera": Camera,
    "SceneNode": SceneNode,
    "SceneObject": SceneObject
};

export const classToClassName = new Map();

for (const className in classNameToClass) {
    classToClassName.set(classNameToClass[className], className);
}




























