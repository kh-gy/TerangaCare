import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Logo from '../components/ui/Logo';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { authenticated, error, initialized, isConfigured, register } = useAuth();

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#eef3fa] flex items-center justify-center px-4 py-8 text-[#1a3c6e] font-semibold">
        Initialisation de Keycloak...
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isConfigured) {
      setSubmitError('La configuration API est manquante. Vérifie la variable VITE_API_BASE_URL.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setSubmitError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitError('');

    void register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      role: form.role,
    })
      .then(() => navigate('/login', { replace: true }))
      .catch((authError) => {
        setSubmitError(authError instanceof Error ? authError.message : 'Impossible de créer le compte.');
      });
  };

  return (
    <div className="min-h-screen bg-[#eef3fa] flex flex-col items-center justify-center px-4 py-8">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Logo size={60} className="mb-4" />
          <h1 className="text-2xl font-bold text-[#1a3c6e]">TerangaCare</h1>
          <p className="text-gray-500 text-sm text-center mt-1">
            Créez votre compte via Keycloak pour centraliser l'identité et les rôles.
          </p>
        </div>

        {(error || submitError) && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError || error?.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Je suis</label>
            <div className="flex gap-2">
              {[
                { value: 'patient', label: 'Patient' },
                { value: 'medecin', label: 'Médecin' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                    form.role === r.value
                      ? 'bg-[#1a3c6e] text-white border-[#1a3c6e]'
                      : 'bg-white text-gray-500 border-[#c8d9ef] hover:border-[#1a3c6e]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* First and last name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 items-center overflow-hidden border-2 border-[#c8d9ef] rounded-xl px-3 py-3 focus-within:border-[#1a3c6e] transition-colors bg-white">
                <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Fatou"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="w-full min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                />
              </div>
              <div className="flex min-w-0 items-center overflow-hidden border-2 border-[#c8d9ef] rounded-xl px-3 py-3 focus-within:border-[#1a3c6e] transition-colors bg-white">
                <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Diallo"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="w-full min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse e-mail</label>
            <div className="flex items-center border-2 border-[#c8d9ef] rounded-xl px-3 py-3 focus-within:border-[#1a3c6e] transition-colors bg-white">
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                name="email"
                placeholder="patient@exemple.com"
                value={form.email}
                onChange={handleChange}
                required
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
            <div className="flex items-center border-2 border-[#c8d9ef] rounded-xl px-3 py-3 focus-within:border-[#1a3c6e] transition-colors bg-white">
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 ml-2"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
            <div className="flex items-center border-2 border-[#c8d9ef] rounded-xl px-3 py-3 focus-within:border-[#1a3c6e] transition-colors bg-white">
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-gray-400 ml-2"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-red-500 text-xs mt-1 ml-1">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#1a3c6e] text-white py-4 rounded-full font-semibold text-base hover:bg-[#152f58] transition-colors mt-1 shadow-md"
          >
            Créer mon compte avec Keycloak
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-gray-200" />
          <span className="text-gray-400 text-sm">Ou continuer avec</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Social buttons */}
        <div className="flex gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </button>
        </div>
      </div>

      {/* Login link */}
      <p className="mt-6 text-gray-600 text-sm">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-[#1a3c6e] font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
