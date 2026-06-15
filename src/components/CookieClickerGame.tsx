/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cookie, MousePointerClick } from 'lucide-react';

export default function CookieClickerGame({ highScore, onUpdateHighScore }: any) {
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  const handleClick = () => {
    const newScore = score + multiplier;
    setScore(newScore);
    if (newScore > highScore) onUpdateHighScore(newScore);
  };

  const buyUpgrade = () => {
    if (score >= multiplier * 15) {
      setScore(score - multiplier * 15);
      setMultiplier(multiplier + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between p-4 w-full h-full max-w-sm">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-zinc-100 mb-2">{score} Печива</h2>
        <div className="text-sm text-zinc-500">За клік: {multiplier}</div>
      </div>

      <button onClick={handleClick} className="relative group transition-transform active:scale-95 duration-100">
        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full group-hover:bg-amber-500/30 transition"></div>
        <Cookie className="w-48 h-48 text-amber-600 relative z-10" />
      </button>

      <div className="mt-12 w-full">
        <button 
          onClick={buyUpgrade}
          disabled={score < multiplier * 15}
          className={`w-full p-4 rounded-xl flex items-center justify-between border ${score >= multiplier * 15 ? 'bg-zinc-900 border-amber-900/50 hover:bg-zinc-800' : 'bg-zinc-950 border-zinc-900 opacity-50'}`}
        >
          <div className="flex items-center gap-3">
            <MousePointerClick className="text-zinc-400" />
            <div className="text-left">
              <div className="font-bold text-zinc-200">Покращений клік</div>
              <div className="text-xs text-zinc-500">+1 до кліку</div>
            </div>
          </div>
          <div className="font-mono text-amber-500 font-bold">{multiplier * 15}</div>
        </button>
      </div>
    </div>
  );
}
