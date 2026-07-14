import React, { useEffect, useState, useRef } from 'react'
import {
  VICTIMS, TECHNIQUE_CARDS, RADAR, EMOTIONS, COPY, STORY,
  TECH_PARAMS, STAGES, stageOf, RESOLVE_TECHS, SUSP_MAX, TRUST_WIN,
} from './data.js'
import { askVictim, analyzeText } from './llm.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const go = (p) => { location.hash = p }
const clamp = (v) => Math.max(0, Math.min(100, v))
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)
const paramOf = (t) => TECH_PARAMS[t] || TECH_PARAMS['无']
const WIN_TRUST = 70      // 收网所需最低信任
const WIN_SUSP_CAP = 62   // 收网所允许的最高戒心(超了她会缩回)
const SUSP_WARN = 70      // 戒心到这给一次警告(她退一步)

export function Thermometer({ value, big }) {
  return (
    <div className={'thermo' + (big ? ' big' : '')}>
      <div className="fill" style={{ height: value + '%', background: value > 70 ? '#E8965A' : value > 40 ? '#96E8B4' : '#7fae9e' }} />
    </div>
  )
}

function Brief({ onStart }) {
  return (
    <div className="landing">
      <div className="logo-row">
        <div className="logo">怀瑾</div>
        <div className="landing-stamp">瑾</div>
      </div>
      <div className="sub">骗子视角 · 操控接种</div>
      <div className="source">出自《楚辞·九章·怀沙》</div>
      <p className="lead">这一次，你当骗子。</p>
      <div className="consent">
        <h4>在开始之前</h4>
        <ul>
          <li>这是反诈教育模拟：你操控的是 AI 虚拟角色，不是真人。</li>
          <li>你要在<b>不惊动对方戒心</b>的前提下，一步步骗到 TA 愿意"转账"。</li>
          <li>太急、跳步谈钱，TA 会起疑——骗子真正的本事，是<b>火候</b>。</li>
          <li>结束后你会明白：你亲手用过的每一招，别人正用在你和家人身上。</li>
        </ul>
      </div>
      <button className="btn primary" onClick={onStart}>我准备好了</button>
      <button className="btn ghost" onClick={() => go('/')}>← 返回首页</button>
    </div>
  )
}

