const MAP = {
  CONFIRME: { label: 'Confirmé', cls: 'bg-green-100 text-green-700' },
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
  ANNULE: { label: 'Annulé', cls: 'bg-red-100 text-red-600' },
  TERMINE: { label: 'Terminé', cls: 'bg-slate-100 text-slate-600' },
  TERMINEE: { label: 'Terminée', cls: 'bg-slate-100 text-slate-600' },
  EN_COURS: { label: 'En cours', cls: 'bg-blue-100 text-blue-700' },
  PLANIFIEE: { label: 'Planifiée', cls: 'bg-blue-100 text-blue-700' },
  EMISE: { label: 'Émise', cls: 'bg-green-100 text-green-700' },
  VALIDE: { label: 'Validé', cls: 'bg-green-100 text-green-700' },
};

// Petit point coloré + libellé, look "statut" homogène.
export default function StatusBadge({ statut }) {
  const { label, cls } = MAP[statut] ?? { label: statut, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`tc-badge ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
