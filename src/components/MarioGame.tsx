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
    let mario = { x: 50, y: 300, w: 20, h: 20, vY: 0, g: 0.5, j: -10, isJumping: false, dir: 1, runFrame: 0 };
    
    // Level design (expanded)
    let mapEndX = 5000;
    
    // Items
    let coins = [
      {x: 200, y: 200}, {x: 230, y: 200}, {x: 260, y: 200},
      {x: 500, y: 150}, {x: 530, y: 150}, {x: 560, y: 150},
      {x: 800, y: 250}, {x: 830, y: 250}, {x: 1000, y: 150}
    ];
    let enemies = [
      {x: 400, y: 300, d: -1}, {x: 600, y: 300, d: -1}, {x: 900, y: 300, d: -1},
      {x: 1200, y: 300, d: -1}, {x: 1500, y: 300, d: -1}
    ];
    let pipes = [
      {x: 350, y: 280, w: 40, h: 40},
      {x: 700, y: 260, w: 40, h: 60},
      {x: 1100, y: 240, w: 40, h: 80}
    ];
    let blocks = [
      {x: 200, y: 220}, {x: 230, y: 220}, {x: 260, y: 220},
      {x: 500, y: 170}, {x: 530, y: 170}, {x: 560, y: 170},
      {x: 650, y: 220}, {x: 680, y: 220}
    ];
    let clouds = [
      {x: 100, y: 50}, {x: 300, y: 80}, {x: 600, y: 60}, {x: 900, y: 90}, {x: 1200, y: 40}
    ];
    
    let currentScore = 0;
    let cameraX = 0;
    let keys: any = {};
    let frameCount = 0;

    const keyDownHandler = (e: KeyboardEvent) => { keys[e.key] = true; keys[e.key.toLowerCase()] = true; };
    const keyUpHandler = (e: KeyboardEvent) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; };
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    const checkCollisions = () => {
      // Floor
      let onGround = false;
      let groundY = 320;
      
      let platformHit = false;
      let hitPipe = false;
      let currBottom = mario.y + mario.h;
      let prevBottom = mario.y - mario.vY + mario.h;

      // Check pipes
      for (let p of pipes) {
          if (mario.x + mario.w > p.x && mario.x < p.x + p.w) {
              if (prevBottom <= p.y && currBottom >= p.y) {
                  mario.y = p.y - mario.h;
                  mario.vY = 0;
                  onGround = true;
                  hitPipe = true;
              } else if (mario.y < p.y + p.h && currBottom > p.y) {
                  // side collision
                  if (mario.x < p.x) mario.x = p.x - mario.w;
                  else mario.x = p.x + p.w;
              }
          }
      }

      // Check blocks
      for (let b of blocks) {
          if (mario.x + mario.w > b.x && mario.x < b.x + 20) {
              if (prevBottom <= b.y && currBottom >= b.y) {
                  mario.y = b.y - mario.h;
                  mario.vY = 0;
                  onGround = true;
                  platformHit = true;
              } else if (mario.y - mario.vY >= b.y + 20 && mario.y <= b.y + 20) {
                  // hit block from below
                  mario.y = b.y + 20;
                  mario.vY = 0;
              }
          }
      }

      if (!hitPipe && !platformHit && currBottom >= groundY) {
          mario.y = groundY - mario.h;
          mario.vY = 0;
          onGround = true;
      }
      mario.isJumping = !onGround;
    };

    const update = () => {
      if ((window as any).__GAME_PAUSED__) {
        animId = requestAnimationFrame(update);
        return;
      }
      if (gameOver) return;
      frameCount++;

      // Physics
      mario.vY += mario.g;
      mario.y += mario.vY;

      checkCollisions();

      if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && !mario.isJumping) {
          mario.vY = mario.j;
          mario.isJumping = true;
      }
      
      let moving = false;
      if (keys['ArrowRight'] || keys['d']) {
          mario.x += 1.33;
          mario.dir = 1;
          moving = true;
      }
      if (keys['ArrowLeft'] || keys['a']) {
          if (mario.x > 0) mario.x -= 1.33;
          mario.dir = -1;
          moving = true;
      }

      if (moving && !mario.isJumping) mario.runFrame += 0.2;
      else if (!moving) mario.runFrame = 0;

      // Enemy logic
      enemies.forEach(e => {
          e.x += e.d * 1.5;
          // Reverse at obstacles or arbitrary distance
          if (frameCount % 120 === 0 && Math.random() > 0.5) e.d *= -1;
          
          if (Math.abs(mario.x - e.x) < 20 && Math.abs(mario.y - (e.y - 20)) < 20) {
              if (mario.vY > 0 && mario.y < e.y - 10) { // stomped
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
      for (let i = coins.length - 1; i >= 0; i--) {
          let c = coins[i];
          if (Math.abs(mario.x - c.x) < 20 && Math.abs(mario.y - c.y) < 20) {
              coins.splice(i, 1);
              currentScore += 10;
              setScore(currentScore);
          }
      }

      // Draw
      ctx.fillStyle = '#5c94fc'; // Classic Sky Blue
      ctx.fillRect(0, 0, 400, 350);
      
      // Camera pan
      let targetCameraX = mario.x - 150;
      if (targetCameraX < 0) targetCameraX = 0;
      cameraX = targetCameraX;

      const drawCloud = (cx: number, cy: number) => {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(cx, cy, 15, 0, Math.PI*2);
          ctx.arc(cx+20, cy-10, 20, 0, Math.PI*2);
          ctx.arc(cx+40, cy, 15, 0, Math.PI*2);
          ctx.fill();
      };
      
      clouds.forEach(c => drawCloud(c.x - cameraX * 0.5, c.y));

      // Ground (brick pattern)
      ctx.fillStyle = '#c84c0c';
      ctx.fillRect(0, 320, 400, 30);
      ctx.fillStyle = '#000';
      for(let i=0; i<400; i+=20) {
          let groundX = ((i + cameraX) % 20);
          ctx.strokeRect(i - groundX, 320, 20, 15);
          ctx.strokeRect(i - groundX - 10, 335, 20, 15);
      }

      // Pipes
      pipes.forEach(p => {
          let px = p.x - cameraX;
          if (px > -50 && px < 450) {
              ctx.fillStyle = '#10ad10';
              ctx.fillRect(px, p.y, p.w, p.h);
              ctx.fillStyle = '#28e828';
              ctx.fillRect(px + 4, p.y, 8, p.h); // highlight
              ctx.fillStyle = '#000';
              ctx.strokeRect(px, p.y, p.w, p.h);
              ctx.fillRect(px - 4, p.y - 10, p.w + 8, 10);
              ctx.fillStyle = '#10ad10';
              ctx.fillRect(px - 3, p.y - 9, p.w + 6, 8);
          }
      });

      // Blocks
      blocks.forEach(b => {
          let bx = b.x - cameraX;
          if (bx > -30 && bx < 430) {
              ctx.fillStyle = '#cc5c00';
              ctx.fillRect(bx, b.y, 20, 20);
              ctx.fillStyle = '#000';
              ctx.strokeRect(bx, b.y, 20, 20);
              ctx.beginPath();
              ctx.moveTo(bx + 10, b.y); ctx.lineTo(bx + 10, b.y + 20);
              ctx.moveTo(bx, b.y + 10); ctx.lineTo(bx + 20, b.y + 10);
              ctx.stroke();
          }
      });

      // Coins
      ctx.fillStyle = '#f8d820';
      coins.forEach(c => {
          let cx = c.x - cameraX;
          if (cx > -20 && cx < 420) {
              ctx.beginPath();
              ctx.ellipse(cx+10, c.y+10, Math.sin(frameCount * 0.1) * 6 + 6, 8, 0, 0, Math.PI*2);
              ctx.fill();
              ctx.stroke();
          }
      });

      // Enemies (Goomba-like)
      enemies.forEach(e => {
          let ex = e.x - cameraX;
          if (ex > -30 && ex < 430) {
              ctx.fillStyle = '#8b2413';
              ctx.beginPath();
              ctx.moveTo(ex + 10, e.y - 20);
              ctx.lineTo(ex + 20, e.y);
              ctx.lineTo(ex, e.y);
              ctx.fill();
              // eyes
              ctx.fillStyle = '#fff';
              ctx.fillRect(ex + 4, e.y - 12, 4, 6);
              ctx.fillRect(ex + 12, e.y - 12, 4, 6);
              ctx.fillStyle = '#000';
              ctx.fillRect(ex + 5, e.y - 10, 2, 4);
              ctx.fillRect(ex + 13, e.y - 10, 2, 4);
          }
      });

      // Mario Draw (simple 8-bit style representation)
      let mx = mario.x - cameraX;
      ctx.fillStyle = '#f00'; // Hat/shirt
      ctx.fillRect(mx + 4, mario.y - 4, 12, 4);
      ctx.fillRect(mx + 2, mario.y, 16, 10);
      ctx.fillStyle = '#fc9838'; // face
      ctx.fillRect(mx + (mario.dir===1 ? 8 : 2), mario.y, 10, 8);
      ctx.fillStyle = '#000'; // eye
      ctx.fillRect(mx + (mario.dir===1 ? 14 : 4), mario.y + 2, 2, 2);
      ctx.fillStyle = '#00f'; // overalls
      ctx.fillRect(mx + 4, mario.y + 10, 12, 8);
      
      // basic leg animation
      ctx.fillStyle = '#a05000'; // shoes
      if (Math.floor(mario.runFrame) % 2 === 0 || mario.isJumping) {
          ctx.fillRect(mx + 2, mario.y + 18, 6, 4);
          ctx.fillRect(mx + 12, mario.y + 18, 6, 4);
      } else {
          ctx.fillRect(mx + 6, mario.y + 16, 8, 4);
      }

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
      <canvas ref={canvasRef} width={400} height={350} className="bg-sky-500 rounded shadow-xl max-w-full h-auto object-contain" />
      {gameOver && <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-4 py-2 bg-red-600 rounded text-white font-bold hover:bg-red-500">Заново</button>}
    </div>
  );
}
