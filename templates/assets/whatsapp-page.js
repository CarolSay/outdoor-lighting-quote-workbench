// WhatsApp Chat Analyzer - Adapted for existing page
// Original: https://github.com/NotAYeen/whatsapp-chat-visualizer
(function() {
'use strict';

let chats = {};
let activeChatId = null;
let allMessages = [];
let currentIndex = 0;
const chunkSize = 100;
let uniqueSenders = new Set();
let primaryUser = "";

const colors = ['#53bdeb', '#ff7a7c', '#dfb610', '#a695e7', '#f47c21', '#1fa855'];
const senderColors = {};

function getSenderColor(sender) {
  if (!senderColors[sender]) {
    senderColors[sender] = colors[Object.keys(senderColors).length % colors.length];
  }
  return senderColors[sender];
}

function esc(s) {
  return String(s||'').replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Scoped DOM helpers
const $wa = (id) => document.getElementById('wa_'+id);
const $$wa = (sel) => document.querySelector('#whatsapp ' + sel);

// Translations
const t = {
  loadChats: '加载聊天文件',
  selectUser: '选择你的身份…',
  whoAreYou: '你是谁？（用于标记你的消息）',
  chats: '聊天列表',
  emptyChats: '点击 + 按钮或拖拽 .txt 文件加载聊天记录',
  totalMessages: '总消息数:',
  totalWords: '总词数:',
  mostActiveDay: '最活跃日:',
  topEmojis: 'Top 表情:',
  goToDay: '跳转',
  searchPlaceholder: '搜索消息…',
  noResults: '无匹配结果',
  waGroup: 'WhatsApp 群组',
  mediaOmitted: '📷 媒体已省略',
  msgCount: '条',
  stats: '统计',
  wordCloud: '词云',
  words: '个词',
  close: '关闭',
  noMessages: '暂无消息',
  noWords: '词数不足',
  calendar: '日历跳转',
  calendarPrompt: '选择日期跳转',
  jumping: '跳转中…',
  dateNotFound: '该日期无消息',
  userSelect: '选择身份',
  loadSuccess: '已加载',
  messages: '条消息',
};

function init() {
  renderChatList();
  bindEvents();
}

function renderChatList() {
  const list = $wa('chatList');
  if (!list) return;
  const ids = Object.keys(chats);
  if (ids.length === 0) {
    list.innerHTML = `<div class="wa-empty-hint">${t.emptyChats}</div>`;
    return;
  }
  list.innerHTML = ids.map(id => {
    const chat = chats[id];
    const lastMsg = chat.lastMessage || '';
    const snippet = lastMsg.length > 50 ? lastMsg.substring(0,50)+'...' : lastMsg;
    return `<div class="wa-chat-item${id === activeChatId ? ' active' : ''}" data-chat-id="${id}">
      <div class="wa-chat-avatar">
        <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      </div>
      <div class="wa-chat-info">
        <div class="wa-chat-header"><span class="wa-chat-name">${esc(chat.name)}</span><span class="wa-chat-time">${esc(chat.lastTime||'')}</span></div>
        <div class="wa-chat-preview">${esc(snippet)}</div>
      </div>
    </div>`;
  }).join('');
  // bind click
  list.querySelectorAll('.wa-chat-item').forEach(el => {
    el.addEventListener('click', () => switchChat(el.dataset.chatId));
  });
}

function switchChat(id) {
  if (!chats[id]) return;
  activeChatId = id;
  const chat = chats[id];
  allMessages = chat.messages;
  uniqueSenders = chat.uniqueSenders;
  primaryUser = chat.primaryUser || '';
  currentIndex = 0;

  const container = $wa('chatContainer');
  if (container) container.innerHTML = '';

  renderChatList();

  // Update user select
  const sel = $wa('userSelect');
  if (sel) {
    sel.innerHTML = `<option value="">${t.selectUser}</option>`;
    uniqueSenders.forEach(s => {
      sel.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
    if (primaryUser) sel.value = primaryUser;
  }
  const banner = $wa('userBanner');
  if (banner) {
    banner.style.display = (primaryUser || uniqueSenders.size <= 1) ? 'none' : 'flex';
  }

  // Update title
  const title = $wa('chatTitle');
  if (title) {
    if (uniqueSenders.size === 2 && primaryUser) {
      const other = Array.from(uniqueSenders).find(u => u !== primaryUser);
      title.textContent = other || chat.name;
    } else {
      title.textContent = chat.name;
    }
  }
  // Update stats
  updateStats();
  loadNextMessages();
}

function loadNextMessages() {
  const container = $wa('chatContainer');
  if (!container) return;
  const end = Math.min(currentIndex + chunkSize, allMessages.length);
  const frag = document.createDocumentFragment();
  for (let i = currentIndex; i < end; i++) {
    const msg = allMessages[i];
    const prev = i > 0 ? allMessages[i-1] : null;
    frag.appendChild(createMessageElement(msg, prev));
  }
  container.appendChild(frag);
  currentIndex = end;
}

function createMessageElement(msg, prevMsg) {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  // Date divider
  if (msg.date !== (prevMsg ? prevMsg.date : null) && !msg.isSystem) {
    const dw = document.createElement('div');
    dw.className = 'wa-date-divider-wrapper';
    const d = document.createElement('div');
    d.className = 'wa-date-divider';
    d.textContent = msg.date;
    dw.appendChild(d);
    wrapper.appendChild(dw);
  }

  const mw = document.createElement('div');
  mw.className = 'wa-msg-wrapper';
  mw.id = 'wa_msg_'+msg.id;

  if (msg.isSystem) {
    mw.className += ' wa-system-msg-wrapper';
    const el = document.createElement('div');
    el.className = 'wa-system-msg';
    el.textContent = msg.message;
    mw.appendChild(el);
    wrapper.appendChild(mw);
    return wrapper;
  }

  const isUser = primaryUser && msg.sender === primaryUser;
  mw.className += isUser ? ' wa-user-wrapper' : ' wa-other-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'wa-msg ' + (isUser ? 'wa-user-msg' : 'wa-other-msg');
  if (prevMsg && prevMsg.sender === msg.sender && !prevMsg.isSystem && prevMsg.date === msg.date) {
    bubble.classList.add('wa-no-tail');
  }

  let html = '';
  // Sender name
  if (!isUser && !bubble.classList.contains('wa-no-tail')) {
    html += `<span class="wa-sender" style="color:${getSenderColor(msg.sender)}">${esc(msg.sender)}</span>`;
  }
  // Handle media
  let text = msg.message;
  if (text.includes('<Media omitted>') || text.includes('<Multimedia omitido>')) {
    html += `<div style="font-style:italic;color:#8696a0">${t.mediaOmitted}</div>`;
    text = text.replace('<Media omitted>','').replace('<Multimedia omitido>','').trim();
  }
  // Text content
  if (text.length > 0) {
    html += `<div class="wa-msg-content"><span class="wa-msg-text">${esc(text)}</span><span class="wa-msg-spacer"></span></div>`;
  } else {
    html += `<span class="wa-msg-spacer" style="width:50px"></span>`;
  }
  // Timestamp
  html += `<span class="wa-timestamp">${msg.time}</span>`;
  bubble.innerHTML = html;
  mw.appendChild(bubble);
  wrapper.appendChild(mw);
  return wrapper;
}

function updateStats() {
  const total = allMessages.length;
  const el = $wa('statsTotal');
  if (el) el.textContent = total ? `${t.totalMessages} ${total}` : t.noMessages;
}

function bindEvents() {
  // File upload button
  const btn = $wa('loadBtn');
  const input = $wa('fileInput');
  if (btn && input) {
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', handleFileSelect);
  }

  // Drag & drop on sidebar
  const sidebar = $wa('sidebar');
  if (sidebar) {
    sidebar.addEventListener('dragover', e => { e.preventDefault(); sidebar.classList.add('wa-drag'); });
    sidebar.addEventListener('dragleave', () => sidebar.classList.remove('wa-drag'));
    sidebar.addEventListener('drop', e => {
      e.preventDefault();
      sidebar.classList.remove('wa-drag');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.txt')) {
          input.files = e.dataTransfer.files;
          handleFileSelect({ target: input });
        }
      }
    });
  }

  // User select
  const sel = $wa('userSelect');
  if (sel) {
    sel.addEventListener('change', e => {
      primaryUser = e.target.value;
      if (activeChatId && chats[activeChatId]) {
        chats[activeChatId].primaryUser = primaryUser;
      }
      const banner = $wa('userBanner');
      if (banner) banner.style.display = primaryUser ? 'none' : 'flex';
      const container = $wa('chatContainer');
      if (container) container.innerHTML = '';
      currentIndex = 0;
      loadNextMessages();
      // Update title
      const title = $wa('chatTitle');
      if (title && uniqueSenders.size === 2 && primaryUser) {
        const other = Array.from(uniqueSenders).find(u => u !== primaryUser);
        title.textContent = other || chats[activeChatId]?.name || t.waGroup;
      }
    });
  }

  // Search
  const searchInput = $wa('searchInput');
  const searchResults = $wa('searchResults');
  if (searchInput && searchResults) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const q = searchInput.value.toLowerCase().trim();
        searchResults.innerHTML = '';
        if (q.length < 2) return;
        const matches = allMessages.filter(m => !m.isSystem && m.message.toLowerCase().includes(q));
        matches.slice(0, 100).forEach(m => {
          const div = document.createElement('div');
          div.className = 'wa-search-result';
          const snippet = esc(m.message);
          div.innerHTML = `<span class="wa-search-date">${m.date}</span><div class="wa-search-sender" style="color:${getSenderColor(m.sender)}">${esc(m.sender)}</div><div class="wa-search-text">${snippet.length > 60 ? snippet.substring(0,60)+'...' : snippet}</div>`;
          div.addEventListener('click', () => scrollToMsg(m.id));
          searchResults.appendChild(div);
        });
        if (matches.length > 100) {
          const more = document.createElement('div');
          more.className = 'wa-search-more';
          more.textContent = `+${matches.length-100} ${t.noResults}`;
          searchResults.appendChild(more);
        }
      }, 300);
    });
  }

  // Search toggle
  const searchToggle = $wa('searchToggle');
  if (searchToggle) {
    searchToggle.addEventListener('click', () => {
      const panel = $wa('searchPanel');
      const sidebar = $wa('sidebarContent');
      const calendarPanel = $wa('calendarPanel');
      if (panel) {
        const show = panel.style.display !== 'block';
        panel.style.display = show ? 'block' : 'none';
        if (sidebar) sidebar.style.display = show ? 'none' : 'block';
        if (calendarPanel) calendarPanel.style.display = 'none';
        if (show && searchInput) searchInput.focus();
      }
    });
  }

  // Calendar toggle
  const calToggle = $wa('calToggle');
  if (calToggle) {
    calToggle.addEventListener('click', () => {
      const panel = $wa('calendarPanel');
      const sidebar = $wa('sidebarContent');
      const searchPanel = $wa('searchPanel');
      if (panel) {
        const show = panel.style.display !== 'block';
        panel.style.display = show ? 'block' : 'none';
        if (sidebar) sidebar.style.display = show ? 'none' : 'block';
        if (searchPanel) searchPanel.style.display = 'none';
      }
    });
  }

  // Calendar date
  const dateInput = $wa('dateInput');
  if (dateInput) {
    dateInput.addEventListener('change', e => {
      const target = e.target.value;
      if (!target) return;
      const msg = allMessages.find(m => m.isoDate === target);
      if (msg) {
        scrollToMsg(msg.id);
        $wa('calendarStatus').textContent = t.jumping;
      } else {
        $wa('calendarStatus').textContent = t.dateNotFound;
      }
    });
  }

  // Stats button
  const statsBtn = $wa('statsBtn');
  if (statsBtn) {
    statsBtn.addEventListener('click', showStats);
  }

  // Close stats
  const closeStats = $wa('closeStats');
  if (closeStats) {
    closeStats.addEventListener('click', () => {
      $wa('statsModal').style.display = 'none';
    });
  }

  // Scroll to load more
  const container = $wa('chatContainer');
  if (container) {
    container.addEventListener('scroll', () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 200) {
        if (currentIndex < allMessages.length) loadNextMessages();
      }
    });
  }
}

