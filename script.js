let isPaused = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById("tooltip");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 80, 0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 500);
scene.add(pointLight);

const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const planets = [];
const orbits = [10, 15, 20, 25, 30, 35, 40, 45];

const colors = [
  0xaaaaaa, 0xff9900, 0x3399ff, 0xff3333, 0xffaa00, 0xddddaa, 0x00ccff,
  0x3333ff,
];
const planetNames = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

for (let i = 0; i < 8; i++) {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: colors[i] });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.x = orbits[i];
  scene.add(planet);
  planets.push({
    mesh: planet,
    radius: orbits[i],
    speed: 0.01 + i * 0.002,
    angle: 0,
    name: planetNames[i],
  });
}
for (let i = 0; i < orbits.length; i++) {
  const orbitCurve = new THREE.EllipseCurve(
    0,
    0,
    orbits[i],
    orbits[i],
    0,
    2 * Math.PI,
    false,
    0
  );
  const orbitPoints = orbitCurve.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
    orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
  );
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
  const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  scene.add(orbitLine);
}
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  tooltip.style.left = event.clientX + 10 + "px";
  tooltip.style.top = event.clientY + 10 + "px";
});
window.addEventListener("touchmove", (event) => {
  if (event.touches.length > 0) {
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    tooltip.style.left = touch.clientX + 10 + "px";
    tooltip.style.top = touch.clientY + 10 + "px";
  }
});

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
const starVertices = [];

for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starVertices.push(x, y, z);
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);
const controlPanel = document.getElementById("controls");
planets.forEach((planet, index) => {
  const group = document.createElement("div");
  group.className = "control-group";

  const label = document.createElement("label");
  label.textContent = `${planetNames[index]} Speed:`;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0.001";
  slider.max = "0.05";
  slider.step = "0.001";
  slider.value = planet.speed;
  slider.addEventListener("input", (e) => {
    planet.speed = parseFloat(e.target.value);
  });

  group.appendChild(label);
  group.appendChild(slider);
  controlPanel.appendChild(group);
});

const clock = new THREE.Clock();

let isDarkMode = true;

const themeButton = document.getElementById("themeToggle");

themeButton.addEventListener("click", () => {
  isDarkMode = !isDarkMode;

  document.body.classList.toggle("light-mode", !isDarkMode);
  themeButton.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
  renderer.setClearColor(isDarkMode ? 0x000000 : 0xf0f0f0);

  scene.traverse((obj) => {
    if (obj.isLine) {
      obj.material.color.set(isDarkMode ? 0x444444 : 0x888888);
    }
  });

  sun.material.color.set(isDarkMode ? 0xffff00 : 0xffcc00);

  document.querySelectorAll("#controls label").forEach((label) => {
    label.style.color = isDarkMode ? "white" : "#111";
  });
});
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
document.getElementById("toggleControls").addEventListener("click", () => {
  const controls = document.getElementById("controls");
  controls.style.display = controls.style.display === "none" ? "block" : "none";
});

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    sun.rotation.y += 0.001;

    planets.forEach((planet) => {
      planet.angle += planet.speed;
      planet.mesh.position.x = Math.cos(planet.angle) * planet.radius;
      planet.mesh.position.z = Math.sin(planet.angle) * planet.radius;
      planet.mesh.rotation.y += 0.01;
    });
  }
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map((p) => p.mesh));

  if (intersects.length > 0) {
    const hovered = planets.find((p) => p.mesh === intersects[0].object);
    tooltip.style.display = "block";
    tooltip.textContent = hovered.name;
  } else {
    tooltip.style.display = "none";
  }

  renderer.render(scene, camera);
}

document.getElementById("toggleAnimation").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("toggleAnimation").innerText = isPaused
    ? "Resume"
    : "Pause";
});

animate();
