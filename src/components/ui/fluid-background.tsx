"use client";
import { useEffect, useRef } from "react";

function FluidBackground({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 2048, // Increased from 1440 for larger effect
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 1.5, // Reduced from 3.5 to make the trail persist longer
  VELOCITY_DISSIPATION = 1.2, // Reduced from 2 for longer trails
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.35, // Increased from 0.2 for larger splats
  SPLAT_FORCE = 8000, // Increased from 6000 for more pronounced effect
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0.05, g: 0.05, b: 0.05 },
  TRANSPARENT = true,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Initialize WebGL context with dark background
    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let lastSplatTime = Date.now();
    
    function applyAutoForces() {
      const now = Date.now();
      if (now - lastSplatTime > 1000 / COLOR_UPDATE_SPEED) {
        const x = Math.random();
        const y = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const dx = Math.cos(angle) * SPLAT_FORCE;
        const dy = Math.sin(angle) * SPLAT_FORCE;
        const color = { 
          r: Math.random() * 0.3, // Darker colors
          g: Math.random() * 0.3,
          b: Math.random() * 0.3 
        };
        console.log('Splat:', { x, y, dx, dy, color });
      }
    }

    function updateFrame() {
      applyAutoForces();
      requestAnimationFrame(updateFrame);
    }

    updateFrame();

    return () => {
      // Cleanup WebGL resources if needed
    };
  }, [COLOR_UPDATE_SPEED, SPLAT_FORCE]);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-background">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}

export { FluidBackground };