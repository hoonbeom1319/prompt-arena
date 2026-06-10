/* ============================================================
   admin.jsx — 관리자 6화면 (데스크톱)
   ============================================================ */

const ADMIN_NAV = [
  { id: "adminDash", label: "대시보드", Ic: IcChart },
  { id: "adminCreate", label: "챌린지 출제", Ic: IcPlus },
  { id: "adminSeed", label: "시드 제출", Ic: IcSeed },
  { id: "adminMonitor", label: "출품·결과", Ic: IcInbox },
  { id: "adminUsers", label: "사용자·코인", Ic: IcUsers },
];

function Desktop({ addr, children }) {
  return (
    <div className="desktop">
      <div className="titlebar">
        <span className="tl"></span><span className="tl"></span><span className="tl"></span>
        <span className="addr">{addr}</span>
      </div>
      <div className="desktop-body">{children}</div>
    </div>
  );
}

function AdminShell({ screen, addr, children }) {
  const { go } = useArena();
  return (
    <Desktop addr={addr}>
      <div className="adminnav">
        <div className="abrand"><IcSettings s={18} /> 운영자</div>
        {ADMIN_NAV.map(n => (
          <button key={n.id} className={"ab" + (screen === n.id ? " on" : "")} onClick={() => go(n.id)}><n.Ic s={16} />{n.label}</button>
        ))}
        <div style={{ borderTop: "1px solid var(--color-border)", margin: "10px 4px" }}></div>
        <button className="ab" onClick={() => go("home")}><IcBack s={16} /> 사용자 앱</button>
      </div>
      <div className="admin-main">{children}</div>
    </Desktop>
  );
}

function Field({ label, children }) {
  return <div><label className="field-l">{label}</label>{children}</div>;
}
function ReadField({ label, value, muted }) {
  return <Field label={label}><div className="input" style={{ display: "flex", alignItems: "center", color: muted ? "var(--fg-faint)" : "var(--fg-strong)", background: muted ? "var(--bg-subtle)" : "var(--color-surface)" }}>{value}</div></Field>;
}

/* A-1 로그인 */
function AdminLoginScreen() {
  const { go } = useArena();
  return (
    <Desktop addr="aren.a/admin/login">
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", padding: 48, background: "var(--bg-subtle)" }}>
        <div className="pcard" style={{ width: 380, background: "var(--color-surface)" }}>
          <div className="row" style={{ color: "var(--acc-600)", marginBottom: 6 }}><IcSettings s={20} /><h2 className="h-lg">운영자 로그인</h2></div>
          <p className="tiny muted">사용자 인증을 재사용하고, User.관리자 여부 속성으로 권한을 식별해요.</p>
          <div className="stack" style={{ gap: 12, marginTop: 16 }}>
            <Field label="이메일"><input className="input" placeholder="admin@aren.a" /></Field>
            <Field label="비밀번호"><input className="input" type="password" placeholder="••••••••" /></Field>
            <Btn kind="primary" onClick={() => go("adminDash")}>로그인</Btn>
          </div>
        </div>
      </div>
    </Desktop>
  );
}

