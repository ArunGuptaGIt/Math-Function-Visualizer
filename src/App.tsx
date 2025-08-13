import React, { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { evaluate } from 'mathjs';
import { Calculator, Play, RotateCcw, Settings, Info, Square, Box } from 'lucide-react';

interface MathSurfaceProps {
  equation: string;
  resolution: number;
  mode: '2d' | '3d';
}

const MathSurface: React.FC<MathSurfaceProps> = ({ equation, resolution, mode }) => {
  const { geometry, material, isLine } = useMemo(() => {
    const size = 6;
    
    if (mode === '2d') {
      // 2D curve geometry
      const points = resolution;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(points * 3);
      const colors = new Float32Array(points * 3);
      
      for (let i = 0; i < points; i++) {
        const x = -size + (i / (points - 1)) * (size * 2);
        try {
          const y = evaluate(equation, { x, e: Math.E, pi: Math.PI });
          positions[i * 3] = x;
          positions[i * 3 + 1] = isFinite(y) ? Math.max(-10, Math.min(10, y)) : 0;
          positions[i * 3 + 2] = 0;
          
          // Color based on y-value
          const normalizedY = (positions[i * 3 + 1] + size) / (size * 2);
          colors[i * 3] = 0.2 + normalizedY * 0.8; // R
          colors[i * 3 + 1] = 0.2 + (1 - normalizedY) * 0.8; // G
          colors[i * 3 + 2] = 0.2; // B
        } catch {
          positions[i * 3] = x;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        }
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 3,
      });
      
      return { geometry, material, isLine: true };
    } else {
      // 3D surface geometry
      const geometry = new THREE.PlaneGeometry(size * 2, size * 2, resolution - 1, resolution - 1);
      const positions = geometry.attributes.position.array as Float32Array;
      const colors = new Float32Array(positions.length);
      
      let minZ = Infinity;
      let maxZ = -Infinity;
      const zValues = [];
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        
        try {
          const z = evaluate(equation, { x, y, e: Math.E, pi: Math.PI });
          const zValue = isFinite(z) ? Math.max(-10, Math.min(10, z)) : 0;
          zValues.push(zValue);
          minZ = Math.min(minZ, zValue);
          maxZ = Math.max(maxZ, zValue);
        } catch {
          zValues.push(0);
        }
      }
      
      for (let i = 0; i < positions.length; i += 3) {
        const zValue = zValues[i / 3];
        positions[i + 2] = zValue;
        
        const normalizedHeight = maxZ !== minZ ? (zValue - minZ) / (maxZ - minZ) : 0.5;
        
        if (normalizedHeight < 0.33) {
          const t = normalizedHeight / 0.33;
          colors[i] = 0 + t * 0.4;
          colors[i + 1] = 0.4 + t * 0.6;
          colors[i + 2] = 0.9;
        } else if (normalizedHeight < 0.66) {
          const t = (normalizedHeight - 0.33) / 0.33;
          colors[i] = 0.4 + t * 0.5;
          colors[i + 1] = 0.9;
          colors[i + 2] = 0.9 - t * 0.6;
        } else {
          const t = (normalizedHeight - 0.66) / 0.34;
          colors[i] = 0.9;
          colors[i + 1] = 0.9 - t * 0.6;
          colors[i + 2] = 0.3 - t * 0.2;
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        wireframe: false,
        transparent: true,
        opacity: 0.95,
        metalness: 0.1,
        roughness: 0.3,
      });
      
      return { geometry, material, isLine: false };
    }
  }, [equation, resolution, mode]);


if (isLine) {
  return <primitive object={new THREE.Line(geometry as THREE.BufferGeometry, material as THREE.LineBasicMaterial)} />;
} else {
  return <mesh geometry={geometry as THREE.PlaneGeometry} material={material as THREE.MeshStandardMaterial} />;
}

};

