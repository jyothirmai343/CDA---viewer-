
import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('obj');
  const [message, setMessage] = useState('');
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);

  // Setup the 3D scene
  useEffect(() => {
    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }
    rendererRef.current = renderer;

    // Store a reference to the current mount node for cleanup
    const currentMount = mountRef.current;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add another directional light from a different angle for better lighting
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Add axis helper
    const axisHelper = new THREE.AxesHelper(5);
    scene.add(axisHelper);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle file upload
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      
      const fileName = uploadedFile.name.toLowerCase();
      if (fileName.endsWith('.stl')) {
        setFileType('stl');
      } else if (fileName.endsWith('.obj')) {
        setFileType('obj');
      } else {
        setMessage('Unsupported file format. Please upload STL or OBJ files.');
        setFile(null);
      }
    }
  };

  // Handle file upload to server
  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    setLoading(true);
    setMessage('Uploading file...');

    // Load the model directly from the uploaded file first
    loadModelFromFile(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      await response.json();
      setMessage('File uploaded and displayed successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`File displayed locally. Server upload error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load model from file directly (client-side rendering)
  const loadModelFromFile = (file) => {
    // Clear previous model
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target.result;
      
      try {
        if (fileType === 'stl') {
          const loader = new STLLoader();
          const geometry = loader.parse(result);
          
          // Create a material with more visible properties
          const material = new THREE.MeshPhongMaterial({ 
            color: 0x7a9ebc, 
            specular: 0x333333, 
            shininess: 30,
            flatShading: true
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          
          // Center the model
          geometry.computeBoundingBox();
          const center = new THREE.Vector3();
          geometry.boundingBox.getCenter(center);
          mesh.position.sub(center);
          
          // Add the mesh to the scene
          if (sceneRef.current) {
            sceneRef.current.add(mesh);
            modelRef.current = mesh;
            
            // Adjust camera to fit model
            fitCameraToObject(mesh);
          }
          
          console.log('STL model loaded successfully');
        } else if (fileType === 'obj') {
          const loader = new OBJLoader();
          const object = loader.parse(result);
          
          // Apply better material to all meshes in the OBJ
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = new THREE.MeshPhongMaterial({ 
                color: 0x7a9ebc, 
                specular: 0x333333, 
                shininess: 30,
                flatShading: true
              });
            }
          });
          
          // Center the model
          const box = new THREE.Box3().setFromObject(object);
          const center = new THREE.Vector3();
          box.getCenter(center);
          object.position.sub(center);
          
          // Add the object to the scene
          if (sceneRef.current) {
            sceneRef.current.add(object);
            modelRef.current = object;
            
            // Adjust camera to fit model
            fitCameraToObject(object);
          }
          
          console.log('OBJ model loaded successfully');
        }
        
        setMessage('Model loaded successfully!');
      } catch (error) {
        console.error('Error loading model:', error);
        setMessage(`Error loading model: ${error.message}`);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setMessage('Error reading file');
    };
    
    console.log('Loading file type:', fileType);
    if (fileType === 'stl') {
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'obj') {
      reader.readAsText(file);
    }
  };

  // Fit camera to the loaded model
  const fitCameraToObject = (object) => {
    if (!object || !cameraRef.current || !controlsRef.current) return;
    
    // Create a bounding box
    const boundingBox = new THREE.Box3().setFromObject(object);
    
    // Ensure bounding box is valid
    if (boundingBox.isEmpty()) {
      console.warn('Bounding box is empty');
      return;
    }
    
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Compute the max side length (plus some margin)
    const maxDim = Math.max(size.x, size.y, size.z) * 1.2;
    

    const fov = cameraRef.current.fov * (Math.PI / 180);
    const cameraDistance = maxDim / (2 * Math.tan(fov / 2));
    

    const direction = new THREE.Vector3(0, 0, 1);
    direction.multiplyScalar(cameraDistance);
    
    cameraRef.current.position.copy(center).add(direction);
    cameraRef.current.lookAt(center);
    
 
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
    
    console.log('Camera fitted to object:', { center, size, distance: cameraDistance });
    
    // Force a render to update the view
    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };


  const handleExport = async () => {
    if (!file) {
      setMessage('No model to export');
      return;
    }

    setLoading(true);
    setMessage('Exporting model...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fromFormat', fileType);
    formData.append('toFormat', exportFormat);

    try {
      const response = await fetch('http://localhost:5000/api/export', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `model.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setMessage('Model exported successfully!');
    } catch (error) {
      setMessage(`Error exporting model: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      cameraRef.current.lookAt(0, 0, 0);
    }
    
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    
    setFile(null);
    setFileType('');
    setMessage('Scene reset');
  };

  return (
    <div className="app-container">
      <h1>3D CAD Viewer</h1>
      
      <div className="controls-panel">
        <div className="upload-section">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".stl,.obj"
            disabled={loading}
          />
          <button onClick={handleUpload} disabled={!file || loading}>
            Upload
          </button>
          <button onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
        
        <div className="export-section">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            disabled={loading || !file}
          >
            <option value="obj">OBJ</option>
            <option value="stl">STL</option>
          </select>
          <button onClick={handleExport} disabled={loading || !file}>
            Export
          </button>
        </div>
        
        {message && <div className="message">{message}</div>}
      </div>
      
      <div className="viewer-container" ref={mountRef}></div>
      
      <div className="instructions">
        <h3>Controls:</h3>
        <p>Rotate: Left-click and drag</p>
        <p>Pan: Right-click and drag</p>
        <p>Zoom: Scroll wheel</p>
      </div>
    </div>
  );
}

export default App;