import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import VideoCall from '../components/WebRTC/VideoCall';

export default function TeleconsultationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPeerId = searchParams.get('peer') || '';

  return (
    <div className="min-h-screen bg-[#eef3fa]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3c6e] mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au tableau de bord
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a3c6e]">Téléconsultation vidéo</h1>
          <p className="text-sm text-gray-500">
            {initialPeerId
              ? 'Connexion à la consultation en cours…'
              : 'Autorisez la caméra et le micro, puis invitez votre correspondant.'}
          </p>
        </div>

        <VideoCall initialPeerId={initialPeerId} onLeave={() => {}} />
      </main>
    </div>
  );
}
