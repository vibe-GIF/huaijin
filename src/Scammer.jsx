import React, { useEffect, useState, useRef } from 'react'
import {
  VICTIMS, TECHNIQUE_CARDS, RADAR, EMOTIONS, COPY,
  TECH_PARAMS, STAGES, stageOf, RESOLVE_TECHS, SUSP_MAX, TRUST_WIN,
} from './data.js'
import { askVictim, analyzeText } from './llm.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const go = (p) => { location.hash = p }
const clamp = (v) => Math.max(0, Math.min(100, v))
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)
const paramOf = (t) => TECH_PARAMS[t] || TECH_PARAMS['无']

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

function Play({ victim, onFinish, onExit }) {
  const [messages, setMessages] = useState([])
  const [trust, setTrust] = useState(20)
  const [susp, setSusp] = useState(0)
  const [cards, setCards] = useState([])
  const [typing, setTyping] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [usedTechniques, setUsedTechniques] = useState(new Set())
  const [flash, setFlash] = useState(null)
  const [guard, setGuard] = useState(false)
  const [chipsLocked, setChipsLocked] = useState(false)

  const bodyRef = useRef(null)
  const aliveRef = useRef(true)
  const trustRef = useRef(20)
  const suspRef = useRef(0)
  const usedRef = useRef(new Set())
  const movesRef = useRef([])          // 玩家亲手打出的话 [{text, technique}]
  const messagesRef = useRef([])        // 供异步 askVictim 读到最新对话
  const objRef = useRef(false)          // 当前是否有一个未化解的怀疑
  const objDoneRef = useRef(false)      // 本局的"抛饵怀疑"是否已触发过
  const winTimerRef = useRef(null)
  const flashTimerRef = useRef(null)

  const persona = victim.description + ' ' + victim.weakness
  const stage = stageOf(trust)

  useEffect(() => () => {
    aliveRef.current = false
    if (winTimerRef.current) clearTimeout(winTimerRef.current)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
  }, [])

  useEffect(() => {
    if (!typing && bodyRef.current) {
      bodyRef.current.scrollTo({ top: 99999, behavior: 'smooth' })
    }
  }, [messages, typing])

  useEffect(() => {
    const initialMsg = `你好呀~ ${victim.name}，刷到你的主页，感觉你是个很认真生活的人 :)`
    const first = [{ from: 'user', text: initialMsg, technique: '好感轰炸' }]
    setMessages(first); messagesRef.current = first
    movesRef.current = [{ text: initialMsg, technique: '好感轰炸' }]
    usedRef.current = new Set(['好感轰炸']); setUsedTechniques(new Set(usedRef.current))
    trustRef.current = 22; setTrust(22)
    suspRef.current = 0; setSusp(0)
    objRef.current = false; objDoneRef.current = false
    setGuard(false); setChipsLocked(false); setFlash(null)
    drawCards(0)
  }, [victim])

  const drawCards = (stg) => {
    const playable = TECHNIQUE_CARDS.filter((c) => paramOf(c.technique).stageMin <= stg)
    const locked = TECHNIQUE_CARDS.filter((c) => paramOf(c.technique).stageMin > stg)
    let hand = shuffle(playable).slice(0, 3).concat(shuffle(locked).slice(0, 1))
    if (hand.length < 4) {
      const rest = TECHNIQUE_CARDS.filter((c) => !hand.includes(c))
      hand = hand.concat(shuffle(rest).slice(0, 4 - hand.length))
    }
    setCards(shuffle(hand).slice(0, 4))
  }

  const addMsg = (m) => {
    setMessages((prev) => { const next = [...prev, m]; messagesRef.current = next; return next })
  }

  const showFlash = (f) => {
    setFlash(f)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => { if (aliveRef.current) setFlash(null) }, 2600)
  }

  // 同步计算一手的后果(用 ref 作真源),返回受害者该怎么回
  const decideMove = (technique) => {
    const p = paramOf(technique)
    const stg = stageOf(trustRef.current)
    let dTrust = 0, dSusp = 0, replyKind = 'ai'

    if (objRef.current) {
      // 正处在"化解怀疑"的关口
      if (RESOLVE_TECHS.includes(technique)) {
        dTrust = 12; dSusp = -32; replyKind = 'obj_resolved'
        objRef.current = false
        showFlash({ type: 'good', text: '压住了 TA 的怀疑 · 戒心 −32' })
      } else {
        dTrust = 3; dSusp = 16; replyKind = 'obj_fail'
        showFlash({ type: 'bad', text: '没压住怀疑 · 戒心 +16 —— 试试社会认同 / 送福利 / 温柔赞美' })
      }
    } else if (p.stageMin > stg) {
      // 跳步:太猛
      dTrust = 2; dSusp = p.suspGain * 2 + 12; replyKind = 'susp'
      showFlash({ type: 'bad', text: `还在【${STAGES[stg].name}】阶段，「${technique}」太猛了 · 戒心 +${dSusp}` })
    } else {
      // 到点
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

  // 得手:受害者说出成交台词,停一拍(高光帧)再进反转
  const winAndReveal = async () => {
    setChipsLocked(true); setTyping(true)
    await sleep(700)
    if (!aliveRef.current) return
    setTyping(false)
    addMsg({ from: 'victim', text: '好，我这就把钱转给你，谢谢你信我 🙏', deal: true })
    winTimerRef.current = setTimeout(() => {
      if (!aliveRef.current) return
      onFinish([...usedRef.current], movesRef.current)
    }, 1600)
  }

  const triggerGuard = () => { setChipsLocked(true); setTyping(false); setGuard(true) }
  const dismissGuard = () => {
    suspRef.current = 55; setSusp(55)
    objRef.current = false
    setGuard(false); setChipsLocked(false)
    drawCards(stageOf(trustRef.current))
  }

  // 一手的完整结算:玩家气泡已上屏,这里算后果 + 出受害者回应
  const resolveMove = async (technique, displayText) => {
    movesRef.current = [...movesRef.current, { text: displayText, technique }]
    usedRef.current = new Set([...usedRef.current, technique]); setUsedTechniques(new Set(usedRef.current))
    const replyKind = decideMove(technique)
    await sleep(650)
    if (!aliveRef.current) return
    if (suspRef.current >= SUSP_MAX) return triggerGuard()

    let reply
    if (replyKind === 'susp') reply = pick(victim.suspLines)
    else if (replyKind === 'obj_trigger') reply = victim.objection.text
    else if (replyKind === 'obj_resolved') reply = victim.objection.resolvedReply
    else if (replyKind === 'obj_fail') reply = victim.objection.failReply
    else reply = await askVictim(messagesRef.current, persona, technique)
    if (!aliveRef.current) return

    addMsg({ from: 'victim', text: reply, objection: replyKind === 'obj_trigger' })
    setTyping(false)
    if (trustRef.current >= TRUST_WIN && !objRef.current) return winAndReveal()
    drawCards(stageOf(trustRef.current))
  }

  const handlePlayCard = async (card) => {
    if (typing || chipsLocked) return
    const sample = pick(card.sample)
    setInputVal('')
    setTyping(true)
    addMsg({ from: 'user', text: sample, technique: card.technique })
    await resolveMove(card.technique, sample)
  }

  const handleSend = async () => {
    const text = inputVal.trim()
    if (!text || typing || chipsLocked) return
    setInputVal('')
    // 乐观上屏:先显示玩家气泡(技法待识别),异步分析回填
    addMsg({ from: 'user', text, technique: '识别中…' })
    setTyping(true)
    const analysis = await analyzeText(text)
    if (!aliveRef.current) return
    const technique = analysis?.items?.[0]?.technique || '无'
    setMessages((prev) => {
      const c = [...prev]
      for (let i = c.length - 1; i >= 0; i--) {
        if (c[i].from === 'user' && c[i].technique === '识别中…') { c[i] = { ...c[i], technique }; break }
      }
      messagesRef.current = c
      return c
    })
    await resolveMove(technique, text)
  }

  const st = STAGES[stage]

  return (
    <>
      <div className="chat-header">
        <div className="avatar">{victim.avatar}</div>
        <div className="name">{victim.name}<small>{victim.description}</small></div>
        <button className="exit-btn" onClick={onExit}>✕</button>
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
          <div key={idx} className={'msg-row ' + (m.from === 'user' ? 'user' : '')}>
            <div className="avatar">{m.from === 'user' ? '我' : victim.avatar}</div>
            <div className="msg-wrap">
              <div className={'bubble' + (m.deal ? ' deal' : '') + (m.objection ? ' objection' : '')}>{m.text}</div>
              {m.from === 'user' && m.technique && (
                <span className="tech-tag">🎯 你使用了：{m.technique}</span>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="msg-row">
            <div className="avatar">{victim.avatar}</div>
            <div className="bubble typing"><i /><i /><i /></div>
          </div>
        )}
      </div>

      {flash && <div className={'move-flash ' + flash.type}>{flash.text}</div>}

      <div className="scammer-area">
        <div className="cards-row">
          {cards.map((card) => {
            const locked = paramOf(card.technique).stageMin > stage
            return (
              <button key={card.technique} className={'tech-card' + (locked ? ' locked' : '')}
                onClick={() => handlePlayCard(card)} disabled={typing || chipsLocked}>
                {locked && <span className="lock-badge">🔒</span>}
                <span className="tech-emoji">{card.emoji}</span>
                <span className="tech-label">{card.label}</span>
                <span className="tech-desc">{card.description}</span>
              </button>
            )
          })}
        </div>
        <div className="input-row">
          <input
            className="real-input"
            value={inputVal}
            placeholder="或自由输入话术…"
            disabled={typing || chipsLocked}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={handleSend} disabled={typing || chipsLocked || !inputVal.trim()}>发送</button>
        </div>
      </div>

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

export default function Scammer() {
  const [stage, setStage] = useState('brief')
  const [victim, setVictim] = useState(null)
  const [techs, setTechs] = useState([])
  const [moves, setMoves] = useState([])
  const [score, setScore] = useState(40)
  const [temp, setTemp] = useState(60)

  const reset = () => { setStage('brief'); setVictim(null); setTechs([]); setMoves([]); setScore(40); setTemp(60) }
  const startHunt = () => { setStage('hunt') }
  const startPlay = (v) => { setVictim(v); setStage('play') }
  const finishPlay = (t, m) => { setTechs(t); setMoves(m); setStage('reveal') }
  const startLabel = () => { setStage('label') }
  const startRadar = () => { setStage('radar') }
  const finishRadar = (s) => { setScore(s); setStage('card') }

  return (
    <>
      {stage === 'brief' && <Brief onStart={startHunt} />}
      {stage === 'hunt' && <Hunt onSelect={startPlay} />}
      {stage === 'play' && <Play victim={victim} onFinish={finishPlay} onExit={reset} />}
      {stage === 'reveal' && <Reveal victim={victim} techniques={techs} moves={moves} onNext={startLabel} />}
      {stage === 'label' && <LabelPage temp={temp} setTemp={setTemp} onNext={startRadar} />}
      {stage === 'radar' && <RadarPage onDone={finishRadar} />}
      {stage === 'card' && <CardPage techs={techs} score={score} onReplay={reset} />}
    </>
  )
}
