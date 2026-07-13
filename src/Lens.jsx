import { useState, useRef } from 'react'
import { analyzeSuspicious, ocrImage, trajectoryVerdict } from './llm.js'
import { CASES, TRAJECTORY_QUESTIONS, TECH_COLORS } from './data.js'

const LEVEL_META = {
  低风险: { color: '#3E7A63', ring: '#3E7A63', tag: '低风险', desc: '暂时安全' },
  需核实: { color: '#C8722E', ring: '#C8722E', tag: '需核实', desc: '别急，先核实' },
  高危: { color: '#B23A28', ring: '#B23A28', tag: '高危', desc: '八成是骗局' },
  极高危: { color: '#8A1F14', ring: '#8A1F14', tag: '极高危', desc: '立刻停手' },
}

function ConfidenceRing({ value, level }) {
  const meta = LEVEL_META[level] || LEVEL_META['需核实']
  const R = 34, C = 2 * Math.PI * R
  const off = C * (1 - value / 100)
  return (
    <div className="conf-ring">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(35,40,42,0.10)" strokeWidth="7" />
        <circle cx="40" cy="40" r={R} fill="none" stroke={meta.ring} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
        <text x="40" y="38" textAnchor="middle" className="conf-num" fill={meta.color}>{value}<tspan fontSize="12">%</tspan></text>
        <text x="40" y="54" textAnchor="middle" className="conf-cap" fill={meta.color}>骗局可能</text>
      </svg>
    </div>
  )
}

