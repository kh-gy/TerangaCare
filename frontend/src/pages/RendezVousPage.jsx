import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchRendezVous, cancelRendezVous } from '../api/rendezvous';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { SkeletonList, EmptyState, ErrorNote } from '../components/ui/feedback';

function fmt(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function RendezVousPage() {
  const navigate = useNavigate();
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let on = true;
    fetchRendezVous().then((d) => on && setRdvs(d)).catch((e) => on && setError(e.message)).finally(() => on && setLoading(false));
    return () => { on = false; };
  }, []);

  async function handleCancel(id) {
    setBusy(id);
    try {
      await cancelRendezVous(id);
      setRdvs((p) => p.map((r) => (r.id === id ? { ...r, statut: 'ANNULE' } : r)));
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader title="Mes rendez-vous" subtitle="Suivez et gérez vos consultations"
          action={<Button onClick={() => navigate('/medecins')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Prendre RDV
          </Button>} />

        {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

        {loading ? (
          <SkeletonList rows={3} />
        ) : rdvs.length === 0 ? (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            title="Aucun rendez-vous"
            action={<Button variant="teal" onClick={() => navigate('/medecins')}>Trouver un médecin</Button>}>
            Prenez votre premier rendez-vous en quelques clics.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {rdvs.map((rdv) => {
              const canJoin = rdv.teleconsultation_id && ['EN_COURS', 'PLANIFIEE'].includes(rdv.teleconsultation_statut);
              const canCancel = rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME';
              return (
                <div key={rdv.id} className="tc-card p-5 flex gap-4 items-start tc-fade-up">
                  <Avatar prenom={rdv.medecin_prenom} nom={rdv.medecin_nom} tone="teal" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-brand-600">Dr. {rdv.medecin_prenom} {rdv.medecin_nom}</p>
                      <StatusBadge statut={rdv.statut} />
                    </div>
                    <p className="text-xs text-slate-500 capitalize">{fmt(rdv.date_heure)}</p>
                    {rdv.motif && <p className="text-xs text-slate-400 mt-1 italic">« {rdv.motif} »</p>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {canJoin && <Button size="sm" onClick={() => navigate(`/teleconsultation?tc=${rdv.teleconsultation_id}&role=guest`)}>Rejoindre</Button>}
                    {rdv.statut === 'CONFIRME' && <Button size="sm" variant="teal" onClick={() => navigate(`/paiement?rdv=${rdv.id}`)}>Payer</Button>}
                    {canCancel && <Button size="sm" variant="danger" loading={busy === rdv.id} onClick={() => handleCancel(rdv.id)}>Annuler</Button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center mt-6">
          <Link to="/dashboard" className="text-xs text-slate-400 hover:text-brand-600">← Retour au tableau de bord</Link>
        </p>
      </main>
    </div>
  );
}
