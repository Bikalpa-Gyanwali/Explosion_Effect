import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';

const vertexShader = `
  attribute vec3 aDirection;
  attribute float aStrength;

  uniform float uProgress;

  varying vec3 vNormal;
  varying float vProgress;

  void main() {
    vec3 displacedPosition = position + aDirection * (uProgress * aStrength * 2.0);

    vNormal = normalize(normalMatrix * normal);
    vProgress = uProgress;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uBaseColor;

  varying vec3 vNormal;
  varying float vProgress;

  void main() {
    vec3 lightDirection = normalize(vec3(0.4, 0.9, 0.6));
    float light = 0.35 + max(dot(normalize(vNormal), lightDirection), 0.0) * 0.65;
    vec3 color = uBaseColor * light;
    float alpha = 1.0 - vProgress * 0.45;

    gl_FragColor = vec4(color, alpha);
  }
`;

let scene;
let camera;
let renderer;
let mesh;
let material;
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const geometry = new THREE.IcosahedronGeometry(1, 2).toNonIndexed();
  addExplosionAttributes(geometry);

  material = new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uBaseColor: { value: new THREE.Color(0xff5533) }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    flatShading: true,
    side: THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', onWindowResize);
  updateScrollProgress();
}

function addExplosionAttributes(geometry) {
  const positions = geometry.attributes.position.array;
  const count = geometry.attributes.position.count;

  const directions = new Float32Array(count * 3);
  const strengths = new Float32Array(count);

  for (let i = 0; i < count; i += 3) {
    const baseIndex = i * 3;

    const cx = (positions[baseIndex] + positions[baseIndex + 3] + positions[baseIndex + 6]) / 3;
    const cy = (positions[baseIndex + 1] + positions[baseIndex + 4] + positions[baseIndex + 7]) / 3;
    const cz = (positions[baseIndex + 2] + positions[baseIndex + 5] + positions[baseIndex + 8]) / 3;

    const direction = new THREE.Vector3(cx, cy, cz).normalize();
    const strength = Math.random() * 1.5 + 0.5;

    for (let j = 0; j < 3; j++) {
      const vertexIndex = i + j;
      const directionIndex = vertexIndex * 3;

      directions[directionIndex] = direction.x;
      directions[directionIndex + 1] = direction.y;
      directions[directionIndex + 2] = direction.z;
      strengths[vertexIndex] = strength;
    }
  }

  geometry.setAttribute('aDirection', new THREE.BufferAttribute(directions, 3));
  geometry.setAttribute('aStrength', new THREE.BufferAttribute(strengths, 1));
}

function animate() {
  requestAnimationFrame(animate);

  progress += (targetProgress - progress) * 0.08;
  material.uniforms.uProgress.value = progress;

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateScrollProgress();
}
