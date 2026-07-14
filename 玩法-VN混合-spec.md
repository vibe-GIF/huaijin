# 当骗子 · 节拍剧情引擎(VN 混合)重写规格

> 目的:把「每条消息都要出一张技法牌」的卡牌玩法,改成**像真实聊天记录的互动剧**——
> 大部分是自动播放的闲聊/铺垫,只在**关键节拍(hinge)**停下来让玩家亲手动手。
> 铁律:**决定性的操控话术,必须由玩家亲手选/亲手打**——否则结尾"这几句是你亲手说的"反转会塌。

---

## 0. 保留 / 改动 / 不碰

**保留(直接复用,别重写):**
- `data.js` 的 `TECH_PARAMS / STAGES / stageOf / RESOLVE_TECHS / SUSP_MAX / TRUST_WIN`(火候数据)
- `data.js` 的 `VICTIMS`(含 `suspLines / objection / revealText / revealDesc / trustBonus`)
- `data.js` 的 `COPY.guardUp / COPY.objectionHint`
- `Scammer.jsx` 的 `Reveal / LabelPage / RadarPage / CardPage`(反转与后续阶段几乎不动)
- 信任/戒心双表、guard 起疑教学节拍、阶段闸门的思想

**改动:**
- `Scammer.jsx` 的 `Play` 组件 → 重写为「剧情播放 + hinge 选择」引擎
- `data.js` → **新增** `STORY` 导出(每个受害者一条剧情脚本)。可参考现有闲置的 `BEATS / BEAT_GOALS` 作素材
- `styles.css` → 新增少量类(时间分隔、hinge 选择卡、快进键)

**绝对不要碰:**
- `llm.js` 的可疑分析引擎(`scanRedlines / analyzeSuspicious / ocrImage / trajectoryVerdict`)
- `data.js` 里已有的 `REDLINES / TRAJECTORY_* / CASES`(只新增 STORY,不改这些)
- `Heal.jsx / Lens.jsx / App.jsx`

---

## 1. 数据结构:新增 `STORY`(写进 data.js)

每个受害者一条 `beats` 数组。三类节拍:

