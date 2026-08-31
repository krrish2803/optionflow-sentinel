import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HeroSceneProps {
  isHovered?: boolean;
}

export const HeroScene: React.FC<HeroSceneProps> = ({ isHovered = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 450;
    const height = container.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    // A decorative canvas does not need retina-level rendering. Capping this
    // avoids a large GPU cost on high-density displays.
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0c1626, 2.5);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x00d9ff, 3.5, 100);
    cyanPointLight.position.set(10, 15, 15);
    scene.add(cyanPointLight);

    const emeraldPointLight = new THREE.PointLight(0x00ff41, 2.5, 100);
    emeraldPointLight.position.set(-15, -10, 10);
    scene.add(emeraldPointLight);

    // Group for all rotating elements
    const mainGroup = new THREE.Group();
    mainGroup.rotation.y = THREE.MathUtils.degToRad(15);
    mainGroup.rotation.x = THREE.MathUtils.degToRad(10);
    scene.add(mainGroup);

    // 1. Central Volatility Matrix Core
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // Inner glowing core
    const innerGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x00d9ff,
      emissive: 0x00d9ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerCore);

    // 2. 3D Candlestick Chart Grid (Upward trending)
    const candleGroup = new THREE.Group();
    const candleCount = 12;
    const candleSpacing = 1.4;
    const candleStartX = -((candleCount - 1) * candleSpacing) / 2;

    const boxGeo = new THREE.BoxGeometry(0.7, 1, 0.7);
    const wickGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);

    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x00ff41,
      emissive: 0x00ff41,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    const redMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff4444,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x00d9ff,
      emissive: 0x00d9ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    for (let i = 0; i < candleCount; i++) {
      const isGreen = i % 3 !== 1;
      const mat = i === candleCount - 1 ? cyanMat : isGreen ? greenMat : redMat;
      const candleHeight = 0.8 + Math.sin(i * 0.5) * 0.7 + (i * 0.3);
      const yBase = (i * 0.4) - 3.5;

      const body = new THREE.Mesh(boxGeo, mat);
      body.scale.set(1, Math.max(0.5, candleHeight), 1);
      body.position.set(candleStartX + i * candleSpacing, yBase, 3.2);
      candleGroup.add(body);

      const wick = new THREE.Mesh(wickGeo, mat);
      wick.scale.set(1, height + 1.4, 1);
      wick.position.set(candleStartX + i * candleSpacing, yBase, 3.2);
      candleGroup.add(wick);
    }
    mainGroup.add(candleGroup);

    // 3. Orbiting Greeks Tokens (Delta Δ, Gamma Γ, Vega ν, Theta θ)
    const textures: THREE.Texture[] = [];
    const createGreekToken = (symbol: string, color: number) => {
      const group = new THREE.Group();
      
      const ringGeo = new THREE.TorusGeometry(1.1, 0.08, 12, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);

      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 128, 128);
        ctx.font = 'bold 64px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(symbol, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      textures.push(texture);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(1.4, 1.4, 1);
      group.add(sprite);

      return group;
    };

    const greekDelta = createGreekToken('Δ', 0x00d9ff);
    const greekGamma = createGreekToken('Γ', 0x00ff41);
    const greekVega = createGreekToken('ν', 0xffd166);
    const greekTheta = createGreekToken('θ', 0xff4444);

    mainGroup.add(greekDelta);
    mainGroup.add(greekGamma);
    mainGroup.add(greekVega);
    mainGroup.add(greekTheta);

    // 4. Floating Particles
    const particleCount = 150;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 35;
      particlePositions[i + 1] = (Math.random() - 0.5) * 30;
      particlePositions[i + 2] = (Math.random() - 0.5) * 30;
      particleVelocities.push(Math.random() * 0.03 + 0.01);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.6,
      color: 0x00d9ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetMouseX = x * 8;
      targetMouseY = y * 6;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let isPageVisible = !document.hidden;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setPageVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible && !animationFrameId) animationFrameId = requestAnimationFrame(animate);
    };

    const animate = (time: number) => {
      if (!isPageVisible) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      const targetZ = isHoveredRef.current ? 25 : 32;
      camera.position.z += (targetZ - camera.position.z) * 0.05;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      camera.position.x = mouseX * 0.3;
      camera.position.y = -mouseY * 0.3;
      camera.lookAt(0, 0, 0);

      const speedMultiplier = prefersReducedMotion ? 0 : isHoveredRef.current ? 1.5 : 1.0;
      const t = (time * 0.001) * speedMultiplier;

      mainGroup.rotation.y = THREE.MathUtils.degToRad(15) + t * 0.25;
      coreMesh.rotation.x = t * 0.3;
      coreMesh.rotation.y = t * 0.4;
      innerCore.rotation.y = -t * 0.5;

      greekDelta.position.set(Math.cos(t * 0.35) * 8.5, Math.sin(t * 0.8) * 1.8, Math.sin(t * 0.35) * 8.5);
      greekGamma.position.set(Math.cos(t * 0.28 + 1.5) * 10, Math.sin(t * 0.9 + 1) * 2.2, Math.sin(t * 0.28 + 1.5) * 10);
      greekVega.position.set(Math.cos(t * 0.22 + 3.2) * 11.5, Math.sin(t * 0.6 + 2) * 2, Math.sin(t * 0.22 + 3.2) * 11.5);
      greekTheta.position.set(Math.cos(t * 0.32 + 4.8) * 9.2, Math.sin(t * 0.7 + 3) * 2.4, Math.sin(t * 0.32 + 4.8) * 9.2);

      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i + 1] += particleVelocities[i / 3];
        if (positions[i + 1] > 15) positions[i + 1] = -15;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);
    document.addEventListener('visibilitychange', setPageVisibility);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 450;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', setPageVisibility);
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      boxGeo.dispose();
      wickGeo.dispose();
      greenMat.dispose();
      redMat.dispose();
      cyanMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      textures.forEach((texture) => texture.dispose());
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[420px] lg:h-[540px] cursor-grab active:cursor-grabbing select-none"
      title="Interactive 3D Options Volatility Surface"
    />
  );
};
