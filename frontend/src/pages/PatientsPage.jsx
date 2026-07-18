import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchPatients } from '../api/patients';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    fetchPatients()
      .then((data) => { if (active) setPatients(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return !q || `${p.prenom} ${p.nom}`.toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e]">Mes patients</h1>
          <p className="text-sm text-gray-500">Les patients qui ont pris rendez-vous avec vous</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 relative">
          <svg className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Rechercher un patient…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#dde8f5] rounded-xl text-sm outline-none focus:border-[#1a3c6e] transition-colors" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 font-medium">{patients.length === 0 ? 'Aucun patient pour le moment.' : 'Aucun résultat.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a3c6e] to-[#2563a8] text-white flex items-center justify-center font-bold flex-shrink-0">
                  {(p.prenom?.[0] ?? '')}{(p.nom?.[0] ?? '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a3c6e]">{p.prenom} {p.nom}</p>
                  {p.email && <p className="text-xs text-gray-400 truncate">{p.email}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{p.nb_rdv} rendez-vous · Dernier : {formatDate(p.dernier_rdv)}</p>
                </div>
                <button onClick={() => navigate(`/patients/${p.id}/carnet`)}
                  className="flex-shrink-0 bg-[#2aab8e] text-white text-xs px-3 py-2 rounded-xl font-semibold hover:bg-[#238f77] transition-colors">
                  Carnet
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
