import { classNameToClass, classToClassName } from "./class-registry.js";

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



export function degreesToRadians(degrees) {
    return degrees / 180 * Math.PI;
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

// mainly just take the type property and make a class instance
// usage: SceneNode scene = jsonToScene(Object jsonRoot)
export function objectToSceneNode(object) {
    if (!object) return null;

    let sceneNode = null;

    const constructor = classNameToClass[object.type];
    if (constructor) {
        const childSceneNodes = [];
        if (object.children) {
            for (const childObject of object.children) {
                const childSceneNode = objectToSceneNode(childObject);
                if (childSceneNode) {
                    childSceneNodes.push(childSceneNode);
                }
            }
        }
        // all our registered classes must be in this form
        sceneNode = new constructor({...object, children: childSceneNodes});
    }

    return sceneNode;
}






































