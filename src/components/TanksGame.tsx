import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Box, Plane, Sphere, PointerLockControls } from '@react-three/drei';
import { Wifi, Target, Zap, Rocket, Maximize2, Minimize2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import * as THREE from 'three';

// Vehicle definitions
const VEHICLE_TYPES = [
  { id: 'tank1', name: 'Танк "Тигр"', type: 'tank', speed: 5, color: '#4d7c0f' },
  { id: 'tank2', name: 'Танк "Леопард"', type: 'tank', speed: 7, color: '#0f766e' },
  { id: 'tank3', name: 'Танк "Абрамс"', type: 'tank', speed: 6, color: '#ca8a04' },
  { id: 'tank4', name: 'Танк "Швидкий"', type: 'tank', speed: 10, color: '#dc2626' },
  { id: 'plane1', name: 'Літак Стелс', type: 'plane', speed: 25, color: '#1e1b4b' },
  { id: 'plane2', name: 'Винищувач', type: 'plane', speed: 20, color: '#1e3a8a' },
  { id: 'plane3', name: 'Штурмовик', type: 'plane', speed: 15, color: '#3f6212' },
  { id: 'plane4', name: 'Кукурудзник', type: 'plane', speed: 12, color: '#b45309' },
  { id: 'heli1', name: 'Гелікоптер "Апач"', type: 'helicopter', speed: 14, color: '#111827' },
];

function World({ buildings }: { buildings: { x: number, z: number, w: number, h: number, d: number }[] }) {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, 50]} intensity={1} castShadow />
      
      {/* Ground */}
      <Plane args={[1000, 1000]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#2d3748" metalness={0.1} roughness={0.8} />
      </Plane>

      <gridHelper args={[1000, 100]} />

      {/* Scattered Buildings */}
      {buildings.map((b, i) => (
        <Box key={i} args={[b.w, b.h, b.d]} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <meshStandardMaterial color="#4a5568" />
        </Box>
      ))}
    </>
  );
}

