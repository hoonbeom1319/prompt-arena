/* ============================================================
   home.jsx — 첫 화면 (대시보드형 · 확정안)
   phase: submit | vote | result | empty
   ============================================================ */

function TopicHead({ small }) {
  return (
    <div className="pcard">
      <div className="spread" style={{ marginBottom: 9 }}>
        <Chip kind="accent">{TOPIC.cat}</Chip>
        <span className="tiny faint nowrap">이번 챌린지</span>
      </div>
      <h2 className="h-lg" style={{ fontSize: small ? 17 : 19 }}>“{TOPIC.title}”</h2>
      <p className="sm muted" style={{ margin: "8px 0 0", lineHeight: 1.6 }}>{TOPIC.brief}</p>
    </div>
  );
}

function Countdown({ label = "제출 마감까지", t = "04:12:33", big }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className={"count" + (big ? " big" : "")}>{t} <small>남음</small></div>
    </div>
  );
}

function MyStatus({ phase }) {
  const { loggedIn, submitted, votesUsed } = useArena();
  if (!loggedIn)
    return (
      <div className="pcard flat pad-sm">
        <div className="row"><IcUser s={16} style={{ color: "var(--fg-faint)" }} /><span className="sm muted">구경 중 — 로그인하면 내 상태가 표시돼요</span></div>
      </div>
    );
  if (phase === "submit")
    return <div className="pcard pad-sm"><div className="spread"><span className="sm">내 제출</span>{submitted ? <Chip kind="success"><IcCheck s={12} /> 제출 완료</Chip> : <Chip kind="outline">아직 안 함</Chip>}</div></div>;
  if (phase === "vote")
    return <div className="pcard pad-sm"><div className="spread"><span className="sm">내 투표</span><span className="row"><Tokens used={votesUsed} /> <b className="tiny tnum">{votesUsed}/3</b></span></div></div>;
  return <div className="pcard pad-sm"><div className="spread"><span className="sm">내 결과</span><Chip kind="accent">4위 · 7표</Chip></div></div>;
}

function SubmitActions() {
  const { act, submitted } = useArena();
  if (submitted)
    return (
      <div className="stack" style={{ gap: 10 }}>
        <div className="pcard accent" style={{ textAlign: "center", padding: "20px 16px" }}>
          <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: "var(--acc-600)", color: "#fff", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><IcCheck s={24} /></div>
          <div className="h-md">제출이 완료됐어요</div>
          <p className="tiny muted" style={{ margin: "5px 0 0" }}>투표는 다음 단계(화요일)에 열려요</p>
        </div>
        <Btn kind="outline" onClick={() => act("mySubmission")}>내 제출 보기</Btn>
      </div>
    );
  return (
    <div className="stack" style={{ gap: 10 }}>
      <Btn kind="primary" icon={IcZap} onClick={() => act("create")}>프롬프트 만들기</Btn>
      <Btn kind="outline" onClick={() => act("mySubmission")}>내 제출 보기</Btn>
    </div>
  );
}

