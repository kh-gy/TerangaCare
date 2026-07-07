import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchMedecins } from '../api/medecins';
import { createRendezVous } from '../api/rendezvous';

const CRENEAUX = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

export default function PrendreRdvPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [medecins, setMedecins] = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const medecinIdFromUrl = searchParams.get('medecin');

  useEffect(() => {
    fetchMedecins({ limit: 100 })
      .then((data) => {
        setMedecins(data);
        if (medecinIdFromUrl) {
          const found = data.find((m) => String(m.id) === medecinIdFromUrl);
          if (found) setSelected(found);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [medecinIdFromUrl]);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected) { setError('Veuillez sélectionner un médecin.'); return; }
    if (!date || !heure) { setError('Veuillez choisir une date et un horaire.'); return; }

    setError('');
    setSubmitting(true);
    try {
      await createRendezVous({
        medecin_id: selected.id,
        date_heure: `${date}T${heure}:00`,
        motif: motif || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#eef3fa]">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl p-10 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1a3c6e] mb-2">Demande envoyée !</h1>
            <p className="text-sm text-gray-500 mb-6">
              Votre demande de rendez-vous avec Dr. {selected.prenom} {selected.nom} a bien été enregistrée.
              Elle est <strong>en attente de confirmation</strong> par le médecin.
            </p>
            <Link to="/dashboard" className="inline-block bg-[#1a3c6e] text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#152f58] transition-colors">
              Retour au tableau de bord
            </Link>
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <h1 className="text-2xl font-bold text-[#1a3c6e] mb-6">Prendre rendez-vous</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Médecin */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#1a3c6e] mb-4">Choisir un médecin</h2>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {medecins.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      selected?.id === m.id ? 'border-[#1a3c6e] bg-blue-50' : 'border-transparent bg-[#eef3fa] hover:border-[#c8d9ef]'
                    }`}
                  >
                    <input type="radio" name="medecin" className="hidden" checked={selected?.id === m.id} onChange={() => setSelected(m)} />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3c6e] to-[#2563a8] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(m.prenom?.[0] ?? '')}{(m.nom?.[0] ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a3c6e]">Dr. {m.prenom} {m.nom}</p>
                      {m.localisation && <p className="text-xs text-gray-400">{m.localisation}</p>}
                    </div>
                    {m.tarif_consultation != null && (
                      <span className="text-xs text-[#2aab8e] font-semibold flex-shrink-0">{Number(m.tarif_consultation).toLocaleString()} FCFA</span>
                    )}
                  </label>
                ))}
                {medecins.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun médecin disponible.</p>}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#1a3c6e] mb-4">Choisir une date</h2>
            <input
              type="date"
              value={date}
              min={minDateStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] transition-colors"
            />
          </div>

          {/* Horaire */}
          {date && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#1a3c6e] mb-4">Choisir un horaire</h2>
              <div className="grid grid-cols-5 gap-2">
                {CRENEAUX.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHeure(c)}
                    className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      heure === c ? 'bg-[#1a3c6e] text-white border-[#1a3c6e]' : 'bg-[#eef3fa] text-[#1a3c6e] border-transparent hover:border-[#1a3c6e]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Motif */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#1a3c6e] mb-2">Motif (optionnel)</h2>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Décrivez brièvement le motif de votre consultation…"
              rows={3}
              className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] resize-none transition-colors"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={submitting || !selected || !date || !heure}
            className="bg-[#1a3c6e] text-white py-3.5 rounded-2xl font-bold text-base hover:bg-[#152f58] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Envoi en cours…' : 'Confirmer le rendez-vous'}
          </button>
        </form>
      </main>
    </div>
  );
}
