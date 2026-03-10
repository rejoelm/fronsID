import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let model: THREE.Group;
let modelSize: THREE.Vector3;
let currentRotation = 0;
let targetRotation = 0;
let currentScale = 1.75;
let targetScale = 1.75;
let animationFrame: number;

const animOptions = {
  duration: 1.2,
  ease: "power3.out",
};

// Smooth easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const tooltipSelectors = new Map([
  [0.5, ".tooltip .icon svg"],
  [0.6, ".tooltip .title h2"],
  [0.7, ".tooltip .description p"],
]);

function setupScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const container = document.querySelector(".model-container");
  if (container) {
    container.appendChild(renderer.domElement);
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
  directionalLight.position.set(-8, 12, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  directionalLight.shadow.radius = 75;
  directionalLight.shadow.blurSamples = 50;
  scene.add(directionalLight);

  const spotLight = new THREE.SpotLight(0xffffff, 3.5);
  spotLight.position.set(-12, 15, 12);
  spotLight.target.position.set(0, 0, 0);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 0.2;
  spotLight.decay = 1;
  spotLight.distance = 100;
  scene.add(spotLight);
  scene.add(spotLight.target);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
  rimLight.position.set(8, 5, -5);
  scene.add(rimLight);
}

function setupModel() {
  if (model && modelSize) {
    camera.position.z = Math.max(modelSize.x, modelSize.y, modelSize.z) * 2;
  }
}

function init() {
  setupScene();

  const loader = new GLTFLoader();
  loader.load("./CARD.glb", (gltf) => {
    model = gltf.scene;

    model.traverse((node) => {
      if ((node as any).isMesh && (node as any).material) {
        Object.assign((node as any).material, {
          metalness: 0.05,
          roughness: 0.95,
        });
        (node as any).castShadow = true;
        (node as any).receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    modelSize = size;

    model.rotation.set(0, Math.PI - 0.2, 0.4);
    model.scale.set(1.75, 1.75, 1.75);


    scene.add(model);
    setupModel();
  });

  animate();

  setupScrollAnimations();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    setupModel();
  });
}

function animate() {
  animationFrame = requestAnimationFrame(animate);

  if (model) {
    const rotationLerp = 0.03;
    const scaleLerp = 0.04;

    if (Math.abs(targetRotation - currentRotation) > 0.001) {
      currentRotation += (targetRotation - currentRotation) * rotationLerp;
      model.rotation.y = Math.PI - 0.9 + currentRotation;
    }

    if (Math.abs(targetScale - currentScale) > 0.001) {
      currentScale += (targetScale - currentScale) * scaleLerp;
      model.scale.set(currentScale, currentScale, currentScale);
    }
  }

  renderer.render(scene, camera);
}

function setupScrollAnimations() {
  setTimeout(() => {
    ScrollTrigger.create({
      trigger: ".howitworks-section",
      start: "top top",
      end: `+=${window.innerHeight * 5}px`,
      pin: true,
      pinSpacing: true,
      markers: false,
      onUpdate: ({ progress }) => {
        const headerProgress = Math.max(0, Math.min(1, progress - 0.05) / 0.3);
        gsap.to(".header-1", {
          xPercent:
            progress < 0.05 ? 0 : progress > 0.35 ? -100 : 100 * headerProgress,
        });

        const maskSize =
          progress < 0.2
            ? 0
            : progress > 0.3
            ? 100
            : 100 * ((progress - 0.2) / 0.1);
        gsap.to(".circular-mask", {
          clipPath: `circle(${maskSize}% at 50% 50%)`,
        });

        const header2Progress = (progress - 0.15) / 0.35;
        const header2XPercent =
          progress > 0.15
            ? 100
            : progress > 0.5
            ? -200
            : 100 - 300 * header2Progress;
        gsap.to(".header-2", {
          xPercent: header2XPercent,
        });

        const scaleX =
          progress < 0.45
            ? 0
            : progress > 0.65
            ? 100
            : 100 * ((progress - 0.45) / 0.2);
        gsap.to(".tooltip .divider", {
          scaleX: `${scaleX}%`,
          ...animOptions,
        });

        tooltipSelectors.forEach((elements, trigger) => {
          gsap.to(elements, {
            y: progress > trigger ? "0%" : "125%",
            ...animOptions,
          });
        });

        if (model && progress > 0.05) {
          const rotationProgress = easeInOutQuart((progress - 0.04) / 0.65);
          targetRotation = Math.PI * 1.5 * rotationProgress;

          const scaleProgress = smoothStep(0, 1, progress);
          targetScale = 1.65 + 0.25 * easeOutCubic(scaleProgress);

          if (model.position) {
            const floatOffset = Math.sin(Date.now() * 0.001) * 0.05;
            model.position.y = floatOffset;
          }
        }
      },
    });
  }, 20); // Small delay to ensure ScrollSmoother is fully initialized
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

export {};
