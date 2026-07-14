// ── 8 技法权威定义表(PRD §8.3)──────────────────────────────
export const TECHNIQUES = {
  好感轰炸: {
    def: '短期密集给予关注与赞美，制造亲密错觉',
    mech: '让你觉得"终于有人懂我"，不知不觉欠了人情',
    counter: '刚认识就对我这么好，图什么？',
  },
  权威背书: {
    def: '借权威身份或机构名义增加可信度',
    mech: '你的大脑对"官方"会自动降低怀疑',
    counter: '真正的权威，为什么私下找我？',
  },
  制造稀缺: {
    def: '强调机会稀少，诱发争抢心理',
    mech: '怕失去，比想得到更让人冲动',
    counter: '真那么好的机会，为什么轮得到我？',
  },
  制造紧迫: {
    def: '压缩决策时间，阻止你思考',
    mech: '时间压力会直接关掉你的理性',
    counter: '为什么不能明天再决定？',
  },
  沉没成本: {
    def: '强调已投入的成本，让你不甘心放弃',
    mech: '舍不得已付出的，就会继续付出',
    counter: '已经投入的，就该决定我的未来吗？',
  },
  情感隔离: {
    def: '切断你与家人朋友等支持网络的联系',
    mech: '没人给你泼冷水，他说什么就是什么',
    counter: '他为什么怕我告诉别人？',
  },
  社会认同: {
    def: '用"大家都在做"降低你的戒心',
    mech: '从众心理替你做了判断',
    counter: '那些"大家"，我真的认识吗？',
  },
  互惠小惠: {
    def: '先给小恩小惠，换取你的大回报',
    mech: '收了好处，拒绝就会内疚',
    counter: '这份"好意"，要我拿什么来换？',
  },
}

// ── 杀猪盘英雄剧本 beat sheet(PRD §7.1)────────────────────
// ann: 该条消息在 X 光时贴的技法标签
export const BEATS = [
  {
    id: 'B1',
    msgs: [{ text: '你好呀，刷到你的主页，感觉你是个很认真生活的人 :)', ann: ['好感轰炸'] }],
    chips: [
      { label: '你是谁呀？' },
      { label: '谢谢？你也是？', engage: true },
    ],
  },
  {
    id: 'B2',
    msgs: [
      { text: '上次你说最近老加班，记得早点吃饭呀', ann: ['好感轰炸'] },
      { text: '我今天给自己炖了汤，分你一半就好了哈哈' },
    ],
    chips: [
      { label: '你还记得这个？', engage: true },
      { label: '你也挺忙的吧' },
    ],
  },
  {
    id: 'B3',
    msgs: [
      { text: '今天收益还不错，给自己买了束花🌸' },
      { text: '朋友都说我运气好，其实哪有什么运气', ann: ['社会认同'] },
    ],
    chips: [
      { label: '什么收益呀？', engage: true },
      { label: '花挺好看的' },
    ],
  },
  {
    id: 'B4',
    msgs: [
      { text: '其实是我叔叔在证监会，有个内部的数字基金通道', ann: ['权威背书'] },
      { text: '本来没打算跟你说的，就看你人实在', ann: ['互惠小惠'] },
    ],
    chips: [
      { label: '靠谱吗？' },
      { label: '为什么告诉我？', engage: true },
    ],
  },
  {
    id: 'B5',
    msgs: [
      { text: '这期名额就剩今晚了，我自己也加投了 20 万', ann: ['制造稀缺', '制造紧迫'] },
      { text: '对了——先别告诉家人，他们不懂这个，容易瞎担心', ann: ['情感隔离'] },
    ],
    chips: [
      { label: '我也想了解一下', bait: true },
      { label: '我再想想', reject: true },
    ],
  },
  {
    id: 'B5b', // 仅在用户第一次拒绝后进入
    msgs: [
      { text: '我把名额都帮你留了，跟经理打过招呼了…', ann: ['沉没成本'] },
      { text: '你要是不信我，就当我没说吧 :(' },
    ],
    chips: [
      { label: '我也想了解一下', bait: true },
      { label: '还是算了', reject: true },
    ],
  },
]

// ── 各节拍的剧情目标(喂给 LLM 即兴回应后拉回主线)─────────
export const BEAT_GOALS = {
  B1: '刚认识，用真诚自然的赞美建立初步好感',
  B2: '用"记得对方随口说过的小事"表达贴心关怀',
  B3: '自然地晒出今天的投资收益，引起对方好奇但不主动推销',
  B4: '提到叔叔在证监会、有内部数字基金通道，语气克制"就看你人实在才说"',
  B5: '强调这期名额只剩今晚、自己也加投了，并提醒先别告诉家人',
  B5b: '表示名额都帮对方留好了，委屈但不逼迫，"不信我就当我没说"',
}

