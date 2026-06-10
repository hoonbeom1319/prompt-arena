/* ============================================================
   app.jsx — shell · router · harness · design options
   (loaded last)
   ============================================================ */

const USER_FLOW = [
  ["home", "첫 화면", IcHome, "확정"],
  ["create", "프롬프트 생성", IcZap, "A/B/C"],
  ["detail", "출품작 상세", IcInbox, null],
  ["vote", "투표", IcCheckCircle, "A/B/C"],
  ["result", "결과 · 순위", IcTrophy, "A/B/C"],
  ["login", "로그인 게이트", IcLock, null],
  ["profile", "내 프로필", IcUser, null],
  ["past", "지난 챌린지", IcHistory, null],
];
const ADMIN_FLOW = [
  ["adminLogin", "관리자 로그인", IcLock],
  ["adminDash", "대시보드", IcChart],
  ["adminCreate", "챌린지 출제", IcPlus],
  ["adminSeed", "시드 제출", IcSeed],
  ["adminMonitor", "출품·결과", IcInbox],
  ["adminUsers", "사용자·코인", IcUsers],
];
const TOPLEVEL = ["home", "past", "profile"];
const VARIANT_SCREENS = {
  create: { label: "생성 화면", names: { A: "단일+히스토리", B: "비교 캐러셀", C: "채팅 스레드" } },
  vote: { label: "투표 화면", names: { A: "블라인드 피드", B: "카드 스택", C: "2-up 비교" } },
  result: { label: "결과 화면", names: { A: "시상대", B: "막대 랭킹", C: "스포트라이트" } },
};
const ALL = USER_FLOW.concat(ADMIN_FLOW);
const isAdmin = s => s.startsWith("admin");

