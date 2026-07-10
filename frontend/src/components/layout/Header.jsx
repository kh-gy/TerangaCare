import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { authenticated, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  const displayName = profile?.given_name || profile?.preferred_username || profile?.email || 'Mon espace';

  const navLinks = authenticated
    ? [
        { to: '/dashboard', label: 'Tableau de bord' },
        { to: '/medecins', label: 'Médecins' },
        { to: '/rendez-vous', label: 'Mes RDV' },
        { to: '/ordonnances', label: 'Ordonnances' },
        { to: '/mes-rendez-vous', label: 'Agenda' },
      ]
    : [{ to: '/', label: 'Accueil' }];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to={authenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1a3c6e] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#1a3c6e]">CareConnect</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-gray-600 hover:text-[#1a3c6e] font-medium text-sm">
              {l.label}
            </Link>
          ))}
          {authenticated ? (
            <>
              <span className="text-[#1a3c6e] font-medium text-sm">{displayName}</span>
              <button
                onClick={handleLogout}
                className="bg-[#1a3c6e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#152f58] transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-[#1a3c6e] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#152f58] transition-colors">
              Connexion
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-gray-600 font-medium text-sm" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          {authenticated ? (
            <button
              onClick={handleLogout}
              className="bg-[#1a3c6e] text-white px-4 py-2 rounded-full text-sm font-medium text-center"
            >
              Déconnexion
            </button>
          ) : (
            <Link to="/login" className="bg-[#1a3c6e] text-white px-4 py-2 rounded-full text-sm font-medium text-center" onClick={() => setMenuOpen(false)}>
              Connexion
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
