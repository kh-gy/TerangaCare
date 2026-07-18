import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../auth/useAuth';
import { fetchRendezVous } from '../api/rendezvous';
import { fetchOrdonnances } from '../api/ordonnances';
import { fetchPatients } from '../api/patients';
import { fetchMedecin, updateDisponibilite } from '../api/medecins';

const icon = (d) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} /></svg>
);
const ICONS = {
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  plus: 'M12 4v16m8-8H4',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  video: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  compass: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
};

function StatCard({ label, value, tone = 'brand', d, sub }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="tc-card p-5 tc-fade-up">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${tones[tone]}`}>{icon(d)}</div>
      <p className="text-2xl font-bold text-brand-600 leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-1.5">{label}</p>
      {sub && <p className="text-xs text-teal-600 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

function ActionCard({ to, label, desc, d, primary }) {
  return (
    <Link
      to={to}
      className={`tc-hover-lift group rounded-2xl p-5 flex flex-col gap-3 border ${primary
        ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white border-transparent'
        : 'bg-white text-brand-600 border-[#dce6f4]'}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${primary ? 'bg-white/15' : 'bg-brand-50'}`}>{icon(d)}</div>
      <div>
        <span className="text-sm font-bold leading-tight block">{label}</span>
        <span className={`text-xs mt-0.5 block ${primary ? 'text-white/75' : 'text-slate-500'}`}>{desc}</span>
      </div>
      <span className={`text-xs font-semibold inline-flex items-center gap-1 mt-auto ${primary ? 'text-white/90' : 'text-teal-600'}`}>
        Ouvrir
        <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </span>
    </Link>
  );
}

function isToday(s) {
  const d = new Date(s), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const prenom = profile?.given_name || profile?.preferred_username || profile?.email || 'Bienvenue';
  const roles = profile?.roles?.length ? profile.roles : (profile?.role ? [profile.role] : []);
  const role = roles.includes('medecin') ? 'medecin' : roles.includes('patient') ? 'patient' : (roles[0] || 'patient');
  const isMedecin = role === 'medecin';
  const isAdmin = role === 'administrateur';

  const hour = new Date().getHours();
  const salut = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const [rdvs, setRdvs] = useState([]);
  const [ordos, setOrdos] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dispo, setDispo] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let on = true;
    fetchRendezVous().then((d) => on && setRdvs(d)).catch(() => {});
    fetchOrdonnances().then((d) => on && setOrdos(d)).catch(() => {});
    if (isMedecin || isAdmin) {
      fetchPatients().then((d) => on && setPatients(d)).catch(() => {});
      const mid = profile?.user_id;
      if (mid) fetchMedecin(mid).then((m) => on && setDispo(m.disponibilite)).catch(() => {});
    }
    return () => { on = false; };
  }, [isMedecin, isAdmin, profile?.user_id]);

  async function toggleDispo() {
    setToggling(true);
    try { const m = await updateDisponibilite(!dispo); setDispo(m.disponibilite); }
    catch { /* ignore */ } finally { setToggling(false); }
  }

  const stats = useMemo(() => {
    const upcoming = rdvs.filter((r) => r.statut !== 'ANNULE' && new Date(r.date_heure) >= new Date());
    if (isMedecin) {
      return [
        { label: "RDV aujourd'hui", value: rdvs.filter((r) => isToday(r.date_heure) && r.statut !== 'ANNULE').length, d: ICONS.calendar, tone: 'brand' },
        { label: 'À confirmer', value: rdvs.filter((r) => r.statut === 'EN_ATTENTE').length, d: ICONS.clock, tone: 'amber' },
        { label: 'Patients', value: patients.length, d: ICONS.users, tone: 'teal' },
        { label: 'Ordonnances émises', value: ordos.length, d: ICONS.doc, tone: 'violet' },
      ];
    }
    return [
      { label: 'RDV à venir', value: upcoming.length, d: ICONS.calendar, tone: 'brand' },
      { label: 'Consultations', value: rdvs.length, d: ICONS.clock, tone: 'teal' },
      { label: 'Ordonnances', value: ordos.length, d: ICONS.doc, tone: 'violet' },
      { label: 'En attente', value: rdvs.filter((r) => r.statut === 'EN_ATTENTE').length, d: ICONS.clock, tone: 'amber' },
    ];
  }, [rdvs, ordos, patients, isMedecin]);

  const patientActions = [
    { to: '/medecins', label: 'Trouver un médecin', desc: "Annuaire des praticiens", d: ICONS.search, primary: true },
    { to: '/rendez-vous/nouveau', label: 'Prendre un RDV', desc: 'Réserver une consultation', d: ICONS.plus },
    { to: '/rendez-vous', label: 'Mes rendez-vous', desc: 'Suivre et gérer', d: ICONS.calendar },
    { to: '/mon-carnet', label: 'Mon carnet', desc: 'Dossier de santé', d: ICONS.heart },
    { to: '/ordonnances', label: 'Mes ordonnances', desc: 'Prescriptions', d: ICONS.doc },
  ];
  const medecinActions = [
    { to: '/mes-rendez-vous', label: 'Mon agenda', desc: 'Confirmer & consulter', d: ICONS.calendar, primary: true },
    { to: '/patients', label: 'Mes patients', desc: 'Dossiers & carnets', d: ICONS.users },
    { to: '/teleconsultation', label: 'Téléconsultation', desc: 'Salle vidéo', d: ICONS.video },
    { to: '/orientation', label: 'Orientation', desc: 'Vers une structure', d: ICONS.compass },
    { to: '/ordonnances', label: 'Ordonnances émises', desc: 'Historique', d: ICONS.doc },
  ];
  const actions = isMedecin ? medecinActions : isAdmin ? [...patientActions, ...medecinActions] : patientActions;
  const roleLabel = { medecin: 'Espace médecin', patient: 'Espace patient', administrateur: 'Administration' }[role] || 'Mon espace';

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-7">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-7 text-white bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800">
          <div className="absolute -right-8 -top-10 w-52 h-52 rounded-full bg-white/10" />
          <div className="absolute right-24 top-16 w-24 h-24 rounded-full bg-teal-500/30 blur-xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <span className="tc-badge bg-white/15 text-white/90 mb-2">{roleLabel}</span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{salut}, {prenom}</h1>
              <p className="text-sm text-white/70 mt-1">
                {isMedecin ? 'Voici l’activité de votre cabinet aujourd’hui.' : 'Prenez soin de votre santé, en toute simplicité.'}
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/15 items-center justify-center">
              {icon(isMedecin ? ICONS.doc : ICONS.heart)}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Disponibilité médecin */}
        {(isMedecin || isAdmin) && dispo !== null && (
          <div className={`tc-card p-4 flex items-center justify-between ${dispo ? '' : 'opacity-90'}`}>
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${dispo ? 'bg-green-500' : 'bg-slate-300'} ${dispo ? 'animate-pulse' : ''}`} />
              <div>
                <p className="text-sm font-bold text-brand-600">{dispo ? 'Vous êtes disponible' : 'Vous êtes indisponible'}</p>
                <p className="text-xs text-slate-500">{dispo ? 'Les patients peuvent réserver avec vous' : 'Masqué de l’annuaire'}</p>
              </div>
            </div>
            <button type="button" onClick={toggleDispo} disabled={toggling} aria-label="Basculer la disponibilité"
              className={`w-12 h-6 rounded-full relative transition-colors tc-press disabled:opacity-50 ${dispo ? 'bg-green-500' : 'bg-slate-300'}`}>
              <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${dispo ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        )}

        {/* Actions */}
        <div>
          <h2 className="text-lg font-bold text-brand-600 mb-4">Que souhaitez-vous faire ?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {actions.map((a) => <ActionCard key={a.to + a.label} {...a} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
