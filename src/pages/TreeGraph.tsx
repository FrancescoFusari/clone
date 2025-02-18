
import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { Card, CardContent } from "@/components/ui/card";

const TreeGraph = () => {
  const mousePosition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Hide TopBar when this component mounts
  useEffect(() => {
    const topBar = document.querySelector('.topbar-container');
    if (topBar) {
      topBar.classList.add('hidden');
    }

    // Show TopBar again when component unmounts
    return () => {
      const topBar = document.querySelector('.topbar-container');
      if (topBar) {
        topBar.classList.remove('hidden');
      }
    };
  }, []);

  useEffect(() => {
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Add renderer to DOM
    const container = document.getElementById('tree-graph-container');
    if (container) {
      container.appendChild(renderer.domElement);
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add a sample tree node (sphere)
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Camera control variables
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    const damping = 0.95; // Smoothing factor
    const rotationSpeed = 0.002;
    const touchSensitivity = 0.005;
    const minDistance = 2;
    const maxDistance = 10;

    // Mouse and touch event handlers
    const handlePointerDown = (event: PointerEvent) => {
      isDragging.current = true;
      mousePosition.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - mousePosition.current.x;
      const deltaY = event.clientY - mousePosition.current.y;

      if (event.pointerType === 'touch') {
        targetRotationX += deltaY * touchSensitivity;
        targetRotationY += deltaX * touchSensitivity;
      } else {
        targetRotationX += deltaY * rotationSpeed;
        targetRotationY += deltaX * rotationSpeed;
      }

      mousePosition.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      
      // Determine if the wheel event is from a touchpad
      const isTouchpad = Math.abs(event.deltaX) !== 0 || Math.abs(event.deltaY) < 50;
      const zoomSpeed = isTouchpad ? 0.01 : 0.001;
      
      camera.position.z = Math.max(
        minDistance,
        Math.min(maxDistance, camera.position.z + (event.deltaY * zoomSpeed))
      );
    };

    // Add event listeners
    container?.addEventListener('pointerdown', handlePointerDown);
    container?.addEventListener('pointermove', handlePointerMove);
    container?.addEventListener('pointerup', handlePointerUp);
    container?.addEventListener('pointerleave', handlePointerUp);
    container?.addEventListener('wheel', handleWheel, { passive: false });

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth camera rotation
      currentRotationX += (targetRotationX - currentRotationX) * damping;
      currentRotationY += (targetRotationY - currentRotationY) * damping;

      // Apply rotations
      camera.position.y = 5 * Math.sin(currentRotationX);
      camera.position.x = 5 * Math.sin(currentRotationY);
      camera.position.z = 5 * Math.cos(currentRotationY);
      camera.lookAt(scene.position);

      // Rotate sphere
      sphere.rotation.x += 0.005;
      sphere.rotation.y += 0.005;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container?.removeEventListener('pointerdown', handlePointerDown);
      container?.removeEventListener('pointermove', handlePointerMove);
      container?.removeEventListener('pointerup', handlePointerUp);
      container?.removeEventListener('pointerleave', handlePointerUp);
      container?.removeEventListener('wheel', handleWheel);
      
      if (container) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <div id="tree-graph-container" className="w-full h-full" />
    </div>
  );
};

export default TreeGraph;
