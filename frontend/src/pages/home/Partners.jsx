const partners = ['Labo BioSanté', 'Pharmacie Dakar', 'Clinique Espoir', 'Croix Rouge SN'];

const Partners = () => {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-[#1a3c6e] mb-3">Nos Partenaires</h2>
        <p className="text-gray-500 text-base md:text-lg mb-12">
          Un réseau de confiance à votre service.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {partners.map((p) => (
            <div
              key={p}
              className="bg-[#eef3fa] text-[#1a3c6e] font-semibold text-sm py-3 px-6 rounded-full border border-[#c8d9ef]"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
