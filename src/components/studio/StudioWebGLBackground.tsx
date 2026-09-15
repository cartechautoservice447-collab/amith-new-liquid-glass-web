import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { exactStudioVertexShader, exactStudioFragmentShader } from '../../shaders/exactLiquidGlassShader';

export interface GlassBoxDescriptor {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  bezel?: number;
}

interface StudioWebGLBackgroundProps {
  currentBg: string;
  getBoxes: () => GlassBoxDescriptor[];
  glParams?: {
    thick?: number;
    bezel?: number;
    ior?: number;
    blur?: number;
    spec?: number;
    tint?: number;
    shadow?: number;
  };
}

export const StudioWebGLBackground: React.FC<StudioWebGLBackgroundProps> = ({
  currentBg,
  getBoxes,
  glParams = {
    thick: 50,
    bezel: 55,
    ior: 3.0,
    blur: 1.5,
    spec: 0.55,
    tint: 0.08,
    shadow: 0.5,
  },
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    material: THREE.ShaderMaterial;
    bgTexture: THREE.Texture | null;
    rafId: number;
    boxVectors: THREE.Vector4[];
    radiiArray: Float32Array;
    bezelsArray: Float32Array;
  } | null>(null);

  const getBoxesRef = useRef(getBoxes);
  getBoxesRef.current = getBoxes;

  const glParamsRef = useRef(glParams);
  glParamsRef.current = glParams;

  // Initialize Three.js WebGL exact liquid glass renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.warn('WebGL initialization failed:', err);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const boxVectors = Array.from({ length: 16 }, () => new THREE.Vector4());
    const radiiArray = new Float32Array(16);
    const bezelsArray = new Float32Array(16);

    const material = new THREE.ShaderMaterial({
      vertexShader: exactStudioVertexShader,
      fragmentShader: exactStudioFragmentShader,
      uniforms: {
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uBoxes: { value: boxVectors },
        uRadii: { value: radiiArray },
        uBezels: { value: bezelsArray },
        uBoxCount: { value: 0 },
        uThickness: { value: glParamsRef.current.thick ?? 50 },
        uIOR: { value: glParamsRef.current.ior ?? 3.0 },
        uBlur: { value: glParamsRef.current.blur ?? 1.5 },
        uSpecular: { value: glParamsRef.current.spec ?? 0.55 },
        uTint: { value: glParamsRef.current.tint ?? 0.08 },
        uShadow: { value: glParamsRef.current.shadow ?? 0.5 },
        uBgTex: { value: null },
        uBgAspect: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const threeObj = {
      renderer,
      scene,
      camera,
      material,
      bgTexture: null as THREE.Texture | null,
      rafId: 0,
      boxVectors,
      radiiArray,
      bezelsArray,
    };
    threeRef.current = threeObj;

    // Load background texture matching main interface
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      currentBg,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        if (threeRef.current) {
          threeRef.current.bgTexture = tex;
          threeRef.current.material.uniforms.uBgTex.value = tex;
          if (tex.image && tex.image.width && tex.image.height) {
            threeRef.current.material.uniforms.uBgAspect.value =
              tex.image.width / tex.image.height;
          }
        }
      },
      undefined,
      (err) => console.warn('Texture load error:', err)
    );

    // Render loop tracking real element bounding boxes
    const renderLoop = () => {
      if (!threeRef.current) return;

      const boxes = getBoxesRef.current();
      const count = Math.min(boxes.length, 16);

      for (let i = 0; i < 16; i++) {
        if (i < count) {
          const b = boxes[i];
          threeRef.current.boxVectors[i].set(b.x, b.y, b.w, b.h);
          threeRef.current.radiiArray[i] = b.r;
          threeRef.current.bezelsArray[i] = b.bezel ?? 45;
        } else {
          threeRef.current.boxVectors[i].set(0, 0, 0, 0);
          threeRef.current.radiiArray[i] = 0;
          threeRef.current.bezelsArray[i] = 0;
        }
      }

      threeRef.current.material.uniforms.uBoxCount.value = count;
      threeRef.current.material.uniforms.uBoxes.value = threeRef.current.boxVectors;
      threeRef.current.material.uniforms.uRadii.value = threeRef.current.radiiArray;
      threeRef.current.material.uniforms.uBezels.value = threeRef.current.bezelsArray;

      // Update optical uniforms if adjusted
      const curParams = glParamsRef.current;
      threeRef.current.material.uniforms.uThickness.value = curParams.thick ?? 50;
      threeRef.current.material.uniforms.uIOR.value = curParams.ior ?? 3.0;
      threeRef.current.material.uniforms.uBlur.value = curParams.blur ?? 1.5;
      threeRef.current.material.uniforms.uSpecular.value = curParams.spec ?? 0.55;
      threeRef.current.material.uniforms.uTint.value = curParams.tint ?? 0.08;
      threeRef.current.material.uniforms.uShadow.value = curParams.shadow ?? 0.5;

      renderer.render(scene, camera);
      threeObj.rafId = requestAnimationFrame(renderLoop);
    };

    threeObj.rafId = requestAnimationFrame(renderLoop);

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      material.uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeObj.rafId) cancelAnimationFrame(threeObj.rafId);
      if (threeObj.bgTexture) threeObj.bgTexture.dispose();
      material.dispose();
      renderer.dispose();
      threeRef.current = null;
    };
  }, []);

  // Update texture when currentBg changes
  useEffect(() => {
    if (!threeRef.current) return;
    new THREE.TextureLoader().load(
      currentBg,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        if (threeRef.current) {
          if (threeRef.current.bgTexture) {
            threeRef.current.bgTexture.dispose();
          }
          threeRef.current.bgTexture = tex;
          threeRef.current.material.uniforms.uBgTex.value = tex;
          if (tex.image && tex.image.width && tex.image.height) {
            threeRef.current.material.uniforms.uBgAspect.value =
              tex.image.width / tex.image.height;
          }
        }
      },
      undefined,
      (err) => console.warn('Texture update error:', err)
    );
  }, [currentBg]);

  return (
    <canvas
      id="studio-webgl-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};
