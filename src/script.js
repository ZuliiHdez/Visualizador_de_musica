import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.minDistance = 15;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI;
controls.minPolarAngle = 0;
controls.enablePan = true;
controls.panSpeed = 0.8;

controls.update();

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";

renderer.domElement.style.display = "block";

const uiContainer = document.createElement("div");
uiContainer.style.cssText = `
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0,0,0,0.7);
  padding: 20px;
  border-radius: 15px;
  font-family: Arial,sans-serif;
  color: white;
  min-width: 300px;
  backdrop-filter: blur(10px);
  z-index: 100;
`;
document.body.appendChild(uiContainer);

const title = document.createElement("h2");
title.textContent = "🎵 Audio Visualizer - Color Rhythm";
title.style.cssText = "margin:0 0 15px 0; color:#ffffff;";
uiContainer.appendChild(title);

const rhythmInfo = document.createElement("div");
rhythmInfo.style.cssText = `
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  font-size: 14px;
`;
uiContainer.appendChild(rhythmInfo);

const rhythmType = document.createElement("div");
rhythmType.style.cssText =
  "font-weight:bold; color:#ff00ff; margin-bottom:5px;";
rhythmType.textContent = "Ritmo: Detenido";
rhythmInfo.appendChild(rhythmType);

const energyLevel = document.createElement("div");
energyLevel.style.cssText = "color:#00ff00;";
energyLevel.textContent = "Energía: 0%";
rhythmInfo.appendChild(energyLevel);

const buttonContainer = document.createElement("div");
buttonContainer.style.cssText =
  "display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;";
uiContainer.appendChild(buttonContainer);

const buttonStyles = `
  padding: 10px 20px;
  border:none;
  border-radius:8px;
  font-weight:bold;
  cursor:pointer;
  flex:1;
  color:white;
  transition: all 0.3s ease;
`;

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "audio/*";
fileInput.style.display = "none";

const uploadBtn = document.createElement("button");
uploadBtn.innerHTML = "📁 Subir Canción";
uploadBtn.style.cssText =
  buttonStyles + " background:linear-gradient(135deg,#667eea,#764ba2);";
uploadBtn.addEventListener("click", () => fileInput.click());
buttonContainer.appendChild(uploadBtn);
buttonContainer.appendChild(fileInput);

const playBtn = document.createElement("button");
playBtn.innerHTML = "▶️ Reproducir";
playBtn.style.cssText =
  buttonStyles + " background:linear-gradient(135deg,#00b09b,#96c93d);";
buttonContainer.appendChild(playBtn);

const stopBtn = document.createElement("button");
stopBtn.innerHTML = "⏹️ Detener";
stopBtn.style.cssText =
  buttonStyles + " background:linear-gradient(135deg,#ff416c,#ff4b2b);";
buttonContainer.appendChild(stopBtn);

const barsToggleBtn = document.createElement("button");
barsToggleBtn.innerHTML = "💡 Barras Luminosas: ON";
barsToggleBtn.style.cssText =
  buttonStyles + " background:linear-gradient(135deg,#ff9a00,#ffcc00);";
barsToggleBtn.addEventListener("click", toggleBarsVisibility);
buttonContainer.appendChild(barsToggleBtn);

const statusIndicator = document.createElement("div");
statusIndicator.style.cssText = "margin-bottom:15px; font-size:14px;";
const statusDot = document.createElement("span");
statusDot.style.cssText =
  "display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff4757;margin-right:5px;box-shadow:0 0 10px currentColor;";
const statusText = document.createElement("span");
statusText.textContent = "Sin canción";
statusIndicator.appendChild(statusDot);
statusIndicator.appendChild(statusText);
uiContainer.appendChild(statusIndicator);

const songTitle = document.createElement("div");
const songDetails = document.createElement("div");
songTitle.style.cssText = "font-weight:bold; color:white; margin-bottom:5px;";
songDetails.style.cssText = "font-size:12px; color:#aaa;";
uiContainer.appendChild(songTitle);
uiContainer.appendChild(songDetails);

const controlsInfo = document.createElement("div");
controlsInfo.style.cssText =
  "margin-top:15px; font-size:12px; color:#aaa; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;";
