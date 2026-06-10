/* ============================================================
   flow.jsx — 프롬프트 생성 · 제출 확정 모달 · 출품작 상세
   기본 A 단일+히스토리 / B 비교 캐러셀 / C 채팅 스레드
   ============================================================ */

function TopicBanner() {
  return (
    <div className="pcard flat pad-sm">
      <div className="spread" style={{ marginBottom: 4 }}>
        <span className="tiny muted nowrap">주제 · {TOPIC.cat}</span>
        <Chip kind="outline">단독 생성형</Chip>
      </div>
      <div className="sm" style={{ fontWeight: 700, color: "var(--fg-strong)" }}>“{TOPIC.title}”</div>
    </div>
  );
}

function GenCounter() {
  const { genCount } = useArena();
  return (
    <div className="spread">
      <span className="tiny muted">남은 생성 횟수</span>
      <span className="row">
        <span className="genpips">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={"gp" + (i < genCount ? " used" : "")}></span>)}</span>
        <b className="tiny tnum">{genCount}/5</b>
      </span>
    </div>
  );
}

function RunControl({ placeholder = "프롬프트를 입력하세요…" }) {
  const { genCount, runGen, draft, setDraft } = useArena();
  const locked = genCount >= 5;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <textarea className="input textarea" disabled={locked}
        placeholder={locked ? "5회를 모두 사용해 생성이 잠겼어요" : placeholder}
        value={locked ? "" : draft} onChange={e => setDraft(e.target.value)} />
      <Btn kind="primary" icon={locked ? IcLock : IcZap} disabled={locked} onClick={runGen}>
        {locked ? "생성 잠금 (5/5)" : "실행 (Gemini)"}
      </Btn>
    </div>
  );
}

/* ========== A — 단일 입력 + 히스토리 ========== */
function CreateA() {
  const { genCount, selectedGen, setSelectedGen, openSubmit } = useArena();
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <TopicBanner />
      <RunControl />
      <GenCounter />
      <Anno>실행 실패(API 에러)는 횟수를 차감하지 않아요. 결과가 마음에 안 들어 다시 실행하면 차감돼요.</Anno>
      {genCount === 0 ? (
        <div className="pcard" style={{ textAlign: "center", padding: "32px 16px", color: "var(--fg-faint)" }}>
          <IcZap s={26} /><p className="sm" style={{ margin: "8px 0 0" }}>실행하면 결과물이 여기에 표시돼요</p>
        </div>
      ) : (
        <>
          <div className="pcard">
            <div className="spread" style={{ marginBottom: 10 }}>
              <span className="h-md">결과물 · 시도 {selectedGen + 1}</span>
              <Chip kind={selectedGen === genCount - 1 ? "accent" : "outline"}>{selectedGen === genCount - 1 ? "최신" : "이전"}</Chip>
            </div>
            <Output>{GEN_OUTPUTS[selectedGen % GEN_OUTPUTS.length]}</Output>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>시도 기록 — 하나 골라 제출</div>
            <div className="hscroll">
              {Array.from({ length: genCount }).map((_, i) => (
                <button key={i} className="pcard pad-sm" style={{ flex: "none", width: 130, textAlign: "left", cursor: "pointer", borderColor: selectedGen === i ? "var(--acc-500)" : "var(--color-border)", background: selectedGen === i ? "var(--acc-50)" : "var(--color-surface)" }} onClick={() => setSelectedGen(i)}>
                  <div className="spread" style={{ marginBottom: 6 }}><b className="tiny">시도 {i + 1}</b>{selectedGen === i && <IcCheck s={14} style={{ color: "var(--acc-600)" }} />}</div>
                  <div className="tiny muted" style={{ lineHeight: 1.5, height: 54, overflow: "hidden" }}>{GEN_OUTPUTS[i % GEN_OUTPUTS.length].slice(0, 46)}…</div>
                </button>
              ))}
            </div>
          </div>
          <Btn kind="primary" icon={IcCheck} onClick={openSubmit}>이 시도 제출하기</Btn>
        </>
      )}
    </div>
  );
}

