const STORAGE_KEY = "viktoriia-os:q4-2026:v2";
const LEGACY_STORAGE_KEY = "viktoriia-os:q4-2026:v1";

const STATUS = {
  now: "Now",
  later: "Later / Inspiration",
  "not-now": "Not Now",
};

const MONTHS = [
  {
    "key": "october",
    "name": "October — Foundation",
    "intro": "",
    "focus": []
  },
  {
    "key": "november",
    "name": "November — Momentum & Visibility",
    "intro": "",
    "focus": []
  },
  {
    "key": "december",
    "name": "December — Finish & Integrate",
    "intro": "",
    "focus": []
  }
];

const DEFAULT_STATE = {
  "version": 2,
  "today": {
    "main": [],
    "important": [],
    "small": []
  },
  "week": {
    "main": [],
    "important": [],
    "support": []
  },
  "monthPlan": {
    "focus": "",
    "tasks": []
  },
  "library": [],
  "expanded": {
    "today": false,
    "week": false
  },
  "upgrade": {
    "focus": "Зовнішність і присутність",
    "outcome": "",
    "stages": [
      "Hair",
      "Style",
      "Presence",
      "Photos / Visibility"
    ],
    "currentStage": "Hair",
    "nextAction": ""
  },
  "joy": "",
  "month": "october",
  "weeklyReset": {
    "wins": "",
    "hard": "",
    "skipped": "",
    "carry": "",
    "next": ""
  },
  "inboxFilter": "inspiration",
  "inbox": [],
  "workProjects": [],
  "overrides": {}
};

const Q4 = {
  "northStar": "",
  "northStarDetail": "",
  "priorities": [
    {
      "key": "appearance",
      "title": "Appearance & Presence",
      "outcome": "",
      "items": [],
      "principle": ""
    },
    {
      "key": "love",
      "title": "Love & Social Life",
      "outcome": "",
      "items": [],
      "principle": ""
    }
  ],
  "finish": [],
  "recurring": [],
  "triggered": [],
  "support": [
    {
      "title": "Energy & Health",
      "items": []
    },
    {
      "title": "Digital",
      "items": []
    },
    {
      "title": "Home",
      "items": []
    },
    {
      "title": "Money",
      "items": []
    }
  ],
  "upgradeStages": [
    {
      "title": "Hair",
      "items": []
    },
    {
      "title": "Style",
      "items": []
    },
    {
      "title": "Presence",
      "items": []
    },
    {
      "title": "Photos / Visibility",
      "items": []
    }
  ]
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function seedLibrary() {
  const tasks = [];
  const add = (id, text, projectKey, projectTitle, status = "later") => tasks.push({ id, text, projectKey, projectTitle, done: false, status });
  Q4.upgradeStages.forEach((stage, si) => stage.items.forEach((text, i) => add(`upgrade-${si}-${i}`, text, `upgrade-${si}`, stage.title)));
  Q4.priorities[1].items.forEach((text, i) => add(`love-${i}`, text, "love", "Love & Social Life"));
  Q4.finish.forEach((project, pi) => project.details.forEach((text, i) => add(`finish-${pi}-${i}`, text, `finish-${pi}`, project.name)));
  DEFAULT_STATE.workProjects.forEach((project, i) => add(`work-project-${i}`, project.detail, `work-project-${i}`, project.name));
  Q4.recurring.forEach((text, i) => add(`recurring-${i}`, text, "recurring", "Recurring / Must Do"));
  Q4.triggered.forEach((text, i) => add(`triggered-${i}`, text, "triggered", "Only if Triggered", "not-now"));
  Q4.support.forEach((system, si) => system.items.forEach((text, i) => add(`support-${si}-${i}`, text, `support-${si}`, system.title)));
  return tasks;
}

function migratePlan(plan, prefix, library) {
  const result = {};
  Object.entries(plan || {}).forEach(([group, items]) => {
    result[group] = (items || []).map((item, index) => {
      if (item.sourceId) return item;
      const source = { id: `legacy-${prefix}-${group}-${item.id || index}`, text: item.text || "", projectKey: "manual", projectTitle: "Без проєкту", done: !!item.done, status: item.status || "now" };
      library.push(source);
      return { ...item, sourceId: source.id };
    });
  });
  return result;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
    const library = seedLibrary();
    if (!saved) return { ...clone(DEFAULT_STATE), library };
    (saved.library || []).forEach(item => {
      const index = library.findIndex(seed => seed.id === item.id);
      if (index >= 0) library[index] = { ...library[index], ...item };
      else library.push(item);
    });
    const today = migratePlan({ ...clone(DEFAULT_STATE.today), ...(saved.today || {}) }, "today", library);
    const week = migratePlan({ ...clone(DEFAULT_STATE.week), ...(saved.week || {}) }, "week", library);
    return {
      ...clone(DEFAULT_STATE),
      ...saved,
      version: 2,
      today,
      week,
      monthPlan: { ...clone(DEFAULT_STATE.monthPlan), ...(saved.monthPlan || {}) },
      library,
      expanded: { ...clone(DEFAULT_STATE.expanded), ...(saved.expanded || {}) },
      weeklyReset: { ...clone(DEFAULT_STATE.weeklyReset), ...(saved.weeklyReset || {}) },
      upgrade: { ...clone(DEFAULT_STATE.upgrade), ...(saved.upgrade || {}) },
      overrides: saved.overrides || {},
    };
  } catch { return clone(DEFAULT_STATE); }
}

