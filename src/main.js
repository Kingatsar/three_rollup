
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// -------------------------------- Global variables -------------------------------- //

let then = 0;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();

// ----- Graphics variables -----
let camera, scene, renderer;
let controller1, controller2;
let group;

// ----- Sound variables -----
let analyser1, analyser2, analyser3, analyser4;
let material1, material2, material3, material4;

// ----- GLTF variables -----
const mixers = [];
let x, y, z;
let gltfPosition = [];
let manager;
let models, gltfLoader;

// ----- HTML variables -----
let container;
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', start);




// -------------------------------- Functions -------------------------------- //

function start() {
  /* 
  
    Loads GLTF models then start the project
  
  */

  manager = new THREE.LoadingManager(
    () => {
      console.log('loaded')
      init();
      animate();
    },
    () => {
      console.log('progress')
    }
  );

  // Loading GLTF models
  models = {
    bird: { url: 'assets/models/flat_bird_icon_origami.glb' },
    dragon: { url: 'assets/models/demon_dragon_full_texture.glb' },
    birdBis: { url: 'assets/models/flat_bird_icon_origami.glb' },
  };

  {
    gltfLoader = new GLTFLoader(manager);
    for (const model of Object.values(models)) {
      gltfLoader.load(model.url, (gltf) => {
        model.gltf = gltf;
      });
    }
  }
}


function init() {

  // HTML elements
  const overlay = document.getElementById('overlay');
  overlay.remove();
  container = document.createElement('div');
  document.body.appendChild(container);

  prepModelsAndAnimations();

  scene = new THREE.Scene();

  // Adding gltf models to the scene by cloning the models
  Object.values(models).forEach((model, ndx) => {
    if (model.gltf) {
      const clonedScene = SkeletonUtils.clone(model.gltf.scene);
      const root = new THREE.Object3D();
      root.add(clonedScene);
      scene.add(root);
      x = Math.random() * 4 - 2;
      y = Math.random() * 4 - 2;
      z = Math.random() * 4 - 2;
      root.position.set(x, y, z);
      gltfPosition.push([x, y, z]);
      root.scale.set(0.2, 0.2, 0.2);
      const mixer = new THREE.AnimationMixer(clonedScene);
      const firstClip = Object.values(model.animations)[0];
      const action = mixer.clipAction(firstClip);
      action.play();
      mixers.push(mixer);
    }
  });

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 3);

  const controls = new OrbitControls(camera, container);
  controls.minDistance = 0;
  controls.maxDistance = 8;

  scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 6, 0);
  scene.add(light);

  group = new THREE.Group();
  scene.add(group);

  // audio
  const audioLoader = new THREE.AudioLoader();
  const listener = new THREE.AudioListener();
  camera.add(listener);
  const listener2 = new THREE.AudioListener();
  camera.add(listener2);

  // objects
  const geometries = [
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.ConeGeometry(0.2, 0.2, 64),
    new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
    new THREE.IcosahedronGeometry(0.2, 8),
    new THREE.TorusGeometry(0.2, 0.04, 64, 32)
  ];

  // ------------------------------- Objects loading -------------------------------
  audioLoader.load('assets/audio/examples_sounds_ping_pong.mp3', function (buffer) {

    for (let i = 0; i < 150; i++) {

      // Object creation
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.7,
        metalness: 0.0
      });
      const object = new THREE.Mesh(geometry, material);

      // Position setup
      object.position.x = Math.random() * 4 - 2;
      object.position.y = Math.random() * 4 - 2;
      object.position.z = Math.random() * 4 - 2;

      // Rotation setup
      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.setScalar(Math.random() + 0.5);

      // Audio setup
      const audio = new THREE.PositionalAudio(listener);
      audio.setBuffer(buffer);
      object.add(audio);
      group.add(object);

    }
  });

  // ------------------------------- Sound emitted for each gltf model -------------------------------
  const sphere = new THREE.SphereGeometry(20, 32, 16);

  material1 = new THREE.MeshPhongMaterial({ color: 0xffc0cb, flatShading: true, transparent: true, opacity: 0.7 });
  material2 = new THREE.MeshPhongMaterial({ color: 0xffc0cb, flatShading: true });
  material3 = new THREE.MeshPhongMaterial({ color: 0xffc0cb, flatShading: true });

  const mesh1 = new THREE.Mesh(sphere, material1);
  let pos = gltfPosition[0];
  mesh1.position.set(pos[0], pos[1], pos[2]);
  scene.add(mesh1);
  const sound1 = new THREE.PositionalAudio(listener2);
  const songElement = document.getElementById('song1');
  sound1.setMediaElementSource(songElement);
  sound1.setRefDistance(0.1);
  songElement.play();
  mesh1.add(sound1);

  const mesh2 = new THREE.Mesh(sphere, material2);
  pos = gltfPosition[1];
  mesh2.position.set(pos[0], pos[1], pos[2]);
  scene.add(mesh2);
  const sound2 = new THREE.PositionalAudio(listener2);
  const songElement2 = document.getElementById('song2');
  sound2.setMediaElementSource(songElement2);
  sound2.setRefDistance(0.1);
  songElement2.play();
  mesh2.add(sound2);

  const mesh3 = new THREE.Mesh(sphere, material3);
  pos = gltfPosition[2];
  console.log(gltfPosition);
  console.log(gltfPosition.length);
  mesh3.position.set(pos[0], pos[1], pos[2]);
  scene.add(mesh3);
  const sound3 = new THREE.PositionalAudio(listener2);
  const songElement3 = document.getElementById('song3');
  sound3.setMediaElementSource(songElement3);
  sound3.setRefDistance(0.1);
  songElement3.play();
  mesh3.add(sound3);



  // analysers
  analyser1 = new THREE.AudioAnalyser(sound1, 32);
  analyser2 = new THREE.AudioAnalyser(sound2, 32);
  analyser3 = new THREE.AudioAnalyser(sound3, 32);


  const SoundControls = function () {

    this.firstSphere = sound1.getVolume();
    this.secondSphere = sound2.getVolume();
    this.thirdSphere = sound3.getVolume();

  };

  const gui = new GUI();
  const soundControls = new SoundControls();
  const volumeFolder = gui.addFolder('sound volume');

  volumeFolder.add(soundControls, 'firstSphere').min(0.0).max(1.0).step(0.01).onChange(function () {
    sound1.setVolume(soundControls.firstSphere);
  });
  volumeFolder.add(soundControls, 'secondSphere').min(0.0).max(1.0).step(0.01).onChange(function () {
    sound2.setVolume(soundControls.secondSphere);
  });
  volumeFolder.add(soundControls, 'thirdSphere').min(0.0).max(1.0).step(0.01).onChange(function () {
    sound3.setVolume(soundControls.thirdSphere);
  });


  volumeFolder.open();

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer));

  // controllers
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  scene.add(controller2);

  raycaster = new THREE.Raycaster();

  window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function onSelectStart(event) {
  /*
  
    When starts to select the geometry, it makes a "pop" sound

  */

  const controller = event.target;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {

    const intersection = intersections[0];
    const object = intersection.object;
    object.material.emissive.b = 1;
    const audio = object.children[0];
    audio.play();
    controller.userData.selected = object;

  }

}

