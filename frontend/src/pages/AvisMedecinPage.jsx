import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchAvisMedecin, createAvis } from '../api/avis';
import { fetchMedecin } from '../api/medecins';

function Stars({ value, onChange, size = 'w-6 h-6' }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type={onChange ? 'button' : undefined} onClick={onChange ? () => onChange(s) : undefined}
          className={onChange ? 'cursor-pointer' : 'cursor-default'} aria-label={`${s} étoiles`}>
          <svg className={`${size} ${s <= value ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function AvisMedecinPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medecin, setMedecin] = useState(null);
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([fetchMedecin(id).catch(() => null), fetchAvisMedecin(id).catch(() => [])])
      .then(([m, a]) => { if (active) { setMedecin(m); setAvis(a); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createAvis({ medecin_id: Number(id), note, commentaire: commentaire || undefined });
      setCommentaire('');
      setNote(5);
      const [m, a] = await Promise.all([fetchMedecin(id).catch(() => medecin), fetchAvisMedecin(id)]);
      setMedecin(m); setAvis(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/medecins')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3c6e] mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Retour aux médecins
        </button>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1a3c6e] to-[#2563a8] text-white flex items-center justify-center font-bold text-lg">
                {(medecin?.prenom?.[0] ?? '')}{(medecin?.nom?.[0] ?? '')}
              </div>
              <div>
                <p className="font-bold text-[#1a3c6e]">Dr. {medecin?.prenom} {medecin?.nom}</p>
                <div className="flex items-center gap-2">
                  <Stars value={Math.round(medecin?.note_moyenne ?? 0)} size="w-4 h-4" />
                  <span className="text-xs text-gray-500">{medecin?.note_moyenne != null ? `${medecin.note_moyenne} / 5` : 'Pas encore noté'} · {avis.length} avis</span>
                </div>
              </div>
            </div>

            {/* Laisser un avis */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <p className="text-base font-bold text-[#1a3c6e] mb-3">Laisser un avis</p>
              <div className="mb-3"><Stars value={note} onChange={setNote} /></div>
              <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3}
                placeholder="Votre commentaire (optionnel)…"
                className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] resize-none transition-colors mb-3" />
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600 mb-3">{error}</div>}
              <button type="submit" disabled={submitting}
                className="bg-[#1a3c6e] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#152f58] disabled:opacity-50">
                {submitting ? 'Envoi…' : 'Publier mon avis'}
              </button>
            </form>

            {/* Avis existants */}
            <h2 className="text-base font-bold text-[#1a3c6e] mb-3">Avis des patients</h2>
            {avis.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun avis pour le moment.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {avis.map((a) => (
                  <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-[#1a3c6e]">{a.patient_prenom} {a.patient_nom}</p>
                      <Stars value={a.note} size="w-4 h-4" />
                    </div>
                    {a.commentaire && <p className="text-sm text-gray-600">{a.commentaire}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(a.date_avis).toLocaleDateString('fr-FR')}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