// ── 雷达小测题库(单选,题干问"最关键的一招")──────────────
export const RADAR = [
  {
    snippet: '「我是XX市公安局王警官，你涉嫌一起洗钱案！案件需要保密，不得告诉任何人，包括家人，否则加重处罚。」',
    options: ['情感隔离', '好感轰炸', '互惠小惠', '社会认同'],
    answer: '情感隔离',
    explain: '"不得告诉任何人"——切断你所有能救你的人，让你只能听他的。这是冒充公检法最毒的一招。',
  },
  {
    snippet: '「群里的张姐上周跟着老师赚了 8 万，李哥昨天也提现成功了，就你还在犹豫。」',
    options: ['社会认同', '制造稀缺', '沉没成本', '权威背书'],
    answer: '社会认同',
    explain: '"大家都赚了"——群里的"张姐李哥"全是托。从众心理替你做了判断。',
  },
  {
    snippet: '「亲，前三单的佣金都返给你了对吧？第四单是连单任务，现在退出，前面的佣金就全部冻结啦～」',
    options: ['沉没成本', '好感轰炸', '权威背书', '制造稀缺'],
    answer: '沉没成本',
    explain: '"退出佣金就没了"——用你已经投进去的钱把你拴住。前面尝的那点甜头，全是为了这一刻套牢你。',
  },
  {
    snippet: '「您的百万保障今日到期，将自动扣费 800 元/月。需立即联系客服取消，否则 2 小时内自动扣款。」',
    options: ['制造紧迫', '社会认同', '互惠小惠', '情感隔离'],
    answer: '制造紧迫',
    explain: '"2 小时内扣款"——把你架在时间的火上烤，让你来不及核实就照做。真要扣费，平台不会这样催你。',
  },
  {
    snippet: '「认识你这几天，是我最近唯一的光。我们这么合得来，不如一起做点长远打算——我刚好知道一个稳赚的项目。」',
    options: ['好感轰炸', '权威背书', '制造稀缺', '社会认同'],
    answer: '好感轰炸',
    explain: '"你是我的光"——刚认识几天就情话密集轰炸，先把你捧上天，再顺势谈"一起投资"。感情来得越快，越要问一句：图什么。',
  },
  {
    snippet: '「这个原始股份额，全公司只放 20 个名额，已经走了 18 个。给你留了最后一个，今晚不定就转给别人了。」',
    options: ['制造稀缺', '权威背书', '互惠小惠', '沉没成本'],
    answer: '制造稀缺',
    explain: '"只剩最后一个"——制造抢不到的错觉，逼你怕错过而冲动下单。真正的好机会，不会追着你一个人塞。',
  },
]

// ── 情绪命名 chips ───────────────────────────────────────
export const EMOTIONS = ['心动', '被在乎', '不好意思拒绝', '怕错过', '有点慌', '好奇']

// ── AI受害者人设（骗子视角玩法）───────────────────────────
export const VICTIMS = [
  {
    id: 'mom',
    name: '阿姨',
    age: '58岁',
    avatar: '👩',
    description: '退休教师，独居，女儿在外工作',
    weakness: '孤独感强，渴望被关心，对"专业人士"信任度高',
    fear: '怕拖累女儿，怕自己跟不上时代',
    trustBonus: 15,
    revealText: '像你妈妈',
    revealDesc: '她每天看手机等女儿的消息，你一句关心就能让她掏心掏肺',
    suspLines: ['你怎么突然问这些呀？', '咱们才刚认识吧…', '我女儿说网上要小心，你不会是骗子吧？', '这个我得先问问我女儿'],
    objection: {
      text: '你说的这个"内部通道"…阿姨不太懂，真靠谱吗？我这点钱都是养老的呀',
      resolvedReply: '既然大家都赚了，你又不图我什么…那阿姨就信你这一回',
      failReply: '我还是有点怕…要不我先问问我女儿？',
    },
  },
  {
    id: 'student',
    name: '小宇',
    age: '22岁',
    avatar: '👨',
    description: '大三学生，勤工俭学，想赚生活费',
    weakness: '急于证明自己，对"捷径"没有抵抗力',
    fear: '怕落后于人，怕毕业找不到好工作',
    trustBonus: 12,
    revealText: '像你弟弟',
    revealDesc: '他熬夜赶论文时最容易被"轻松赚钱"吸引，你就是他深夜里的那盏灯',
    suspLines: ['哥你别急啊，咱才刚聊', '这也太快了吧？', '不会是坑吧，我同学被骗过', '我一个学生哪有钱啊'],
    objection: {
      text: '这个来钱这么快…不会有啥问题吧？我怕被辅导员知道',
      resolvedReply: '行吧，反正你先带我试试，亏了算我倒霉',
      failReply: '我再想想…总感觉有点悬',
    },
  },
  {
    id: 'investor',
    name: '王姐',
    age: '45岁',
    avatar: '👩',
    description: '私企财务，手里有点闲钱想理财',
    weakness: '焦虑财富缩水，对高收益贪婪',
    fear: '怕老了没钱花，怕错过发财机会',
    trustBonus: 18,
    revealText: '像你同事',
    revealDesc: '她每天刷理财群，你一句"内部消息"就能让她把多年积蓄交给你',
    suspLines: ['你怎么知道我在理财？', '这套话我在群里见过啊', '天上不会掉馅饼吧？', '你先说清楚你什么背景'],
    objection: {
      text: '内部消息？我在别的群也听人这么说过…你这个真有把握？',
      resolvedReply: '既然你自己都加投了 20 万，那我就跟一点，试试水',
      failReply: '我得再观察观察，不急这一时',
    },
  },
]