/* ========== B — 비교 캐러셀 ========== */
function CreateB() {
  const { genCount, selectedGen, setSelectedGen, openSubmit } = useArena();
  return (
    <div className="scroll" style={{ position: "relative" }}>
      <TopicBanner />
      <RunControl placeholder="입력 후 실행 → 결과 카드가 옆으로 쌓여요" />
      <GenCounter />
      <Pin style={{ top: 188, right: 12 }}>나란히 비교 후 최선 1개 선택</Pin>
      {genCount === 0 ? (
        <div className="pcard" style={{ textAlign: "center", padding: "32px 16px", color: "var(--fg-faint)" }}>
          <IcZap s={26} /><p className="sm" style={{ margin: "8px 0 0" }}>아직 생성한 시도가 없어요</p>
        </div>
      ) : (
        <>
          <div className="eyebrow">생성 시도 비교 ({genCount}개) — 좌우로 스크롤</div>
          <div className="hscroll">
            {Array.from({ length: genCount }).map((_, i) => (
              <div key={i} className="pcard" style={{ flex: "none", width: 230, cursor: "pointer", borderColor: selectedGen === i ? "var(--acc-500)" : "var(--color-border)", boxShadow: selectedGen === i ? "var(--shadow-sm)" : "none" }} onClick={() => setSelectedGen(i)}>
                <div className="spread" style={{ marginBottom: 8 }}><b className="sm">시도 {i + 1}</b><Chip kind={selectedGen === i ? "solid" : "outline"}>{selectedGen === i ? "선택됨" : "선택"}</Chip></div>
                <Output style={{ fontSize: 12 }}>{GEN_OUTPUTS[i % GEN_OUTPUTS.length]}</Output>
              </div>
            ))}
          </div>
          <Btn kind="primary" icon={IcCheck} onClick={openSubmit}>선택한 시도 {selectedGen + 1} 제출하기</Btn>
        </>
      )}
    </div>
  );
}

/* ========== C — 채팅 스레드 ========== */
function CreateC() {
  const { genCount, selectedGen, setSelectedGen, openSubmit, runGen, draft, setDraft } = useArena();
  const locked = genCount >= 5;
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ padding: "14px 16px 0" }}><TopicBanner /></div>
      <div className="scroll" style={{ position: "relative" }}>
        <Pin style={{ top: 6, right: 12 }}>대화처럼 시도 누적 · 말풍선마다 제출 가능</Pin>
        {genCount === 0 && <div className="pcard" style={{ textAlign: "center", padding: "28px 16px", color: "var(--fg-faint)" }}><p className="sm" style={{ margin: 0 }}>프롬프트를 입력해 시작하세요</p></div>}
        {Array.from({ length: genCount }).map((_, i) => (
          <div key={i} className="stack" style={{ gap: 8 }}>
            <div className="pcard flat pad-sm" style={{ alignSelf: "flex-end", maxWidth: "85%", borderTopRightRadius: 2 }}>
              <div className="tiny faint" style={{ marginBottom: 3 }}>나 · 시도 {i + 1}</div>
              <div className="sm">정중하지만 단호한 거절 메일을 써줘</div>
            </div>
            <div className="pcard pad-sm" style={{ alignSelf: "flex-start", maxWidth: "92%", borderTopLeftRadius: 2, borderColor: selectedGen === i ? "var(--acc-500)" : "var(--color-border)" }}>
              <Output style={{ border: "none", background: "transparent", padding: 0 }}>{GEN_OUTPUTS[i % GEN_OUTPUTS.length]}</Output>
              <Btn kind={selectedGen === i ? "primary" : "outline"} sm style={{ width: "100%", marginTop: 10 }} onClick={() => setSelectedGen(i)}>{selectedGen === i ? "✓ 제출 대상" : "이걸로 제출 선택"}</Btn>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--color-border)", padding: 12, background: "var(--color-surface)" }} className="stack">
        <GenCounter />
        <div className="row" style={{ marginTop: 10 }}>
          <input className="input" disabled={locked} placeholder={locked ? "5/5 잠김" : "프롬프트 입력…"} value={locked ? "" : draft} onChange={e => setDraft(e.target.value)} style={{ flex: 1 }} />
          <Btn kind="primary" sm disabled={locked} onClick={runGen}>실행</Btn>
          {genCount > 0 && <Btn kind="outline" sm onClick={openSubmit}>제출</Btn>}
        </div>
      </div>
    </div>
  );
}

function CreateScreen({ variant }) {
  const { go } = useArena();
  const V = { A: CreateA, B: CreateB, C: CreateC }[variant] || CreateA;
  return (
    <>
      <AppBar title="프롬프트 만들기" onBack={() => go("home")} right={<Chip kind="accent">제출 기간</Chip>} />
      <V />
    </>
  );
}

