/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const MAP = [
  "WWWWWWWWWWWWWWWWWWWW",
  "W........WW........W",
  "W.WW.WWW.WW.WWW.WW.W",
  "WoWW.WWW.WW.WWW.WWoW",
  "W..................W",
  "W.WW.W.WWWWWW.W.WW.W",
  "W....W...WW...W....W",
  "WWWW.WWW WW WWW.WWWW",
  "   W.W        W.W   ",
  "WWWW.W WW  WW W.WWWW",
  "       W    W       ",
  "WWWW.W WWWWWW W.WWWW",
  "   W.W        W.W   ",
  "WWWW.W WWWWWW W.WWWW",
  "W........WW........W",
  "W.WW.WWW.WW.WWW.WW.W",
  "Wo.W.....P......W.oW",
  "WW.W.W.WWWWWW.W.W.WW",
  "W....W...WW...W....W",
  "WWWWWWWWWWWWWWWWWWWW"
];

const CELL_SIZE = 20;

export default function PacmanGame({ highScore, onUpdateHighScore }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);

  // We use a ref to hold mutable state across renders/restarts without relying on useEffect dependencies
  // for the game loop, making manual restarts cleaner.
  const stateRef = useRef({
    started: false,
    score: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pacman = { x: 0, y: 0, r: 8, vx: 0, vy: 0, dir: 0, nextVx: 0, nextVy: 0, speed: 0.5 }; 
    let ghosts: any[] = [];
    let dots: any[] = [];
    let powerPellets: any[] = [];
    let powerTimer = 0;

    // Parse map
    const fixedMap = MAP.map(row => {
      let r = row;
      while(r.length < 20) r += "W";
      return r.substring(0, 20);
    });

    const initEntities = () => {
        ghosts = [];
        dots = [];
        powerPellets = [];
        pacman = { x: 0, y: 0, r: 8, vx: 0, vy: 0, dir: 0, nextVx: 0, nextVy: 0, speed: 0.5 };
        powerTimer = 0;

        for (let r = 0; r < 20; r++) {
          for (let c = 0; c < 20; c++) {
            const char = fixedMap[r][c];
            const cx = c * CELL_SIZE + CELL_SIZE / 2;
            const cy = r * CELL_SIZE + CELL_SIZE / 2;
            if (char === '.') dots.push({ x: cx, y: cy, eaten: false });
            if (char === 'o') powerPellets.push({ x: cx, y: cy, eaten: false });
            if (char === 'P') { pacman.x = cx; pacman.y = cy; }
          }
        }
        
        // Ghost start spots
        ghosts.push({ x: 9 * CELL_SIZE + 10, y: 9 * CELL_SIZE + 10, vx: 0, vy: -1.25, startSpeed: 1.25, color: '#ef4444' }); // Blinky
        ghosts.push({ x: 10 * CELL_SIZE + 10, y: 9 * CELL_SIZE + 10, vx: 0, vy: -1.25, startSpeed: 1.25, color: '#f472b6' }); // Pinky
        ghosts.push({ x: 9 * CELL_SIZE + 10, y: 10 * CELL_SIZE + 10, vx: 1.25, vy: 0, startSpeed: 1.25, color: '#38bdf8' }); // Inky
        ghosts.push({ x: 10 * CELL_SIZE + 10, y: 10 * CELL_SIZE + 10, vx: -1.25, vy: 0, startSpeed: 1.25, color: '#f97316' }); // Clyde
    };
    
    initEntities();
    stateRef.current.score = 0;

    const isWall = (c: number, r: number) => {
      if (c < 0 || c >= 20 || r < 0 || r >= 20) return false;
      return fixedMap[r][c] === 'W';
    };

    const collidesWithWall = (x: number, y: number, r: number) => {
      const corners = [
        { cx: x - r + 0.1, cy: y - r + 0.1 },
        { cx: x + r - 0.1, cy: y - r + 0.1 },
        { cx: x - r + 0.1, cy: y + r - 0.1 },
        { cx: x + r - 0.1, cy: y + r - 0.1 }
      ];
      for (let c of corners) {
        const gridX = Math.floor(c.cx / CELL_SIZE);
        const gridY = Math.floor(c.cy / CELL_SIZE);
        if (isWall(gridX, gridY)) return true;
      }
      return false;
    };

    const update = () => {
      if ((window as any).__GAME_PAUSED__) {
        animId = requestAnimationFrame(update);
        return;
      }
      if (gameOver || gameWin) {
         animId = requestAnimationFrame(update); // keep drawing last frame
         return; 
      }

      // Move pacman
      if (pacman.nextVx !== 0 || pacman.nextVy !== 0) {
        let tryNextX = pacman.x + pacman.nextVx * pacman.speed;
        let tryNextY = pacman.y + pacman.nextVy * pacman.speed;
        
        let targetX = pacman.x;
        let targetY = pacman.y;
        
        // Allowed to change if we are near the center of the current cell on the opposite axis
        const gridX = Math.floor(pacman.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
        const gridY = Math.floor(pacman.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
        
        const leeway = 4; // pixels of leeway to turn

        if (pacman.nextVx !== 0 && Math.abs(pacman.y - gridY) <= leeway) {
           if (!collidesWithWall(pacman.x + pacman.nextVx * pacman.speed, gridY, pacman.r)) {
               pacman.y = gridY;
               pacman.vx = pacman.nextVx;
               pacman.vy = pacman.nextVy;
               pacman.nextVx = 0;
               pacman.nextVy = 0;
           }
        }
        else if (pacman.nextVy !== 0 && Math.abs(pacman.x - gridX) <= leeway) {
           if (!collidesWithWall(gridX, pacman.y + pacman.nextVy * pacman.speed, pacman.r)) {
               pacman.x = gridX;
               pacman.vx = pacman.nextVx;
               pacman.vy = pacman.nextVy;
               pacman.nextVx = 0;
               pacman.nextVy = 0;
           }
        }
      }

      // Update direction for drawing mouth correctly
      if (pacman.vx > 0) pacman.dir = 0;
      else if (pacman.vy > 0) pacman.dir = 1;
      else if (pacman.vx < 0) pacman.dir = 2;
      else if (pacman.vy < 0) pacman.dir = 3;

      let tryX = pacman.x + pacman.vx * pacman.speed;
      let tryY = pacman.y + pacman.vy * pacman.speed;
      
      // wrap around
      if (tryX < -15) tryX = 415;
      if (tryX > 415) tryX = -15;

      if (!collidesWithWall(tryX, tryY, pacman.r)) {
        pacman.x = tryX;
        pacman.y = tryY;
      }

      if (powerTimer > 0) powerTimer--;

      let localScore = stateRef.current.score;
      let dotsEaten = 0;
      dots.forEach(d => {
        if (!d.eaten) {
            if (Math.hypot(pacman.x - d.x, pacman.y - d.y) < pacman.r + 3) {
              d.eaten = true;
              localScore += 10;
            }
        } else dotsEaten++;
      });
      let pelletsEaten = 0;
      powerPellets.forEach(d => {
        if (!d.eaten) {
            if (Math.hypot(pacman.x - d.x, pacman.y - d.y) < pacman.r + 5) {
              d.eaten = true;
              localScore += 50;
              powerTimer = 600; // ~10 seconds at 60fps
            }
        } else pelletsEaten++;
      });

      if (localScore !== stateRef.current.score) {
          stateRef.current.score = localScore;
          setScore(localScore);
      }

      // check win
      if (dotsEaten === dots.length && pelletsEaten === powerPellets.length) {
        setGameWin(true);
        if (localScore > highScore) onUpdateHighScore(localScore);
      }

      // Move ghosts
      ghosts.forEach(g => {
        let gx = g.x + g.vx;
        let gy = g.y + g.vy;
        
        if (gx < -10) gx = 410;
        if (gx > 410) gx = -10;

        const cgx = Math.floor(g.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE/2;
        const cgy = Math.floor(g.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE/2;
        
        let shouldTurn = false;
        if (g.vx > 0 && g.x <= cgx && gx >= cgx) shouldTurn = true;
        else if (g.vx < 0 && g.x >= cgx && gx <= cgx) shouldTurn = true;
        else if (g.vy > 0 && g.y <= cgy && gy >= cgy) shouldTurn = true;
        else if (g.vy < 0 && g.y >= cgy && gy <= cgy) shouldTurn = true;
        else if (g.vx === 0 && g.vy === 0) shouldTurn = true;

        if (shouldTurn) {
            const dirs = [
                { vx: g.startSpeed, vy: 0 },
                { vx: -g.startSpeed, vy: 0 },
                { vx: 0, vy: g.startSpeed },
                { vx: 0, vy: -g.startSpeed }
            ];
            
            const valid = dirs.filter(d => {
                if (d.vx === -g.vx && d.vy === -g.vy && (g.vx !== 0 || g.vy !== 0)) return false; // don't reverse unless forced
                const nextGridX = Math.floor(cgx / CELL_SIZE) + Math.sign(d.vx);
                const nextGridY = Math.floor(cgy / CELL_SIZE) + Math.sign(d.vy);
                return !isWall(nextGridX, nextGridY);
            });
            
            if (valid.length > 0) {
                // If there's an intersection or must turn
                const nextGridX = Math.floor(cgx / CELL_SIZE) + Math.sign(g.vx);
                const nextGridY = Math.floor(cgy / CELL_SIZE) + Math.sign(g.vy);
                if (valid.length > 1 || (g.vx === 0 && g.vy === 0) || isWall(nextGridX, nextGridY)) {
                    const nextDir = valid[Math.floor(Math.random() * valid.length)];
                    g.vx = nextDir.vx;
                    g.vy = nextDir.vy;
                }
            } else {
                // dead end, reverse
                g.vx = -g.vx;
                g.vy = -g.vy;
            }
            
            g.x = cgx;
            g.y = cgy;
            gx = g.x + g.vx;
            gy = g.y + g.vy;
        }

        if (!collidesWithWall(gx, gy, 7)) {
            g.x = gx;
            g.y = gy;
        }

        // Collision Check
        if (Math.hypot(pacman.x - g.x, pacman.y - g.y) < pacman.r + 7) {
            if (powerTimer > 0) {
                // Eat ghost
                g.x = 10 * CELL_SIZE + 10;
                g.y = 9 * CELL_SIZE + 10;
                localScore += 200;
                stateRef.current.score = localScore;
                setScore(localScore);
            } else {
                setGameOver(true);
                if (localScore > highScore) onUpdateHighScore(localScore);
            }
        }
      });

      // Draw
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 400, 400);

      // Draw map walls (smooth rounded outline look)
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 20; c++) {
          if (fixedMap[r][c] === 'W') {
             ctx.strokeRect(c * CELL_SIZE + 3, r * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6);
          }
        }
      }

      // Draw dots
      ctx.fillStyle = '#fde047';
      dots.forEach(d => {
        if (!d.eaten) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      powerPellets.forEach(d => {
        if (!d.eaten) {
          if (Math.floor(Date.now() / 200) % 2 === 0) {
              ctx.beginPath();
              ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
              ctx.fill();
          }
        }
      });

      // Draw pacman
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      const mouthSpeed = 150;
      let mouthOpen = Math.sin(Date.now() * Math.PI / mouthSpeed) * 0.5 + 0.5;
      if (pacman.vx === 0 && pacman.vy === 0) mouthOpen = 0.2; 

      const startAngle = pacman.dir * Math.PI / 2 + 0.25 * mouthOpen;
      const endAngle = pacman.dir * Math.PI / 2 + Math.PI * 2 - 0.25 * mouthOpen;
      ctx.arc(pacman.x, pacman.y, pacman.r, startAngle, endAngle);
      ctx.lineTo(pacman.x, pacman.y);
      ctx.fill();

      // Draw ghosts
      ghosts.forEach((g) => {
        let sc = 1;
        if (powerTimer > 0) {
            ctx.fillStyle = (powerTimer < 120 && Math.floor(Date.now() / 150) % 2 === 0) ? '#f8fafc' : '#1e3a8a';
            sc = 0.9;
        } else {
            ctx.fillStyle = g.color;
        }
        
        ctx.beginPath();
        ctx.arc(g.x, g.y, 8*sc, Math.PI, 0); 
        ctx.lineTo(g.x + 8*sc, g.y + 8*sc);
        ctx.lineTo(g.x + 4*sc, g.y + 5*sc);
        ctx.lineTo(g.x, g.y + 8*sc);
        ctx.lineTo(g.x - 4*sc, g.y + 5*sc);
        ctx.lineTo(g.x - 8*sc, g.y + 8*sc);
        ctx.closePath();
        ctx.fill();

        // Eyes
        if (powerTimer <= 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(g.x - 3, g.y - 2, 2.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(g.x + 3, g.y - 2, 2.5, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = 'blue';
            let ex = g.vx > 0 ? 1 : g.vx < 0 ? -1 : 0;
            let ey = g.vy > 0 ? 1 : g.vy < 0 ? -1 : 0;
            ctx.beginPath(); ctx.arc(g.x - 3 + ex, g.y - 2 + ey, 1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(g.x + 3 + ex, g.y - 2 + ey, 1, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = '#fbcb39';
            ctx.beginPath(); ctx.arc(g.x - 3, g.y - 2, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(g.x + 3, g.y - 2, 1.5, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = '#fbcb39';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(g.x - 4, g.y + 3); ctx.lineTo(g.x - 2, g.y + 1); ctx.lineTo(g.x, g.y + 3);
            ctx.lineTo(g.x + 2, g.y + 1); ctx.lineTo(g.x + 4, g.y + 3);
            ctx.stroke();
        }
      });

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when pressing arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { pacman.nextVx = 1; pacman.nextVy = 0; }
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { pacman.nextVx = 0; pacman.nextVy = 1; }
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { pacman.nextVx = -1; pacman.nextVy = 0; }
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') { pacman.nextVx = 0; pacman.nextVy = -1; }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, gameWin]); // remove score to prevent re-instantiation

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 max-w-[400px]">
          <div className="text-xl font-bold font-mono tracking-widest text-yellow-500">РАХУНОК: {score}</div>
          {(gameOver || gameWin) && (
              <button 
                onClick={() => { setScore(0); setGameOver(false); setGameWin(false); }}
                className="flex items-center gap-2 text-sm text-zinc-950 bg-yellow-500 hover:bg-yellow-400 font-bold px-3 py-1.5 rounded transition"
              >
                  <RefreshCw className="w-4 h-4" /> Заново
              </button>
          )}
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={400} height={400} className="bg-zinc-950 border-4 border-blue-900 rounded-xl shadow-[0_0_20px_rgba(30,58,138,0.5)] max-w-full h-auto object-contain block ring-4 ring-zinc-950/50" />
        {gameOver && <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-red-500 text-4xl font-bold tracking-widest rounded-xl animate-fade-in drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">КІНЕЦЬ ГРИ</div>}
        {gameWin && <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-yellow-400 text-4xl font-bold tracking-widest rounded-xl animate-fade-in drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">ПЕРЕМОГА!</div>}
      </div>
    </div>
  );
}