function PlayerVehicle({ type, color, position, rotation }: { type: string, color: string, position: [number, number, number], rotation: [number, number, number] }) {
  const bladeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (type === 'helicopter' && bladeRef.current) {
      bladeRef.current.rotation.y += 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {type === 'tank' && (
        <>
          <Box args={[2, 1, 3]} castShadow>
            <meshStandardMaterial color={color} />
          </Box>
          <Box args={[1.2, 0.8, 1.5]} position={[0, 0.9, 0]} castShadow>
             <meshStandardMaterial color={color} />
          </Box>
          <Box args={[0.2, 0.2, 2]} position={[0, 1, 1.5]} castShadow>
             <meshStandardMaterial color="#333" />
          </Box>
        </>
      )}
      {type === 'plane' && (
        <>
          <Box args={[1, 0.8, 4]} castShadow>
            <meshStandardMaterial color={color} />
          </Box>
          <Box args={[4, 0.1, 1]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color={color} />
          </Box>
          <Box args={[1.5, 0.1, 0.5]} position={[0, 0.5, -1.8]} castShadow>
             <meshStandardMaterial color={color} />
          </Box>
        </>
      )}
      {type === 'helicopter' && (
        <>
          <Box args={[1, 1.2, 3]} castShadow>
            <meshStandardMaterial color={color} />
          </Box>
          {/* Main rotor */}
          <Box ref={bladeRef} args={[4, 0.05, 0.2]} position={[0, 0.7, 0]} castShadow>
            <meshStandardMaterial color="#111" />
          </Box>
          {/* Tail */}
          <Box args={[0.2, 0.4, 2]} position={[0, 0.2, -2]} castShadow>
            <meshStandardMaterial color={color} />
          </Box>
        </>
      )}
    </group>
  );
}

function RemotePlayer({ id, data }: { id: string, data: any }) {
  return (
    <PlayerVehicle 
      type={data.vehicleType} 
      color={data.color} 
      position={data.position} 
      rotation={data.rotation} 
    />
  );
}

function PlayerControls({ socket, vehicle, roomId, setLocalScore }: any) {
  const movement = useRef({ forward: 0, backward: 0, left: 0, right: 0, up: 0, down: 0 });
  const playerState = useRef({
    position: [0, vehicle.type === 'tank' ? 0.5 : 10, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number]
  });
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': movement.current.forward = 1; break;
        case 'KeyS': case 'ArrowDown': movement.current.backward = 1; break;
        case 'KeyA': case 'ArrowLeft': movement.current.left = 1; break;
        case 'KeyD': case 'ArrowRight': movement.current.right = 1; break;
        case 'Space': movement.current.up = 1; if(e.target === document.body) e.preventDefault(); break;
        case 'ShiftLeft': case 'ShiftRight': movement.current.down = 1; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': movement.current.forward = 0; break;
        case 'KeyS': case 'ArrowDown': movement.current.backward = 0; break;
        case 'KeyA': case 'ArrowLeft': movement.current.left = 0; break;
        case 'KeyD': case 'ArrowRight': movement.current.right = 0; break;
        case 'Space': movement.current.up = 0; break;
        case 'ShiftLeft': case 'ShiftRight': movement.current.down = 0; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = vehicle.speed;
    const turnSpeed = 2;
    const s = playerState.current;
    const m = movement.current;

    if (m.left) s.rotation[1] += turnSpeed * delta;
    if (m.right) s.rotation[1] -= turnSpeed * delta;

    const moveZ = (m.forward - m.backward) * speed * delta;
    
    s.position[0] += Math.sin(s.rotation[1]) * moveZ;
    s.position[2] += Math.cos(s.rotation[1]) * moveZ;

    if (vehicle.type !== 'tank') {
       if (m.up) s.position[1] += speed * delta;
       if (m.down) s.position[1] -= speed * delta;
       if (s.position[1] < 1) s.position[1] = 1;
    } else {
       s.position[1] = 0.5;
    }

    if (groupRef.current) {
        groupRef.current.position.set(s.position[0], s.position[1], s.position[2]);
        groupRef.current.rotation.set(s.rotation[0], s.rotation[1], s.rotation[2]);
    }

    state.camera.position.set(
      s.position[0] - Math.sin(s.rotation[1]) * 10,
      s.position[1] + 5,
      s.position[2] - Math.cos(s.rotation[1]) * 10
    );
    state.camera.lookAt(s.position[0], s.position[1], s.position[2]);

    if (socket && roomId && Math.random() < 0.1) {
       socket.emit('game-state-update', {
          roomId,
          state: {
             type: 'player_update',
             playerId: socket.id,
             data: {
               vehicleType: vehicle.type,
               color: vehicle.color,
               position: s.position,
               rotation: s.rotation
             }
          }
       });
    }
  });

  return (
    <group ref={groupRef}>
      <PlayerVehicle 
        type={vehicle.type} 
        color={vehicle.color} 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]} 
      />
    </group>
  );
}