/* =================== Dashboard home =================== */
function HomeDash({ phase }) {
  const { act } = useArena();
  if (phase === "empty") return <HomeEmpty />;
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <TopicHead small />

      {phase === "submit" && <>
        <div className="pcard"><Countdown big /></div>
        <div className="statrow">
          <Stat n="12" k="참가자" />
          <Stat n="5↑" k="성립 기준" />
          <Stat n="0/5" k="내 시도" />
        </div>
        <Anno>현재 서버 시각 기준으로 제출·투표·결과·공백 4가지 중 하나만 렌더돼요.</Anno>
        <MyStatus phase="submit" />
        <SubmitActions />
      </>}

      {phase === "vote" && <>
        <Pin style={{ top: 150, right: 12 }}>첫 화면은 현황 요약만 — 실제 투표는 투표 화면에서</Pin>
        <div className="pcard">
          <div className="spread" style={{ marginBottom: 10 }}>
            <span className="eyebrow">내 투표</span>
            <span className="tiny muted">투표 마감 11:48 남음</span>
          </div>
          <div className="spread" style={{ marginBottom: 9 }}><Tokens used={1} total={3} /><b className="tnum">1 / 3표</b></div>
          <Meter pct={33} />
        </div>
        <div className="statrow"><Stat n="14" k="출품작" /><Stat n="38" k="누적 투표" /></div>
        <Anno>투표 중에는 득표·순위를 숨겨 밴드왜건 효과를 막아요.</Anno>
        <MyStatus phase="vote" />
        <Btn kind="primary" icon={IcCheckCircle} onClick={() => act("vote")}>투표하러 가기</Btn>
      </>}

      {phase === "result" && <>
        <div className="pcard">
          <div className="spread" style={{ marginBottom: 12 }}>
            <span className="row" style={{ color: "var(--acc-700)" }}><IcTrophy s={17} /><span className="eyebrow" style={{ color: "var(--acc-700)" }}>TOP 3</span></span>
            <span className="tiny muted">최종 집계</span>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {RANKS.slice(0, 3).map(p => (
              <div key={p.r} className="spread">
                <span className="row"><span className={"rankb r" + p.r}>{p.r}</span><span className="sm">익명#{p.id}</span></span>
                <b className="sm tnum">{p.v}표</b>
              </div>
            ))}
          </div>
        </div>
        <Anno>챌린지가 끝나면 전체 프롬프트가 공개돼 학습 재료로 쓰여요.</Anno>
        <MyStatus phase="result" />
        <Btn kind="primary" icon={IcTrophy} onClick={() => act("result")}>전체 결과 보기</Btn>
        <NextTopic />
      </>}
    </div>
  );
}

function NextTopic() {
  return (
    <div className="pcard flat">
      <div className="spread" style={{ marginBottom: 8 }}>
        <span className="row" style={{ color: "var(--fg-strong)" }}><IcMega s={15} /><span className="eyebrow">다음 주제 예고</span></span>
        <Chip kind="outline">월 00:00 시작</Chip>
      </div>
      <div className="h-md">“{NEXT_TOPIC.title}”</div>
      <p className="tiny muted" style={{ margin: "5px 0 0" }}>카테고리 · {NEXT_TOPIC.cat} — 다음 챌린지가 곧 열려요</p>
    </div>
  );
}

function HomeEmpty() {
  const { go } = useArena();
  return (
    <div className="scroll center" style={{ position: "relative", justifyContent: "center" }}>
      <Pin style={{ top: 14, right: 12 }}>공백(일요일 등): 지난 결과로 안내</Pin>
      <div style={{ display: "inline-flex", width: 64, height: 64, borderRadius: "50%", background: "var(--color-neutral-100)", color: "var(--fg-muted)", alignItems: "center", justifyContent: "center", marginTop: 20 }}><IcMoon s={30} /></div>
      <h2 className="h-lg" style={{ marginTop: 16 }}>진행 중인 챌린지가 없어요</h2>
      <p className="sm muted" style={{ margin: "6px 0 0" }}>다음 챌린지는 <b style={{ color: "var(--fg-strong)" }}>월요일 00:00</b>에 시작돼요</p>
      <div className="pcard flat" style={{ textAlign: "left", width: "100%", marginTop: 22 }}>
        <div className="row" style={{ color: "var(--fg-strong)", marginBottom: 8 }}><IcMega s={15} /><span className="eyebrow">다음 주제 예고</span></div>
        <div className="h-md">“{NEXT_TOPIC.title}”</div>
        <p className="tiny muted" style={{ margin: "5px 0 0" }}>카테고리 · {NEXT_TOPIC.cat}</p>
      </div>
      <Btn kind="outline" onClick={() => go("past")} style={{ marginTop: 18 }}>지난 결과 보기</Btn>
    </div>
  );
}

function HomeScreen({ phase }) {
  return (
    <>
      <AppBar title="프롬프트 아레나" right={<Chip kind={phase === "empty" ? "outline" : "accent"}>{{ submit: "제출 기간", vote: "투표 기간", result: "결과 발표", empty: "대기 중" }[phase]}</Chip>} />
      <HomeDash phase={phase} />
    </>
  );
}

Object.assign(window, { HomeScreen, NextTopic });
