const SIZES = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-14 h-14 text-lg' };

// Avatar à initiales, dégradé de marque. Ton "teal" optionnel pour les médecins.
export default function Avatar({ prenom = '', nom = '', size = 'md', tone = 'brand', className = '' }) {
  const initials = `${(prenom[0] ?? '')}${(nom[0] ?? '')}`.toUpperCase() || '·';
  const grad = tone === 'teal'
    ? 'from-teal-500 to-brand-600'
    : 'from-brand-500 to-brand-700';
  return (
    <div className={`${SIZES[size]} rounded-xl bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}