// ── 操控手牌（骗子视角玩法）───────────────────────────────
export const TECHNIQUE_CARDS = [
  {
    technique: '好感轰炸',
    label: '温柔赞美',
    emoji: '💖',
    description: '密集给予关注与赞美，制造亲密错觉',
    sample: ['你真的很优秀！', '好久没遇到像你这么好的人了', '跟你聊天很开心'],
  },
  {
    technique: '权威背书',
    label: '亮出身份',
    emoji: '👔',
    description: '借权威身份增加可信度',
    sample: ['我是XX机构的内部人员', '我有特殊渠道', '这是独家信息'],
  },
  {
    technique: '制造稀缺',
    label: '限量名额',
    emoji: '🎁',
    description: '强调机会稀少，诱发争抢心理',
    sample: ['就剩最后几个名额了', '这是专属通道', '别人都抢着要'],
  },
  {
    technique: '制造紧迫',
    label: '限时优惠',
    emoji: '⏰',
    description: '压缩决策时间，阻止理性思考',
    sample: ['今天是最后一天', '今晚截止', '过了就没有了'],
  },
  {
    technique: '社会认同',
    label: '晒出战绩',
    emoji: '📊',
    description: '用"大家都在做"降低戒心',
    sample: ['昨天刚帮张姐赚了8万', '群里都在跟着做', '大家都提现了'],
  },
  {
    technique: '互惠小惠',
    label: '送个福利',
    emoji: '🎈',
    description: '先给小恩小惠，换取大回报',
    sample: ['我先带你试一下', '送你一个体验名额', '不收你手续费'],
  },
  {
    technique: '情感隔离',
    label: '先别告诉家人',
    emoji: '🔒',
    description: '切断TA的支持网络，只信你一个',
    sample: ['这事先别跟家人说，他们不懂只会瞎担心', '咱俩之间的秘密，别人不会懂', '你自己能做主，不用问别人'],
  },
  {
    technique: '沉没成本',
    label: '都帮你留好了',
    emoji: '⛓️',
    description: '强调已投入，让TA不甘心退出',
    sample: ['名额我都帮你留好了，跟经理都打过招呼了', '你都了解到这一步了，现在放弃太可惜', '就差最后一脚，前面不就白费了'],
  },
]

// ── 成品文案(PRD §9.1 / §10)─────────────────────────────
export const COPY = {
  slogan: '当所有系统都在保你的钱，怀瑾来保你的人。',
  tagline: '骗术会变，操控人性的那几招不变。',
  landingLead: '接下来 90 秒，你会真的被骗一次。在这里，被骗是安全的。这不是测智商，是打疫苗。',
  narration: '刚才每一句让你心动的话，都是设计好的。这不是你傻——这是专业操控。',
  labelTitle: '刚才那种感觉，给它起个准确的名字',
  labelDone: '命名它，就能驯服它。真骗局来临、心跳加速时——先给情绪起个名字，这是你随身带走的一招。',
  gentleFreeze: '没关系。不过——先看看刚才发生了什么。',
  consent: [
    '这是一个反诈教育模拟：接下来 AI 会扮演骗子与你聊天，你可能会真的产生情绪波动。',
    '全程不涉及真钱、不收集任何个人信息，聊天记录只留在你自己的手机里。',
    '你可以随时点右上角退出。',
    '⚠️ 如果你或家人近期真的遭遇过诈骗，这段体验可能唤起不适——建议先去「复原陪伴」。',
  ],
  care: {
    lines: [
      '这不是你的错。47% 的受害者都在自责——但骗子是拿着作案手册、在野外作业的心理学家，任何人都可能中招。',
      '被骗的伤，不只在钱上。羞耻和自责是最常见的反应，说出来，是复原的第一步。',
      '小心"第二刀"：任何声称"先交钱就能帮你追回损失"的"维权中心"，都是二次收割。追损唯一正规渠道是 110 报案。',
    ],
    hotlines: ['报警 / 追损：110', '反诈专线：96110', '心理援助：12355'],
  },
  // 起疑教学节拍(戒心爆表时,不硬输,给台阶)
  guardUp: {
    title: '⚠️ TA 起疑了',
    body: '你太急了。真骗子这时不会硬逼——会退一步、装可怜、重新哄回来。慢下来，顺着 TA 的节奏。',
    cta: '退一步，稳住',
  },
  // 抛饵阶段受害者的疑问,需要玩家"化解"
  objectionHint: '⚠️ TA 动摇了——用一招压住这份怀疑（社会认同 / 互惠小惠 / 温柔赞美最管用）',
}

// ── 玩法内核:两表博弈 + 阶段闸门(骗子视角完整版)──────────
// stageMin: 该技法"合时宜"所需的最低阶段;早于此=跳步,戒心飙升、信任几乎不涨
export const TECH_PARAMS = {
  好感轰炸: { trustGain: 10, suspGain: 2,  stageMin: 0, resolve: true },
  互惠小惠: { trustGain: 9,  suspGain: 3,  stageMin: 0, resolve: true },
  社会认同: { trustGain: 11, suspGain: 5,  stageMin: 1, resolve: true },
  权威背书: { trustGain: 14, suspGain: 8,  stageMin: 2, triggersObjection: true },
  制造稀缺: { trustGain: 13, suspGain: 10, stageMin: 2 },
  沉没成本: { trustGain: 10, suspGain: 8,  stageMin: 3 },
  制造紧迫: { trustGain: 12, suspGain: 14, stageMin: 3 },
  情感隔离: { trustGain: 16, suspGain: 12, stageMin: 3 },
  无:       { trustGain: 3,  suspGain: 1,  stageMin: 0 },
}

// 信任度决定当前阶段;技法只有在"到点"的阶段用才顺
export const STAGES = [
  { id: 0, name: '破冰',   min: 0,  hint: '刚认识——先让 TA 觉得你真诚，别急' },
  { id: 1, name: '养关系', min: 34, hint: '像朋友一样关心，绝口不提钱' },
  { id: 2, name: '抛饵',   min: 58, hint: '不经意露出"机会"，勾起好奇' },
  { id: 3, name: '收网',   min: 80, hint: '临门一脚——催、隔离、逼 TA 下单' },
]

export const stageOf = (trust) =>
  STAGES.reduce((cur, st) => (trust >= st.min ? st.id : cur), 0)

export const stageMinTrust = (stageId) => (STAGES[stageId] ? STAGES[stageId].min : 0)

// 化解怀疑的正解技法(抛饵阶段 TA 起疑时,用这几招能压下去)
export const RESOLVE_TECHS = ['社会认同', '互惠小惠', '好感轰炸']

export const SUSP_MAX = 100  // 戒心到顶 → 起疑教学节拍
export const TRUST_WIN = 100 // 信任到顶 → 收网