function Hunt({ onSelect }) {
  return (
    <div className="page">
      <h2>选择你的猎物</h2>
      <p className="muted">每个目标都有软肋——选一个开始操控</p>
      <div className="victim-cards">
        {VICTIMS.map((v) => (
          <button key={v.id} className="victim-card" onClick={() => onSelect(v)}>
            <div className="victim-avatar">{v.avatar}</div>
            <div className="victim-name">{v.name} · {v.age}</div>
            <div className="victim-desc">{v.description}</div>
            <div className="victim-weakness">
              <span className="weakness-label">软肋：</span>{v.weakness}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Play({ victim, onFinish, onLose, onExit }) {
  const [messages, setMessages] = useState([])
  const [trust, setTrust] = useState(20)
  const [susp, setSusp] = useState(0)
  const [typing, setTyping] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [usedTechniques, setUsedTechniques] = useState(new Set())
  const [flash, setFlash] = useState(null)
  const [guard, setGuard] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [atHinge, setAtHinge] = useState(false)
  const [freeInputOpen, setFreeInputOpen] = useState(false)

  const bodyRef = useRef(null)
  const aliveRef = useRef(true)
  const trustRef = useRef(20)
  const suspRef = useRef(0)
  const usedRef = useRef(new Set())
  const movesRef = useRef([])
  const messagesRef = useRef([])
  const objRef = useRef(false)
  const objDoneRef = useRef(false)
  const winTimerRef = useRef(null)
  const flashTimerRef = useRef(null)
  const advanceTimerRef = useRef(null)
  const cursorRef = useRef(0)
  const warnedRef = useRef(false)

  const beats = STORY[victim.id]?.beats || []
  const MARKER = /（h\d+\s*[好急]）/
  const persona = victim.description + ' ' + victim.weakness
  const stage = stageOf(trust)

  useEffect(() => () => {
    aliveRef.current = false
    if (winTimerRef.current) clearTimeout(winTimerRef.current)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  useEffect(() => {
    if (!typing && !atHinge && bodyRef.current) {
      bodyRef.current.scrollTo({ top: 99999, behavior: 'smooth' })
    }
  }, [messages, typing, atHinge])

  useEffect(() => {
    aliveRef.current = true
    setMessages([]); messagesRef.current = []
    movesRef.current = []
    usedRef.current = new Set(); setUsedTechniques(new Set())
    trustRef.current = 20; setTrust(20)
    suspRef.current = 0; setSusp(0)
    objRef.current = false; objDoneRef.current = false
    setGuard(false); setFlash(null); setCursor(0); setAtHinge(false)
    cursorRef.current = 0
    warnedRef.current = false
    advance()
  }, [victim])

  const addMsg = (m) => {
    setMessages((prev) => { const next = [...prev, m]; messagesRef.current = next; return next })
  }

  const showFlash = (f) => {
    setFlash(f)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => { if (aliveRef.current) setFlash(null) }, 2600)
  }

  const settleAutoTechnique = (technique) => {
    if (!technique) return
    const p = paramOf(technique)
    const stg = stageOf(trustRef.current)
    if (p.stageMin <= stg) {
      const dTrust = Math.round(p.trustGain * 0.3 + victim.trustBonus / 15)
      const dSusp = Math.round(p.suspGain * 0.5)
      trustRef.current = clamp(trustRef.current + dTrust)
      suspRef.current = clamp(suspRef.current + dSusp)
      setTrust(trustRef.current); setSusp(suspRef.current)
    }
  }

  const schedule = (ms) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => { if (aliveRef.current) advance() }, ms)
  }

  // 单拍推进:以 cursorRef 为真源(避免闭包读到 stale 的 cursor state),每次处理一拍再排下一拍
  const advance = async () => {
    if (!aliveRef.current) return
    const i = cursorRef.current
    if (i >= beats.length) return
    const beat = beats[i]

    if (beat.type === 'win') return resolveEnding()

    if (beat.type === 'hinge') { setCursor(i); setAtHinge(true); return }

    if (beat.type === 'skip') {
      addMsg({ type: 'skip', label: beat.label })
      cursorRef.current = i + 1; setCursor(i + 1)
      return schedule(500)
    }

    if (beat.type === 'auto') {
      // 分支标记台词（h1 好/急）只在 hinge 结算时挑出,自动播放阶段跳过,避免标记漏进 UI
      if (beat.from === 'victim' && MARKER.test(beat.text)) {
        cursorRef.current = i + 1; setCursor(i + 1)
        return schedule(0)
      }
      if (beat.from === 'victim') {
        setTyping(true)
        await sleep(700 + Math.random() * 400)
        if (!aliveRef.current) return
        setTyping(false)
        addMsg({ from: 'victim', text: beat.text })
      } else {
        addMsg({ from: 'user', text: beat.text, technique: beat.technique })
        if (beat.technique) settleAutoTechnique(beat.technique)
      }
      cursorRef.current = i + 1; setCursor(i + 1)
      return schedule(beat.from === 'victim' ? 550 : 750)
    }

    // 未知拍:跳过
    cursorRef.current = i + 1; setCursor(i + 1)
    return schedule(0)
  }

  const fastForward = () => {
    if (atHinge || typing) return
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    let i = cursorRef.current
    while (i < beats.length) {
      const beat = beats[i]
      if (beat.type === 'hinge' || beat.type === 'win') break
      if (beat.type === 'skip') {
        addMsg({ type: 'skip', label: beat.label })
      } else if (beat.type === 'auto') {
        if (beat.from === 'victim') {
          if (!MARKER.test(beat.text)) addMsg({ from: 'victim', text: beat.text })
        } else {
          addMsg({ from: 'user', text: beat.text, technique: beat.technique })
          if (beat.technique) settleAutoTechnique(beat.technique)
        }
      }
      i++
    }
    cursorRef.current = i; setCursor(i)
    if (i < beats.length && beats[i].type === 'hinge') setAtHinge(true)
    else if (beats[i]?.type === 'win') resolveEnding()
  }

  const decideMove = (technique) => {
    const p = paramOf(technique)
    const stg = stageOf(trustRef.current)
    let dTrust = 0, dSusp = 0, replyKind = 'ai'

    if (technique === '无') {
      dTrust = 0; dSusp = 5; replyKind = 'susp'
      showFlash({ type: 'bad', text: '这话没什么说服力 · 对方有点困惑 · 戒心 +5' })
      trustRef.current = clamp(trustRef.current + dTrust)
      suspRef.current = clamp(suspRef.current + dSusp)
      setTrust(trustRef.current); setSusp(suspRef.current)
      return replyKind
    }

    if (objRef.current) {
      if (RESOLVE_TECHS.includes(technique)) {
        dTrust = 12; dSusp = -32; replyKind = 'obj_resolved'
        objRef.current = false
        showFlash({ type: 'good', text: '压住了 TA 的怀疑 · 戒心 −32' })
      } else {
        dTrust = 3; dSusp = 16; replyKind = 'obj_fail'
        showFlash({ type: 'bad', text: '没压住怀疑 · 戒心 +16 —— 试试社会认同 / 互惠小惠 / 好感轰炸' })
      }
    } else if (p.stageMin > stg) {
      dTrust = 2; dSusp = p.suspGain * 2 + 12; replyKind = 'susp'
      showFlash({ type: 'bad', text: `还在【${STAGES[stg].name}】阶段，「${technique}」太猛了 · 戒心 +${dSusp}` })
    } else {
      dTrust = Math.round(p.trustGain + victim.trustBonus / 5)
      dSusp = p.suspGain
      if (p.triggersObjection && !objDoneRef.current && stg >= 2) {
        objRef.current = true; objDoneRef.current = true; replyKind = 'obj_trigger'
        showFlash({ type: 'warn', text: COPY.objectionHint })
      } else {
        showFlash({ type: 'good', text: `到点了 · 信任 +${dTrust}` })
      }
    }
    trustRef.current = clamp(trustRef.current + dTrust)
    suspRef.current = clamp(suspRef.current + dSusp)
    setTrust(trustRef.current); setSusp(suspRef.current)
    return replyKind
  }

  const winAndReveal = async () => {
    setTyping(true)
    await sleep(700)
    if (!aliveRef.current) return
    setTyping(false)
    addMsg({ from: 'victim', text: '好，我这就把钱转给你，谢谢你信我 🙏', deal: true })
    winTimerRef.current = setTimeout(() => {
      if (!aliveRef.current) return
      onFinish([...usedRef.current], movesRef.current)
    }, 1600)
  }

  // 收网结算:够火候(信任高、戒心低)才成交;否则她临门缩回,你输
  const resolveEnding = () => {
    if (trustRef.current >= WIN_TRUST && suspRef.current <= WIN_SUSP_CAP) return winAndReveal()
    return loseFinal()
  }

  const loseFinal = async () => {
    setTyping(true)
    await sleep(700)
    if (!aliveRef.current) return
    setTyping(false)
    addMsg({ from: 'victim', text: '我…还是先问问家里人吧，这钱不能说转就转。', pull: true })
    winTimerRef.current = setTimeout(() => { if (aliveRef.current) onLose('final') }, 1800)
  }

  const triggerGuard = () => {
    setTyping(false); setGuard(true)
  }

  const dismissGuard = () => {
    suspRef.current = 55; setSusp(55)
    setGuard(false)
    advance()
  }

  // hinge 后受害者反应:固定 kind(起疑/怀疑)优先;否则按选择质量在紧跟的标记台词里挑对应分支
  const getVictimReply = (replyKind, choice, hingeIdx) => {
    if (replyKind === 'obj_trigger') return victim.objection.text
    if (replyKind === 'obj_resolved') return victim.objection.resolvedReply
    if (replyKind === 'obj_fail') return victim.objection.failReply
    const want = choice.quality === 'jump' ? '急）' : '好）'
    for (let k = hingeIdx + 1; k < beats.length; k++) {
      const b = beats[k]
      if (b.type === 'auto' && b.from === 'victim' && MARKER.test(b.text)) {
        if (b.text.includes(want)) return b.text.replace(MARKER, '').trim()
      } else break
    }
    if (replyKind === 'susp') return pick(victim.suspLines)
    return null
  }

  // 跳过 hinge 之后紧跟的分支标记台词(其内容已由 getVictimReply 挑出上屏)
  const skipMarkerBeats = (from) => {
    let n = from
    while (n < beats.length && beats[n].type === 'auto' && beats[n].from === 'victim' && MARKER.test(beats[n].text)) n++
    return n
  }

  // hinge 结算:以剧本作者标注的 quality 为准(good=到点,jump=太急),不再按当前 trust 重新判阶段
  const decideHinge = (choice, beat) => {
    const p = paramOf(choice.technique)
    const stg = stageOf(trustRef.current)
    let dTrust = 0, dSusp = 0, replyKind = 'ai'
    if (objRef.current) {
      if (RESOLVE_TECHS.includes(choice.technique)) {
        dTrust = 14; dSusp = -34; replyKind = 'obj_resolved'; objRef.current = false
        showFlash({ type: 'good', text: '压住了 TA 的怀疑 · 戒心 −34' })
      } else {
        dTrust = 3; dSusp = 18; replyKind = 'obj_fail'
        showFlash({ type: 'bad', text: '没压住怀疑 · 戒心 +18 —— 试试社会认同 / 互惠小惠 / 好感轰炸' })
      }
    } else if (beat?.stageAtLeast != null && stg < beat.stageAtLeast) {
      dTrust = 2; dSusp = p.suspGain * 2 + 12; replyKind = 'susp'
      showFlash({ type: 'bad', text: `还没到时候 · 当前是【${STAGES[stg].name}】，这个招数太急了 · 戒心 +${dSusp}` })
    } else if (choice.quality === 'jump') {
      dTrust = 2; dSusp = p.suspGain * 2 + 12; replyKind = 'susp'
      showFlash({ type: 'bad', text: `太急了 ·「${choice.technique}」这会儿会吓到 TA · 戒心 +${dSusp}` })
    } else {
      dTrust = Math.round(p.trustGain + victim.trustBonus / 5)
      dSusp = p.suspGain
      if (beat?.triggersObjection && !objDoneRef.current) {
        objRef.current = true; objDoneRef.current = true; replyKind = 'obj_trigger'
        showFlash({ type: 'warn', text: COPY.objectionHint })
      } else {
        showFlash({ type: 'good', text: `到点了 · 信任 +${dTrust}` })
      }
    }
    trustRef.current = clamp(trustRef.current + dTrust)
    suspRef.current = clamp(suspRef.current + dSusp)
    setTrust(trustRef.current); setSusp(suspRef.current)
    return replyKind
  }

  const handleHingeChoice = async (choice) => {
    if (typing || !atHinge) return
    setAtHinge(false); setFreeInputOpen(false)
    const i = cursorRef.current

    addMsg({ from: 'user', text: choice.line, technique: choice.technique })
    movesRef.current = [...movesRef.current, { text: choice.line, technique: choice.technique }]
    usedRef.current = new Set([...usedRef.current, choice.technique]); setUsedTechniques(new Set(usedRef.current))

    const replyKind = decideHinge(choice, beats[i])
    setTyping(true)
    await sleep(650)
    if (!aliveRef.current) return

    let reply = getVictimReply(replyKind, choice, i)
    if (!reply) reply = await askVictim(messagesRef.current, persona, choice.technique)
    if (!aliveRef.current) return
    setTyping(false)
    addMsg({ from: 'victim', text: reply, objection: replyKind === 'obj_trigger' })

    cursorRef.current = skipMarkerBeats(i + 1); setCursor(cursorRef.current)

    if (suspRef.current >= SUSP_MAX) return onLose('spooked')
    if (suspRef.current >= SUSP_WARN && !warnedRef.current) { warnedRef.current = true; return triggerGuard() }

    schedule(600)
  }

  const handleFreeInput = async () => {
    const text = inputVal.trim()
    if (!text || !atHinge) return
    setAtHinge(false); setFreeInputOpen(false); setInputVal('')
    const i = cursorRef.current

    addMsg({ from: 'user', text, technique: '识别中…' })
    setTyping(true)
    const analysis = await analyzeText(text)
    if (!aliveRef.current) return
    const technique = analysis?.items?.[0]?.technique || '无'
    setMessages((prev) => {
      const c = [...prev]
      for (let j = c.length - 1; j >= 0; j--) {
        if (c[j].from === 'user' && c[j].technique === '识别中…') { c[j] = { ...c[j], technique }; break }
      }
      messagesRef.current = c
      return c
    })
    movesRef.current = [...movesRef.current, { text, technique }]
    usedRef.current = new Set([...usedRef.current, technique]); setUsedTechniques(new Set(usedRef.current))

    const replyKind = decideMove(technique)
    await sleep(600)
    if (!aliveRef.current) return

    const quality = (technique === '无' || paramOf(technique).stageMin > stageOf(trustRef.current)) ? 'jump' : 'good'
    let reply = getVictimReply(replyKind, { quality }, i)
    if (!reply) reply = await askVictim(messagesRef.current, persona, technique)
    if (!aliveRef.current) return
    setTyping(false)
    addMsg({ from: 'victim', text: reply, objection: replyKind === 'obj_trigger' })

    cursorRef.current = skipMarkerBeats(i + 1); setCursor(cursorRef.current)

    if (suspRef.current >= SUSP_MAX) return onLose('spooked')
    if (suspRef.current >= SUSP_WARN && !warnedRef.current) { warnedRef.current = true; return triggerGuard() }

    schedule(600)
  }

  const currentBeat = beats[cursor]
  const st = STAGES[stage]

  return (
    <>
      <div className="chat-header">
        <div className="avatar">{victim.avatar}</div>
        <div className="name">{victim.name}<small>{victim.description}</small></div>
        <div className="header-right">
          <button className="fast-forward-btn" onClick={fastForward} disabled={atHinge || typing}>⏩ 跳过闲聊</button>
          <button className="exit-btn" onClick={onExit}>✕</button>
        </div>
      </div>

      <div className="meters">
        <div className="meter">
          <div className="meter-top"><span>信任</span><span>{Math.round(trust)}</span></div>
          <div className="meter-track"><div className="meter-fill trust" style={{ width: trust + '%' }} /></div>
        </div>
        <div className="meter">
          <div className="meter-top"><span>戒心</span><span className={susp > 70 ? 'danger' : ''}>{Math.round(susp)}</span></div>
          <div className="meter-track"><div className="meter-fill susp" style={{ width: susp + '%' }} /></div>
        </div>
      </div>

      <div className="stage-strip">
        <span className="stage-badge">阶段 {stage + 1}/4 · {st.name}</span>
        <span className="stage-hint">{st.hint}</span>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, idx) => (
          m.type === 'skip' ? (
            <div key={idx} className="skip-line">—— {m.label} ——</div>
          ) : (
            <div key={idx} className={'msg-row ' + (m.from === 'user' ? 'user' : '')}>
              <div className="avatar">{m.from === 'user' ? '我' : m.from === 'system' ? '💡' : victim.avatar}</div>
              <div className="msg-wrap">
                <div className={'bubble' + (m.deal ? ' deal' : '') + (m.objection ? ' objection' : '') + (m.system ? ' system' : '')}>{m.text}</div>
                {m.from === 'user' && m.technique && (
                  <span className="tech-tag">🎯 你使用了：{m.technique}</span>
                )}
              </div>
            </div>
          )
        ))}
        {typing && (
          <div className="msg-row">
            <div className="avatar">{victim.avatar}</div>
            <div className="bubble typing"><i /><i /><i /></div>
          </div>
        )}
      </div>

      {flash && <div className={'move-flash ' + flash.type}>{flash.text}</div>}

      {atHinge && currentBeat && (
        <div className="hinge-area">
          <div className="hinge-situation">{currentBeat.situation}</div>
          <div className="hinge-choices">
            {currentBeat.choices.map((choice, i) => (
              <button key={i} className="hinge-card" onClick={() => handleHingeChoice(choice)}>
                <span className="hinge-label">{choice.label}</span>
              </button>
            ))}
          </div>
          <div className="hinge-free">
            <button className="free-toggle" onClick={() => setFreeInputOpen(!freeInputOpen)}>
              {freeInputOpen ? '收起' : '自由输入话术…'}
            </button>
            {freeInputOpen && (
              <div className="free-input-wrap">
                <input
                  className="free-input"
                  value={inputVal}
                  placeholder="输入你想说的话…"
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFreeInput()}
                  autoFocus
                />
                <button className="free-send" onClick={handleFreeInput} disabled={!inputVal.trim()}>发送</button>
              </div>
            )}
          </div>
        </div>
      )}

      {guard && (
        <div className="guard-overlay">
          <div className="guard-card">
            <div className="guard-title">{COPY.guardUp.title}</div>
            <p className="guard-body">{COPY.guardUp.body}</p>
            <button className="btn primary" onClick={dismissGuard}>{COPY.guardUp.cta}</button>
          </div>
        </div>
      )}
    </>
  )
}