function scrollToMsg(id) {
  const el = document.getElementById('wa_msg_'+id);
  if (!el) {
    const idx = allMessages.findIndex(m => m.id === id);
    if (idx !== -1) {
      while (currentIndex <= idx && currentIndex < allMessages.length) loadNextMessages();
    }
  }
  const target = document.getElementById('wa_msg_'+id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const bubble = target.querySelector('.wa-msg');
    if (bubble) {
      bubble.classList.add('wa-highlight');
      setTimeout(() => bubble.classList.remove('wa-highlight'), 2000);
    }
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(ev) {
      const fileMessages = [];
      const fileSenders = new Set();
      const lineRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(.*?)\s*-\s*(.*?):\s*(.*)/;
      const systemRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(.*?)\s*-\s*(.*)/;
      const lines = ev.target.result.split('\n');
      let current = null;
      let idCounter = 0;

      function isoDate(d, m, y) {
        const year = y.length === 2 ? '20'+y : y;
        return year+'-'+m.padStart(2,'0')+'-'+d.padStart(2,'0');
      }

      lines.forEach(line => {
        line = line.trimRight();
        if (!line) return;
        const match = line.match(lineRegex);
        if (match) {
          if (current) fileMessages.push(current);
          const [_, d, m, y, time, sender, message] = match;
          current = { id: idCounter++, date: d+'/'+m+'/'+y, isoDate: isoDate(d,m,y), time, sender, message, isSystem: false };
          fileSenders.add(sender);
        } else {
          const sys = line.match(systemRegex);
          if (sys && line.indexOf(':') === -1) {
            if (current) { fileMessages.push(current); current = null; }
            const [_, d, m, y, time, message] = sys;
            fileMessages.push({ id: idCounter++, date: d+'/'+m+'/'+y, isoDate: isoDate(d,m,y), time, sender: 'System', message, isSystem: true });
          } else if (current) {
            current.message += '\n' + line;
          }
        }
      });
      if (current) fileMessages.push(current);

      let chatName = file.name.replace('.txt', '');
      chatName = chatName.replace(/Chat de WhatsApp con /, '').replace(/WhatsApp Chat with /, '');
      let lastMsg = t.noMessages;
      let lastTime = '';
      if (fileMessages.length > 0) {
        const lastValid = [...fileMessages].reverse().find(m => !m.isSystem) || fileMessages[fileMessages.length-1];
        lastMsg = lastValid.message.replace(/<[^>]*>?/gm, '');
        if (lastMsg.includes('Media omitted')) lastMsg = '📷 '+t.mediaOmitted;
        lastTime = lastValid.time || lastValid.date;
      }
      const chatId = 'chat_'+Date.now()+'_'+Math.floor(Math.random()*1000);
      chats[chatId] = { id: chatId, name: chatName, messages: fileMessages, uniqueSenders: fileSenders, primaryUser: '', lastMessage: lastMsg, lastTime: lastTime };
      renderChatList();
      if (!activeChatId) switchChat(chatId);
      else { activeChatId = null; switchChat(chatId); }
      // Reset file input
      const input = $wa('fileInput');
      if (input) input.value = '';
    };
    reader.readAsText(file);
  });
}

