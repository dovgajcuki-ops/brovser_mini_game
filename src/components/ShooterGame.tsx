import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Box, Plane, PointerLockControls, Sphere } from '@react-three/drei';
import { Wifi, Target, Maximize2, Minimize2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import * as THREE from 'three';

const MOVEMENT_SPEED = 20;
const JUMP_FORCE = 15;
const GRAVITY = 40;

function World() {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, 50]} intensity={1} castShadow />
      
      {/* Ground */}
      <Plane args={[1000, 1000]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#3a423a" roughness={0.8} />
      </Plane>

      {/* Map Buildings */}
      <Box args={[10, 5, 20]} position={[-15, 2.5, 0]} castShadow receiveShadow>
         <meshStandardMaterial color="#baa68c" />
      </Box>
      <Box args={[20, 5, 5]} position={[0, 2.5, 15]} castShadow receiveShadow>
         <meshStandardMaterial color="#baa68c" />
      </Box>
      <Box args={[5, 10, 5]} position={[10, 5, 10]} castShadow receiveShadow>
         <meshStandardMaterial color="#baa68c" />
      </Box>
      <Box args={[10, 5, 10]} position={[20, 2.5, -20]} castShadow receiveShadow>
         <meshStandardMaterial color="#8e8170" />
      </Box>
      <Box args={[30, 2, 2]} position={[-10, 1, -20]} castShadow receiveShadow>
         <meshStandardMaterial color="#554433" />
      </Box>
      <Box args={[3, 3, 3]} position={[5, 1.5, -5]} castShadow receiveShadow>
         <meshStandardMaterial color="#405020" />
      </Box>
    </>
  );
}

function RemotePlayer({ data }: { data: any }) {
  const [targetPos, setTargetPos] = useState(new THREE.Vector3(...data.position));
  const ref = useRef<THREE.Group>(null);
  
  useEffect(() => {
     setTargetPos(new THREE.Vector3(...data.position));
  }, [data.position]);

  useFrame(() => {
     if (ref.current) {
        ref.current.position.lerp(targetPos, 0.2);
        const [rx, ry, rz] = data.rotation;
        ref.current.rotation.set(0, ry, 0);
     }
  });

  return (
    <group ref={ref}>
      <Box args={[1, 1.8, 1]} castShadow>
         <meshStandardMaterial color={data.team === 'ct' ? '#3b82f6' : '#ef4444'} />
      </Box>
      {/* weapon */}
      <Box args={[0.2, 0.2, 1.2]} position={[0.4, 0.2, -0.6]} castShadow>
         <meshStandardMaterial color="#2d3748" />
      </Box>
    </group>
  );
}

function Bullets({ bullets }: { bullets: any[] }) {
   if (!bullets) return null;
   return (
     <>
       {bullets.map((b, i) => (
          <Sphere key={i} args={[0.1]} position={b.position}>
             <meshBasicMaterial color="#fbbf24" />
          </Sphere>
       ))}
     </>
   );
}

function PlayerControls({ socket, roomId, team, setBullets }: any) {
  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false, jump: false });
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const playerRef = useRef(new THREE.Vector3(0, 1.8, 0));
  const controlsRef = useRef<any>();
  const lastFireTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: true })); break;
        case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, backward: true })); break;
        case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, left: true })); break;
        case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: true })); break;
        case 'Space': setMovement(m => ({ ...m, jump: true })); if(e.target === document.body) e.preventDefault(); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: false })); break;
        case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, backward: false })); break;
        case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, left: false })); break;
        case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: false })); break;
        case 'Space': setMovement(m => ({ ...m, jump: false })); break;
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (document.pointerLockElement) {
         if (Date.now() - lastFireTime.current > 150) {
            lastFireTime.current = Date.now();
            if (controlsRef.current) {
               const raycaster = new THREE.Raycaster();
               raycaster.camera = controlsRef.current.getObject();
               const camDir = new THREE.Vector3();
               raycaster.camera.getWorldDirection(camDir);
               const camPos = new THREE.Vector3();
               raycaster.camera.getWorldPosition(camPos);
               
               const bullet = {
                  id: Math.random().toString(),
                  position: camPos.toArray(),
                  direction: camDir.toArray(),
                  speed: 100,
                  owner: socket?.id || 'local'
               };
               
               if (socket && roomId) {
                  socket.emit('game-state-update', {
                     roomId,
                     state: {
                        type: 'shoot',
                        playerId: socket.id,
                        bullet
                     }
                  });
               }
               setBullets((prev: any[]) => [...prev, bullet]);
            }
         }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [socket, roomId, setBullets]);

  useFrame((state, delta) => {
    if (controlsRef.current && controlsRef.current.isLocked) {
      const camera = controlsRef.current.getObject();
      
      velocity.current.x -= velocity.current.x * 10 * delta;
      velocity.current.z -= velocity.current.z * 10 * delta;
      velocity.current.y -= GRAVITY * delta;

      direction.current.z = Number(movement.forward) - Number(movement.backward);
      direction.current.x = Number(movement.right) - Number(movement.left);
      direction.current.normalize();

      if (movement.forward || movement.backward) velocity.current.z -= direction.current.z * MOVEMENT_SPEED * delta;
      if (movement.left || movement.right) velocity.current.x -= direction.current.x * MOVEMENT_SPEED * delta;

      controlsRef.current.moveRight(-velocity.current.x * delta);
      controlsRef.current.moveForward(-velocity.current.z * delta);
      
      const newY = playerRef.current.y + (velocity.current.y * delta);
      if (newY < 1.8) {
         velocity.current.y = 0;
         playerRef.current.y = 1.8;
         if (movement.jump) {
            velocity.current.y = JUMP_FORCE;
         }
      } else {
         playerRef.current.y = newY;
      }
      
      camera.position.y = playerRef.current.y;
      playerRef.current.copy(camera.position);
      
      if (socket && roomId && Math.random() < 0.2) {
         socket.emit('game-state-update', {
            roomId,
            state: {
               type: 'player_update',
               playerId: socket.id,
               data: {
                 team,
                 position: playerRef.current.toArray(),
                 rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z]
               }
            }
         });
      }
    }
  });

  return <PointerLockControls document={document} ref={controlsRef} />;
}

