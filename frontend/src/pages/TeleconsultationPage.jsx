import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import VideoCall from '../components/WebRTC/VideoCall';
import { fetchTeleconsultation, endTeleconsultation } from '../api/teleconsultations';

export default function TeleconsultationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tcId = searchParams.get('tc');
  const role = searchParams.get('role') || 'guest'; // host | guest
  const patientId = searchParams.get('patient');
  const standalonePeer = searchParams.get('peer') || '';

  const [roomPeerId, setRoomPeerId] = useState('');
  const [loading, setLoading] = useState(Boolean(tcId));
  const [error, setError] = useState('');
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!tcId) return;
    fetchTeleconsultation(tcId)
      .then((tc) => setRoomPeerId(tc.peer_id || tc.lien_video || ''))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tcId]);

  async function handleEnd() {
    setEnding(true);
    try {
      if (tcId) await endTeleconsultation(tcId);
      if (patientId) navigate(`/ordonnances/nouvelle?tc=${tcId}&patient=${patientId}`);
      else navigate('/dashboard');
    } catch (e) {
      setError(e.message);
      setEnding(false);
    }
  }

  const linked = Boolean(tcId);
  const mode = linked ? role : 'standalone';

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

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a3c6e]">Téléconsultation vidéo</h1>
            <p className="text-sm text-gray-500">
              {linked
                ? role === 'host' ? 'Consultation en tant que médecin' : 'Vous rejoignez la consultation'
                : 'Autorisez la caméra et le micro, puis invitez votre correspondant.'}
            </p>
          </div>
          {linked && role === 'host' && (
            <button
              onClick={handleEnd}
              disabled={ending}
              className="flex-shrink-0 bg-[#2aab8e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#238f77] transition-colors disabled:opacity-50"
            >
              {ending ? 'Clôture…' : 'Terminer & rédiger ordonnance'}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <VideoCall
            mode={mode}
            roomPeerId={roomPeerId}
            initialPeerId={standalonePeer}
            onLeave={() => {}}
          />
        )}
      </main>
    </div>
  );
}