let state = loadState();

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* Keep the current session usable when browser storage is unavailable. */ }
}
function uid(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function esc(value = "") { return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char])); }
function plural(n, one, few, many) { const m10=n%10, m100=n%100; return n===1?one:(m10>=2&&m10<=4&&!(m100>=12&&m100<=14)?few:many); }
function showToast(message) { const t=document.querySelector("#toast"); t.textContent=message; t.classList.add("show"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),1800); }

const GROUPS = {
  today: [
    { key:"main", label:"1 · ГОЛОВНИЙ РЕЗУЛЬТАТ", short:"ГОЛОВНИЙ РЕЗУЛЬТАТ", max:1 },
    { key:"important", label:"3 · ВАЖЛИВІ РЕЗУЛЬТАТИ", max:3 },
    { key:"small", label:"5 · МЕНШІ ЗАВДАННЯ", max:5 },
  ],
  week: [
    { key:"main", label:"1 · ГОЛОВНИЙ РЕЗУЛЬТАТ", short:"ГОЛОВНИЙ РЕЗУЛЬТАТ", max:1 },
    { key:"important", label:"3 · ВАЖЛИВІ РЕЗУЛЬТАТИ", max:3 },
    { key:"support", label:"5 · МЕНШІ ЗАВДАННЯ", max:5 },
  ],
};

function taskSummary(type) {
  if (type === "today") {
    const a=state.today.important.length, b=state.today.small.length;
    return `${a} ${plural(a,"важливий результат","важливі результати","важливих результатів")} · ${b} ${plural(b,"менше завдання","менші завдання","менших завдань")}`;
  }
  const a=state.week.important.length, b=state.week.support.length;
  return `${a} ${plural(a,"важливий","важливі","важливих")} · ${b} ${plural(b,"менше завдання","менші завдання","менших завдань")}`;
}

function statusOptions(current) {
  return Object.entries(STATUS).map(([value,label])=>`<option value="${value}" ${current===value?"selected":""}>${label}</option>`).join("");
}

function libraryTask(id) { return state.library.find(item => item.id === id); }
function syncSource(sourceId, changes) {
  const source = libraryTask(sourceId);
  if (source) Object.assign(source, changes);
  [state.today, state.week].forEach(period => Object.values(period).forEach(items => items.forEach(item => {
    if (item.sourceId === sourceId) Object.assign(item, changes);
  })));
  state.monthPlan.tasks.forEach(item => { if (item.sourceId === sourceId) Object.assign(item, changes); });
}
function planItemFromSource(source) { return { id: uid("plan"), sourceId: source.id, text: source.text, done: !!source.done, status: source.status || "later" }; }
function periodItems(type,group) { return type==="month"?state.monthPlan.tasks:state[type][group]; }

function addTask(type, group, text="", status="now") {
  const config=GROUPS[type].find(g=>g.key===group);
  const items=state[type][group];
  const empty=items.find(item=>!item.text.trim());
  if(empty&&!text.trim()){
    state.expanded[type]=true;renderHome();renderPlan();
    setTimeout(()=>document.querySelector(`[data-view="${routeName()}"] [data-task-text][data-id="${empty.id}"]`)?.focus(),0);
    return;
  }
  if(items.length>=config.max)return;
  const source={id:uid("task"),text,projectKey:"manual",projectTitle:"Без проєкту",done:false,status};
  state.library.push(source);
  const item=planItemFromSource(source);
  state={...state,[type]:{...state[type],[group]:[...items,item]},expanded:{...state.expanded,[type]:true}};
  save();renderHome();renderPlan();
  setTimeout(()=>document.querySelector(`[data-view="${routeName()}"] [data-task-text][data-id="${item.id}"]`)?.focus(),0);
}
window.addTask=addTask;

function captureIdea({idea, why="", revisit="", status="later"}) {
  const item={id:uid("idea"),idea:idea.trim(),why:why.trim(),revisit:revisit.trim(),status};
  state.inbox.unshift(item);state.inboxFilter=inboxBucket(item);save();renderInbox();
  return item;
}