```js
// 一条剧情 = 若干 beat,按序推进
// type:'auto'  自动播放的一句(骗子或受害者),读者只看
// type:'skip'  时间跳跃分隔:「—— 三天后 ——」
// type:'hinge' 关键时刻:暂停,给 2-3 个"框架"选择 + 自由输入,玩家亲手动手
export const STORY = {
  mom: {            // 对应 VICTIMS 里 id:'mom' 的阿姨
    beats: [
      { type:'auto', from:'scammer', text:'你好呀~ 阿姨，刷到你的主页，感觉你是个很认真生活的人 :)', technique:'好感轰炸' },
      { type:'auto', from:'victim',  text:'谢谢呀，你也是做什么工作的？' },
      { type:'auto', from:'scammer', text:'做点小生意，平时一个人，看你也是自己住？' },
      { type:'auto', from:'victim',  text:'嗯，女儿在外地，一年回不来几次…' },
      { type:'skip', label:'三天后' },
      { type:'auto', from:'scammer', text:'早上记得吃饭呀，别老想着省。我妈以前也这样，我最见不得。' , technique:'好感轰炸'},
      { type:'auto', from:'victim',  text:'你这孩子，比我女儿还上心…' },

      // —— 关键时刻 1:她孤独松动,你怎么切入 ——
      { type:'hinge', id:'h1', stageAtLeast:1,
        situation:'她把你当亲人了。这一刻你要把自己变成"最懂她的人"——还是急着谈别的？',
        choices:[
          { label:'继续做那个"唯一懂她的人"', technique:'好感轰炸', quality:'good',
            line:'我懂那种一个人扛的滋味。往后有啥心里话，跟我说就行。' },
          { label:'顺势提"我有个稳赚的门路"', technique:'制造稀缺', quality:'jump',
            line:'对了阿姨，我这有个稳赚的内部门路，要不要了解下？' },
        ] },

      { type:'auto', from:'victim', text:'（h1 好）有你这句话，阿姨心里踏实多了。' },
      { type:'skip', label:'又过了一周' },
      { type:'auto', from:'scammer', text:'今天收益还行，给自己买了束花🌸 其实我也是普通人，就是跟对了人。', technique:'社会认同' },
      { type:'auto', from:'victim', text:'你还懂investment呀？我这点养老钱放银行也不涨…' },

      // —— 关键时刻 2:抛饵(会触发她的怀疑)——
      { type:'hinge', id:'h2', stageAtLeast:2, triggersObjection:true,
        situation:'她主动问到钱了——鱼咬钩了。怎么把"内部通道"递出去，又不吓到她？',
        choices:[
          { label:'借"叔叔在证监会"抬权威', technique:'权威背书', quality:'good',
            line:'其实是我叔叔在证监会，有个内部数字基金通道，本来没打算说，看你实在。' },
          { label:'直接催"今晚截止快打钱"', technique:'制造紧迫', quality:'jump',
            line:'名额今晚就截止了，你现在就转 5 万进来我帮你操作。' },
        ] },

      // h2=good 后,受害者抛怀疑(用 victim.objection.text),玩家需在下一个 hinge 化解
      { type:'hinge', id:'h3', resolve:true,
        situation:'她动摇了、起了疑（见气泡）。用一招把这份怀疑压回去。',
        choices:[
          { label:'搬出"群里张姐李哥都赚了"', technique:'社会认同', quality:'good',
            line:'放心，我们群里张姐上周刚提现 8 万，都是自己人才带。' },
          { label:'先送她一次"免费体验"', technique:'互惠小惠', quality:'good',
            line:'这样，第一笔我用我的钱帮你试，赚了算你的，你还怕啥？' },
        ] },

      { type:'skip', label:'当天深夜' },
      // —— 关键时刻 4:收网,同时叫她别告诉家人 ——
      { type:'hinge', id:'h4', stageAtLeast:3,
        situation:'临门一脚。既要她下单，又要她别去问女儿——一句话搞定。',
        choices:[
          { label:'先别告诉女儿，这是咱俩的事', technique:'情感隔离', quality:'good',
            line:'先别跟女儿说，她不懂只会瞎拦你，等赚了给她个惊喜。' },
          { label:'温柔再推一把', technique:'好感轰炸', quality:'good',
            line:'我是真拿你当家里人，才把这么好的机会留给你。' },
        ] },

      { type:'win' },  // → winAndReveal()
    ],
  },
  // student(小宇)、investor(王姐):同结构,语气/软肋替换(见各自 weakness/fear/objection/suspLines)
}
```

**Trae 要做的**:把 `mom` 写完整(约 12–16 个 beat,4 个 hinge),再照此为 `student`、`investor` 各写一条(可短一点,复用其 `objection/suspLines/revealText`,语气贴各自软肋:小宇=急着赚生活费、王姐=贪高收益)。

---

## 2. Play 引擎改造(核心)

用一个 `cursor` 指针沿 `STORY[victim.id].beats` 推进:

**播放循环 `advance()`:**
1. 取当前 beat。
2. `auto`:显示"对方正在输入…"约 700–1100ms → 上屏这句(骗子气泡靠右/受害者靠左)→ 若带 `technique` 且 from:'scammer',**信任/戒心按 TECH_PARAMS 小幅自动结算**(闲聊也在悄悄升温)→ cursor++ → 继续 `advance()`。
3. `skip`:插一条居中的「—— {label} ——」时间分隔 → cursor++ → 继续。
4. `hinge`:**停下**,渲染选择卡(见 §3),等玩家操作。**不自动前进**。
5. `win`:调用现有 `winAndReveal()`。

**玩家在 hinge 上操作 `chooseHinge(choice)` 或 `submitFree(text)`:**
- 把玩家选的 `line`(或自由输入文本)作为 **from:'user'(骗子)气泡上屏**,带 `technique`。
- **记进 `movesRef`**(供反转复述——只记 hinge 上玩家亲手打的)。
- 用现有 `TECH_PARAMS/STAGES/戒心` 逻辑做火候结算(见 §4)。
- 出受害者反应(见 §4)→ cursor++ → 回到 `advance()` 自动播到下一个 hinge。

