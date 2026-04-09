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
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  let geometry = new THREE.IcosahedronGeometry(1, 2);
  geometry = geometry.toNonIndexed();

  // ✅ 4. Transparent material for depth fade
  const material = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    flatShading: true,
    transparent: true,
    opacity: 1
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // ✅ 5. Directional + ambient light
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 5);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const positions = geometry.attributes.position.array;
  originalPositions = positions.slice();

  directions = [];

  // ✅ 1 + 2. Radial direction from face centroid + per-face strength
  for (let i = 0; i < positions.length; i += 9) {
    const cx = (positions[i]   + positions[i+3] + positions[i+6]) / 3;
    const cy = (positions[i+1] + positions[i+4] + positions[i+7]) / 3;
    const cz = (positions[i+2] + positions[i+5] + positions[i+8]) / 3;

    const dir = new THREE.Vector3(cx, cy, cz).normalize();
    const strength = Math.random() * 1.5 + 0.5;

    // Same dir + strength for all 3 vertices of the face
    directions.push({ dir, strength });
    directions.push({ dir, strength });
    directions.push({ dir, strength });
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', onWindowResize);
  updateScrollProgress();
}

function animate() {
  requestAnimationFrame(animate);

  const positions = mesh.geometry.attributes.position.array;

  progress += (targetProgress - progress) * 0.08;

  for (let i = 0, vi = 0; i < positions.length; i += 3, vi++) {
    const { dir, strength } = directions[vi];

    const explode = progress * strength * 2;

    // ✅ 3. Wobble offset for rotation illusion
    const wobbleX = Math.sin(progress * 5 + i * 0.3) * 0.015 * progress;
    const wobbleY = Math.cos(progress * 5 + i * 0.3) * 0.015 * progress;

    positions[i]     = originalPositions[i]     + dir.x * explode + wobbleX;
    positions[i + 1] = originalPositions[i + 1] + dir.y * explode + wobbleY;
    positions[i + 2] = originalPositions[i + 2] + dir.z * explode;
  }

  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.rotation.y += 0.005;

  // ✅ 4. Fade out as it explodes
  mesh.material.opacity = 1 - progress * 0.65;

  renderer.render(scene, camera);
}

function updateScrollProgress() {
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollRange <= 0) { targetProgress = 0; return; }
  targetProgress = THREE.MathUtils.clamp(window.scrollY / scrollRange, 0, 1);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateScrollProgress();
}