function VerdictCard({ v }) {
  if (!v) return null
  const meta = LEVEL_META[v.level] || LEVEL_META['需核实']
  return (
    <div className={'verdict-card lvl-' + (v.level || '需核实')}>
      <div className="verdict-top">
        <ConfidenceRing value={v.confidence} level={v.level} />
        <div className="verdict-head">
          <span className="level-badge" style={{ background: meta.color }}>{meta.tag} · {meta.desc}</span>
          <p className="verdict-headline">{v.headline}</p>
        </div>
      </div>

      {v.redlines && v.redlines.length > 0 && (
        <div className="redline-block">
          {v.redlines.map((r, i) => (
            <div key={i} className="redline-item">
              <div className="redline-title">🚫 红线 · {r.label}<span className="redline-stake">{r.stake}</span></div>
              <div className="redline-why">{r.why}</div>
              <ul className="redline-actions">
                {r.action.map((a, j) => <li key={j}>{a}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {v.mode === 'long' && v.trajectory && (
        <div className="traj-block">
          <h4>🧭 关系轨迹体检</h4>
          <p className="traj-body">{v.trajectory.timeline}</p>
          {v.trajectory.flags && v.trajectory.flags.length > 0 && (
            <div className="traj-flags">
              {v.trajectory.flags.map((f, i) => <span key={i} className="traj-flag">{f}</span>)}
            </div>
          )}
          {v.trajectory.nextStep && <div className="traj-next">🔮 {v.trajectory.nextStep}</div>}
        </div>
      )}

      {v.mode === 'short' && v.techniques && v.techniques.length > 0 && (
        <div className="tech-block">
          <h4>🔎 逐句盖章</h4>
          {v.techniques.map((t, i) => (
            <div key={i} className="tech-item">
              <div className="tech-quote">「{t.quote}」</div>
              <div className="tech-badge" style={{ background: TECH_COLORS[t.technique] || '#6B7169' }}>{t.technique}</div>
              <div className="tech-mech">{t.mechanism}</div>
              {t.counter && <div className="tech-counter">💬 {t.counter}</div>}
            </div>
          ))}
        </div>
      )}

      {v.verify && v.verify.length > 0 && (
        <div className="verify-block">
          <h4>✅ 怎么核实 / 破解</h4>
          <ol>{v.verify.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}

      {v.empathy && <div className="verdict-empathy">{v.empathy}</div>}
      <div className="disclaimer">AI 辅助判读，仅供参考，不构成法律意见 · 拿不准就打 96110</div>
    </div>
  )
}

function TextEntry({ onVerdict }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!input.trim()) return
    setLoading(true); onVerdict(null)
    const v = await analyzeSuspicious(input)
    onVerdict(v); setLoading(false)
  }
  const loadCase = (c) => { setInput(c.text); onVerdict(null) }

  return (
    <>
      <textarea className="lens-textarea" value={input} onChange={(e) => setInput(e.target.value)}
        placeholder="把可疑的聊天记录、短信、招聘信息粘到这里…" rows={6} />
      <div className="case-strip">
        <span className="case-strip-label">试试案例库：</span>
        <div className="case-chips">
          {CASES.map((c) => (
            <button key={c.id} className="case-chip" onClick={() => loadCase(c)}>
              <span>{c.icon}</span>{c.title}
            </button>
          ))}
        </div>
      </div>
      <button className="lens-analyze-btn" onClick={run} disabled={loading || !input.trim()}>
        {loading ? '判读中…' : '开始判读'}
      </button>
    </>
  )
}

function ImageEntry({ onVerdict }) {
  const [preview, setPreview] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [status, setStatus] = useState('') // reading | analyzing
  const fileRef = useRef(null)

  const pick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result
      setPreview(dataUrl); setOcrText(''); onVerdict(null); setStatus('reading')
      const text = await ocrImage(dataUrl)
      if (!text) { setStatus('fail'); return }
      setOcrText(text); setStatus('analyzing')
      const v = await analyzeSuspicious(text)
      onVerdict(v); setStatus('')
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      <button className="upload-zone" onClick={() => fileRef.current?.click()}>
        {preview ? <img src={preview} alt="截图" className="upload-preview" /> : (
          <><div className="upload-icon">🖼️</div><div>点这里上传聊天/短信截图</div>
            <div className="upload-hint">AI 会先读出文字，再做判读</div></>
        )}
      </button>
      {status === 'reading' && <div className="ocr-status">正在读取截图文字…</div>}
      {status === 'analyzing' && <div className="ocr-status">读到了，正在判读…</div>}
      {status === 'fail' && <div className="ocr-status err">没读清这张图，换一张更清晰的，或改用「粘文字」。</div>}
      {ocrText && (
        <div className="ocr-text">
          <div className="ocr-text-label">读到的内容：</div>
          <pre>{ocrText}</pre>
        </div>
      )}
    </>
  )
}

function QuizEntry({ onVerdict }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])

  const pick = (opt) => {
    const q = TRAJECTORY_QUESTIONS[step]
    const next = [...answers, { id: q.id, risk: opt.risk, label: opt.risk >= 15 ? opt.t : '' }]
    if (step + 1 < TRAJECTORY_QUESTIONS.length) {
      setAnswers(next); setStep(step + 1)
    } else {
      onVerdict(trajectoryVerdict(next))
    }
  }
  const restart = () => { setStep(0); setAnswers([]); onVerdict(null) }

  const q = TRAJECTORY_QUESTIONS[step]
  return (
    <div className="quiz-entry">
      <div className="quiz-progress">
        {TRAJECTORY_QUESTIONS.map((_, i) => (
          <span key={i} className={'quiz-dot' + (i <= step ? ' on' : '')} />
        ))}
      </div>
      <p className="quiz-hint">杀猪盘没有可粘的"坏句子"，毒在关系的走向。答几个问题就能体检——不用聊天记录。</p>
      <div className="quiz-q">{q.q}</div>
      <div className="quiz-opts-col">
        {q.opts.map((o, i) => (
          <button key={i} className="quiz-opt-btn" onClick={() => pick(o)}>{o.t}</button>
        ))}
      </div>
      {step > 0 && <button className="btn-mini" onClick={restart}>重新开始</button>}
    </div>
  )
}

export default function Lens() {
  const [mode, setMode] = useState('text') // text | image | quiz
  const [verdict, setVerdict] = useState(null)

  const switchMode = (m) => { setMode(m); setVerdict(null) }

  return (
    <div className="lens-page">
      <div className="lens-header">
        <h1>可疑分析</h1>
        <p className="lens-subtitle">粘一段话、传一张截图，或答几个问题——看穿它的套路与形状</p>
      </div>

      <div className="lens-tabs">
        <button className={'lens-tab' + (mode === 'text' ? ' on' : '')} onClick={() => switchMode('text')}>📋 粘文字</button>
        <button className={'lens-tab' + (mode === 'image' ? ' on' : '')} onClick={() => switchMode('image')}>🖼️ 传截图</button>
        <button className={'lens-tab' + (mode === 'quiz' ? ' on' : '')} onClick={() => switchMode('quiz')}>🧭 关系体检</button>
      </div>

      <div className="lens-body">
        {mode === 'text' && <TextEntry onVerdict={setVerdict} />}
        {mode === 'image' && <ImageEntry onVerdict={setVerdict} />}
        {mode === 'quiz' && <QuizEntry onVerdict={setVerdict} />}
      </div>

      {verdict && <VerdictCard v={verdict} />}
    </div>
  )
}