export default function ShooterGame({ highScore, onUpdateHighScore }: any) {
  const [team, setTeam] = useState<'ct' | 't' | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, any>>({});
  const [bullets, setBullets] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
         } else if (state.type === 'shoot' && state.playerId !== socket.id) {
            setBullets(prev => [...prev, state.bullet]);
         }
      });
    }
    return () => {
      if (socket) {
        socket.off('player-joined');
        socket.off('game-state-update');
      }
    };
  }, [socket]);
  
  useEffect(() => {
     let animationFrameId: number;
     let lastTime = performance.now();
     
     const renderBullets = () => {
        const time = performance.now();
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        
        setBullets(prev => {
           if (prev.length === 0) return prev;
           const next = [...prev];
           let kept = [];
           for (let b of next) {
               // Must clone array before changing it to trigger re-render
               const nb = { ...b, position: [...b.position] };
               nb.position[0] += b.direction[0] * b.speed * delta;
               nb.position[1] += b.direction[1] * b.speed * delta;
               nb.position[2] += b.direction[2] * b.speed * delta;
               
               if (Math.abs(nb.position[0]) < 200 && Math.abs(nb.position[1]) < 200 && Math.abs(nb.position[2]) < 200) {
                   kept.push(nb);
               }
           }
           return kept;
        });
        animationFrameId = requestAnimationFrame(renderBullets);
     };
     animationFrameId = requestAnimationFrame(renderBullets);
     return () => cancelAnimationFrame(animationFrameId);
  }, []);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
       containerRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
       document.exitFullscreen();
    }
  };

  if (!team) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Вибір команди</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full">
          <button
              onClick={() => setTeam('ct')}
              className="flex flex-col items-center p-6 bg-blue-900/30 border-2 border-blue-800 rounded-xl hover:border-blue-500 hover:bg-blue-900/50 transition group"
            >
              <h3 className="font-bold text-2xl text-blue-500 group-hover:text-blue-400">Спецназ (CT)</h3>
          </button>
          <button
              onClick={() => setTeam('t')}
              className="flex flex-col items-center p-6 bg-red-900/30 border-2 border-red-800 rounded-xl hover:border-red-500 hover:bg-red-900/50 transition group"
            >
              <h3 className="font-bold text-2xl text-red-500 group-hover:text-red-400">Терористи (T)</h3>
          </button>
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
               onClick={() => setTeam(null)}
               className="w-full mt-4 py-2 text-zinc-400 hover:text-white text-sm"
            >
               Змінити команду
            </button>
          </div>
        </div>
     );
  }

  return (
    <div ref={containerRef} className={`w-full ${isFullscreen ? 'h-screen bg-zinc-950' : 'h-[500px] md:h-[600px]'} rounded-xl overflow-hidden relative select-none`}>
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="bg-zinc-950/80 border border-zinc-800 px-4 py-2 rounded-lg font-mono text-zinc-300 backdrop-blur">
            <span className="text-xs text-zinc-500 block">Команда</span>
            <div className="font-bold flex items-center gap-2">
               <div className={`w-3 h-3 rounded-full ${team === 'ct' ? 'bg-blue-500' : 'bg-red-500'}`} />
               {team === 'ct' ? 'Спецназ' : 'Терористи'}
            </div>
         </div>
         <div className="bg-zinc-950/80 border border-zinc-800 px-4 py-2 rounded-lg font-mono text-xs text-zinc-400 backdrop-blur">
            WASD - Рух <br/> Пробіл - Стрибок <br/> ЛКМ - Вогонь
         </div>
      </div>
      <div className="absolute top-4 right-4 z-10 pointer-events-auto flex items-center gap-2">
         {isOnline && (
            <div className="bg-blue-950/80 border border-blue-900/50 px-4 py-2 rounded-lg font-mono text-xs text-blue-300 backdrop-blur flex items-center gap-2">
               <Wifi className="w-3 h-3" /> {roomId}
            </div>
         )}
         <button onClick={toggleFullscreen} className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
         </button>
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
         <div className="w-1 h-1 bg-green-500 rounded-full" />
         <div className="w-4 h-0.5 bg-green-500/50 absolute left-full ml-1" />
         <div className="w-4 h-0.5 bg-green-500/50 absolute right-full mr-1" />
         <div className="w-0.5 h-4 bg-green-500/50 absolute top-full mt-1" />
         <div className="w-0.5 h-4 bg-green-500/50 absolute bottom-full mb-1" />
      </div>

      {/* Click to start text */}
      <div className="absolute bottom-10 w-full text-center pointer-events-none z-10">
         <div className="bg-zinc-950/80 inline-block px-4 py-2 rounded-lg font-mono text-xs text-zinc-400 backdrop-blur">
            Натисніть на екран щоб почати управління (Escape щоб вийти)
         </div>
      </div>

      <Canvas shadows camera={{ fov: 75, position: [0, 1.8, 0] }}>
        <World />
        {/* Bullets handled differently outside for performance, but we render spheres here */}
        <Bullets bullets={bullets} />
        <PlayerControls socket={socket} roomId={roomId} team={team} setBullets={setBullets} />
        {Object.entries(remotePlayers).map(([id, data]) => (
           <RemotePlayer key={id} data={data} />
        ))}
      </Canvas>
    </div>
  );
}