function onSelectEnd(event) {
  /*
 
  When select the geometry ends, the geometry disappears

*/

  const controller = event.target;

  if (controller.userData.selected !== undefined) {

    const object = controller.userData.selected;
    object.material.emissive.b = 0;
    console.log(object);
    object.parent.remove(object);
    controller.userData.selected = undefined;

  }


}

function getIntersections(controller) {

  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix);

  return raycaster.intersectObjects(group.children, false);

}

function intersectObjects(controller) {

  // Do not highlight when already selected

  if (controller.userData.selected !== undefined) return;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {

    const intersection = intersections[0];

    const object = intersection.object;
    object.material.emissive.r = 1;
    intersected.push(object);

  }

}

function cleanIntersected() {

  while (intersected.length) {

    const object = intersected.pop();
    object.material.emissive.r = 0;

  }

}

function animate() {

  renderer.setAnimationLoop(render);

}


function render(now) {

  now *= 0.001;  // convert to seconds
  const deltaTime = now - then;
  then = now;

  cleanIntersected();

  intersectObjects(controller1);
  intersectObjects(controller2);

  for (const mixer of mixers) {
    mixer.update(deltaTime);
  }

  material1.emissive.b = analyser1.getAverageFrequency() / 256;
  material2.emissive.b = analyser2.getAverageFrequency() / 256;
  material3.emissive.b = analyser3.getAverageFrequency() / 256;

  renderer.render(scene, camera);

}


function prepModelsAndAnimations() {
  /*

    Prepares Animation for GLTF Models
  
  */

  Object.values(models).forEach(model => {
    const animsByName = {};
    if (model.gltf) {
      model.gltf.animations.forEach((clip) => {
        animsByName[clip.name] = clip;
      });
      model.animations = animsByName;
    }

  });
}

