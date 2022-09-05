import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

import { xrPolyfillPromise } from "./xrPolyfillPromise";

var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
  engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
      sceneToRender.render();
    }
  });
};

var engine = null;
var scene = null;
var sceneToRender = null;

var createDefaultEngine = function () {
  return new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false
  });
};

var createScene = async function () {
  await xrPolyfillPromise;
  console.log(navigator.xr); // should be there!
  console.log(
    await BABYLON.WebXRSessionManager.IsSessionSupportedAsync("immersive-vr")
  ); // should be true
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera(
    "camera1",
    new BABYLON.Vector3(0, 5, -10),
    scene
  );

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.PointLight(
    "pointLight",
    new BABYLON.Vector3(10, 10, 0),
    scene
  );

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
  sphere.position.y = 1;

  var plane = BABYLON.Mesh.CreatePlane("plane", 2);
  plane.parent = sphere;
  plane.position.y = 2;

  var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane);
  scene.clearColor = new BABYLON.Color3(0.5, 0.8, 0.5);
  var button1 = GUI.Button.CreateSimpleButton("but1", "Click Me");
  button1.width = 1;
  button1.height = 0.4;
  button1.color = "white";
  button1.fontSize = 50;
  button1.background = "green";
  button1.onPointerUpObservable.add(function () {
    alert(scene.ambientColor);
  });
  advancedTexture.addControl(button1);

  // Our built-in 'ground' shape.
  // var ground = BABYLON.MeshBuilder.CreateGround(
  //   "ground",
  //   { width: 6, height: 6 },
  //   scene
  // );

  const env = scene.createDefaultEnvironment();

  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [env.ground]
  });

  return scene;
};

const initFunction = async function () {
  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine();
    } catch (e) {
      console.log(
        "the available createEngine function failed. Creating the default engine instead"
      );
      return createDefaultEngine();
    }
  };

  engine = await asyncEngineCreation();
  if (!engine) throw Error("engine should not be null.");
  startRenderLoop(engine, canvas);
  scene = await createScene();
};

initFunction().then(() => {
  sceneToRender = scene;
});

// Resize
window.addEventListener("resize", function () {
  engine.resize();
});
