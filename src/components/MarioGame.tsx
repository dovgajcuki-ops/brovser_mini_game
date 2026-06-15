/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

export default function MarioGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let mario = { x: 50, y: 300, w: 20, h: 20, vY: 0, g: 0.5, j: -10, isJumping: false };
    let coins: {x: number, y: number}[] = [{x: 200, y: 250}, {x: 400, y: 200}, {x: 600, y: 250}];
    let enemies: {x: number, y: number, d: number}[] = [{x: 300, y: 300, d: -1}];
    
    let currentScore = 0;
    let cameraX = 0;
    let keys: any = {};

    const keyDownHandler = (e: KeyboardEvent) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; };
    const keyUpHandler = (e: KeyboardEvent) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    const update = () => {
      if (gameOver) return;

      // Physics
      mario.vY += mario.g;
      mario.y += mario.vY;

      if (mario.y >= 300) {
          mario.y = 300;
          mario.vY = 0;
          mario.isJumping = false;
      }

      if ((keys['ArrowUp'] || keys['w']) && !mario.isJumping) {
          mario.vY = mario.j;
          mario.isJumping = true;
      }
      if (keys['ArrowRight'] || keys['d']) {
          mario.x += 4;
          cameraX += 4;
      }
      if (keys['ArrowLeft'] || keys['a']) {
          if (mario.x > 0) mario.x -= 4;
      }

      // Enemy logic
      enemies.forEach(e => {
          e.x += e.d * 1.5;
          if (Math.abs(mario.x - e.x) < 20 && Math.abs(mario.y - e.y) < 20) {
              if (mario.vY > 0) { // stomped
                  e.y = 1000;
                  currentScore += 50;
                  setScore(currentScore);
                  mario.vY = -5;
              } else {
                  setGameOver(true);
                  if (currentScore > highScore) onUpdateHighScore(currentScore);
              }
          }
      });

      // Coin logic
      coins.forEach(c => {
          if (Math.abs(mario.x - c.x) < 20 && Math.abs(mario.y - c.y) < 20) {
              c.y = 1000;
              currentScore += 10;
              if ((currentScore % 100) === 0) enemies.push({x: mario.x + 400, y: 300, d: -1});
              coins.push({x: mario.x + 400 + Math.random()*200, y: 200 + Math.random()*50});
              setScore(currentScore);
          }
      });

      // Draw
      ctx.fillStyle = '#3b82f6'; // Sky
      ctx.fillRect(0, 0, 400, 350);
      
      // Ground
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(0, 320, 400, 30);

      const offset = (mario.x > 200) ? 200 - mario.x : 0;

      // Draw coins
      ctx.fillStyle = '#eab308';
      coins.forEach(c => {
          ctx.beginPath();
          ctx.arc(c.x + offset, c.y, 8, 0, Math.PI*2);
          ctx.fill();
      });

      // Draw enemies
      ctx.fillStyle = '#b91c1c';
      enemies.forEach(e => {
        ctx.fillRect(e.x + offset, e.y, 20, 20);
      });

      // Draw Mario
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(mario.x + offset, mario.y, mario.w, mario.h);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[400px] mb-2 px-2 text-white font-mono font-bold font-xl">
        <span>MARIO</span>
        <span>{score.toString().padStart(6, '0')}</span>
      </div>
      <canvas ref={canvasRef} width={400} height={350} className="bg-sky-500 rounded shadow-xl" />
      {gameOver && <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-4 py-2 bg-red-600 rounded text-white font-bold hover:bg-red-500">Заново</button>}
    </div>
  );
}
