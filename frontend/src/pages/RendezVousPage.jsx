import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchRendezVous, cancelRendezVous } from '../api/rendezvous';

function StatusBadge({ statut }) {
  const map = {
    CONFIRME: { label: 'Confirmé', cls: 'bg-green-100 text-green-700' },
    EN_ATTENTE: { label: 'En attente', cls: 'bg-yellow-100 text-yellow-700' },
    ANNULE: { label: 'Annulé', cls: 'bg-red-100 text-red-700' },
    TERMINE: { label: 'Terminé', cls: 'bg-gray-100 text-gray-600' },
  };
  const { label, cls } = map[statut] ?? { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>{label}</span>;
}

function formatDateHeure(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function RendezVousPage() {
  const navigate = useNavigate();
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let active = true;
    fetchRendezVous()
      .then((data) => { if (active) setRdvs(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleCancel(id) {
    setBusy(id);
    try {
      await cancelRendezVous(id);
      setRdvs((prev) => prev.map((r) => (r.id === id ? { ...r, statut: 'ANNULE' } : r)));
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a3c6e]">Mes rendez-vous</h1>
            <p className="text-sm text-gray-500">Gérez vos consultations</p>
          </div>
          <Link to="/medecins" className="bg-[#1a3c6e] text-white text-sm px-4 py-2.5 rounded-xl font-semibold hover:bg-[#152f58] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Prendre RDV
          </Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" /></div>
        ) : rdvs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 font-medium mb-3">Aucun rendez-vous pour le moment.</p>
            <Link to="/medecins" className="text-[#2aab8e] font-semibold text-sm hover:underline">Trouver un médecin</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rdvs.map((rdv) => {
              const canJoin = rdv.teleconsultation_id && (rdv.teleconsultation_statut === 'EN_COURS' || rdv.teleconsultation_statut === 'PLANIFIEE');
              const canCancel = rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME';
              return (
                <div key={rdv.id} className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#1a3c6e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-[#1a3c6e]">Dr. {rdv.medecin_prenom} {rdv.medecin_nom}</p>
                      <StatusBadge statut={rdv.statut} />
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{formatDateHeure(rdv.date_heure)}</p>
                    {rdv.motif && <p className="text-xs text-gray-400 mt-1 italic">"{rdv.motif}"</p>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {canJoin && (
                      <button onClick={() => navigate(`/teleconsultation?tc=${rdv.teleconsultation_id}&role=guest`)}
                        className="bg-[#1a3c6e] text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-[#152f58]">
                        Rejoindre
                      </button>
                    )}
                    {canCancel && (
                      <button onClick={() => handleCancel(rdv.id)} disabled={busy === rdv.id}
                        className="border border-red-300 text-red-500 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
