
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Clock } from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let container;
let camera, scene, renderer;
let controller1, controller2;
const clock = new THREE.Clock();
let then = 0;
let raycaster;
let material1;
let analyser1;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

let group;


init();
animate();

function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

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

  audioLoader.load('assets/audio/examples_sounds_ping_pong.mp3', function (buffer) {

    for (let i = 0; i < 30; i++) {

      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.7,
        metalness: 0.0
      });

      const object = new THREE.Mesh(geometry, material);

      object.position.x = Math.random() * 4 - 2;
      object.position.y = Math.random() * 4 - 2;
      object.position.z = Math.random() * 4 - 2;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.setScalar(Math.random() + 0.5);

      const audio = new THREE.PositionalAudio(listener);
      audio.setBuffer(buffer);
      object.add(audio);
      group.add(object);

    }
  });

  //sound sphere
  const sphere = new THREE.SphereGeometry(20, 32, 16);
  material1 = new THREE.MeshPhongMaterial({ color: 0xffc0cb, flatShading: true, shininess: 0 });
  const mesh1 = new THREE.Mesh(sphere, material1);
  mesh1.position.set(- 250, 30, 0);
  scene.add(mesh1);
  const sound1 = new THREE.PositionalAudio(listener2);
  const songElement = document.getElementById('song');
  sound1.setMediaElementSource(songElement);
  sound1.setRefDistance(20);
  songElement.play();
  mesh1.add(sound1);
  // analyser
  analyser1 = new THREE.AudioAnalyser(sound1, 32);


  const SoundControls = function () {
    this.firstSphere = sound1.getVolume();
  };


  const gui = new GUI();
  const soundControls = new SoundControls();
  const volumeFolder = gui.addFolder('sound volume');


  volumeFolder.add(soundControls, 'firstSphere').min(0.0).max(1.0).step(0.01).onChange(function () {

    sound1.setVolume(soundControls.firstSphere);

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

  const controller = event.target;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {

    const intersection = intersections[0];

    const object = intersection.object;

    object.material.emissive.b = 1;

    console.log("-------------");
    console.log(object);
    const audio = object.children[0];
    audio.play();
    controller.userData.selected = object;

  }

}

function onSelectEnd(event) {

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

//

function animate() {

  renderer.setAnimationLoop(render);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  render();



}


function render() {

  cleanIntersected();

  intersectObjects(controller1);
  intersectObjects(controller2);

  material1.emissive.b = analyser1.getAverageFrequency() / 256;

  renderer.render(scene, camera);

}





