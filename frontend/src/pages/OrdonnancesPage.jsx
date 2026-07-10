import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { fetchOrdonnances } from '../api/ordonnances';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OrdonnancesPage() {
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchOrdonnances()
      .then((data) => { if (active) setOrdonnances(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e]">Ordonnances</h1>
          <p className="text-sm text-gray-500">Vos prescriptions médicales</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" /></div>
        ) : ordonnances.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#2aab8e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-gray-500 font-medium">Aucune ordonnance pour le moment.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {ordonnances.map((ord) => {
              const expired = new Date(ord.date_expiration) < new Date();
              return (
                <div key={ord.id} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-[#1a3c6e]">
                        Dr. {ord.medecin_prenom} {ord.medecin_nom}
                        {ord.patient_prenom && <span className="text-gray-400 font-normal"> → {ord.patient_prenom} {ord.patient_nom}</span>}
                      </p>
                      <p className="text-xs text-gray-400">Émise le {formatDate(ord.date_emission)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${expired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                      {expired ? 'Expirée' : 'Valide'}
                    </span>
                  </div>
                  <div className="bg-[#eef3fa] rounded-xl p-4 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Médicaments</p>
                      <ul className="text-sm text-[#1a3c6e] font-medium list-disc list-inside">
                        {ord.medicaments.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posologie</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {ord.posologie.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">Valable jusqu'au {formatDate(ord.date_expiration)}</p>
                    <button onClick={() => window.print()} className="text-xs text-[#2aab8e] font-semibold hover:underline">
                      Imprimer / PDF
                    </button>
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
