/* ============================================================
   result.jsx — 결과·순위 (기본 A 시상대 / B 막대 / C 스포트라이트)
   ============================================================ */

function ShareRow() {
  return (
    <div className="pcard pad-sm">
      <div className="spread">
        <span className="tiny muted nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>aren.a/c/142-거절메일</span>
        <Btn kind="ghost" sm icon={IcLink}>복사</Btn>
      </div>
    </div>
  );
}

function MyResultCard() {
  return (
    <div className="pcard accent">
      <div className="eyebrow" style={{ color: "var(--acc-700)", marginBottom: 8 }}>내 결과</div>
      <div className="statrow"><Stat n="4위" k="순위" /><Stat n="7" k="득표" /><Stat n="+15" k="획득 코인" /></div>
    </div>
  );
}

function NextTopicPreview() {
  return (
    <div className="pcard flat">
      <div className="spread" style={{ marginBottom: 8 }}>
        <span className="row" style={{ color: "var(--fg-strong)" }}><IcMega s={15} /><span className="eyebrow">다음 주제 예고</span></span>
        <Chip kind="outline">월 00:00 시작</Chip>
      </div>
      <div className="h-md">“{NEXT_TOPIC.title}”</div>
      <p className="tiny muted" style={{ margin: "5px 0 0" }}>카테고리 · {NEXT_TOPIC.cat} — 결과 발표와 함께 다음 챌린지를 예고해요</p>
    </div>
  );
}

function RankList({ slice }) {
  const rows = slice ? RANKS.slice(slice[0], slice[1]) : RANKS;
  return (
    <div className="stack" style={{ gap: 7 }}>
      {rows.map(p => (
        <div key={p.r} className={"lrow" + (p.me ? " me" : "")}>
          <span className={"rankb r" + p.r}>{p.r}</span>
          <span className="sm" style={{ flex: 1 }}>익명#{p.id}{p.me && <span className="tiny faint"> · 나</span>}</span>
          <b className="sm tnum">{p.v}표</b>
        </div>
      ))}
    </div>
  );
}

/* A — 시상대 (확정) */
function ResultA() {
  const { go, setEntry } = useArena();
  const heights = { 1: 76, 2: 54, 3: 42 };
  const podium = [RANKS[1], RANKS[0], RANKS[2]];
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <Pin style={{ top: 8, right: 12 }}>종료 후 전체 공개 · 득표·순위 스냅샷 고정</Pin>
      <div style={{ textAlign: "center" }}>
        <div className="row" style={{ justifyContent: "center", color: "var(--acc-600)", marginBottom: 4 }}><IcTrophy s={20} /></div>
        <h2 className="h-xl">최종 결과</h2>
        <p className="tiny muted" style={{ margin: "4px 0 0" }}>“{TOPIC.title}”</p>
      </div>

      <div className="podium" style={{ marginTop: 4 }}>
        {podium.map(p => (
          <div key={p.r} className={"col" + (p.r === 1 ? " first" : "")}>
            {p.r === 1 && <IcTrophy s={18} style={{ color: "var(--acc-600)" }} />}
            <Avatar name={"#" + p.id} size={p.r === 1 ? 52 : 44} accent={p.r === 1} />
            <div className="pname nowrap">익명#{p.id}</div>
            <div className="pv tnum">{p.v}표</div>
            <div className="block" style={{ height: heights[p.r] }}>{p.r}</div>
          </div>
        ))}
      </div>

      <div className="pcard tap" onClick={() => { setEntry(ENTRIES[0]); go("detail"); }} style={{ borderColor: "var(--acc-300)" }}>
        <div className="spread" style={{ marginBottom: 10 }}>
          <span className="row" style={{ color: "var(--acc-700)" }}><IcTrophy s={15} /><span className="h-md" style={{ color: "var(--acc-700)" }}>우승작</span></span>
          <IcRight s={16} style={{ color: "var(--fg-faint)" }} />
        </div>
        <Output>{ENTRIES[0].out}</Output>
        <p className="tiny faint" style={{ margin: "9px 0 0" }}>결과물 + 프롬프트 전체 보기 →</p>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>전체 순위</div>
        <RankList />
      </div>
      <ShareRow />
      <MyResultCard />
      <NextTopicPreview />
    </div>
  );
}