controlsInfo.innerHTML = `
  <strong>Controles Cámara:</strong><br>
  • Click + arrastrar: Rotar<br>
  • Rueda mouse: Zoom<br>
  • Click derecho + arrastrar: Mover<br>
  • Doble click: Resetear vista
`;
uiContainer.appendChild(controlsInfo);

class RhythmAnalyzer {
  constructor() {
    this.history = [];
    this.maxHistory = 60;
    this.energyThreshold = 0.3;
    this.lastBeatTime = 0;
    this.beatInterval = 500;
    this.rhythmPattern = [];
    this.currentPatternIndex = 0;

    this.colorPatterns = [
      { low: [1.0, 0.0, 0.8], mid: [0.9, 0.2, 1.0], high: [0.8, 0.4, 1.0] },
      { low: [0.0, 1.0, 0.3], mid: [0.2, 1.0, 0.5], high: [0.4, 1.0, 0.7] },
      { low: [1.0, 0.6, 0.0], mid: [1.0, 0.8, 0.2], high: [1.0, 1.0, 0.4] },
      { low: [0.8, 0.0, 1.0], mid: [0.9, 0.1, 1.0], high: [1.0, 0.2, 1.0] },
      { low: [0.0, 1.0, 1.0], mid: [0.2, 1.0, 1.0], high: [0.4, 1.0, 1.0] },
    ];
  }

  analyze(dataArray, currentTime) {
    const lowBand = dataArray.slice(0, Math.floor(dataArray.length * 0.3));
    const midBand = dataArray.slice(
      Math.floor(dataArray.length * 0.3),
      Math.floor(dataArray.length * 0.7)
    );
    const highBand = dataArray.slice(Math.floor(dataArray.length * 0.7));

    const lowEnergy = this.calculateEnergy(lowBand) / 255;
    const midEnergy = this.calculateEnergy(midBand) / 255;
    const highEnergy = this.calculateEnergy(highBand) / 255;

    let isBeat = false;
    const currentEnergy = (lowEnergy + midEnergy + highEnergy) / 3;

    if (currentTime - this.lastBeatTime > this.beatInterval) {
      if (currentEnergy > this.energyThreshold) {
        isBeat = true;
        this.lastBeatTime = currentTime;

        this.energyThreshold = currentEnergy * 0.8 + this.energyThreshold * 0.2;

        this.currentPatternIndex =
          (this.currentPatternIndex + 1) % this.colorPatterns.length;
      }
    }

    let rhythmType = "Suave";
    let dominantFreq = "Bajas";

    if (lowEnergy > midEnergy && lowEnergy > highEnergy) {
      rhythmType = "Bass Heavy";
      dominantFreq = "Bajas";
    } else if (midEnergy > lowEnergy && midEnergy > highEnergy) {
      rhythmType = "Mid Focus";
      dominantFreq = "Medias";
    } else if (highEnergy > lowEnergy && highEnergy > midEnergy) {
      rhythmType = "Treble Heavy";
      dominantFreq = "Altas";
    }

    const pattern = this.colorPatterns[this.currentPatternIndex];
    const color = {
      r:
        pattern.low[0] * lowEnergy +
        pattern.mid[0] * midEnergy +
        pattern.high[0] * highEnergy,
      g:
        pattern.low[1] * lowEnergy +
        pattern.mid[1] * midEnergy +
        pattern.high[1] * highEnergy,
      b:
        pattern.low[2] * lowEnergy +
        pattern.mid[2] * midEnergy +
        pattern.high[2] * highEnergy,
    };

    const maxVal = Math.max(color.r, color.g, color.b, 0.1);
    color.r /= maxVal;
    color.g /= maxVal;
    color.b /= maxVal;

    return {
      lowEnergy,
      midEnergy,
      highEnergy,
      overallEnergy: currentEnergy,
      isBeat,
      rhythmType,
      dominantFreq,
      color,
      patternName: ["Magenta", "Verde", "Naranja", "Violeta", "Cyan"][
        this.currentPatternIndex
      ],
    };
  }

  calculateEnergy(band) {
    return band.reduce((sum, value) => sum + value, 0) / (band.length || 1);
  }
}

let bars = [];
let barsVisible = true;
const numBars = 96;
const barRadius = 12;

