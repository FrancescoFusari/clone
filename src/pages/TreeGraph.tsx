
import { useEffect } from "react";
import * as THREE from 'three';
import { Card, CardContent } from "@/components/ui/card";

const TreeGraph = () => {
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
      sphere.rotation.x += 0.01;
      sphere.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
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