const TECH_PRIORITY = ['情感隔离', '制造紧迫', '权威背书', '制造稀缺', '沉没成本', '社会认同', '互惠小惠', '好感轰炸']

function Reveal({ victim, techniques, moves, onNext }) {
  if (!victim) return null
  // 挑玩家亲手打出的、最"有杀伤力"的 2-3 句原话复述
  const scored = (moves || [])
    .filter((m) => m.technique && m.technique !== '无' && m.technique !== '识别中…')
    .map((m) => ({ ...m, rank: TECH_PRIORITY.indexOf(m.technique) }))
    .sort((a, b) => (a.rank < 0 ? 99 : a.rank) - (b.rank < 0 ? 99 : b.rank))
  const seen = new Set()
  const quotes = scored.filter((m) => (seen.has(m.technique) ? false : seen.add(m.technique))).slice(0, 3)

  return (
    <div className="page reveal-page">
      <div className="reveal-card">
        <div className="reveal-avatar">{victim.avatar}</div>
        <div className="reveal-title reveal-mask">{victim.revealText}</div>
        <div className="reveal-desc">{victim.revealDesc}</div>
        <div className="reveal-divider" />
        <p className="reveal-narration">下面这几句，是你<b>亲手</b>打出去的——</p>
        <div className="quotes">
          {quotes.map((m, i) => (
            <div key={i} className="quote-line" style={{ animationDelay: (0.9 + i * 0.5) + 's' }}>
              <div className="quote-text">"{m.text}"</div>
              <div className="quote-stamp">← {m.technique}</div>
            </div>
          ))}
        </div>
        <p className="reveal-warning">记住这种感觉。当别人对你用这些招数时，你会认得每一招。</p>
        <p className="reveal-forbid">这些话术只用于让你认得套路，请勿对真实的人使用——用它们行骗，在法律与道德上都不被允许。</p>
      </div>
      <button className="btn primary" onClick={onNext}>继续 →</button>
    </div>
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
  const finalScore = Math.min(100, 40 + correct * 10)

  useEffect(() => {
    if (!finished) return
    const iv = setInterval(() => {
      setDisplay((d) => {
        if (d >= finalScore) { clearInterval(iv); return finalScore }
        return d + 2
      })
    }, 30)
    return () => clearInterval(iv)
  }, [finished])

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
        <div className="date">{new Date().toLocaleDateString('zh-CN')} · 怀瑾 · 骗子视角</div>
        <div className="label">你已掌握骗子的完整剧本</div>
        <div className="badges">{techs.map((t) => <span className="badge" key={t}>{t}</span>)}</div>
        <div className="label">操控雷达分</div>
        <div className="score">{score}</div>
        <div className="slogan">{COPY.tagline}<br />{COPY.slogan}</div>
      </div>
      <p className="muted">免疫会随时间衰减——一周后回来打一支 60 秒加强针。</p>
      <button className="btn primary" onClick={onReplay}>换个猎物再体验一次</button>
      <button className="btn ghost" onClick={() => go('/')}>← 返回首页</button>
    </div>
  )
}

