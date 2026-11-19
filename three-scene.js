(() => {
  const canvas = document.querySelector("#heartCanvas");
  const container = document.querySelector("#heartScene");
  if (!canvas || !container || !window.THREE) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const heartGroup = new THREE.Group();
  heartGroup.rotation.set(-0.08, -0.28, -0.08);
  scene.add(heartGroup);

  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 1.15);
  heartShape.bezierCurveTo(-0.6, 2.15, -2.5, 2.2, -2.65, 0.65);
  heartShape.bezierCurveTo(-2.78, -0.65, -1.55, -1.7, 0, -3.05);
  heartShape.bezierCurveTo(1.55, -1.7, 2.78, -0.65, 2.65, 0.65);
  heartShape.bezierCurveTo(2.5, 2.2, 0.6, 2.15, 0, 1.15);

  const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.85,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 2,
    bevelSize: 0.19,
    bevelThickness: 0.2,
    curveSegments: 36,
  });
  heartGeometry.center();
  heartGeometry.scale(0.82, 0.82, 0.82);

  const heartMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff3d70,
    emissive: 0x3b0618,
    emissiveIntensity: 0.55,
    metalness: 0.16,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });

  const heart = new THREE.Mesh(heartGeometry, heartMaterial);
  heart.castShadow = true;
  heartGroup.add(heart);

  const backHeart = new THREE.Mesh(
    heartGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xff8ca7,
      transparent: true,
      opacity: 0.09,
      side: THREE.BackSide,
    })
  );
  backHeart.scale.setScalar(1.12);
  heartGroup.add(backHeart);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffabc0,
    transparent: true,
    opacity: 0.17,
  });
  const ringOne = new THREE.Mesh(
    new THREE.TorusGeometry(3.6, 0.008, 8, 150),
    ringMaterial
  );
  ringOne.rotation.set(1.22, 0.12, 0.2);
  heartGroup.add(ringOne);

  const ringTwo = new THREE.Mesh(
    new THREE.TorusGeometry(3.05, 0.007, 8, 150),
    ringMaterial.clone()
  );
  ringTwo.rotation.set(0.28, 1.18, -0.35);
  heartGroup.add(ringTwo);

  const particleCount = 90;
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    const radius = 3.2 + Math.random() * 3.2;
    const angle = Math.random() * Math.PI * 2;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 4;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xffbfd0,
      size: 0.035,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
    })
  );
  scene.add(particles);

  scene.add(new THREE.HemisphereLight(0xffd3dd, 0x2a0714, 1.8));

  const keyLight = new THREE.DirectionalLight(0xffe1e7, 5.5);
  keyLight.position.set(-4, 5, 6);
  scene.add(keyLight);

  const edgeLight = new THREE.PointLight(0xff174f, 35, 18);
  edgeLight.position.set(4, -2, 4);
  scene.add(edgeLight);

  const softLight = new THREE.PointLight(0xff8ead, 18, 14);
  softLight.position.set(-4, -3, 2);
  scene.add(softLight);

  const pointer = { x: 0, y: 0 };
  const target = { x: -0.08, y: -0.28 };
  let pulseStarted = -10;

  container.addEventListener("pointermove", (event) => {
    const bounds = container.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointer.y = (event.clientY - bounds.top) / bounds.height - 0.5;
    target.x = -0.08 + pointer.y * 0.42;
    target.y = -0.28 + pointer.x * 0.68;
  });

  container.addEventListener("pointerleave", () => {
    target.x = -0.08;
    target.y = -0.28;
  });

  container.addEventListener("click", () => {
    pulseStarted = clock.getElapsedTime();
  });

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const clock = new THREE.Clock();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function render() {
    const elapsed = clock.getElapsedTime();
    heartGroup.rotation.x += (target.x - heartGroup.rotation.x) * 0.055;
    heartGroup.rotation.y += (target.y - heartGroup.rotation.y) * 0.055;

    if (!reducedMotion.matches) {
      heartGroup.position.y = Math.sin(elapsed * 1.15) * 0.14;
      ringOne.rotation.z = elapsed * 0.16;
      ringTwo.rotation.z = -elapsed * 0.12;
      particles.rotation.y = elapsed * 0.025;
    }

    const pulseAge = elapsed - pulseStarted;
    const pulse = pulseAge < 0.8
      ? 1 + Math.sin(pulseAge * Math.PI * 4) * 0.075 * (1 - pulseAge / 0.8)
      : 1;
    heart.scale.setScalar(pulse);

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  container.classList.add("three-ready");
  render();
})();
