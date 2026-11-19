(() => {
  const canvas = document.querySelector("#heartCanvas");
  const container = document.querySelector("#heartScene");
  if (!canvas || !container || !window.THREE) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 9.6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const world = new THREE.Group();
  scene.add(world);

  const spinGroup = new THREE.Group();
  world.add(spinGroup);

  const heartGroup = new THREE.Group();
  heartGroup.rotation.set(-0.08, -0.24, -0.08);
  spinGroup.add(heartGroup);

  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 1.15);
  heartShape.bezierCurveTo(-0.6, 2.15, -2.5, 2.2, -2.65, 0.65);
  heartShape.bezierCurveTo(-2.78, -0.65, -1.55, -1.7, 0, -3.05);
  heartShape.bezierCurveTo(1.55, -1.7, 2.78, -0.65, 2.65, 0.65);
  heartShape.bezierCurveTo(2.5, 2.2, 0.6, 2.15, 0, 1.15);

  const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.9,
    bevelEnabled: true,
    bevelSegments: 10,
    steps: 2,
    bevelSize: 0.22,
    bevelThickness: 0.22,
    curveSegments: 48,
  });
  heartGeometry.center();
  heartGeometry.scale(0.75, 0.75, 0.75);

  const heartMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff3d70,
    emissive: 0x510c25,
    emissiveIntensity: 0.72,
    metalness: 0.12,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });

  const heart = new THREE.Mesh(heartGeometry, heartMaterial);
  heartGroup.add(heart);

  const glassHeart = new THREE.Mesh(
    heartGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0xff9bb2,
      emissive: 0x4d071d,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.16,
      roughness: 0.05,
      metalness: 0.05,
      clearcoat: 1,
      side: THREE.DoubleSide,
    })
  );
  glassHeart.scale.setScalar(1.16);
  heartGroup.add(glassHeart);

  const wireHeart = new THREE.Mesh(
    heartGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffb6c8,
      transparent: true,
      opacity: 0.075,
      wireframe: true,
    })
  );
  wireHeart.scale.setScalar(1.31);
  heartGroup.add(wireHeart);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xf2ad78,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ringOne = new THREE.Mesh(
    new THREE.TorusGeometry(3.05, 0.018, 8, 180),
    ringMaterial
  );
  ringOne.rotation.set(1.2, 0.1, 0.2);
  heartGroup.add(ringOne);

  const ringTwo = new THREE.Mesh(
    new THREE.TorusGeometry(2.72, 0.014, 8, 180),
    ringMaterial.clone()
  );
  ringTwo.material.color.set(0xff6f91);
  ringTwo.material.opacity = 0.3;
  ringTwo.rotation.set(0.25, 1.16, -0.35);
  heartGroup.add(ringTwo);

  const burstRings = [0, 1, 2].map((index) => {
    const material = new THREE.MeshBasicMaterial({
      color: index === 1 ? 0xffd09a : 0xff6f91,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.45 + index * 0.12, 0.022 - index * 0.004, 8, 180),
      material
    );
    ring.userData.delay = index * 0.16;
    heartGroup.add(ring);
    return ring;
  });

  function makeGlowTexture() {
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const context = glowCanvas.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.18, "rgba(255,235,242,.95)");
    gradient.addColorStop(0.48, "rgba(255,135,170,.42)");
    gradient.addColorStop(1, "rgba(255,80,130,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(glowCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const glowTexture = makeGlowTexture();

  function createHeartParticles(count) {
    const positions = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const directions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alpha = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const drift = new Float32Array(count);
    const burstDelay = new Float32Array(count);
    const rose = new THREE.Color(0xff7898);
    const gold = new THREE.Color(0xf4b978);
    const blush = new THREE.Color(0xffb6aa);
    const white = new THREE.Color(0xfff4f2);

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const fill = 1.08 + (Math.random() - 0.5) * 0.18;
      const formulaX = 16 * Math.pow(Math.sin(angle), 3);
      const formulaY =
        13 * Math.cos(angle) -
        5 * Math.cos(2 * angle) -
        2 * Math.cos(3 * angle) -
        Math.cos(4 * angle);
      const offset = index * 3;
      const x = (formulaX / 16) * 2.72 * fill;
      const y = (formulaY / 17) * 2.78 * fill + 0.12;
      const z = (Math.random() - 0.5) * 0.95;

      positions[offset] = base[offset] = x;
      positions[offset + 1] = base[offset + 1] = y;
      positions[offset + 2] = base[offset + 2] = z;

      const length = Math.hypot(x, y, z) || 1;
      directions[offset] = x / length + (Math.random() - 0.5) * 0.2;
      directions[offset + 1] = y / length + (Math.random() - 0.5) * 0.2;
      directions[offset + 2] = z / length + (Math.random() - 0.5) * 0.7;
      phases[index] = Math.random() * Math.PI * 2;
      speeds[index] = 0.35 + Math.random() * 0.72;
      drift[index] = 0.012 + Math.random() * 0.036;
      burstDelay[index] = Math.random() * 0.22;

      const colorChoice = Math.random();
      const color = colorChoice < 0.045
        ? white
        : colorChoice < 0.5
          ? rose.clone().lerp(gold, Math.random() * 0.48)
          : gold.clone().lerp(blush, Math.random() * 0.68);
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
      sizes[index] = colorChoice < 0.045 ? 9 + Math.random() * 4 : 5 + Math.random() * 4;
      alpha[index] = colorChoice < 0.045 ? 0.96 : 0.55 + Math.random() * 0.4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uGlow: { value: glowTexture },
        uOpacity: { value: 0.9 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uBurst: { value: 0 },
      },
      vertexShader: `
        uniform float uPixelRatio;
        uniform float uBurst;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (7.0 / max(2.0, -viewPosition.z)) * (1.0 + uBurst * 0.45);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uGlow;
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float glow = texture2D(uGlow, gl_PointCoord).a;
          float finalAlpha = glow * vAlpha * uOpacity;
          if (finalAlpha < 0.008) discard;
          gl_FragColor = vec4(vColor * (0.92 + glow * 0.42), finalAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    points.renderOrder = 6;
    points.scale.setScalar(1.22);
    heartGroup.add(points);

    return {
      points,
      positions,
      base,
      directions,
      phases,
      speeds,
      drift,
      burstDelay,
      geometry,
      material,
    };
  }

  const heartCloud = createHeartParticles(480);

  const dustCount = 140;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustBase = new Float32Array(dustCount * 3);
  const dustPhase = new Float32Array(dustCount);
  const dustSpeed = new Float32Array(dustCount);
  for (let index = 0; index < dustCount; index += 1) {
    const radius = 3.2 + Math.random() * 3.5;
    const angle = Math.random() * Math.PI * 2;
    const offset = index * 3;
    dustPositions[offset] = dustBase[offset] = Math.cos(angle) * radius;
    dustPositions[offset + 1] = dustBase[offset + 1] = (Math.random() - 0.5) * 7;
    dustPositions[offset + 2] = dustBase[offset + 2] = (Math.random() - 0.5) * 4;
    dustPhase[index] = Math.random() * Math.PI * 2;
    dustSpeed[index] = 0.2 + Math.random() * 0.55;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xf3aa7c,
      map: glowTexture,
      size: 0.105,
      transparent: true,
      opacity: 0.42,
      alphaTest: 0.003,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    })
  );
  dust.renderOrder = 3;
  scene.add(dust);

  function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  const cardPalettes = [
    ["#8d2f51", "#e9919e"],
    ["#351221", "#a34667"],
    ["#a04a66", "#351020"],
    ["#d68183", "#6a2141"],
    ["#4b172d", "#a8657b"],
    ["#9e385c", "#efaba8"],
    ["#ce7d86", "#6d2947"],
    ["#6c2442", "#d66f8a"],
    ["#3a1023", "#9d3156"],
  ];

  function makeCardTexture(index) {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 320;
    textureCanvas.height = 420;
    const context = textureCanvas.getContext("2d");
    const [start, end] = cardPalettes[index];
    const gradient = context.createLinearGradient(0, 0, 320, 420);
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);

    roundedRect(context, 7, 7, 306, 406, 30);
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = "rgba(255,235,241,.55)";
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = "rgba(255,255,255,.1)";
    context.beginPath();
    context.arc(245, 92, 92, 0, Math.PI * 2);
    context.fill();

    context.textAlign = "center";
    context.fillStyle = "rgba(255,241,245,.92)";
    context.font = "italic 82px Georgia";
    context.fillText(String(index + 1).padStart(2, "0"), 160, 218);
    context.font = "600 20px Arial";
    context.letterSpacing = "5px";
    context.fillText("MEMORY", 160, 270);
    context.font = "italic 18px Georgia";
    context.fillStyle = "rgba(255,241,245,.7)";
    context.fillText("your photo here", 160, 315);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const memoryCards = [];
  const cardGeometry = new THREE.PlaneGeometry(0.92, 1.22);
  for (let index = 0; index < 9; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      map: makeCardTexture(index),
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const card = new THREE.Mesh(cardGeometry, material);
    card.userData.angle = (index / 9) * Math.PI * 2;
    card.userData.lane = (index % 3) - 1;
    scene.add(card);
    memoryCards.push(card);
  }

  const ambientLight = new THREE.HemisphereLight(0xffdce5, 0x1d0610, 1.55);
  scene.add(ambientLight);

  const keyLight = new THREE.PointLight(0xffedf2, 50, 20, 1.45);
  keyLight.position.set(-3.8, 4.2, 5.5);
  scene.add(keyLight);

  const edgeLight = new THREE.PointLight(0xff245c, 36, 18, 1.6);
  edgeLight.position.set(4.2, -1.8, 3.2);
  scene.add(edgeLight);

  const softLight = new THREE.PointLight(0xff9fba, 34, 18, 1.5);
  softLight.position.set(-4.2, -3.2, 2.6);
  scene.add(softLight);

  const rimLight = new THREE.PointLight(0xb95cff, 26, 17, 1.55);
  rimLight.position.set(1.5, 3.4, -3.8);
  scene.add(rimLight);

  const topLight = new THREE.PointLight(0xffffff, 14, 15, 1.65);
  topLight.position.set(0, 5.2, 2.2);
  scene.add(topLight);

  const pointer = { x: 0, y: 0 };
  const pointerNdc = new THREE.Vector2(2, 2);
  const raycaster = new THREE.Raycaster();
  const target = { x: -0.08, y: -0.24 };
  const clock = new THREE.Clock();
  let burstStarted = -10;
  let scrollTurn = 0;
  let pointerInside = false;
  let heartHovered = false;
  let hoverMix = 0;
  let beatPhase = 0;
  let lastElapsed = 0;

  container.addEventListener("pointermove", (event) => {
    const bounds = container.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointer.y = (event.clientY - bounds.top) / bounds.height - 0.5;
    pointerNdc.set(pointer.x * 2, pointer.y * -2);
    pointerInside = true;
    container.style.setProperty("--glow-x", `${pointer.x * 34}px`);
    container.style.setProperty("--glow-y", `${pointer.y * 24}px`);
    container.style.setProperty("--shadow-x", `${pointer.x * -42}px`);
    container.style.setProperty("--shadow-y", `${Math.abs(pointer.x) * 5}px`);
    target.x = -0.08 + pointer.y * 0.5;
    target.y = -0.24 + pointer.x * 0.82;
  });

  container.addEventListener("pointerleave", () => {
    pointerInside = false;
    pointer.x = 0;
    pointer.y = 0;
    pointerNdc.set(2, 2);
    container.style.setProperty("--glow-x", "0px");
    container.style.setProperty("--glow-y", "0px");
    container.style.setProperty("--shadow-x", "0px");
    container.style.setProperty("--shadow-y", "0px");
    target.x = -0.08;
    target.y = -0.24;
  });

  container.addEventListener("click", () => {
    if (!reducedMotion.matches) burstStarted = clock.getElapsedTime();
  });

  window.addEventListener(
    "scroll",
    () => {
      scrollTurn = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    },
    { passive: true }
  );

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

  function updateHeartCloud(elapsed, motion) {
    const age = elapsed - burstStarted;
    const position = heartCloud.geometry.attributes.position;
    let strongestBurst = 0;

    for (let index = 0; index < heartCloud.phases.length; index += 1) {
      const offset = index * 3;
      const phase = heartCloud.phases[index];
      const flow = elapsed * heartCloud.speeds[index] + phase;
      const breathe = 1 + Math.sin(elapsed * 1.35 + phase * 0.18) * 0.012 * motion;
      const localAge = age - heartCloud.burstDelay[index];
      let scatter = 0;

      if (localAge >= 0 && localAge < 0.72) {
        const progress = localAge / 0.72;
        scatter = 1 - Math.pow(1 - progress, 3);
      } else if (localAge >= 0.72 && localAge < 1.55) {
        scatter = 1;
      } else if (localAge >= 1.55 && localAge < 2.75) {
        const progress = (localAge - 1.55) / 1.2;
        const smoothReturn = progress * progress * (3 - 2 * progress);
        scatter = 1 - smoothReturn;
      }

      const distance = scatter * (2.6 + (index % 13) * 0.075);
      const spin = scatter * (
        Math.PI * 2.2 +
        Math.max(localAge, 0) * 2.35 +
        Math.sin(phase) * 0.28
      );
      const cosSpin = Math.cos(spin);
      const sinSpin = Math.sin(spin);
      const rawX = heartCloud.base[offset] * breathe + heartCloud.directions[offset] * distance;
      const rawY = heartCloud.base[offset + 1] * breathe + heartCloud.directions[offset + 1] * distance;
      const drift = heartCloud.drift[index] * motion;

      heartCloud.positions[offset] =
        rawX * cosSpin - rawY * sinSpin + Math.cos(flow) * drift;
      heartCloud.positions[offset + 1] =
        rawX * sinSpin + rawY * cosSpin + Math.sin(flow * 0.82) * drift;
      heartCloud.positions[offset + 2] =
        heartCloud.base[offset + 2] +
        heartCloud.directions[offset + 2] * distance +
        Math.sin(spin * 1.7 + phase) * scatter * 0.7 +
        Math.sin(flow * 1.17) * drift * 2;

      strongestBurst = Math.max(strongestBurst, scatter);
    }

    position.needsUpdate = true;
    heartCloud.material.uniforms.uBurst.value = strongestBurst;
    heartCloud.material.uniforms.uOpacity.value = 0.88 + strongestBurst * 0.12;
    return strongestBurst;
  }

  function updateDust(elapsed, motion) {
    const position = dustGeometry.attributes.position;
    for (let index = 0; index < dustCount; index += 1) {
      const offset = index * 3;
      const phase = dustPhase[index];
      const flow = elapsed * dustSpeed[index] + phase;
      dustPositions[offset] = dustBase[offset] + Math.cos(flow * 0.7) * 0.12 * motion;
      dustPositions[offset + 1] = dustBase[offset + 1] + Math.sin(flow) * 0.18 * motion;
      dustPositions[offset + 2] = dustBase[offset + 2] + Math.sin(flow * 0.55) * 0.14 * motion;
    }
    position.needsUpdate = true;
  }

  function render() {
    const elapsed = clock.getElapsedTime();
    const delta = Math.min(elapsed - lastElapsed, 0.05);
    lastElapsed = elapsed;
    const motion = reducedMotion.matches ? 0 : 1;
    const burst = updateHeartCloud(elapsed, motion);
    updateDust(elapsed, motion);

    const clickAge = elapsed - burstStarted;
    const sequenceActive = clickAge >= 0 && clickAge < 3.15;
    const sequenceProgress = sequenceActive ? Math.min(clickAge / 3.15, 1) : 0;
    const easedSpin = sequenceProgress < 0.5
      ? 2 * sequenceProgress * sequenceProgress
      : 1 - Math.pow(-2 * sequenceProgress + 2, 2) / 2;
    const sequencePower = sequenceActive
      ? Math.pow(Math.sin(sequenceProgress * Math.PI), 0.72)
      : 0;

    spinGroup.rotation.y = sequenceActive ? easedSpin * Math.PI * 2 : 0;
    spinGroup.rotation.z = sequenceActive ? Math.sin(sequenceProgress * Math.PI * 2) * 0.16 : 0;
    spinGroup.rotation.x = sequenceActive ? Math.sin(sequenceProgress * Math.PI) * 0.1 : 0;
    container.classList.toggle("heart-bursting", sequenceActive);

    burstRings.forEach((ring, index) => {
      const ringAge = clickAge - ring.userData.delay;
      const ringProgress = Math.max(0, Math.min(ringAge / 1.35, 1));
      const ringVisible = ringAge >= 0 && ringAge < 1.35;
      ring.visible = ringVisible;
      ring.material.opacity = ringVisible ? Math.sin(ringProgress * Math.PI) * (0.62 - index * 0.1) : 0;
      ring.scale.setScalar(0.72 + ringProgress * 1.85);
      ring.rotation.z = ringProgress * Math.PI * (1.2 + index * 0.3);
    });

    heartGroup.rotation.x += (target.x - heartGroup.rotation.x) * 0.06;
    heartGroup.rotation.y += (target.y + scrollTurn * 0.55 - heartGroup.rotation.y) * 0.06;
    heartGroup.rotation.z = -0.08 + scrollTurn * 0.22;
    heartGroup.position.y = Math.sin(elapsed * 1.15) * 0.13 * motion;

    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointerNdc, camera);
    const nextHeartHovered = pointerInside && raycaster.intersectObject(heart, false).length > 0;
    if (nextHeartHovered !== heartHovered) {
      heartHovered = nextHeartHovered;
      container.classList.toggle("heart-hovered", heartHovered);
    }
    hoverMix += ((heartHovered ? 1 : 0) - hoverMix) * 0.12;

    const beatSpeed = THREE.MathUtils.lerp(1.02, 2.35, hoverMix);
    beatPhase += delta * beatSpeed * motion;
    const phase = beatPhase % 1;
    const firstBeat = Math.exp(-Math.pow((phase - 0.1) / 0.045, 2));
    const secondBeat = Math.exp(-Math.pow((phase - 0.25) / 0.07, 2)) * 0.55;
    const heartbeat = firstBeat + secondBeat;
    const heartScale = 1 + heartbeat * (0.035 + hoverMix * 0.032);
    const clickPulse = 1 + burst * 0.04;

    heartGroup.scale.setScalar(heartScale);
    heart.scale.setScalar(clickPulse);
    glassHeart.scale.setScalar(1.16 + Math.sin(elapsed * 1.1) * 0.012 * motion + burst * 0.018);
    wireHeart.scale.setScalar(1.31 + Math.sin(elapsed * 0.72) * 0.018 * motion);
    heartMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.72, 1.25, hoverMix);

    const lightTime = elapsed * 0.38 + sequenceProgress * Math.PI * 2;
    const lightPointerX = pointerInside ? pointer.x : 0;
    const lightPointerY = pointerInside ? pointer.y : 0;
    const keyTargetX = -2.2 + lightPointerX * 4.5 + Math.cos(lightTime) * 1.15;
    const keyTargetY = 3.2 - lightPointerY * 4 + Math.sin(lightTime * 0.7) * 0.85;
    keyLight.position.x += (keyTargetX - keyLight.position.x) * 0.055;
    keyLight.position.y += (keyTargetY - keyLight.position.y) * 0.055;
    keyLight.position.z = 5.3 + Math.sin(lightTime * 0.55) * 0.7;
    keyLight.intensity = 50 + hoverMix * 14 + sequencePower * 18;

    edgeLight.position.set(
      Math.cos(lightTime + 2.1) * 4.8,
      -1.2 + Math.sin(lightTime * 0.8) * 1.6,
      2.4 + Math.sin(lightTime + 2.1) * 1.8
    );
    edgeLight.intensity = 36 + hoverMix * 14 + sequencePower * 18;

    softLight.position.set(
      Math.cos(lightTime + 4.2) * 4.5,
      -2.5 + Math.sin(lightTime * 0.62 + 1.4) * 1.1,
      2.2 + Math.sin(lightTime + 4.2) * 1.4
    );
    softLight.intensity = 34 + sequencePower * 12;

    rimLight.position.set(
      Math.cos(lightTime * 0.72) * 3.6,
      2.6 + Math.sin(lightTime * 0.9) * 1.5,
      -3.4
    );
    rimLight.intensity = 26 + hoverMix * 8 + sequencePower * 18;
    topLight.position.x = Math.sin(lightTime * 0.55) * 2.2;
    topLight.intensity = 14 + heartbeat * 7 + sequencePower * 12;
    ambientLight.intensity = 1.55 + sequencePower * 0.25;

    container.style.setProperty("--shadow-scale", `${0.88 + heartbeat * 0.1 + sequencePower * 0.24}`);
    container.style.setProperty("--shadow-opacity", `${0.38 + hoverMix * 0.18 + sequencePower * 0.22}`);
    container.style.setProperty("--glow-scale", `${0.94 + heartbeat * 0.05 + sequencePower * 0.13}`);

    ringOne.rotation.z = elapsed * 0.22 * motion + sequenceProgress * Math.PI * 5;
    ringTwo.rotation.z = -elapsed * 0.17 * motion - sequenceProgress * Math.PI * 4;
    heartCloud.points.rotation.z = Math.sin(elapsed * 0.28) * 0.018 * motion + sequencePower * 0.22;
    dust.rotation.y = elapsed * 0.008 * motion;
    dust.rotation.z = -elapsed * 0.004 * motion;

    const radiusX = (container.clientWidth < 520 ? 3.1 : 4.15) + sequencePower * 0.72;
    memoryCards.forEach((card, index) => {
      const angle =
        card.userData.angle +
        elapsed * 0.13 * motion +
        scrollTurn * 0.8 +
        sequenceProgress * Math.PI * 2;
      card.position.x = Math.cos(angle) * radiusX;
      card.position.y =
        card.userData.lane * 1.55 +
        Math.sin(elapsed * 0.7 + index) * 0.13 * motion +
        Math.sin(sequenceProgress * Math.PI * 6 + index) * sequencePower * 0.22;

      const orbitZ = Math.sin(angle) * (1.35 + sequencePower * 0.5) - 0.7;
      const centerDistance = Math.abs(card.position.x);
      const centerProximity = 1 - THREE.MathUtils.clamp(centerDistance / 2.7, 0, 1);
      const centerFade = THREE.MathUtils.smoothstep(centerProximity, 0.08, 0.92);
      const frontApproach = THREE.MathUtils.smoothstep(orbitZ, -0.45, 0.55);
      const crossing = centerFade * frontApproach;

      card.position.z = orbitZ - crossing * 1.7;
      const depth = (orbitZ + 2.55) / 3.7;
      const scale = (container.clientWidth < 520 ? 0.72 : 0.9) * (0.82 + depth * 0.18);
      const crossingScale = THREE.MathUtils.lerp(1, 0.88, crossing);
      const baseOpacity = Math.min(0.92, 0.28 + depth * 0.52 + sequencePower * 0.12);
      card.scale.setScalar(scale * (1 + sequencePower * 0.08) * crossingScale);
      card.material.opacity = THREE.MathUtils.lerp(baseOpacity, 0.1, crossing);
      card.lookAt(camera.position);
    });

    camera.position.x += (pointer.x * 0.3 - camera.position.x) * 0.035;
    camera.position.y += (-pointer.y * 0.2 - camera.position.y) * 0.035;
    camera.position.z += (9.6 - sequencePower * 0.48 - camera.position.z) * 0.08;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    container.dataset.scene = "active";
    requestAnimationFrame(render);
  }

  container.classList.add("three-ready");
  render();
})();
