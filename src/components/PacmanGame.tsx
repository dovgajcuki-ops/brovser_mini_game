/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

export default function PacmanGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pacman = { x: 50, y: 50, r: 15, v: 2, dir: 0 }; // 0: right, 1: down, 2: left, 3: up
    const dots = Array.from({ length: 20 }, () => ({ x: Math.random() * 380 + 10, y: Math.random() * 380 + 10, eaten: false }));

    const update = () => {
      if (gameOver) return;
      if (pacman.dir === 0) pacman.x += pacman.v;
      if (pacman.dir === 1) pacman.y += pacman.v;
      if (pacman.dir === 2) pacman.x -= pacman.v;
      if (pacman.dir === 3) pacman.y -= pacman.v;

      pacman.x = (pacman.x + 400) % 400;
      pacman.y = (pacman.y + 400) % 400;

      let newScore = score;
      dots.forEach(d => {
        if (!d.eaten) {
          const dist = Math.hypot(pacman.x - d.x, pacman.y - d.y);
          if (dist < pacman.r) {
            d.eaten = true;
            newScore += 10;
          }
        }
      });
      if (newScore !== score) setScore(newScore);

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 400);

      // Draw dots
      ctx.fillStyle = '#fde047';
      dots.forEach(d => {
        if (!d.eaten) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw pacman
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      const mouthOpen = Math.sin(Date.now() / 100) * 0.5 + 0.5; // 0 to 1
      const startAngle = pacman.dir * Math.PI / 2 + 0.2 * mouthOpen;
      const endAngle = pacman.dir * Math.PI / 2 + Math.PI * 2 - 0.2 * mouthOpen;
      ctx.arc(pacman.x, pacman.y, pacman.r, startAngle, endAngle);
      ctx.lineTo(pacman.x, pacman.y);
      ctx.fill();

      if (dots.every(d => d.eaten)) {
        setGameOver(true);
        if (newScore > highScore) onUpdateHighScore(newScore);
      } else {
        animId = requestAnimationFrame(update);
      }
    };

    animId = requestAnimationFrame(update);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') pacman.dir = 0;
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') pacman.dir = 1;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') pacman.dir = 2;
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') pacman.dir = 3;
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [score, gameOver]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xl font-bold font-mono tracking-widest text-yellow-500 mb-4">РАХУНОК: {score}</div>
      <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950 border-4 border-blue-900 rounded-lg shadow-xl shadow-blue-900/20" />
      {gameOver && <div className="mt-4 text-green-400 font-bold">Всі крапки зібрані!</div>}
    </div>
  );
}
