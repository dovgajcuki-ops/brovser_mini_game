/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

export default function SonicGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sonic = { x: 50, y: 150, r: 15, vY: 0, g: 0.8, isJumping: false, speed: 5 };
    let rings: {x: number, y: number}[] = [{x: 400, y: 120}, {x: 600, y: 100}, {x: 800, y: 150}];
    let spikes: {x: number, y: number}[] = [{x: 500, y: 150}, {x: 900, y: 150}];
    
    let currentScore = 0;
    let frame = 0;

    const jump = () => {
        if (!sonic.isJumping) {
            sonic.vY = -12;
            sonic.isJumping = true;
        }
    };
    
    const keyDownHandler = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') jump(); };
    window.addEventListener("keydown", keyDownHandler);

    const update = () => {
      if (gameOver) return;

      sonic.vY += sonic.g;
      sonic.y += sonic.vY;

      if (sonic.y > 150) {
          sonic.y = 150;
          sonic.isJumping = false;
      }

      ctx.fillStyle = '#0ea5e9'; // sky
      ctx.fillRect(0, 0, 400, 200);

      // Floor
      ctx.fillStyle = '#4ade80'; // grass
      ctx.fillRect(0, 165, 400, 35);

      // Move world
      sonic.speed += 0.001;
      
      // Draw rings
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      for (let i = rings.length - 1; i >= 0; i--) {
          let r = rings[i];
          r.x -= sonic.speed;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 10, 0, Math.PI*2);
          ctx.stroke();

          // Collect
          if (Math.hypot(sonic.x - r.x, sonic.y - r.y) < 25) {
              rings.splice(i, 1);
              rings.push({x: Math.random() * 400 + 400, y: Math.random() * 50 + 100});
              currentScore += 100;
              setScore(currentScore);
          } else if (r.x < -20) {
              rings.splice(i, 1);
              rings.push({x: Math.random() * 400 + 400, y: Math.random() * 50 + 100});
          }
      }

      // Draw Spikes
      ctx.fillStyle = '#94a3b8';
      for (let i = spikes.length - 1; i >= 0; i--) {
          let s = spikes[i];
          s.x -= sonic.speed;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y + 15);
          ctx.lineTo(s.x + 10, s.y - 10);
          ctx.lineTo(s.x + 20, s.y + 15);
          ctx.fill();

          // Hit
          if (sonic.x > s.x && sonic.x < s.x + 20 && sonic.y > s.y - 10) {
              setGameOver(true);
              if (currentScore > highScore) onUpdateHighScore(currentScore);
          }

          if (s.x < -20) {
              spikes.splice(i, 1);
              spikes.push({x: Math.random() * 600 + 400, y: 150});
          }
      }

      // Draw Sonic
      ctx.fillStyle = sonic.isJumping ? '#2563eb' : '#1d4ed8';
      ctx.beginPath();
      ctx.arc(sonic.x, sonic.y, sonic.r, 0, Math.PI * 2);
      ctx.fill();

      frame++;
      if (!gameOver) animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", keyDownHandler);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center">
      <div className="absolute z-10 p-2 text-yellow-300 font-mono font-bold">{score} SCORE</div>
      <canvas ref={canvasRef} width={400} height={200} onClick={() => !gameOver && window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))} className="bg-sky-500 rounded border-4 border-blue-900 shadow-xl cursor-pointer" />
      {gameOver && <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-4 py-2 bg-blue-600 rounded text-white font-bold hover:bg-blue-500">Швидше!</button>}
    </div>
  );
}
