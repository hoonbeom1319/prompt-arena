/* ============================================================
   kit.jsx — context, icons, atoms, phone chrome, content data
   ============================================================ */
const { useState, useEffect, createContext, useContext, Fragment } = React;

const Ctx = createContext(null);
const useArena = () => useContext(Ctx);

/* ---------- Lucide-style icons (stroke 2, round) ---------- */
const Ic = ({ d, children, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);
const IcSwords = (p) => <Ic {...p}><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/></Ic>;
const IcHome = (p) => <Ic {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Ic>;
const IcClock = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></Ic>;
const IcHistory = (p) => <Ic {...p}><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></Ic>;
const IcUser = (p) => <Ic {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>;
const IcUsers = (p) => <Ic {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>;
const IcBack = (p) => <Ic {...p}><polyline points="15 18 9 12 15 6"/></Ic>;
const IcRight = (p) => <Ic {...p}><polyline points="9 18 15 12 9 6"/></Ic>;
const IcDown = (p) => <Ic {...p}><polyline points="6 9 12 15 18 9"/></Ic>;
const IcUp = (p) => <Ic {...p}><polyline points="18 15 12 9 6 15"/></Ic>;
const IcLock = (p) => <Ic {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ic>;
const IcCheck = (p) => <Ic {...p}><polyline points="20 6 9 17 4 12"/></Ic>;
const IcCheckCircle = (p) => <Ic {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Ic>;
const IcX = (p) => <Ic {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ic>;
const IcZap = (p) => <Ic {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Ic>;
const IcTrophy = (p) => <Ic {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></Ic>;
const IcInfo = (p) => <Ic {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Ic>;
const IcShare = (p) => <Ic {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Ic>;
const IcLink = (p) => <Ic {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Ic>;
const IcCoin = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M14.8 9a2 2 0 0 0-1.8-1h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1"/><path d="M12 6v2"/><path d="M12 16v2"/></Ic>;
const IcMoon = (p) => <Ic {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Ic>;
const IcMega = (p) => <Ic {...p}><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></Ic>;
const IcChart = (p) => <Ic {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>;
const IcSettings = (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>;
const IcInbox = (p) => <Ic {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Ic>;
const IcSeed = (p) => <Ic {...p}><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></Ic>;
const IcPlus = (p) => <Ic {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>;
const IcSearch = (p) => <Ic {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ic>;
const IcSliders = (p) => <Ic {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></Ic>;
const IcSignal = (p) => <Ic {...p}><line x1="2" y1="20" x2="2" y2="20"/><path d="M5 20v-4"/><path d="M8.5 20v-8"/><path d="M12 20V8"/></Ic>;
const IcEye = (p) => <Ic {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></Ic>;
const IcTrash = (p) => <Ic {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Ic>;
const IcBattery = (p) => <Ic {...p}><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="11" x2="23" y2="13"/><rect x="3" y="8" width="13" height="8" rx="1" fill="currentColor" stroke="none"/></Ic>;
const IcWifi = (p) => <Ic {...p}><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M8.5 16.11a6 6 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></Ic>;

/* ---------- atoms ---------- */
function Chip({ children, kind = "" }) { return <span className={"chip " + kind}>{children}</span>; }

function Btn({ children, kind = "primary", sm, disabled, onClick, style, icon: Icon }) {
  return (
    <button className={["pbtn", kind, sm ? "sm" : ""].join(" ").trim()} style={style}
      disabled={disabled} onClick={disabled ? undefined : onClick}>
      {Icon && <Icon />}{children}
    </button>
  );
}

function Anno({ children }) {
  return <div className="anno"><IcInfo s={13} /><span>{children}</span></div>;
}
function Pin({ children, style }) { return <div className="anno-pin" style={style}>{children}</div>; }

function Stat({ n, k, accent }) {
  return <div className={"stat" + (accent ? " accent" : "")}><div className="n tnum">{n}</div><div className="k">{k}</div></div>;
}
function Meter({ pct, ink, style }) {
  return <div className={"meter" + (ink ? " ink" : "")} style={style}><i style={{ width: pct + "%" }}></i></div>;
}
function Tokens({ used = 0, total = 3 }) {
  return <span className="tokens">{Array.from({ length: total }).map((_, i) => <span key={i} className={"tk" + (i < used ? " used" : "")}></span>)}</span>;
}
function PhaseStrip({ phase }) {
  const order = ["submit", "vote", "result"];
  const names = { submit: "제출", vote: "투표", result: "결과" };
  const idx = order.indexOf(phase);
  return (
    <div className="phasestrip">
      {order.map((p, i) => (
        <Fragment key={p}>
          <span className={"ph " + (i < idx ? "done" : i === idx ? "now" : "")}><span className="pdot"></span>{names[p]}</span>
          {i < 2 && <span className="arr">→</span>}
        </Fragment>
      ))}
    </div>
  );
}

/* a rendered "Gemini output" block — real-ish Korean copy */
function Output({ head = "Gemini 결과물", children, style }) {
  return (
    <div className="output" style={style}>
      <div className="ohead"><IcZap />{head}</div>
      {children}
    </div>
  );
}

function Avatar({ name, size = 36, accent }) {
  const ch = (name || "익").replace(/[^가-힣A-Za-z0-9]/g, "").slice(-2);
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.34, ...(accent ? { background: "var(--acc-100)", color: "var(--acc-700)", borderColor: "var(--acc-300)" } : {}) }}>{ch || "?"}</span>;
}

/* ---------- phone chrome ---------- */
function Phone({ children }) {
  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="notch"></div>
        <div className="statusbar">
          <span className="si">9:41</span>
          <span className="si"><IcSignal s={15} /><IcWifi s={15} /><IcBattery s={20} /></span>
        </div>
        {children}
      </div>
    </div>
  );
}
function AppBar({ title, onBack, right }) {
  return (
    <div className="appbar">
      {onBack && <button className="back" onClick={onBack}><IcBack s={20} /></button>}
      <span className="title">{title}</span>
      <span className="spacer"></span>
      {right}
    </div>
  );
}
function TabBar({ active, go }) {
  const items = [
    { id: "home", label: "아레나", Ic: IcHome },
    { id: "past", label: "지난 챌린지", Ic: IcHistory },
    { id: "profile", label: "내 프로필", Ic: IcUser },
  ];
  return (
    <div className="tabbar">
      {items.map(it => (
        <button key={it.id} className={active === it.id ? "on" : ""} onClick={() => go(it.id)}>
          <it.Ic s={21} />{it.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   CONTENT DATA — realistic Korean copy
   ============================================================ */
const TOPIC = { cat: "글쓰기", title: "거절 메일을 정중하지만 단호하게", brief: "협업 제안을 받았지만 일정상 함께하기 어려운 상황. 상대의 기분을 상하게 하지 않으면서도 여지를 남기지 않는 거절 메일을 작성하세요." };

const NEXT_TOPIC = { cat: "요약", title: "회의록을 3줄로 요약하기" };

/* sample Gemini outputs per generation attempt */
const GEN_OUTPUTS = [
  "안녕하세요, 보내주신 제안 잘 받았습니다.\n함께할 수 있다면 좋겠지만, 현재 진행 중인 프로젝트 일정이 빠듯하여 이번에는 참여가 어려울 것 같습니다. 좋은 기회를 제안해 주셔서 진심으로 감사드립니다.",
  "제안 주신 내용을 신중히 검토했습니다.\n다만 지금 맡고 있는 업무에 집중해야 하는 시기라, 이번 협업은 정중히 사양하고자 합니다. 다음에 더 좋은 형태로 함께할 수 있길 바랍니다.",
  "먼저 제안에 감사드립니다.\n아쉽게도 현재 리소스 여건상 이번 프로젝트에는 함께하기 어렵다는 결론을 내렸습니다. 결정에 도움이 되지 못해 죄송하며, 좋은 성과 거두시길 응원하겠습니다.",
  "보내주신 제안 깊이 감사드립니다.\n검토 결과, 지금 일정으로는 기대하시는 만큼의 기여를 드리기 어려울 것 같아 이번에는 고사하겠습니다. 추후 더 적절한 시점에 인연이 닿기를 바랍니다.",
  "제안해 주셔서 감사합니다.\n현재 우선순위가 다른 업무에 맞춰져 있어, 이번 협업은 정중히 거절드립니다. 배려 부탁드리며, 앞으로도 좋은 관계 이어갔으면 합니다.",
];

/* anonymized entries for vote / result */
const ENTRIES = [
  { id: "a3f", out: GEN_OUTPUTS[0] },
  { id: "b9c", out: GEN_OUTPUTS[1] },
  { id: "k21", out: GEN_OUTPUTS[2] },
  { id: "me7", out: GEN_OUTPUTS[3], me: true },
  { id: "x04", out: GEN_OUTPUTS[4] },
];

const RANKS = [
  { r: 1, id: "a3f", v: 23 },
  { r: 2, id: "b9c", v: 19 },
  { r: 3, id: "k21", v: 14 },
  { r: 4, id: "me7", v: 7, me: true },
  { r: 5, id: "x04", v: 5 },
];

Object.assign(window, {
  Ctx, useArena, Fragment,
  IcSwords, IcHome, IcClock, IcHistory, IcUser, IcUsers, IcBack, IcRight, IcDown, IcUp,
  IcLock, IcCheck, IcCheckCircle, IcX, IcZap, IcInfo, IcShare, IcLink, IcCoin, IcMoon,
  IcMega, IcChart, IcSettings, IcInbox, IcSeed, IcPlus, IcSearch, IcSliders, IcTrophy, IcEye, IcTrash,
  Chip, Btn, Anno, Pin, Stat, Meter, Tokens, PhaseStrip, Output, Avatar,
  Phone, AppBar, TabBar,
  TOPIC, NEXT_TOPIC, GEN_OUTPUTS, ENTRIES, RANKS,
});
