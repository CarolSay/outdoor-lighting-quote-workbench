let chats = {};
let activeChatId = null;

let allMessages = [];
let currentIndex = 0;
const chunkSize = 100;

const chatContainer = document.getElementById("chat-container");
const userSelect = document.getElementById("userSelect");
const userSelectBanner = document.getElementById("userSelectBanner");
const chatTitle = document.getElementById("chatTitle");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const btnSearchToggle = document.getElementById("btn-search-toggle");
const btnStats = document.getElementById("btn-stats");
const btnCalendarToggle = document.getElementById("btn-calendar-toggle");
const btnLang = document.getElementById("btn-lang");
const sidebarControls = document.getElementById("sidebar-controls");
const sidebarSearch = document.getElementById("sidebar-search");
const sidebarCalendar = document.getElementById("sidebar-calendar");
const dateInput = document.getElementById("dateInput");
const chatListContainer = document.getElementById("chat-list");

let uniqueSenders = new Set();
let primaryUser = "";

// Internationalization (i18n)
const translations = {
  en: {
    chats: "Chats",
    settings: "Settings",
    loadChats: "Load Chats",
    goToDate: "Go to date",
    viewStats: "View Statistics",
    search: "Search",
    emptyChatList: "Click the + button above or drag .txt files here to load chats.",
    calendarPrompt: "Select a date to jump to those messages.",
    searchPlaceholder: "Search messages...",
    userBannerText: "Who are you in this chat? (To align your messages to the right)",
    userSelectDefault: "Select your user...",
    typeMessage: "Type a message",
    statsTitle: "Chat Statistics",
    statsPrompt: "Load a chat file first.",
    wordCloudTitle: "Word Cloud",
    wordsToShow: "Words to show:",
    closeBtn: "Accept",
    totalMessages: "Total messages:",
    totalWords: "Total words:",
    mostActiveDay: "Busiest day:",
    goToThisDay: "Go to this day",
    topEmojis: "Top emojis used:",
    msgs: "msgs",
    noMessages: "No messages",
    noResults: "No messages found for this date.",
    searchNoMatch: "No messages found.",
    searchTooMany: "More than 100 results found. Please refine your search.",
    selectUserPrompt: "Select your user above...",
    whatsappGroup: "WhatsApp Group",
    mediaOmitted: "📷 Media omitted",
    photo: "Photo",
    video: "Video",
    document: "Document",
    attachment: "Attachment",
    jumpingToDate: "Messages found. Scrolling...",
    noWords: "Not enough words."
  },
  es: {
    chats: "Chats",
    settings: "Ajustes",
    loadChats: "Cargar Chats",
    goToDate: "Ir a fecha",
    viewStats: "Ver Estadísticas",
    search: "Buscar",
    emptyChatList: "Haz clic en el botón + de arriba o arrastra archivos .txt aquí para cargar chats.",
    calendarPrompt: "Selecciona una fecha para ir a esos mensajes.",
    searchPlaceholder: "Busca mensajes...",
    userBannerText: "¿Quién eres tú en este chat? (Para alinear tus mensajes a la derecha)",
    userSelectDefault: "Selecciona tu usuario...",
    typeMessage: "Escribe un mensaje",
    statsTitle: "Estadísticas del Chat",
    statsPrompt: "Carga un archivo de chat primero.",
    wordCloudTitle: "Nube de Palabras",
    wordsToShow: "Palabras a mostrar:",
    closeBtn: "Aceptar",
    totalMessages: "Total de mensajes:",
    totalWords: "Total de palabras:",
    mostActiveDay: "Día más activo:",
    goToThisDay: "Ir a este día",
    topEmojis: "Emojis más usados:",
    msgs: "msjs",
    noMessages: "Sin mensajes",
    noResults: "No hay registros de mensajes en esta fecha.",
    searchNoMatch: "No se encontraron mensajes.",
    searchTooMany: "Más de 100 resultados. Sé más específico en tu búsqueda.",
    selectUserPrompt: "Selecciona tu usuario arriba...",
    whatsappGroup: "Grupo de WhatsApp",
    mediaOmitted: "📷 Multimedia omitido",
    photo: "Foto",
    video: "Video",
    document: "Documento",
    attachment: "Archivo adjunto",
    jumpingToDate: "Mensajes encontrados. Desplazando...",
    noWords: "No hay suficientes palabras."
  }
};

