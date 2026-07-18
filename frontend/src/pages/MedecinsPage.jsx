import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchMedecins } from '../api/medecins';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { SkeletonList, EmptyState, ErrorNote } from '../components/ui/feedback';

function Stars({ note }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(note ?? 0) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {note != null && <span className="text-xs text-slate-500 ml-1">{Number(note).toFixed(1)}</span>}
    </div>
  );
}

export default function MedecinsPage() {
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let on = true;
    fetchMedecins({ limit: 100 })
      .then((d) => on && setMedecins(d))
      .catch((e) => on && setError(e.message))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, []);

  const filtered = medecins.filter((m) => {
    const q = search.toLowerCase();
    return !q || `${m.prenom} ${m.nom}`.toLowerCase().includes(q) || (m.localisation ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader title="Trouver un médecin" subtitle="Consultez l'annuaire et prenez rendez-vous" />

        <div className="tc-card p-2 mb-6 flex items-center gap-2 focus-within:border-brand-300 transition-colors">
          <svg className="w-5 h-5 text-slate-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Rechercher par nom ou ville…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none placeholder-slate-400" />
          {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 pr-2 text-lg">×</button>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonList rows={4} /></div>
        ) : error ? (
          <ErrorNote>{error}</ErrorNote>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            title="Aucun médecin trouvé" >Essayez un autre terme de recherche.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((m) => (
              <div key={m.id} className="tc-card tc-hover-lift p-5 flex gap-4 items-start tc-fade-up">
                <Avatar prenom={m.prenom} nom={m.nom} size="lg" tone="teal" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brand-600">Dr. {m.prenom} {m.nom}</p>
                  <Stars note={m.note_moyenne} />
                  {m.localisation && (
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {m.localisation}
                    </p>
                  )}
                  {m.tarif_consultation != null && (
                    <p className="text-sm text-teal-600 font-semibold mt-1">{Number(m.tarif_consultation).toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA / consultation</span></p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => navigate(`/rendez-vous/nouveau?medecin=${m.id}`)}>Prendre RDV</Button>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/medecins/${m.id}/avis`)}>Avis</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
