/* ============================================================
   extras.jsx — 로그인 게이트 · 프로필 · 내 제출 · 코인 내역 · 지난 챌린지
   ============================================================ */

/* ---- 로그인 게이트 ---- */
function LoginScreen() {
  const { doLogin, cancelLogin, pendingLabel } = useArena();
  return (
    <>
      <AppBar title="로그인" onBack={cancelLogin} />
      <div className="scroll" style={{ justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div style={{ display: "inline-flex", width: 60, height: 60, borderRadius: "50%", background: "var(--acc-50)", color: "var(--acc-600)", alignItems: "center", justifyContent: "center" }}><IcLock s={26} /></div>
          <h2 className="h-lg" style={{ marginTop: 14 }}>로그인이 필요해요</h2>
          {pendingLabel && <p className="sm muted" style={{ margin: "5px 0 0" }}>‘{pendingLabel}’을(를) 하려면 로그인하세요</p>}
        </div>
        <Anno>로그인 후 원래 보던 화면·행동으로 정확히 복귀해요.</Anno>
        <div className="stack" style={{ gap: 10, marginTop: 4 }}>
          <Btn kind="kakao" onClick={doLogin}>카카오로 계속하기</Btn>
          <Btn kind="naver" onClick={doLogin}>네이버로 계속하기</Btn>
          <div className="row" style={{ margin: "4px 0" }}>
            <span style={{ flex: 1, height: 1, background: "var(--color-border)" }}></span>
            <span className="tiny faint" style={{ padding: "0 10px" }}>또는</span>
            <span style={{ flex: 1, height: 1, background: "var(--color-border)" }}></span>
          </div>
          <input className="input" placeholder="이메일 주소" />
          <Btn kind="outline" onClick={doLogin}>이메일로 계속하기</Btn>
          <p className="tiny faint" style={{ textAlign: "center", margin: 0 }}>이메일 가입 시 인증 메일 확인을 거쳐요</p>
        </div>
        <p className="tiny faint" style={{ textAlign: "center", margin: "4px 0 0" }}>전원 익명/닉네임 · 출력 블라인드 평가</p>
      </div>
    </>
  );
}

/* ---- 내 프로필 ---- */
function ProfileScreen() {
  const { go } = useArena();
  return (
    <>
      <AppBar title="내 프로필" right={<button className="back" style={{ marginLeft: 0, marginRight: -6 }} onClick={() => {}}><IcSettings s={18} /></button>} />
      <div className="scroll">
        <div className="pcard">
          <div className="row" style={{ gap: 12 }}>
            <Avatar name="me7" size={52} accent />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-md">익명#me7</div>
              <div className="tiny muted">2026.05 가입</div>
            </div>
            <Btn kind="outline" sm>설정</Btn>
          </div>
        </div>
        <div className="statrow">
          <Stat n="320" k="코인" accent />
          <Stat n="1" k="우승" />
          <Stat n="#84" k="랭킹" />
        </div>
        <Anno>코인은 MVP에서 적립만 — 명성·랭킹 점수로 표시돼요. 뱃지/보상은 추후 별도 페이지로 분리 예정.</Anno>

        <div>
          <div className="spread" style={{ marginBottom: 9 }}>
            <span className="row"><span className="eyebrow">지난 제출</span><span className="tiny faint">총 23개</span></span>
            <button className="pbtn ghost sm" style={{ color: "var(--acc-700)", padding: "4px 6px", height: "auto" }} onClick={() => go("mySubs")}>전체 보기 <IcRight s={14} /></button>
          </div>
          <div className="stack" style={{ gap: 7 }}>
            {[{ t: "거절 메일을 정중하지만 단호하게", r: "4위 · 7표" }, { t: "회의록을 3줄로 요약", r: "2위 · 18표" }, { t: "파이썬 버그를 초보에게 설명", r: "6위 · 3표" }].map((s, i) => (
              <button key={i} className="lrow" style={{ cursor: "pointer", width: "100%", textAlign: "left" }} onClick={() => go("result")}>
                <span className="sm nowrap" style={{ flex: 1 }}>{s.t}</span>
                <Chip kind="outline">{s.r}</Chip>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="spread" style={{ marginBottom: 9 }}>
            <span className="row"><span className="eyebrow">코인 적립 내역</span><span className="tiny faint">320 코인</span></span>
            <button className="pbtn ghost sm" style={{ color: "var(--acc-700)", padding: "4px 6px", height: "auto" }} onClick={() => go("ledger")}>전체 내역 <IcRight s={14} /></button>
          </div>
          <div className="pcard pad-sm">
            {[["우승 보상", "+50"], ["활동 · 제출", "+10"], ["활동 · 투표", "+3"]].map((c, i) => (
              <div key={i} className="spread" style={{ padding: "7px 2px", borderBottom: i < 2 ? "1px solid var(--color-border)" : "none" }}>
                <span className="tiny muted">{c[0]}</span><b className="tiny tnum">{c[1]}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Pager({ page, total }) {
  return (
    <div className="spread" style={{ paddingTop: 4 }}>
      <span className="tiny muted tnum">{total}건 중 {(page - 1) * 10 + 1}–{Math.min(page * 10, total)}</span>
      <div className="row" style={{ gap: 6 }}>
        <Btn kind="outline" sm disabled={page <= 1}><IcBack s={15} /></Btn>
        <span className="tiny tnum">{page} / {Math.ceil(total / 10)}</span>
        <Btn kind="outline" sm><IcRight s={15} /></Btn>
      </div>
    </div>
  );
}

/* ---- 내 제출 전체 ---- */
function MySubsScreen() {
  const { go } = useArena();
  const rows = [
    { t: "거절 메일을 정중하지만 단호하게", cat: "글쓰기", r: "4위", v: 7, d: "06-03" },
    { t: "회의록을 3줄로 요약", cat: "요약", r: "2위", v: 18, d: "05-31" },
    { t: "파이썬 버그를 초보에게 설명", cat: "코딩", r: "6위", v: 3, d: "05-28" },
    { t: "제품 소개를 한 문장으로", cat: "마케팅", r: "1위", v: 22, d: "05-25" },
    { t: "면접 자기소개 30초 대본", cat: "글쓰기", r: "3위", v: 12, d: "05-22" },
    { t: "광고 카피 A/B 만들기", cat: "마케팅", r: "5위", v: 6, d: "05-19" },
  ];
  return (
    <>
      <AppBar title="내 제출 전체" onBack={() => go("profile")} />
      <div className="scroll">
        <div className="spread">
          <span className="tiny muted nowrap">총 23건</span>
          <div className="row" style={{ gap: 6 }}>
            <Chip kind="outline">카테고리 <IcDown s={12} /></Chip>
            <Chip kind="outline">최신순 <IcDown s={12} /></Chip>
          </div>
        </div>
        <Anno>개수가 늘어도 안정적: 필터·정렬 + 페이지당 10건 페이지네이션. 카드 높이 고정·제목 1줄 말줄임.</Anno>
        <div className="stack" style={{ gap: 8 }}>
          {rows.map((s, i) => (
            <button key={i} className="pcard pad-sm" style={{ cursor: "pointer", textAlign: "left" }} onClick={() => go("result")}>
              <div className="spread" style={{ marginBottom: 7 }}>
                <Chip kind="outline">{s.cat}</Chip>
                <span className="tiny faint tnum">{s.d}</span>
              </div>
              <div className="sm nowrap" style={{ fontWeight: 700, color: "var(--fg-strong)" }}>{s.t}</div>
              <div className="spread" style={{ marginTop: 7 }}>
                <span className="tiny muted tnum">{s.v}표</span>
                <Chip kind="accent">{s.r}</Chip>
              </div>
            </button>
          ))}
        </div>
        <Pager page={1} total={23} />
      </div>
    </>
  );
}

/* ---- 코인 내역 전체 ---- */
function LedgerScreen() {
  const { go } = useArena();
  const rows = [
    ["우승 보상", "제품 소개 한 문장", "+50", "05-25"],
    ["활동 · 제출", "거절 메일", "+10", "06-03"],
    ["활동 · 투표", "거절 메일", "+3", "06-04"],
    ["활동 · 제출", "회의록 요약", "+10", "05-31"],
    ["활동 · 투표", "회의록 요약", "+3", "05-31"],
    ["활동 · 제출", "파이썬 버그", "+10", "05-28"],
    ["활동 · 투표", "파이썬 버그", "+3", "05-28"],
  ];
  return (
    <>
      <AppBar title="코인 내역 전체" onBack={() => go("profile")} />
      <div className="scroll">
        <div className="pcard accent">
          <div className="spread"><span className="row" style={{ color: "var(--acc-700)" }}><IcCoin s={17} /><span className="eyebrow" style={{ color: "var(--acc-700)" }}>현재 잔액</span></span><b className="h-lg tnum">320 코인</b></div>
        </div>
        <div className="spread">
          <span className="tiny muted">적립 내역 · 총 41건</span>
          <Chip kind="outline">유형 <IcDown s={12} /></Chip>
        </div>
        <div className="stack" style={{ gap: 7 }}>
          {rows.map((c, i) => (
            <div key={i} className="lrow">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sm nowrap">{c[0]}</div>
                <div className="tiny faint nowrap">{c[1]} · {c[3]}</div>
              </div>
              <b className="sm tnum" style={{ color: "var(--color-success)" }}>{c[2]}</b>
            </div>
          ))}
        </div>
        <Pager page={1} total={41} />
      </div>
    </>
  );
}

/* ---- 지난 챌린지 ---- */
function PastScreen() {
  const { go } = useArena();
  const items = [
    { t: "회의록을 3줄로 요약", cat: "요약", win: "b9c", v: 31 },
    { t: "파이썬 버그를 초보에게 설명", cat: "코딩", win: "z7q", v: 27 },
    { t: "제품 소개를 한 문장으로", cat: "마케팅", win: "a3f", v: 22 },
    { t: "면접 자기소개 30초 대본", cat: "글쓰기", win: "p5m", v: 20 },
  ];
  return (
    <>
      <AppBar title="지난 챌린지" right={<Chip kind="outline">카테고리 <IcDown s={12} /></Chip>} />
      <div className="scroll">
        <span className="tiny muted">종료된 챌린지 · 전체 공개</span>
        <Anno>검색·탐색은 Phase 2 — 지금은 메타데이터(카테고리·태그)만 심는 단계예요.</Anno>
        {items.map((it, i) => (
          <button key={i} className="pcard tap" style={{ textAlign: "left" }} onClick={() => go("result")}>
            <div className="spread" style={{ marginBottom: 8 }}><Chip kind="outline">{it.cat}</Chip><span className="tiny faint">종료</span></div>
            <div className="h-md">“{it.t}”</div>
            <div className="spread" style={{ marginTop: 10 }}>
              <span className="row tiny muted"><IcTrophy s={13} /> 익명#{it.win}</span>
              <Chip kind="solid">{it.v}표</Chip>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { LoginScreen, ProfileScreen, MySubsScreen, LedgerScreen, PastScreen });