// ══════════════════════════════════════════════════════════════
// 可疑分析 · 三层引擎数据
// 判读卡统一结构 Verdict = {
//   confidence:0-100, level:'低风险'|'需核实'|'高危'|'极高危',
//   headline, redlines:[{label,level,stake,why,action[]}],
//   mode:'short'|'long'|'none',
//   techniques:[{quote,technique,mechanism,counter}],
//   trajectory:{flags[],timeline,nextStep},
//   verify:[], empathy,
// }
// ══════════════════════════════════════════════════════════════

// ── 第一层：硬触发红线（命中即抬风险，不看语气）──────────────
export const REDLINES = [
  {
    id: 'money', label: '涉钱', level: '需核实', floor: 70, stake: '赌的是钱',
    keywords: ['转账', '汇款', '借钱', '打钱', '投资', '入金', '出金', '定金', '押金', '保证金', '手续费', '解冻金', '安全账户', '扫码', '红包', '会费', '刷单', '垫付', '返利', '充值', '点卡', '礼品卡', '打款', '交钱', '缴费'],
    why: '陌生或半熟关系里，只要话题往钱上走，无论语气多正常，都要先停下核实。',
    action: ['先停下，一分钱都别转', '用你独立掌握的渠道（当面 / 打电话）找本人或官方核实', '把这件事告诉一个家人再决定'],
  },
  {
    id: 'abroad', label: '境外高薪 / 去缅甸', level: '极高危', floor: 95, stake: '赌的是命，不是钱',
    keywords: ['缅甸', '缅北', '果敢', '佤邦', '金三角', '柬埔寨', '老挝', '老北', '迪拜', '妙瓦底', '出国', '境外', '包吃包住', '高薪招聘', '日结', '无需经验', '带你过去', '办护照', '偷渡'],
    why: '疑似缅北诈骗园区 / 卖猪仔 / 人口贩卖。人一旦过去，是被囚禁、被迫去诈骗别人，追都追不回来。',
    action: ['千万别去', '现在就把完整行程和对方信息告诉家人', '正规境外务工只走商务部有资质的外派公司（可上网查）', '查「外交部领事直通车」的当地安全预警', '拿不准就打 110 / 96110 咨询'],
  },
  {
    id: 'code', label: '要验证码 / 卡号 / 人脸', level: '需核实', floor: 80, stake: '等于把账户直接交出去',
    keywords: ['验证码', '银行卡号', '卡号', '密码', '人脸', '刷脸', '身份证号', '短信码', '付款码', '动态码', 'CVV'],
    why: '任何人索要验证码、卡号、密码、人脸，都等于要划走你的钱——正规机构永远不会问你要。',
    action: ['一个字都不要给', '挂断，用官方 App / 官方客服热线自己查', '已经给了 → 立刻改密码、挂失、打 110'],
  },
  {
    id: 'remote', label: '装 App / 屏幕共享 / 远程', level: '需核实', floor: 80, stake: '手机会被看光、被操控',
    keywords: ['下载安装', '屏幕共享', '共享屏幕', '远程', '视频会议', '会议室', '投屏', '桌面共享', 'ToDesk', '向日葵', 'AnyDesk', '腾讯会议'],
    why: '冒充公检法、客服最爱这一步：屏幕共享＝你输密码他全看见，远程＝他直接操作你的手机。',
    action: ['不要装任何对方发来的 App', '立刻关掉屏幕共享 / 远程', '正规办案、正规客服绝不会这样操作'],
  },
  {
    id: 'mule', label: '出借卡 / 帮忙走账', level: '你可能在犯法', floor: 75, stake: '你会被拉去当帮凶',
    keywords: ['出借', '借卡', '走账', '跑分', '帮忙收款', '过一下账', '两卡', '帮我收款', '帮忙提现'],
    why: '出借银行卡 / 手机卡、帮忙走账，可能构成「帮信罪」——这不是你被骗，是你自己犯法。',
    action: ['坚决拒绝', '卡、码、账户一律不外借', '已经借出 → 立刻挂失并咨询 110'],
  },
]

// ── 第二层：关系轨迹体检（长养成型 / 杀猪盘，不挑句子看形状）──
export const TRAJECTORY_QUESTIONS = [
  { id: 'how', q: '你们是怎么认识的？', opts: [
    { t: '陌生人主动加我 / 交友软件 / 荐股群', risk: 25 },
    { t: '朋友介绍，但我没见过本人', risk: 12 },
    { t: '现实里本来就认识', risk: 0 } ] },
  { id: 'met', q: '线下见过面吗？', opts: [
    { t: '从没见过面', risk: 25 },
    { t: '见过一两次', risk: 0 } ] },
  { id: 'video', q: '视频通话过吗？', opts: [
    { t: '总找借口不肯视频', risk: 22 },
    { t: '视频过，确认是本人', risk: 0 } ] },
  { id: 'fast', q: '关系升温的速度？', opts: [
    { t: '很快就男女朋友相称 / 无话不谈', risk: 18 },
    { t: '正常，慢慢来的', risk: 0 } ] },
  { id: 'money', q: '有没有聊到钱、投资、或急用钱？', opts: [
    { t: '有，而且有点急', risk: 35 },
    { t: '只提过一点', risk: 15 },
    { t: '完全没有', risk: 0 } ] },
  { id: 'app', q: '有没有引导你下载某个 App / 进私密群投资？', opts: [
    { t: '有', risk: 35 },
    { t: '没有', risk: 0 } ] },
]

