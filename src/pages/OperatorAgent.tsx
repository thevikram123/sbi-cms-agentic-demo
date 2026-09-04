import {
  Bot,
  CheckCircle2,
  Database,
  Mic,
  Search,
  Send,
  ShieldCheck,
  Square,
  Volume2,
} from "lucide-react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ToolTrace = {
  tool: string;
  arguments: Record<string, unknown>;
  source: string;
  status: "completed" | "confirmation_required" | "failed";
  durationMs: number;
  summary: string;
};
type Message = {
  role: "user" | "ai";
  text: string;
  trace?: ToolTrace[];
  languageCode?: string;
};
const languages = [
  {
    code: "en-IN",
    label: "English",
    prompt: "Which branches repeatedly missed frisking this month?",
  },
  {
    code: "hi-IN",
    label: "हिन्दी",
    prompt: "इस महीने किन शाखाओं में बार-बार फ्रिस्किंग प्रक्रिया छूटी?",
  },
  {
    code: "mr-IN",
    label: "मराठी",
    prompt:
      "या महिन्यात कोणत्या शाखांमध्ये वारंवार फ्रिस्किंग प्रक्रिया अपूर्ण राहिली?",
  },
  {
    code: "ta-IN",
    label: "தமிழ்",
    prompt: "இந்த மாதம் எந்த கிளைகளில் ஊழியர் சோதனை மீண்டும் மீண்டும் தவறியது?",
  },
];
const prompts = [
  "Why was SBI-INC-00421 escalated?",
  "Compare acknowledgement SLA by circle.",
];
const workerUrl = () => import.meta.env.VITE_WORKER_URL as string | undefined;
const plainText = (value: string) =>
  value
    .replace(/[`*_>#\[\]()|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2400);

export default function OperatorAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      languageCode: "en-IN",
      text: "I am the **SBI CMS Operator Agent**. I query incidents, evidence timelines, operational KPIs and approved SOPs through verified tools. State-changing actions still require your explicit approval.",
    },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [busy, setBusy] = useState(false);
  const [voiceState, setVoiceState] = useState<
    "idle" | "recording" | "transcribing" | "speaking"
  >("idle");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);

  const speak = async (text: string, languageCode = "en-IN") => {
    const worker = workerUrl();
    if (!worker || voiceState === "speaking") return;
    setVoiceState("speaking");
    try {
      audio.current?.pause();
      const response = await fetch(`${worker}/api/speech/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText(text), languageCode }),
      });
      if (!response.ok) throw new Error("Speech synthesis unavailable");
      const url = URL.createObjectURL(await response.blob());
      const player = new Audio(url);
      audio.current = player;
      player.onended = () => {
        URL.revokeObjectURL(url);
        setVoiceState("idle");
      };
      player.onerror = () => {
        URL.revokeObjectURL(url);
        setVoiceState("idle");
      };
      await player.play();
    } catch {
      setVoiceState("idle");
    }
  };

  const send = async (
    q = input,
    fromVoice = false,
    languageCode = language,
  ) => {
    if (!q.trim() || busy) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: q }]);
    setBusy(true);
    try {
      const worker = workerUrl();
      if (!worker) throw new Error("Worker URL missing");
      const response = await fetch(`${worker}/api/agent/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, responseLanguage: languageCode }),
      });
      const data = (await response.json()) as {
        answer?: string;
        toolTrace?: ToolTrace[];
        error?: string;
      };
      if (!response.ok || !data.answer)
        throw new Error(data.error || "Agent unavailable");
      const answer = data.answer;
      setMessages((current) => [
        ...current,
        { role: "ai", text: answer, trace: data.toolTrace, languageCode },
      ]);
      if (fromVoice) await speak(answer, languageCode);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: "The live operator language service is unavailable, so **no fabricated or cached answer has been substituted**. Please retry the request.",
        },
      ]);
    } finally {
      setBusy(false);
      if (voiceState !== "speaking") setVoiceState("idle");
    }
  };

  const transcribe = async (blob: Blob) => {
    const worker = workerUrl();
    if (!worker) return;
    setVoiceState("transcribing");
    try {
      const form = new FormData();
      form.append("file", blob, "operator.webm");
      form.append("language_code", language);
      const response = await fetch(`${worker}/api/speech/transcribe`, {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        text?: string;
        languageCode?: string;
      };
      if (!response.ok || !data.text) throw new Error("No speech detected");
      const detected =
        data.languageCode && data.languageCode !== "unknown"
          ? data.languageCode
          : language;
      setLanguage(detected);
      setInput(data.text);
      setVoiceState("idle");
      await send(data.text, true, detected);
    } catch {
      setVoiceState("idle");
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: "The speech service could not transcribe that recording. Keep the recording below 30 seconds and try again.",
        },
      ]);
    }
  };

  const toggleRecording = async () => {
    if (voiceState === "recording") {
      recorder.current?.stop();
      return;
    }
    if (voiceState !== "idle" || busy) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void transcribe(
          new Blob(chunks.current, { type: mediaRecorder.mimeType }),
        );
      };
      mediaRecorder.start();
      setVoiceState("recording");
      window.setTimeout(() => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 25_000);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: "Microphone access was not granted. Enable browser microphone permission to use speech input.",
        },
      ]);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERATOR LLM • MULTILINGUAL VOICE</p>
          <h1>Agentic operator</h1>
          <p>
            Ask by voice or text; answers are grounded in executed tools and
            evidence provenance.
          </p>
        </div>
        <span className="badge">
          <ShieldCheck size={12} /> Human approval enforced
        </span>
      </div>
      <div className="language-demos" aria-label="Multilingual voice demos">
        {languages.map((item) => (
          <button
            key={item.code}
            className={language === item.code ? "active" : ""}
            onClick={() => {
              setLanguage(item.code);
              setInput(item.prompt);
            }}
          >
            <span>{item.label}</span>
            <small>{item.code}</small>
          </button>
        ))}
      </div>
      <div className="agent-layout">
        <section className="panel chat-panel">
          <div className="panel-head">
            <h2>
              <Bot size={14} style={{ display: "inline", marginRight: 7 }} />
              SBI CMS Operator Agent
            </h2>
            <span>
              {busy
                ? "EXECUTING TOOLS…"
                : voiceState === "recording"
                  ? "RECORDING…"
                  : voiceState === "transcribing"
                    ? "TRANSCRIBING SPEECH…"
                    : voiceState === "speaking"
                      ? "SPEAKING RESPONSE…"
                      : "READY"}
            </span>
          </div>
          <div className="messages">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={index}>
                <small>
                  {message.role === "ai"
                    ? "Operator agent • grounded"
                    : "LHO supervisor"}
                </small>
                <div className="message-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                </div>
                {message.role === "ai" && (
                  <button
                    className="speak-button"
                    onClick={() =>
                      void speak(message.text, message.languageCode || language)
                    }
                    disabled={voiceState !== "idle"}
                    aria-label="Read response aloud"
                  >
                    <Volume2 size={12} /> Read aloud
                  </button>
                )}
                {message.trace && message.trace.length > 0 && (
                  <div className="tool-trace">
                    <b>Executed tool trace</b>
                    {message.trace.map((trace, traceIndex) => (
                      <div
                        className={`trace-row ${trace.status}`}
                        key={`${trace.tool}-${traceIndex}`}
                      >
                        <CheckCircle2 size={11} />
                        <span>
                          <strong>{trace.tool}</strong>
                          <em>
                            {trace.source} • {trace.durationMs} ms
                          </em>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="message ai">
                <small>Live execution</small>Waiting for the operator model to
                select and run the required CMS tools…
              </div>
            )}
          </div>
          <div className="suggestions">
            {prompts.map((prompt) => (
              <button key={prompt} onClick={() => void send(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <div className="chat-input">
            <button
              className={`voice-button ${voiceState === "recording" ? "recording" : ""}`}
              onClick={() => void toggleRecording()}
              disabled={busy || !["idle", "recording"].includes(voiceState)}
              aria-label={
                voiceState === "recording" ? "Stop recording" : "Ask by voice"
              }
            >
              {voiceState === "recording" ? (
                <Square size={14} />
              ) : (
                <Mic size={14} />
              )}
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void send();
              }}
              placeholder="Ask about incidents, evidence, SLA or SOP…"
            />
            <button
              className="button primary"
              onClick={() => void send()}
              disabled={!input.trim() || busy}
            >
              <Send size={14} />
              Send
            </button>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-head">
            <h2>Verified tool surface</h2>
            <Database size={14} />
          </div>
          {[
            [
              "search_incidents",
              "Filters incident records and repeat patterns.",
            ],
            [
              "get_incident_timeline",
              "Reconstructs evidence and operator decisions.",
            ],
            ["get_operational_kpis", "Queries live operational reporting views."],
            ["search_sops", "Retrieves approved SOP steps and RFP references."],
            [
              "mutating actions",
              "Requires explicit confirmation; never silent.",
            ],
          ].map(([name, description], index) => (
            <div className="tool-card" key={name}>
              <strong>
                {index < 4 ? (
                  <Search
                    size={11}
                    style={{ display: "inline", marginRight: 6 }}
                  />
                ) : (
                  <CheckCircle2
                    size={11}
                    style={{ display: "inline", marginRight: 6 }}
                  />
                )}
                {name}
              </strong>
              <p>{description}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