function LosePage({ victim, reason, onReplay }) {
  if (!victim) return null
  return (
    <div className="page lose-page">
      <div className="lose-card">
        <div className="lose-avatar">{victim.avatar}<span className="lose-door">🚪</span></div>
        <div className="lose-title">她抽身了。</div>
        <div className="lose-sub">
          {reason === 'spooked'
            ? '你太急、太猛——她起了疑，把你拉黑了。'
            : '临门一脚，她还是缩回去了：她说要先问问家里人。'}
        </div>
        <div className="reveal-divider" />
        <p className="lose-narration">你没得手——因为<b>她做对了这几件事</b>：</p>
        <ul className="lose-signals">
          <li>你越<b>催</b>、越<b>跳步谈钱</b>，她越警觉。</li>
          <li>你要她<b>瞒着家人</b>，她反而更想问问家里人。</li>
          <li>关系和钱<b>升温太快</b>，她本能地踩了刹车。</li>
        </ul>
        <p className="lose-lesson">
          记住：<b>被催、被要求瞒着家人、感情或钱升温太快</b>——这几样一起出现，就是该抽身的信号。
          真骗子会更有耐心；但你现在，认得出这套路了。
        </p>
      </div>
      <button className="btn primary" onClick={onReplay}>换个猎物再试一次</button>
      <button className="btn ghost" onClick={() => go('/')}>← 返回首页</button>
    </div>
  )
}