// Stats
function showStats() {
  const total = allMessages.length;
  if (total === 0) return;
  const counts = {};
  let totalWords = 0;
  const dateCounts = {};
  const emojiCounts = {};
  const wordCounts = {};
  const stopWords = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us','de','que','no','a','la','el','y','en','lo','un','por','qué','me','te','se','los','con','para','una','mi','ya','es','si','pero','las','como','más','o','su','al','del','eso','así','está','este','hay','todo','nada','muy','bien','también','tiene','hasta','multimedia','omitido','foto','audio','archivo','adjunto','tu','yo','sus']);
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

  allMessages.forEach(m => {
    if (m.isSystem) return;
    counts[m.sender] = (counts[m.sender] || 0) + 1;
    const words = m.message.toLowerCase().replace(/[.,!?;:()\[\]"']/g,'').split(/\s+/);
    totalWords += words.length;
    words.forEach(w => { if (w.length > 2 && !stopWords.has(w) && isNaN(w)) wordCounts[w] = (wordCounts[w] || 0) + 1; });
    if (!dateCounts[m.date]) dateCounts[m.date] = { count: 0, iso: m.isoDate };
    dateCounts[m.date].count += 1;
    const emojis = m.message.match(emojiRegex);
    if (emojis) emojis.forEach(e => emojiCounts[e] = (emojiCounts[e] || 0) + 1);
  });

  const wordFreq = Object.keys(wordCounts).map(w => ({word: w, count: wordCounts[w]})).sort((a,b) => b.count - a.count);
  let mostActive = '', mostIso = '', maxCount = 0;
  for (const d in dateCounts) { if (dateCounts[d].count > maxCount) { maxCount = dateCounts[d].count; mostActive = d; mostIso = dateCounts[d].iso; } }
  const topEmojis = Object.keys(emojiCounts).sort((a,b) => emojiCounts[b] - emojiCounts[a]).slice(0,5).map(e => e+'('+emojiCounts[e]+')').join('  ');

  let html = `<div class="wa-stats-grid">
    <div class="wa-stat-card"><small>${t.totalMessages}</small><b>${total}</b></div>
    <div class="wa-stat-card"><small>${t.totalWords}</small><b>${totalWords}</b></div>
    <div class="wa-stat-card"><small>${t.mostActiveDay}</small><b>${mostActive}</b><br><span class="wa-hint">${maxCount} ${t.msgCount}</span></div>
    <div class="wa-stat-card"><small>${t.topEmojis}</small><b>${topEmojis || '—'}</b></div>
  </div>`;
  html += '<hr style="border-color:#2a3942;margin:16px 0">';
  const sorted = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
  sorted.forEach(s => { html += `<p style="margin:4px 0"><strong style="color:${getSenderColor(s)}">${esc(s)}:</strong> ${counts[s]} ${t.msgCount}</p>`; });

  // Word cloud
  html += '<hr style="border-color:#2a3942;margin:16px 0"><h4 style="color:#00a884;margin:0 0 10px">☁️ '+t.wordCloud+'</h4>';
  html += '<div style="margin-bottom:10px"><label style="color:#8696a0;font-size:12px">'+t.words+': </label><input type="range" id="wa_wordCount" min="10" max="100" value="50" style="width:200px;vertical-align:middle"> <span id="wa_wordCountVal" style="color:#e9edef;font-size:12px">50</span></div>';
  html += '<div id="wa_wordCloud" class="wa-wordcloud"></div>';

  $wa('statsContent').innerHTML = html;
  $wa('statsModal').style.display = 'flex';

  // Word cloud render
  function renderWordCloud(count) {
    const container = $wa('wordCloud');
    if (!container) return;
    container.innerHTML = '';
    const top = wordFreq.slice(0, count);
    if (top.length === 0) { container.innerHTML = `<p style="color:#8696a0">${t.noWords}</p>`; return; }
    const maxC = top[0].count, minC = top[top.length-1].count;
    top.sort(() => Math.random() - 0.5);
    top.forEach(item => {
      const span = document.createElement('span');
      span.textContent = item.word;
      let size = 12;
      if (maxC !== minC) size = 12 + ((item.count - minC) / (maxC - minC)) * 26;
      span.style.fontSize = size + 'px';
      span.style.color = `hsl(${Math.random()*360},60%,65%)`;
      span.title = item.count + ' ' + t.msgCount;
      container.appendChild(span);
    });
  }
  const slider = document.getElementById('wa_wordCount');
  const valSpan = document.getElementById('wa_wordCountVal');
  if (slider && valSpan) {
    slider.addEventListener('input', () => { valSpan.textContent = slider.value; renderWordCloud(Number(slider.value)); });
  }
  renderWordCloud(50);
}

// Expose for page lifecycle
window.WhatsAppAnalyzer = { init, chats, switchChat, renderChatList };

})();