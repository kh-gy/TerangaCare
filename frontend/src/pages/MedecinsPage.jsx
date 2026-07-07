import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchMedecins } from '../api/medecins';

function StarRating({ note }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(note ?? 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {note != null && <span className="text-xs text-gray-500 ml-1">{Number(note).toFixed(1)}</span>}
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
    fetchMedecins({ limit: 100 })
      .then(setMedecins)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = medecins.filter((m) => {
    const q = search.toLowerCase();
    return !q
      || `${m.prenom} ${m.nom}`.toLowerCase().includes(q)
      || (m.localisation ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e] mb-1">Trouver un médecin</h1>
          <p className="text-sm text-gray-500">Consultez l'annuaire et prenez rendez-vous</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 relative">
          <svg className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Nom ou localisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#dde8f5] rounded-xl text-sm outline-none focus:border-[#1a3c6e] transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-400 text-sm">Aucun médecin trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1a3c6e] to-[#2563a8] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(m.prenom?.[0] ?? '')}{(m.nom?.[0] ?? '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1a3c6e]">Dr. {m.prenom} {m.nom}</p>
                  <StarRating note={m.note_moyenne} />
                  {m.localisation && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {m.localisation}
                    </p>
                  )}
                  {m.tarif_consultation != null && (
                    <p className="text-xs text-[#2aab8e] font-semibold mt-1">{Number(m.tarif_consultation).toLocaleString()} FCFA / consultation</p>
                  )}
                  <button
                    onClick={() => navigate(`/rendez-vous/nouveau?medecin=${m.id}`)}
                    className="mt-3 bg-[#1a3c6e] text-white text-xs px-4 py-2 rounded-xl font-semibold hover:bg-[#152f58] transition-colors"
                  >
                    Prendre RDV
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
