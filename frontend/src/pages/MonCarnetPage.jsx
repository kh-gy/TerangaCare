import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchMyCarnet, updateMyCarnet } from '../api/carnet';

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Champs "liste" édités en textarea (une ligne = un item).
const LIST_FIELDS = [
  { key: 'allergies', label: 'Allergies', icon: '⚠️', placeholder: 'Une allergie par ligne' },
  { key: 'maladies_chroniques', label: 'Maladies chroniques', icon: '💊', placeholder: 'Une maladie par ligne' },
  { key: 'antecedents', label: 'Antécédents médicaux', icon: '📋', placeholder: 'Un antécédent par ligne' },
];

const linesToList = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean);

export default function MonCarnetPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ groupe_sanguin: '', allergies: '', maladies_chroniques: '', antecedents: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchMyCarnet()
      .then((c) => {
        if (!active) return;
        setForm({
          groupe_sanguin: c.groupeSanguin ?? '',
          allergies: (c.allergies ?? []).join('\n'),
          maladies_chroniques: (c.maladiesChroniques ?? []).join('\n'),
          antecedents: (c.antecedents ?? []).join('\n'),
        });
      })
      .catch(() => { /* 404 = carnet vide, on garde les valeurs par défaut */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateMyCarnet({
        groupe_sanguin: form.groupe_sanguin || null,
        allergies: linesToList(form.allergies),
        maladies_chroniques: linesToList(form.maladies_chroniques),
        antecedents: linesToList(form.antecedents),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e]">Mon carnet de santé</h1>
          <p className="text-sm text-gray-500">Ces informations aident les médecins à mieux vous suivre</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-base font-bold text-[#1a3c6e] mb-3"><span className="text-lg">🩸</span> Groupe sanguin</label>
              <div className="grid grid-cols-4 gap-2">
                {GROUPES.map((g) => (
                  <button key={g} type="button" onClick={() => { setForm({ ...form, groupe_sanguin: g }); setSaved(false); }}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.groupe_sanguin === g ? 'bg-red-500 text-white border-red-500' : 'bg-[#eef3fa] text-[#1a3c6e] border-transparent hover:border-red-300'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {LIST_FIELDS.map((f) => (
              <div key={f.key} className="bg-white rounded-2xl p-5 shadow-sm">
                <label className="flex items-center gap-2 text-base font-bold text-[#1a3c6e] mb-3"><span className="text-lg">{f.icon}</span> {f.label}</label>
                <textarea value={form[f.key]} onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setSaved(false); }}
                  placeholder={f.placeholder} rows={3}
                  className="w-full border border-[#dde8f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a3c6e] resize-none transition-colors" />
              </div>
            ))}

            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
            {saved && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">Carnet enregistré avec succès.</div>}

            <button type="submit" disabled={saving} className="bg-[#1a3c6e] text-white py-3.5 rounded-2xl font-bold hover:bg-[#152f58] transition-colors disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
