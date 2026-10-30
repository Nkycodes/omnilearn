import { Router, Request, Response } from 'express';
import {
  fetchAlphaFoldPrediction,
  fetchUniProtRecord,
  fetchPubChemCompound,
  searchPubMedArticles,
} from '../science.js';

const router = Router();

// GET /api/science/alphafold/:id
router.get('/alphafold/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const structure = await fetchAlphaFoldPrediction(id);
    if (!structure) {
      res.status(404).json({
        success: false,
        error: `No AlphaFold structure found for UniProt accession ${id}.`,
      });
      return;
    }
    res.json({ success: true, data: structure });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'AlphaFold lookup failed' });
  }
});

// GET /api/science/uniprot/:id
router.get('/uniprot/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await fetchUniProtRecord(id);
    if (!record) {
      res.status(404).json({
        success: false,
        error: `UniProt record not found for ${id}.`,
      });
      return;
    }
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'UniProt lookup failed' });
  }
});

// GET /api/science/pubchem/:query
router.get('/pubchem/:query', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.params;
    const compound = await fetchPubChemCompound(query);
    if (!compound) {
      res.status(404).json({
        success: false,
        error: `PubChem compound not found for query "${query}".`,
      });
      return;
    }
    res.json({ success: true, data: compound });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'PubChem lookup failed' });
  }
});

// GET /api/science/pubmed?q=...
router.get('/pubmed', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q || !q.trim()) {
      res.status(400).json({ success: false, error: 'Query parameter q is required' });
      return;
    }
    const max = parseInt((req.query.max as string) || '5', 10);
    const articles = await searchPubMedArticles(q, max);
    res.json({ success: true, data: articles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'PubMed query failed' });
  }
});

export default router;