function taskRow(item, type, group) {
  return `<li class="task-row">
    <input class="task-check" type="checkbox" data-task-check data-type="${type}" data-group="${group}" data-id="${item.id}" ${item.done?"checked":""} aria-label="Позначити виконаним" />
    <input class="task-input ${item.done?"done":""}" data-task-text data-type="${type}" data-group="${group}" data-id="${item.id}" value="${esc(item.text)}" placeholder="Додати текст" aria-label="Текст завдання" />
    <button class="remove-button" type="button" data-task-remove data-type="${type}" data-group="${group}" data-id="${item.id}" aria-label="Видалити">×</button>
  </li>`;
}

function groupMarkup(type, group) {
  const items=state[type][group.key];
  return `<section class="task-group">
    <div class="task-group-head">
      <p class="group-label">${group.label}</p>
      <small>${items.length} / ${group.max}</small>
    </div>
    <ul class="task-list">${items.map(item=>taskRow(item,type,group.key)).join("")}</ul>
    ${items.length<group.max?`<div class="add-actions"><button class="add-button" type="button" onclick="event.stopPropagation();addTask('${type}','${group.key}')">+ додати</button><button class="add-button" type="button" data-open-picker data-type="${type}" data-group="${group.key}">Обрати з проєктів</button></div>`:""}
  </section>`;
}

function focusPanel(type, expanded, context="home") {
  const isToday=type==="today";
  const title=isToday?"СЬОГОДНІ":"ЦЬОГО ТИЖНЯ";
  const main=state[type].main[0];
  const add=`<button class="empty-prompt text-action" type="button" onclick="event.stopPropagation();addTask('${type}','main')">+ додати головний результат</button>`;
  return `<section class="home-panel ${isToday?"today-panel":"week-panel"}">
    <div class="panel-head">
      <h2 class="${isToday?"today-title":"week-title"}">${title}</h2>
      ${context==="home"?`<button class="expand-button" type="button" data-toggle-expand="${type}" aria-expanded="${expanded}">${expanded?"Згорнути ↑":"Розгорнути ↓"}</button>`:""}
    </div>
    ${context==="home"?`<div class="main-preview"><p class="group-label">ГОЛОВНИЙ РЕЗУЛЬТАТ</p><div class="main-task-line">${main?`<input class="task-check" type="checkbox" data-task-check data-type="${type}" data-group="main" data-id="${main.id}" ${main.done?"checked":""} aria-label="Позначити виконаним"/><span class="task-text ${main.done?"done":""}">${esc(main.text)}</span>`:add}</div><p class="summary-line">${taskSummary(type)}</p></div>`:""}
    ${(expanded||context==="plan")?`<div class="expanded-groups">${GROUPS[type].map(group=>groupMarkup(type,group)).join("")}</div>`:""}
  </section>`;
}

function libraryRow(item, compact=false) {
  return `<li class="library-task-row ${compact?"compact":""}">
    <input class="task-check" type="checkbox" data-library-check data-source-id="${item.id}" ${item.done?"checked":""} aria-label="Позначити виконаним" />
    <input class="task-input ${item.done?"done":""}" data-library-text data-source-id="${item.id}" value="${esc(item.text)}" aria-label="Текст завдання" />
    ${compact?"":`<button class="add-to-plan" type="button" data-open-picker-for-source="${item.id}" aria-label="Додати до плану">До плану</button>`}
  </li>`;
}

function monthPlanningMarkup(context="home") {
  const month=MONTHS.find(m=>m.key===state.month)||MONTHS[0];
  return `<section class="planning-level month-planning">
    <div class="planning-level-head"><div><p class="eyebrow">ПЛАНУВАННЯ НА МІСЯЦЬ</p><h2>${month.name}</h2></div><button class="add-button" type="button" data-open-picker data-type="month">Обрати з проєктів</button></div>
    <div class="month-plan-grid"><div><p class="meta-label">ГОЛОВНИЙ ФОКУС</p><input class="editable-line month-focus-input" data-month-focus value="${esc(state.monthPlan.focus)}" placeholder="Сформулювати фокус місяця" aria-label="Головний фокус місяця" /></div><div><p class="meta-label">ОБРАНІ ЗАВДАННЯ</p>${state.monthPlan.tasks.length?`<ul class="task-list month-task-list">${state.monthPlan.tasks.map(item=>taskRow(item,"month","tasks")).join("")}</ul>`:`<p class="empty-state compact">Ще нічого не обрано з бази завдань.</p>`}</div></div>
    ${context==="plan"?`<div class="month-tabs compact-tabs">${MONTHS.map(m=>`<button type="button" data-month="${m.key}" aria-pressed="${m.key===state.month}">${m.name}</button>`).join("")}</div>`:""}
  </section>`;
}