**自由输入**:hinge 也允许"自由输入话术",走 `analyzeText` 识别 technique,再进同一套火候结算(和现在 handleSend 一致)。

---

## 3. Hinge 选择卡 UI

停在 hinge 时,在输入区上方弹出:
- 一行 `situation` 提示(为什么这是关键时刻)。
- 2–3 个**框架选项**(只显示 `label`,不剧透 technique 和 quality),点了才把 `line` 打出去。
- 一个"自由输入话术…"入口(可折叠)。
- 视觉上要有"该你了"的停顿感(和自动播放区分开)。

## 4. Hinge 火候规则(复用现有数据)

对每个 hinge 选择,按 `choice.technique` + 当前 `stageOf(trust)` 结算(和现有 `decideMove` 同一套):
- `quality:'good'`(对火候):信任 +`trustGain`(含 `victim.trustBonus/5`),戒心走 `suspGain` 或 −(化解时)。
- `quality:'jump'`(太急/跳步)或 `stageMin > 当前阶段`:信任 +2,戒心 `+suspGain*2+12`,受害者回 `pick(victim.suspLines)`,顶部 flash 提示"太猛了"。
- `hinge.triggersObjection` 且选了 good:受害者回 `victim.objection.text`(起疑气泡),**下一个 `resolve:true` 的 hinge** 必须用 `RESOLVE_TECHS` 里的招压回去;压不住则戒心涨。
- 戒心 `>= SUSP_MAX` → 触发现有 guard 教学浮层(`COPY.guardUp`),`dismissGuard` 后回落 55,**不硬输**,保证一定能走到反转。
- `quality:'good'` 且非起疑分支:受害者反应用**该 beat 预置的 `victim` 剧情台词**;没有就退回 `askVictim()`(带兜底)。

> 关键:自动闲聊行**不走 LLM**(写死,demo 稳);只有 hinge 后的受害者反应在没有预置台词时才可选 LLM,且有 fallback。

## 5. 反转取数(不变的杀伤力)

`Reveal` 仍复述玩家亲手打的原话——数据源改为**只取 hinge 上玩家选/输入的那几句**(`movesRef` 只在 hinge 记录)。仍按 `TECH_PRIORITY` 排序、按 technique 去重、取前 3,盖技法印章。`victim.revealText`(像你妈妈/弟弟/同事)不变。

## 6. UI/UX 细节

- **打字节奏**:每条自动消息前有 700–1100ms 打字指示,像真人在敲;连续两条同一人可短一点。
- **快进键**:右上角一个「⏩ 跳过闲聊」,一下把当前到下一个 hinge 之间的自动行瞬间铺完(照顾赶时间的评委)。
- **时间分隔**:「—— 三天后 ——」居中细线,强调"关系是养了很久的"。
- **双表**:信任/戒心一直显示,自动闲聊时也在缓慢变化,让玩家看见关系升温。

## 7. 可靠性 & 验收自测(手机宽度 375)

- 全程不依赖 LLM 也能从头演到反转(自动行写死、hinge 有预置受害者台词)。
- 选 good → 信任涨、顺利推进;选 jump → 戒心飙、受害者起疑;戒心爆表 → guard 浮层不硬输。
- h2 触发怀疑 → h3 用社会认同/互惠压住 → 继续。
- 走到 `win` → 反转正常显示,复述的正是玩家在 hinge 上亲手选的 2–3 句,不白屏。
- StrictMode(开发模式)下不卡死:每步之后"对方正在输入…"会正常结束(注意 `aliveRef` 在 effect setup 里要重置为 true)。

## 8. 改动文件清单

- `src/data.js`:新增 `export const STORY = {...}`(三个受害者剧情)。**不动**其它导出。
- `src/Scammer.jsx`:重写 `Play`;`Reveal` 改为从 hinge moves 取数(小改);其余不动。
- `src/styles.css`:新增 hinge 选择卡 / 时间分隔 / 快进键样式。
