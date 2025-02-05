"use client";
import { useEffect, useRef } from "react";

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Set canvas size to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize WebGL context with dark background
    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let lastSplatTime = Date.now();
    const COLOR_UPDATE_SPEED = 10;
    const SPLAT_FORCE = 8000;
    
    function applyAutoForces() {
      const now = Date.now();
      if (now - lastSplatTime > 1000 / COLOR_UPDATE_SPEED) {
        const x = Math.random();
        const y = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const dx = Math.cos(angle) * SPLAT_FORCE;
        const dy = Math.sin(angle) * SPLAT_FORCE;
        const color = { 
          r: Math.random() * 0.3,
          g: Math.random() * 0.3,
          b: Math.random() * 0.3 
        };
        lastSplatTime = now;
        console.log('Splat:', { x, y, dx, dy, color });
      }
    }

    function updateFrame() {
      applyAutoForces();
      requestAnimationFrame(updateFrame);
    }

    updateFrame();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: -1 }}>
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto'
        }}
      />
    </div>
  );
}