const sphereRadius = 3.5;
const maxBarHeight = sphereRadius * 0.8;

const neonColors = [
  new THREE.Color(0xff00ff),
  new THREE.Color(0x00ff00),
  new THREE.Color(0xffaa00),
  new THREE.Color(0xaa00ff),
  new THREE.Color(0x00ffff),
  new THREE.Color(0xff0080),
  new THREE.Color(0xffff00),
  new THREE.Color(0xff5500),
  new THREE.Color(0x9900ff),
  new THREE.Color(0x00ffcc),
];

function getNeonColor(index) {
  return neonColors[
    ((index % neonColors.length) + neonColors.length) % neonColors.length
  ].clone();
}

function initBars() {
  bars = [];

  for (let i = 0; i < numBars; i++) {
    const geom = new THREE.PlaneGeometry(0.5, 1.5);

    let baseColor;
    if (i < numBars * 0.25) {
      baseColor = getNeonColor(Math.floor(i / 4) % 3);
    } else if (i < numBars * 0.5) {
      baseColor = getNeonColor(3 + (Math.floor(i / 4) % 3));
    } else if (i < numBars * 0.75) {
      baseColor = getNeonColor(6 + (Math.floor(i / 4) % 4));
    } else {
      baseColor = getNeonColor(i);
    }

    const mat = new THREE.MeshBasicMaterial({
      color: baseColor.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const bar = new THREE.Mesh(geom, mat);
    const angle = (i / numBars) * Math.PI * 2;

    bar.position.set(
      Math.cos(angle) * barRadius,
      0,
      Math.sin(angle) * barRadius
    );

    bar.lookAt(
      new THREE.Vector3(
        Math.cos(angle) * (barRadius + 5),
        0,
        Math.sin(angle) * (barRadius + 5)
      )
    );

    const light = new THREE.PointLight(baseColor.clone(), 4.0, 60, 1.2);
    light.position.set(
      Math.cos(angle) * barRadius,
      0,
      Math.sin(angle) * barRadius
    );
    scene.add(light);

    const lightHalo = new THREE.PointLight(baseColor.clone(), 2.0, 40, 2.0);
    lightHalo.position.set(
      Math.cos(angle) * (barRadius + 0.8),
      2.0,
      Math.sin(angle) * (barRadius + 0.8)
    );
    scene.add(lightHalo);

    const meta = {
      lastLightTween: 0,
      baseScale: 1.0,
      frequencyMultiplier: 1.0 + Math.random() * 2.0,
      maxScale: maxBarHeight / 1.5,
    };

    scene.add(bar);
    bars.push({
      mesh: bar,
      colorIndex: i,
      light,
      lightHalo,
      meta,
    });
  }
}

function toggleBarsVisibility() {
  barsVisible = !barsVisible;
  barsToggleBtn.innerHTML = barsVisible
    ? "💡 Barras Luminosas: ON"
    : "💡 Barras Luminosas: OFF";
  barsToggleBtn.style.background = barsVisible
    ? "linear-gradient(135deg,#ff9a00,#ffcc00)"
    : "linear-gradient(135deg,#666,#999)";

  bars.forEach((barObj) => {
    barObj.mesh.visible = barsVisible;
    barObj.light.visible = barsVisible;
    barObj.lightHalo.visible = barsVisible;
  });
}

function tweenLightColorAndIntensity(
  light,
  fromColor,
  toColor,
  fromI,
  toI,
  duration = 180
) {
  const obj = { r: fromColor.r, g: fromColor.g, b: fromColor.b, i: fromI };
  const tween = new TWEEN.Tween(obj)
    .to({ r: toColor.r, g: toColor.g, b: toColor.b, i: toI }, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      light.color.setRGB(obj.r, obj.g, obj.b);
      light.intensity = obj.i;
    })
    .start();
  return tween;
}

const state = {
  isPaused: false,
  isStopped: false,
  isReturningToNormal: false,
  targetEnergy: 0,
  targetColor: new THREE.Vector3(1, 1, 1),
  currentDisplacement: 0,
  sphereRotationSpeed: 0.001,
  particlesOpacity: 0.5,
  audioPosition: 0,
};

let audioCtx, analyser, dataArray;
let audioElement,
  isPlaying = false,
  currentSongName = "";
const rhythmAnalyzer = new RhythmAnalyzer();

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (audioCtx) audioCtx.close();

  audioElement = new Audio();
  audioElement.src = URL.createObjectURL(file);
  audioElement.crossOrigin = "anonymous";
  audioElement.loop = true;

  currentSongName = file.name.replace(/\.[^/.]+$/, "");
  const fileSize = (file.size / (1024 * 1024)).toFixed(2);

  statusDot.style.background = "#2ed573";
  statusText.textContent = "Canción cargada";
  statusText.style.color = "#2ed573";
  songTitle.textContent = currentSongName;
  songDetails.textContent = `Tamaño: ${fileSize} MB`;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaElementSource(audioElement);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.6;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
});

