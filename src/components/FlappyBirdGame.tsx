/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

export default function FlappyBirdGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let bird = { x: 50, y: 150, v: 0, g: 0.2, j: -4.5 };
    let pipes: {x: number, y: number}[] = [];
    let frame = 0;
    let currentScore = 0;

    const jump = () => { if (!gameOver) bird.v = bird.j; };
    const keyDownHandler = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') jump(); };
    window.addEventListener("keydown", keyDownHandler);

    const update = () => {
      if (gameOver) return;
      ctx.fillStyle = '#0ea5e9'; // sky
      ctx.fillRect(0, 0, 300, 400);

      bird.v += bird.g;
      bird.y += bird.v;

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, 10, 0, Math.PI * 2);
      ctx.fill();

      if (frame % 100 === 0) {
        pipes.push({ x: 300, y: Math.random() * 200 + 50 });
      }

      ctx.fillStyle = '#22c55e';
      for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= 2;
        ctx.fillRect(p.x, 0, 40, p.y);
        ctx.fillRect(p.x, p.y + 100, 40, 400 - p.y - 100);

        if (p.x === bird.x) {
          currentScore++;
          setScore(currentScore);
        }

        // Collision
        if (bird.x + 10 > p.x && bird.x - 10 < p.x + 40 && (bird.y - 10 < p.y || bird.y + 10 > p.y + 100)) {
          setGameOver(true);
          if (currentScore > highScore) onUpdateHighScore(currentScore);
        }

        if (p.x < -40) pipes.splice(i, 1);
      }

      if (bird.y + 10 > 400 || bird.y - 10 < 0) {
         setGameOver(true);
         if (currentScore > highScore) onUpdateHighScore(currentScore);
      }

      frame++;
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", keyDownHandler);
    };
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-bold font-mono tracking-widest text-zinc-100 mb-2 absolute z-10 select-none pointer-events-none mt-4 outline-text">{score}</div>
      <canvas ref={canvasRef} width={300} height={400} onClick={() => !gameOver && window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))} className="bg-sky-500 border-4 border-zinc-900 rounded-lg cursor-pointer" />
      {gameOver && <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-4 py-2 bg-yellow-500 text-zinc-950 font-bold rounded shadow-lg hover:bg-yellow-400">Спробувати ще</button>}
    </div>
  );
}