function quarterPlanningMarkup() {
  return `<section class="planning-level quarter-planning"><p class="eyebrow">ПЛАНУВАННЯ НА КВАРТАЛ</p><p class="quarter-star">${esc(editValue("northStar",Q4.northStar))}</p><div class="quarter-rhythm">${MONTHS.map(m=>`<div><span>${m.name.split(" — ")[0]}</span><p>${esc(m.intro)}</p></div>`).join("")}</div></section>`;
}

function renderHome() {
  document.querySelector("#home-today").innerHTML=focusPanel("today",state.expanded.today);
  document.querySelector("#home-week").innerHTML=focusPanel("week",state.expanded.week);
  document.querySelector("#home-planning").innerHTML=`<div class="home-planning-stack">${monthPlanningMarkup()}${quarterPlanningMarkup()}</div>`;
  const stages=state.upgrade.stages.map((stage,i)=>`${i?'<span class="stage-arrow">→</span>':''}<button class="stage-button" type="button" data-upgrade-stage="${esc(stage)}" aria-pressed="${state.upgrade.currentStage===stage}">${esc(stage)}</button>`).join("");
  const stageIndex=state.upgrade.stages.indexOf(state.upgrade.currentStage);
  const stageTasks=state.library.filter(item=>item.projectKey===`upgrade-${Math.max(0,stageIndex)}`);
  document.querySelector("#home-upgrade").innerHTML=`<div class="upgrade-layout"><div><p class="eyebrow">МІЙ UPGRADE</p><h2 class="upgrade-title">${esc(state.upgrade.focus)}</h2></div><div><div class="stages">${stages}</div><div class="upgrade-task-reveal"><div class="upgrade-task-head"><p class="meta-label">${esc(state.upgrade.currentStage)}</p><span>${stageTasks.filter(x=>x.done).length} / ${stageTasks.length}</span></div><ul class="task-list">${stageTasks.map(item=>libraryRow(item,true)).join("")}</ul></div><div class="next-action-wrap"><p class="meta-label">НАСТУПНИЙ КРОК</p><input id="upgrade-next" class="editable-line" value="${esc(state.upgrade.nextAction)}" aria-label="Наступний крок" /> <span aria-hidden="true">→</span></div></div></div>`;
  const showReset=[0,5,6].includes(new Date().getDay());
  document.querySelector("#home-utilities").innerHTML=`<div class="utility-block"><p class="meta-label">РАДІСТЬ</p><input id="joy-input" class="editable-line" value="${esc(state.joy)}" placeholder="Мінімум одна приємна річ цього тижня" aria-label="Радість цього тижня" /></div><div class="utility-block"><p class="meta-label">ШВИДКЕ ЗБЕРЕЖЕННЯ</p><button class="text-action text-action-strong" type="button" data-open-capture>+ Додати ідею</button></div>${showReset?`<div class="utility-block"><p class="meta-label">ТИЖНЕВИЙ RESET</p><button class="text-action text-action-strong" type="button" data-route="plan" data-scroll-reset>Почати review →</button></div>`:""}`;
}

function renderPlan() {
  document.querySelector("#plan-content").innerHTML=`
    <section class="plan-section"><div class="plan-grid">${focusPanel("today",true,"plan")}${focusPanel("week",true,"plan")}</div></section>
    <section class="plan-section">${monthPlanningMarkup("plan")}</section>
    <section id="weekly-reset" class="plan-section"><div class="section-heading"><div><p class="eyebrow">Щотижневий review</p><h2>Тижневий reset</h2></div></div><div class="reset-grid">${resetField("wins","Що вдалося?")}${resetField("hard","Що було складно?")}${resetField("skipped","Що було пропущено?")}${resetField("carry","Що переносимо?")}${resetField("next","Які 2–3 результати головні наступного тижня?")}</div></section>`;
}

function resetField(key,label){return `<div class="reset-field"><label for="reset-${key}">${label}</label><textarea id="reset-${key}" data-reset="${key}" placeholder="Написати коротко…">${esc(state.weeklyReset[key])}</textarea></div>`;}
function editValue(key,fallback){return Object.prototype.hasOwnProperty.call(state.overrides,key)?state.overrides[key]:fallback;}
function editable(key,text){return `<span contenteditable="true" data-edit-key="${esc(key)}">${esc(editValue(key,text))}</span>`;}
function editableList(items,prefix){return `<ul class="goal-list">${items.map((item,i)=>`<li>${editable(`${prefix}.${i}`,item)}</li>`).join("")}</ul>`;}

