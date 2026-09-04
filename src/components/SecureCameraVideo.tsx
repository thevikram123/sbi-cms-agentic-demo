import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type VideoHTMLAttributes,
} from "react";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  assetId: string;
  priority?: boolean;
};

export default function SecureCameraVideo({
  assetId,
  priority = false,
  autoPlay,
  onCanPlay,
  onError,
  ...videoProps
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const retried = useRef(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const worker = import.meta.env.VITE_WORKER_URL as string | undefined;

  useEffect(() => {
    retried.current = false;
    setUrl("");
    setFailed(false);
    setShouldLoad(priority);
  }, [assetId, priority]);

  useEffect(() => {
    if (priority || shouldLoad || !host.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [priority, shouldLoad]);

  const loadSignedUrl = useCallback(async () => {
    if (!worker) {
      setFailed(true);
      return;
    }
    try {
      const response = await fetch(
        `${worker}/api/evidence/${encodeURIComponent(assetId)}/url`,
        { signal: AbortSignal.timeout(10_000) },
      );
      if (!response.ok) throw new Error("signed_url_failed");
      const payload = (await response.json()) as { url: string };
      setUrl(payload.url);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [assetId, worker]);

  useEffect(() => {
    if (shouldLoad) void loadSignedUrl();
  }, [loadSignedUrl, shouldLoad]);

  return (
    <div className="secure-video-host" ref={host}>
      {!shouldLoad || (!url && !failed) ? (
        <div className="secure-video-state">PRIVATE FEED • STANDBY</div>
      ) : failed ? (
        <button
          className="secure-video-state secure-video-retry"
          onClick={() => {
            retried.current = false;
            setFailed(false);
            void loadSignedUrl();
          }}
        >
          FEED UNAVAILABLE • RETRY
        </button>
      ) : (
        <video
          {...videoProps}
          autoPlay={autoPlay}
          src={url}
          onCanPlay={(event) => {
            if (autoPlay) void event.currentTarget.play().catch(() => undefined);
            onCanPlay?.(event);
          }}
          onError={(event) => {
            if (!retried.current) {
              retried.current = true;
              setUrl("");
              void loadSignedUrl();
            } else {
              setFailed(true);
            }
            onError?.(event);
          }}
        />
      )}
    </div>
  );
}
