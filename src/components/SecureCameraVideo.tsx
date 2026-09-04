import { useCallback, useEffect, useState, type VideoHTMLAttributes } from 'react';

type Props = VideoHTMLAttributes<HTMLVideoElement> & { assetId: string };

export default function SecureCameraVideo({ assetId, onError, ...videoProps }: Props) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const worker = import.meta.env.VITE_WORKER_URL as string | undefined;

  const loadSignedUrl = useCallback(async () => {
    if (!worker) { setFailed(true); return; }
    try {
      const response = await fetch(`${worker}/api/evidence/${encodeURIComponent(assetId)}/url`);
      if (!response.ok) throw new Error('signed_url_failed');
      const payload = await response.json() as { url: string };
      setUrl(payload.url);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [assetId, worker]);

  useEffect(() => { void loadSignedUrl(); }, [loadSignedUrl]);

  if (!url || failed) return <div className="secure-video-state">{failed ? 'PRIVATE FEED UNAVAILABLE' : 'REQUESTING PRIVATE FEED…'}</div>;
  return <video {...videoProps} src={url} onError={event => { setUrl(''); void loadSignedUrl(); onError?.(event); }} />;
}