function libraryListBy(projectKeys) {
  const keys=Array.isArray(projectKeys)?projectKeys:[projectKeys];
  const items=state.library.filter(item=>keys.includes(item.projectKey));
  return `<ul class="goal-task-list">${items.map(item=>libraryRow(item)).join("")}</ul>`;
}

function workItems(items,prefix){return items.map((item,i)=>`<div class="work-item"><div class="work-item-title"><strong>${editable(`${prefix}.${i}.name`,item.name)}</strong></div><ul>${item.details.map((d,j)=>`<li>${editable(`${prefix}.${i}.detail.${j}`,d)}</li>`).join("")}</ul></div>`).join("");}

function renderGoals(){
  document.querySelector("#goals-content").innerHTML=`
    <section class="goals-section"><p class="eyebrow">NORTH STAR</p><p class="north-star">${editable("northStar",Q4.northStar)}</p><p class="section-copy">${editable("northStarDetail",Q4.northStarDetail)}</p></section>
    <section class="goals-section"><div class="section-heading"><h2>Приватні пріоритети</h2><p class="eyebrow">2 головні цілі</p></div><div class="goal-columns"><article class="goal-block"><p class="eyebrow">1</p><h3>${Q4.priorities[0].title}</h3><p class="outcome">${editable("priority.appearance.outcome",Q4.priorities[0].outcome)}</p>${libraryListBy(["upgrade-0","upgrade-1","upgrade-2","upgrade-3"])}<p class="principle">${editable("priority.appearance.principle",Q4.priorities[0].principle)}</p></article><article class="goal-block"><p class="eyebrow">2</p><h3>${Q4.priorities[1].title}</h3><p class="outcome">${editable("priority.love.outcome",Q4.priorities[1].outcome)}</p>${libraryListBy("love")}<p class="principle">${editable("priority.love.principle",Q4.priorities[1].principle)}</p></article></div></section>
    <section class="goals-section"><div class="section-heading"><div><p class="eyebrow">ПОТОЧНИЙ ОСОБИСТИЙ НАПРЯМ</p><h2>Мій Upgrade</h2></div></div><p class="north-star">${esc(state.upgrade.outcome)}</p><div class="upgrade-goals">${Q4.upgradeStages.map((s,si)=>`<article class="upgrade-stage"><h3>${s.title}</h3>${libraryListBy(`upgrade-${si}`)}</article>`).join("")}</div></section>
    <section class="goals-section"><div class="section-heading"><div><p class="eyebrow">WORK</p><h2>Робота</h2></div><p class="section-copy">Finish → simplify → automate → scale.</p></div><div class="work-blocks"><article class="work-block"><h3>Finish Commitments</h3><div>${Q4.finish.map((project,pi)=>`<div class="work-item"><strong>${project.name}</strong>${libraryListBy(`finish-${pi}`)}</div>`).join("")}</div></article><article class="work-block"><h3>Improvement Projects</h3><div><p class="section-copy">Максимум 1 великий improvement project активно розвивати одночасно.</p>${state.workProjects.map((project,pi)=>`<div class="work-item"><div class="work-item-title"><strong>${esc(project.name)}</strong><select class="status-select" data-project-status="${project.id}" aria-label="Статус ${esc(project.name)}">${statusOptions(project.status)}</select></div>${libraryListBy(`work-project-${pi}`)}</div>`).join("")}</div></article><article class="work-block"><h3>Recurring / Must Do</h3><div>${libraryListBy("recurring")}</div></article><article class="work-block"><h3>Only if Triggered</h3><div>${libraryListBy("triggered")}</div></article></div><p class="principle">Сфокусовано працювати → закінчувати вчасно → менше зусиль, більше результату.</p></section>
    <section class="goals-section"><div class="section-heading"><div><p class="eyebrow">НЕ ОКРЕМІ ЦІЛІ</p><h2>Support Systems</h2></div><p class="section-copy">База, яка підтримує дві головні приватні цілі і твою енергію.</p></div><div class="support-grid">${Q4.support.map((s,si)=>`<article class="support-item"><h3>${s.title}</h3>${libraryListBy(`support-${si}`)}</article>`).join("")}</div></section>
    <section class="goals-section"><div class="section-heading"><h2>Q4 Rhythm</h2></div><div class="rhythm">${MONTHS.map((m,mi)=>`<article class="rhythm-month"><p class="eyebrow">0${mi+1}</p><h3>${m.name}</h3><p>${editable(`rhythm.${m.key}.intro`,m.intro)}</p><ul>${m.focus.map((x,i)=>`<li>${editable(`rhythm.${m.key}.${i}`,x)}</li>`).join("")}</ul></article>`).join("")}</div></section>
    <section class="goals-section"><div class="section-heading"><h2>Правила Q4</h2></div>${editableList(["2 головні приватні цілі: Appearance & Presence + Love & Social Life.","Не більше 3 головних результатів на тиждень.","Один великий work-improvement project одночасно.","Finish before adding.","Supporting routines повинні полегшувати життя, а не створювати ще один performance project.","Нова цікава ідея → Inspiration & Ideas, а не одразу Active.","Те, що не потрібно зараз → Not Now.","Якщо тиждень важкий → спрощуємо обсяг, а не кидаємо систему."],"rules")}</section>`;
}