function returnToNormalState() {
  state.isReturningToNormal = true;

  TWEEN.removeAll();

  new TWEEN.Tween(state)
    .to({ targetEnergy: 0 }, 2000)
    .easing(TWEEN.Easing.Exponential.Out)
    .start();

  new TWEEN.Tween(state.targetColor)
    .to({ x: 1, y: 1, z: 1 }, 2000)
    .easing(TWEEN.Easing.Exponential.Out)
    .start();

  new TWEEN.Tween(state)
    .to({ sphereRotationSpeed: 0.001 }, 2000)
    .easing(TWEEN.Easing.Exponential.Out)
    .start();

  new TWEEN.Tween(state)
    .to({ particlesOpacity: 0.1 }, 2000)
    .easing(TWEEN.Easing.Exponential.Out)
    .start();
}

function prepareResume() {
  state.isReturningToNormal = false;
  TWEEN.removeAll();
}

playBtn.addEventListener("click", () => {
  if (audioElement) {
    if (!isPlaying) {
      if (audioElement.currentTime > 0) {
        state.audioPosition = audioElement.currentTime;
      }

      audioElement.play();
      isPlaying = true;
      if (audioCtx.state === "suspended") audioCtx.resume();

      statusDot.style.background = "#1e90ff";
      statusText.textContent = "Reproduciendo...";
      statusText.style.color = "#1e90ff";
      playBtn.innerHTML = "⏸️ Pausar";
      playBtn.style.background = "linear-gradient(135deg,#ffa502,#ff7f00)";

      prepareResume();
    } else {
      audioElement.pause();
      isPlaying = false;

      state.audioPosition = audioElement.currentTime;

      statusDot.style.background = "#2ed573";
      statusText.textContent = "Pausado";
      statusText.style.color = "#2ed573";
      playBtn.innerHTML = "▶️ Reproducir";
      playBtn.style.background = "linear-gradient(135deg,#00b09b,#96c93d)";

      returnToNormalState();
    }
  }
});

stopBtn.addEventListener("click", () => {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    isPlaying = false;
    state.audioPosition = 0;

    if (audioCtx && audioCtx.state !== "closed") audioCtx.suspend();

    statusDot.style.background = "#ff4757";
    statusText.textContent = "Detenido";
    statusText.style.color = "#ff4757";
    playBtn.innerHTML = "▶️ Reproducir";
    playBtn.style.background = "linear-gradient(135deg,#00b09b,#96c93d)";

    returnToNormalState();

    rhythmType.textContent = "Ritmo: Detenido";
    energyLevel.textContent = "Energía: 0%";
  }
});

const uniforms = {
  u_time: { value: 0 },
  u_frequency: { value: 0 },
  u_neonColor: { value: new THREE.Vector3(1, 1, 1) },
  u_wireframeColor: { value: new THREE.Vector3(1, 1, 1) },
  u_beat: { value: 0 },
  u_energy: { value: 0 },
  u_displacement: { value: 0 },
  u_neonIntensity: { value: 0.8 },
  u_neonPulse: { value: 0.0 },
  u_colorMix: { value: 0.0 },
};

const sphereGeo = new THREE.IcosahedronGeometry(sphereRadius, 30);

