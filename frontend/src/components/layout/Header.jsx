import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { authenticated, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  const prenom = profile?.given_name || '';
  const nom = profile?.family_name || '';
  const displayName = prenom || profile?.preferred_username || profile?.email || 'Mon espace';
  const roles = profile?.roles?.length ? profile.roles : (profile?.role ? [profile.role] : []);
  const roleLabel = roles.includes('medecin') ? 'Médecin' : roles.includes('administrateur') ? 'Admin' : 'Patient';

  const navLinks = authenticated
    ? [
        { to: '/dashboard', label: 'Tableau de bord' },
        { to: '/medecins', label: 'Médecins' },
        { to: '/rendez-vous', label: 'Mes RDV' },
        { to: '/mes-rendez-vous', label: 'Agenda' },
        { to: '/ordonnances', label: 'Ordonnances' },
      ]
    : [{ to: '/', label: 'Accueil' }];

  const isActive = (to) => pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e6edf7]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
        <Link to={authenticated ? '/dashboard' : '/'} className="tc-press">
          <Logo size={36} withName />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(l.to) ? 'text-brand-600 bg-brand-50' : 'text-slate-500 hover:text-brand-600 hover:bg-brand-50/60'}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          {authenticated ? (
            <>
              <div className="flex items-center gap-2.5 pl-1">
                <Avatar prenom={prenom || displayName} nom={nom} size="sm" tone={roles.includes('medecin') ? 'teal' : 'brand'} />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-brand-600 max-w-[120px] truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-400">{roleLabel}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 tc-press" title="Déconnexion">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors tc-press">
              Connexion
            </Link>
          )}
        </div>

        {/* Mobile button */}
        <button className="md:hidden text-slate-600 p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#e6edf7] px-4 py-4 flex flex-col gap-1 tc-fade-up">
          {authenticated && (
            <div className="flex items-center gap-3 px-1 pb-3 mb-1 border-b border-[#eef3fa]">
              <Avatar prenom={prenom || displayName} nom={nom} size="sm" tone={roles.includes('medecin') ? 'teal' : 'brand'} />
              <div><p className="text-sm font-semibold text-brand-600">{displayName}</p><p className="text-[11px] text-slate-400">{roleLabel}</p></div>
            </div>
          )}
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium ${isActive(l.to) ? 'text-brand-600 bg-brand-50' : 'text-slate-600'}`}>
              {l.label}
            </Link>
          ))}
          {authenticated ? (
            <button onClick={handleLogout} className="mt-1 text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
              Déconnexion
            </button>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-1 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold text-center">
              Connexion
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
