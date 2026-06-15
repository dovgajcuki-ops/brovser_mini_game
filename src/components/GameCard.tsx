/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Maximize2, Trophy, Flame, Layers, Grid, Skull, Brain, Gamepad2, Ghost, Box, X, Hammer, Type, Grid3X3, Layout, FlaskConical, Crown, Target, Bird, ArrowUp, Cookie, Star, Zap, Mountain } from 'lucide-react';
import { GameId, GameInfo } from '../types';

interface GameCardProps {
  key?: React.Key;
  game: GameInfo;
  highScore: number;
  onSelect: (id: GameId) => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  flame: Flame,
  layers: Layers,
  grid: Grid,
  skull: Skull,
  brain: Brain,
  ghost: Ghost,
  cards: Box,
  x: X,
  hammer: Hammer,
  text: Type,
  grid3x3: Grid3X3,
  layout: Layout,
  flask: FlaskConical,
  crown: Crown,
  target: Target,
  bird: Bird,
  arrowUp: ArrowUp,
  cookie: Cookie,
  star: Star,
  zap: Zap,
  mountain: Mountain,
};

export default function GameCard({ game, highScore, onSelect }: GameCardProps) {
  const IconComponent = iconMap[game.icon] || Gamepad2;

  return (
    <div
      onClick={() => onSelect(game.id)}
      id={`game-card-${game.id}`}
      className="group relative bg-zinc-950/40 border border-zinc-900 hover:border-zinc-700/80 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between h-56 select-none overflow-hidden"
    >
      {/* Visual Accent Hover Bar */}
      <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${game.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="flex items-start justify-between">
        <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg group-hover:scale-105 transition-transform duration-300">
          <IconComponent className="w-6 h-6 text-zinc-300 group-hover:text-zinc-100 transition-colors" />
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900/60 border border-zinc-900/40 rounded text-[11px] text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span className="font-mono font-bold">{highScore}</span>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="font-sans font-medium text-base text-zinc-100 tracking-tight group-hover:text-white transition-colors">
          {game.title}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
          {game.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-950 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Натисніть для запуску
        </span>
        <div className="flex items-center gap-1 text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <span>Розгорнути</span>
          <Maximize2 className="w-3 h-3 ml-0.5" />
        </div>
      </div>
    </div>
  );
}
