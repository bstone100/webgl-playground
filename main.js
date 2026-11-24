import {drawSceneObject, objectToClassInstance, objectToSceneNode, resizeCanvasToDisplaySize} from "./helpers.js";
import {Vec3} from "./math/vec3.js";
import {Mat4} from "./math/mat4.js";
import {radiansToDegrees} from "./math/utils.js";

const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");

// fetch a list of scenes
const sceneIndex = await fetch("./scene-index.json").then(res => res.json());

// populate <select> with the scenes

const selectSceneElement = document.querySelector("#select-scene");

for (const scene of sceneIndex) {
    selectSceneElement.insertAdjacentHTML("beforeend", `<option value="${scene.file}">${scene.name}</option>`);
}

// when the select value changes, fetch the active scene

let activeScene = null;
let activeSceneInfo = null;

async function setActiveScene() {
    const sceneObject = await fetch(`./scenes/${selectSceneElement.value}`).then(res => res.json());

    // this could be a long operation because it's loading a shader program for each object in the tree
    // for the future: could be done in a web worker, maybe

    // let's build up meta info about our scene while we parse it
    // fill these with references to SceneNodes
    // note that this information can change between renders if the scene graph is modified, so it should be kept in sync
    const sceneInfo = {
        ambientLights: [],
        pointLights: [],
        spotLights: [],
        cameras: []
    };
    const sceneNode = objectToClassInstance(sceneObject, sceneInfo, gl);

    if (sceneNode) {
        activeScene = sceneNode;
        activeSceneInfo = sceneInfo;
    }
}

selectSceneElement.addEventListener("change", setActiveScene);

await setActiveScene();


// let's add event listeners to the canvas and set up camera controls

let isMouseDown = false;
let x = 0;
let y = 0;
canvas.addEventListener("mousedown", event => {
    x = event.offsetX;
    y = event.offsetY;
    isMouseDown = true;
});
canvas.addEventListener("mousemove", event => {
    if (isMouseDown) {
        // do something here

        // okay so the user has pressed the mouse button down and is now moving the cursor in some direction
        // I think for basic rotation, we just need to orbit the camera around the origin in a sphere
        // cursor going right means orbit clockwise about the world y axis
        // cursor going left means orbit counterclockwise about world y axis
        // up and down are orbiting about some vector on the xz plane
        // that vector is perpendicular to the vector between the camera and the y axis

        // I actually think I'm overcomplicating it
        // it would make more sense if we defined the camera's position in terms of azimuth and altitude angles
        // meaning in spherical coordinates
        // and then moving the cursor up means move the camera's position down by n altitude degrees (altitude--)
        // moving the cursor down means move the camera's position up by n altitude degrees (altitude++)

        // let's start with up and down

        // we don't care about total offset from the corner of the element
        // we just care about the delta from the previous mouse event

        const deltaX_px = event.offsetX - x; // so moving cursor right is +delta, left is -delta
        const deltaY_px = event.offsetY - y; // moving cursor down is +delta, up is -delta

        if (deltaX_px === 0 && deltaY_px === 0) {
            x = event.offsetX;
            y = event.offsetY;
            return;
        }

        // how do we decide how many degrees to move?
        // we could measure the delta as a percent of canvas dimensions
        // so moving cursor up by canvas.height / 2 = move camera down 90 degrees
        // moving cursor down by canvas.height / 2 = move camera up 90 degrees
        // note: use css height not canvas height, well actually we're making them equal so its okay

        // need to map delta from px to radians
        // -deltaY means angle delta is negative as well
        // +deltaY means angle delta is positive
        // mapping [-height/2, height/2] to [-pi/2, pi/2]

        const deltaX_angle = deltaX_px * Math.PI / canvas.width;
        const deltaY_angle = deltaY_px * Math.PI / canvas.height;

        // now apply that angle to the camera's translation

        // we need to find the current angle of the camera position projected onto the xy plane

        const camera = activeSceneInfo.cameras[0];
        let currentPos = camera.translationMatrix.getTranslation();

        // let's first convert the current translation into spherical coordinates: r, theta, phi
        const radius = currentPos.length();
        currentPos = currentPos.normalize();
        const theta = Math.atan2(Math.sqrt(1 - Math.pow(currentPos.y, 2)), currentPos.y)
        const phi = Math.atan2(currentPos.x, currentPos.z);

        // now add deltas to theta and phi, then convert back to cartesian
        // I'm subtracting the delta angles now because of the definitions of theta and phi that I'm using
        const newTheta = theta - deltaY_angle;
        const newPhi = phi - deltaX_angle;

        const newPos = new Vec3({
            x: Math.sin(newTheta) * Math.sin(newPhi),
            y: Math.cos(newTheta),
            z: Math.sin(newTheta) * Math.cos(newPhi)
        }).times(radius);

        camera.translationMatrix.setTranslation(newPos);

        // we also need to update the rotation matrix so that the camera is still pointing at the origin

        camera.rotationMatrix = new Mat4({
            lookAt: new Vec3({x: 0, y: 0, z: 0}),
            from: newPos
        });

        // console.log({
        //     prevX: x,
        //     prevY: y,
        //     currX: event.offsetX,
        //     currY: event.offsetY,
        //     deltaX_px,
        //     deltaX_angle_degrees: radiansToDegrees(deltaX_angle),
        //     deltaY_px,
        //     deltaY_angle_degrees: radiansToDegrees(deltaY_angle),
        //     currentPos: currentPos.times(radius),
        //     radius,
        //     currentXyAngle_degrees: radiansToDegrees(theta),
        //     newXyAngle_degrees: radiansToDegrees(newTheta),
        //     currentXzAngle_degrees: radiansToDegrees(phi),
        //     newXzAngle_degrees: radiansToDegrees(newPhi),
        //     newPos
        // });

        x = event.offsetX;
        y = event.offsetY;
    }
});
canvas.addEventListener("mouseup", event => {
    if (isMouseDown) {
        // do something here
        x = 0;
        y = 0;
        isMouseDown = false;
    }

});




activeSceneInfo.startTime = performance.now();

// this function is called every frame
function draw() {
    resizeCanvasToDisplaySize(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1, 1, 1, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    activeSceneInfo.currentTime = performance.now();

    // recursively draw the scene
    if (activeScene) {
        drawSceneObject(activeScene, activeSceneInfo);
    }

    requestAnimationFrame(draw);
}

draw();