function inboxBucket(item){if(item.status==="not-now")return "not-now"; if(item.status==="now")return "unsorted"; return "inspiration";}
function renderInbox(){
  const filters=[{key:"inspiration",label:"Inspiration & Ideas"},{key:"not-now",label:"Not Now"},{key:"unsorted",label:"Unsorted"}];
  const items=state.inbox.filter(item=>inboxBucket(item)===state.inboxFilter);
  document.querySelector("#inbox-content").innerHTML=`<section class="inbox-section"><div class="inbox-tabs">${filters.map(f=>`<button type="button" data-inbox-filter="${f.key}" aria-pressed="${state.inboxFilter===f.key}">${f.label}</button>`).join("")}</div>${items.length?`<div class="inbox-list">${items.map(item=>`<article class="inbox-item"><input class="editable-line idea" data-inbox-field="idea" data-id="${item.id}" value="${esc(item.idea)}" aria-label="Ідея"/><input class="editable-line secondary" data-inbox-field="why" data-id="${item.id}" value="${esc(item.why)}" placeholder="Чому цікаво" aria-label="Чому цікаво"/><input class="editable-line secondary" data-inbox-field="revisit" data-id="${item.id}" value="${esc(item.revisit)}" placeholder="Коли повернутися" aria-label="Коли повернутися"/><select class="status-select" data-inbox-status data-id="${item.id}" aria-label="Статус">${statusOptions(item.status)}</select><button class="remove-button" type="button" data-inbox-remove data-id="${item.id}" aria-label="Видалити">×</button></article>`).join("")}</div>`:`<p class="empty-state">Тут поки нічого немає.</p>`}</section>`;
}

let pickerTarget = null;
let pickerPinnedSource = null;
function destinationOptions() {
  return `<option value="today|main">Сьогодні · головний результат</option><option value="today|important" selected>Сьогодні · важливий результат</option><option value="today|small">Сьогодні · менше завдання</option><option value="week|main">Тиждень · головний результат</option><option value="week|important">Тиждень · важливий результат</option><option value="week|support">Тиждень · менше завдання</option><option value="month|tasks">Місяць</option>`;
}
function renderTaskPicker() {
  const query=(document.querySelector("#task-picker-search")?.value||"").trim().toLocaleLowerCase("uk");
  const assigned=pickerTarget?.type==="month"?state.monthPlan.tasks:(pickerTarget?state[pickerTarget.type][pickerTarget.group]:[]);
  const results=state.library.filter(item=>{
    if(pickerPinnedSource&&item.id!==pickerPinnedSource)return false;
    if(assigned?.some(entry=>entry.sourceId===item.id))return false;
    return !query||`${item.text} ${item.projectTitle}`.toLocaleLowerCase("uk").includes(query);
  });
  document.querySelector("#task-picker-results").innerHTML=results.length?results.map(item=>`<article class="picker-item"><div><p>${esc(item.text)}</p><span>${esc(item.projectTitle)}</span></div><div class="picker-action">${pickerTarget?"":`<select data-picker-destination data-source-id="${item.id}" aria-label="Куди додати">${destinationOptions()}</select>`}<button class="text-action text-action-strong" type="button" data-add-source="${item.id}">Додати</button></div></article>`).join(""):`<p class="empty-state">Нічого не знайдено.</p>`;
}
function openTaskPicker(target=null,sourceId=null) {
  pickerTarget=target;pickerPinnedSource=sourceId;
  const dialog=document.querySelector("#task-picker-dialog");
  document.querySelector("#task-picker-search").value="";
  renderTaskPicker();dialog.showModal();
  if(!sourceId)setTimeout(()=>document.querySelector("#task-picker-search")?.focus(),0);
}
function assignSource(sourceId,type,group) {
  const source=libraryTask(sourceId);if(!source)return;
  if(type==="month"){
    if(state.monthPlan.tasks.some(item=>item.sourceId===sourceId)){showToast("Це завдання вже є в плані місяця");return;}
    state.monthPlan.tasks.push(planItemFromSource(source));
  }else{
    const config=GROUPS[type].find(item=>item.key===group);const items=state[type][group];
    if(items.length>=config.max){showToast("У цій групі вже досягнуто максимум");return;}
    if(items.some(item=>item.sourceId===sourceId)){showToast("Це завдання вже додано");return;}
    items.push(planItemFromSource(source));state.expanded[type]=true;
  }
  save();render();renderTaskPicker();showToast("Додано до плану");
}

