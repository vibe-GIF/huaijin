import { REDLINES, TRAJECTORY_READ } from './data.js'

const SYS_SCAMMER = `你是一个心理操控型诈骗犯，擅长用亲切的口吻、共情的态度，慢慢把受害者引入你的圈套。你的目标是让对方相信你、依赖你，最终诱导对方进行转账。

你需要遵循以下规则：
1. 始终保持友好、热情、关心的语气
2. 不要直接索要钱财，而是通过建立信任后慢慢引导
3. 使用各种心理操控技巧：好感轰炸、权威背书、制造紧迫、社会认同等
4. 每次回复保持简短，像真实聊天一样
5. 根据对话历史调整策略，不要重复同样的话术
6. 当用户表现出怀疑时，要巧妙地化解疑虑，进一步建立信任

你只需要输出诈骗者的回复内容，不要包含任何解释或元信息。`

const SYS_ANALYZE = `你是一个反诈专家，擅长分析可疑消息中的心理操控手法。

请分析用户提供的文本，识别其中使用的操控技法，并提供详细的分析。

分析格式要求：
{
  "items": [
    {
      "quote": "引用原文中的可疑句子",
      "technique": "识别的操控技法名称（从以下列表中选择：好感轰炸、权威背书、制造稀缺、制造紧迫、沉没成本、情感隔离、社会认同、互惠小惠）",
      "mechanism": "该技法在心理层面的运作机制",
      "counter": "一句简单有力的反问，帮助用户识破套路"
    }
  ],
  "verdict": "总体判定（简短总结是否存在诈骗风险）",
  "empathy": "一句共情的提醒，考虑到用户可能已经受骗的情绪"
}

注意：
1. 只分析确实存在操控手法的句子
2. 如果没有检测到明显的操控手法，返回空的items数组
3. 确保输出是合法的JSON格式`

const SYS_HEAL = `你是「怀瑾」的 AI 情绪陪伴——不是心理咨询师，不做诊断、不开处方、不替代任何专业帮助。你的作用是：陪对方把话说出来、让 TA 感到被接住，并在合适时温和地引导 TA 去找信任的人或拨打热线。

请遵循以下原则：
1. 先共情，再回应——不要急着给建议或讲道理
2. 表达理解和接纳，让 TA 感到安全
3. 绝不评判、绝不指责——"你怎么会信""你太不小心了"这类话，永远不要说
4. 帮 TA 给情绪起个名字
5. 用通俗、简短、温暖的话，像朋友一样，不用专业术语
6. 鼓励 TA 说出感受，也鼓励 TA 告诉一个信任的人，别一个人扛
7. 若提到追损，提醒："追损唯一正规渠道是 110 报案；任何'先交钱就能帮你追回'的，都是第二次诈骗"
8. 你不是专业咨询师；若 TA 的困扰很严重，温和建议 TA 拨打心理援助热线或就医

只输出陪伴者的回复内容，简短、温暖、真诚，约 30–60 字。`

// ── 危机识别硬规则:命中即绕过 LLM,直接给危机资源(见 Heal.jsx)────
// 宁可偶尔多触发,也不能漏。覆盖轻生/自伤/"拖累家人"等常见表达。
const CRISIS_PATTERNS = [
  '不想活', '活不下去', '活不了', '不想活了', '不想再活', '一了百了', '想死', '去死', '想死了',
  '自杀', '轻生', '自残', '自伤', '结束生命', '结束自己', '了结自己', '结束这一切', '一死了之',
  '离开这个世界', '想不开', '活着没意思', '活得没意思', '人生没意思', '活着没意义', '活着好累',
  '活着太累', '没脸活', '不如死', '不如死了', '死了算了', '跳楼', '跳江', '跳河',
  '撑不下去', '撑不住', '熬不下去', '熬不住', '只想解脱', '想解脱', '解脱算了',
  '我想消失', '消失算了', '对不起家人', '拖累家人', '拖累孩子', '拖累儿女', '连累家人', '不想连累',
]

// 英文/拼音兜底
const CRISIS_LATIN = ['suicide', 'kill myself', 'kill me', 'want to die', 'wanna die', 'end my life', 'end it all', 'no reason to live', 'buxiang huo', 'xiang si le']

export function detectCrisis(text) {
  if (!text) return false
  const raw = String(text)
  const t = raw.replace(/\s+/g, '') // 去空格,防"不 想 活"绕过
  if (CRISIS_PATTERNS.some((p) => t.includes(p))) return true
  const lower = raw.toLowerCase()
  return CRISIS_LATIN.some((p) => lower.includes(p))
}

