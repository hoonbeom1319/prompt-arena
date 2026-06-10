/* ============================================================
   vote.jsx — 투표 (기본 A 블라인드 피드 / B 카드 스택 / C 2-up)
   ============================================================ */

function VoteHeader() {
  const { votesUsed, promptsUnlocked } = useArena();
  return (
    <div className={"pcard pad-sm" + (promptsUnlocked ? " accent" : "")}>
      <div className="spread">
        <span className="row" style={{ whiteSpace: "nowrap" }}><span className="sm">내 투표</span><b className="sm tnum">{votesUsed}/3</b></span>
        <Tokens used={votesUsed} />
      </div>
      <p className="tiny muted" style={{ margin: "6px 0 0", color: promptsUnlocked ? "var(--acc-700)" : undefined }}>
        {promptsUnlocked ? "✓ 3표 완료 — 전체 프롬프트 열람이 해제됐어요" : "3표를 모두 쓰면 전체 프롬프트가 공개돼요"}
      </p>
    </div>
  );
}

function BlindCard({ e, big }) {
  const { go, votesUsed, castVote, setEntry } = useArena();
  return (
    <div className="pcard">
      <div className="spread" style={{ marginBottom: 9 }}>
        <span className="veil"><IcLock s={12} /> 작성자·프롬프트 가림</span>
        <span className="tiny faint">출품 #{e.id}</span>
      </div>
      <Output style={big ? { fontSize: 13.5 } : null}>{big ? e.out : e.out.slice(0, 96) + "…"}</Output>
      <div className="row" style={{ marginTop: 11, gap: 9 }}>
        <Btn kind="outline" sm style={{ flex: 1 }} onClick={() => { setEntry(e); go("detail"); }}>자세히</Btn>
        <Btn kind="primary" sm icon={IcCheckCircle} style={{ flex: 1 }} disabled={votesUsed >= 3} onClick={castVote}>투표</Btn>
      </div>
    </div>
  );
}

/* A — 블라인드 피드 */
function VoteA() {
  return (
    <div className="scroll">
      <VoteHeader />
      <Anno>득표·순위는 숨겨요 — 결과물만 보고 비교해 투표해요.</Anno>
      {ENTRIES.map(e => <BlindCard key={e.id} e={e} />)}
    </div>
  );
}

/* B — 카드 스택 */
function VoteB() {
  const [idx, setIdx] = useState(0);
  const total = ENTRIES.length;
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <VoteHeader />
      <Pin style={{ top: 92, right: 12 }}>한 작품씩 집중 · 좌우로 비교</Pin>
      <div className="spread">
        <Btn kind="ghost" sm icon={IcBack} onClick={() => setIdx(Math.max(0, idx - 1))}>이전</Btn>
        <span className="tiny muted tnum">{idx + 1} / {total}</span>
        <Btn kind="ghost" sm onClick={() => setIdx(Math.min(total - 1, idx + 1))}>다음 <IcRight s={16} /></Btn>
      </div>
      <BlindCard e={ENTRIES[idx]} big />
      <div className="row" style={{ justifyContent: "center", gap: 6 }}>
        {ENTRIES.map((_, i) => <span key={i} style={{ width: 8, height: 8, borderRadius: 9, background: i === idx ? "var(--acc-600)" : "var(--color-neutral-300)" }}></span>)}
      </div>
    </div>
  );
}

/* C — 2-up 비교 */
function VoteC() {
  const { go, votesUsed, castVote, setEntry } = useArena();
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <VoteHeader />
      <Pin style={{ top: 92, right: 12 }}>두 개씩 나란히 직접 비교</Pin>
      <div className="grid2">
        {ENTRIES.slice(0, 4).map(e => (
          <div className="pcard pad-sm" key={e.id}>
            <span className="veil" style={{ fontSize: 11 }}><IcLock s={11} /> #{e.id}</span>
            <Output style={{ fontSize: 11.5, marginTop: 7, padding: "9px 10px" }}>{e.out.slice(0, 70)}…</Output>
            <Btn kind="primary" sm style={{ width: "100%", marginTop: 8 }} disabled={votesUsed >= 3} onClick={castVote}>투표</Btn>
            <Btn kind="ghost" sm style={{ width: "100%", marginTop: 5 }} onClick={() => { setEntry(e); go("detail"); }}>자세히</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoteScreen({ variant }) {
  const { go } = useArena();
  const V = { A: VoteA, B: VoteB, C: VoteC }[variant] || VoteA;
  return (
    <>
      <AppBar title="투표" onBack={() => go("home")} right={<Chip kind="accent">투표 기간</Chip>} />
      <V />
    </>
  );
}

Object.assign(window, { VoteScreen });
