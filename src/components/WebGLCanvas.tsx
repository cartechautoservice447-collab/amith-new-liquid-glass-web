import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GlassSettings } from '../types';
import { vertexShaderSource, fragmentShaderSource } from '../shaders/liquidGlassShader';

interface WebGLCanvasProps {
  settings: GlassSettings;
  backgroundUrl: string;
  glassPos: { x: number; y: number };
  velocity: { x: number; y: number };
  isDragging: boolean;
  onGlassPointerDown: (e: React.PointerEvent) => void;
  onClickRipple: (pos: { x: number; y: number }) => void;
}

export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({
  settings,
  backgroundUrl,
  glassPos,
  velocity,
  isDragging,
  onGlassPointerDown,
  onClickRipple,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());
  const [imageLoaded, setImageLoaded] = useState(false);

  // Mouse / light position
  const mousePosRef = useRef<{ x: number; y: number }>({ x: window.innerWidth * 0.35, y: window.innerHeight * 0.25 });

  // Ripple state
  const rippleRef = useRef<{ active: boolean; x: number; y: number; startTime: number }>({
    active: false,
    x: 0,
    y: 0,
    startTime: 0,
  });

  // Keep latest props in refs for animation loop
  const propsRef = useRef({
    settings,
    glassPos,
    velocity,
    isDragging,
  });
  propsRef.current = { settings, glassPos, velocity, isDragging };

  // Track pointer movement for dynamic specular light
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (propsRef.current.settings.lightFollowsMouse) {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Trigger ripple from parent or click
  const triggerRipple = useCallback((screenX: number, screenY: number) => {
    const relX = screenX - propsRef.current.glassPos.x;
    const relY = screenY - propsRef.current.glassPos.y;
    rippleRef.current = {
      active: true,
      x: relX,
      y: relY,
      startTime: performance.now(),
    };
    onClickRipple({ x: relX, y: relY });
  }, [onClickRipple]);

  // Handle pointer down on the canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const { x: gx, y: gy } = propsRef.current.glassPos;
    const { width: gw, height: gh, radius: gr } = propsRef.current.settings;

    const halfW = gw / 2;
    const halfH = gh / 2;
    const dx = Math.abs(clientX - gx);
    const dy = Math.abs(clientY - gy);

    // Rounded rectangle hit test
    let isInside = false;
    if (dx <= halfW && dy <= halfH) {
      if (dx > halfW - gr && dy > halfH - gr) {
        const cornerDist = Math.hypot(dx - (halfW - gr), dy - (halfH - gr));
        isInside = cornerDist <= gr;
      } else {
        isInside = true;
      }
    }

    if (isInside) {
      if (propsRef.current.settings.rippleOnClick) {
        triggerRipple(clientX, clientY);
      }
      onGlassPointerDown(e);
    }
  };

  // Compile shaders & setup WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      console.warn('WebGL2 not available on this browser/environment.');
      return;
    }
    glRef.current = gl;

    // Helper to compile shader
    function compileShader(type: number, source: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    // Setup full-screen quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPositionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    return () => {
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
    };
  }, []);

  // Load and update background texture
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    setImageLoaded(false);

    // Create or bind texture
    let texture = textureRef.current;
    if (!texture) {
      texture = gl.createTexture();
      textureRef.current = texture;
    }

    // Set temporary 1x1 placeholder texture while loading
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([45, 42, 38, 255])
    );

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (!gl || !textureRef.current) return;
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.warn('Failed to load image texture, rendering fallback pattern');
      // Create a warm aesthetic living room gradient canvas
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 1920;
      fallbackCanvas.height = 1080;
      const ctx = fallbackCanvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
        grad.addColorStop(0, '#c7b299');
        grad.addColorStop(0.5, '#e4d5c3');
        grad.addColorStop(1, '#8b7355');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1920, 1080);

        // Draw window and furniture silhouettes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(80, 80, 700, 920);
        ctx.fillStyle = '#3a342e';
        ctx.fillRect(900, 500, 800, 350);

        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fallbackCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        setImageLoaded(true);
      }
    };

    img.src = backgroundUrl;
  }, [backgroundUrl]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = (now: number) => {
      const gl = glRef.current;
      const program = programRef.current;
      if (!gl || !program) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      // Handle canvas resize
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.floor(window.innerWidth * dpr);
      const displayHeight = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }

      gl.useProgram(program);

      const time = (now - startTimeRef.current) * 0.001;
      const { settings, glassPos, velocity } = propsRef.current;

      // Uniform locations
      const uRes = gl.getUniformLocation(program, 'u_resolution');
      const uGlassCenter = gl.getUniformLocation(program, 'u_glassCenter');
      const uGlassSize = gl.getUniformLocation(program, 'u_glassSize');
      const uRadius = gl.getUniformLocation(program, 'u_radius');
      const uThickness = gl.getUniformLocation(program, 'u_thickness');
      const uBezel = gl.getUniformLocation(program, 'u_bezel');
      const uIor = gl.getUniformLocation(program, 'u_ior');
      const uDispersion = gl.getUniformLocation(program, 'u_dispersion');
      const uBlur = gl.getUniformLocation(program, 'u_blur');
      const uSpecular = gl.getUniformLocation(program, 'u_specular');
      const uTint = gl.getUniformLocation(program, 'u_tint');
      const uShadow = gl.getUniformLocation(program, 'u_shadow');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uLightPos = gl.getUniformLocation(program, 'u_lightPos');
      const uVelocity = gl.getUniformLocation(program, 'u_velocity');
      const uWobble = gl.getUniformLocation(program, 'u_wobble');
      const uRipplePos = gl.getUniformLocation(program, 'u_ripplePos');
      const uRippleTime = gl.getUniformLocation(program, 'u_rippleTime');
      const uRippleActive = gl.getUniformLocation(program, 'u_rippleActive');

      // Bind uniforms
      gl.uniform2f(uRes, window.innerWidth, window.innerHeight);
      gl.uniform2f(uGlassCenter, glassPos.x, glassPos.y);
      gl.uniform2f(uGlassSize, settings.width, settings.height);
      gl.uniform1f(uRadius, settings.radius);
      gl.uniform1f(uThickness, settings.thickness);
      gl.uniform1f(uBezel, settings.bezel);
      gl.uniform1f(uIor, settings.ior);
      gl.uniform1f(uDispersion, settings.dispersion);
      gl.uniform1f(uBlur, settings.blur);
      gl.uniform1f(uSpecular, settings.specular);
      gl.uniform1f(uTint, settings.tint / 100);
      gl.uniform1f(uShadow, settings.shadow);
      gl.uniform1f(uTime, time);

      // Light position
      const light = settings.lightFollowsMouse
        ? mousePosRef.current
        : { x: window.innerWidth * 0.35, y: window.innerHeight * 0.25 };
      gl.uniform2f(uLightPos, light.x, light.y);

      // Fluid deformation velocity
      gl.uniform2f(uVelocity, velocity.x, velocity.y);
      gl.uniform1f(uWobble, settings.wobbleIntensity);

      // Ripple state
      const ripple = rippleRef.current;
      if (ripple.active) {
        const rippleTime = (now - ripple.startTime) * 0.001;
        if (rippleTime > 2.5) {
          ripple.active = false;
        }
        gl.uniform1f(uRippleActive, 1.0);
        gl.uniform2f(uRipplePos, ripple.x, ripple.y);
        gl.uniform1f(uRippleTime, rippleTime);
      } else {
        gl.uniform1f(uRippleActive, 0.0);
        gl.uniform2f(uRipplePos, 0.0, 0.0);
        gl.uniform1f(uRippleTime, 0.0);
      }

      // Texture unit 0
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      const uBg = gl.getUniformLocation(program, 'u_background');
      gl.uniform1i(uBg, 0);

      // Draw full screen quad
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        id="webgl-canvas"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className={`w-full h-full block cursor-grab active:cursor-grabbing transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-80'
        }`}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
