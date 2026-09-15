import React, { useRef, useState } from 'react';
import { GlassSettings } from '../types';

interface SVGFilterGlassProps {
  settings: GlassSettings;
  backgroundUrl: string;
  glassPos: { x: number; y: number };
  velocity: { x: number; y: number };
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClickRipple: (pos: { x: number; y: number }) => void;
}

export const SVGFilterGlass: React.FC<SVGFilterGlassProps> = ({
  settings,
  backgroundUrl,
  glassPos,
  velocity,
  isDragging,
  onPointerDown,
  onClickRipple,
}) => {
  const [rippling, setRippling] = useState(false);
  const rippleCoords = useRef({ x: 0, y: 0 });

  // Compute deformation scale from velocity (jelly squish)
  const speed = Math.hypot(velocity.x, velocity.y);
  const stretch = Math.min(speed * 0.008, 0.25) * settings.wobbleIntensity;
  const angle = Math.atan2(velocity.y, velocity.x);

  const left = glassPos.x - settings.width / 2;
  const top = glassPos.y - settings.height / 2;

  const bezelSize = Math.max(12, settings.bezel * 0.4);
  const shadowAlpha1 = (settings.shadow * 0.9).toFixed(2);
  const shadowAlpha2 = (settings.shadow * 0.5).toFixed(2);
  const tintAlpha = (settings.tint / 100) * 0.35;

  const handleGlassClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rippleCoords.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    if (settings.rippleOnClick) {
      setRippling(true);
      onClickRipple({ x: e.clientX, y: e.clientY });
      setTimeout(() => setRippling(false), 900);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <img
          id="bg-image-svg-mode"
          src={backgroundUrl}
          alt="Room Interior"
          className="w-full h-full object-cover select-none"
        />
      </div>

      {/* SVG Filters Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-displacement-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={settings.thickness * 0.45 * (settings.ior / 2.5)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Interactive Liquid Glass Lens */}
      <div
        id="liquid-glass-svg"
        role="region"
        aria-label="Liquid Glass Interactive Lens"
        onPointerDown={onPointerDown}
        onClick={handleGlassClick}
        style={{
          width: `${settings.width}px`,
          height: `${settings.height}px`,
          borderRadius: `${settings.radius}px`,
          transform: `translate3d(${left}px, ${top}px, 0px) rotate(${angle * 0.15}rad) scale(${
            1 + stretch
          }, ${1 - stretch * 0.6})`,
          backdropFilter: `blur(${settings.blur}px) contrast(112%) saturate(118%)`,
          WebkitBackdropFilter: `blur(${settings.blur}px) contrast(112%) saturate(118%)`,
          background: `radial-gradient(ellipse at 35% 25%, rgba(255, 255, 255, ${
            0.18 + settings.specular * 0.2
          }) 0%, rgba(255, 255, 255, ${tintAlpha}) 45%, rgba(240, 240, 240, 0.02) 100%)`,
          boxShadow: `
            inset 0 0 0 1.5px rgba(255, 255, 255, ${settings.specular * 0.9}),
            inset 0 ${bezelSize * 0.45}px ${bezelSize}px 0 rgba(255, 255, 255, ${
            settings.specular * 0.65
          }),
            inset 0 -${bezelSize * 0.4}px ${bezelSize}px 0 rgba(0, 0, 0, ${
            Number(shadowAlpha1) * 0.8
          }),
            inset ${bezelSize * 0.3}px 0 ${bezelSize * 0.6}px 0 rgba(255, 255, 255, 0.25),
            inset -${bezelSize * 0.3}px 0 ${bezelSize * 0.6}px 0 rgba(0, 0, 0, 0.3),
            0 28px 56px -10px rgba(0, 0, 0, ${shadowAlpha1}),
            0 12px 24px -5px rgba(0, 0, 0, ${shadowAlpha2})
          `,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease, border-radius 0.1s ease',
        }}
        className="absolute z-20 overflow-hidden"
      >
        {/* Chromatic Aberration Bevel Ring */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            padding: '1.5px',
            background: `linear-gradient(135deg, rgba(255, 120, 120, ${
              settings.dispersion * 0.25
            }) 0%, rgba(255, 255, 255, ${settings.specular * 0.8}) 25%, rgba(130, 200, 255, ${
              settings.dispersion * 0.28
            }) 50%, rgba(255, 255, 255, 0.2) 80%, rgba(255, 160, 255, ${
              settings.dispersion * 0.25
            }) 100%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Gloss Specular Highlight Arch */}
        <div
          className="absolute top-1 left-2 right-2 h-[42%] rounded-[inherit] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255, 255, 255, ${
              settings.specular * 0.45
            }) 0%, rgba(255, 255, 255, 0.0) 100%)`,
          }}
        />

        {/* Dynamic Ripple Wave */}
        {rippling && (
          <div
            className="absolute rounded-full pointer-events-none animate-ping"
            style={{
              left: `${rippleCoords.current.x - 30}px`,
              top: `${rippleCoords.current.y - 30}px`,
              width: '60px',
              height: '60px',
              border: '2px solid rgba(255, 255, 255, 0.7)',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)',
            }}
          />
        )}
      </div>
    </div>
  );
};
