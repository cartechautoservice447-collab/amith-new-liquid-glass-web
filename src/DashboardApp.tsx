import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Bell, ChevronRight, CircleUserRound, Folder, Gauge, Home, Layers3, ListChecks, Plus, Settings2, Sparkles, Sun, Zap } from 'lucide-react';
import LegacyGlassStudio from './App';
import { vertexShader, fragmentShader } from './lib/webglGlassShader';
import './DashboardExact.css';

const BACKGROUND = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop';

const actions = [
  { icon: ListChecks, title: 'Overview', description: 'See your workspace at a glance' },
  { icon: Layers3, title: 'Study Hub', description: 'Continue with your study tools' },
  { icon: Sparkles, title: 'Notes', description: 'Open your recent notes' },
];

const courses = [
  { title: 'Liquid Glass Studio', accent: 'Workspace', description: 'Explore the current glass rendering and interaction layer.', status: 'Ready', notes: 12 },
  { title: 'Glass Experiments', accent: 'Collection', description: 'A compact space for your saved glass surfaces and ideas.', status: 'Open', notes: 8 },
  { title: 'Refraction Lab', accent: 'Practice', description: 'Tune blur, bezel, thickness, and visual depth.', status: 'Open', notes: 5 },
  { title: 'Visual Studies', accent: 'Archive', description: 'Keep reference work grouped into one calm surface.', status: 'Open', notes: 3 },
];

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Courses', icon: Folder },
  { label: 'Notes', icon: ListChecks },
  { label: 'Layers', icon: Layers3 },
  { label: 'More', icon: Gauge },
];

function GlassEngineBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const refs = useRef<{ renderer: THREE.WebGLRenderer; material: THREE.ShaderMaterial; raf: number; texture: THREE.Texture | null } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uGlassCenter: { value: new THREE.Vector2(0, 0) },
        uGlassSize: { value: new THREE.Vector2(620, 320) },
        uRadius: { value: 56 },
        uBezel: { value: 58 },
        uThickness: { value: 42 },
        uIOR: { value: 1.7 },
        uBlur: { value: 2.2 },
        uSpecular: { value: 0.42 },
        uTint: { value: 0.045 },
        uShadow: { value: 0.32 },
        uBgTex: { value: null },
        uBgAspect: { value: 1.5 },
      },
      transparent: true,
      depthTest: false,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(BACKGROUND, (texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      material.uniforms.uBgTex.value = texture;
      material.uniforms.uBgAspect.value = texture.image?.width && texture.image?.height ? texture.image.width / texture.image.height : 1.5;
      if (refs.current) refs.current.texture = texture;
    });

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      material.uniforms.uGlassSize.value.set(Math.min(window.innerWidth * 0.62, 700), Math.min(window.innerHeight * 0.36, 360));
    };
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    const render = (now: number) => {
      const t = (now - start) / 1000;
      const x = window.innerWidth * 0.5 + Math.sin(t * 0.18) * Math.min(80, window.innerWidth * 0.05);
      const y = window.innerHeight * 0.34 + Math.cos(t * 0.15) * Math.min(44, window.innerHeight * 0.035);
      material.uniforms.uGlassCenter.value.set(x, y);
      renderer.render(scene, camera);
      refs.current!.raf = requestAnimationFrame(render);
    };

    refs.current = { renderer, material, raf: requestAnimationFrame(render), texture: null };

    return () => {
      cancelAnimationFrame(refs.current?.raf ?? 0);
      window.removeEventListener('resize', resize);
      refs.current?.texture?.dispose();
      material.dispose();
      renderer.dispose();
      refs.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="dashboard-glass-engine" aria-hidden="true" />;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" className="dashboard-icon-button" aria-label={label} onClick={onClick}>{children}</button>;
}

export default function DashboardApp() {
  const [studioOpen, setStudioOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');

  return (
    <div className="dashboard-app">
      <GlassEngineBackdrop />
      <div className="dashboard-background-wash" aria-hidden="true" />

      <main className="dashboard-screen">
        <section className="dashboard-shell">
          <header className="dashboard-header glass-card">
            <div className="dashboard-copy">
              <span className="eyebrow">Liquid Glass Studio</span>
              <h1>Welcome back!</h1>
              <p>Select a course folder to access your workspace</p>
            </div>
            <div className="dashboard-controls">
              <button type="button" className="performance-control glass-inner"><Zap size={15} /><span>Performance</span><ChevronRight size={14} /></button>
              <IconButton label="Theme"><Sun size={18} /></IconButton>
              <IconButton label="Settings" onClick={() => setStudioOpen(true)}><Settings2 size={18} /></IconButton>
              <IconButton label="Account"><CircleUserRound size={18} /></IconButton>
            </div>
          </header>

          <section className="quick-section">
            <div className="micro-heading">STUDY TOOLS</div>
            <div className="quick-actions">
              {actions.map(({ icon: Icon, title, description }) => (
                <button key={title} type="button" className="action-card glass-card" onClick={() => title === 'Overview' ? setActiveNav('Home') : undefined}>
                  <span className="action-icon glass-inner"><Icon size={20} /></span>
                  <span><strong>{title}</strong><small>{description}</small></span>
                  <span className="action-arrow"><ChevronRight size={18} /></span>
                </button>
              ))}
            </div>
          </section>

          <section className="courses-section">
            <div className="section-heading">
              <div>
                <div className="micro-heading">YOUR COURSES</div>
                <h2>Course Folders</h2>
              </div>
              <button type="button" className="view-all-button glass-inner">View All <ChevronRight size={15} /></button>
              <span className="note-total">28 total notes</span>
            </div>

            <button type="button" className="add-course-trigger glass-card" onClick={() => setStudioOpen(true)}>
              <span className="add-course-symbol glass-inner"><Plus size={17} /></span>
              <strong>Add New Course</strong>
              <ChevronRight size={17} />
            </button>

            <div className="course-grid">
              {courses.map((course, index) => (
                <article key={course.title} className={`course-dashboard-card glass-card ${index === 0 ? 'course-primary' : ''}`}>
                  <div className="course-open">
                    <div className="course-top">
                      <span className="folder-icon glass-inner"><Folder size={18} /></span>
                      <span className="note-pill glass-inner"><ListChecks size={12} /> {course.notes} notes</span>
                    </div>
                    <div className="course-copy">
                      <span className="course-color">{course.accent}</span>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                    </div>
                    <div className="course-footer">
                      <span>{course.status}</span>
                      <span>Open <ChevronRight size={13} /></span>
                    </div>
                  </div>
                  <button type="button" className="delete-course glass-inner" aria-label={`Delete ${course.title}`}>×</button>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>

      <nav className="dashboard-bottom-nav glass-card" aria-label="Dashboard navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} type="button" className={`dashboard-nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {studioOpen && (
        <div className="studio-overlay">
          <button type="button" className="studio-overlay-close" onClick={() => setStudioOpen(false)} aria-label="Close Liquid Glass Studio">Close</button>
          <div className="studio-overlay-app"><LegacyGlassStudio /></div>
        </div>
      )}

      <button type="button" className="dashboard-notification" aria-label="Notifications"><Bell size={18} /></button>
    </div>
  );
}