/* B — 막대 랭킹 */
function ResultB() {
  const { go, setEntry } = useArena();
  const max = RANKS[0].v;
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <Pin style={{ top: 8, right: 12 }}>득표 막대로 격차를 한눈에</Pin>
      <div style={{ textAlign: "center" }}><h2 className="h-xl">최종 순위</h2></div>
      <div className="stack" style={{ gap: 10 }}>
        {RANKS.map(p => (
          <div key={p.r} className={"pcard pad-sm" + (p.r === 1 || p.me ? "" : "")} style={{ borderColor: p.r === 1 ? "var(--acc-300)" : p.me ? "var(--acc-300)" : "var(--color-border)" }}>
            <div className="spread" style={{ marginBottom: 8 }}>
              <span className="row"><span className={"rankb r" + p.r}>{p.r}</span><span className="sm">익명#{p.id}{p.me && <span className="tiny faint"> · 나</span>}</span></span>
              <b className="sm tnum">{p.v}표</b>
            </div>
            <Meter pct={(p.v / max) * 100} ink={p.r !== 1} />
          </div>
        ))}
      </div>
      <Btn kind="primary" icon={IcTrophy} onClick={() => { setEntry(ENTRIES[0]); go("detail"); }}>우승작 자세히 보기</Btn>
      <ShareRow />
      <MyResultCard />
      <NextTopicPreview />
    </div>
  );
}

/* C — 우승 스포트라이트 */
function ResultC() {
  const { go, setEntry } = useArena();
  const [open, setOpen] = useState(false);
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <div className="pcard" style={{ borderColor: "var(--acc-300)", boxShadow: "var(--shadow-sm)" }}>
        <div className="spread"><Chip kind="accent"><IcTrophy s={12} /> 우승</Chip><Chip kind="solid">23표</Chip></div>
        <div className="row" style={{ marginTop: 12 }}><Avatar name="#a3f" size={40} accent /><span className="h-lg">익명#a3f</span></div>
        <Output style={{ marginTop: 12 }}>{ENTRIES[0].out}</Output>
        <div className="eyebrow" style={{ margin: "14px 0 8px" }}>우승 프롬프트 (전체 공개)</div>
        <div className="promptbox">정중하지만 단호하게 거절하는 비즈니스 이메일을 작성해줘. 감사를 표하되 일정상 어렵다는 점을 분명히 하고, 관계는 유지하는 톤으로.</div>
        <div className="row" style={{ marginTop: 12, gap: 9 }}>
          <Btn kind="outline" sm style={{ flex: 1 }} onClick={() => { setEntry(ENTRIES[0]); go("detail"); }}>전체 보기</Btn>
          <Btn kind="primary" sm icon={IcShare} style={{ flex: 1 }}>공유</Btn>
        </div>
      </div>
      <Pin style={{ top: 14, right: 12 }}>“왜 1등인지” 학습 동선</Pin>
      <Btn kind="outline" icon={open ? IcUp : IcDown} onClick={() => setOpen(!open)}>{open ? "전체 순위 접기" : "전체 순위 보기 (2~5위)"}</Btn>
      {open && <RankList slice={[1, 5]} />}
      <MyResultCard />
      <NextTopicPreview />
    </div>
  );
}

function ResultScreen({ variant }) {
  const { go } = useArena();
  const V = { A: ResultA, B: ResultB, C: ResultC }[variant] || ResultA;
  return (
    <>
      <AppBar title="결과 · 순위" onBack={() => go("home")} right={<Chip kind="accent">결과 발표</Chip>} />
      <V />
    </>
  );
}

Object.assign(window, { ResultScreen });
