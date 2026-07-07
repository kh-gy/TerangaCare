import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchMesRendezVous, confirmRendezVous } from '../api/rendezvous';

function formatDateHeure(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MesRendezVousPage() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    let active = true;
    fetchMesRendezVous()
      .then((data) => { if (active) setRdvs(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleConfirm(id) {
    setConfirming(id);
    try {
      await confirmRendezVous(id);
      // L'endpoint ne renvoie que les RDV EN_ATTENTE : on retire le confirmé localement.
      setRdvs((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e]">Demandes de rendez-vous</h1>
          <p className="text-sm text-gray-500">Confirmez les rendez-vous en attente</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-sm text-red-600">{error}</div>
        ) : rdvs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Aucune demande en attente.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rdvs.map((rdv) => (
              <div key={rdv.id} className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#1a3c6e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-[#1a3c6e]">Patient #{rdv.patient_id}</p>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">En attente</span>
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{formatDateHeure(rdv.date_heure)}</p>
                  {rdv.motif && <p className="text-xs text-gray-400 mt-1 italic">"{rdv.motif}"</p>}
                  <Link to={`/patients/${rdv.patient_id}/carnet`} className="text-xs text-[#2aab8e] font-semibold hover:underline mt-1 inline-block">
                    Voir le carnet de santé
                  </Link>
                </div>
                <button
                  onClick={() => handleConfirm(rdv.id)}
                  disabled={confirming === rdv.id}
                  className="flex-shrink-0 bg-green-600 text-white text-xs px-4 py-2 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {confirming === rdv.id ? '…' : 'Confirmer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