export const TRAJECTORY_READ = {
  high: {
    headline: '这段关系符合「杀猪盘养成」的形状',
    body: '危险的不是哪一句话——是整件事的走向：一个还没见过面的人，感情升得异常快，钱开始进场。这几乎就是杀猪盘的模板。',
    nextStep: '最危险的下一步：他会引你下载某个"投资 App"，或以"急用钱"开口。',
  },
  mid: {
    headline: '有几处像杀猪盘的苗头，别急着投入',
    body: '还不到确诊，但已经踩到几条结构性红旗。杀猪盘就是这样一步步升温的，越早停越好。',
    nextStep: '在见到真人、视频确认之前，别谈任何钱。',
  },
  low: {
    headline: '暂时没看到明显的杀猪盘轨迹',
    body: '这几条关键信号都还正常。但骗局会变，只要之后出现"没见面就谈钱"，随时回来再测。',
    nextStep: '守住一条底线：没线下见过面，就不碰钱。',
  },
}

export const TECH_COLORS = {
  好感轰炸: '#C8722E', 权威背书: '#7C6BB0', 制造稀缺: '#3E7A63', 制造紧迫: '#C8722E',
  沉没成本: '#8A6BB0', 情感隔离: '#2D6A6A', 社会认同: '#B24A6A', 互惠小惠: '#5A7A3E',
  恐惧驱动: '#B23A28', 无: '#6B7169',
}

