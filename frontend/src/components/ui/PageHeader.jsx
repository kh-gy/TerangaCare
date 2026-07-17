import { useNavigate } from 'react-router-dom';

// En-tête de page cohérent : bouton retour optionnel, titre, sous-titre, action à droite.
export default function PageHeader({ title, subtitle, back, backTo, action }) {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      {back && (
        <button
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {typeof back === 'string' ? back : 'Retour'}
        </button>
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-brand-600 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
