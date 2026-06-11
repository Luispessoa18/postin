import { Router, Request, Response } from 'express';
import { saveUploadFromDataUrl, deleteUploadByUrl } from '../lib/uploads.js';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const { tenantId, category, dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'dataUrl é obrigatório' });
    }
    const { url } = saveUploadFromDataUrl(tenantId, category || 'misc', dataUrl);
    res.json({ url });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(400).json({ error: err.message || 'Falha ao salvar imagem' });
  }
});

router.delete('/', (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url é obrigatório' });
    }
    deleteUploadByUrl(url);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete upload error:', err);
    res.status(400).json({ error: err.message || 'Falha ao remover imagem' });
  }
});

export default router;
