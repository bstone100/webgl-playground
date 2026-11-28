import {classNameToClass, classToClassName} from "./class-registry.js";
import {AmbientLight} from "./lights/ambient-light.js";
import {PointLight} from "./lights/point-light.js";
import {SpotLight} from "./lights/spot-light.js";
import {Camera} from "./camera.js";
import {SceneObject} from "./scene-object.js";
import {SceneNode} from "./scene-node.js";
import {Point3} from "./math/point3.js";
import {Ray} from "./math/ray.js";

export function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio;
    const displayWidth = canvas.clientWidth * dpr;
    const displayHeight = canvas.clientHeight * dpr;

    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;

    if (needResize) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}

export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

export function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// mainly just add a type property for the class
// usage: Object json = sceneToJson(SceneNode sceneRoot)
export function sceneNodeToObject(sceneNode) {
    if (!sceneNode) return null;

    let object = null;

    // get the type from the registry rather than doing constructor.name because minification could change the class names
    const type = classToClassName.get(sceneNode.constructor);
    if (type) {
        const childObjects = [];
        if (sceneNode.children) {
            for (const childSceneNode of sceneNode.children) {
                const childObject = sceneNodeToObject(childSceneNode);
                if (childObject) {
                    childObjects.push(childObject);
                }
            }
        }
        object = {...sceneNode, children: childObjects};
    }

    return object;
}

export function objectToClassInstance(object, sceneInfo, gl) {
    // if this object has a type property and that type is a registered class then return a class instance
    // otherwise return the object

    // object will be a json type, so object, array, string, number, boolean
    // if its an object we need to recursively call this function on its properties
    // if its an array we need to recursively call this function on its children

    // this handles the children array of SceneNodes, it turns each entry into a SceneNode
    if (object instanceof Array) {
        // note: this is a waste of time for long arrays of numbers like matrices
        for (let i = 0; i < object.length; i++) {
            object[i] = objectToClassInstance(object[i], sceneInfo, gl);
        }
    } else if (object instanceof Object) {
        for (const prop in object) {
            object[prop] = objectToClassInstance(object[prop], sceneInfo, gl);
        }
    }

    // okay now all of object's array entries or object properties have been converted to classes or kept the same

    const constructor = classNameToClass[object.type];
    if (constructor) {
        // now finally if this object is supposed to be a class then call the constructor with object as the props object

        // need to pass gl reference to constructor if it's a SceneObject

        const classInstance = new constructor(object, gl);

        // now do special handling
        if (classInstance instanceof SceneNode) {
            for (const child of classInstance.children) {
                child.parent = classInstance;
            }
        }

        switch (constructor) {
            case AmbientLight: sceneInfo.ambientLights.push(classInstance); break;
            case PointLight: sceneInfo.pointLights.push(classInstance); break;
            case SpotLight: sceneInfo.spotLights.push(classInstance); break;
            case Camera: sceneInfo.cameras.push(classInstance); break;
        }

        return classInstance;
    } else {
        return object;
    }
}

// we draw SceneObjects not SceneNodes
// but SceneNodes can have child SceneObjects
export function drawSceneObject(sceneObject, sceneInfo) {
    if (!sceneObject) return;

    if (sceneObject instanceof SceneObject) {
        sceneObject.draw(sceneInfo);
    }

    if (sceneObject instanceof SceneNode) {
        for (const childNode of sceneObject.children) {
            drawSceneObject(childNode, sceneInfo);
        }
    }
}

export function canvasPosToWorld({x, y, canvas, camera, sceneInfo}) {
    const aspectRatio = canvas.width / canvas.height;
    const viewport = camera.getViewport(aspectRatio);

    // convert position from canvas space to camera space
    // this is a point somewhere on the viewport, which is the near face of the viewing frustum
    const pos_cameraSpace = new Point3({
        x: x / canvas.clientWidth * (viewport.right - viewport.left) + viewport.left,
        y: (1 - y / canvas.clientHeight) * (viewport.top - viewport.bottom) + viewport.bottom,
        z: -camera.near
    });

    // now convert to world space
    return camera.getWorldTransform(sceneInfo).times(pos_cameraSpace);
}

export function hitTest(sceneObject, ray, hitResult, sceneInfo) {
    // go through the scene recursively and see how far each object is from the ray origin
    // we should only check SceneObjects because they have geometry

    // the primitive shapes can all use equations to determine an exact hit
    // but I think what we should do here is to use the bounding box of each object
    // it depends on the purpose of the hit test

    if (!sceneObject) return;

    // note: we could do a hit test against a bounding AABB so that we don't have to recurse if the hit fails
    if (sceneObject instanceof SceneObject) {
        // do hit test

        // get object bounding box
        // we need an AABB, which is constructed from just the min and max vertex of the object
        // so an AABB is in object space

        // now to compute the intersection, we should convert the ray into object space
        // since we just need t, we don't need to convert back

        const aabb = sceneObject.getAABB();

        // convert ray to object space
        // that's object.transform.inverse * ray.origin, and direction

        const worldToObject = sceneObject.getWorldTransform(sceneInfo).toInverse();

        const rayLocal = new Ray({
            origin: worldToObject.times(ray.origin),
            direction: worldToObject.times(ray.direction)
        });

        const {
            hit,
            minT
        } = aabb.hitTest(rayLocal);

        if (hit && minT < hitResult.minT) {
            hitResult.minT = minT;
            hitResult.closestObject = sceneObject;
        }
    }

    if (sceneObject instanceof SceneNode) {
        for (const childNode of sceneObject.children) {
            hitTest(childNode, ray, hitResult, sceneInfo);
        }
    }
}




