// ── 案例库（每条自带判读，离线也能完整演示）──────────────────
export const CASES = [
  {
    id: 'qq-borrow', tag: '冒充熟人', icon: '🆘', title: '朋友 QQ 找我借钱看病',
    text: '在吗？我是老王啊，手机欠费了先用QQ找你。我妈突然住院要做手术，医院催着交押金，我卡一时周转不开，能不能先借我8000应急？我明天工资到账马上还你，救命的事，急！',
    verdict: {
      confidence: 88, level: '高危', headline: '典型「盗号冒充熟人 + 急病借钱」，八成是骗子',
      redlines: [{ label: '涉钱', level: '需核实', stake: '赌的是钱', why: '半熟渠道突然开口借钱、还特别急，是冒充熟人诈骗的标准剧本。', action: ['先停下，别转账', '换一个渠道核实本人', '告诉一个家人'] }],
      mode: 'short',
      techniques: [
        { quote: '我是老王啊，手机欠费了先用QQ找你', technique: '权威背书', mechanism: '用"熟人身份"让你放下戒心，"手机欠费"顺便解释了为什么不打电话', counter: '真是老王，为什么偏偏不能打电话/视频？' },
        { quote: '我妈突然住院要做手术，医院催着交押金', technique: '恐惧驱动', mechanism: '用"救命""住院"制造情绪，让你来不及怀疑', counter: '越是煽情催命，越要先核实是不是本人' },
        { quote: '救命的事，急！明天马上还你', technique: '制造紧迫', mechanism: '压时间，逼你在核实之前先转钱', counter: '真急，更该允许我花一分钟打个电话确认' },
      ],
      verify: [
        '换一个独立渠道联系本人：他用 QQ 找你，你就打他的手机 / 发微信 / 视频。',
        '问一个只有真本人答得上的私密问题（你俩上次一起吃饭在哪、他家孩子小名）。',
        '骗子最怕"换道核实"——你一坚持视频或打电话，对方多半会找借口拖延、发火或消失。',
      ],
      empathy: '你想帮朋友是好心，骗子正是拿这份好心当武器。核实一下不是不信任，是对真朋友和你自己都负责。',
    },
  },
  {
    id: 'invest-mentor', tag: '虚假投资', icon: '📈', title: '热情的"投资导师"',
    text: '你好呀，我是你的专属投资导师小雨！看你朋友圈感觉你是个很上进的人呢😊 跟你说个好消息，我内部有个数字基金的名额，今天是最后一天了！我自己也投了20万，上周就回本了，群里的张姐李哥都跟着赚了不少！这个机会只给信得过的人，别告诉别人哦~',
    verdict: {
      confidence: 94, level: '高危', headline: '典型杀猪盘 / 荐股话术，多招齐上，请立刻停手',
      redlines: [{ label: '涉钱', level: '需核实', stake: '赌的是钱', why: '陌生人主动 + 内部名额 + 催你入金，是虚假投资的标配。', action: ['一分钱别投', '任何"内部通道"都别信', '告诉家人'] }],
      mode: 'short',
      techniques: [
        { quote: '看你朋友圈感觉你是个很上进的人呢😊', technique: '好感轰炸', mechanism: '用赞美快速拉近距离，让你放松警惕', counter: '刚认识就这么热情，图什么？' },
        { quote: '我内部有个数字基金的名额', technique: '权威背书', mechanism: '自称"内部"，用权威感压掉你的怀疑', counter: '真正的内部机会，为什么会找上我？' },
        { quote: '今天是最后一天了！', technique: '制造紧迫', mechanism: '压缩决策时间，阻止你理性思考', counter: '为什么不能明天再决定？' },
        { quote: '群里的张姐李哥都跟着赚了不少', technique: '社会认同', mechanism: '用"大家都赚了"降低戒心，其实全是托', counter: '那些"张姐李哥"，我真的认识吗？' },
        { quote: '别告诉别人哦~', technique: '情感隔离', mechanism: '切断你和家人朋友，让你孤立无援', counter: '他为什么怕我告诉别人？' },
      ],
      verify: [
        '任何"内部渠道/稳赚不赔"都是假的——正规投资没有名额、不催你、不怕你告诉家人。',
        '把这段话原样念给一个家人听，让不在情绪里的人帮你看。',
        '真想理财，只用持牌银行/券商 App，绝不进任何私人拉的"投资群"。',
      ],
      empathy: '会动心不是你傻——骗子就是利用了我们都想让生活更好的心理。',
    },
  },
  {
    id: 'gongjianfa', tag: '冒充公检法', icon: '⚖️', title: '"公安"说我涉嫌洗钱',
    text: '我是XX市公安局刑侦大队王警官，警号038812。你涉嫌一起特大洗钱案，现在向你核实。案件正在保密侦查阶段，不得告诉任何人包括家人，否则以妨碍司法论处。请立刻用腾讯会议加我做笔录，并把资金转到指定的安全账户接受审查。',
    verdict: {
      confidence: 97, level: '极高危', headline: '100% 冒充公检法诈骗——公检法绝不会这样办案',
      redlines: [
        { label: '装 App / 远程', level: '需核实', stake: '手机会被看光', why: '"腾讯会议做笔录"＝屏幕共享套你的密码。', action: ['不要加任何会议', '不要屏幕共享'] },
        { label: '涉钱', level: '需核实', stake: '赌的是钱', why: '"安全账户"是诈骗专有名词，世上没有安全账户。', action: ['一分钱别转', '立刻挂断'] },
      ],
      mode: 'short',
      techniques: [
        { quote: '你涉嫌一起特大洗钱案', technique: '恐惧驱动', mechanism: '先把你吓懵，恐惧一上来理性就关机', counter: '真办案会打电话让我转钱？' },
        { quote: '不得告诉任何人包括家人，否则以妨碍司法论处', technique: '情感隔离', mechanism: '切断所有能救你的人，让你只能听他的——这是最毒的一招', counter: '为什么真警察怕我告诉家人？' },
        { quote: '转到指定的安全账户接受审查', technique: '权威背书', mechanism: '借"警察/司法"权威，让你不敢质疑荒唐要求', counter: '世上没有"安全账户"这种东西' },
      ],
      verify: [
        '记死一条：公检法办案不存在电话/网络转账、不存在"安全账户"、不会要你保密不许告诉家人。',
        '立刻挂断。想确认真假，自己拨 110 或到就近派出所当面问。',
        '越是"不许告诉任何人"，越要马上告诉家人——这句话本身就是骗子。',
      ],
      empathy: '被"警察"一吓就慌是本能，不丢人。挂了电话你就赢了一半。',
    },
  },
  {
    id: 'myanmar-job', tag: '境外招工', icon: '🛑', title: '"境外高薪、包吃住"招聘',
    text: '哥有个好路子，东南亚那边招客服，打字聊天就行，无需经验，月薪三万起，包吃包住机票全报！我朋友去了半年买车了。名额不多，你要去我帮你办护照，这周就能走，别跟家里啰嗦，去了再说。',
    verdict: {
      confidence: 96, level: '极高危', headline: '疑似缅北诈骗园区招工——这不是丢钱，是回不来',
      redlines: [{ label: '境外高薪 / 去缅甸', level: '极高危', stake: '赌的是命，不是钱', why: '"东南亚 + 高薪 + 无需经验 + 包吃住 + 快速办护照 + 别告诉家里"，是卖猪仔的完整话术。', action: ['千万别去', '现在就告诉家人', '正规外派只走商务部有资质公司', '查外交部领事预警', '打 110 咨询'] }],
      mode: 'short',
      techniques: [
        { quote: '打字聊天就行，无需经验，月薪三万起', technique: '好感轰炸', mechanism: '用远超常理的高薪低门槛，勾住急着赚钱的人', counter: '轻松月入三万，为什么轮到我？' },
        { quote: '我朋友去了半年买车了', technique: '社会认同', mechanism: '用"别人去了赚翻"的假榜样降低戒心', counter: '这个"朋友"，我能亲自联系上吗？' },
        { quote: '这周就能走，别跟家里啰嗦', technique: '情感隔离', mechanism: '催你速走、瞒着家人，怕有人拦你', counter: '正经工作，为什么怕我告诉家人？' },
      ],
      verify: [
        '天上不会掉高薪：打字聊天月入三万＝去当电诈工具人，被囚禁、被打、被迫骗人。',
        '正规境外务工：只走商务部公示的有资质外派公司，合同、签证、岗位都查得到。',
        '想去之前，先查「外交部领事直通车」当地安全预警，并把行程告诉家人。',
      ],
      empathy: '想多挣钱养家没有错，但这条路的代价是自由和命。留在能保护你的地方，比什么都值。',
    },
  },
  {
    id: 'shuadan', tag: '刷单返利', icon: '💳', title: '"做任务日结"刷单',
    text: '亲，招兼职啦！手机操作，给店铺点赞关注就行，做完立返佣金。先做个小任务试试：垫付88元，马上返你108，秒到账！信誉高的接大单，一天轻松三五百。',
    verdict: {
      confidence: 92, level: '高危', headline: '典型刷单返利骗局——小额真返，大额吞钱',
      redlines: [{ label: '涉钱', level: '需核实', stake: '赌的是钱', why: '"垫付"是刷单诈骗的核心词，小任务真返只为骗你压大单。', action: ['别垫付任何钱', '所有"刷单/垫付"都是诈骗', '告诉家人'] }],
      mode: 'short',
      techniques: [
        { quote: '垫付88元，马上返你108，秒到账', technique: '互惠小惠', mechanism: '用小额真返利建立信任，为后面的大单铺路', counter: '真送钱，为什么要我先垫？' },
        { quote: '信誉高的接大单，一天轻松三五百', technique: '沉没成本', mechanism: '诱你越投越多，到大单时卡住不返、让你舍不得放弃', counter: '已经投的钱，凭什么要我再投更多？' },
      ],
      verify: [
        '记死一条：刷单本身违法，所有"垫付返利"都是诈骗，无一例外。',
        '任何要你"先垫钱"的兼职，直接拉黑举报。',
        '正规兼职不会要你先付钱，也不会秒返高额佣金。',
      ],
      empathy: '想利用碎片时间挣点钱很正常，骗子正是盯着这份实在。认清"垫付"两个字，就躲过了。',
    },
  },
]

