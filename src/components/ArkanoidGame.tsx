/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

export default function ArkanoidGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let ball = { x: 200, y: 300, r: 5, dx: 3, dy: -3 };
    let paddle = { x: 150, y: 380, w: 100, h: 10 };
    let blocks = Array.from({ length: 4 }, (_, r) => 
      Array.from({ length: 8 }, (_, c) => ({ x: c * 48 + 10, y: r * 20 + 30, w: 40, h: 15, active: true }))
    ).flat();

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
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 400);

      // Blocks
      ctx.fillStyle = '#06b6d4';
      blocks.forEach(b => {
        if (b.active) ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      // Paddle
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

      // Ball
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      // Physics
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall collision
      if (ball.x + ball.dx > 400 - ball.r || ball.x + ball.dx < ball.r) ball.dx = -ball.dx;
      if (ball.y + ball.dy < ball.r) ball.dy = -ball.dy;
      else if (ball.y + ball.dy > 400 - ball.r) {
        setGameOver(true);
        if (score > highScore) onUpdateHighScore(score);
      }

      // Paddle collision
      if (ball.y + ball.dy > paddle.y - ball.r && ball.y + ball.r < paddle.y + paddle.h && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
        ball.dy = -ball.dy;
        ball.dx = ((ball.x - (paddle.x + paddle.w / 2)) / paddle.w) * 5;
      }

      // Block collision
      blocks.forEach(b => {
        if (b.active) {
          if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
            ball.dy = -ball.dy;
            b.active = false;
            setScore(s => s + 10);
          }
        }
      });

      if (rightPressed && paddle.x < 400 - paddle.w) paddle.x += 5;
      else if (leftPressed && paddle.x > 0) paddle.x -= 5;

      if (blocks.every(b => !b.active)) {
        setGameOver(true);
        if (score > highScore) onUpdateHighScore(score);
      } else {
        animId = requestAnimationFrame(update);
      }
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
      <div className="text-sm font-mono tracking-widest text-cyan-500 mb-4 font-bold">ARCADE: {score}</div>
      <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl" />
      {gameOver && <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-4 py-2 bg-blue-600 rounded text-white font-bold">Грати знову</button>}
    </div>
  );
}
