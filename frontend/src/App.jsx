import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MedecinsPage from './pages/MedecinsPage';
import PrendreRdvPage from './pages/PrendreRdvPage';
import MesRendezVousPage from './pages/MesRendezVousPage';
import CarnetSantePage from './pages/CarnetSantePage';
import TeleconsultationPage from './pages/TeleconsultationPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/medecins" element={<MedecinsPage />} />
            <Route path="/rendez-vous/nouveau" element={<PrendreRdvPage />} />
            <Route path="/mes-rendez-vous" element={<MesRendezVousPage />} />
            <Route path="/patients/:id/carnet" element={<CarnetSantePage />} />
            <Route path="/teleconsultation" element={<TeleconsultationPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