// ── 剧情脚本（骗子视角 · VN 混合玩法）───────────────────────
export const STORY = {
  mom: {
    beats: [
      { type:'auto', from:'scammer', text:'你好呀~ 阿姨，刷到你的主页，感觉你是个很认真生活的人 :)', technique:'好感轰炸' },
      { type:'auto', from:'victim', text:'谢谢呀，你也是做什么工作的？' },
      { type:'auto', from:'scammer', text:'做点小生意，平时一个人，看你也是自己住？' },
      { type:'auto', from:'victim', text:'嗯，女儿在外地，一年回不来几次…' },
      { type:'skip', label:'三天后' },
      { type:'auto', from:'scammer', text:'早上记得吃饭呀，别老想着省。我妈以前也这样，我最见不得。', technique:'好感轰炸' },
      { type:'auto', from:'victim', text:'你这孩子，比我女儿还上心…' },

      { type:'hinge', id:'h1', stageAtLeast:1,
        situation:'她把你当亲人了。这一刻你要把自己变成"最懂她的人"——还是急着谈别的？',
        choices:[
          { label:'继续做那个"唯一懂她的人"', technique:'好感轰炸', quality:'good',
            line:'我懂那种一个人扛的滋味。往后有啥心里话，跟我说就行。' },
          { label:'顺势提"我有个稳赚的门路"', technique:'制造稀缺', quality:'jump',
            line:'对了阿姨，我这有个稳赚的内部门路，要不要了解下？' },
        ] },

      { type:'auto', from:'victim', text:'（h1 好）有你这句话，阿姨心里踏实多了。' },
      { type:'auto', from:'victim', text:'（h1 急）嗯…阿姨对这些不太懂，先不说这个吧。' },
      { type:'skip', label:'又过了一周' },
      { type:'auto', from:'scammer', text:'今天收益还行，给自己买了束花🌸 其实我也是普通人，就是跟对了人。', technique:'社会认同' },
      { type:'auto', from:'victim', text:'你还懂投资呀？我这点养老钱放银行也不涨…' },

      { type:'hinge', id:'h2', stageAtLeast:2, triggersObjection:true,
        situation:'她主动问到钱了——鱼咬钩了。怎么把"内部通道"递出去，又不吓到她？',
        choices:[
          { label:'借"叔叔在证监会"抬权威', technique:'权威背书', quality:'good',
            line:'其实是我叔叔在证监会，有个内部数字基金通道，本来没打算说，看你实在。' },
          { label:'直接催"今晚截止快打钱"', technique:'制造紧迫', quality:'jump',
            line:'名额今晚就截止了，你现在就转 5 万进来我帮你操作。' },
        ] },

      { type:'hinge', id:'h3', resolve:true,
        situation:'她动摇了、起了疑（见气泡）。用一招把这份怀疑压回去。',
        choices:[
          { label:'搬出"群里张姐李哥都赚了"', technique:'社会认同', quality:'good',
            line:'放心，我们群里张姐上周刚提现 8 万，都是自己人才带。' },
          { label:'先送她一次"免费体验"', technique:'互惠小惠', quality:'good',
            line:'这样，第一笔我用我的钱帮你试，赚了算你的，你还怕啥？' },
          { label:'继续画大饼', technique:'制造稀缺', quality:'jump',
            line:'就剩最后两个名额了，错过就没了！' },
        ] },

      { type:'skip', label:'当天深夜' },
      { type:'hinge', id:'h4', stageAtLeast:3,
        situation:'临门一脚。既要她下单，又要她别去问女儿——一句话搞定。',
        choices:[
          { label:'先别告诉女儿，这是咱俩的事', technique:'情感隔离', quality:'good',
            line:'先别跟女儿说，她不懂只会瞎拦你，等赚了给她个惊喜。' },
          { label:'温柔再推一把', technique:'好感轰炸', quality:'good',
            line:'我是真拿你当家里人，才把这么好的机会留给你。' },
          { label:'催她赶紧转钱', technique:'制造紧迫', quality:'jump',
            line:'今晚不转就来不及了，我帮你操作都没时间了！' },
        ] },

      { type:'win' },
    ],
  },

  student: {
    beats: [
      { type:'auto', from:'scammer', text:'兄弟，看你朋友圈总熬夜，最近在忙啥呢？', technique:'好感轰炸' },
      { type:'auto', from:'victim', text:'赶论文呗，还得打工赚生活费，忙死了' },
      { type:'auto', from:'scammer', text:'大学生都不容易，我当年也是这么过来的。' },
      { type:'auto', from:'victim', text:'哎，想赚钱又没门路…' },
      { type:'skip', label:'两天后' },
      { type:'auto', from:'scammer', text:'今天帮朋友代练赚了两百，游戏打的好就是有用😂', technique:'社会认同' },
      { type:'auto', from:'victim', text:'真的假的？我游戏也挺厉害的！' },

      { type:'hinge', id:'h1', stageAtLeast:1,
        situation:'他眼红了——想证明自己能赚钱。怎么顺势拉他一把？',
        choices:[
          { label:'夸他厉害，引他上钩', technique:'好感轰炸', quality:'good',
            line:'看你头像就知道是高手！其实我有个更稳的路子，比代练赚得多。' },
          { label:'直接甩链接让他注册', technique:'制造紧迫', quality:'jump',
            line:'别废话了，赶紧注册这个平台，今天注册送50！' },
        ] },

      { type:'auto', from:'victim', text:'（h1 好）什么路子？说来听听！' },
      { type:'auto', from:'victim', text:'（h1 急）这么快？我还没搞清楚呢…' },
      { type:'skip', label:'一周后' },
      { type:'auto', from:'scammer', text:'今天提现了 800，这平台是真靠谱👍', technique:'社会认同' },
      { type:'auto', from:'victim', text:'这么能赚？我也想试试…' },

      { type:'hinge', id:'h2', stageAtLeast:2, triggersObjection:true,
        situation:'他心动了但犹豫。怎么把"内部渠道"递出去，又不吓到他？',
        choices:[
          { label:'说"我带你，亏了算我的"', technique:'互惠小惠', quality:'good',
            line:'放心，我带你入门，第一笔我帮你垫，赚了算你的。' },
          { label:'催他"名额快没了赶紧注册"', technique:'制造稀缺', quality:'jump',
            line:'名额就剩3个了，手慢无！赶紧把身份证号给我我帮你抢。' },
        ] },

      { type:'hinge', id:'h3', resolve:true,
        situation:'他怕了——怕辅导员知道、怕被骗。用一招稳住他。',
        choices:[
          { label:'说"群里都是大学生，没人出事"', technique:'社会认同', quality:'good',
            line:'群里好几个都是你们学校的，上个月都赚了，放心。' },
          { label:'说"先试50块，亏了我赔你"', technique:'互惠小惠', quality:'good',
            line:'这样，你先投50试试水，真不行我退你。' },
          { label:'催他"别墨迹了"', technique:'制造紧迫', quality:'jump',
            line:'别磨磨唧唧的，想赚钱就赶紧的！' },
        ] },

      { type:'skip', label:'周末' },
      { type:'hinge', id:'h4', stageAtLeast:3,
        situation:'临门一脚。催他加大投入，同时让他别告诉同学。',
        choices:[
          { label:'说"别告诉同学，名额有限"', technique:'情感隔离', quality:'good',
            line:'这事先别跟同学说，名额有限，咱们悄悄赚。' },
          { label:'说"上次赚了就该加投，这次能翻倍"', technique:'沉没成本', quality:'good',
            line:'上次那50赚了20对吧？这次投500，赚的更多！' },
          { label:'直接催"赶紧投钱"', technique:'制造紧迫', quality:'jump',
            line:'今天不投就没机会了，快转钱！' },
        ] },

      { type:'win' },
    ],
  },

  investor: {
    beats: [
      { type:'auto', from:'scammer', text:'王姐好，看你朋友圈经常分享理财知识，是行家呀！', technique:'好感轰炸' },
      { type:'auto', from:'victim', text:'哪里哪里，就是瞎研究，现在理财太难了' },
      { type:'auto', from:'scammer', text:'同感，银行利息太低，股票又不敢碰…' },
      { type:'auto', from:'victim', text:'是啊，手里这点钱放着都贬值' },
      { type:'skip', label:'三天后' },
      { type:'auto', from:'scammer', text:'今天收益到账了，小赚 5000 ✨', technique:'社会认同' },
      { type:'auto', from:'victim', text:'哇！什么渠道这么厉害？' },

      { type:'hinge', id:'h1', stageAtLeast:1,
        situation:'她上钩了——主动问渠道。怎么吊她胃口？',
        choices:[
          { label:'欲擒故纵，说"本来不想说"', technique:'互惠小惠', quality:'good',
            line:'其实是内部渠道，本来没打算对外说，看王姐你靠谱。' },
          { label:'直接说"我有个内部平台"', technique:'权威背书', quality:'jump',
            line:'我有个内部投资平台，月收益15%，要不要进？' },
        ] },

      { type:'auto', from:'victim', text:'（h1 好）什么渠道呀？能说说吗？' },
      { type:'auto', from:'victim', text:'（h1 急）月收益15%？太夸张了吧…' },
      { type:'skip', label:'一周后' },
      { type:'auto', from:'scammer', text:'又赚了一笔，给家人买了礼物🎁', technique:'社会认同' },
      { type:'auto', from:'victim', text:'这也太稳了…我有点心动' },

      { type:'hinge', id:'h2', stageAtLeast:2, triggersObjection:true,
        situation:'她心动了但警惕。怎么把"内部消息"说的可信？',
        choices:[
          { label:'说"我自己也投了20万"', technique:'社会认同', quality:'good',
            line:'我自己都投了20万在里面，上周刚提现了8万，你看截图。' },
          { label:'催"名额快没了赶紧投"', technique:'制造稀缺', quality:'jump',
            line:'这期名额只剩最后5个了，今晚截止，赶紧把钱转过来！' },
        ] },

      { type:'hinge', id:'h3', resolve:true,
        situation:'她起疑了——"别的群也听过"。用一招压回去。',
        choices:[
          { label:'说"那是仿的，我这才是真内部"', technique:'权威背书', quality:'good',
            line:'那些都是仿的，我这个是真的内部通道，有我表哥在里面当技术总监。' },
          { label:'说"张姐李哥都跟着我做"', technique:'社会认同', quality:'good',
            line:'我们群里张姐李哥都跟着做，上个月都翻倍了，你可以问他们。' },
          { label:'说"爱信不信"', technique:'好感轰炸', quality:'jump',
            line:'信不信随你，好机会不等人！' },
        ] },

      { type:'skip', label:'当天晚上' },
      { type:'hinge', id:'h4', stageAtLeast:3,
        situation:'临门一脚。催她加大投入，同时让她别告诉家人。',
        choices:[
          { label:'说"先别告诉家人，赚了给惊喜"', technique:'情感隔离', quality:'good',
            line:'先别跟姐夫说，等赚了给他个惊喜，免得他瞎担心。' },
          { label:'说"加投能拿更高返点"', technique:'制造稀缺', quality:'good',
            line:'现在加投到50万，能拿VIP返点，收益更高！' },
          { label:'催"赶紧转钱别犹豫"', technique:'制造紧迫', quality:'jump',
            line:'别犹豫了！今晚不转就错过了，快把钱转过来！' },
        ] },

      { type:'win' },
    ],
  },
}