const AxisLines: React.FC<{ mode: '2d' | '3d' }> = ({ mode }) => {
  const axisLength = 8;
  
  const xAxisPoints = [
    new THREE.Vector3(-axisLength, 0, 0),
    new THREE.Vector3(axisLength, 0, 0)
  ];
  
  const yAxisPoints = [
    new THREE.Vector3(0, -axisLength, 0),
    new THREE.Vector3(0, axisLength, 0)
  ];
  
  const zAxisPoints = [
    new THREE.Vector3(0, 0, -axisLength),
    new THREE.Vector3(0, 0, axisLength)
  ];
  
  return (
    <>
      <Line points={xAxisPoints} color="#e74c3c" lineWidth={2} />
      <Line points={yAxisPoints} color="#27ae60" lineWidth={2} />
      {mode === '3d' && <Line points={zAxisPoints} color="#3498db" lineWidth={2} />}
      
      <mesh position={[axisLength, 0, 0]}>
        <coneGeometry args={[0.08, 0.25, 8]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      <mesh position={[0, axisLength, 0]}>
        <coneGeometry args={[0.08, 0.25, 8]} />
        <meshBasicMaterial color="#27ae60" />
      </mesh>
      {mode === '3d' && (
        <mesh position={[0, 0, axisLength]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.25, 8]} />
          <meshBasicMaterial color="#3498db" />
        </mesh>
      )}
    </>
  );
};

const presetEquations2D = [
  { name: 'Sine Wave', equation: 'sin(x)' },
  { name: 'Parabola', equation: 'x^2' },
  { name: 'Exponential', equation: 'exp(x/2)' },
  { name: 'Logarithm', equation: 'log(abs(x) + 1)' },
  { name: 'Absolute Value', equation: 'abs(x)' },
  { name: 'Sigmoid', equation: '1 / (1 + exp(-x))' },
  { name: 'Gaussian', equation: 'exp(-x^2)' },
  { name: 'Step Function', equation: 'x > 0 ? 1 : 0' },
];

const presetEquations3D = [
  { name: 'Sine Wave', equation: 'sin(sqrt(x*x + y*y))' },
  { name: 'Ripple Effect', equation: 'cos(x) * cos(y)' },
  { name: 'Saddle Point', equation: 'x*x - y*y' },
  { name: 'Paraboloid', equation: '(x*x + y*y) / 4' },
  { name: 'Wave Interference', equation: 'sin(x) * cos(y)' },
  { name: 'Gaussian Bell', equation: '2 * exp(-(x*x + y*y)/8)' },
  { name: 'Hyperbolic', equation: 'x*y / 4' },
  { name: 'Spiral', equation: 'sin(sqrt(x*x + y*y) + atan2(y, x))' },
];

