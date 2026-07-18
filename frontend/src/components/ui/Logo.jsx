import { useId } from 'react';

/**
 * Logo TerangaCare.
 * Squircle dégradé (bleu profond → teal), anneau « teranga » (l'accueil)
 * et croix de santé. Lisible du favicon 16px au lockup du header.
 *
 * Props :
 *  - size      : taille de l'icône en px (défaut 36)
 *  - withName  : affiche le nom à côté de l'icône
 *  - className : classes du conteneur
 */
export default function Logo({ size = 36, withName = false, className = '' }) {
  // Identifiants uniques : évite les collisions de <defs> si plusieurs logos coexistent.
  const uid = useId().replace(/:/g, '');
  const grad = `tcGrad-${uid}`;
  const gloss = `tcGloss-${uid}`;

  const mark = (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="TerangaCare" className="flex-shrink-0">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a3c6e" />
          <stop offset="55%" stopColor="#2c5fa5" />
          <stop offset="100%" stopColor="#2aab8e" />
        </linearGradient>
        <linearGradient id={gloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="13" fill={`url(#${grad})`} />
      <rect width="48" height="24" rx="13" fill={`url(#${gloss})`} />

      {/* Anneau « teranga » : l'accueil, l'étreinte */}
      <circle cx="24" cy="24" r="15" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.8" />

      {/* Croix de santé */}
      <rect x="20.6" y="12.4" width="6.8" height="23.2" rx="3.4" fill="#ffffff" />
      <rect x="12.4" y="20.6" width="23.2" height="6.8" rx="3.4" fill="#ffffff" />
    </svg>
  );

  if (!withName) return <span className={className}>{mark}</span>;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <span className="text-lg font-bold text-brand-600 tracking-tight">
        Teranga<span className="text-teal-600">Care</span>
      </span>
    </span>
  );
}