function render(){renderHome();renderPlan();renderGoals();renderInbox();syncRoute();}

function routeName(){const hash=location.hash.replace("#","");return ["home","plan","goals","inbox"].includes(hash)?hash:"home";}
function syncRoute(){const route=routeName();document.querySelectorAll("[data-view]").forEach(el=>el.hidden=el.dataset.view!==route);document.querySelectorAll(".nav [data-route]").forEach(el=>el.setAttribute("aria-current",el.dataset.route===route?"page":"false"));}
function go(route){location.hash=route;syncRoute();window.scrollTo({top:0,behavior:"smooth"});}

document.addEventListener("click",event=>{
  const route=event.target.closest("[data-route]");
  if(route){go(route.dataset.route);if(route.hasAttribute("data-scroll-reset"))setTimeout(()=>document.querySelector("#weekly-reset")?.scrollIntoView({behavior:"smooth"}),60);return;}
  const toggle=event.target.closest("[data-toggle-expand]");
  if(toggle){const type=toggle.dataset.toggleExpand;state.expanded[type]=!state.expanded[type];save();renderHome();return;}
  const remove=event.target.closest("[data-task-remove]");
  if(remove){const {type,group,id}=remove.dataset;if(type==="month")state.monthPlan.tasks=state.monthPlan.tasks.filter(x=>x.id!==id);else state[type][group]=state[type][group].filter(x=>x.id!==id);save();renderHome();renderPlan();return;}
  const stage=event.target.closest("[data-upgrade-stage]");
  if(stage){state.upgrade.currentStage=stage.dataset.upgradeStage;save();renderHome();return;}
  const month=event.target.closest("[data-month]");
  if(month){state.month=month.dataset.month;save();renderHome();renderPlan();return;}
  const filter=event.target.closest("[data-inbox-filter]");
  if(filter){state.inboxFilter=filter.dataset.inboxFilter;save();renderInbox();return;}
  const removeInbox=event.target.closest("[data-inbox-remove]");
  if(removeInbox){state.inbox=state.inbox.filter(x=>x.id!==removeInbox.dataset.id);save();renderInbox();return;}
  const openPicker=event.target.closest("[data-open-picker]");
  if(openPicker){openTaskPicker({type:openPicker.dataset.type,group:openPicker.dataset.group||"tasks"});return;}
  const sourcePicker=event.target.closest("[data-open-picker-for-source]");
  if(sourcePicker){openTaskPicker(null,sourcePicker.dataset.openPickerForSource);return;}
  const addSource=event.target.closest("[data-add-source]");
  if(addSource){let target=pickerTarget;if(!target){const select=document.querySelector(`[data-picker-destination][data-source-id="${addSource.dataset.addSource}"]`);const [type,group]=select.value.split("|");target={type,group};}assignSource(addSource.dataset.addSource,target.type,target.group);return;}
  if(event.target.closest("[data-close-picker]")){document.querySelector("#task-picker-dialog").close();return;}
  if(event.target.closest("[data-open-capture]")){document.querySelector("#capture-dialog").showModal();setTimeout(()=>document.querySelector("#capture-form [name=idea]")?.focus(),0);}
});

document.addEventListener("change",event=>{
  const check=event.target.closest("[data-task-check]");
  if(check){const item=periodItems(check.dataset.type,check.dataset.group).find(x=>x.id===check.dataset.id);if(item){item.done=check.checked;syncSource(item.sourceId,{done:check.checked});}save();render();return;}
  const libraryCheck=event.target.closest("[data-library-check]");
  if(libraryCheck){syncSource(libraryCheck.dataset.sourceId,{done:libraryCheck.checked});save();render();return;}
  const project=event.target.closest("[data-project-status]");
  if(project){if(project.value==="now")state.workProjects.forEach(p=>{if(p.id!==project.dataset.projectStatus&&p.status==="now")p.status="later";});const item=state.workProjects.find(p=>p.id===project.dataset.projectStatus);if(item)item.status=project.value;save();renderGoals();if(project.value==="now")showToast("Активний лише один work-improvement project");return;}
  const inboxStatus=event.target.closest("[data-inbox-status]");
  if(inboxStatus){const item=state.inbox.find(x=>x.id===inboxStatus.dataset.id);if(item)item.status=inboxStatus.value;save();renderInbox();}
});

