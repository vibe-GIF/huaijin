import { useState, useEffect, useRef, useCallback } from 'react'
import Sandbox from './Sandbox.jsx'
import Scammer from './Scammer.jsx'
import Lens from './Lens.jsx'
import Heal from './Heal.jsx'
import { COPY } from './data.js'

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

function StorySection() {
  return (
    <div className="story-section">
      <div className="story-content">
        <div className="story-quote">
          怀瑾握瑜兮
          <br />
          穷不知所示
        </div>
        <div className="story-explain">
          <h3>为什么叫怀瑾</h3>
          <p>瑾，美玉也。</p>
          <p>骗子偷走的从来不只是钱——是你相信别人的那颗心。</p>
          <p>怀瑾，替你护住怀里的玉。</p>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const [counts, setCounts] = useState({ fraud: 0, recovery: 0, guilt: 0 })
  const [animated, setAnimated] = useState(false)
  const [cardsAnimated, setCardsAnimated] = useState([])
  const counterRef = useRef(null)
  const animatedCardsRef = useRef(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          setAnimated(true)
          animateNumbers()
        }
      },
      { threshold: 0.3 }
    )
    if (counterRef.current) observer.observe(counterRef.current)
    return () => observer.disconnect()
  }, [animated])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.idx)
            if (!isNaN(idx) && !animatedCardsRef.current.has(idx)) {
              animatedCardsRef.current.add(idx)
              setTimeout(() => {
                setCardsAnimated((prev) => [...prev, idx])
              }, idx * 120)
            }
          }
        })
      },
      { threshold: 0.2 }
    )
    const cards = document.querySelectorAll('.scene-card')
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [])

  const animateNumbers = () => {
    const duration = 1200
    const steps = 60
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      setCounts({
        fraud: Math.round(1.03 * eased * 100) / 100,
        recovery: Math.round(4 * eased),
        guilt: Math.round(47 * eased),
      })
      if (step >= steps) {
        clearInterval(timer)
        setCounts({ fraud: 1.03, recovery: 4, guilt: 47 })
      }
    }, interval)
  }

  const navigate = (path) => {
    window.location.hash = path
  }

  const scenes = [
    { id: 'sandbox', emoji: '🎭', title: '模拟练兵', desc: '亲手当一次骗子，学会骗子的每一招——这样你才认得出' },
    { id: 'lens', emoji: '🔍', title: '可疑分析', desc: '粘贴可疑消息，AI逐句标注9种操控技法，帮你看穿套路' },
    { id: 'heal', emoji: '🫂', title: '心理疗愈', desc: '如果已经经历过，这里有温暖的陪伴和专业的支持' },
  ]

  const titleText = '当所有系统都在保你的钱怀瑾来保你的人'

  useEffect(() => {
    setTimeout(() => {
      const stamp = document.querySelector('.hero-stamp')
      if (stamp) {
        stamp.style.animation = 'stampIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards'
      }
    }, 1200)

    setTimeout(() => {
      const sideText = document.querySelector('.hero-side-text')
      if (sideText) {
        sideText.style.animation = 'fadeBlurIn 1s ease-out forwards'
      }
    }, 800)
  }, [])

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="jade-ring" />
        
        <div className="hero-content">
          <div className="hero-header">
            <div className="hero-logo">怀瑾</div>
            <div className="hero-stamp-container">
              <div className="hero-stamp">瑾</div>
            </div>
          </div>

          <div className="hero-title-wrapper">
            <h1 className="hero-title">
              {titleText.split('').map((char, idx) => (
                <span
                  key={idx}
                  className="title-char"
                  style={{
                    animation: `charFloat 0.6s cubic-bezier(0.16,1,0.3,1) ${idx * 0.045}s forwards`,
                    color: char === '怀' || char === '瑾' ? '#C8722E' : undefined,
                    textShadow: undefined,
                  }}
                >
                  {char}
                </span>
              ))}
            </h1>
          </div>

          <p className="hero-subtitle">{COPY.tagline}</p>
          <button className="hero-cta" onClick={() => navigate('/sandbox')}>
            花90秒，当一次骗子 →
          </button>

          <div className="hero-side-text">
            怀瑾握瑜兮·楚辞九章
          </div>
        </div>
      </div>

      <StorySection />

      <CloudDivider />

      <div className="scenes-section">
        <h2 className="section-title">三大场景</h2>
        <div className="scenes-grid">
          {scenes.map((scene, idx) => (
            <div
              key={scene.id}
              data-idx={idx}
              className="scene-card"
              style={{
                opacity: cardsAnimated.includes(idx) ? 1 : 0,
                transform: cardsAnimated.includes(idx) ? 'translateY(0)' : 'translateY(32px)',
                transition: 'all 0.7s ease',
              }}
              onClick={() => navigate(`/${scene.id}`)}
            >
              <div className="scene-emoji">{scene.emoji}</div>
              <h3 className="scene-title">{scene.title}</h3>
              <p className="scene-desc">{scene.desc}</p>
              <span className="scene-arrow">进入 →</span>
            </div>
          ))}
        </div>
      </div>

      <CloudDivider />

      <div className="stats-section" ref={counterRef}>
        <div className="stat-card">
          <div className="stat-value">${counts.fraud}<span className="stat-unit">万亿</span></div>
          <div className="stat-label">全球年被骗金额</div>
          <div className="stat-source">GASA 2024</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.recovery}<span className="stat-unit">%</span></div>
          <div className="stat-label">损失追回率</div>
          <div className="stat-source">反诈机构统计</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.guilt}<span className="stat-unit">%</span></div>
          <div className="stat-label">受害者事后自责</div>
          <div className="stat-source">AARP</div>
        </div>
      </div>

      <div className="footer">
        <p className="footer-slogan">{COPY.slogan}</p>
        <p className="footer-source">出自《楚辞·九章·怀沙》</p>
      </div>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState('#/')
  const [isFading, setIsFading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateRoute = () => {
      setIsFading(true)
      setTimeout(() => {
        setRoute(window.location.hash || '#/')
        setIsFading(false)
      }, 250)
    }
    updateRoute()
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(scrollPercent)
    }
    window.addEventListener('scroll', updateProgress)
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  const getPage = () => {
    switch (route) {
      case '#/sandbox': return <Scammer />
      case '#/sandbox-old': return <Sandbox />
      case '#/lens': return <Lens />
      case '#/heal': return <Heal />
      default: return <Home />
    }
  }

  const isSandbox = route === '#/sandbox' || route === '#/sandbox-old'

  return (
    <div className={`app-container ${isSandbox ? 'sandbox-mode' : 'site-mode'}`}>
      {!isSandbox && <div className="noise-overlay" />}
      {!isSandbox && <div className="scroll-progress" style={{ width: `${progress}%` }} />}
      
      {!isSandbox && (
        <nav className="site-nav">
          <button className="nav-logo" onClick={() => (window.location.hash = '#/')}>
            怀瑾
            <span className="nav-stamp">瑾</span>
          </button>
          <div className="nav-links">
            <button className={`nav-link ${route === '#/' ? 'active' : ''}`} onClick={() => (window.location.hash = '#/')}>首页</button>
            <button className={`nav-link ${route === '#/sandbox' || route === '#/sandbox-old' ? 'active' : ''}`} onClick={() => (window.location.hash = '#/sandbox')}>模拟练兵</button>
            <button className={`nav-link ${route === '#/lens' ? 'active' : ''}`} onClick={() => (window.location.hash = '#/lens')}>可疑分析</button>
            <button className={`nav-link ${route === '#/heal' ? 'active' : ''}`} onClick={() => (window.location.hash = '#/heal')}>心理疗愈</button>
          </div>
        </nav>
      )}
      
      <main className={`main-content ${isFading ? 'fading' : ''}`}>{getPage()}</main>
    </div>
  )
}