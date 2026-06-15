/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

// Basic Alchemy logic
const RECIPES: Record<string, string> = {
    '💧+🔥': '💨', // water + fire = steam
    '🔥+💧': '💨',
    '💧+🌍': '🌱', // water + earth = plant
    '🌍+💧': '🌱',
    '💨+🌍': '🌫️', // steam + earth = dust
    '🌍+💨': '🌫️',
    '🔥+🌍': '🌋', // fire + earth = lava
    '🌍+🔥': '🌋',
    '💧+💧': '🌊', // water + water = sea
    '🌱+🔥': '🚬',
    '🔥+🌱': '🚬'
};

export default function AlchemyGame({ highScore, onUpdateHighScore }: any) {
  const [elements, setElements] = useState<string[]>(['💧', '🔥', '🌍']);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selected === null) {
      setSelected(idx);
    } else {
      if (selected !== idx) {
        const mix = `${elements[selected]}+${elements[idx]}`;
        const result = RECIPES[mix];
        if (result && !elements.includes(result)) {
            const newElements = [...elements, result];
            setElements(newElements);
            onUpdateHighScore(highScore + 20);
        }
      }
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
        <div className="text-zinc-400 mb-6 font-mono text-center">Об'єднуйте елементи, клікаючи по ним по черзі.</div>
        <div className="flex flex-wrap gap-4 justify-center max-w-md">
            {elements.map((el, i) => (
                <button 
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg transition transform hover:scale-110 ${selected === i ? 'ring-4 ring-fuchsia-500 scale-110' : ''}`}
                >
                    {el}
                </button>
            ))}
        </div>
        <div className="mt-8 text-zinc-500 text-xs font-mono">
            Знайдено: {elements.length}
        </div>
    </div>
  );
}