let currentLang = localStorage.getItem("app_lang") || "en";

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations["en"][key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("app_lang", lang);
  const langLabel = document.getElementById("langLabel");
  if (langLabel) langLabel.innerText = lang.toUpperCase();
  document.documentElement.lang = lang;
  
  document.querySelectorAll("[data-i18n]").forEach(el => {
     let key = el.getAttribute("data-i18n");
     if (translations[lang][key]) el.innerText = translations[lang][key];
  });
  
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
     let key = el.getAttribute("data-i18n-placeholder");
     if (translations[lang][key]) el.placeholder = translations[lang][key];
  });
  
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
     let key = el.getAttribute("data-i18n-title");
     if (translations[lang][key]) el.title = translations[lang][key];
  });
  
  renderChatList();
  if (activeChatId) switchChat(activeChatId);
}

if (btnLang) {
  btnLang.addEventListener("click", () => {
    setLanguage(currentLang === "en" ? "es" : "en");
  });
}

const colors = ['#53bdeb', '#ff7a7c', '#dfb610', '#a695e7', '#f47c21', '#1fa855'];
const senderColors = {};

function getSenderColor(sender) {
  if (!senderColors[sender]) {
    senderColors[sender] = colors[Object.keys(senderColors).length % colors.length];
  }
  return senderColors[sender];
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}

function processMessageText(text) {
  let processed = escapeHTML(text);
  
  processed = processed.replace(/&lt;\/3/g, '💔');
  
  processed = processed.replace(/(<br>)+$/g, '');
  
  return processed;
}

function createDateDivider(date) {
  let wrapper = document.createElement("div");
  wrapper.classList.add("date-divider-wrapper");
  let divider = document.createElement("div");
  divider.classList.add("date-divider");
  divider.innerText = date;
  wrapper.appendChild(divider);
  return wrapper;
}

