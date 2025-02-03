"use client";
import { useEffect, useRef } from "react";

function FluidBackground({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0.5, g: 0, b: 0 },
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

    // Initialize WebGL context and set up shaders
    // This is where you would add the WebGL initialization code
    // For now, we'll just set a basic color to show the canvas is working
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let lastSplatTime = Date.now();
    
    function applyAutoForces() {
      const now = Date.now();
      if (now - lastSplatTime > 1000 / COLOR_UPDATE_SPEED) {
        // Generate random position
        const x = Math.random();
        const y = Math.random();
        
        // Generate random direction
        const angle = Math.random() * Math.PI * 2;
        const dx = Math.cos(angle) * SPLAT_FORCE;
        const dy = Math.sin(angle) * SPLAT_FORCE;
        
        // Generate random color
        const color = { 
          r: Math.random(), 
          g: Math.random(), 
          b: Math.random() 
        };
        
        // Here you would call your splat function
        console.log('Splat:', { x, y, dx, dy, color });
      }
    }

    function updateFrame() {
      applyAutoForces();
      requestAnimationFrame(updateFrame);
    }

    // Start the animation loop
    updateFrame();

    // Cleanup
    return () => {
      // Cleanup WebGL resources if needed
    };
  }, [COLOR_UPDATE_SPEED, SPLAT_FORCE]);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
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