/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

export default function DoodleJumpGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let doodle = { x: 150, y: 250, r: 15, v: 0, j: -8, g: 0.2 };
    let platforms: {x: number, y: number, w: number, h: number}[] = [];
    let currentScore = 0;
    
    // Init platforms
    for(let i=0; i<7; i++) {
        platforms.push({ x: Math.random() * 250, y: 400 - i * 60, w: 50, h: 10 });
    }

    let rightPressed = false;
    let leftPressed = false;

    const keyDownHandler = (e: KeyboardEvent) => { 
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') rightPressed = true; 
      else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') leftPressed = true; 
    };
    const keyUpHandler = (e: KeyboardEvent) => { 
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') rightPressed = false; 
      else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') leftPressed = false; 
    };
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    const update = () => {
      if (gameOver) return;

      // Draw
      ctx.fillStyle = '#fafafa'; // background
      ctx.fillRect(0, 0, 300, 400);

      // Grid
      ctx.strokeStyle = '#e5e5e5';
      for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke(); }
      for(let i=0; i<400; i+=20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(300, i); ctx.stroke(); }

      // Physics
      if (rightPressed) doodle.x += 4;
      if (leftPressed) doodle.x -= 4;
      if (doodle.x > 300) doodle.x = 0;
      if (doodle.x < 0) doodle.x = 300;

      doodle.v += doodle.g;
      doodle.y += doodle.v;

      if (doodle.y > 400) {
          setGameOver(true);
          if (currentScore > highScore) onUpdateHighScore(currentScore);
      }

      // Scroll view
      if (doodle.y < 200) {
        let diff = 200 - doodle.y;
        doodle.y = 200;
        platforms.forEach(p => p.y += diff);
        currentScore += Math.floor(diff / 10);
        setScore(currentScore);
      }

      // Collision
      platforms.forEach(p => {
        if (doodle.v > 0 && doodle.y + doodle.r > p.y && doodle.y + doodle.r < p.y + p.h && doodle.x > p.x - 10 && doodle.x < p.x + p.w + 10) {
          doodle.v = doodle.j;
        }
      });

      // Spawn new platforms
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].y > 400) {
            platforms.splice(i, 1);
            platforms.push({ x: Math.random() * 250, y: 0, w: 50, h: 10 });
        }
      }

      // Draw platforms
      ctx.fillStyle = '#84cc16';
      platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
      });

      // Draw doodle
      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.arc(doodle.x, doodle.y, doodle.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

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
      <div className="text-xl font-bold font-mono tracking-widest text-lime-400 mb-2">{score}</div>
      <canvas ref={canvasRef} width={300} height={400} className="bg-white border-2 border-zinc-700 rounded-lg shadow-xl" />
      {gameOver && <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-4 py-2 bg-lime-500 rounded text-zinc-900 font-bold hover:bg-lime-400">Стрибати знову</button>}
    </div>
  );
}