function createMessageElement(msg, prevMsg) {
  let mainWrapper = document.createElement("div");
  mainWrapper.style.width = "100%";
  mainWrapper.style.display = "flex";
  mainWrapper.style.flexDirection = "column";

  let prevDate = prevMsg ? prevMsg.date : null;
  if (msg.date !== prevDate && !msg.isSystem) {
    mainWrapper.appendChild(createDateDivider(msg.date));
  }

  let wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper");
  wrapper.id = "msg-" + msg.id;
  
  if (msg.isSystem) {
    wrapper.classList.add("system-msg-wrapper");
    let msgElement = document.createElement("div");
    msgElement.classList.add("system-msg");
    msgElement.innerHTML = processMessageText(msg.message);
    wrapper.appendChild(msgElement);
    mainWrapper.appendChild(wrapper);
    return mainWrapper;
  }

  let msgElement = document.createElement("div");
  let isUser = primaryUser !== "" && msg.sender === primaryUser;
  wrapper.classList.add(isUser ? "user-msg-wrapper" : "other-msg-wrapper");
  msgElement.classList.add("message", isUser ? "user-msg" : "other-msg");

  let hideTail = false;
  if (prevMsg && prevMsg.sender === msg.sender && !prevMsg.isSystem && prevMsg.date === msg.date) {
    hideTail = true;
  }
  if (hideTail) {
    msgElement.classList.add("no-tail");
  }

  let html = "";
  
  if (!isUser && !hideTail) {
    html += `<span class="sender-name" style="color: ${getSenderColor(msg.sender)}">${escapeHTML(msg.sender)}</span>`;
  }
  
  let textContent = msg.message;
  let mediaHtml = "";
  
  if (textContent.includes("(archivo adjunto)") || textContent.includes("(file attached)") || textContent.includes("<Multimedia omitido>") || textContent.includes("<Media omitted>")) {
    if (textContent.includes("<Multimedia omitido>") || textContent.includes("<Media omitted>")) {
       mediaHtml = `<div style="font-style: italic; color: #8696a0;">${t('mediaOmitted')}</div>`;
       textContent = textContent.replace("<Multimedia omitido>", "").replace("<Media omitted>", "").trim();
    } else {
       let attachmentText = textContent.includes("(archivo adjunto)") ? "(archivo adjunto)" : "(file attached)";
       let fileName = textContent.replace(attachmentText, "").trim();
       let fileExt = fileName.split('.').pop().toLowerCase();
       
       if (["jpg", "png", "jpeg", "gif", "webp"].includes(fileExt)) {
         mediaHtml = `<img src="${fileName}" class="msg-image" alt="Image" onerror="this.style.display='none'">`;
         textContent = t('photo');
       } else if (["mp4", "webm", "ogg"].includes(fileExt)) {
         mediaHtml = `<video src="${fileName}" class="msg-video" controls></video>`;
         textContent = t('video');
       } else {
         mediaHtml = `<a href="${fileName}" target="_blank" style="display:block; margin: 5px 0; color: #53bdeb; text-decoration: none;">📄 ${t('document')}</a>`;
         textContent = t('attachment');
       }
    }
  }

  html += mediaHtml;
  
  textContent = processMessageText(textContent);
  
  if (textContent.length > 0) {
    html += `<div class="message-content">`;
    html += `<span class="message-text">${textContent}</span>`;
    html += `<span class="message-spacer"></span>`;
    html += `</div>`;
  } else {
    html += `<span class="message-spacer" style="width: 50px;"></span>`;
  }
  
  let tickHtml = isUser ? `<svg viewBox="0 0 16 15" width="16" height="15" style="margin-left:2px; margin-bottom:-3px" fill="#53bdeb"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>` : "";

  html += `<span class="timestamp">${msg.time} ${tickHtml}</span>`;
  
  msgElement.innerHTML = html;
  wrapper.appendChild(msgElement);
  mainWrapper.appendChild(wrapper);
  
  return mainWrapper;
}

function loadNextMessages() {
  let endIndex = Math.min(currentIndex + chunkSize, allMessages.length);
  const fragment = document.createDocumentFragment();
  
  for (let i = currentIndex; i < endIndex; i++) {
    const msg = allMessages[i];
    const prevMsg = i > 0 ? allMessages[i-1] : null;
    const msgElement = createMessageElement(msg, prevMsg);
    fragment.appendChild(msgElement);
  }
  
  chatContainer.appendChild(fragment);
  currentIndex = endIndex;
}

let isScrolling = false;
chatContainer.addEventListener("scroll", function() {
  if (!isScrolling) {
    window.requestAnimationFrame(() => {
      if (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 200) {
        if (currentIndex < allMessages.length) {
          loadNextMessages();
        }
      }
      isScrolling = false;
    });
    isScrolling = true;
  }
});

userSelect.addEventListener("change", function(e) {
  primaryUser = e.target.value;
  if (activeChatId && chats[activeChatId]) {
    chats[activeChatId].primaryUser = primaryUser;
  }
  
  if (primaryUser) {
    userSelectBanner.style.display = "none";
  }
  
  chatContainer.innerHTML = "";
  currentIndex = 0;
  loadNextMessages();
  
  if (uniqueSenders.size === 2) {
     let otherUser = Array.from(uniqueSenders).find(u => u !== primaryUser);
     chatTitle.innerText = otherUser || chats[activeChatId]?.name || "Chat";
  } else {
     chatTitle.innerText = chats[activeChatId]?.name || t('whatsappGroup');
  }
});

