import { useState, useCallback, useRef } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const SIGNALING_URL = 'https://dark-bush-6ebf.sendit2isaiah.workers.dev';

async function storeData(obj) {
  const data = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  const res = await fetch(`${SIGNALING_URL}/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const text = await res.text();
  if (!text) throw new Error(`Worker returned empty response (status ${res.status})`);
  try {
    const json = JSON.parse(text);
    if (json.error) throw new Error(`Worker error: ${json.error}`);
    return json.code;
  } catch (e) {
    throw new Error(`Worker response (${res.status}): ${text}`);
  }
}

async function retrieveData(code) {
  const res = await fetch(`${SIGNALING_URL}/retrieve?code=${code.toUpperCase()}`);
  if (!res.ok) throw new Error('Code not found or expired');
  const { data } = await res.json();
  return JSON.parse(decodeURIComponent(escape(atob(data))));
}

function waitForICE(pc) {
  return new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
    setTimeout(resolve, 6000);
  });
}

export function useWebRTCMultiplayer({ onStateReceived, onPeerMessage }) {
  const [role, setRole] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [peers, setPeers] = useState({});
  const [error, setError] = useState(null);

  const peerRefs = useRef({});
  const hostRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  // ── HOST ──────────────────────────────────────────────────────────────

  const startHosting = useCallback(() => {
    setRole('host');
    setPhase('hosting');
  }, []);

  const createOfferForSlot = useCallback(async (slotId) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const channel = pc.createDataChannel('draft', { ordered: true });

      peerRefs.current[slotId] = { pc, channel };

      channel.onopen = () => {
        setPeers(prev => ({ ...prev, [slotId]: { ...prev[slotId], connected: true } }));
      };
      channel.onclose = () => {
        setPeers(prev => ({ ...prev, [slotId]: { ...prev[slotId], connected: false } }));
      };
      channel.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        onPeerMessage?.(slotId, msg);
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          setError(`Connection failed for slot ${slotId}. Try regenerating the code.`);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForICE(pc);

      setPeers(prev => ({ ...prev, [slotId]: { connected: false } }));
      return await storeData({ sdp: pc.localDescription, slotId });
    } catch (e) {
      setError(`Failed to create offer: ${e.message}`);
      return null;
    }
  }, [onPeerMessage]);

  const receiveAnswer = useCallback(async (answerCode) => {
    try {
      const { sdp, slotId } = await retrieveData(answerCode.trim());
      const peer = peerRefs.current[slotId];
      if (!peer) {
        setError('No pending offer for this answer. Generate an offer for this slot first.');
        return false;
      }
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      return true;
    } catch (e) {
      setError(`Invalid answer code: ${e.message}`);
      return false;
    }
  }, []);

  const broadcastState = useCallback((state) => {
    Object.entries(peerRefs.current).forEach(([, { channel }]) => {
      if (channel?.readyState === 'open') {
        channel.send(JSON.stringify({ type: 'STATE', state }));
      }
    });
  }, []);

  const sendToPeer = useCallback((slotId, msg) => {
    const peer = peerRefs.current[slotId];
    if (peer?.channel?.readyState === 'open') {
      peer.channel.send(JSON.stringify(msg));
    }
  }, []);

  // ── GUEST ─────────────────────────────────────────────────────────────

  const joinWithOfferCode = useCallback(async (offerCode) => {
async function retrieveData(code) {
  const res = await fetch(`${SIGNALING_URL}/retrieve?code=${code.toUpperCase()}`);
  if (!res.ok) throw new Error('Code not found or expired');
  const { data } = await res.json();
  return JSON.parse(decodeURIComponent(escape(atob(data))));
}

    try {
      setPhase('connecting');
      const { sdp, slotId } = await retrieveData(offerCode.trim());

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      hostRef.current = { pc, slotId };

      pc.ondatachannel = (e) => {
        const channel = e.channel;
        hostRef.current.channel = channel;

        channel.onopen = () => {
            setRole('guest');
            setPhase('connected');
        };
        channel.onclose = () => {
          setPhase('idle');
          setError('Disconnected from host.');
        };
        channel.onmessage = (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'STATE') {
            onStateReceived?.(msg.state);
          } else {
            onPeerMessage?.('host', msg);
          }
        };
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          setError('Connection to host failed. Ask host to regenerate the offer code.');
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForICE(pc);

      return encode({ sdp: pc.localDescription, slotId });
    } catch (e) {
      setPhase('idle');
      setError(`Failed to join: ${e.message}`);
      return null;
    }
  }, [onStateReceived, onPeerMessage]);

  const sendToHost = useCallback((msg) => {
    const channel = hostRef.current?.channel;
    if (channel?.readyState === 'open') {
      channel.send(JSON.stringify(msg));
    }
  }, []);

  return {
    role,
    phase,
    setPhase,
    peers,
    error,
    clearError,
    startHosting,
    createOfferForSlot,
    receiveAnswer,
    broadcastState,
    sendToPeer,
    joinWithOfferCode,
    sendToHost,
    mySlotId: hostRef.current?.slotId ?? null,
  };
}