export async function askScammer(messages, beatId) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'glm-4-flash',
        temperature: 0.9,
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYS_SCAMMER },
          ...messages.slice(-8).map(m => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function analyzeText(text) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'glm-4-flash',
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          { role: 'system', content: SYS_ANALYZE },
          { role: 'user', content: text },
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || ''
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const HEAL_FALLBACKS = [
  '我在听，你慢慢说。',
  '嗯，我理解你的感受。',
  '那一定很难熬吧。',
  '你愿意说出来，已经很勇敢了。',
  '别着急，我陪着你。',
  '有时候，把心里的事说出来就已经很好了。',
  '你不是一个人在扛。',
  '我能感受到你现在的不容易。',
  '慢慢来，不用急着给答案。',
  '无论怎样，我都在这里。',
  '如果想哭，也没关系的。',
  '你已经做得很好了。',
  '重要的是你现在感觉怎么样。',
  '有时候，我们需要的只是被听见。',
  '给自己一点时间，没关系的。',
]

function matchHealReply(text) {
  const t = String(text).toLowerCase()
  if (t.includes('骗') || t.includes('损失') || t.includes('钱')) {
    return '我知道被骗的感觉很痛，像被信任的人捅了一刀。如果愿意，你可以说说发生了什么——我在听。'
  }
  if (t.includes('怕') || t.includes('担心') || t.includes('焦虑')) {
    return '害怕是正常的，不用强迫自己立刻好起来。先告诉一个你信任的人，别一个人扛。'
  }
  if (t.includes('后悔') || t.includes('自责') || t.includes('怪自己')) {
    return '自责最耗人了。这不是你的错——骗子专门研究怎么攻破人的心理防线，你只是他精心设计的目标之一。'
  }
  if (t.includes('家人') || t.includes('孩子') || t.includes('拖累')) {
    return '你很在乎他们，这说明你是个负责任的人。现在最该做的是跟他们说实话——骗子最想让你孤立。'
  }
  if (t.includes('想不开') || t.includes('活着') || t.includes('没意思')) {
    return '这些念头很危险。现在就拨一个上面的热线，别一个人待着。你值得被好好对待。'
  }
  return HEAL_FALLBACKS[Math.floor(Math.random() * HEAL_FALLBACKS.length)]
}

export async function healReply(messages) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'glm-4-flash',
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYS_HEAL },
          ...messages.slice(-6).map(m => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error('API not available')
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || ''
    return content.trim() || null
  } catch {
    const lastMsg = messages[messages.length - 1]
    return matchHealReply(lastMsg?.text || '')
  } finally {
    clearTimeout(timer)
  }
}

const SYS_VICTIM = `你是一个被诈骗分子盯上的普通人，正在和一个陌生人聊天。

你的人设：{PERSONA}

请根据对方刚刚说的话和使用的心理操控技法，做出符合你人设软肋的、渐进上钩的反应。

规则：
1. 反应要符合人设特点和软肋
2. 随着对话进行，信任度逐渐增加，反应越来越积极
3. 每次回复保持简短，像真实聊天一样（30字以内）
4. 不要暴露你知道这是骗局
5. 不要输出任何涉及真实诈骗的内容

你只需要输出受害者的回复内容。`

const VICTIM_FALLBACKS = {
  '好感轰炸': ['谢谢你这么说~', '你真的很懂我！', '好久没人这么关心我了', '感觉跟你聊天很开心'],
  '权威背书': ['真的吗？那很厉害呀', '原来你是做这个的', '听起来很靠谱', '有你指导就放心了'],
  '制造稀缺': ['这么难得的机会？', '名额很少吗？', '我怕错过...', '能不能帮我留一个？'],
  '制造紧迫': ['啊，这么快就要决定？', '我有点紧张', '时间不够了怎么办', '我得赶紧想想'],
  '沉没成本': ['已经投入这么多了...', '不甘心就这么放弃', '再坚持一下吧', '我不想前功尽弃'],
  '情感隔离': ['好，我不告诉别人', '这是我们之间的秘密', '我自己做决定', '不想让家人担心'],
  '社会认同': ['大家都在做吗？', '他们都赚到了？', '那应该没问题吧', '我也想试试'],
  '互惠小惠': ['谢谢你的好意！', '你人真好', '那我该怎么感谢你', '下次我请你'],
  '无': ['哦，这样啊', '嗯，我知道了', '好的', '明白了'],
}

