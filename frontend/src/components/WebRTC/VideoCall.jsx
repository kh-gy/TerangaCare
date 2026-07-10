import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

/**
 * Composant de téléconsultation vidéo (WebRTC via PeerJS).
 *
 * Modèle de connexion sans serveur de signalisation dédié : chaque participant
 * reçoit un identifiant (peer id). Pour se connecter, on partage le lien
 * `?peer=<id>` — le destinataire appelle automatiquement l'émetteur.
 *
 * Props :
 *  - initialPeerId : id distant à appeler automatiquement (mode standalone)
 *  - roomPeerId    : identifiant de room d'une téléconsultation (backend)
 *  - mode          : 'standalone' | 'host' | 'guest'
 *      · host  : le médecin s'enregistre SUR roomPeerId et attend l'appel
 *      · guest : le patient appelle roomPeerId
 *  - onLeave       : callback appelé quand l'utilisateur raccroche (optionnel)
 */
export default function VideoCall({ initialPeerId = '', roomPeerId = '', mode = 'standalone', onLeave }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);
  const cameraTrackRef = useRef(null);

  const [myId, setMyId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('init'); // init | ready | calling | in-call | ended
  const [error, setError] = useState(() =>
    typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia
      ? ''
      : "Votre navigateur ne supporte pas l'accès caméra/micro (contexte non sécurisé ?).",
  );
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const attachRemote = useCallback((stream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
    setStatus('in-call');
  }, []);

  const startCall = useCallback((targetId) => {
    const id = (targetId || '').trim();
    if (!id || !peerRef.current || !localStreamRef.current) return;
    setStatus('calling');
    const call = peerRef.current.call(id, localStreamRef.current);
    if (!call) {
      setError("Impossible d'initier l'appel. Vérifiez l'identifiant.");
      setStatus('ready');
      return;
    }
    callRef.current = call;
    call.on('stream', attachRemote);
    call.on('close', () => setStatus('ready'));
    call.on('error', (e) => setError(e?.message || "Erreur pendant l'appel"));
  }, [attachRemote]);

  // Initialisation : média local + peer
  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      return undefined; // message déjà positionné via l'initialiseur du state `error`
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] || null;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // En mode "host", le médecin s'enregistre sur l'id de room pour être joignable.
        const peer = mode === 'host' && roomPeerId ? new Peer(roomPeerId) : new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
          if (cancelled) return;
          setMyId(id);
          setStatus('ready');
          if (mode === 'guest' && roomPeerId) startCall(roomPeerId);
          else if (mode === 'standalone' && initialPeerId) startCall(initialPeerId);
        });

        peer.on('call', (call) => {
          callRef.current = call;
          call.answer(localStreamRef.current);
          call.on('stream', attachRemote);
          call.on('close', () => setStatus('ready'));
        });

        peer.on('error', (e) => {
          if (!cancelled) setError(e?.type ? `Erreur PeerJS : ${e.type}` : 'Erreur de connexion');
        });
      })
      .catch(() => {
        if (!cancelled) setError('Accès caméra/micro refusé. Autorisez-le puis rechargez la page.');
      });

    return () => {
      cancelled = true;
      if (callRef.current) callRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const stopShare = useCallback(async () => {
    const camTrack = cameraTrackRef.current;
    const sender = callRef.current?.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && camTrack) await sender.replaceTrack(camTrack);
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setSharing(false);
  }, []);

  const shareScreen = async () => {
    if (sharing) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = callRef.current?.peerConnection?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setSharing(true);
      screenTrack.onended = () => stopShare();
    } catch {
      /* l'utilisateur a annulé le partage */
    }
  };

  const hangUp = () => {
    if (callRef.current) callRef.current.close();
    if (peerRef.current) peerRef.current.destroy();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    setStatus('ended');
    if (onLeave) onLeave();
  };

  const shareLink = myId ? `${window.location.origin}/teleconsultation?peer=${myId}` : '';

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  if (status === 'ended') {
    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-8l8 8" />
          </svg>
        </div>
        <p className="text-[#1a3c6e] font-bold">Consultation terminée</p>
        <p className="text-sm text-gray-500 mt-1">Vous pouvez fermer cette fenêtre.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Vidéos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {status !== 'in-call' && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
              {status === 'calling' ? 'Appel en cours…' : 'En attente du correspondant…'}
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">Correspondant</span>
        </div>
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
            Vous {sharing && '(partage écran)'}
          </span>
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a3c6e] text-white text-sm">Caméra coupée</div>
          )}
        </div>
      </div>

      {/* Contrôles */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-[#eef3fa] text-[#1a3c6e]' : 'bg-red-100 text-red-600'}`}
          title={micOn ? 'Couper le micro' : 'Activer le micro'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v3m0-3a4 4 0 004-4V5a4 4 0 00-8 0v6a4 4 0 004 4z" /></svg>
        </button>
        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-[#eef3fa] text-[#1a3c6e]' : 'bg-red-100 text-red-600'}`}
          title={camOn ? 'Couper la caméra' : 'Activer la caméra'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
        <button
          onClick={sharing ? stopShare : shareScreen}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${sharing ? 'bg-[#2aab8e] text-white' : 'bg-[#eef3fa] text-[#1a3c6e]'}`}
          title="Partager l'écran"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </button>
        <button
          onClick={hangUp}
          className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
          title="Raccrocher"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.61z" /></svg>
        </button>
      </div>

      {/* En téléconsultation reliée : indication d'attente */}
      {mode !== 'standalone' && status !== 'in-call' && !error && (
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-sm text-[#1a3c6e] font-semibold">
            {mode === 'host' ? 'En attente que le patient rejoigne…' : 'Connexion au médecin…'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Salle : {roomPeerId}</p>
        </div>
      )}

      {/* Connexion / partage du lien (mode autonome) */}
      {mode === 'standalone' && status !== 'in-call' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-sm font-bold text-[#1a3c6e] mb-2">Inviter le correspondant</p>
            <p className="text-xs text-gray-500 mb-2">Partagez ce lien pour qu'il rejoigne la consultation :</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareLink}
                placeholder="Génération de l'identifiant…"
                className="flex-1 border border-[#dde8f5] rounded-xl px-3 py-2 text-xs text-gray-600 bg-[#eef3fa] outline-none"
              />
              <button
                onClick={copyLink}
                disabled={!shareLink}
                className="bg-[#1a3c6e] text-white text-xs font-semibold px-4 rounded-xl hover:bg-[#152f58] transition-colors disabled:opacity-40"
              >
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-bold text-[#1a3c6e] mb-2">Ou rejoindre par identifiant</p>
            <div className="flex gap-2">
              <input
                value={remoteId}
                onChange={(e) => setRemoteId(e.target.value)}
                placeholder="Identifiant du correspondant"
                className="flex-1 border border-[#dde8f5] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a3c6e] transition-colors"
              />
              <button
                onClick={() => startCall(remoteId)}
                disabled={!remoteId.trim() || status === 'calling'}
                className="bg-[#2aab8e] text-white text-sm font-semibold px-4 rounded-xl hover:bg-[#238f77] transition-colors disabled:opacity-40"
              >
                Appeler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
