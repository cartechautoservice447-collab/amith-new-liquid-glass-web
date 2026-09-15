export interface BgTemplate {
  id: string;
  label: string;
  category: 'showcase' | 'white' | 'dark' | 'classic';
  badge?: string;
  description?: string;
  thumb: string;
  url: string;
}

export const SHOWCASE_TEMPLATES: BgTemplate[] = [
  {
    id: 'prismatic',
    label: 'Prismatic Spectrum',
    category: 'showcase',
    badge: 'Dispersion',
    description: 'Vibrant chromatic spectrum specifically engineered to showcase Snell’s Law RGB dispersion splitting.',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'geometric',
    label: 'Geometric Optics',
    category: 'showcase',
    badge: 'Refraction',
    description: 'High-contrast abstract curves and grids demonstrating surface curvature lensing and bezel distortion.',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'cyber-fluid',
    label: 'Cyber Neon Fluid',
    category: 'showcase',
    badge: 'Specular & Blur',
    description: 'Luminous fluid waves demonstrating dynamic Blinn-Phong specular glints and Poisson disk depth blur.',
    thumb: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=200&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'studio-white',
    label: 'Studio Minimal White',
    category: 'white',
    badge: 'White Showcase',
    description: 'Clean architectural white space showcasing physical drop shadows, edge bevel highlights, and clear caustics on pure white.',
    thumb: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=200&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'obsidian-dark',
    label: 'Obsidian Void Dark',
    category: 'dark',
    badge: 'Dark Showcase',
    description: 'Deep midnight obsidian showcasing specular highlights, inner rim glow, and glass reflections against pure dark/black.',
    thumb: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=200&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2000&auto=format&fit=crop',
  },
];

export const CLASSIC_TEMPLATES: BgTemplate[] = [
  {
    id: 'interior',
    label: 'Interior',
    category: 'classic',
    thumb: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=200&auto=format&fit=crop',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'living-room',
    label: 'Living Room',
    category: 'classic',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpqTFc884FyMsQhl9lwUt32PFm3dZece4gVanjFehViV9s7KCfEK0e8_SaZf3aknQlPSB62rfFykmn7hJHsN063jFhhSEoTxgYjK4SrD0NVKLq6csnTGphx6-PlqBQJbs--1FlhR_cxo-930lt1zpmbxgzpn8GInD3twDZKIOHDxnAlpQ83VPkgmV1ARPuJL7dpgdhAjV-WarCfim6xKBGZOwZU2w9iHkz7C7mi9lTN2SX4ka3OEjgUA',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpqTFc884FyMsQhl9lwUt32PFm3dZece4gVanjFehViV9s7KCfEK0e8_SaZf3aknQlPSB62rfFykmn7hJHsN063jFhhSEoTxgYjK4SrD0NVKLq6csnTGphx6-PlqBQJbs--1FlhR_cxo-930lt1zpmbxgzpn8GInD3twDZKIOHDxnAlpQ83VPkgmV1ARPuJL7dpgdhAjV-WarCfim6xKBGZOwZU2w9iHkz7C7mi9lTN2SX4ka3OEjgUA',
  },
  {
    id: 'img1',
    label: '1',
    category: 'classic',
    thumb: 'https://liquid-glass-eta.vercel.app/backgrounds/image1.jpg',
    url: 'https://liquid-glass-eta.vercel.app/backgrounds/image1.jpg',
  },
  {
    id: 'img2',
    label: '2',
    category: 'classic',
    thumb: 'https://liquid-glass-eta.vercel.app/backgrounds/image2.jpg',
    url: 'https://liquid-glass-eta.vercel.app/backgrounds/image2.jpg',
  },
  {
    id: 'img3',
    label: '3',
    category: 'classic',
    thumb: 'https://liquid-glass-eta.vercel.app/backgrounds/image3.jpg',
    url: 'https://liquid-glass-eta.vercel.app/backgrounds/image3.jpg',
  },
  {
    id: 'img4',
    label: '4',
    category: 'classic',
    thumb: 'https://liquid-glass-eta.vercel.app/backgrounds/image4.jpg',
    url: 'https://liquid-glass-eta.vercel.app/backgrounds/image4.jpg',
  },
];

export const ALL_TEMPLATES: BgTemplate[] = [
  ...SHOWCASE_TEMPLATES,
  ...CLASSIC_TEMPLATES,
];

export const DEFAULT_BG = SHOWCASE_TEMPLATES[0].url;
