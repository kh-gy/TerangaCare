import { Link } from 'react-router-dom';
import heroImg from '../../assets/hero.png';

const Hero = () => {
  return (
    <section className="bg-[#eef3fa] py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Desktop: side by side | Mobile: stacked */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-12">
          {/* Text content */}
          <div className="flex-1 text-center md:text-left mb-8 md:mb-0">
            <h1 className="text-3xl md:text-5xl font-bold text-[#1a3c6e] leading-tight mb-4">
              La santé connectée pour tous.
            </h1>
            <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md mx-auto md:mx-0">
              Une plateforme solidaire pour relier patients, médecins et pharmacies au Sénégal.
            </p>
            <Link
              to="/login"
              className="inline-block bg-[#1a3c6e] text-white px-8 py-4 rounded-full font-semibold text-base hover:bg-[#152f58] transition-colors shadow-md"
            >
              Découvrir le service
            </Link>
          </div>

          {/* Image card */}
          <div className="flex-1 flex justify-center">
            <div className="bg-[#1a3c6e] rounded-2xl overflow-hidden w-full max-w-sm md:max-w-md shadow-xl">
              <div className="bg-[#2a4f8a] px-6 py-3">
                <p className="text-white text-center font-semibold text-sm">Votre Santé, Notre Communauté</p>
              </div>
              <img
                src={heroImg}
                alt="Communauté santé Sénégal"
                className="w-full h-130 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {/* Fallback placeholder if image missing */}
              <div className="h-56 flex items-center justify-center" style={{display: 'none'}}>
                <span className="text-white/60 text-sm">Image de communauté</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
