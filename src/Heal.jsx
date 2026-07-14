import { useState, useEffect, useRef } from 'react'
import { healReply, detectCrisis } from './llm.js'
import { COPY, EMOTIONS } from './data.js'

function CloudDivider() {
  return (
    <div className="cloud-divider">
      <svg viewBox="0 0 1200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,40 Q150,0 300,40 T600,40 T900,40 T1200,40"
          stroke="rgba(143, 168, 155, 0.15)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M0,50 Q200,20 400,50 T800,50 T1200,50"
          stroke="rgba(143, 168, 155, 0.1)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

const tempColor = (t) => `hsl(28, ${Math.round(12 + t * 0.62)}%, ${Math.round(68 - t * 0.09)}%)`

function Thermometer({ value, big }) {
  return (
    <div className={'heal-thermo' + (big ? ' big' : '')}>
      <div className="fill" style={{ height: value + '%', background: tempColor(value) }} />
    </div>
  )
}

// ── 危机资源卡:命中危机词时置顶弹出,由硬规则触发,不经过 LLM ────
function CrisisCard() {
  return (
    <div className="heal-crisis-card">
      <div className="crisis-head">你现在的安全，比任何事都重要</div>
      <p className="crisis-lead">刚才那句话让我很担心你。有些话，更该对能立刻帮到你的人说——现在就拨一个，好吗？我一直在。</p>
      <div className="crisis-lines">
        <a className="crisis-num" href="tel:12356"><b>12356</b><span>全国心理援助热线</span></a>
        <a className="crisis-num" href="tel:4001619995"><b>400-161-9995</b><span>希望24热线 · 24小时</span></a>
        <a className="crisis-num urgent" href="tel:110"><b>110</b><span>紧急求助</span></a>
      </div>
    </div>
  )
}

// 分流开场：刚玩完 vs 真受害者，语气与内容都不同
const INTRO = {
  played:
    '刚才那种"我居然骗得动"的不舒服，是真的。它不代表你坏——它代表你现在认得出这些套路了。先停一下，把那口气顺回来。',
  victim:
    '我在这里陪你。如果你愿意，可以说说发生了什么；如果暂时不想说，我们也可以只是安静地待一会儿。',
}

// 分流后展示的关怀语：真受害者给完整去羞耻，刚玩完给轻量落地
const CARE_LINES = {
  played: ['这只是一场安全的演练。你没有伤害任何人——你只是提前认识了那些招数。'],
  victim: COPY.care.lines,
}

function Chooser({ onPick }) {
  return (
    <div className="heal-chooser">
      <div className="chooser-stamp">瑾</div>
      <h2>心理疗愈</h2>
      <p className="chooser-sub">在开始之前，先让我知道——你是<br />哪一种「现在」？</p>
      <button className="chooser-btn" onClick={() => onPick('played')}>
        <b>我刚体验完</b>
        <span>心里有点不是滋味，想缓一缓</span>
      </button>
      <button className="chooser-btn victim" onClick={() => onPick('victim')}>
        <b>我最近真的遇到了</b>
        <span>我或家人，真的被骗了</span>
      </button>
      <p className="chooser-note">无论哪一种，这里都不评判你。</p>
    </div>
  )
}

export default function Heal() {
  const [mode, setMode] = useState(null) // null | 'played' | 'victim'
  const [temp, setTemp] = useState(60)
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [emotionsNamed, setEmotionsNamed] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [crisisActive, setCrisisActive] = useState(false)
  const chatBodyRef = useRef(null)

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
  }, [messages])

  const pickMode = (m) => {
    setMode(m)
    setMessages([{ from: 'ai', text: INTRO[m] }])
  }

  const toggleEmotion = (emotion) => {
    if (emotionsNamed) return
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : prev.length < 3
        ? [...prev, emotion]
        : prev
    )
  }

  const handleNameEmotions = () => {
    if (selectedEmotions.length === 0) return
    setEmotionsNamed(true)
    setTemp(30)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((prev) => [...prev, { from: 'user', text }])

    // 危机识别硬规则：命中即置顶危机卡 + 固定回应，绝不交给 LLM
    if (detectCrisis(text)) {
      setCrisisActive(true)
      setMessages((prev) => [
        ...prev,
        { from: 'ai', text: '你刚说的话，让我很担心你。你不是一个人在扛——上面的电话，现在就拨一个，好吗？我一直在这里。' },
      ])
      return
    }

    setLoading(true)
    const reply = await healReply(messages.concat({ from: 'user', text }))
    setMessages((prev) => [...prev, { from: 'ai', text: reply || '我在这里，你想说什么都可以。' }])
    setLoading(false)
  }

  if (!mode) {
    return (
      <div className="heal-page">
        <div className="heal-emergency-bar">
          <span>紧急求助：110</span>
          <span className="bar-divider">/</span>
          <span>心理援助：12356</span>
        </div>
        <Chooser onPick={pickMode} />
      </div>
    )
  }

  return (
    <div className="heal-page">
      <div className="heal-emergency-bar">
        <span>紧急求助：110</span>
        <span className="bar-divider">/</span>
        <span>心理援助：12356</span>
      </div>

      {crisisActive && <CrisisCard />}

      <div className="heal-section">
        <h2>心理疗愈</h2>
        <p className="heal-subtitle">
          {mode === 'played' ? '把那口气顺回来，再走' : '给情绪一个名字，给自己一个出口'}
        </p>
      </div>

      <CloudDivider />

      <div className="heal-care-lines">
        {CARE_LINES[mode].map((line, idx) => (
          <div key={idx} className="care-line-item">{line}</div>
        ))}
      </div>

      <div className="heal-emotion-section">
        <h3>情绪命名</h3>
        <p className="emotion-hint">现在你感受到的是...</p>
        <Thermometer value={temp} big />
        <div className="heal-emo-chips">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion}
              className={`heal-emo-chip ${selectedEmotions.includes(emotion) ? 'on' : ''}`}
              onClick={() => toggleEmotion(emotion)}
              disabled={emotionsNamed}
            >
              {emotion}
            </button>
          ))}
        </div>
        {!emotionsNamed ? (
          <button
            className="heal-btn-primary"
            onClick={handleNameEmotions}
            disabled={selectedEmotions.length === 0}
          >
            就是这种感觉
          </button>
        ) : (
          <p className="emotion-named-msg">命名它，就能驯服它。你已经迈出了第一步。</p>
        )}
      </div>

      <div className="heal-chat-section">
        <div className="heal-chat-head">
          <h3>AI 陪伴对话</h3>
          <span className="heal-ai-badge">AI 陪伴 · 非专业心理咨询</span>
        </div>
        <div className="heal-chat-body" ref={chatBodyRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`heal-chat-msg ${msg.from === 'user' ? 'user' : ''}`}>
              <div className={`heal-chat-avatar ${msg.from === 'user' ? 'user' : ''}`}>
                {msg.from === 'user' ? '我' : '瑾'}
              </div>
              <div className={`heal-chat-bubble ${msg.from === 'user' ? 'user' : ''}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="heal-chat-msg">
              <div className="heal-chat-avatar">瑾</div>
              <div className="heal-chat-bubble typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>
        <div className="heal-chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="说说你的感受..."
            className="heal-chat-input-field"
          />
          <button className="heal-chat-send" onClick={handleSend} disabled={loading || !input.trim()}>
            发送
          </button>
        </div>
        <p className="heal-ai-note">我是 AI 陪伴，不能替代专业心理咨询或就医。严重困扰时，请拨打下方热线或去看医生。</p>
      </div>

      <div className="heal-reconnect">
        <div className="reconnect-icon">🤍</div>
        <div className="reconnect-text">
          <b>别一个人扛着</b>
          现在，给一个你信得过的人发条消息——哪怕只说一句"我遇到点事"。骗子最想让你孤立，说出来就是反击的第一步。
        </div>
      </div>

      <div className="heal-hotlines">
        <h3>随身热线</h3>
        <div className="hotline-cards">
          <div className="hotline-card">
            <div className="hotline-icon">📞</div>
            <div className="hotline-number">110</div>
            <div className="hotline-label">报警 / 追损</div>
          </div>
          <div className="hotline-card">
            <div className="hotline-icon">🛡️</div>
            <div className="hotline-number">96110</div>
            <div className="hotline-label">反诈专线</div>
          </div>
          <div className="hotline-card">
            <div className="hotline-icon">💚</div>
            <div className="hotline-number">12356</div>
            <div className="hotline-label">心理援助</div>
          </div>
          <div className="hotline-card">
            <div className="hotline-icon">🌱</div>
            <div className="hotline-number">400-161-9995</div>
            <div className="hotline-label">希望24 · 24小时</div>
          </div>
        </div>
      </div>

      <div className="disclaimer">
        怀瑾提供情绪陪伴与信息参考，不构成医学 / 法律诊断
      </div>
    </div>
  )
}
