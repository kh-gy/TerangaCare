import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MedecinsPage from './pages/MedecinsPage';
import PrendreRdvPage from './pages/PrendreRdvPage';
import RendezVousPage from './pages/RendezVousPage';
import MesRendezVousPage from './pages/MesRendezVousPage';
import CarnetSantePage from './pages/CarnetSantePage';
import MonCarnetPage from './pages/MonCarnetPage';
import OrdonnancesPage from './pages/OrdonnancesPage';
import RedigerOrdonnancePage from './pages/RedigerOrdonnancePage';
import PatientsPage from './pages/PatientsPage';
import TeleconsultationPage from './pages/TeleconsultationPage';
import PaiementPage from './pages/PaiementPage';
import AvisMedecinPage from './pages/AvisMedecinPage';
import OrientationPage from './pages/OrientationPage';

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
            <Route path="/rendez-vous" element={<RendezVousPage />} />
            <Route path="/rendez-vous/nouveau" element={<PrendreRdvPage />} />
            <Route path="/mes-rendez-vous" element={<MesRendezVousPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id/carnet" element={<CarnetSantePage />} />
            <Route path="/mon-carnet" element={<MonCarnetPage />} />
            <Route path="/ordonnances" element={<OrdonnancesPage />} />
            <Route path="/ordonnances/nouvelle" element={<RedigerOrdonnancePage />} />
            <Route path="/teleconsultation" element={<TeleconsultationPage />} />
            <Route path="/paiement" element={<PaiementPage />} />
            <Route path="/medecins/:id/avis" element={<AvisMedecinPage />} />
            <Route path="/orientation" element={<OrientationPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
