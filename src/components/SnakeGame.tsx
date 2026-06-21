/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface SnakeProps {
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const CELL_SIZE = 20;
const GRID_ROWS = 20;
const GRID_COLS = 20;

// Synth sound effects for Snake
const playSnakeSound = (type: 'eat' | 'crash' | 'move') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'eat') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'crash') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Sound skipped
  }
};

export default function SnakeGame({ highScore, onUpdateHighScore }: SnakeProps) {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(130); // in ms per frame

  const gameLoopRef = useRef<any>(null);
  const dirRef = useRef<Direction>('UP');

  // Sync ref to avoid input lag/double pressing direction overwrite bugs in rapid ticks
  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);

  // Handle Keyboard Arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || isGameOver) return;
      
      let nextDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dirRef.current !== 'DOWN') nextDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dirRef.current !== 'UP') nextDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dirRef.current !== 'RIGHT') nextDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dirRef.current !== 'LEFT') nextDir = 'RIGHT';
          break;
      }

      if (nextDir) {
        e.preventDefault();
        setDirection(nextDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isGameOver]);

  // Game Loop
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    gameLoopRef.current = setInterval(() => {
      if ((window as any).__GAME_PAUSED__) return;
      moveSnake();
    }, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isStarted, isGameOver, snake, direction, speed]);

  // Generate Food at safe spot
  const generateNewFood = (currentSnake: Position[]): Position => {
    let attempts = 0;
    while (attempts < 200) {
      const rx = Math.floor(Math.random() * GRID_COLS);
      const ry = Math.floor(Math.random() * GRID_ROWS);
      const onSnake = currentSnake.some(cell => cell.x === rx && cell.y === ry);
      if (!onSnake) {
        return { x: rx, y: ry };
      }
      attempts++;
    }
    return { x: 0, y: 0 };
  };

  // Move core logic
  const moveSnake = () => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const dir = dirRef.current;
      let newHead = { ...head };

      switch (dir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // 1. Boundary Wall check
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_COLS ||
        newHead.y < 0 ||
        newHead.y >= GRID_ROWS
      ) {
        handleGameOver();
        return prevSnake;
      }

      // 2. Self-collision check
      const collidedWithSelf = prevSnake.some(
        (cell, index) => index !== 0 && cell.x === newHead.x && cell.y === newHead.y
      );
      if (collidedWithSelf) {
        handleGameOver();
        return prevSnake;
      }

      const nextSnake = [newHead, ...prevSnake];

      // 3. Food check
      if (newHead.x === food.x && newHead.y === food.y) {
        playSnakeSound('eat');
        setScore((prevScore) => {
          const s = prevScore + 10;
          if (s > highScore) {
            onUpdateHighScore(s);
          }
          return s;
        });
        
        // Slightly increase speed
        setSpeed((prevSpeed) => Math.max(50, prevSpeed - 2));
        setFood(generateNewFood(prevSnake));
      } else {
        nextSnake.pop(); // remove tail
      }

      return nextSnake;
    });
  };

  const handleGameOver = () => {
    playSnakeSound('crash');
    setIsGameOver(true);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  };

  const handleStartGame = () => {
    playSnakeSound('eat');
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]);
    setFood({ x: 5, y: 5 });
    setDirection('UP');
    setScore(0);
    setSpeed(130);
    setIsGameOver(false);
    setIsStarted(true);
  };

  const handleManualDirection = (nextDir: Direction) => {
    if (!isStarted || isGameOver) return;
    const oppositeDir: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (oppositeDir[nextDir] !== dirRef.current) {
      setDirection(nextDir);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full text-zinc-100 p-4 font-mono select-none">
      
      {/* Game Header Stats */}
      <div className="w-full max-w-sm flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Рахунок</span>
          <span className="text-xl font-bold font-mono tracking-wide text-zinc-200">{score}</span>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/20 border border-amber-900/40 rounded text-amber-400">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-bold leading-none">{highScore}</span>
        </div>
      </div>

      {/* Main Board Stage container with ResizeObserver-like scale safety */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative my-auto">
        <div 
          id="snake-board-grid"
          className="relative bg-zinc-950 border border-zinc-900 rounded p-1 shadow-inner overflow-hidden flex"
          style={{
            width: `${GRID_COLS * CELL_SIZE}px`,
            height: `${GRID_ROWS * CELL_SIZE}px`
          }}
        >
          {/* Grid background markers for minimalist touch */}
          <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 pointer-events-none opacity-5">
            {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => (
              <div key={i} className="border border-zinc-100" />
            ))}
          </div>

          {/* Snake rendering */}
          {snake.map((segment, index) => {
            const isHead = index === 0;
            return (
              <div
                key={index}
                className="absolute rounded-sm transition-all duration-75"
                style={{
                  width: `${CELL_SIZE - 2}px`,
                  height: `${CELL_SIZE - 2}px`,
                  left: `${segment.x * CELL_SIZE + 1}px`,
                  top: `${segment.y * CELL_SIZE + 1}px`,
                  backgroundColor: isHead ? '#f4f4f5' : '#52525b',
                  zIndex: isHead ? 10 : 1,
                  boxShadow: isHead ? '0 0 8px #f4f4f5' : 'none'
                }}
              />
            );
          })}

          {/* Food rendering */}
          <div
            className="absolute rounded-full flex items-center justify-center animate-pulse"
            style={{
              width: `${CELL_SIZE - 2}px`,
              height: `${CELL_SIZE - 2}px`,
              left: `${food.x * CELL_SIZE + 1}px`,
              top: `${food.y * CELL_SIZE + 1}px`,
              backgroundColor: '#a21caf', // vibrant fuchsia/pink accent
              boxShadow: '0 0 10px #a21caf',
            }}
          >
            <div className="w-1.5 h-1.5 bg-pink-100 rounded-full" />
          </div>

          {/* Start and Over Prompts Overlay */}
          {(!isStarted || isGameOver) && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20">
              {isGameOver ? (
                <>
                  <div className="text-red-500 font-bold tracking-widest text-lg mb-1 uppercase animate-pulse">ГРУ ЗАКІНЧЕНО</div>
                  <div className="text-xs text-zinc-500 mb-6 font-mono">Чудовий результат: {score} очок!</div>
                  <button
                    onClick={handleStartGame}
                    id="snake-retry-btn"
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 rounded text-sm text-zinc-100 hover:bg-zinc-800 font-semibold transition active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 mr-0.5" /> Спробувати ще
                  </button>
                </>
              ) : (
                <>
                  <div className="text-zinc-400 font-extrabold tracking-wider text-xl mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-zinc-400" /> КЛАСИЧНА ЗМІЙКА
                  </div>
                  <p className="text-xs text-zinc-500 mb-6 max-w-xs leading-relaxed">
                    Керуйте змійкою за допомогою клавіш <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">W A S D</kbd> або екранного джойстика. Уникайте стін та власного хвоста.
                  </p>
                  <button
                    onClick={handleStartGame}
                    id="snake-start-btn"
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-transparent rounded text-sm text-zinc-950 hover:bg-zinc-200 font-bold transition active:scale-95 shadow-lg shadow-white/10"
                  >
                    <Play className="w-4 h-4 fill-current mr-0.5" /> Грати
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Touch Screen directional D-PAD Control Module */}
      <div className="w-full max-w-sm flex items-center justify-center pt-4">
        <div className="grid grid-cols-3 gap-2 w-36">
          <div />
          <button
            onClick={() => handleManualDirection('UP')}
            id="snake-dpad-up"
            className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />
          
          <button
            onClick={() => handleManualDirection('LEFT')}
            id="snake-dpad-left"
            className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-zinc-800" />
          </div>
          <button
            onClick={() => handleManualDirection('RIGHT')}
            id="snake-dpad-right"
            className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div />
          <button
            onClick={() => handleManualDirection('DOWN')}
            id="snake-dpad-down"
            className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <div />
        </div>
      </div>

    </div>
  );
}