function renderChatList() {
  chatListContainer.innerHTML = "";
  let chatIds = Object.keys(chats);
  
  if (chatIds.length === 0) {
    chatListContainer.innerHTML = `<div style="padding: 30px 20px; text-align: center; color: #aebac1; font-size: 14px;">${t('emptyChatList')}</div>`;
    return;
  }
  
  chatIds.forEach(id => {
    let chat = chats[id];
    let div = document.createElement("div");
    div.classList.add("chat-list-item");
    if (id === activeChatId) div.classList.add("active");
    
    let lastMsgSnippet = chat.lastMessage;
    if (lastMsgSnippet.length > 40) lastMsgSnippet = lastMsgSnippet.substring(0, 40) + "...";
    
    let tickHtml = `<svg viewBox="0 0 16 15" width="16" height="15" style="margin-right:2px; vertical-align: middle;" fill="#53bdeb"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>`;
    
    div.innerHTML = `
      <div class="chat-list-avatar">
        <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
      </div>
      <div class="chat-list-info">
        <div class="chat-list-header">
          <div class="chat-list-name">${escapeHTML(chat.name)}</div>
          <div class="chat-list-time">${chat.lastTime}</div>
        </div>
        <div class="chat-list-message">
          ${tickHtml} <span>${escapeHTML(lastMsgSnippet)}</span>
        </div>
      </div>
    `;
    div.onclick = () => switchChat(id);
    chatListContainer.appendChild(div);
  });
}

function switchChat(id) {
  if (!chats[id]) return;
  activeChatId = id;
  
  let chat = chats[id];
  allMessages = chat.messages;
  uniqueSenders = chat.uniqueSenders;
  primaryUser = chat.primaryUser;
  currentIndex = 0;
  
  chatContainer.innerHTML = "";
  renderChatList();
  
  userSelect.innerHTML = `<option value="">${t('userSelectDefault')}</option>`;
  uniqueSenders.forEach(sender => {
    let opt = document.createElement('option');
    opt.value = sender;
    opt.innerText = sender;
    userSelect.appendChild(opt);
  });
  
  if (primaryUser) {
    userSelect.value = primaryUser;
    userSelectBanner.style.display = "none";
    
    if (uniqueSenders.size === 2) {
       let otherUser = Array.from(uniqueSenders).find(u => u !== primaryUser);
       chatTitle.innerText = otherUser || chat.name;
    } else {
       chatTitle.innerText = chat.name;
    }
  } else {
    if (uniqueSenders.size > 0) {
      userSelectBanner.style.display = "flex";
      userSelect.value = "";
      chatTitle.innerText = chat.name;
    } else {
      userSelectBanner.style.display = "none";
    }
  }

  loadNextMessages();
}

