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
  console.log(
    await BABYLON.WebXRSessionManager.IsSessionSupportedAsync("immersive-vr")
  );
  var scene = new BABYLON.Scene(engine);

  var environment = scene.createDefaultEnvironment({
    createGround: false,
    skyboxSize: 1000
  });
  environment.setMainColor(BABYLON.Color3.FromHexString("#74b9ff"));
  var ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 1000, height: 1000 },
    scene
  );
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    {
      mass: 0,
      friction: 0.8,
      restitution: 0.5,
      disableBidirectionalTransformation: true
    },
    scene
  );
  ground.checkCollisions = true;
  // ground.material = new BABYLON.GridMaterial("mat", scene);
  ground.material = await BABYLON.NodeMaterial.ParseFromSnippetAsync(
    "#I4DJ9Z#4",
    scene
  );

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
  var light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'sphere' shape.
  var sphere = BABYLON.MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene
  );

  // Move the sphere upward 1/2 its height
  sphere.position.y = 1;

  // XR
  const xrHelper = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [environment.ground]
  });
  scene.debugLayer.show();
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
