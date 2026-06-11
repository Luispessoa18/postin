import React, { useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { uploadImageFile, deleteUploadedImage } from '../lib/social';

interface LogoUploadFieldProps {
  label: string;
  hint?: string;
  value?: string;
  tenantId: string;
  category: string;
  onChange: (url: string) => void;
  previewClassName?: string;
}

export function LogoUploadField({ label, hint, value, tenantId, category, onChange, previewClassName }: LogoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageFile(file, tenantId, category);
      onChange(url);
    } catch (e: any) {
      setError(e.message || 'Falha ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    deleteUploadedImage(value);
    onChange('');
  };

  return (
    <div>
      <label className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-700 cursor-pointer overflow-hidden ${previewClassName || 'bg-slate-950'}`}>
        {uploading ? (
          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
        ) : value ? (
          <img src={value} alt={label} className="w-full h-full object-contain p-1" />
        ) : (
          <Upload className="text-slate-500 w-5 h-5" />
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }} />
      </label>
      <div className="flex items-center gap-1.5 mt-2">
        <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
        {value && (
          <button type="button" onClick={handleRemove} title="Remover" className="text-slate-600 hover:text-red-400">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {hint && <p className="text-[9px] text-slate-600 mt-0.5">{hint}</p>}
      {error && <p className="text-[9px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}
