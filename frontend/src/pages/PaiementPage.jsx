import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { createPaiement } from '../api/paiements';

const MODES = [
  { value: 'WAVE', label: 'Wave', emoji: '🌊' },
  { value: 'ORANGE_MONEY', label: 'Orange Money', emoji: '🟠' },
  { value: 'CARD', label: 'Carte bancaire', emoji: '💳' },
];

export default function PaiementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rdvId = searchParams.get('rdv');
  const montantParam = searchParams.get('montant');

  const [montant, setMontant] = useState(montantParam || '');
  const [mode, setMode] = useState('WAVE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rdvId) { setError('Rendez-vous manquant.'); return; }
    if (!montant || Number(montant) <= 0) { setError('Montant invalide.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const p = await createPaiement({ rendez_vous_id: Number(rdvId), montant: Number(montant), mode_paiement: mode });
      setReceipt(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (receipt) {
    return (
      <div className="min-h-screen bg-[#eef3fa]">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-10 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-xl font-bold text-[#1a3c6e] mb-2">Paiement confirmé</h1>
            <p className="text-sm text-gray-500 mb-1">Référence : <span className="font-semibold text-[#1a3c6e]">{receipt.reference}</span></p>
            <p className="text-sm text-gray-500 mb-6">Montant : {Number(receipt.montant).toLocaleString()} FCFA</p>
            <button onClick={() => navigate('/rendez-vous')} className="bg-[#1a3c6e] text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#152f58]">
              Retour à mes rendez-vous
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3c6e] mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Retour
        </button>
        <h1 className="text-2xl font-bold text-[#1a3c6e] mb-6">Régler la consultation</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-base font-bold text-[#1a3c6e] mb-3">Montant (FCFA)</label>
            <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)}
              className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] transition-colors" />
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-base font-bold text-[#1a3c6e] mb-3">Moyen de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button key={m.value} type="button" onClick={() => setMode(m.value)}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${mode === m.value ? 'bg-[#1a3c6e] text-white border-[#1a3c6e]' : 'bg-[#eef3fa] text-[#1a3c6e] border-transparent hover:border-[#1a3c6e]'}`}>
                  <span className="text-xl">{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={submitting}
            className="bg-[#2aab8e] text-white py-3.5 rounded-2xl font-bold hover:bg-[#238f77] transition-colors disabled:opacity-50">
            {submitting ? 'Traitement…' : `Payer ${montant ? Number(montant).toLocaleString() + ' FCFA' : ''}`}
          </button>
        </form>
      </main>
    </div>
  );
}
