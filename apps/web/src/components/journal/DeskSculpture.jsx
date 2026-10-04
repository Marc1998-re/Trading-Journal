import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeskSculpture({ capture = false, appearance = 'dark' }) {
  const host = useRef(null);
  const controller = useRef(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let destroy = () => {};
    setPaused(motion.matches);

    async function mount() {
      const THREE = await import('three');
      const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
      if (disposed) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      element.appendChild(renderer.domElement);
      const tokens = getComputedStyle(element);
      const color = name => new THREE.Color(`hsl(${tokens.getPropertyValue(name).trim().replaceAll(' ', ', ')})`);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
      const sculpture = new THREE.Group();
      scene.add(sculpture);

      const geometries = [];
      const materials = [];
      const keepGeometry = geometry => { geometries.push(geometry); return geometry; };
      const keepMaterial = material => { materials.push(material); return material; };
      const box = keepGeometry(new THREE.BoxGeometry(1, 1, 1));
      const daylight = appearance === 'light';
      const silver = keepMaterial(new THREE.MeshPhysicalMaterial({ color: color(daylight ? '--destructive' : '--foreground'), metalness: 0.5, roughness: 0.24, clearcoat: 0.5 }));
      const cyan = keepMaterial(new THREE.MeshPhysicalMaterial({ color: color('--primary'), emissive: color('--primary'), emissiveIntensity: daylight ? 0.05 : 0.22, metalness: 0.4, roughness: 0.2, clearcoat: 0.8 }));
      const volumeMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: color('--primary'), transparent: true, opacity: daylight ? 0.42 : 0.22, metalness: 0.4, roughness: 0.45 }));
      const beam = (x, y, z, w, h, d, material) => {
        const mesh = new THREE.Mesh(box, material);
        mesh.scale.set(w, h, d); mesh.position.set(x, y, z); sculpture.add(mesh);
      };
      // A fixed market study, never live prices or a user's performance data.
      const closes = Array.from({ length: 52 }, (_, i) => -0.9 + i * 0.052 + Math.sin(i * 0.48) * 0.38 + Math.sin(i * 1.71) * 0.15);
      closes.forEach((close, i) => {
        const open = i ? closes[i - 1] : close - 0.12;
        const high = Math.max(open, close) + 0.1 + (i % 4) * 0.035;
        const low = Math.min(open, close) - 0.1 - (i % 3) * 0.03;
        const x = (i - 25.5) * 0.17;
        const material = close >= open ? cyan : silver;
        beam(x, (open + close) / 2, 0, 0.1, Math.max(Math.abs(close - open), 0.035), 0.2, material);
        beam(x, (high + low) / 2, 0, 0.012, high - low, 0.028, material);
        const volume = 0.12 + Math.abs(close - open) * 1.2 + (i % 5) * 0.04;
        beam(x, -1.7 + volume / 2, 0, 0.105, volume, 0.3, volumeMaterial);
      });
      for (const windowSize of [6, 14]) {
        const points = closes.map((_, i) => {
          const slice = closes.slice(Math.max(0, i - windowSize + 1), i + 1);
          return new THREE.Vector3((i - 25.5) * 0.17, slice.reduce((sum, value) => sum + value, 0) / slice.length - 0.18, windowSize === 6 ? 0.15 : -0.3);
        });
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = keepGeometry(new THREE.TubeGeometry(curve, 180, windowSize === 6 ? 0.009 : 0.005, 5, false));
        sculpture.add(new THREE.Mesh(geometry, keepMaterial(new THREE.MeshBasicMaterial({ color: color('--primary'), transparent: true, opacity: windowSize === 6 ? 0.8 : 0.35 }))));
      }
      const center = new THREE.Box3().setFromObject(sculpture).getCenter(new THREE.Vector3());
      sculpture.children.forEach(child => child.position.sub(center));
      const key = new THREE.DirectionalLight(color(daylight ? '--card' : '--foreground'), 2);
      key.position.set(-4, 8, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(color('--primary'), 2);
      rim.position.set(5, 2, -5);
      scene.add(rim);

      let frame = 0;
      let enabled = !motion.matches && !capture;
      let visible = true;
      let elapsed = 0;
      let previous = 0;
      let mobile = false;
      const render = timestamp => {
        if (disposed) return;
        if (enabled && visible && !document.hidden) {
          if (previous) elapsed += Math.min((timestamp - previous) / 1000, 0.04);
          previous = timestamp;
        } else previous = 0;
        sculpture.rotation.y = -0.08 + elapsed * Math.PI / 24;
        renderer.render(scene, camera);
      };
      const tick = time => {
        render(time);
        frame = enabled && visible && !document.hidden ? requestAnimationFrame(tick) : 0;
      };
      const resume = () => {
        cancelAnimationFrame(frame);
        previous = 0;
        tick(performance.now());
      };
      const resize = () => {
        const { width, height } = element.getBoundingClientRect();
        if (!width || !height) return;
        mobile = width < 700;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.position.set(mobile ? 5 : 4.3, mobile ? 3.0 : 2.5, mobile ? 16.5 : 14);
        if (!mobile) camera.position.multiplyScalar(Math.max(1, 1.55 / camera.aspect));
        camera.lookAt(0, 0.35, 0);
        camera.updateProjectionMatrix();
        const scale = daylight ? (mobile ? (height < 210 ? 1.06 : 1.18) : 1.38) : (mobile ? 0.94 : 1.1);
        sculpture.scale.setScalar(scale);
        render(performance.now());
      };
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
      intersection.observe(element);
      const preference = event => { enabled = !event.matches && !capture; setPaused(event.matches); resume(); };
      const contextLost = event => { event.preventDefault(); setReady(false); enabled = false; cancelAnimationFrame(frame); };
      const contextRestored = () => { setReady(true); enabled = !motion.matches && !capture; setPaused(motion.matches); resume(); };
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
      motion.addEventListener('change', preference);
      document.addEventListener('visibilitychange', resume);
      controller.current = value => { enabled = !value; resume(); };
      resize();
      resume();
      setReady(true);
      destroy = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        intersection.disconnect();
        motion.removeEventListener('change', preference);
        document.removeEventListener('visibilitychange', resume);
        renderer.domElement.removeEventListener('webglcontextlost', contextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
        environment.dispose(); renderer.dispose(); renderer.domElement.remove();
        controller.current = null;
      };
    }
    mount().catch(() => setReady(false));
    return () => { disposed = true; destroy(); };
  }, [capture, appearance]);

  return <>
    <div ref={host} className={`desk-sculpture ${ready ? 'is-ready' : ''}`} style={capture?{inset:0,height:'100%'}:undefined} data-scene-ready={ready}>
      {!capture&&<picture className="sculpture-fallback"><source media="(max-width: 699px)" srcSet={appearance === 'light' ? '/assets/market-study-light-mobile.webp' : '/assets/market-study-mobile.webp'}/><img src={appearance === 'light' ? '/assets/market-study-light.webp' : '/assets/market-study.webp'} alt="" width="1440" height="820"/></picture>}
    </div>
    {ready && !capture && <Button className="scene-toggle" variant="ghost" size="icon" aria-label={paused ? 'Animation abspielen' : 'Animation pausieren'} title={paused ? 'Animation abspielen' : 'Animation pausieren'} aria-pressed={paused} onClick={() => { controller.current?.(!paused); setPaused(!paused); }}>{paused ? <Play/> : <Pause/>}</Button>}
  </>;
}
