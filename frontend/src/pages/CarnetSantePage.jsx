import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchCarnet } from '../api/carnet';

function ListeSection({ icon, label, items }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold text-[#1a3c6e] mb-3">
        <span className="text-lg">{icon}</span> {label}
      </h2>
      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="text-sm bg-[#eef3fa] text-[#1a3c6e] font-medium px-3 py-1.5 rounded-lg">{item}</span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Aucune information renseignée.</p>
      )}
    </div>
  );
}

export default function CarnetSantePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [carnet, setCarnet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCarnet(id)
      .then(setCarnet)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3c6e] mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e]">Carnet de santé</h1>
          <p className="text-sm text-gray-500">Patient #{id}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-sm text-red-600">{error}</div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Groupe sanguin */}
            <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <span className="text-xl">🩸</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Groupe sanguin</p>
                <p className="text-lg font-bold text-[#1a3c6e]">{carnet?.groupeSanguin || '—'}</p>
              </div>
            </div>

            <ListeSection icon="⚠️" label="Allergies" items={carnet?.allergies} />
            <ListeSection icon="💊" label="Maladies chroniques" items={carnet?.maladiesChroniques} />
            <ListeSection icon="📋" label="Antécédents médicaux" items={carnet?.antecedents} />

            {carnet?.dateDerniereMiseAJour && (
              <p className="text-xs text-gray-400 text-center">
                Dernière mise à jour : {new Date(carnet.dateDerniereMiseAJour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
