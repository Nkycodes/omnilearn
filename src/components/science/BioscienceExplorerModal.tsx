import React, { useState, useEffect } from 'react';
import {
  X,
  Dna,
  Layers,
  FlaskConical,
  BookOpen,
  Search,
  ExternalLink,
  Loader2,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { scienceApi } from '../../api/client';
import { AlphaFoldStructure, UniProtRecord, PubChemCompound, PubMedArticle } from '../../types';

interface BioscienceExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const BioscienceExplorerModal: React.FC<BioscienceExplorerModalProps> = ({
  isOpen,
  onClose,
  initialQuery = 'P04637',
}) => {
  const [activeTab, setActiveTab] = useState<'alphafold' | 'uniprot' | 'pubchem' | 'pubmed'>('alphafold');
  const [uniprotInput, setUniprotInput] = useState(initialQuery);
  const [compoundInput, setCompoundInput] = useState('caffeine');
  const [pubmedInput, setPubmedInput] = useState('CRISPR Cas9 base editing');

  const [alphaFoldData, setAlphaFoldData] = useState<AlphaFoldStructure | null>(null);
  const [uniProtData, setUniProtData] = useState<UniProtRecord | null>(null);
  const [pubChemData, setPubChemData] = useState<PubChemCompound | null>(null);
  const [pubMedArticles, setPubMedArticles] = useState<PubMedArticle[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch AlphaFold
  const loadAlphaFold = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scienceApi.getAlphaFold(id);
      if (res.success && res.data) {
        setAlphaFoldData(res.data);
      } else {
        setError(res.error || 'AlphaFold structure not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'AlphaFold lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch UniProt
  const loadUniProt = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scienceApi.getUniProt(id);
      if (res.success && res.data) {
        setUniProtData(res.data);
      } else {
        setError(res.error || 'UniProt record not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'UniProt lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch PubChem
  const loadPubChem = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scienceApi.getPubChem(query);
      if (res.success && res.data) {
        setPubChemData(res.data);
      } else {
        setError(res.error || 'Chemical compound not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'PubChem lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch PubMed
  const loadPubMed = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scienceApi.searchPubMed(query, 5);
      if (res.success && res.data) {
        setPubMedArticles(res.data);
      } else {
        setError(res.error || 'No research papers found');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'PubMed query failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'alphafold' && !alphaFoldData) {
        loadAlphaFold(uniprotInput);
      } else if (activeTab === 'uniprot' && !uniProtData) {
        loadUniProt(uniprotInput);
      } else if (activeTab === 'pubchem' && !pubChemData) {
        loadPubChem(compoundInput);
      } else if (activeTab === 'pubmed' && pubMedArticles.length === 0) {
        loadPubMed(pubmedInput);
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Bioscience & Chemical Intelligence
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Open Science APIs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                AlphaFold DB • UniProtKB • PubChem Compounds • PubMed Biomedical Literature
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('alphafold')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'alphafold'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dna className="w-4 h-4 text-cyan-400" />
            <span>AlphaFold DB (3D Structure)</span>
          </button>

          <button
            onClick={() => setActiveTab('uniprot')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'uniprot'
                ? 'border-indigo-400 text-indigo-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>UniProtKB (Functional Domains)</span>
          </button>

          <button
            onClick={() => setActiveTab('pubchem')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'pubchem'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span>PubChem (Molecules)</span>
          </button>

          <button
            onClick={() => setActiveTab('pubmed')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'pubmed'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>PubMed (Literature)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: AlphaFold DB */}
          {activeTab === 'alphafold' && (
            <div className="space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadAlphaFold(uniprotInput);
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={uniprotInput}
                    onChange={(e) => setUniprotInput(e.target.value)}
                    placeholder="Enter UniProt Accession (e.g. P04637, P00533, P68871)"
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Predict 3D</span>
                </button>
              </form>

              {/* Sample Targets */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Presets:</span>
                {[
                  { id: 'P04637', name: 'p53 Tumor Suppressor' },
                  { id: 'P00533', name: 'EGFR Kinase' },
                  { id: 'P68871', name: 'Hemoglobin Subunit' },
                  { id: 'P01308', name: 'Insulin' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setUniprotInput(item.id);
                      loadAlphaFold(item.id);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {item.name} ({item.id})
                  </button>
                ))}
              </div>

              {alphaFoldData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                        Target Protein
                      </span>
                      <h3 className="text-lg font-bold text-slate-100">{alphaFoldData.gene}</h3>
                      <p className="text-xs text-slate-400 italic">{alphaFoldData.organism}</p>
                      <p className="text-xs font-mono text-cyan-300 mt-1">Accession: {alphaFoldData.uniprotAccession}</p>
                    </div>

                    {/* pLDDT Confidence Tier Bar (AlphaFold Standard Scale) */}
                    <div className="space-y-2 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Model Confidence (pLDDT)</span>
                        <span className="font-mono text-cyan-400 font-bold">{alphaFoldData.plddtConfidence.meanPlddt}% Mean</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
                        <div
                          style={{ width: `${alphaFoldData.plddtConfidence.veryHigh}%`, backgroundColor: '#0053D6' }}
                          title={`Very High (>90): ${alphaFoldData.plddtConfidence.veryHigh}%`}
                        />
                        <div
                          style={{ width: `${alphaFoldData.plddtConfidence.confident}%`, backgroundColor: '#65CBF3' }}
                          title={`Confident (70-90): ${alphaFoldData.plddtConfidence.confident}%`}
                        />
                        <div
                          style={{ width: `${alphaFoldData.plddtConfidence.low}%`, backgroundColor: '#FFDB13' }}
                          title={`Low (50-70): ${alphaFoldData.plddtConfidence.low}%`}
                        />
                        <div
                          style={{ width: `${alphaFoldData.plddtConfidence.veryLow}%`, backgroundColor: '#FF7D45' }}
                          title={`Very Low (<50): ${alphaFoldData.plddtConfidence.veryLow}%`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0053D6' }} />
                          <span>Very high (&gt;90)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#65CBF3' }} />
                          <span>Confident (70-90)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FFDB13' }} />
                          <span>Low (50-70)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FF7D45' }} />
                          <span>Very low (&lt;50)</span>
                        </div>
                      </div>
                    </div>

                    {/* Download & External Links */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {alphaFoldData.pdbUrl && (
                        <a
                          href={alphaFoldData.pdbUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Download PDB Coordinates</span>
                        </a>
                      )}
                      {alphaFoldData.cifUrl && (
                        <a
                          href={alphaFoldData.cifUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Download mmCIF</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 3D Structure Ribbon & PAE Visualization */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl border border-slate-800 relative min-h-[220px]">
                    {alphaFoldData.paeImageUrl ? (
                      <div className="space-y-2 text-center">
                        <img
                          src={alphaFoldData.paeImageUrl}
                          alt="Predicted Aligned Error (PAE)"
                          className="w-full max-h-48 object-contain rounded-lg border border-slate-700"
                        />
                        <span className="text-[11px] text-slate-400">Predicted Aligned Error (PAE) Matrix</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                          <Dna className="w-8 h-8 animate-pulse" />
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          AlphaFold Ribbon Coordinate Model Loaded
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs">
                          Atomic backbone predictions synchronized with DeepMind AlphaFold Database.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UniProtKB */}
          {activeTab === 'uniprot' && (
            <div className="space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadUniProt(uniprotInput);
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={uniprotInput}
                    onChange={(e) => setUniprotInput(e.target.value)}
                    placeholder="Enter UniProt ID (e.g. P04637, P00533)"
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Fetch Record</span>
                </button>
              </form>

              {uniProtData && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
                  <div className="border-b border-slate-800 pb-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                      Recommended Protein Name
                    </span>
                    <h3 className="text-base font-bold text-slate-100">{uniProtData.proteinName}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>Gene: <strong className="text-slate-200">{uniProtData.geneName}</strong></span>
                      <span>•</span>
                      <span>Organism: <em className="text-slate-200">{uniProtData.organism}</em></span>
                      <span>•</span>
                      <span>Length: <strong className="text-indigo-400 font-mono">{uniProtData.sequenceLength} AA</strong></span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                      Biological Function Summary
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                      {uniProtData.functionSummary}
                    </p>
                  </div>

                  {uniProtData.domains.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
                        Annotated Functional Domains & Motifs
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {uniProtData.domains.map((dom, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-200 truncate pr-2">{dom.name}</span>
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
                              Residues {dom.start}–{dom.end}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PubChem Compounds */}
          {activeTab === 'pubchem' && (
            <div className="space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadPubChem(compoundInput);
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={compoundInput}
                    onChange={(e) => setCompoundInput(e.target.value)}
                    placeholder="Enter Chemical Name or CID (e.g. caffeine, aspirin, dopamine, 2244)"
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search Molecule</span>
                </button>
              </form>

              {pubChemData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      PubChem Compound # {pubChemData.cid}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 capitalize">{pubChemData.name}</h3>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Molecular Formula:</span>
                        <span className="font-mono font-bold text-emerald-300">{pubChemData.molecularFormula}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Molecular Weight:</span>
                        <span className="font-mono font-bold text-slate-200">{pubChemData.molecularWeight} g/mol</span>
                      </div>
                      {pubChemData.iupacName && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block text-[11px] mb-1">Preferred IUPAC Name:</span>
                          <span className="font-mono text-[11px] text-slate-200 break-all">{pubChemData.iupacName}</span>
                        </div>
                      )}
                      {pubChemData.canonicalSmiles && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block text-[11px] mb-1">Canonical SMILES:</span>
                          <span className="font-mono text-[11px] text-emerald-400 break-all">{pubChemData.canonicalSmiles}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <img
                      src={pubChemData.imageUrl}
                      alt={pubChemData.name}
                      className="w-48 h-48 object-contain rounded-lg bg-white p-2"
                    />
                    <span className="text-[11px] text-slate-400 mt-2">2D Chemical Structural Depiction</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PubMed Literature */}
          {activeTab === 'pubmed' && (
            <div className="space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadPubMed(pubmedInput);
                }}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={pubmedInput}
                    onChange={(e) => setPubmedInput(e.target.value)}
                    placeholder="Search PubMed biomedical literature (e.g. mRNA vaccines, CRISPR Cas9)"
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search Papers</span>
                </button>
              </form>

              <div className="space-y-3">
                {pubMedArticles.map((art) => (
                  <div
                    key={art.pmid}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                        {art.title}
                      </h4>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg text-amber-400 hover:bg-slate-800 transition-colors shrink-0"
                        title="Open on PubMed"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Authors: {art.authors.join(', ')}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-300">{art.journal}</span>
                      <span>•</span>
                      <span>{art.pubDate}</span>
                      <span className="ml-auto font-mono text-[10px] text-amber-300 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900">
                        PMID: {art.pmid}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
