import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { addColor, dedupeColors, normalizeHex, removeColor } from '../lib/brandColors';

interface BrandColorsEditorProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export function BrandColorsEditor({ colors, onChange }: BrandColorsEditorProps) {
  const [newColor, setNewColor] = useState('#6366f1');

  const updateColor = (index: number, hex: string) => {
    const next = [...colors];
    next[index] = normalizeHex(hex);
    onChange(dedupeColors(next));
  };

  const handleAdd = () => {
    const next = addColor(colors, newColor);
    if (next.length === colors.length) return;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {colors.map((color, index) => (
          <div key={`${color}-${index}`} className="flex flex-col items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                className="w-12 h-12 rounded cursor-pointer bg-slate-950 border border-slate-700"
              />
              {colors.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(removeColor(colors, index))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="font-mono text-[10px] text-slate-400">{color}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer bg-slate-950 border border-slate-700"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 px-3 py-1.5 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar cor
        </button>
      </div>
    </div>
  );
}
