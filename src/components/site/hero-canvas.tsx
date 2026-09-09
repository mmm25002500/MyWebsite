'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

/**
 * 首頁背景的印刷網點粒子。
 *
 * 規格 §2 把 3D 背景列為選配；這裡以 2D canvas 實作，視覺與設計稿一致，
 * 但不必為了首頁載入 Three.js（首頁 JS 預算 < 180KB，見 §4.3）。
 * `prefers-reduced-motion` 時只畫一張靜態圖，不啟動動畫迴圈。
 */
export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const styles = getComputedStyle(document.documentElement);
    const inks = [
      styles.getPropertyValue('--color-accent').trim() || '#0088b0',
      styles.getPropertyValue('--color-accent-2').trim() || '#d6006c',
      styles.getPropertyValue('--color-text').trim() || '#201e1d',
    ];

    let particles: Particle[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // 密度隨面積調整，手機不會過載。
      const count = Math.min(140, Math.floor((width * height) / 9000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        size: Math.random() * 3 + 1.2,
        color: inks[Math.floor(Math.random() * inks.length)] ?? inks[0]!,
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        context.fillStyle = particle.color;
        context.globalAlpha = 0.55;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      context.globalAlpha = 1;
    };

    const step = () => {
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    resize();
    if (reduceMotion) {
      draw();
    } else {
      frame = requestAnimationFrame(step);
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw();
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full opacity-50"
    />
  );
}