document.getElementById('fileInput').addEventListener('change', function(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      let fileMessages = [];
      let fileUniqueSenders = new Set();
      
      const lineRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(.*?)\s*-\s*(.*?):\s*(.*)/;
      const systemRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(.*?)\s*-\s*(.*)/;
      
      const lines = e.target.result.split('\n');
      let currentMessage = null;
      let msgIdCounter = 0;

      function getIsoDate(d, m, y) {
        let year = y.length === 2 ? "20" + y : y;
        return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      lines.forEach(line => {
        line = line.trimRight();
        if (!line) return;

        const match = line.match(lineRegex);
        if (match) {
          if (currentMessage) fileMessages.push(currentMessage);
          const [_, d, m, y, time, sender, message] = match;
          const date = `${d}/${m}/${y}`;
          const isoDate = getIsoDate(d, m, y);
          currentMessage = { id: msgIdCounter++, date, isoDate, time, sender, message, isSystem: false };
          fileUniqueSenders.add(sender);
        } else {
          const sysMatch = line.match(systemRegex);
          if (sysMatch && line.indexOf(':') === -1) {
            if (currentMessage) {
              fileMessages.push(currentMessage);
              currentMessage = null;
            }
            const [_, d, m, y, time, message] = sysMatch;
            const date = `${d}/${m}/${y}`;
            const isoDate = getIsoDate(d, m, y);
            fileMessages.push({ id: msgIdCounter++, date, isoDate, time, sender: "System", message, isSystem: true });
          } else if (currentMessage) {
            currentMessage.message += '\n' + line; 
          }
        }
      });
      
      if (currentMessage) fileMessages.push(currentMessage);
      
      let chatName = file.name.replace('.txt', '');
      chatName = chatName.replace('Chat de WhatsApp con ', '');
      
      let lastMsg = "Sin mensajes";
      let lastTime = "";
      if (fileMessages.length > 0) {
         let lastValidMsg = [...fileMessages].reverse().find(m => !m.isSystem) || fileMessages[fileMessages.length-1];
         lastMsg = lastValidMsg.message.replace(/<[^>]*>?/gm, '');
         if (lastMsg.includes("<Multimedia omitido>")) lastMsg = "📷 Foto";
         lastTime = lastValidMsg.time || lastValidMsg.date;
      }
      
      const chatId = "chat-" + Date.now() + Math.floor(Math.random()*1000);
      chats[chatId] = {
        id: chatId,
        name: chatName,
        messages: fileMessages,
        uniqueSenders: fileUniqueSenders,
        primaryUser: "",
        lastMessage: lastMsg,
        lastTime: lastTime
      };
      
      renderChatList();
      
      if (!activeChatId) {
        switchChat(chatId);
      }
    };
    reader.readAsText(file);
  });
});

document.addEventListener("click", e => {
  if (e.target.tagName === 'IMG' && e.target.classList.contains('msg-image')) {
    document.getElementById("lightbox-img").src = e.target.src;
    document.getElementById("lightbox").style.display = "flex";
  }
});

document.getElementById("lightboxClose").addEventListener("click", () => {
  document.getElementById("lightbox").style.display = "none";
});
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") {
    document.getElementById("lightbox").style.display = "none";
  }
});

let currentWordFrequencies = [];
const stopWords = new Set(["de", "que", "no", "a", "la", "el", "y", "en", "lo", "un", "por", "qué", "me", "te", "se", "los", "con", "para", "una", "mi", "ya", "es", "si", "pero", "las", "como", "más", "o", "su", "al", "del", "eso", "así", "está", "este", "hay", "todo", "nada", "muy", "bien", "también", "tiene", "hasta", "multimedia", "omitido", "foto", "audio", "archivo", "adjunto", "tu", "yo", "los", "sus"]);

const stopWordsES = new Set(["de", "que", "no", "a", "la", "el", "y", "en", "lo", "un", "por", "qué", "me", "te", "se", "los", "con", "para", "una", "mi", "ya", "es", "si", "pero", "las", "como", "más", "o", "su", "al", "del", "eso", "así", "está", "este", "hay", "todo", "nada", "muy", "bien", "también", "tiene", "hasta", "multimedia", "omitido", "foto", "audio", "archivo", "adjunto", "tu", "yo", "los", "sus"]);