export default function TanksGame({ highScore, onUpdateHighScore }: any) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Static random buildings
  const [buildings] = useState(() => 
    Array.from({ length: 50 }).map(() => ({
      x: (Math.random() - 0.5) * 400,
      z: (Math.random() - 0.5) * 400,
      w: Math.random() * 10 + 5,
      h: Math.random() * 20 + 5,
      d: Math.random() * 10 + 5
    }))
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('player-joined', () => {
         setInRoom(true);
      });
      socket.on('game-state-update', (state) => {
         if (state.type === 'player_update' && state.playerId !== socket.id) {
            setRemotePlayers(prev => ({
              ...prev,
              [state.playerId]: state.data
            }));
         }
      });
      socket.on('player-disconnected', (id) => {
          // This is a minimal implementation, server disconnect logic needs to send the ID.
          // For now, if anyone disconnects we don't know who, we can just clear it.
          // Wait, 'player-disconnected' from our simple server doesn't send the ID.
          // We can just ignore for this prototype, or ping timeouts.
      });
    }
    return () => {
      if (socket) {
        socket.off('player-joined');
        socket.off('game-state-update');
        socket.off('player-disconnected');
      }
    };
  }, [socket]);

  const joinGame = () => {
    if (isOnline && !roomId) return;
    
    if (isOnline) {
      const newSocket = io();
      setSocket(newSocket);
      newSocket.emit('join-game', { roomId });
    } else {
      setInRoom(true);
    }
  };

  if (!selectedVehicleId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Вибір техніки</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
          {VEHICLE_TYPES.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className="flex flex-col items-center p-4 bg-zinc-900 border-2 border-zinc-800 rounded-xl hover:border-emerald-500 hover:bg-zinc-800 transition group"
            >
              <div className="w-16 h-16 rounded-full mb-3 flex items-center justify-center border-4 border-zinc-950" style={{ backgroundColor: v.color }}>
                 {v.type === 'tank' && <Target className="w-8 h-8 text-white/50" />}
                 {v.type === 'plane' && <Rocket className="w-8 h-8 text-white/50" />}
                 {v.type === 'helicopter' && <Zap className="w-8 h-8 text-white/50" />}
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-emerald-400">{v.name}</h3>
              <p className="text-zinc-500 text-sm">Швидкість: {v.speed}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!inRoom) {
     return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Режим гри</h2>
            
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setIsOnline(false)} 
                className={`flex-1 py-3 rounded-lg font-bold border-2 transition ${!isOnline ? 'bg-zinc-800 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                Одиночна (Локально)
              </button>
              <button 
                onClick={() => setIsOnline(true)} 
                className={`flex-1 py-3 rounded-lg font-bold border-2 transition flex items-center justify-center gap-2 ${isOnline ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                <Wifi className="w-4 h-4" /> Онлайн
              </button>
            </div>

            {isOnline && (
              <input 
                type="text"
                placeholder="Введіть код кімнати"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white mb-6 text-center text-lg font-mono tracking-wider focus:outline-none focus:border-blue-500"
              />
            )}

            <button 
              onClick={joinGame}
              disabled={isOnline && !roomId}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-lg text-lg shadow-lg hover:shadow-emerald-600/20 transition"
            >
              Почати гру
            </button>
            <button
               onClick={() => setSelectedVehicleId(null)}
               className="w-full mt-4 py-2 text-zinc-400 hover:text-white text-sm"
            >
               Змінити техніку
            </button>
          </div>
        </div>
     );
  }

  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === selectedVehicleId)!;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
       containerRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
       document.exitFullscreen();
    }
  };

  return (
    <div ref={containerRef} className={`w-full ${isFullscreen ? 'h-screen bg-zinc-950' : 'h-[500px] md:h-[600px]'} rounded-xl overflow-hidden relative cursor-crosshair`}>
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="bg-zinc-950/80 border border-zinc-800 px-4 py-2 rounded-lg font-mono text-zinc-300 backdrop-blur">
            <span className="text-xs text-zinc-500 block">Техніка</span>
            <div className="font-bold flex items-center gap-2">
               <div className="w-3 h-3 rounded-full" style={{backgroundColor: selectedVehicle.color}} />
               {selectedVehicle.name}
            </div>
         </div>
         <div className="bg-zinc-950/80 border border-zinc-800 px-4 py-2 rounded-lg font-mono text-xs text-zinc-400 backdrop-blur">
            WASD - Рух <br/> Пробіл/Shift - Висота
         </div>
      </div>
      <div className="absolute top-4 right-4 z-10 pointer-events-auto flex items-center gap-2">
         {isOnline && (
            <div className="bg-blue-950/80 border border-blue-900/50 px-4 py-2 rounded-lg font-mono text-xs text-blue-300 backdrop-blur flex items-center gap-2">
               <Wifi className="w-3 h-3" /> Кімната: {roomId}
            </div>
         )}
         <button onClick={toggleFullscreen} className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
         </button>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10">
         <Target className="w-8 h-8" />
      </div>

      <Canvas shadows camera={{ fov: 60 }}>
        <World buildings={buildings} />
        <PlayerControls socket={socket} vehicle={selectedVehicle} roomId={roomId} />
        {Object.entries(remotePlayers).map(([id, data]) => (
           <RemotePlayer key={id} id={id} data={data} />
        ))}
      </Canvas>
    </div>
  );
}