export default function Scammer() {
  const [stage, setStage] = useState('brief')
  const [victim, setVictim] = useState(null)
  const [techs, setTechs] = useState([])
  const [moves, setMoves] = useState([])
  const [score, setScore] = useState(40)
  const [temp, setTemp] = useState(60)
  const [loseReason, setLoseReason] = useState('')

  const reset = () => { setStage('brief'); setVictim(null); setTechs([]); setMoves([]); setScore(40); setTemp(60); setLoseReason('') }
  const startHunt = () => { setStage('hunt') }
  const startPlay = (v) => { setVictim(v); setStage('play') }
  const finishPlay = (t, m) => { setTechs(t); setMoves(m); setStage('reveal') }
  const loseGame = (r) => { setLoseReason(r); setStage('lose') }
  const startLabel = () => { setStage('label') }
  const startRadar = () => { setStage('radar') }
  const finishRadar = (s) => { setScore(s); setStage('card') }

  return (
    <>
      {stage === 'brief' && <Brief onStart={startHunt} />}
      {stage === 'hunt' && <Hunt onSelect={startPlay} />}
      {stage === 'play' && <Play victim={victim} onFinish={finishPlay} onLose={loseGame} onExit={reset} />}
      {stage === 'reveal' && <Reveal victim={victim} techniques={techs} moves={moves} onNext={startLabel} />}
      {stage === 'lose' && <LosePage victim={victim} reason={loseReason} onReplay={reset} />}
      {stage === 'label' && <LabelPage temp={temp} setTemp={setTemp} onNext={startRadar} />}
      {stage === 'radar' && <RadarPage onDone={finishRadar} />}
      {stage === 'card' && <CardPage techs={techs} score={score} onReplay={reset} />}
    </>
  )
}