const stopWordsEN = new Set(["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "omitted", "media", "attached", "file", "photo", "image", "video", "audio"]);

function renderWordCloud(count) {
   const container = document.getElementById("wordCloudContainer");
   container.innerHTML = "";
   let topWords = currentWordFrequencies.slice(0, count);
   if (topWords.length === 0) {
      container.innerHTML = `<p style="color: #8696a0;">${t('noWords')}</p>`;
      return;
   }
   let maxCount = topWords[0].count;
   let minCount = topWords[topWords.length - 1].count;
   
   topWords.sort(() => Math.random() - 0.5);
   
   topWords.forEach(item => {
      let span = document.createElement("span");
      span.innerText = item.word;
      let size = 12;
      if (maxCount !== minCount) {
         size = 12 + ((item.count - minCount) / (maxCount - minCount)) * 26;
      }
      span.style.fontSize = size + "px";
      span.style.color = `hsl(${Math.random() * 360}, 60%, 65%)`;
      span.title = `${item.count} ${t('msgs')}`;
      container.appendChild(span);
   });
}

btnStats.addEventListener("click", () => {
  let total = allMessages.length;
  if (total === 0) return;
  
  let counts = {};
  let totalWords = 0;
  let dateCounts = {};
  let emojiCounts = {};
  let wordCounts = {};
  
  const activeStopWords = currentLang === "es" ? stopWordsES : stopWordsEN;
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  
  allMessages.forEach(m => {
    if(!m.isSystem) {
      counts[m.sender] = (counts[m.sender] || 0) + 1;
      
      let words = m.message.toLowerCase().replace(/[.,!?;:()\[\]"']/g, '').split(/\s+/);
      totalWords += words.length;
      
      words.forEach(w => {
         if (w.length > 2 && !activeStopWords.has(w) && isNaN(w)) {
            wordCounts[w] = (wordCounts[w] || 0) + 1;
         }
      });
      
      if (!dateCounts[m.date]) {
         dateCounts[m.date] = { count: 0, iso: m.isoDate };
      }
      dateCounts[m.date].count += 1;
      
      let emojis = m.message.match(emojiRegex);
      if (emojis) {
         emojis.forEach(e => {
            emojiCounts[e] = (emojiCounts[e] || 0) + 1;
         });
      }
    }
  });
  
  currentWordFrequencies = Object.keys(wordCounts).map(w => ({word: w, count: wordCounts[w]})).sort((a,b) => b.count - a.count);
  
  let mostActiveDay = "";
  let mostActiveDayIso = "";
  let maxDayCount = 0;
  for(let d in dateCounts) {
    if(dateCounts[d].count > maxDayCount) {
       maxDayCount = dateCounts[d].count;
       mostActiveDay = d;
       mostActiveDayIso = dateCounts[d].iso;
    }
  }
  
  let sortedEmojis = Object.keys(emojiCounts).sort((a,b) => emojiCounts[b] - emojiCounts[a]).slice(0, 5);
  let topEmojisHtml = sortedEmojis.length > 0 
    ? sortedEmojis.map(e => `${e} (${emojiCounts[e]})`).join("  ") 
    : "None";
  
  let html = `<p><strong>${t('totalMessages')}</strong> ${total}</p>`;
  html += `<p><strong>${t('totalWords')}</strong> ${totalWords}</p>`;
  html += `<p><strong>${t('mostActiveDay')}</strong> ${mostActiveDay} (${maxDayCount} ${t('msgs')}) <button class="modal-close-btn" style="padding: 5px 10px; width: auto; margin-left: 10px;" onclick="document.getElementById('statsModal').style.display='none'; document.getElementById('dateInput').value='${mostActiveDayIso}'; document.getElementById('dateInput').dispatchEvent(new Event('change'));">${t('goToThisDay')}</button></p>`;
  html += `<p><strong>${t('topEmojis')}</strong> ${topEmojisHtml}</p><hr style="border-color:#2a3942">`;
  
  let sortedSenders = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
  sortedSenders.forEach(sender => {
    html += `<p><strong style="color:${getSenderColor(sender)}">${escapeHTML(sender)}:</strong> ${counts[sender]} ${t('msgs')}</p>`;
  });
  
  document.getElementById("statsContent").innerHTML = html;
  
  let currentSliderVal = document.getElementById("wordCloudCount").value;
  renderWordCloud(currentSliderVal);
  
  document.getElementById("statsModal").style.display = "flex";
});

document.getElementById("wordCloudCount").addEventListener("input", (e) => {
   document.getElementById("wordCloudCountVal").innerText = e.target.value;
   renderWordCloud(e.target.value);
});

document.getElementById("closeStats").addEventListener("click", () => {
  document.getElementById("statsModal").style.display = "none";
});

let isSearchActive = false;
let isCalendarActive = false;

btnSearchToggle.addEventListener("click", () => {
  isSearchActive = !isSearchActive;
  isCalendarActive = false;
  if (isSearchActive) {
    sidebarControls.style.display = "none";
    sidebarCalendar.style.display = "none";
    sidebarSearch.style.display = "block";
    searchInput.focus();
  } else {
    sidebarControls.style.display = "block";
    sidebarSearch.style.display = "none";
    sidebarCalendar.style.display = "none";
    searchInput.value = "";
    searchResults.innerHTML = "";
  }
});

btnCalendarToggle.addEventListener("click", () => {
  isCalendarActive = !isCalendarActive;
  isSearchActive = false;
  if (isCalendarActive) {
    sidebarControls.style.display = "none";
    sidebarSearch.style.display = "none";
    sidebarCalendar.style.display = "block";
  } else {
    sidebarControls.style.display = "block";
    sidebarSearch.style.display = "none";
    sidebarCalendar.style.display = "none";
  }
});

dateInput.addEventListener("change", function(e) {
  let targetIso = e.target.value;
  if (!targetIso) return;
  
  let targetMsg = allMessages.find(m => m.isoDate === targetIso);
  if (targetMsg) {
    scrollToMessage(targetMsg.id);
    document.getElementById("calendarStatus").innerText = "Mensajes encontrados. Desplazando...";
    setTimeout(() => {
       document.getElementById("calendarStatus").innerText = "Selecciona una fecha para ir a esos mensajes.";
    }, 3000);
  } else {
    document.getElementById("calendarStatus").innerText = "No se encontraron mensajes en esta fecha.";
  }
});

let searchTimeout;
searchInput.addEventListener("input", function(e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    let query = e.target.value.toLowerCase();
    searchResults.innerHTML = "";
    
    if (query.trim().length < 2) return;
    
    let matches = allMessages.filter(m => !m.isSystem && m.message.toLowerCase().includes(query));
    
    matches.slice(0, 100).forEach(m => {
      let div = document.createElement("div");
      div.classList.add("search-result-item");
      
      let snippet = escapeHTML(m.message);
      if (snippet.length > 60) snippet = snippet.substring(0, 60) + "...";
      
      div.innerHTML = `
        <span class="search-result-date">${m.date}</span>
        <div class="search-result-name" style="color:${getSenderColor(m.sender)}">${escapeHTML(m.sender)}</div>
        <div class="search-result-text">${snippet}</div>
      `;
      
      div.onclick = () => scrollToMessage(m.id);
      searchResults.appendChild(div);
    });
    
    if (matches.length > 100) {
      let limitMsg = document.createElement("div");
      limitMsg.style.padding = "10px";
      limitMsg.style.color = "#aebac1";
      limitMsg.style.fontSize = "12px";
      limitMsg.style.textAlign = "center";
      limitMsg.innerText = `+${matches.length - 100} resultados más. Sé más específico.`;
      searchResults.appendChild(limitMsg);
    }
  }, 300);
});

function scrollToMessage(id) {
  let el = document.getElementById("msg-" + id);
  
  if (!el) {
    let targetIndex = allMessages.findIndex(m => m.id === id);
    if (targetIndex !== -1) {
      while (currentIndex <= targetIndex && currentIndex < allMessages.length) {
        loadNextMessages();
      }
    }
    el = document.getElementById("msg-" + id);
  }
  
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    let bubble = el.querySelector(".message");
    if (bubble) {
      bubble.classList.add("highlight-flash");
      setTimeout(() => bubble.classList.remove("highlight-flash"), 2000);
    }
  }
}

const dropZone = document.getElementById("sidebar-controls");

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-active');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-active');

  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    let file = e.dataTransfer.files[0];
    if (file.name.endsWith('.txt')) {
      const fileInput = document.getElementById('fileInput');
      fileInput.files = e.dataTransfer.files;

      const event = new Event('change');
      fileInput.dispatchEvent(event);
    }
  }
});

// Initialize language settings
setLanguage(currentLang);
