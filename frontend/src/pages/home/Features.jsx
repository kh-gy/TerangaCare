const steps = [
  {
    number: '1',
    color: 'bg-[#1a3c6e]',
    title: 'Consultation',
    desc: 'Trouvez un médecin disponible et prenez rendez-vous en quelques clics.',
  },
  {
    number: '2',
    color: 'bg-[#2aab8e]',
    title: 'Ordonnance',
    desc: "Recevez votre ordonnance directement sur l'application, de manière sécurisée.",
  },
  {
    number: '3',
    color: 'bg-[#1a3c6e]',
    title: 'Pharmacie',
    desc: 'Localisez la pharmacie la plus proche disposant de vos médicaments.',
  },
];

const Features = () => {
  return (
    <section className="bg-[#eef3fa] py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-[#1a3c6e] mb-3">Parcours Simplifié</h2>
        <p className="text-gray-500 text-base md:text-lg mb-12">
          Comment TerangaCare vous accompagne au quotidien.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {steps.map((step) => (
            <div key={step.number} className="bg-white rounded-2xl p-8 flex-1 max-w-sm mx-auto md:mx-0 shadow-sm text-left">
              <span className={`${step.color} text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm mb-5`}>
                {step.number}
              </span>
              <h3 className="text-xl font-bold text-[#1a3c6e] mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
