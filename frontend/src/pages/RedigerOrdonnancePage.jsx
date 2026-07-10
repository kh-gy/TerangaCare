import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { createOrdonnance } from '../api/ordonnances';

// Convertit un textarea (une ligne = un item) en liste nettoyée.
function linesToList(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

export default function RedigerOrdonnancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tcId = searchParams.get('tc');
  const patientId = searchParams.get('patient');

  const [medicaments, setMedicaments] = useState('');
  const [posologie, setPosologie] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const defaultExpiration = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  })();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tcId || !patientId) { setError('Contexte de téléconsultation manquant.'); return; }
    const meds = linesToList(medicaments);
    const posos = linesToList(posologie);
    if (meds.length === 0 || posos.length === 0) { setError('Renseignez au moins un médicament et une posologie.'); return; }

    setError('');
    setSubmitting(true);
    try {
      await createOrdonnance({
        patientId: Number(patientId),
        teleconsultationId: Number(tcId),
        medicaments: meds,
        posologie: posos,
        dateExpiration: `${dateExpiration || defaultExpiration}T00:00:00`,
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#eef3fa]">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-10 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-xl font-bold text-[#1a3c6e] mb-2">Ordonnance émise</h1>
            <p className="text-sm text-gray-500 mb-6">La prescription a été enregistrée et est disponible pour le patient.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/ordonnances')} className="bg-[#1a3c6e] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#152f58]">Voir les ordonnances</button>
              <button onClick={() => navigate('/mes-rendez-vous')} className="border border-[#c8d9ef] text-[#1a3c6e] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#eef3fa]">Retour à l'agenda</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3c6e] mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Retour
        </button>
        <h1 className="text-2xl font-bold text-[#1a3c6e] mb-1">Rédiger une ordonnance</h1>
        <p className="text-sm text-gray-500 mb-6">Une ligne par médicament / posologie.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-base font-bold text-[#1a3c6e] mb-3">Médicaments</label>
            <textarea value={medicaments} onChange={(e) => setMedicaments(e.target.value)} rows={4}
              placeholder={"Paracétamol 500mg\nAmoxicilline 1g"}
              className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] resize-none transition-colors" />
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-base font-bold text-[#1a3c6e] mb-3">Posologie</label>
            <textarea value={posologie} onChange={(e) => setPosologie(e.target.value)} rows={4}
              placeholder={"1 comprimé 3 fois par jour\n1 comprimé matin et soir pendant 7 jours"}
              className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] resize-none transition-colors" />
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-base font-bold text-[#1a3c6e] mb-3">Date d'expiration</label>
            <input type="date" value={dateExpiration || defaultExpiration} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateExpiration(e.target.value)}
              className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] transition-colors" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={submitting}
            className="bg-[#2aab8e] text-white py-3.5 rounded-2xl font-bold hover:bg-[#238f77] transition-colors disabled:opacity-50">
            {submitting ? 'Enregistrement…' : "Valider l'ordonnance"}
          </button>
        </form>
      </main>
    </div>
  );
}
