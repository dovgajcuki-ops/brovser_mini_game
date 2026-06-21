/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

export default function DonkeyKongGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let player = { x: 50, y: 350, r: 10, vY: 0, j: -6, g: 0.3, isJumping: false };
    let barrels: {x: number, y: number, dir: number, speed: number}[] = [];
    let floors = [
        {x: 0, y: 380, w: 350},
        {x: 50, y: 300, w: 350},
        {x: 0, y: 220, w: 350},
        {x: 50, y: 140, w: 350},
        {x: 0, y: 60, w: 350}
    ];

    let keys: any = {};
    const keyDownHandler = (e: KeyboardEvent) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; };
    const keyUpHandler = (e: KeyboardEvent) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    let frame = 0;
    let currentScore = 0;

    const update = () => {
      if ((window as any).__GAME_PAUSED__) {
        animId = requestAnimationFrame(update);
        return;
      }
      if (gameOver) return;

      // Logic
      player.vY += player.g;
      if (player.vY > 8) player.vY = 8;
      player.y += player.vY;

      let onFloor = false;
      floors.forEach(f => {
          let prevBottom = player.y - player.vY + player.r;
          let currBottom = player.y + player.r;
          // Check if previously above or slightly inside, and currently below top of floor
          if (prevBottom <= f.y + 10 && currBottom >= f.y && player.x > f.x - player.r && player.x < f.x + f.w + player.r) {
              if (player.vY >= 0) {
                  player.y = f.y - player.r;
                  player.vY = 0;
                  player.isJumping = false;
                  onFloor = true;
              }
          }
      });

      if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && !player.isJumping && onFloor) {
          player.vY = player.j;
          player.isJumping = true;
      }
      if (keys['ArrowRight'] || keys['d']) player.x += 3;
      if (keys['ArrowLeft'] || keys['a']) player.x -= 3;
      if (player.x < 0) player.x = 0;
      if (player.x > 400) player.x = 400;

      // Barrels
      if (frame % 100 === 0) {
          barrels.push({x: 50, y: 40, dir: 1, speed: 2});
      }

      barrels.forEach((b) => {
          b.x += b.dir * b.speed;
          if (b.x > 380 && b.dir === 1) { b.dir = -1; b.y += 80; b.x = 380; currentScore += 10; setScore(currentScore);}
          if (b.x < 20 && b.dir === -1) { b.dir = 1; b.y += 80; b.x = 20; currentScore += 10; setScore(currentScore);}

          if (Math.hypot(player.x - b.x, player.y - b.y) < player.r + 8) {
              setGameOver(true);
              if (currentScore > highScore) onUpdateHighScore(currentScore);
          }
      });

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 400, 400);

      ctx.fillStyle = '#dc2626'; // Red girders
      floors.forEach(f => {
          ctx.fillRect(f.x, f.y, f.w, 10);
      });

      ctx.fillStyle = '#8b5cf6'; // Kong platform mock
      ctx.fillRect(20, 20, 60, 40);

      // Player
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.fill();

      // Barrels
      ctx.fillStyle = '#d97706';
      barrels.forEach(b => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, 8, 0, Math.PI*2);
          ctx.fill();
      });

      frame++;
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
        <div className="text-zinc-500 mb-2 font-mono tracking-widest text-sm">SCORE: <span className="text-white font-bold">{score}</span></div>
        <canvas ref={canvasRef} width={400} height={400} className="border-4 border-red-900 rounded bg-black max-w-full h-auto object-contain" />
        {gameOver && <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-6 py-2 bg-red-600 text-white font-bold rounded">RESTART</button>}
    </div>
  );
}