const sphereMat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    uniform float u_time;
    uniform float u_frequency;
    uniform float u_beat;
    uniform float u_energy;
    uniform float u_displacement;
    uniform float u_neonPulse;

    varying vec3 vNormal;
    varying float vIntensity;
    varying vec3 vPosition;
    varying float vRandom;

    void main(){
      vRandom = sin(dot(position, vec3(12.9898, 78.233, 45.5432))) * 43758.5453;
      vRandom = fract(vRandom);
      
      float noise = 2.0 * sin(position.x * 3.0 + u_time * 2.0) * 
                    sin(position.y * 3.0 + u_time * 1.5) * 
                    sin(position.z * 3.0 + u_time * 1.0);
      
      float intensity = clamp(u_frequency * 0.3, 0.0, 1.0);
      float beatPulse = sin(u_time * 12.0) * 0.15 * u_beat;
      
      float displacementFactor = u_displacement;
      float displacement = noise * (intensity + u_energy * 0.7) * 1.8 * displacementFactor + beatPulse;
      
      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vIntensity = intensity + u_energy * 0.5;
    }
  `,
  fragmentShader: `
    uniform vec3 u_neonColor;
    uniform vec3 u_wireframeColor;
    uniform float u_energy;
    uniform float u_beat;
    uniform float u_neonIntensity;
    uniform float u_neonPulse;
    uniform float u_time;
    uniform float u_colorMix;
    
    varying vec3 vNormal;
    varying float vIntensity;
    varying vec3 vPosition;
    varying float vRandom;
    
    void main() {
      vec3 wireframeColor = u_wireframeColor * 1.5;
      
      vec3 neonColor = u_neonColor * 1.3;
      
      float totalGlow = 0.0;
      
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float edgeFactor = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 4.0);
      totalGlow += edgeFactor * 0.8;
      
      totalGlow += u_energy * 1.2;
      
      float rhythmPulse = sin(u_time * 8.0 + vPosition.x * 4.0) * 0.5 + 0.5;
      totalGlow += u_neonPulse * rhythmPulse * 0.7;
      
      totalGlow += u_beat * 2.0;
      
      float patternGlow = sin(vPosition.x * 5.0 + u_time * 3.0) * 
                         cos(vPosition.y * 5.0 + u_time * 2.5) * 
                         sin(vPosition.z * 5.0 + u_time * 2.0) * 0.5 + 0.5;
      totalGlow += patternGlow * vIntensity * 0.6;
      
      totalGlow += vRandom * 0.4;
      
      totalGlow = clamp(totalGlow, 0.0, 2.5) * u_neonIntensity;
      
      vec3 neonGlowColor = neonColor * totalGlow;
      
      vec3 finalColor = wireframeColor;
      
      float glowStrength = edgeFactor * 0.9 + 0.1;
      finalColor += neonGlowColor * glowStrength * 0.9;
      
      finalColor += neonColor * u_beat * 0.5;
      
      float colorShift = sin(u_time * 2.0 + vPosition.y * 3.0) * 0.3 + 0.7;
      vec3 extraColor = mix(neonColor, vec3(1.0, 0.5, 0.2), colorShift * 0.3);
      finalColor += extraColor * vIntensity * 0.4;
      
      finalColor = max(finalColor, wireframeColor * 0.7);
      
      float energyGlow = u_energy * 0.5;
      finalColor += vec3(energyGlow, energyGlow, energyGlow) * 0.3;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  wireframe: true,
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
});

const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

const neonLight1 = new THREE.PointLight(0xffffff, 2.0, 30, 2.0);
neonLight1.position.set(6, 4, 3);
scene.add(neonLight1);

const neonLight2 = new THREE.PointLight(0xffffff, 2.0, 30, 2.0);
neonLight2.position.set(-6, -4, -3);
scene.add(neonLight2);

const sphereLightMeta = { lastTween: 0 };

function tweenNeonColor(fromColor, toColor, duration = 400) {
  const obj = { r: fromColor.r, g: fromColor.g, b: fromColor.b };
  const tween = new TWEEN.Tween(obj)
    .to({ r: toColor.r, g: toColor.g, b: toColor.b }, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      uniforms.u_neonColor.value.set(obj.r, obj.g, obj.b);

      neonLight1.color.setRGB(obj.r, obj.g, obj.b);
      neonLight2.color.setRGB(obj.r * 0.7, obj.g * 0.7, obj.b * 0.7);
    })
    .start();
  return tween;
}

