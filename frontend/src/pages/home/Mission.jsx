const values = [
  {
    icon: (
      <svg className="w-6 h-6 text-[#1a3c6e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Solidarité',
    desc: "Créer un réseau d'entraide communautaire pour la santé de tous.",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-[#1a3c6e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Accessibilité',
    desc: 'Rendre les professionnels de santé joignables même dans les zones reculées.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-[#1a3c6e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Fiabilité',
    desc: 'Des professionnels certifiés pour des conseils et soins de qualité.',
  },
];

const Mission = () => {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-[#1a3c6e] mb-3">Notre Mission</h2>
        <p className="text-gray-500 text-base md:text-lg mb-12 max-w-xl mx-auto">
          Faciliter l'accès aux soins pour chaque famille, partout au Sénégal.
        </p>

        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {values.map((v) => (
            <div key={v.title} className="flex flex-col items-center max-w-xs mx-auto">
              <div className="w-16 h-16 bg-[#eef3fa] rounded-full flex items-center justify-center mb-4 shadow-sm">
                {v.icon}
              </div>
              <h3 className="text-lg font-bold text-[#1a3c6e] mb-2">{v.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Mission;
