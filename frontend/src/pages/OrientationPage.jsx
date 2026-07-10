import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchOrientations, createOrientation } from '../api/orientations';
import { fetchPatients } from '../api/patients';

const TYPES = ['Hôpital', 'Clinique', 'Laboratoire', 'Pharmacie', 'Spécialiste', 'Centre de santé'];

export default function OrientationPage() {
  const navigate = useNavigate();
  const [orientations, setOrientations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type_structure: 'Hôpital', nom_structure: '', motif: '', localisation: '', patient_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function load() {
    Promise.all([fetchOrientations().catch(() => []), fetchPatients().catch(() => [])])
      .then(([o, p]) => { setOrientations(o); setPatients(p); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom_structure.trim()) { setError('Le nom de la structure est requis.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await createOrientation({
        type_structure: form.type_structure,
        nom_structure: form.nom_structure.trim(),
        motif: form.motif || undefined,
        localisation: form.localisation || undefined,
        patient_id: form.patient_id ? Number(form.patient_id) : undefined,
      });
      setForm({ type_structure: 'Hôpital', nom_structure: '', motif: '', localisation: '', patient_id: '' });
      const o = await fetchOrientations();
      setOrientations(o);
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
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3c6e] mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Retour au tableau de bord
        </button>
        <h1 className="text-2xl font-bold text-[#1a3c6e] mb-1">Orientation patient</h1>
        <p className="text-sm text-gray-500 mb-6">Orientez un patient vers une structure de santé adaptée.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm mb-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type de structure</label>
            <select name="type_structure" value={form.type_structure} onChange={change}
              className="w-full border border-[#dde8f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3c6e] bg-white transition-colors">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <input name="nom_structure" value={form.nom_structure} onChange={change} placeholder="Nom de la structure *"
            className="w-full border border-[#dde8f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3c6e] transition-colors" />
          <input name="localisation" value={form.localisation} onChange={change} placeholder="Localisation"
            className="w-full border border-[#dde8f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3c6e] transition-colors" />
          <textarea name="motif" value={form.motif} onChange={change} placeholder="Motif de l'orientation" rows={2}
            className="w-full border border-[#dde8f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3c6e] resize-none transition-colors" />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Patient (optionnel)</label>
            <select name="patient_id" value={form.patient_id} onChange={change}
              className="w-full border border-[#dde8f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3c6e] bg-white transition-colors">
              <option value="">— Aucun —</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={submitting}
            className="bg-[#2aab8e] text-white py-3 rounded-xl font-bold hover:bg-[#238f77] transition-colors disabled:opacity-50">
            {submitting ? 'Enregistrement…' : "Créer l'orientation"}
          </button>
        </form>

        <h2 className="text-base font-bold text-[#1a3c6e] mb-3">Orientations récentes</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" /></div>
        ) : orientations.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune orientation pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orientations.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#1a3c6e]">{o.type_structure}</span>
                  <p className="text-sm font-bold text-[#1a3c6e]">{o.nom_structure}</p>
                </div>
                {o.motif && <p className="text-xs text-gray-500">{o.motif}</p>}
                {o.localisation && <p className="text-xs text-gray-400">{o.localisation}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(o.date_orientation).toLocaleDateString('fr-FR')}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