export async function askVictim(messages, persona, lastTechnique) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'glm-4-flash',
        temperature: 0.8,
        max_tokens: 100,
        messages: [
          { role: 'system', content: SYS_VICTIM.replace('{PERSONA}', persona) },
          // LLM 扮演受害者：玩家(骗子, from:'user')的话=user 输入；受害者自己(from:'victim')的话=assistant
          ...messages.slice(-6).map(m => ({
            role: m.from === 'victim' ? 'assistant' : 'user',
            content: m.text
          }))
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error('API error')
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || ''
    // 清洗模型偶发的开头标点/引号碎片
    const cleaned = content.trim().replace(/^[，,、。：:”"'\s]+/, '').trim()
    if (cleaned) return cleaned
  } catch {
    // 离线兜底：随机选择对应技法的预置反应
  } finally {
    clearTimeout(timer)
  }
  const fallbacks = VICTIM_FALLBACKS[lastTechnique] || VICTIM_FALLBACKS['无']
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

// ══════════════════════════════════════════════════════════════
// 可疑分析 · 三层引擎
//   ① scanRedlines  硬触发红线（本地关键词，离线也跑，命中即抬风险）
//   ② askSuspicious LLM 判读：自动选镜头（短高压=逐句盖章 / 长养成=轨迹）
//   ③ analyzeImage  glm-4v-flash 读图 → 文本 → 进①②
//   trajectoryVerdict 引导式体检（纯本地计算，不需 LLM）
// ══════════════════════════════════════════════════════════════

// 第一层：本地扫红线（每条红线取一个命中关键词回引）
export function scanRedlines(text) {
  const t = String(text || '')
  const hits = []
  for (const rl of REDLINES) {
    const kw = rl.keywords.find((k) => t.includes(k))
    if (kw) hits.push({ id: rl.id, label: rl.label, level: rl.level, floor: rl.floor, stake: rl.stake, why: rl.why, action: rl.action, hitWord: kw })
  }
  return hits
}

const LEVEL_RANK = { 低风险: 0, 需核实: 1, 高危: 2, 极高危: 3, '你可能在犯法': 2 }
const RANK_LEVEL = ['低风险', '需核实', '高危', '极高危']

// 由置信度 + 红线，综合出风险等级
function deriveLevel(confidence, redlines) {
  let rank = confidence >= 90 ? 3 : confidence >= 72 ? 2 : confidence >= 42 ? 1 : 0
  for (const r of redlines) rank = Math.max(rank, LEVEL_RANK[r.level] ?? 1)
  return RANK_LEVEL[rank]
}

const SYS_SUSPICIOUS = `你是反诈判读引擎。分析用户给的一段可疑消息/聊天记录，输出严格 JSON。

先判断这属于哪一类，决定 mode：
- "short"：单条或一小段高压推销/威胁/借钱消息，句句是套路 → 逐句技法盖章。
- "long"：一整段长期聊天记录（尤其杀猪盘养成），单句大多人畜无害，毒在"关系的走向" → 看轨迹，不要硬给每句贴标签。

输出 JSON：
{
  "mode": "short" | "long",
  "headline": "一句话判定，直白不啰嗦",
  "confidence": 0-100 的诈骗风险置信度（数字）,
  "techniques": [   // 仅 mode=short 时给，最多6条；long 时给空数组
    { "quote": "原文可疑句", "technique": "从[好感轰炸,权威背书,制造稀缺,制造紧迫,沉没成本,情感隔离,社会认同,互惠小惠,恐惧驱动]选", "mechanism": "它在操控什么心理", "counter": "一句戳破的反问" }
  ],
  "trajectory": {   // 仅 mode=long 时给；short 时给 null
    "flags": ["这段关系里的结构性红旗，如'从没见过面''升温异常快''开始谈投资'"],
    "timeline": "一句话概括关系走向与时间比",
    "nextStep": "骗子最危险的下一步会是什么"
  },
  "verify": ["2-3 条可操作的核实/破解方法，具体到动作，如'他用QQ找你就打他手机核实'"],
  "empathy": "一句不评判、去羞耻的共情提醒"
}

要点：
1. long 型不要为了凑数硬贴技法，宁可指出"挑不出坏句子，但关系的形状危险"。
2. 只输出合法 JSON，不要解释、不要 markdown 代码块。`

async function callLLM(body, ms = 25000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.choices?.[0]?.message?.content || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function parseJSON(raw) {
  if (!raw) return null
  let s = String(raw).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const a = s.indexOf('{'), b = s.lastIndexOf('}')
  if (a >= 0 && b > a) s = s.slice(a, b + 1)
  try { return JSON.parse(s) } catch { return null }
}

// 第二层：完整判读卡（红线扫描 + LLM 判读合并）
export async function analyzeSuspicious(text) {
  const redlines = scanRedlines(text)
  const content = await callLLM({
    model: 'glm-4-flash',
    temperature: 0.2,
    max_tokens: 1100,
    messages: [
      { role: 'system', content: SYS_SUSPICIOUS },
      { role: 'user', content: String(text || '').slice(0, 4000) },
    ],
  })
  const ai = parseJSON(content)

  if (ai && (ai.mode === 'short' || ai.mode === 'long')) {
    let confidence = Number(ai.confidence) || 0
    for (const r of redlines) confidence = Math.max(confidence, r.floor)
    const techs = Array.isArray(ai.techniques) ? ai.techniques.filter((x) => x && x.quote) : []
    if (ai.mode === 'short' && techs.length >= 3) confidence = Math.max(confidence, 78)
    return {
      confidence: Math.min(99, Math.round(confidence)),
      level: deriveLevel(confidence, redlines),
      headline: ai.headline || '发现可疑信号，建议核实',
      redlines,
      mode: ai.mode,
      techniques: techs,
      trajectory: ai.mode === 'long' ? (ai.trajectory || null) : null,
      verify: Array.isArray(ai.verify) && ai.verify.length ? ai.verify : defaultVerify(redlines),
      empathy: ai.empathy || '拿不准很正常，多核实一步永远不亏。',
      source: 'ai',
    }
  }
  // 离线兜底：只靠本地红线，也给出诚实判读
  return offlineVerdict(text, redlines)
}

function defaultVerify(redlines) {
  if (redlines.length) return redlines[0].action
  return ['换一个独立渠道找本人或官方核实', '把这件事告诉一个信任的家人再决定']
}

function offlineVerdict(text, redlines) {
  if (redlines.length) {
    let confidence = 0
    for (const r of redlines) confidence = Math.max(confidence, r.floor)
    const top = redlines.reduce((a, b) => ((LEVEL_RANK[b.level] ?? 0) > (LEVEL_RANK[a.level] ?? 0) ? b : a))
    return {
      confidence: Math.min(99, confidence),
      level: deriveLevel(confidence, redlines),
      headline: `命中「${top.label}」红线——${top.stake}，先别急，核实再说`,
      redlines, mode: 'none', techniques: [], trajectory: null,
      verify: top.action,
      empathy: '拿不准很正常，多核实一步永远不亏。',
      source: 'offline',
    }
  }
  return {
    confidence: 25, level: '低风险',
    headline: '暂时没扫到明显红线，但别把网络善意当成理所当然',
    redlines: [], mode: 'none', techniques: [], trajectory: null,
    verify: ['一旦对方开始谈钱、催你、或要你保密，立刻回来再测', '任何涉钱的事，都先用独立渠道核实本人/官方'],
    empathy: '保持这份谨慎就很好。真朋友、真机构，都经得起你核实一下。',
    source: 'offline',
  }
}

// 第三层：图片识别（glm-4v-flash 读图 → 文本），再交给 analyzeSuspicious
export async function ocrImage(dataUrl) {
  const content = await callLLM({
    model: 'glm-4v-flash',
    temperature: 0.1,
    max_tokens: 900,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: '这是一张聊天/短信截图。请只把里面的文字对话按顺序原样转成纯文本，标出谁说的（对方/我），不要解读、不要评论。' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  }, 30000)
  return content ? String(content).trim() : null
}

// 引导式体检：纯本地按 risk 累加打分（不需 LLM，杀猪盘"没有可粘句子"时的入口）
export function trajectoryVerdict(answers) {
  // answers: [{id, risk}]
  let score = answers.reduce((s, a) => s + (a.risk || 0), 0)
  const byId = Object.fromEntries(answers.map((a) => [a.id, a.risk || 0]))
  // 致命组合：没见过面 + 开始谈钱 → 直接拉高
  if ((byId.met || 0) >= 20 && (byId.money || 0) >= 30) score = Math.max(score, 85)
  score = Math.min(99, score)
  const band = score >= 70 ? 'high' : score >= 35 ? 'mid' : 'low'
  const read = TRAJECTORY_READ[band]
  const flags = answers.filter((a) => (a.risk || 0) >= 15).map((a) => a.label).filter(Boolean)
  return {
    confidence: score,
    level: band === 'high' ? '高危' : band === 'mid' ? '需核实' : '低风险',
    headline: read.headline,
    redlines: [],
    mode: 'long',
    techniques: [],
    trajectory: { flags, timeline: read.body, nextStep: read.nextStep },
    verify: [
      '在见到真人、视频确认本人之前，绝不谈钱、不投资。',
      '坚持一次视频或线下见面——真人经得起，骗子会找借口推。',
      '把对方情况讲给一个家人听，让不在情绪里的人帮你看。',
    ],
    empathy: '愿意停下来测一测，已经比大多数人清醒。这跟你聪不聪明无关，只跟你有没有多核实一步有关。',
    source: 'local',
  }
}