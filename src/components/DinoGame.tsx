/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RotateCcw, Flame } from 'lucide-react';

interface DinoProps {
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

const playDinoSound = (type: 'jump' | 'milestone' | 'crash') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.setValueAtTime(550, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'milestone') {
      const notes = [600, 600];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + idx * 0.1 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.15);
      });
    } else if (type === 'crash') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
};

export default function DinoGame({ highScore, onUpdateHighScore }: DinoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // High performance game state refs for Canvas Loop
  const stateRef = useRef({
    score: 0,
    highScore: highScore,
    dinoY: 0,
    dinoVelocityY: 0,
    isJumping: false,
    isDucking: false,
    speed: 5.5,
    obstacles: [] as { x: number; width: number; height: number; type: 'cactus' | 'bird'; y: number }[],
    groundY: 120,
    lastObstacleSpawn: 0,
    animationFrameId: 0,
    dinoFrame: 0,
    cloudDelay: 0,
    clouds: [] as { x: number; y: number; speed: number }[]
  });

  // Sync external record to stateRef
  useEffect(() => {
    stateRef.current.highScore = highScore;
  }, [highScore]);

  // Handle Controls Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stateRef.current.isDucking = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stateRef.current.isDucking = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  // Screen actions
  const jump = () => {
    const s = stateRef.current;
    if (!s.isJumping) {
      s.isJumping = true;
      s.dinoVelocityY = -9.2; // jump strength
      playDinoSound('jump');
    }
  };

  const handleStartGame = () => {
    setGameOver(false);
    setGameStarted(true);
    setScore(0);

    const s = stateRef.current;
    s.score = 0;
    s.dinoY = 0;
    s.dinoVelocityY = 0;
    s.isJumping = false;
    s.isDucking = false;
    s.speed = 4.8;
    s.obstacles = [];
    s.clouds = [];
    s.lastObstacleSpawn = 0;

    // Start 60fps canvas loop
    if (s.animationFrameId) cancelAnimationFrame(s.animationFrameId);
    s.animationFrameId = requestAnimationFrame(gameLoop);
    playDinoSound('jump');
  };

  const handleGameOver = () => {
    setGameOver(true);
    playDinoSound('crash');
    cancelAnimationFrame(stateRef.current.animationFrameId);
  };

  // Main high-performance game loop (60FPS Canvas render)
  const gameLoop = (timestamp: number) => {
    if ((window as any).__GAME_PAUSED__) {
      stateRef.current.animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Base Physics update
    s.score += 0.15;
    const currentScoreInt = Math.floor(s.score);
    if (currentScoreInt > 0 && currentScoreInt % 100 === 0 && Math.floor(s.score - 0.15) % 100 !== 0) {
      playDinoSound('milestone');
    }

    setScore(currentScoreInt);
    if (currentScoreInt > s.highScore) {
      s.highScore = currentScoreInt;
      onUpdateHighScore(currentScoreInt);
    }

    // Dino Gravity physics
    s.dinoY += s.dinoVelocityY;
    if (s.dinoY < 0) {
      s.dinoVelocityY += 0.44; // gravity constant speed
    } else {
      s.dinoY = 0;
      s.dinoVelocityY = 0;
      s.isJumping = false;
    }

    // Dynamic speeds boost
    s.speed = 4.5 + Math.min(6, s.score / 250);

    // 3. Clouds generation
    if (timestamp - s.cloudDelay > 3000) {
      s.clouds.push({
        x: canvas.width + 20,
        y: 20 + Math.random() * 40,
        speed: 0.5 + Math.random() * 0.5
      });
      s.cloudDelay = timestamp + Math.random() * 1500;
    }
    s.clouds = s.clouds.filter(cloud => cloud.x > -60);
    s.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      ctx.fillStyle = '#1f2937'; // neutral slate
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 8, 0, Math.PI * 2);
      ctx.arc(cloud.x + 8, cloud.y - 4, 10, 0, Math.PI * 2);
      ctx.arc(cloud.x + 16, cloud.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Ground Draw Line
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, s.groundY + 28);
    ctx.lineTo(canvas.width, s.groundY + 28);
    ctx.stroke();

    // 5. Draw Obstacles (Cacti or birds) and Check collisions
    if (timestamp - s.lastObstacleSpawn > 1800 - Math.min(800, s.score * 1.5)) {
      const type = s.score > 250 && Math.random() < 0.28 ? 'bird' : 'cactus';
      const width = type === 'cactus' ? 12 + Math.floor(Math.random() * 10) : 18;
      const height = type === 'cactus' ? 20 + Math.floor(Math.random() * 18) : 14;
      const obstacleYOffset = type === 'bird' ? (Math.random() < 0.5 ? 40 : 15) : 0;

      s.obstacles.push({
        x: canvas.width + 10,
        width,
        height,
        type,
        y: s.groundY + 28 - height - obstacleYOffset
      });
      s.lastObstacleSpawn = timestamp + Math.random() * 400;
    }

    s.obstacles = s.obstacles.filter(o => o.x > -50);

    let hit = false;
    s.obstacles.forEach((obs) => {
      obs.x -= s.speed;

      // Draw obstacle
      ctx.fillStyle = obs.type === 'bird' ? '#f43f5e' : '#a1a1aa'; // red for bird, zinc for cacti
      if (obs.type === 'cactus') {
        // Draw simple rustic pixel-art cactus
        ctx.fillRect(obs.x + obs.width / 2 - 2, obs.y, 4, obs.height);
        ctx.fillRect(obs.x, obs.y + obs.height * 0.3, obs.width, 3);
        ctx.fillRect(obs.x, obs.y + obs.height * 0.3 - 4, 3, 4);
        ctx.fillRect(obs.x + obs.width - 3, obs.y + obs.height * 0.3 - 4, 3, 4);
      } else {
        // Draw simple bird flapping wing matching s.dinoFrame
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + (Math.floor(timestamp / 120) % 2 === 0 ? 0 : obs.height));
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Check collision coordinates
      const dinoHeight = s.isDucking ? 16 : 28;
      const dinoWidth = s.isDucking ? 26 : 18;
      const dinoLeft = 40;
      const dinoTop = s.groundY + 28 - dinoHeight + s.dinoY;

      if (
        obs.x < dinoLeft + dinoWidth &&
        obs.x + obs.width > dinoLeft &&
        obs.y < dinoTop + dinoHeight &&
        obs.y + obs.height > dinoTop
      ) {
        hit = true;
      }
    });

    if (hit) {
      handleGameOver();
      return;
    }

    // 6. Draw Dinosaur
    s.dinoFrame++;
    ctx.fillStyle = '#f4f4f5'; // neon zinc white
    
    const dinoLeft = 40;
    const dinoHeight = s.isDucking ? 16 : 28;
    const dinoWidth = s.isDucking ? 26 : 18;
    const dinoTop = s.groundY + 28 - dinoHeight + s.dinoY;

    // Head, Eyes and Frame leg toggling
    ctx.fillRect(dinoLeft, dinoTop, dinoWidth, dinoHeight);
    ctx.fillStyle = '#09090b'; // eyes
    ctx.fillRect(dinoLeft + (s.isDucking ? 18 : 12), dinoTop + 4, 2, 2);

    // simple leg oscillation on ground
    if (!s.isJumping) {
      ctx.fillStyle = '#f4f4f5';
      const legOffset = (Math.floor(s.dinoFrame / 6) % 2 === 0) ? 0 : 4;
      ctx.fillRect(dinoLeft + 2, dinoTop + dinoHeight, 3, 3);
      ctx.fillRect(dinoLeft + dinoWidth - 5, dinoTop + dinoHeight, 3, 3);
    }

    s.animationFrameId = requestAnimationFrame(gameLoop);
  };

  // Safe window unmounting
  useEffect(() => {
    return () => {
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full text-zinc-100 p-4 font-mono select-none" ref={containerRef}>
      
      {/* Upper header statistics */}
      <div className="w-full max-w-sm flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Рахунок</span>
          <span className="text-xl font-bold font-mono text-zinc-200">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/20 border border-amber-900/40 rounded text-amber-400">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-bold leading-none">{highScore}</span>
        </div>
      </div>

      {/* Primary Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative my-auto">
        <div className="relative bg-zinc-950 border border-zinc-900 rounded shadow-inner p-1 overflow-hidden" onClick={gameStarted && !gameOver ? jump : undefined}>
          
          <canvas
            ref={canvasRef}
            width={340}
            height={160}
            className="block max-w-full h-auto cursor-pointer"
          />

          {/* Screen Play overlays */}
          {(!gameStarted || gameOver) && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-20">
              {gameOver ? (
                <>
                  <div className="text-red-500 font-bold tracking-widest text-sm uppercase animate-pulse mb-1">ГРУ ЗАКІНЧЕНО</div>
                  <div className="text-xs text-zinc-500 mb-6 font-mono">Ваш результат: {score} м.</div>
                  <button
                    onClick={handleStartGame}
                    id="dino-retry-btn"
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 rounded text-xs text-zinc-100 font-bold transition active:scale-95 text-center justify-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-0.5" /> Спробувати знову
                  </button>
                </>
              ) : (
                <>
                  <div className="text-zinc-300 font-extrabold tracking-wider text-base mb-2 select-none uppercase flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" /> НОСТАЛЬГІЙНИЙ ДИНО
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-5 max-w-[200px] leading-relaxed">
                    Натискайте <kbd className="px-1 py-0.2 bg-zinc-900 border border-zinc-850 rounded">Space</kbd> або <kbd className="px-1 py-0.2 bg-zinc-900 border border-zinc-850 rounded">Up</kbd> щоб стрибати, та <kbd className="px-1 py-0.2 bg-zinc-900 border border-zinc-850 rounded">Down</kbd> для пригинання.
                  </p>
                  <button
                    onClick={handleStartGame}
                    id="dino-start-btn"
                    className="flex items-center gap-1.5 px-5 py-2 hover:bg-zinc-200 bg-white border border-transparent rounded text-xs text-zinc-950 font-extrabold transition active:scale-95 shadow-lg shadow-white/5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current mr-0.5" /> Грати
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual interactive buttons on screen (JUMP / DUCK) for touch devices */}
      {gameStarted && !gameOver && (
        <div className="w-full max-w-sm flex justify-center gap-4 pt-4">
          <button
            onTouchStart={() => { stateRef.current.isDucking = true; }}
            onTouchEnd={() => { stateRef.current.isDucking = false; }}
            onMouseDown={() => { stateRef.current.isDucking = true; }}
            onMouseUp={() => { stateRef.current.isDucking = false; }}
            id="dino-duck-btn"
            className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 font-bold active:bg-zinc-800 focus:outline-none"
          >
            ПРИГИНАТИСЬ (Down)
          </button>
          
          <button
            onClick={jump}
            id="dino-jump-btn"
            className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded text-xs font-extrabold active:scale-95 focus:outline-none"
          >
            СТРИБОК (Space)
          </button>
        </div>
      )}

    </div>
  );
}
