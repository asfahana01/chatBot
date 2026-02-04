// Simple client-side chatbot with context, typing indicator, and responsive UI
const messagesEl = document.getElementById('messages');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');
const app = document.getElementById('app');

// Conversation context (array of {role:'user'|'bot', text})
const context = [];
let lastBotMessage = '';
let botTimer = null; // track pending bot response timer

// Utility: format time HH:MM
function formatTime(date = new Date()){
  return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Append a message to the chat
function appendMessage(role, text, {timestamp = new Date(), animate = true} = {}){
  const li = document.createElement('li');
  li.className = 'message ' + role;

  const p = document.createElement('div');
  p.className = 'meta';
  p.innerHTML = `<div class="text">${escapeHtml(text)}</div><div class="time">${formatTime(timestamp)}</div>`;

  li.appendChild(p);
  if (!animate){ li.style.animation = 'none'; li.style.opacity = 1 }
  messagesEl.appendChild(li);

  scrollToBottom();
  context.push({role, text, timestamp});
} 

// Small escape to avoid HTML injection
function escapeHtml(unsafe){
  return unsafe.replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]});
}

// Typing indicator removed — UI no longer shows an explicit typing element.

// Scroll behavior
function scrollToBottom(){
  setTimeout(()=>{
    messagesEl.lastElementChild?.scrollIntoView({behavior:'smooth', block:'end'});
  }, 80);
}

// Simple bot logic — friendly, concise by default, more detailed when asked
function getBotReply(text){
  const lower = text.toLowerCase();

  // Vague or too short -> ask clarifying question
  if (lower.length <= 3 || /^(hi|hello|hey|hya)$/.test(lower.trim())){
    return 'Hi there! Could you tell me a little more about what you need help with? 😊';
  }
  if (/\b(time|what time|current time)\b/.test(lower)){
    return `The current time is ${formatTime()}. Would you like help with timezones or scheduling?`;
  }
  if (/\b(date|today|what day)\b/.test(lower)){
    return `Today is ${new Date().toLocaleDateString()}. Anything else I can help with?`;
  }
  if (/\b(help|problem|issue|support)\b/.test(lower)){
    return 'Sure — can you describe the issue in one or two sentences? I can suggest steps or resources.';
  }
  if (/\b(joke|funny)\b/.test(lower)){
    return 'Why did the developer go broke? Because he used up all his cache. 😄 Want another one?';
  }
  if (/\b(detail|explain|more|expand)\b/.test(lower)){
    // find last bot answer to expand on
    const last = context.slice().reverse().find(m=>m.role==='bot');
    if(last){
      return `Sure — here are more details: ${last.text} If you want, I can give an example or step-by-step instructions.`;
    }
    return 'Could you say which part you want more detail on?';
  }

  // Unknown -> graceful fallback
  const generic = "I might not have all the details on that, but I can help reason it out or ask a clarifying question — could you tell me more?";

  // getBotReply replies concise unless user asks for more
  if (/[?.!]$/.test(text.trim()) || text.trim().split(' ').length > 8){
    // attempt short direct answer (demo): echo with friendly framing
    const answer = `Good question — ${generic}`;
    return answer;
  }

  // Default friendly prompt.
  return 'Thanks for asking — can you give a bit more context so I can give a useful answer?';
}

// Avoid repetitive replies
function varyResponse(reply){
  if(reply === lastBotMessage){
    // Slight variation
    return reply + ' (also, feel free to ask me to expand)';
  }
  return reply;
}

// Simulate typing delay based on message length
function respondAsBot(userText){
  const reply = varyResponse(getBotReply(userText));
  lastBotMessage = reply;

  // Cancel pending bot response (if any)
  if (botTimer){
    clearTimeout(botTimer);
    botTimer = null;
  }

  const delay = Math.min(1800, 400 + reply.length * 20);
  botTimer = setTimeout(()=>{
    appendMessage('bot', reply);
    botTimer = null;
  }, delay);
} 

// Handle user submission
function sendMessage(text){
  if(!text || !text.trim()){
    // shake input to indicate error
    input.classList.add('shake');
    setTimeout(()=>input.classList.remove('shake'), 400);
    return;
  }
  appendMessage('user', text);
  // Process bot response
  respondAsBot(text);
}

// Form submission
form.addEventListener('submit', e=>{
  e.preventDefault();
  const text = input.value;
  input.value = '';
  input.style.height = 'auto';
  sendMessage(text);
});

// Enter to send, Shift+Enter for newline
input.addEventListener('keydown', e=>{
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    form.dispatchEvent(new Event('submit', {cancelable:true}));
  }
});

// Auto-resize textarea
input.addEventListener('input', ()=>{
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
});

// Theme toggle
function loadTheme(){
  const theme = localStorage.getItem('theme') || 'light';
  if(theme === 'dark'){ document.documentElement.setAttribute('data-theme','dark'); themeToggle.checked = true; }
}
themeToggle.addEventListener('change', ()=>{
  if(themeToggle.checked){ document.documentElement.setAttribute('data-theme','dark'); localStorage.setItem('theme','dark'); }
  else{ document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme','light'); }
});
loadTheme();

// No automatic bot greeting: the bot will respond only after the user sends the first message.

// Basic accessibility: focus send button on load for keyboard users
sendBtn.addEventListener('click', ()=>{ input.focus(); });

// Expose minimal API for extensibility (e.g., hook to integrate real AI)
window.ChatBuddy = {
  sendMessage,
  appendMessage,
  getContext: () => [...context]
};
