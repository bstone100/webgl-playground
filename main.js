import {createProgram, createShader, resizeCanvasToDisplaySize} from "./helpers.js";

// fetch a list of scenes
const sceneIndex = await fetch("./scene-index.json").then(res => res.json());

// populate <select> with the scenes

const selectSceneElement = document.querySelector("#select-scene");

for (const scene of sceneIndex) {
    selectSceneElement.insertAdjacentHTML("beforeend", `<option value="${scene.file}">${scene.name}</option>`);
}

// when the select value changes, fetch the active scene

let activeScene = null;

async function setActiveScene() {
    // activeScene = await fetch(`./scenes/${selectSceneElement.value}`).then(res => res.json());

    const sceneJSON = await fetch(`./scenes/${selectSceneElement.value}`).then(res => res.text());


}

selectSceneElement.addEventListener("change", setActiveScene);

await setActiveScene();

const canvas = document.querySelector("canvas");

const gl = canvas.getContext("webgl2");

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


}

draw();


























