import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';

let scene, camera, renderer, mesh;
let originalPositions, directions;
let progress = 0;
let targetProgress = 0;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Use a low-poly sphere so each triangle can separate cleanly.
  let geometry = new THREE.IcosahedronGeometry(1, 2);

  // Make triangles independent so they can move apart.
  geometry = geometry.toNonIndexed();

  const material = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    flatShading: true
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 5);
  scene.add(light);

  const positions = geometry.attributes.position.array;
  originalPositions = positions.slice();

  directions = [];
  for (let i = 0; i < positions.length; i += 3) {
    const dir = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();

    directions.push(dir);
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', onWindowResize);
  updateScrollProgress();
}

function animate() {
  requestAnimationFrame(animate);

  const positions = mesh.geometry.attributes.position.array;

  // Ease toward the scroll-controlled target value.
  progress += (targetProgress - progress) * 0.08;

  for (let i = 0; i < positions.length; i += 3) {
    const dir = directions[i / 3];

    positions[i] = originalPositions[i] + dir.x * progress * 2;
    positions[i + 1] = originalPositions[i + 1] + dir.y * progress * 2;
    positions[i + 2] = originalPositions[i + 2] + dir.z * progress * 2;
  }

  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.rotation.y += 0.005;

  renderer.render(scene, camera);
}

function updateScrollProgress() {
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollRange <= 0) {
    targetProgress = 0;
    return;
  }

  targetProgress = THREE.MathUtils.clamp(window.scrollY / scrollRange, 0, 1);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateScrollProgress();
}
