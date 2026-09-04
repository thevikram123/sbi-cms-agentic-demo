import { Cpu, Database, Server, Video } from "lucide-react";
import { scenarios } from "../data/demoData";
import { img } from "../utils/imagePath";
import SecureCameraVideo from "../components/SecureCameraVideo";

const twinTelemetry = [
  { label: "2 PERSONS • ACCESS ZONE", left: "49%", top: "27%", width: "28%", height: "58%" },
  { label: "QUEUE • 8 PERSONS", left: "18%", top: "12%", width: "74%", height: "75%" },
  { label: "IDENTITY CHECK", left: "52%", top: "18%", width: "29%", height: "70%" },
  { label: "CAMERA INTERACTION", left: "48%", top: "20%", width: "39%", height: "72%" },
  { label: "CABINET INTERACTION", left: "62%", top: "20%", width: "25%", height: "72%" },
  { label: "DENSITY THRESHOLD", left: "8%", top: "7%", width: "66%", height: "77%" },
  { label: "ENTRY TRACK • 1", left: "24%", top: "16%", width: "39%", height: "76%" },
  { label: "FRISKING CHECKPOINT", left: "35%", top: "16%", width: "40%", height: "74%" },
  { label: "UNATTENDED OBJECT", left: "54%", top: "58%", width: "18%", height: "28%" },
];

export default function DigitalTwin() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CAMERAS • DEVICES • CORRELATION</p>
          <h1>Cameras & digital twin</h1>
          <p>
            Every camera is connected to its branch, security zones, sensors and
            operating procedures.
          </p>
        </div>
        <div className="toolbar">
          <button className="button primary">
            <Video size={14} />
            1,198 live
          </button>
          <button className="button">
            <Cpu size={14} />
            800 devices
          </button>
        </div>
      </div>
      <section className="metrics">
        <div className="metric green">
          <label>Camera availability</label>
          <strong>99.83%</strong>
          <small>2 devices require attention</small>
        </div>
        <div className="metric">
          <label>ACS integrations</label>
          <strong>250</strong>
          <small>All pilot branches connected</small>
        </div>
        <div className="metric">
          <label>SAS zones</label>
          <strong>412</strong>
          <small>Strong room and perimeter</small>
        </div>
        <div className="metric">
          <label>Analysis cache hit rate</label>
          <strong>94.6%</strong>
          <small>No repeat vision-token cost</small>
        </div>
      </section>
      <div className="grid-main" style={{ marginBottom: 12 }}>
        <section className="panel">
          <div className="panel-head">
            <h2>Generated SBI branch digital twin</h2>
            <span>FORT BRANCH • MUMBAI • PRESENTATION VISUALIZATION</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <img
              src={img("/images/sbi-branch-digital-twin.png")}
              alt="Generated isometric digital twin of an SBI branch"
              style={{
                width: "100%",
                height: 300,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div className="flow" style={{ padding: 14 }}>
              <span>Entrance CAM-01</span>
              <b>→</b>
              <span>Frisking zone</span>
              <b>→</b>
              <span>ACS door</span>
              <b>→</b>
              <span>Teller hall</span>
              <b>→</b>
              <span>Server room</span>
            </div>
          </div>
        </section>
        <aside className="panel">
          <div className="panel-head">
            <h2>Prototype → production</h2>
            <Server size={14} />
          </div>
          <div className="panel-body architecture">
            <div className="arch-row">
              <div className="arch-node cloud">Secure API gateway</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node">On-prem AI gateway</div>
            </div>
            <div className="arch-row">
              <div className="arch-node cloud">Pilot data platform</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node">On-prem PostgreSQL</div>
            </div>
            <div className="arch-row">
              <div className="arch-node cloud">Private Storage</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node">SBI object storage</div>
            </div>
            <div className="arch-row">
              <div className="arch-node cloud">Video / language models</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node">Approved model endpoints</div>
            </div>
            <div className="callout">
              <strong>Corrigendum aligned</strong>
              <p>
                The cloud stack is presentation infrastructure only. The
                interfaces and data contracts remain portable to SBI’s on-prem
                environment.
              </p>
            </div>
          </div>
        </aside>
      </div>
      <section className="scenario-grid">
        {scenarios.map((s, index) => {
          const telemetry = twinTelemetry[index];
          return (
            <article className="scenario-card twin-scenario-card" key={s.id}>
              <div className="twin-pair">
                <div className="twin-pane">
                  <span>CCTV</span>
                  <SecureCameraVideo
                    assetId={s.id}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
                <div className="twin-pane">
                  <span>Digital twin</span>
                  <div className="twin-zone">
                    <img
                      src={img(`/images/digital-twins/${s.id.toLowerCase()}.jpg`)}
                      alt={`3D scene twin reconstructed for ${s.name}`}
                    />
                    <div
                      className={`twin-detection ${s.state === "alert" ? "alert" : ""}`}
                      style={{
                        left: telemetry.left,
                        top: telemetry.top,
                        width: telemetry.width,
                        height: telemetry.height,
                      }}
                    >
                      <b>{telemetry.label}</b>
                    </div>
                    <div className="twin-sim-chip">SIMULATION • SYNCED</div>
                  </div>
                </div>
              </div>
              <div className="scenario-copy">
                <strong>{s.name}</strong>
                <small>
                  {s.id} • {s.source}
                </small>
                <div className="scenario-meta">
                  <span
                    className={`badge ${s.state === "alert" ? "critical" : ""}`}
                  >
                    {s.status}
                  </span>
                  <span style={{ fontSize: 9, color: "#5d6970" }}>
                    Live CCTV • matched 3D scene
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
