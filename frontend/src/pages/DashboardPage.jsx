import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../auth/useAuth';

const ACTIONS = [
  {
    label: 'Trouver un médecin',
    description: "Parcourez l'annuaire des professionnels de santé",
    to: '/medecins',
    color: 'bg-[#1a3c6e]', textColor: 'text-white',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    ),
  },
  {
    label: 'Prendre un rendez-vous',
    description: 'Réservez une téléconsultation avec un médecin',
    to: '/rendez-vous/nouveau',
    color: 'bg-[#2aab8e]', textColor: 'text-white',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    ),
  },
  {
    label: 'Demandes de rendez-vous',
    description: 'Espace médecin — confirmez vos RDV en attente',
    to: '/mes-rendez-vous',
    color: 'bg-white', textColor: 'text-[#1a3c6e]',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    ),
  },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const prenom = profile?.given_name || profile?.preferred_username || profile?.email || 'Bienvenue';
  const roles = profile?.roles?.length ? profile.roles : (profile?.role ? [profile.role] : []);

  const hour = new Date().getHours();
  const salut = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Greeting */}
        <div className="bg-gradient-to-r from-[#1a3c6e] to-[#2563a8] rounded-3xl p-7 text-white flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">{salut} 👋</p>
            <h1 className="text-2xl font-bold">{prenom}</h1>
            {roles.length > 0 && (
              <p className="text-sm opacity-70 mt-1 capitalize">{roles.join(', ')}</p>
            )}
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h2 className="text-lg font-bold text-[#1a3c6e] mb-4">Que souhaitez-vous faire ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className={`${a.color} ${a.textColor} rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:opacity-90 transition-opacity border border-[#dde8f5]`}
              >
                {a.icon}
                <span className="text-sm font-bold leading-tight">{a.label}</span>
                <span className={`text-xs ${a.textColor === 'text-white' ? 'opacity-80' : 'text-gray-500'}`}>{a.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
