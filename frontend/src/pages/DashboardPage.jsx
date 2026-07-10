import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../auth/useAuth';
import { fetchMedecin, updateDisponibilite } from '../api/medecins';

const svg = (d) => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} /></svg>
);

const PATIENT_ACTIONS = [
  { label: 'Trouver un médecin', to: '/medecins', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { label: 'Prendre un rendez-vous', to: '/rendez-vous/nouveau', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Mes rendez-vous', to: '/rendez-vous', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Mon carnet de santé', to: '/mon-carnet', d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { label: 'Mes ordonnances', to: '/ordonnances', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const MEDECIN_ACTIONS = [
  { label: 'Mon agenda', to: '/mes-rendez-vous', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Mes patients', to: '/patients', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Ordonnances émises', to: '/ordonnances', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

function Card({ label, to, d, filled }) {
  return (
    <Link to={to} className={`${filled ? 'bg-[#1a3c6e] text-white' : 'bg-white text-[#1a3c6e]'} rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:opacity-90 transition-opacity border border-[#dde8f5]`}>
      {svg(d)}
      <span className="text-sm font-bold leading-tight">{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const prenom = profile?.given_name || profile?.preferred_username || profile?.email || 'Bienvenue';
  const roles = profile?.roles?.length ? profile.roles : (profile?.role ? [profile.role] : []);
  const hour = new Date().getHours();
  const salut = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const [dispo, setDispo] = useState(null);
  const [togglingDispo, setTogglingDispo] = useState(false);

  useEffect(() => {
    let active = true;
    // Récupère la disponibilité du médecin démo (id 1 en dev).
    fetchMedecin(1).then((m) => { if (active) setDispo(m.disponibilite); }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function toggleDispo() {
    setTogglingDispo(true);
    try {
      const updated = await updateDisponibilite(!dispo);
      setDispo(updated.disponibilite);
    } catch { /* ignore */ } finally { setTogglingDispo(false); }
  }

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="bg-gradient-to-r from-[#1a3c6e] to-[#2563a8] rounded-3xl p-7 text-white flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">{salut} 👋</p>
            <h1 className="text-2xl font-bold">{prenom}</h1>
            {roles.length > 0 && <p className="text-sm opacity-70 mt-1 capitalize">{roles.join(', ')}</p>}
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
        </div>

        {/* Espace patient */}
        <section>
          <h2 className="text-lg font-bold text-[#1a3c6e] mb-4">Espace patient</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {PATIENT_ACTIONS.map((a, i) => <Card key={a.to} {...a} filled={i === 0} />)}
          </div>
        </section>

        {/* Espace médecin */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1a3c6e]">Espace médecin</h2>
            {dispo !== null && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${dispo ? 'text-green-700' : 'text-gray-400'}`}>
                  {dispo ? 'Disponible' : 'Indisponible'}
                </span>
                <button type="button" onClick={toggleDispo} disabled={togglingDispo} aria-label="Basculer la disponibilité"
                  className={`w-12 h-6 rounded-full relative transition-colors disabled:opacity-50 ${dispo ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${dispo ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MEDECIN_ACTIONS.map((a, i) => <Card key={a.to} {...a} filled={i === 0} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