function tweenNeonIntensity(from, to, duration = 250) {
  const obj = { intensity: from };
  const tween = new TWEEN.Tween(obj)
    .to({ intensity: to }, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      uniforms.u_neonIntensity.value = obj.intensity;
    })
    .start();
  return tween;
}

function tweenNeonPulse(from, to, duration = 120) {
  const obj = { pulse: from };
  const tween = new TWEEN.Tween(obj)
    .to({ pulse: to }, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      uniforms.u_neonPulse.value = obj.pulse;
    })
    .start();
  return tween;
}

const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 30;
}

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(posArray, 3)
);
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.02,
  color: 0xffffff,
  transparent: true,
  opacity: state.particlesOpacity,
  blending: THREE.AdditiveBlending,
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

initBars();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  controls.update();

  let rhythmData = {
    overallEnergy: 0,
    isBeat: false,
    color: { r: 1, g: 1, b: 1 },
    rhythmType: "Detenido",
    patternName: "None",
  };

  if (audioElement && isPlaying && analyser) {
    analyser.getByteFrequencyData(dataArray);
    rhythmData = rhythmAnalyzer.analyze(dataArray, t * 1000);

    rhythmType.textContent = `Ritmo: ${rhythmData.rhythmType} (${rhythmData.patternName})`;
    energyLevel.textContent = `Energía: ${Math.round(
      rhythmData.overallEnergy * 100
    )}%`;

    state.targetEnergy = rhythmData.overallEnergy;
    state.targetColor.set(
      rhythmData.color.r,
      rhythmData.color.g,
      rhythmData.color.b
    );
    state.sphereRotationSpeed = 0.002 + rhythmData.overallEnergy * 0.01;
    state.particlesOpacity = 0.4 + rhythmData.overallEnergy * 0.7;

    const currentNeonColor = uniforms.u_neonColor.value;

    const vibrantColor = new THREE.Vector3(
      Math.min(1.0, rhythmData.color.r * 1.3),
      Math.min(1.0, rhythmData.color.g * 1.3),
      Math.min(1.0, rhythmData.color.b * 1.3)
    );

    const targetNeonColor = vibrantColor;

    if (currentNeonColor.distanceTo(targetNeonColor) > 0.2) {
      tweenNeonColor(currentNeonColor, targetNeonColor, 500);
    }

    const targetIntensity = 0.8 + rhythmData.overallEnergy * 1.8;
    if (Math.abs(uniforms.u_neonIntensity.value - targetIntensity) > 0.15) {
      tweenNeonIntensity(uniforms.u_neonIntensity.value, targetIntensity, 350);
    }

    if (rhythmData.isBeat) {
      uniforms.u_beat.value = 1.0;

      const pulseTween = tweenNeonPulse(0.0, 1.2, 40);
      pulseTween.onComplete(() => {
        tweenNeonPulse(1.2, 0.0, 250);
      });

      const intensityTween = tweenNeonIntensity(
        uniforms.u_neonIntensity.value,
        uniforms.u_neonIntensity.value * 1.5,
        60
      );
      intensityTween.onComplete(() => {
        tweenNeonIntensity(
          uniforms.u_neonIntensity.value,
          targetIntensity,
          300
        );
      });

      particlesMaterial.color.setRGB(
        rhythmData.color.r,
        rhythmData.color.g,
        rhythmData.color.b
      );

      new TWEEN.Tween(uniforms.u_beat)
        .to({ value: 0 }, 180)
        .easing(TWEEN.Easing.Exponential.Out)
        .start();
    }

    uniforms.u_displacement.value = 0.3 + rhythmData.overallEnergy * 0.8;

    if (barsVisible) {
      bars.forEach((barObj, i) => {
        const freqIndex = Math.floor((i / numBars) * dataArray.length);
        const raw = dataArray[freqIndex] / 255;

        const variedRaw = raw * barObj.meta.frequencyMultiplier;

        const targetScale =
          0.1 + Math.pow(variedRaw, 1.5) * barObj.meta.maxScale;
        const limitedScale = Math.min(targetScale, maxBarHeight / 1.5);

        barObj.mesh.scale.y = THREE.MathUtils.lerp(
          barObj.mesh.scale.y,
          limitedScale,
          0.25
        );

        const pulse = Math.sin(t * 4 + i * 0.05) * 0.4 + 0.8;
        const freqIntensity = 0.4 + variedRaw * 0.8;
        const shift = Math.sin(t * 1.2 + i * 0.03) * 3;
        const base = getNeonColor(barObj.colorIndex + Math.floor(shift));

        const barTargetColor = new THREE.Color(
          Math.min(1.5, base.r * pulse * freqIntensity * 1.5),
          Math.min(1.5, base.g * pulse * freqIntensity * 1.5),
          Math.min(1.5, base.b * pulse * freqIntensity * 1.5)
        );

        barObj.mesh.material.color.lerp(barTargetColor, 0.3);
        barObj.mesh.material.opacity = 0.9 + variedRaw * 0.6;

        const now = performance.now();
        const last = barObj.meta.lastLightTween || 0;

        if (now - last > 50) {
          barObj.meta.lastLightTween = now;

          const targetIntensity = 4.0 + limitedScale * 5.0;

          tweenLightColorAndIntensity(
            barObj.light,
            barObj.light.color.clone(),
            barTargetColor,
            barObj.light.intensity,
            targetIntensity,
            100
          );

          tweenLightColorAndIntensity(
            barObj.lightHalo,
            barObj.lightHalo.color.clone(),
            barTargetColor,
            barObj.lightHalo.intensity,
            targetIntensity * 0.8,
            120
          );
        }
      });
    }
  } else if (state.isReturningToNormal) {
    rhythmType.textContent = "Ritmo: Apagándose...";
    energyLevel.textContent = `Energía: ${Math.round(
      state.targetEnergy * 100
    )}%`;

    tweenNeonColor(
      uniforms.u_neonColor.value,
      new THREE.Vector3(1, 1, 1),
      1800
    );

    tweenNeonIntensity(uniforms.u_neonIntensity.value, 0.4, 1200);

    tweenNeonPulse(uniforms.u_neonPulse.value, 0.0, 600);

    uniforms.u_displacement.value = Math.max(
      0,
      uniforms.u_displacement.value - 0.01
    );

    uniforms.u_beat.value *= 0.9;

    if (barsVisible) {
      bars.forEach((barObj) => {
        barObj.mesh.scale.y = THREE.MathUtils.lerp(
          barObj.mesh.scale.y,
          0.1,
          0.08
        );
        barObj.mesh.material.opacity *= 0.9;
        barObj.light.intensity *= 0.9;
        barObj.lightHalo.intensity *= 0.9;
      });
    }
  }

  uniforms.u_energy.value +=
    (state.targetEnergy - uniforms.u_energy.value) * 0.1;
  uniforms.u_frequency.value = uniforms.u_energy.value;

  particlesMaterial.opacity = state.particlesOpacity;

  uniforms.u_time.value = t;

  uniforms.u_beat.value *= 0.95;

  sphere.rotation.y += state.sphereRotationSpeed;
  sphere.rotation.x += uniforms.u_energy.value * 0.008;

  neonLight1.position.x = Math.sin(t * 0.6) * 7;
  neonLight1.position.y = Math.cos(t * 0.8) * 5;
  neonLight1.position.z = Math.sin(t * 0.7) * 4;

  neonLight2.position.x = Math.cos(t * 0.7) * 6;
  neonLight2.position.y = Math.sin(t * 0.9) * 4;
  neonLight2.position.z = Math.cos(t * 0.8) * 5;

  particlesMesh.rotation.y += uniforms.u_energy.value * 0.003;
  particlesMesh.rotation.x += uniforms.u_energy.value * 0.002;

  const positions = particlesMesh.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const radius = Math.sqrt(x * x + y * y + z * z);
    const angle = t * 0.3 + i * 0.0001;

    positions[i] = x * Math.cos(angle * 0.003) - z * Math.sin(angle * 0.003);
    positions[i + 2] =
      z * Math.cos(angle * 0.003) + x * Math.sin(angle * 0.003);

    if (uniforms.u_energy.value > 0) {
      positions[i + 1] +=
        Math.sin(t * 2.5 + i) * uniforms.u_energy.value * 0.03;
    }
  }
  particlesMesh.geometry.attributes.position.needsUpdate = true;

  TWEEN.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