/* A-2 대시보드 */
function AdminDashScreen() {
  const { go } = useArena();
  return (
    <AdminShell screen="adminDash" addr="aren.a/admin">
      <div className="spread"><h2 className="h-xl">대시보드</h2><span className="tiny muted tnum">서버 시각 2026-06-03 14:20 KST</span></div>
      <div className="grid4" style={{ marginTop: 18 }}>
        <Stat n="제출 중" k="현재 챌린지" accent /><Stat n="12" k="신규 출품" /><Stat n="$62" k="이번 달 예산" /><Stat n="62%" k="$100 대비" />
      </div>
      <div className="admin-grid2" style={{ marginTop: 18 }}>
        <div className="pcard">
          <div className="eyebrow" style={{ marginBottom: 10 }}>예산 사용량 (월 $100)</div>
          <div className="spread" style={{ marginBottom: 8 }}><b className="h-md tnum">$62</b><span className="tiny muted">62%</span></div>
          <Meter pct={62} />
          <p className="tiny muted" style={{ margin: "10px 0 0" }}>80% 도달 시 알림 · 새 챌린지 전 예산 게이트를 확인해요.</p>
        </div>
        <div className="pcard">
          <div className="eyebrow" style={{ marginBottom: 12 }}>빠른 진입</div>
          <div className="stack" style={{ gap: 10 }}>
            <Btn kind="primary" icon={IcPlus} onClick={() => go("adminCreate")}>챌린지 출제</Btn>
            <Btn kind="outline" icon={IcSeed} onClick={() => go("adminSeed")}>시드 제출</Btn>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>챌린지 상태 (시각 계산 · 저장 안 함)</div>
        <table className="wtable">
          <thead><tr><th>주제</th><th>카테고리</th><th>상태</th><th className="num">제출</th><th className="num">시드</th></tr></thead>
          <tbody>
            <tr><td>거절 메일을 정중하지만…</td><td>글쓰기</td><td><Chip kind="accent">제출 중</Chip></td><td className="num">12</td><td className="num">2</td></tr>
            <tr><td>회의록을 3줄로 요약</td><td>요약</td><td><Chip kind="outline">결과</Chip></td><td className="num">9</td><td className="num">1</td></tr>
            <tr><td>(목) 예고됨</td><td>코딩</td><td><Chip>예정</Chip></td><td className="num">—</td><td className="num">—</td></tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

/* A-3 챌린지 출제 */
function AdminCreateScreen() {
  return (
    <AdminShell screen="adminCreate" addr="aren.a/admin/challenges/new">
      <h2 className="h-xl">챌린지 출제</h2>
      <div className="admin-grid2" style={{ marginTop: 18 }}>
        <div className="pcard">
          <div className="row" style={{ color: "var(--fg-strong)", marginBottom: 12 }}><IcZap s={16} style={{ color: "var(--acc-600)" }} /><span className="h-md">AI 주제 초안 (챗봇)</span></div>
          <div className="stack" style={{ gap: 10 }}>
            <div className="pcard flat pad-sm" style={{ alignSelf: "flex-start", maxWidth: "90%", borderTopLeftRadius: 2 }}><span className="tiny">어떤 카테고리의 주제를 만들까요? 채점 가능한 형태로 제안드릴게요.</span></div>
            <div className="pcard pad-sm" style={{ alignSelf: "flex-end", maxWidth: "85%", borderTopRightRadius: 2, background: "var(--acc-50)", borderColor: "var(--acc-200)" }}><span className="tiny">글쓰기 카테고리, 채점 가능한 주제 3개</span></div>
            <div className="pcard flat pad-sm" style={{ alignSelf: "flex-start", maxWidth: "92%", borderTopLeftRadius: 2 }}>
              <div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>주제 후보</div>
              <ol className="tiny muted" style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                <li>거절 메일을 정중하지만 단호하게</li>
                <li>고객 컴플레인에 공감하며 답하기</li>
                <li>지각 사유를 솔직하게 설명하기</li>
              </ol>
              <Btn kind="outline" sm style={{ marginTop: 10 }}>이 후보 폼에 채우기 <IcRight s={14} /></Btn>
            </div>
          </div>
          <input className="input" placeholder="추가 요청…" style={{ marginTop: 12 }} />
        </div>
        <div className="pcard">
          <div className="h-md" style={{ marginBottom: 12 }}>운영자 검토·수정·확정</div>
          <div className="stack" style={{ gap: 12 }}>
            <ReadField label="주제 제목" value="거절 메일을 정중하지만 단호하게" />
            <Field label="지시문"><textarea className="input textarea" defaultValue="협업 제안을 받았지만 일정상 함께하기 어려운 상황. 상대의 기분을 상하게 하지 않으면서 여지를 남기지 않는 거절 메일을 작성하세요." /></Field>
            <div className="grid2">
              <ReadField label="카테고리" value="글쓰기 ▾" />
              <ReadField label="유형" value="단독 생성형 (고정)" muted />
            </div>
            <div className="grid2">
              <ReadField label="제출 시작/마감" value="월 00:00 ~ 23:59" />
              <ReadField label="투표 시작/마감" value="화 00:00 ~ 23:59" />
            </div>
            <div className="grid2">
              <ReadField label="실행 조건" value="Flash · temp 0.7" />
              <ReadField label="예고 시각" value="직전 결과일" />
            </div>
            <div className="alert-budget pcard pad-sm" style={{ display: "flex", gap: 9, alignItems: "center", background: "color-mix(in oklab, var(--color-success) 9%, white)", borderColor: "color-mix(in oklab, var(--color-success) 30%, white)" }}>
              <IcCheckCircle s={16} style={{ color: "var(--color-success)", flexShrink: 0 }} />
              <span className="tiny" style={{ color: "var(--color-success)" }}>예산 게이트: 남은 예산 ≥ 최대 제출자 × 5회 — 통과</span>
            </div>
            <Btn kind="primary" icon={IcCheck}>챌린지 확정·예약</Btn>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

/* A-4 시드 제출 */
function AdminSeedScreen() {
  return (
    <AdminShell screen="adminSeed" addr="aren.a/admin/seed">
      <h2 className="h-xl">시드 제출 (콜드 스타트)</h2>
      <div style={{ marginTop: 14 }}><Anno>I3 미해결: 시드를 예시로 표시할지 / 자연스럽게 섞을지 — 관찰 후 결정.</Anno></div>
      <div className="admin-grid2" style={{ marginTop: 16 }}>
        <div className="pcard">
          <div className="h-md" style={{ marginBottom: 4 }}>현재 챌린지</div>
          <p className="tiny muted" style={{ margin: "0 0 12px" }}>거절 메일을 정중하지만 단호하게</p>
          <div className="statrow"><Stat n="12" k="사용자 제출" /><Stat n="2" k="시드" /><Stat n="5↑" k="성립 기준" /></div>
          <div className="stack" style={{ gap: 12, marginTop: 14 }}>
            <ReadField label="시드 닉네임 (익명)" value="익명#seed1" />
            <Field label="프롬프트 본문"><textarea className="input textarea" placeholder="시드용 프롬프트를 입력…" /></Field>
            <Btn kind="outline" icon={IcZap}>Gemini로 결과물 생성</Btn>
            <Output>안녕하세요, 제안 주셔서 감사합니다. 현재 일정상 함께하기 어려워 정중히 사양드립니다.</Output>
            <Btn kind="primary" icon={IcPlus}>시드 출품작 추가</Btn>
          </div>
        </div>
        <div className="pcard">
          <div className="h-md" style={{ marginBottom: 12 }}>등록된 시드</div>
          <table className="wtable">
            <thead><tr><th>닉네임</th><th>결과물</th><th></th></tr></thead>
            <tbody>
              <tr><td>익명#seed1</td><td className="tiny muted">메일 톤 A</td><td style={{ textAlign: "right" }}><Btn kind="ghost" sm icon={IcTrash}>삭제</Btn></td></tr>
              <tr><td>익명#seed2</td><td className="tiny muted">메일 톤 B</td><td style={{ textAlign: "right" }}><Btn kind="ghost" sm icon={IcTrash}>삭제</Btn></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

/* A-5 출품·결과 모니터링 */
function AdminMonitorScreen() {
  const rows = [["1", "a3f", "협업 제안 감사하나 일정상…", false], ["2", "b9c", "제안 신중히 검토했으나…", false], ["3", "seed1", "(시드) 정중히 사양드립니다", false], ["4", "xx2", "⚠ 욕설 포함", true]];
  return (
    <AdminShell screen="adminMonitor" addr="aren.a/admin/submissions">
      <div className="spread"><h2 className="h-xl">출품·결과 모니터링</h2><Chip kind="outline">챌린지: 거절 메일 <IcDown s={12} /></Chip></div>
      <div style={{ marginTop: 14 }}><Anno>부정 출품(욕설·도배)은 별도 제보 화면 없이 운영자가 직접 삭제해요.</Anno></div>
      <table className="wtable" style={{ marginTop: 14 }}>
        <thead><tr><th>#</th><th>작성자</th><th>결과물</th><th className="num">득표</th><th style={{ textAlign: "right" }}>조치</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r[3] ? "flag" : ""}>
              <td className="tnum">{r[0]}</td>
              <td>익명#{r[1]}</td>
              <td className="tiny muted">{r[2]}</td>
              <td className="num"><span className="veil" style={{ fontSize: 11 }}><IcLock s={11} /> 숨김</span></td>
              <td><div className="row" style={{ gap: 6, justifyContent: "flex-end" }}><Btn kind="ghost" sm icon={IcEye}>보기</Btn><Btn kind="ghost" sm icon={IcTrash}>삭제</Btn></div></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tiny muted" style={{ marginTop: 12 }}>※ 득표·순위는 종료 후 Submission에 스냅샷으로 고정 — 진실의 원천은 Vote 기록이에요.</p>
    </AdminShell>
  );
}

/* A-6 사용자·코인 */
function AdminUsersScreen() {
  const rows = [["a3f", "정상", 520, 8, 3], ["b9c", "정상", 410, 7, 1], ["me7", "정상", 320, 5, 1], ["xx2", "경고", 40, 2, 0]];
  return (
    <AdminShell screen="adminUsers" addr="aren.a/admin/users">
      <div className="spread"><h2 className="h-xl">사용자·코인</h2>
        <div className="input" style={{ width: 220, display: "flex", alignItems: "center", gap: 8, color: "var(--fg-faint)" }}><IcSearch s={15} /> 닉네임 검색</div>
      </div>
      <table className="wtable" style={{ marginTop: 16 }}>
        <thead><tr><th>닉네임</th><th>상태</th><th className="num">코인</th><th className="num">제출</th><th className="num">우승</th><th style={{ textAlign: "right" }}>조정</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>익명#{r[0]}</td>
              <td><Chip kind={r[1] === "경고" ? "warning" : "success"}>{r[1]}</Chip></td>
              <td className="num tnum">{r[2]}</td><td className="num tnum">{r[3]}</td><td className="num tnum">{r[4]}</td>
              <td style={{ textAlign: "right" }}><Btn kind="outline" sm icon={IcCoin}>코인 조정</Btn></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 14 }}><Anno>코인 잔액·적립 내역(CoinTransaction 원장) 조회 + 예외 대응 수동 조정.</Anno></div>
    </AdminShell>
  );
}

Object.assign(window, {
  AdminLoginScreen, AdminDashScreen, AdminCreateScreen,
  AdminSeedScreen, AdminMonitorScreen, AdminUsersScreen,
});
