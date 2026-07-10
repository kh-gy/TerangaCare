import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchRendezVous, confirmRendezVous } from '../api/rendezvous';
import { createTeleconsultation, startTeleconsultation } from '../api/teleconsultations';

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

export default function MesRendezVousPage() {
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

  async function handleConfirm(id) {
    setBusy(id);
    try {
      await confirmRendezVous(id);
      setRdvs((prev) => prev.map((r) => (r.id === id ? { ...r, statut: 'CONFIRME' } : r)));
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  async function handleStart(rdv) {
    setBusy(rdv.id);
    try {
      const tc = await createTeleconsultation(rdv.id);
      await startTeleconsultation(tc.id);
      navigate(`/teleconsultation?tc=${tc.id}&role=host&patient=${rdv.patient_id}`);
    } catch (e) { setError(e.message); setBusy(null); }
  }

  const pending = rdvs.filter((r) => r.statut === 'EN_ATTENTE');
  const others = rdvs.filter((r) => r.statut !== 'EN_ATTENTE');

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e]">Mon agenda</h1>
          <p className="text-sm text-gray-500">Confirmez, démarrez vos consultations et rédigez les ordonnances</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" /></div>
        ) : rdvs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 font-medium">Aucun rendez-vous dans votre agenda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {pending.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-[#1a3c6e] mb-3">Demandes en attente ({pending.length})</h2>
                <div className="flex flex-col gap-3">
                  {pending.map((rdv) => (
                    <RdvCard key={rdv.id} rdv={rdv} busy={busy === rdv.id} onConfirm={handleConfirm} onStart={handleStart} navigate={navigate} />
                  ))}
                </div>
              </section>
            )}
            {others.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-[#1a3c6e] mb-3">Rendez-vous ({others.length})</h2>
                <div className="flex flex-col gap-3">
                  {others.map((rdv) => (
                    <RdvCard key={rdv.id} rdv={rdv} busy={busy === rdv.id} onConfirm={handleConfirm} onStart={handleStart} navigate={navigate} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function RdvCard({ rdv, busy, onConfirm, onStart, navigate }) {
  const tcDone = rdv.teleconsultation_statut === 'TERMINEE';
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start">
      <div className="w-12 h-12 rounded-full bg-[#1a3c6e] text-white flex items-center justify-center font-bold flex-shrink-0">
        {(rdv.patient_prenom?.[0] ?? '?')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-bold text-[#1a3c6e]">{rdv.patient_prenom} {rdv.patient_nom}</p>
          <StatusBadge statut={rdv.statut} />
        </div>
        <p className="text-xs text-gray-500 capitalize">{formatDateHeure(rdv.date_heure)}</p>
        {rdv.motif && <p className="text-xs text-gray-400 mt-1 italic">"{rdv.motif}"</p>}
        <button
          onClick={() => navigate(`/patients/${rdv.patient_id}/carnet`)}
          className="text-xs text-[#2aab8e] font-semibold hover:underline mt-1"
        >
          Voir le carnet
        </button>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        {rdv.statut === 'EN_ATTENTE' && (
          <button onClick={() => onConfirm(rdv.id)} disabled={busy}
            className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
            Confirmer
          </button>
        )}
        {rdv.statut === 'CONFIRME' && !tcDone && (
          <button onClick={() => onStart(rdv)} disabled={busy}
            className="bg-[#1a3c6e] text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-[#152f58] disabled:opacity-50">
            Démarrer
          </button>
        )}
        {tcDone && (
          <button onClick={() => navigate(`/ordonnances/nouvelle?tc=${rdv.teleconsultation_id}&patient=${rdv.patient_id}`)}
            className="bg-[#2aab8e] text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-[#238f77]">
            Ordonnance
          </button>
        )}
      </div>
    </div>
  );
}