function App() {
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  const [equation, setEquation] = useState('sin(sqrt(x*x + y*y))');
  const [inputValue, setInputValue] = useState('sin(sqrt(x*x + y*y))');
  const [resolution, setResolution] = useState(80);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const handleEquationUpdate = useCallback(() => {
    try {
      if (mode === '2d') {
        evaluate(inputValue, { x: 1, e: Math.E, pi: Math.PI });
      } else {
        evaluate(inputValue, { x: 1, y: 1, e: Math.E, pi: Math.PI });
      }
      setEquation(inputValue);
      setError('');
    } catch {
      setError('Invalid equation syntax');
    }
  }, [inputValue, mode]);

  const handlePresetSelect = useCallback((presetEquation: string) => {
    setInputValue(presetEquation);
    setEquation(presetEquation);
    setError('');
  }, []);

  const resetView = useCallback(() => {
    handleEquationUpdate();
  }, [handleEquationUpdate]);

  const toggleMode = useCallback(() => {
    const newMode = mode === '2d' ? '3d' : '2d';
    setMode(newMode);
    
    // Reset to appropriate default equation
    if (newMode === '2d') {
      setInputValue('sin(x)');
      setEquation('sin(x)');
    } else {
      setInputValue('sin(sqrt(x*x + y*y))');
      setEquation('sin(sqrt(x*x + y*y))');
    }
  }, [mode]);

  const currentPresets = mode === '2d' ? presetEquations2D : presetEquations3D;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Mathematical Function Visualizer
                </h1>
                <p className="text-sm text-gray-500">
                  Interactive {mode === '2d' ? '2D curve' : '3D surface'} plotting
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Control Panel */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Visualization Mode
              </label>
              <button
                onClick={toggleMode}
                className="relative inline-flex items-center h-8 rounded-full w-16 bg-blue-600 transition-colors"
              >
                <span className={`absolute left-1 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-white transition-transform ${
                  mode === '2d' ? 'translate-x-0' : 'translate-x-8'
                }`}>
                  {mode === '2d' ? (
                    <Square className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Box className="w-3 h-3 text-blue-600" />
                  )}
                </span>
                <span className="sr-only">
                  {mode === '2d' ? '2D Mode' : '3D Mode'}
                </span>
              </button>
            </div>

            {/* Equation Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Function Definition
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-mono text-sm">
                  {mode === '2d' ? 'y =' : 'z ='}
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={mode === '2d' ? 'sin(x)' : 'sin(sqrt(x*x + y*y))'}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleEquationUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Render</span>
                </button>
                <button
                  onClick={resetView}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Resolution Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {mode === '2d' ? 'Curve Resolution' : 'Surface Resolution'}
                </label>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {resolution}
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="150"
                value={resolution}
                onChange={(e) => setResolution(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Fast</span>
                <span>Detailed</span>
              </div>
            </div>

            {/* Preset Functions */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Example Functions
              </label>
              <div className="grid gap-2">
                {currentPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset.equation)}
                    className="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 group"
                  >
                    <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700">
                      {preset.name}
                    </div>
                    <div className="font-mono text-xs text-gray-500 mt-1">
                      {preset.equation}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Function Reference */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Available Functions
              </h3>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <span className="font-medium">Basic:</span> +, -, *, /, ^
                </div>
                <div>
                  <span className="font-medium">Trigonometric:</span> sin, cos, tan, asin, acos, atan
                </div>
                <div>
                  <span className="font-medium">Exponential:</span> exp, log, log10, sqrt
                </div>
                <div>
                  <span className="font-medium">Constants:</span> pi, e
                </div>
                <div>
                  <span className="font-medium">Variables:</span> {mode === '2d' ? 'x' : 'x, y'}
                </div>
                {mode === '2d' && (
                  <div>
                    <span className="font-medium">Conditionals:</span> {'x > 0 ? 1 : 0'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Visualization */}
        <main className="flex-1 relative bg-gray-100">
            <Canvas
                camera={{ 
                  position: mode === '2d' ? [0, 0, 15] : [10, 8, 10], 
                  fov: 70,
                  up: [0, 1, 0]
                }}
                className="bg-gradient-to-br from-gray-100 to-gray-200"
              >
            <ambientLight intensity={0.6} />
            {mode === '3d' && (
              <>
                <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.3} />
              </>
            )}
            
            <MathSurface equation={equation} resolution={resolution} mode={mode} />
            <AxisLines mode={mode} />
            
            <Grid 
              args={[15, 15]} 
              position={[0, 0, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              cellColor="rgba(0,0,0,0.1)"
              sectionColor="rgba(0,0,0,0.2)"
            />
            
            {/* Axis Labels */}
            <Text
              position={[8.5, 0, 0]}
              fontSize={0.5}
              color="#000000"
              fontWeight="bold"
            >
              X
            </Text>
            <Text
              position={[0, 8.5, 0]}
              fontSize={0.5}
              color="#000000"
              fontWeight="bold"
            >
              Y
            </Text>
            {mode === '3d' && (
              <Text
                position={[0, 0, 8.5]}
                fontSize={0.5}
                color="#000000"
                fontWeight="bold"
              >
                Z
              </Text>
            )}
            
            {/* Tick marks and labels */}
            {[-6, -5, -4, -3, -2,-1, 0, 1, 2, 3, 4, 5, 6].map((tick) => (
              <React.Fragment key={`x-${tick}`}>
                <Text
                  position={[tick, -0.4, 0]}
                  fontSize={0.25}
                  color="#000000"
                >
                  {tick}
                </Text>
                <mesh position={[tick, 0, 0]}>
                  <boxGeometry args={[0.03, 0.15, 0.03]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              </React.Fragment>
            ))}
            
            {[-6, -5, -4, -3, -2,-1, 0, 1, 2, 3, 4, 5, 6].map((tick) => (
              <React.Fragment key={`y-${tick}`}>
                <Text
                  position={[-0.4, tick, 0]}
                  fontSize={0.25}
                  color="#000000"
                >
                  {tick}
                </Text>
                <mesh position={[0, tick, 0]}>
                  <boxGeometry args={[0.15, 0.03, 0.03]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              </React.Fragment>
            ))}
            
            {mode === '3d' && [-6, -4, -2, 2, 4, 6].map((tick) => (
              <React.Fragment key={`z-${tick}`}>
                <Text
                  position={[0.4, 0, tick]}
                  fontSize={0.25}
                  color="#666"
                >
                  {tick}
                </Text>
                <mesh position={[0, 0, tick]}>
                  <boxGeometry args={[0.03, 0.03, 0.15]} />
                  <meshBasicMaterial color="#000000" />
                </mesh>
              </React.Fragment>
            ))}
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI}
              minDistance={5}
              maxDistance={25}
              dampingFactor={0.05}
              enableDamping={true}
            />
          </Canvas>
          
          {/* Current Function Display */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Current Function
            </div>
            <div className="font-mono text-gray-900 font-medium mt-1">
              {mode === '2d' ? 'y =' : 'z ='} {equation}
            </div>
          </div>
          
          {/* Navigation Help */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
              Navigation
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              {mode === '3d' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Left drag: Rotate view</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Right drag: Pan view</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Drag: Pan view</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Scroll: Zoom in/out</span>
              </div>
            </div>
          </div>

          {/* Axis Legend */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
              Coordinate System
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-0.5 bg-red-500 rounded"></div>
                <span className="text-gray-600">X-axis</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-0.5 bg-green-500 rounded"></div>
                <span className="text-gray-600">Y-axis</span>
              </div>
              {mode === '3d' && (
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Z-axis</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="absolute inset-4 bg-white/98 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">About This Visualizer</h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="prose prose-sm text-gray-600 max-w-none">
                <p>
                  This tool visualizes mathematical functions {mode === '2d' ? 'as 2D curves' : 'as 3D surfaces'}. 
                  Enter any function {mode === '2d' ? 'y = f(x)' : 'z = f(x, y)'} using standard mathematical notation.
                </p>
                <h3 className="text-gray-900 font-medium mt-4 mb-2">Supported Operations</h3>
                <ul className="text-sm space-y-1">
                  <li><strong>Arithmetic:</strong> +, -, *, /, ^ (power)</li>
                  <li><strong>Trigonometric:</strong> sin, cos, tan, asin, acos, atan</li>
                  <li><strong>Exponential:</strong> exp, log, log10, sqrt</li>
                  <li><strong>Constants:</strong> pi (π), e (Euler's number)</li>
                  {mode === '2d' && (
                    <li><strong>Conditionals:</strong> x greater 0 ? 1 : 0 (ternary expressions)</li>
                  )}
                </ul>
                <h3 className="text-gray-900 font-medium mt-4 mb-2">Example Functions</h3>
                <ul className="text-sm space-y-1 font-mono">
                  {mode === '2d' ? (
                    <>
                      <li>sin(x) - Sine wave</li>
                      <li>x^2 - Parabola</li>
                      <li>exp(x/2) - Exponential growth</li>
                      <li>log(abs(x) + 1) - Logarithm</li>
                      <li>x greater 0 ? 1 : 0 - Step function</li>
                    </>
                  ) : (
                    <>
                      <li>sin(x) * cos(y) - Wave interference</li>
                      <li>x^2 + y^2 - Paraboloid</li>
                      <li>exp(-(x^2 + y^2)/4) - Gaussian distribution</li>
                      <li>sin(sqrt(x^2 + y^2)) - Radial waves</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;