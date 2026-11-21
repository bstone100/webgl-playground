import {drawSceneObject, objectToSceneNode, resizeCanvasToDisplaySize} from "./helpers.js";

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
    const sceneNode = objectToSceneNode(sceneObject, sceneInfo, gl);

    if (sceneNode) {
        activeScene = sceneNode;
        activeSceneInfo = sceneInfo;
    }
}

selectSceneElement.addEventListener("change", setActiveScene);

await setActiveScene();

// this function is called every frame
function draw() {
    resizeCanvasToDisplaySize(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // now we need to go through all the geometry objects in our scene and draw them

    // scene is a tree so we need to recursively call draw() on each SceneObject
    // we also need to do some pre processing on the tree to gather the lights and cameras into flat lists
    // and we should compute the world transforms for the lights and cameras

    // we need to call draw() on the objects with a parameter holding a pointLights array, spotLights array, ambientLights array,
    // cameras array
    // we will just use ambientLights[0] and cameras[0] for now in our shaders

    // okay now we have the scene info collected in activeSceneInfo and the root

    // recursively draw the scene
    if (activeScene) {
        // we should precompute the world transform for all the entities in the scene info
        // because each SceneObject will need to pass those transforms to its shader
        // actually that isn't necessary if SceneNode caches its world transform

        drawSceneObject(activeScene, activeSceneInfo);
    }
}

draw();