function App() {
  const [screen, setScreen] = useState("home");
  const [phase, setPhase] = useState("submit");
  const [loggedIn, setLoggedIn] = useState(false);
  const [pending, setPending] = useState(null);
  const [returnScreen, setReturnScreen] = useState("home");
  const [genCount, setGenCount] = useState(0);
  const [selectedGen, setSelectedGen] = useState(0);
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [votesUsed, setVotesUsed] = useState(0);
  const [modal, setModal] = useState(null);
  const [entry, setEntry] = useState(null);
  const [toast, setToast] = useState(null);
  const [variants, setVariants] = useState({ create: "A", vote: "A", result: "A" });
  const [showAnno, setShowAnno] = useState(false);
  const [accent, setAccent] = useState("sky");

  const promptsUnlocked = votesUsed >= 3;

  useEffect(() => {
    document.body.classList.toggle("show-anno", showAnno);
    document.body.dataset.accent = accent;
  }, [showAnno, accent]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (s) => { setScreen(s); setModal(null); };
  const setVariant = (which, k) => setVariants(v => ({ ...v, [which]: k }));

  const requireLogin = (label, fn) => {
    if (loggedIn) { fn(); return; }
    setPending({ label, fn }); setReturnScreen(screen); setScreen("login");
  };
  const act = (name) => {
    if (name === "create") return requireLogin("프롬프트 만들기", () => go("create"));
    if (name === "mySubmission") return requireLogin("내 제출 보기", () => go("profile"));
    if (name === "vote") return go("vote");
    if (name === "result") return go("result");
  };
  const doLogin = () => {
    setLoggedIn(true);
    const p = pending; setPending(null);
    if (p && p.fn) p.fn(); else go(returnScreen);
  };
  const cancelLogin = () => { setPending(null); go(returnScreen); };

  const runGen = () => { setGenCount(c => { const n = Math.min(5, c + 1); setSelectedGen(n - 1); return n; }); setDraft(""); };
  const openSubmit = () => setModal("submit");
  const closeSubmit = () => setModal(null);
  const confirmSubmit = () => { setSubmitted(true); setModal(null); setPhase("submit"); go("home"); setToast("제출이 완료됐어요"); };
  const castVote = () => requireLogin("투표", () => setVotesUsed(v => { const n = Math.min(3, v + 1); setToast(n >= 3 ? "3표 완료 — 프롬프트가 공개됐어요" : `투표했어요 (${n}/3)`); return n; }));

  const reset = () => { setGenCount(0); setSelectedGen(0); setDraft(""); setSubmitted(false); setVotesUsed(0); setLoggedIn(false); setModal(null); setEntry(null); setToast(null); };

  const ctx = {
    screen, go, phase, setPhase, loggedIn, variants, setVariant,
    act, requireLogin, doLogin, cancelLogin, pendingLabel: pending && pending.label,
    genCount, runGen, selectedGen, setSelectedGen, draft, setDraft, submitted,
    openSubmit, closeSubmit, confirmSubmit,
    votesUsed, castVote, promptsUnlocked, modal, entry, setEntry,
  };

  let body;
  if (screen === "home") body = <HomeScreen phase={phase} />;
  else if (screen === "create") body = <CreateScreen variant={variants.create} />;
  else if (screen === "detail") body = <DetailScreen />;
  else if (screen === "vote") body = <VoteScreen variant={variants.vote} />;
  else if (screen === "result") body = <ResultScreen variant={variants.result} />;
  else if (screen === "login") body = <LoginScreen />;
  else if (screen === "profile") body = <ProfileScreen />;
  else if (screen === "mySubs") body = <MySubsScreen />;
  else if (screen === "ledger") body = <LedgerScreen />;
  else if (screen === "past") body = <PastScreen />;
  else if (screen === "adminLogin") body = <AdminLoginScreen />;
  else if (screen === "adminDash") body = <AdminDashScreen />;
  else if (screen === "adminCreate") body = <AdminCreateScreen />;
  else if (screen === "adminSeed") body = <AdminSeedScreen />;
  else if (screen === "adminMonitor") body = <AdminMonitorScreen />;
  else if (screen === "adminUsers") body = <AdminUsersScreen />;

  const device = isAdmin(screen) ? body : (
    <Phone>
      {body}
      {modal === "submit" && <SubmitModal />}
      {toast && <div className="toast"><IcCheckCircle s={16} />{toast}</div>}
      {TOPLEVEL.includes(screen) && <TabBar active={screen} go={go} />}
    </Phone>
  );

  const cur = ALL.find(x => x[0] === screen);
  const curLabel = cur ? cur[1] : screen;

  return (
    <Ctx.Provider value={ctx}>
      <div className="hrn">
        {/* ---- flow rail ---- */}
        <aside className="rail">
          <div className="rail-brand">
            <span className="rail-mark"><IcSwords s={19} /></span>
            <div>
              <div className="rail-title">프롬프트 아레나</div>
              <div className="rail-sub">하이파이 프로토타입</div>
            </div>
          </div>

          <div className="rail-group">
            <div className="rail-lbl">사용자 앱</div>
            {USER_FLOW.map(([id, label, Ic, tag]) => (
              <button key={id} className={"navbtn" + (screen === id ? " active" : "")} onClick={() => go(id)}>
                <Ic s={16} /><span style={{ flex: 1, textAlign: "left" }}>{label}</span>{tag && <span className="ntag">{tag}</span>}
              </button>
            ))}
          </div>

          <div className="rail-group">
            <div className="rail-lbl">관리자 · 데스크톱</div>
            {ADMIN_FLOW.map(([id, label, Ic]) => (
              <button key={id} className={"navbtn" + (screen === id ? " active" : "")} onClick={() => go(id)}>
                <Ic s={16} /><span style={{ flex: 1, textAlign: "left" }}>{label}</span>
              </button>
            ))}
          </div>

          <div className="rail-group">
            <div className="rail-lbl">서버 상태 (시각 계산)</div>
            <div className="seg">
              {[["submit", "제출"], ["vote", "투표"], ["result", "결과"], ["empty", "공백"]].map(([p, l]) => (
                <button key={p} className={phase === p ? "on" : ""} onClick={() => { setPhase(p); if (isAdmin(screen)) go("home"); }}>{l}</button>
              ))}
            </div>
            <div className="rail-note">첫 화면·상세·투표/결과 접근이 이 상태를 따라요.</div>
          </div>

          <div className="rail-group">
            <div className="rail-lbl">디자인 옵션</div>
            <div className="tgrow" onClick={() => setShowAnno(a => !a)}>
              <span className="tgl-label">설계 주석 표시</span>
              <span className={"switch" + (showAnno ? " on" : "")}></span>
            </div>
            <div className="tgrow" style={{ cursor: "default" }}>
              <span className="tgl-label">강조 색</span>
              <div className="accent-dots" style={{ padding: 0 }}>
                {["tangerine", "violet", "sky"].map(a => (
                  <span key={a} className={"adot " + a + (accent === a ? " on" : "")} onClick={() => setAccent(a)}></span>
                ))}
              </div>
            </div>
            {VARIANT_SCREENS[screen] && (
              <div style={{ marginTop: 6 }}>
                <div className="rail-note" style={{ paddingBottom: 6 }}>{VARIANT_SCREENS[screen].label} 레이아웃</div>
                <div className="seg">
                  {Object.entries(VARIANT_SCREENS[screen].names).map(([k, name]) => (
                    <button key={k} className={variants[screen] === k ? "on" : ""} onClick={() => setVariant(screen, k)} title={name}>{k}</button>
                  ))}
                </div>
                <div className="rail-note">{VARIANT_SCREENS[screen].names[variants[screen]]}</div>
              </div>
            )}
          </div>
        </aside>

        {/* ---- stage ---- */}
        <main className="stage">
          <div className="stage-bar">
            <span>{isAdmin(screen) ? "관리자" : "사용자 앱"}</span>
            <span className="sep">/</span>
            <span className="crumb">{curLabel}</span>
            <span className="spacer" style={{ flex: 1 }}></span>
            {!isAdmin(screen) && <Chip kind={loggedIn ? "success" : "outline"}>{loggedIn ? "로그인됨" : "비회원"}</Chip>}
            <button className="pbtn ghost sm" onClick={reset}>상태 초기화</button>
          </div>

          {device}

          <div className="stage-hint">
            {isAdmin(screen)
              ? "관리자 화면은 데스크톱 폭으로 렌더링됩니다. 좌측에서 화면을 이동하세요."
              : "버튼을 눌러 흐름을 따라가 보세요. 좌측 레일에서 어떤 화면이든 바로 점프하고, 서버 상태와 디자인 옵션을 바꿀 수 있어요."}
          </div>
        </main>
      </div>
    </Ctx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
