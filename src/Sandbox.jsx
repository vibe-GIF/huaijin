import React, { useEffect, useRef, useState } from 'react'
import { BEATS, TECHNIQUES, RADAR, EMOTIONS, COPY } from './data.js'
import { askScammer } from './llm.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tempColor = (t) => `hsl(28, ${Math.round(12 + t * 0.62)}%, ${Math.round(68 - t * 0.09)}%)`
const go = (p) => { location.hash = p }

export function Thermometer({ value, big }) {
  return (
    <div className={'thermo' + (big ? ' big' : '')}>
      <div className="fill" style={{ height: value + '%', background: tempColor(value) }} />
    </div>
  )
}

function Landing({ onStart }) {
  return (
    <div className="landing">
      <div className="logo-row">
        <div className="logo">怀瑾</div>
        <div className="landing-stamp">瑾</div>
      </div>
      <div className="sub">骗局沙盘 · 操控透视 X 光</div>
      <div className="source">出自《楚辞·九章·怀沙》</div>
      <p className="lead">{COPY.landingLead} 💉</p>
      <div className="consent">
        <h4>在开始之前（约 5 秒）</h4>
        <ul>{COPY.consent.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </div>
      <button className="btn primary" onClick={onStart}>我准备好了</button>
      <button className="btn ghost" onClick={() => go('/heal')}>近期被骗过？请先跳过 →</button>
      <button className="btn ghost" onClick={() => go('/')}>← 返回首页</button>
    </div>
  )
}

function Chat({ temp, setTemp, onFinish, onExit }) {
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [chips, setChips] = useState(null)
  const [frozen, setFrozen] = useState(false)
  const [shake, setShake] = useState(false)
  const [dim, setDim] = useState(false)
  const [visibleAnns, setVisibleAnns] = useState([])
  const [flashId, setFlashId] = useState(null)
  const [techCount, setTechCount] = useState(0)
  const [showNarration, setShowNarration] = useState(false)
  const [explore, setExplore] = useState(false)
  const [activeAnn, setActiveAnn] = useState(null)
  const [inputVal, setInputVal] = useState('')

  const idRef = useRef(0)
  const msgsRef = useRef([])
  const rejectedRef = useRef(false)
  const techSetRef = useRef(new Set())
  const bodyRef = useRef(null)
  const aliveRef = useRef(true)
  const chipsRef = useRef(null)
  const beatIdRef = useRef('B1')

  useEffect(() => () => { aliveRef.current = false }, [])

  const addMsg = (m) => {
    const msg = { ...m, id: ++idRef.current }
    msgsRef.current = [...msgsRef.current, msg]
    setMessages(msgsRef.current)
    return msg.id
  }

  useEffect(() => {
    if (!frozen) bodyRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [messages, typing, chips, frozen])

  async function runBeat(i) {
    const beat = BEATS[i]
    beatIdRef.current = beat.id
    setChips(null)
    for (const m of beat.msgs) {
      setTyping(true)
      await sleep(650 + Math.min(m.text.length * 55, 1700))
      if (!aliveRef.current) return
      setTyping(false)
      addMsg({ from: 'scammer', text: m.text, ann: m.ann })
      await sleep(420)
    }
    setTemp((t) => Math.min(100, t + 8))
    const mapped = beat.chips.map((c) => ({ ...c, beatIdx: i }))
    chipsRef.current = mapped
    setChips(mapped)
  }

  useEffect(() => { runBeat(0) }, []) // eslint-disable-line

  async function onSend() {
    const text = inputVal.trim()
    if (!text || typing || frozen) return
    setInputVal('')
    addMsg({ from: 'user', text })
    setTemp((t) => Math.min(100, t + 3))
    const saved = chipsRef.current
    setChips(null)
    setTyping(true)
    const reply = await askScammer(msgsRef.current, beatIdRef.current)
    if (!aliveRef.current) return
    setTyping(false)
    const parts = (reply || '哈哈，你这个人真有意思 😊|||先不说这个啦').split('|||')
    for (const p of parts) {
      const t = p.trim()
      if (!t) continue
      addMsg({ from: 'scammer', text: t, live: true })
      await sleep(380)
    }
    await sleep(250)
    setChips(saved)
  }

  async function onChip(chip) {
    setChips(null)
    addMsg({ from: 'user', text: chip.label })
    setTemp((t) => Math.min(100, t + (chip.engage ? 5 : 3)))
    await sleep(380)
    if (chip.bait) return startXray(false)
    if (chip.reject) {
      if (!rejectedRef.current) { rejectedRef.current = true; return runBeat(5) }
      return startXray(true)
    }
    runBeat(chip.beatIdx + 1)
  }

  async function startXray(gentle) {
    setFrozen(true)
    setChips(null)
    setTemp((t) => Math.max(t, 85))
    if (gentle) {
      addMsg({ from: 'sys', text: COPY.gentleFreeze })
      bodyRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
      await sleep(1200)
    }
    setShake(true); await sleep(200); setShake(false)
    setDim(true)
    await sleep(800)
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    await sleep(1300)
    const annotated = msgsRef.current.filter((m) => m.from === 'scammer' && m.ann)
    for (const m of annotated) {
      if (!aliveRef.current) return
      setVisibleAnns((prev) => [...prev, m.id])
      setFlashId(m.id)
      m.ann.forEach((t) => techSetRef.current.add(t))
      setTechCount(techSetRef.current.size)
      document.getElementById('msg-' + m.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await sleep(560)
    }
    setFlashId(null)
    await sleep(500)
    setShowNarration(true)
  }

  return (
    <>
      <div className="chat-header">
        <div className="avatar">知</div>
        <div className="name">知遇<small>在线</small></div>
        <Thermometer value={temp} />
        <button className="exit-btn" onClick={onExit}>✕</button>
      </div>

      <div className={'chat-body' + (dim ? ' dim' : '') + (shake ? ' shake' : '') + (explore ? ' pad-bottom' : '')} ref={bodyRef}>
        {messages.map((m) =>
          m.from === 'sys' ? (
            <div className="sys-note" key={m.id}>{m.text}</div>
          ) : (
            <div className={'msg-row ' + (m.from === 'user' ? 'user' : '') + (flashId === m.id ? ' flash' : '')} key={m.id} id={'msg-' + m.id}>
              <div className="avatar">{m.from === 'user' ? '我' : '知'}</div>
              {m.from === 'scammer' && m.ann && visibleAnns.includes(m.id) ? (
                <div className="msg-wrap">
                  <div className="bubble">{m.text}</div>
                  {m.ann.map((t) => (
                    <span className="ann-label" key={t} onClick={() => explore && setActiveAnn({ tech: t, quote: m.text })}>
                      🏷 {t}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="bubble">{m.text}</div>
              )}
            </div>
          )
        )}
        {typing && (
          <div className="msg-row">
            <div className="avatar">知</div>
            <div className="bubble typing"><i /><i /><i /></div>
          </div>
        )}
      </div>

      {!frozen && (
        <div className="input-area">
          {chips && <div className="chips">{chips.map((c) => <button className="chip" key={c.label} onClick={() => onChip(c)}>{c.label}</button>)}</div>}
          <div className="input-row">
            <input
              className="real-input"
              value={inputVal}
              placeholder="也可以自由回复试试…"
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
            />
            <button className="send-btn" onClick={onSend} disabled={typing || !inputVal.trim()}>发送</button>
          </div>
        </div>
      )}

      {dim && !showNarration && !explore && <div className="freeze-caption">⏸ 时间冻结</div>}
      {dim && techCount > 0 && !showNarration && <div className="tech-counter">已识别 {techCount} 种操控手法</div>}

      {showNarration && (
        <div className="narration">
          <p>「{COPY.narration}」</p>
          <button className="btn" onClick={() => { setShowNarration(false); setExplore(true) }}>逐句看穿 →</button>
        </div>
      )}

      {explore && !activeAnn && (
        <div className="xray-footer">
          <div className="hint">👆 点击橙色标签，看每句话如何操控你（已识别 {techCount} 种手法）</div>
          <button className="btn primary" onClick={() => onFinish([...techSetRef.current])}>继续 →</button>
          <button className="care-link" onClick={() => go('/heal')}>不太舒服？去这里 → 心理疗愈</button>
        </div>
      )}

      {activeAnn && (
        <>
          <div className="sheet-mask" onClick={() => setActiveAnn(null)} />
          <div className="sheet">
            <div className="quote">「{activeAnn.quote}」</div>
            <h3>🏷 {activeAnn.tech}</h3>
            <div className="def">{TECHNIQUES[activeAnn.tech].def}</div>
            <div className="row"><b>它在你脑子里干了什么</b><span>{TECHNIQUES[activeAnn.tech].mech}</span></div>
            <div className="row"><b>一句反问，随身带走</b><span>{TECHNIQUES[activeAnn.tech].counter}</span></div>
            <button className="btn primary" onClick={() => setActiveAnn(null)}>知道了</button>
          </div>
        </>
      )}
    </>
  )
}

function LabelPage({ temp, setTemp, onNext }) {
  const [sel, setSel] = useState([])
  const [named, setNamed] = useState(false)
  const toggle = (e) => setSel((s) => (s.includes(e) ? s.filter((x) => x !== e) : s.length < 2 ? [...s, e] : s))
  return (
    <div className="page">
      <h2>{COPY.labelTitle}</h2>
      <Thermometer value={temp} big />
      <div className="emo-chips">
        {EMOTIONS.map((e) => (
          <button className={'emo-chip' + (sel.includes(e) ? ' on' : '')} key={e} onClick={() => !named && toggle(e)}>{e}</button>
        ))}
      </div>
      {!named ? (
        <>
          <button className="btn primary" disabled={!sel.length} style={{ opacity: sel.length ? 1 : 0.4 }}
            onClick={() => { setNamed(true); setTemp(30) }}>
            就是这种感觉
          </button>
          <button className="btn ghost" onClick={onNext}>跳过 →</button>
        </>
      ) : (
        <>
          <p className="muted">{COPY.labelDone}</p>
          <button className="btn primary" onClick={onNext}>继续 →</button>
        </>
      )}
    </div>
  )
}

function RadarPage({ onDone }) {
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  const [display, setDisplay] = useState(40)
  const q = RADAR[qi]
  const finalScore = 40 + correct * 30

  useEffect(() => {
    if (!finished) return
    const iv = setInterval(() => {
      setDisplay((d) => {
        if (d >= finalScore) { clearInterval(iv); return finalScore }
        return d + 2
      })
    }, 30)
    return () => clearInterval(iv)
  }, [finished]) // eslint-disable-line

  if (finished) {
    return (
      <div className="page" style={{ justifyContent: 'center' }}>
        <p className="muted" style={{ textAlign: 'center' }}>你的操控雷达分</p>
        <div className="score-jump">40 → {display}<small>看穿的是套路，不是这一个骗局</small></div>
        <button className="btn primary" onClick={() => onDone(finalScore)}>领取抗体卡 💉</button>
      </div>
    )
  }
  return (
    <div className="page">
      <h2>操控雷达训练 <span style={{ fontSize: 14, color: '#8a8378' }}>{qi + 1}/{RADAR.length}</span></h2>
      <p className="muted">这是一条你没见过的全新骗局——最关键用了哪一招？</p>
      <div className="quiz-snippet">{q.snippet}</div>
      <div className="quiz-opts">
        {q.options.map((o) => (
          <button key={o}
            className={'quiz-opt' + (picked ? (o === q.answer ? ' correct' : o === picked ? ' wrong' : '') : '')}
            onClick={() => !picked && (setPicked(o), o === q.answer && setCorrect((c) => c + 1))}>
            {o}
          </button>
        ))}
      </div>
      {picked && (
        <>
          <div className="quiz-explain">{picked === q.answer ? '✅ 看穿了。' : '这条最毒的其实是——'}{q.explain}</div>
          <button className="btn primary" onClick={() => { if (qi + 1 < RADAR.length) { setQi(qi + 1); setPicked(null) } else setFinished(true) }}>
            {qi + 1 < RADAR.length ? '下一条 →' : '看结果 →'}
          </button>
        </>
      )}
    </div>
  )
}

function CardPage({ techs, score, onReplay }) {
  return (
    <div className="page">
      <div className="anti-card">
        <h3>接种完成 💉</h3>
        <div className="date">{new Date().toLocaleDateString('zh-CN')} · 怀瑾 · 骗局沙盘</div>
        <div className="label">你已能识破</div>
        <div className="badges">{techs.map((t) => <span className="badge" key={t}>{t}</span>)}</div>
        <div className="label">操控雷达分</div>
        <div className="score">{score}</div>
        <div className="slogan">{COPY.tagline}<br />{COPY.slogan}</div>
      </div>
      <p className="muted">免疫会随时间衰减——一周后回来打一支 60 秒加强针。</p>
      <button className="btn primary" onClick={onReplay}>把这一针送给你担心的人 · 再体验一次</button>
      <button className="btn ghost" onClick={() => go('/')}>← 返回首页</button>
    </div>
  )
}

export default function Sandbox() {
  const [stage, setStage] = useState('landing')
  const [temp, setTemp] = useState(20)
  const [techs, setTechs] = useState([])
  const [score, setScore] = useState(40)
  const [runKey, setRunKey] = useState(0)
  const [exitModal, setExitModal] = useState(false)

  const reset = () => { setTemp(20); setTechs([]); setScore(40); setRunKey((k) => k + 1); setExitModal(false); setStage('landing') }
  const startChat = () => { try { localStorage.setItem('hj_consent', '1') } catch {} ; setTemp(20); setRunKey((k) => k + 1); setStage('chat') }

  return (
    <>
      {stage === 'landing' && <Landing onStart={startChat} />}
      {stage === 'chat' && (
        <Chat key={runKey} temp={temp} setTemp={setTemp}
          onFinish={(t) => { setTechs(t); setStage('label') }}
          onExit={() => setExitModal(true)} />
      )}
      {stage === 'label' && <LabelPage temp={temp} setTemp={setTemp} onNext={() => setStage('radar')} />}
      {stage === 'radar' && <RadarPage onDone={(s) => { setScore(s); setStage('card') }} />}
      {stage === 'card' && <CardPage techs={techs} score={score} onReplay={reset} />}

      {exitModal && (
        <div className="modal-mask" onClick={() => setExitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>确定离开沙盘吗？</p>
            <button className="btn primary" onClick={() => setExitModal(false)}>继续体验</button>
            <button className="btn" style={{ background: '#e8e2d8' }} onClick={() => { setExitModal(false); go('/') }}>退出</button>
            <button className="btn ghost" onClick={() => { setExitModal(false); go('/heal') }}>去心理疗愈 →</button>
          </div>
        </div>
      )}
    </>
  )
}
