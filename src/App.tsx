import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { hexToRgb } from './lib/svgGlassMath';
import { vertexShader, fragmentShader } from './lib/webglGlassShader';
import { SvgGlass } from './components/SvgGlass';
import { StudioView } from './components/studio/StudioView';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ALL_TEMPLATES,
  SHOWCASE_TEMPLATES,
  CLASSIC_TEMPLATES,
  DEFAULT_BG,
  BgTemplate,
} from './data/backgroundTemplates';

export default function App() {
  // Dual-mode routing: 'classic' vs 'studio'
  const [viewMode, setViewMode] = useState<'classic' | 'studio'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      if (path.includes('/studio') || hash.includes('studio') || search.includes('studio')) {
        return 'studio';
      }
      try {
        const saved = localStorage.getItem('liquid-glass-view-mode');
        if (saved === 'studio') return 'studio';
      } catch (e) {}
    }
    return 'classic';
  });

  const [mode, setMode] = useState<'webgl' | 'svg'>('webgl');
  const [panelOpen, setPanelOpen] = useState(false);
  const [currentBg, setCurrentBg] = useState<string>(DEFAULT_BG);
  const [customBgInput, setCustomBgInput] = useState('');
  const [customThumbUrl, setCustomThumbUrl] = useState<string | null>(null);

  const switchViewMode = useCallback((newMode: 'classic' | 'studio') => {
    setViewMode(newMode);
    try {
      localStorage.setItem('liquid-glass-view-mode', newMode);
      const targetUrl = newMode === 'studio' ? '/studio' : '/';
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ view: newMode }, '', targetUrl);
      }
    } catch (err) {
      console.warn('History pushState error:', err);
    }
  }, []);

  // Popstate & hashchange listener for browser forward/back buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      if (path.includes('/studio') || hash.includes('studio') || search.includes('studio')) {
        setViewMode('studio');
      } else {
        setViewMode('classic');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // WebGL State (matching webgl.html)
  const [glState, setGlState] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
    gw: 300,
    gh: 200,
    gr: 60,
    thick: 50,
    bezel: 60,
    ior: 3.0,
    blur: 1.5,
    spec: 0.55,
    tint: 0.08,
    shadow: 0.5,
  });

  // SVG State (matching index.html)
  const [svgState, setSvgState] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - 150 : 250,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 - 100 : 200,
    gw: 300,
    gh: 200,
    br: 60,
    surfaceFn: 'convex_squircle',
    glassThickness: 80,
    bezelWidth: 60,
    refractiveIndex: 3.0,
    scaleRatio: 1.0,
    blurAmount: 0.3,
    specularOpacity: 0.5,
    specularSaturation: 4,
    shadowColor: '#ffffff',
    shadowBlur: 20,
    shadowSpread: -5,
    tintColor: '#ffffff',
    tintOpacity: 6,
    outerShadowBlur: 24,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    material: THREE.ShaderMaterial;
    bgTexture: THREE.Texture | null;
    rafId: number;
  } | null>(null);

  // Sync background on document.body for seamless native backdrop sampling
  useEffect(() => {
    if (viewMode === 'classic') {
      document.body.style.background = `url('${currentBg}') center/cover no-repeat`;
    } else {
      document.body.style.background = '#040714';
    }
  }, [currentBg, viewMode]);

  // ----------------------------------------------------
  // WebGL Setup and Render Loop
  // ----------------------------------------------------
  const loadBgTexture = useCallback((url: string) => {
    if (!threeRef.current) return;
    new THREE.TextureLoader().load(
      url,
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
      (err) => {
        console.warn('Failed to load WebGL texture directly, trying fallback', err);
      }
    );
  }, []);

  useEffect(() => {
    if (mode !== 'webgl' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uGlassCenter: { value: new THREE.Vector2(glState.x, glState.y) },
        uGlassSize: { value: new THREE.Vector2(glState.gw, glState.gh) },
        uRadius: { value: glState.gr },
        uBezel: { value: glState.bezel },
        uThickness: { value: glState.thick },
        uIOR: { value: glState.ior },
        uBlur: { value: glState.blur },
        uSpecular: { value: glState.spec },
        uTint: { value: glState.tint },
        uShadow: { value: glState.shadow },
        uBgTex: { value: null },
        uBgAspect: { value: 1.5 },
      },
      transparent: true,
      depthTest: false,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let animId = 0;
    const renderLoop = () => {
      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    threeRef.current = {
      renderer,
      scene,
      camera,
      material,
      bgTexture: null,
      rafId: animId,
    };

    loadBgTexture(currentBg);
    animId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      material.dispose();
      threeRef.current = null;
    };
  }, [mode]);

  // Update uniforms when glState changes
  useEffect(() => {
    if (threeRef.current) {
      const u = threeRef.current.material.uniforms;
      u.uResolution.value.set(window.innerWidth, window.innerHeight);
      u.uGlassCenter.value.set(glState.x, glState.y);
      u.uGlassSize.value.set(glState.gw, glState.gh);
      u.uRadius.value = glState.gr;
      u.uBezel.value = glState.bezel;
      u.uThickness.value = glState.thick;
      u.uIOR.value = glState.ior;
      u.uBlur.value = glState.blur;
      u.uSpecular.value = glState.spec;
      u.uTint.value = glState.tint;
      u.uShadow.value = glState.shadow;
    }
  }, [glState]);

  // When currentBg changes, load texture in WebGL
  useEffect(() => {
    if (mode === 'webgl') {
      loadBgTexture(currentBg);
    }
  }, [currentBg, mode, loadBgTexture]);

  // ----------------------------------------------------
  // Pointer Dragging Handlers
  // ----------------------------------------------------
  const handlePointerDownWebGL = (e: React.PointerEvent) => {
    e.preventDefault();
    let sx = e.clientX;
    let sy = e.clientY;

    const onMove = (moveEvt: PointerEvent) => {
      moveEvt.preventDefault();
      const dx = moveEvt.clientX - sx;
      const dy = moveEvt.clientY - sy;
      sx = moveEvt.clientX;
      sy = moveEvt.clientY;
      setGlState((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp, { once: true });
  };

  // ----------------------------------------------------
  // Background Handler
  // ----------------------------------------------------
  const applyCustomBg = (url: string) => {
    if (!url.trim()) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setCurrentBg(url);
      setCustomThumbUrl(url);
      setCustomBgInput('');
      try {
        localStorage.setItem('liquid-glass-custom-bg', url);
      } catch (e) {}
    };
    img.onerror = () => {
      alert('Failed to load image. The URL may be invalid or blocked by CORS.');
    };
    img.src = url;
  };

  const resetBg = () => {
    setCustomBgInput('');
    setCustomThumbUrl(null);
    setCurrentBg(DEFAULT_BG);
    try {
      localStorage.removeItem('liquid-glass-custom-bg');
    } catch (e) {}
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black">
      <AnimatePresence mode="wait">
        {viewMode === 'studio' ? (
          <motion.div
            key="studio-view"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <StudioView
              currentBg={currentBg}
              allTemplates={ALL_TEMPLATES}
              onSelectBg={(url) => setCurrentBg(url)}
              glParams={{
                thick: glState.thick,
                bezel: glState.bezel,
                ior: glState.ior,
                blur: glState.blur,
                spec: glState.spec,
                tint: glState.tint,
                shadow: glState.shadow,
              }}
              onReturnToClassic={() => switchViewMode('classic')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="classic-view"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="relative w-full h-full overflow-hidden select-none"
          >
            {/* TOP NAVIGATION BAR FOR CLASSIC VIEW */}
            <header
              id="classic-top-navbar"
              className="fixed top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/20 shadow-2xl transition-all select-none pointer-events-auto"
              style={{
                background: 'rgba(18, 20, 32, 0.75)',
                backdropFilter: 'blur(30px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(30px) saturate(1.4)',
                boxShadow:
                  '0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              <div className="flex items-center gap-2 pr-2 border-r border-white/15">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <span className="text-[11px] font-bold tracking-widest text-slate-200 uppercase">
                  Liquid Glass
                </span>
              </div>

              {/* High-visibility glass toggle button */}
              <button
                id="btn-liquid-glass-studio"
                onClick={() => switchViewMode('studio')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-500 hover:to-purple-500 border border-white/30 text-xs font-semibold text-white shadow-lg shadow-purple-500/25 transition-all active:scale-95 cursor-pointer"
                title="Switch to Liquid Glass Studio Mode"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Liquid Glass Studio</span>
              </button>
            </header>

            {/* Background layer for both WebGL and SVG */}
            <div
              id="bg"
              style={{
                backgroundImage: `url('${currentBg}')`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }}
            />

      {/* WEBGL MODE */}
      {mode === 'webgl' && (
        <>
          <canvas id="gl" ref={canvasRef} />
          <div
            id="dragger"
            onPointerDown={handlePointerDownWebGL}
            style={{
              left: `${glState.x - glState.gw / 2}px`,
              top: `${glState.y - glState.gh / 2}px`,
              width: `${glState.gw}px`,
              height: `${glState.gh}px`,
              borderRadius: `${glState.gr}px`,
            }}
          />
        </>
      )}

      {/* SVG MODE */}
      {mode === 'svg' && (
        <SvgGlass {...svgState} currentBg={currentBg} />
      )}

      {/* Persistent SVG filter root definitions */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="0"
        height="0"
        style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
        colorInterpolationFilters="sRGB"
        id="svg-filter-root"
      >
        <defs id="svg-defs" />
      </svg>

      {/* PANEL TOGGLE BUTTON */}
      <button
        className={`panel-toggle ${panelOpen ? 'hidden' : ''}`}
        id="panel-toggle"
        aria-label="Toggle controls"
        onClick={() => setPanelOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      </button>

      {/* CONTROLS DRAWER */}
      <div id="controls" className={panelOpen ? 'open' : ''}>
        <div className="controls-header">
          <span className="controls-title">Controls</span>
          <button
            className="close-btn"
            id="panel-close"
            aria-label="Close"
            onClick={() => setPanelOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className="controls-scroll">
          {mode === 'webgl' ? (
            /* WEBGL CONTROLS */
            <>
              <h2>Glass</h2>
              <label>
                Width
                <input
                  type="range"
                  id="gw"
                  min="200"
                  max="700"
                  value={glState.gw}
                  onChange={(e) => setGlState((prev) => ({ ...prev, gw: +e.target.value }))}
                />
                <span className="vd" id="gw-v">
                  {Math.round(glState.gw)}
                </span>
              </label>

              <label>
                Height
                <input
                  type="range"
                  id="gh"
                  min="200"
                  max="800"
                  value={glState.gh}
                  onChange={(e) => setGlState((prev) => ({ ...prev, gh: +e.target.value }))}
                />
                <span className="vd" id="gh-v">
                  {Math.round(glState.gh)}
                </span>
              </label>

              <label>
                Radius
                <input
                  type="range"
                  id="gr"
                  min="4"
                  max="100"
                  value={glState.gr}
                  onChange={(e) => setGlState((prev) => ({ ...prev, gr: +e.target.value }))}
                />
                <span className="vd" id="gr-v">
                  {Math.round(glState.gr)}
                </span>
              </label>

              <h2>Refraction</h2>
              <label>
                Thickness
                <input
                  type="range"
                  id="thick"
                  min="10"
                  max="200"
                  value={glState.thick}
                  onChange={(e) => setGlState((prev) => ({ ...prev, thick: +e.target.value }))}
                />
                <span className="vd" id="thick-v">
                  {Math.round(glState.thick)}
                </span>
              </label>

              <label>
                Bezel
                <input
                  type="range"
                  id="bezel"
                  min="2"
                  max="60"
                  value={glState.bezel}
                  onChange={(e) => setGlState((prev) => ({ ...prev, bezel: +e.target.value }))}
                />
                <span className="vd" id="bezel-v">
                  {Math.round(glState.bezel)}
                </span>
              </label>

              <label>
                IOR
                <input
                  type="range"
                  id="ior"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={glState.ior}
                  onChange={(e) => setGlState((prev) => ({ ...prev, ior: +e.target.value }))}
                />
                <span className="vd" id="ior-v">
                  {glState.ior.toFixed(2)}
                </span>
              </label>

              <h2>Look</h2>
              <label>
                Blur
                <input
                  type="range"
                  id="blur"
                  min="0"
                  max="12"
                  step="0.5"
                  value={glState.blur}
                  onChange={(e) => setGlState((prev) => ({ ...prev, blur: +e.target.value }))}
                />
                <span className="vd" id="blur-v">
                  {glState.blur.toFixed(1)}
                </span>
              </label>

              <label>
                Specular
                <input
                  type="range"
                  id="spec"
                  min="0"
                  max="1"
                  step="0.05"
                  value={glState.spec}
                  onChange={(e) => setGlState((prev) => ({ ...prev, spec: +e.target.value }))}
                />
                <span className="vd" id="spec-v">
                  {glState.spec.toFixed(2)}
                </span>
              </label>

              <label>
                Tint
                <input
                  type="range"
                  id="tint"
                  min="0"
                  max="40"
                  value={Math.round(glState.tint * 100)}
                  onChange={(e) => setGlState((prev) => ({ ...prev, tint: +e.target.value / 100 }))}
                />
                <span className="vd" id="tint-v">
                  {Math.round(glState.tint * 100)}%
                </span>
              </label>

              <label>
                Shadow
                <input
                  type="range"
                  id="shadow"
                  min="0"
                  max="1"
                  step="0.05"
                  value={glState.shadow}
                  onChange={(e) => setGlState((prev) => ({ ...prev, shadow: +e.target.value }))}
                />
                <span className="vd" id="shadow-v">
                  {glState.shadow.toFixed(2)}
                </span>
              </label>
            </>
          ) : (
            /* SVG CONTROLS */
            <>
              <h2>Glass Shape</h2>
              <label>
                Width
                <input
                  type="range"
                  id="glass-width"
                  min="200"
                  max="700"
                  value={svgState.gw}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, gw: +e.target.value }))}
                />
                <span className="value-display" id="glass-width-val">
                  {Math.round(svgState.gw)}
                </span>
              </label>

              <label>
                Height
                <input
                  type="range"
                  id="glass-height"
                  min="200"
                  max="800"
                  value={svgState.gh}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, gh: +e.target.value }))}
                />
                <span className="value-display" id="glass-height-val">
                  {Math.round(svgState.gh)}
                </span>
              </label>

              <label>
                Border Radius
                <input
                  type="range"
                  id="border-radius"
                  min="20"
                  max="100"
                  value={svgState.br}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, br: +e.target.value }))}
                />
                <span className="value-display" id="border-radius-val">
                  {Math.round(svgState.br)}
                </span>
              </label>

              <label>
                Shape
                <select
                  id="surface-fn"
                  value={svgState.surfaceFn}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, surfaceFn: e.target.value }))}
                >
                  <option value="convex_squircle">Convex Squircle</option>
                  <option value="lip">Lip</option>
                </select>
              </label>

              <h2>Refraction</h2>
              <label>
                Glass Thickness
                <input
                  type="range"
                  id="glass-thickness"
                  min="10"
                  max="200"
                  value={svgState.glassThickness}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, glassThickness: +e.target.value }))}
                />
                <span className="value-display" id="glass-thickness-val">
                  {Math.round(svgState.glassThickness)}
                </span>
              </label>

              <label>
                Bezel Width
                <input
                  type="range"
                  id="bezel-width"
                  min="2"
                  max="60"
                  value={svgState.bezelWidth}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, bezelWidth: +e.target.value }))}
                />
                <span className="value-display" id="bezel-width-val">
                  {Math.round(svgState.bezelWidth)}
                </span>
              </label>

              <label>
                Refractive Index
                <input
                  type="range"
                  id="refractive-index"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={svgState.refractiveIndex}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, refractiveIndex: +e.target.value }))}
                />
                <span className="value-display" id="refractive-index-val">
                  {svgState.refractiveIndex.toFixed(2)}
                </span>
              </label>

              <label>
                Scale Ratio
                <input
                  type="range"
                  id="scale-ratio"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={svgState.scaleRatio}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, scaleRatio: +e.target.value }))}
                />
                <span className="value-display" id="scale-ratio-val">
                  {svgState.scaleRatio.toFixed(2)}
                </span>
              </label>

              <h2>Appearance</h2>
              <label>
                Blur
                <input
                  type="range"
                  id="blur-amount"
                  min="0"
                  max="8"
                  step="0.1"
                  value={svgState.blurAmount}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, blurAmount: +e.target.value }))}
                />
                <span className="value-display" id="blur-amount-val">
                  {svgState.blurAmount.toFixed(1)}
                </span>
              </label>

              <label>
                Specular Opacity
                <input
                  type="range"
                  id="specular-opacity"
                  min="0"
                  max="1"
                  step="0.05"
                  value={svgState.specularOpacity}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, specularOpacity: +e.target.value }))}
                />
                <span className="value-display" id="specular-opacity-val">
                  {svgState.specularOpacity.toFixed(2)}
                </span>
              </label>

              <label>
                Specular Saturation
                <input
                  type="range"
                  id="specular-saturation"
                  min="0"
                  max="12"
                  step="1"
                  value={svgState.specularSaturation}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, specularSaturation: +e.target.value }))}
                />
                <span className="value-display" id="specular-saturation-val">
                  {Math.round(svgState.specularSaturation)}
                </span>
              </label>

              <h2>Inner Shadow</h2>
              <label>
                Color
                <input
                  type="color"
                  id="shadow-color"
                  value={svgState.shadowColor}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, shadowColor: e.target.value }))}
                />
              </label>

              <label>
                Blur
                <input
                  type="range"
                  id="shadow-blur"
                  min="0"
                  max="40"
                  value={svgState.shadowBlur}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, shadowBlur: +e.target.value }))}
                />
                <span className="value-display" id="shadow-blur-val">
                  {Math.round(svgState.shadowBlur)}
                </span>
              </label>

              <label>
                Spread
                <input
                  type="range"
                  id="shadow-spread"
                  min="-15"
                  max="10"
                  value={svgState.shadowSpread}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, shadowSpread: +e.target.value }))}
                />
                <span className="value-display" id="shadow-spread-val">
                  {Math.round(svgState.shadowSpread)}
                </span>
              </label>

              <h2>Glass Tint</h2>
              <label>
                Tint Color
                <input
                  type="color"
                  id="tint-color"
                  value={svgState.tintColor}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, tintColor: e.target.value }))}
                />
              </label>

              <label>
                Tint Opacity
                <input
                  type="range"
                  id="tint-opacity"
                  min="0"
                  max="40"
                  step="1"
                  value={svgState.tintOpacity}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, tintOpacity: +e.target.value }))}
                />
                <span className="value-display" id="tint-opacity-val">
                  {Math.round(svgState.tintOpacity)}%
                </span>
              </label>

              <h2>Outer Shadow</h2>
              <label>
                Blur
                <input
                  type="range"
                  id="outer-shadow-blur"
                  min="0"
                  max="50"
                  value={svgState.outerShadowBlur}
                  onChange={(e) => setSvgState((prev) => ({ ...prev, outerShadowBlur: +e.target.value }))}
                />
                <span className="value-display" id="outer-shadow-blur-val">
                  {Math.round(svgState.outerShadowBlur)}
                </span>
              </label>
            </>
          )}

          {/* BACKGROUND PICKER (Identical in both modes) */}
          <h2>Liquid Glass Backgrounds</h2>
          <div id="bg-picker">
            <p className="text-[11px] font-semibold text-cyan-300/90 uppercase tracking-wider mb-2">
              WebGL Liquid Glass Showcases (5 Presets)
            </p>
            <div className="bg-thumbs mb-4">
              {SHOWCASE_TEMPLATES.map((tmpl) => (
                <div key={tmpl.id} className="relative group">
                  <img
                    className={`bg-thumb ${currentBg === tmpl.url ? 'active ring-2 ring-cyan-400' : ''}`}
                    src={tmpl.thumb || tmpl.url}
                    alt={tmpl.label}
                    title={`${tmpl.label} (${tmpl.badge})`}
                    draggable={false}
                    onClick={() => setCurrentBg(tmpl.url)}
                  />
                  <span className="block text-[9px] text-center text-slate-300 truncate max-w-[56px] mt-0.5">
                    {tmpl.badge}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Classic Presets
            </p>
            <div className="bg-thumbs">
              {CLASSIC_TEMPLATES.map((tmpl) => (
                <img
                  key={tmpl.id}
                  className={`bg-thumb ${currentBg === tmpl.url ? 'active ring-2 ring-white/60' : ''}`}
                  src={tmpl.thumb || tmpl.url}
                  alt={tmpl.label}
                  title={tmpl.label}
                  draggable={false}
                  onClick={() => setCurrentBg(tmpl.url)}
                />
              ))}

              {customThumbUrl && (
                <span className="bg-thumb-custom visible">
                  <img
                    className={`bg-thumb ${currentBg === customThumbUrl ? 'active' : ''}`}
                    src={customThumbUrl}
                    alt="Custom"
                    title="Custom URL"
                    draggable={false}
                    onClick={() => setCurrentBg(customThumbUrl)}
                  />
                </span>
              )}
            </div>

            <div className="bg-url-row">
              <input
                type="text"
                id="bg-url"
                placeholder="Paste image URL…"
                value={customBgInput}
                onChange={(e) => setCustomBgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyCustomBg(customBgInput);
                }}
              />
              <button
                type="button"
                className="bg-btn"
                onClick={() => applyCustomBg(customBgInput)}
              >
                Load
              </button>
              <button
                type="button"
                className="bg-btn reset"
                onClick={resetBg}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="bottom-bar">
        {mode === 'webgl' ? (
          <>
            <span className="bottom-note">WebGL — works in all browsers</span>
            <button
              className="switch-btn"
              onClick={() => {
                setMode('svg');
              }}
            >
              ← Switch to SVG version
            </button>
          </>
        ) : (
          <>
            <span className="bottom-note">⚠ SVG backdrop-filter is Chrome / Chromium only</span>
            <button
              className="switch-btn"
              onClick={() => {
                setMode('webgl');
              }}
            >
              Switch to WebGL →
            </button>
          </>
        )}

        <button
          className="switch-btn flex items-center gap-1.5 ml-2 border border-purple-400/30 text-purple-200 hover:text-white hover:bg-purple-600/30"
          onClick={() => switchViewMode('studio')}
          title="Open Liquid Glass Studio"
          id="btn-switch-studio-dock"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>Studio Mode</span>
        </button>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
