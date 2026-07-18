import { Link, useLocation } from 'react-router-dom';

const navItems = [
  {
    to: '/',
    label: 'Accueil',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1a3c6e]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Rechercher',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1a3c6e]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    to: '/calendar',
    label: 'Calendrier',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1a3c6e]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profil',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1a3c6e]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const Footer = () => {
  const location = useLocation();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center gap-1 px-3 py-1">
                {item.icon(active)}
                <span className={`text-[10px] font-medium ${active ? 'text-[#1a3c6e]' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop footer */}
      <footer className="hidden md:block bg-[#1a3c6e] text-white py-12 mt-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3">TerangaCare</h3>
              <p className="text-blue-200 text-sm max-w-xs">
                La santé connectée pour tous. Une plateforme solidaire pour relier patients, médecins et pharmacies au Sénégal.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="font-semibold mb-3 text-sm">Services</h4>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li>Consultation</li>
                  <li>Ordonnance</li>
                  <li>Pharmacie</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm">Contact</h4>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li>contact@terangacare.sn</li>
                  <li>+221 33 000 00 00</li>
                  <li>Dakar, Sénégal</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-6 text-center text-blue-300 text-xs">
            © 2025 TerangaCare. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* Spacer for mobile to avoid content hidden behind bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
};

export default Footer;