document.addEventListener("input",event=>{
  const task=event.target.closest("[data-task-text]");
  if(task){const item=periodItems(task.dataset.type,task.dataset.group).find(x=>x.id===task.dataset.id);if(item){item.text=task.value;syncSource(item.sourceId,{text:task.value});}save();return;}
  const libraryText=event.target.closest("[data-library-text]");
  if(libraryText){syncSource(libraryText.dataset.sourceId,{text:libraryText.value});save();return;}
  if(event.target.id==="joy-input"){state.joy=event.target.value;save();return;}
  if(event.target.id==="upgrade-next"){state.upgrade.nextAction=event.target.value;save();return;}
  if(event.target.matches("[data-month-focus]")){state.monthPlan.focus=event.target.value;save();return;}
  if(event.target.id==="task-picker-search"){renderTaskPicker();return;}
  const reset=event.target.closest("[data-reset]");if(reset){state.weeklyReset[reset.dataset.reset]=reset.value;save();return;}
  const inbox=event.target.closest("[data-inbox-field]");if(inbox){const item=state.inbox.find(x=>x.id===inbox.dataset.id);if(item)item[inbox.dataset.inboxField]=inbox.value;save();}
});

document.addEventListener("keydown",event=>{
  const input=event.target.closest("[data-task-text]");
  if(!input||event.key!=="Enter"||event.isComposing||event.repeat)return;
  event.preventDefault();
  const {type,group,id}=input.dataset;
  const item=periodItems(type,group).find(task=>task.id===id);
  if(!item||!input.value.trim())return;
  item.text=input.value.trim();syncSource(item.sourceId,{text:item.text});save();
  if(type==="month"){input.blur();render();return;}
  const groups=GROUPS[type];
  const current=groups.findIndex(config=>config.key===group);
  for(let index=current;index<groups.length;index++){
    const next=groups[index];
    if(state[type][next.key].length<next.max||state[type][next.key].some(task=>!task.text.trim())){
      addTask(type,next.key);return;
    }
  }
  input.blur();render();showToast("План збережено — максимум 1–3–5");
});

document.addEventListener("focusout",event=>{
  const editable=event.target.closest("[data-edit-key]");
  if(editable){state.overrides[editable.dataset.editKey]=editable.textContent.trim();save();}
});

document.querySelector("#capture-form").addEventListener("submit",event=>{
  event.preventDefault();const form=new FormData(event.currentTarget);const idea=String(form.get("idea")||"").trim();if(!idea)return;
  captureIdea({idea,why:String(form.get("why")||""),revisit:String(form.get("revisit")||""),status:String(form.get("status")||"later")});
  event.currentTarget.reset();document.querySelector("#capture-dialog").close();showToast("Ідею збережено");
});

function registerWebMCP(){
  const context=document.modelContext;
  if(!context?.registerTool)return;
  const statuses=["now","later","not-now"];
  try{
    context.registerTool({
      name:"add_planning_item",
      title:"Додати пункт плану",
      description:"Додає завдання або результат у Today чи This Week з дотриманням лімітів 1–3–5 і weekly Top 3.",
      inputSchema:{type:"object",properties:{period:{type:"string",enum:["today","week"]},group:{type:"string",enum:["main","important","small","support"]},text:{type:"string",minLength:1},status:{type:"string",enum:statuses}},required:["period","group","text"],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute(input){
        const allowed=input.period==="today"?["main","important","small"]:["main","important","support"];
        if(!allowed.includes(input.group))throw new Error("Ця група не відповідає вибраному періоду.");
        if(!input.text?.trim())throw new Error("Текст не може бути порожнім.");
        if(input.status&&!statuses.includes(input.status))throw new Error("Недійсний статус.");
        const config=GROUPS[input.period].find(g=>g.key===input.group);
        if(state[input.period][input.group].length>=config.max)throw new Error("Досягнуто максимум для цієї групи.");
        addTask(input.period,input.group,input.text.trim(),input.status||"now");
        return {status:"saved",period:input.period,group:input.group,text:input.text.trim()};
      }
    });
    context.registerTool({
      name:"capture_inspiration",
      title:"Зберегти ідею",
      description:"Зберігає нову ідею у Вхідні; за замовчуванням — Later / Inspiration.",
      inputSchema:{type:"object",properties:{idea:{type:"string",minLength:1},why:{type:"string"},revisit:{type:"string"},status:{type:"string",enum:statuses}},required:["idea"],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute(input){
        if(!input.idea?.trim())throw new Error("Ідея не може бути порожньою.");
        if(input.status&&!statuses.includes(input.status))throw new Error("Недійсний статус.");
        const item=captureIdea({idea:input.idea,why:input.why||"",revisit:input.revisit||"",status:input.status||"later"});
        return {status:"saved",id:item.id,bucket:inboxBucket(item)};
      }
    });
  }catch(error){console.warn("WebMCP unavailable",error);}
}

window.addEventListener("hashchange",syncRoute);
render();
registerWebMCP();