/* ========== 제출 확정 모달 ========== */
function SubmitModal() {
  const { closeSubmit, confirmSubmit, selectedGen } = useArena();
  return (
    <div className="overlay" onClick={closeSubmit}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="grab"></div>
        <h3 className="h-lg">시도 {selectedGen + 1}을(를) 제출할까요?</h3>
        <div className="pcard accent" style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 12, padding: 12 }}>
          <IcLock s={16} style={{ color: "var(--acc-700)", flexShrink: 0, marginTop: 1 }} />
          <span className="tiny" style={{ color: "var(--acc-900)", lineHeight: 1.55 }}>제출하면 <b>수정·삭제할 수 없어요.</b> 확정 후에는 잠깁니다.</span>
        </div>
        <div className="pcard pad-sm" style={{ margin: "14px 0" }}>
          <div className="tiny faint" style={{ marginBottom: 6 }}>제출 대상 결과물</div>
          <Output style={{ fontSize: 12 }}>{GEN_OUTPUTS[selectedGen % GEN_OUTPUTS.length]}</Output>
        </div>
        <p className="tiny muted" style={{ margin: "0 0 14px", lineHeight: 1.6 }}>· 한 챌린지에 최대 1개 제출 · 투표는 화요일에 열려요</p>
        <div className="row" style={{ gap: 10 }}>
          <Btn kind="outline" onClick={closeSubmit}>취소</Btn>
          <Btn kind="primary" onClick={confirmSubmit}>제출 확정</Btn>
        </div>
      </div>
    </div>
  );
}

/* ========== 출품작 상세 ========== */
function DetailScreen() {
  const { go, phase, votesUsed, promptsUnlocked, castVote, entry } = useArena();
  const e = entry || ENTRIES[0];
  const showPrompt = phase === "result" || promptsUnlocked;
  return (
    <>
      <AppBar title="출품작 상세" onBack={() => go(phase === "result" ? "result" : "vote")}
        right={phase === "result" ? <Chip kind="accent"><IcTrophy s={12} /> {RANKS.find(r => r.id === e.id)?.r || 1}위</Chip> : <span className="veil"><IcLock s={12} /> 블라인드</span>} />
      <div className="scroll">
        <div className="pcard">
          <div className="spread" style={{ marginBottom: 10 }}>
            <span className="h-md">결과물</span>
            <span className="tiny faint">익명#{e.id}</span>
          </div>
          <Output>{e.out}</Output>
        </div>

        <div className="pcard">
          <div className="spread" style={{ marginBottom: showPrompt ? 10 : 0 }}>
            <span className="h-md">프롬프트 본문</span>
            {showPrompt ? <Chip kind="success"><IcEye s={12} /> 공개됨</Chip> : <span className="veil"><IcLock s={12} /> 가림</span>}
          </div>
          {showPrompt ? (
            <div className="promptbox">정중하지만 단호하게 거절하는 비즈니스 이메일을 작성해줘. 상대의 제안에 감사를 표하되, 일정상 함께하기 어렵다는 점을 분명히 하고, 여지를 남기지 않으면서도 관계는 유지하는 톤으로. 3~4문장.</div>
          ) : (
            <div className="hatch" style={{ padding: 18, textAlign: "center", marginTop: 4 }}>
              <IcLock s={18} style={{ color: "var(--fg-faint)" }} />
              <p className="tiny muted" style={{ margin: "6px 0 0" }}>3표를 모두 행사하면 공개돼요 ({votesUsed}/3)</p>
            </div>
          )}
        </div>

        {phase === "vote" && <>
          <Anno>작성자·득표·순위는 숨겨요 — 결과물만으로 평가해요.</Anno>
          <Btn kind="primary" icon={IcCheckCircle} disabled={votesUsed >= 3} onClick={castVote}>
            {votesUsed >= 3 ? "3표를 모두 사용했어요" : `이 작품에 투표  (${votesUsed}/3)`}
          </Btn>
        </>}
        {phase === "result" && <>
          <div className="statrow"><Stat n="23" k="득표" accent /><Stat n="1위" k="최종 순위" /><Stat n="+50" k="코인" /></div>
          <Btn kind="outline" icon={IcLink} onClick={() => go("result")}>우승 프롬프트 공유 (URL 복사)</Btn>
        </>}
      </div>
    </>
  );
}

Object.assign(window, { CreateScreen, SubmitModal, DetailScreen });
