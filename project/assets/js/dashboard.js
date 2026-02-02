
Copy

// ================================================
// DASHBOARD PROFILE EDITING SCRIPT
// ================================================

// ELEMENTS
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const nameInput = document.getElementById("nameInput");
const roleInput = document.getElementById("roleInput");
const bioInput = document.getElementById("bioInput");
const coverImage = document.getElementById("coverImage");
const avatarImage = document.getElementById("avatarImage");
const coverInput = document.getElementById("coverInput");
const avatarInput = document.getElementById("avatarInput");
const editCoverBtn = document.getElementById("editCoverBtn");
const editAvatarBtn = document.getElementById("editAvatarBtn");
const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");
const applyCropBtn = document.getElementById("applyCrop");
const cancelCropBtn = document.getElementById("cancelCrop");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");

const inputs = [nameInput, roleInput, bioInput];

// ================================================
// EDIT MODE LOGIC
// ================================================

editBtn.onclick = () => {
  inputs.forEach((i) => (i.disabled = false));
  editBtn.style.display = "none";
  saveBtn.style.display = "inline-block";
};

saveBtn.onclick = () => {
  inputs.forEach((i) => (i.disabled = true));
  saveBtn.style.display = "none";
  editBtn.style.display = "inline-block";
};

// ================================================
// ADVANCED CROPPER LOGIC
// ================================================

let cropper = null;
let currentTarget = null;
let isCircularCrop = false;

function openCropper(file, aspectRatio, targetImg) {
  currentTarget = targetImg;
  isCircularCrop = targetImg === avatarImage;

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    cropImage.src = e.target.result;
    cropImage.style.maxWidth = "none";

    cropModal.classList.remove("circular-mode");
    if (isCircularCrop) {
      cropModal.classList.add("circular-mode");
    }

    cropModal.style.display = "flex";

    setTimeout(() => {
      cropper = new Cropper(cropImage, {
        aspectRatio: aspectRatio,
        viewMode: 0,
        dragMode: "move",
        responsive: true,
        autoCropArea: 0.8,
        checkOrientation: true,
        guides: false,
        zoomable: true,
        ready() {
          if (isCircularCrop) {
            const canvasData = cropper.getCanvasData();
            const cropSize = Math.min(canvasData.width, canvasData.height) * 0.8;
            cropper.setCropBoxData({
              width: cropSize,
              height: cropSize,
              left: canvasData.left + (canvasData.width - cropSize) / 2,
              top: canvasData.top + (canvasData.height - cropSize) / 2,
            });
          }
        },
      });
    }, 200);
  };
  reader.readAsDataURL(file);
}

// Zoom Controls
zoomInBtn.onclick = (e) => {
  e.preventDefault();
  if (cropper) cropper.zoom(0.1);
};

zoomOutBtn.onclick = (e) => {
  e.preventDefault();
  if (cropper) cropper.zoom(-0.1);
};

// APPLY CROP
applyCropBtn.onclick = () => {
  if (!cropper || !currentTarget) return;

  let canvas = cropper.getCroppedCanvas({
    width: isCircularCrop ? 400 : 1200,
    height: isCircularCrop ? 400 : 600,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  if (isCircularCrop) {
    const circleCanvas = document.createElement("canvas");
    const ctx = circleCanvas.getContext("2d");
    circleCanvas.width = 400;
    circleCanvas.height = 400;
    ctx.beginPath();
    ctx.arc(200, 200, 200, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(canvas, 0, 0, 400, 400);
    canvas = circleCanvas;
  }

  currentTarget.src = canvas.toDataURL(isCircularCrop ? "image/png" : "image/jpeg", 0.9);
  closeModal();
};

// CANCEL / CLOSE
cancelCropBtn.onclick = () => closeModal();

function closeModal() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  cropModal.style.display = "none";
  coverInput.value = "";
  avatarInput.value = "";
  cropImage.src = "";
  currentTarget = null;
}

// ================================================
// IMAGE INPUTS
// ================================================

editCoverBtn.onclick = () => coverInput.click();
coverInput.onchange = (e) => {
  const file = e.target.files[0];
  if (file) openCropper(file, 16 / 9, coverImage);
};

editAvatarBtn.onclick = () => avatarInput.click();
avatarInput.onchange = (e) => {
  const file = e.target.files[0];
  if (file) openCropper(file, 1, avatarImage);
};


// ================================================
// CHAT SYSTEM — CONFIG
// ================================================

// ┌─────────────────────────────────────────────┐
// │  REPLACE these with your actual values      │
// └─────────────────────────────────────────────┘
const API_BASE = "http://localhost:3000/api";       // your backend base URL
function getToken() {
  return localStorage.getItem("token") || "";       // or however you store your auth token
}
// ─────────────────────────────────────────────────


// ================================================
// CHAT SYSTEM — STATE
// ================================================

let activeChatId = null;       // currently selected chat ID
let contacts = [];             // fetched contacts list


// ================================================
// CHAT SYSTEM — HELPERS
// ================================================

// Build common headers for every fetch call
function authHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

// Render a single message element into .chat-messages
function renderMessage(msg) {
  const container = document.querySelector(".chat-messages");
  if (!container) return;

  const div = document.createElement("div");
  div.className = `message ${msg.sent ? "sent" : "received"}`;
  div.dataset.messageId = msg.id;

  // action buttons (edit / delete) — only on sent messages
  let actionsHtml = "";
  if (msg.sent) {
    actionsHtml = `
      <div class="message-actions">
        <i class="fa fa-pencil edit-message" title="Edit"></i>
        <i class="fa fa-trash delete-message" title="Delete"></i>
      </div>`;
  }

  // inner text block
  const textDiv = document.createElement("div");
  textDiv.className = "message-text";
  textDiv.innerText = msg.content;

  // timestamp
  const timeDiv = document.createElement("div");
  timeDiv.className = "message-time";
  timeDiv.innerText = formatTime(msg.createdAt);

  div.innerHTML = actionsHtml;
  div.appendChild(textDiv);
  div.appendChild(timeDiv);
  container.appendChild(div);

  // auto-scroll to the latest message
  container.scrollTop = container.scrollHeight;
}

// Simple timestamp formatter — adjust to your preference
function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// Update the last-message preview text in the contact list
function updateContactPreview(chatId, text) {
  const el = document.querySelector(`.chat-user[data-chat-id="${chatId}"] .info p`);
  if (el) el.innerText = text;
}


// ================================================
// 1. LOAD CONTACTS  →  GET /api/chats
// ================================================
// Called once on page load. Fetches every chat the
// current user belongs to and renders the contact list.
// ================================================

async function loadContacts() {
  const container = document.querySelector(".chat-list-scroll");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/chats`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error(`Load contacts failed (${res.status})`);

    contacts = await res.json();
    // expected shape per item:
    // { id, name, lastMessage, avatarUrl?, updatedAt }

    container.innerHTML = "";  // clear before re-render

    if (contacts.length === 0) {
      container.innerHTML = '<div class="no-results">No chats yet</div>';
      return;
    }

    contacts.forEach((chat) => renderContactItem(chat, container));

  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="no-results">Failed to load chats</div>';
  }
}

// Render one contact row
function renderContactItem(chat, container) {
  const div = document.createElement("div");
  div.className = "chat-user";
  div.dataset.chatId = chat.id;

  div.innerHTML = `
    <div class="avatar-wrap">
      ${chat.avatarUrl
        ? `<img src="${chat.avatarUrl}" alt="${chat.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
        : `<i class="fa fa-user"></i>`}
    </div>
    <div class="info">
      <strong>${chat.name || "Unknown"}</strong>
      <p>${chat.lastMessage || "No messages yet"}</p>
    </div>`;

  div.addEventListener("click", () => selectChat(chat.id, chat.name));
  container.appendChild(div);
}


// ================================================
// 2. SELECT A CHAT  →  GET /api/chats/:id/messages
// ================================================
// Fired when the user clicks a contact. Marks it
// active, updates the header, loads messages.
// ================================================

async function selectChat(chatId, chatName) {
  // highlight in list
  document.querySelectorAll(".chat-user").forEach((el) => el.classList.remove("active"));
  const clicked = document.querySelector(`.chat-user[data-chat-id="${chatId}"]`);
  if (clicked) clicked.classList.add("active");

  // store active id
  activeChatId = chatId;

  // update header name + store chatId on header for menu actions
  const header = document.querySelector(".chat-header");
  if (header) header.dataset.chatId = chatId;

  const headerName = document.querySelector(".chat-user-info span");
  if (headerName) headerName.innerText = chatName || "";

  // clear previous messages
  const msgContainer = document.querySelector(".chat-messages");
  if (msgContainer) msgContainer.innerHTML = "";

  // fetch messages
  try {
    const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error(`Load messages failed (${res.status})`);

    const messages = await res.json();
    // expected shape per item:
    // { id, content, sent (bool), createdAt }

    messages.forEach((msg) => renderMessage(msg));

  } catch (err) {
    console.error(err);
    if (msgContainer) msgContainer.innerHTML = '<div style="text-align:center;color:#9ca3b0;padding:40px 0;font-size:.82rem;">Failed to load messages</div>';
  }
}


// ================================================
// 3. SEND MESSAGE  →  POST /api/chats/:id/messages
// ================================================
// Triggered by the Send button click OR pressing
// Enter inside the input field.
// ================================================

async function sendMessage() {
  const input = document.querySelector(".chat-input input");
  if (!input) return;

  const text = input.value.trim();
  if (!text || !activeChatId) return;

  // clear input immediately for feel
  input.value = "";

  // optimistic render — show locally before server confirms
  const optimisticMsg = {
    id: "pending-" + Date.now(),
    content: text,
    sent: true,
    createdAt: new Date().toISOString(),
  };
  renderMessage(optimisticMsg);

  try {
    const res = await fetch(`${API_BASE}/chats/${activeChatId}/messages`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content: text }),
    });

    if (!res.ok) throw new Error(`Send failed (${res.status})`);

    const saved = await res.json();
    // expected shape: { id, content, sent, createdAt }

    // replace the optimistic element with the real ID from server
    const pending = document.querySelector(`[data-message-id="${optimisticMsg.id}"]`);
    if (pending && saved.id) pending.dataset.messageId = saved.id;

    // update contact list preview
    updateContactPreview(activeChatId, text);

  } catch (err) {
    console.error(err);
    // remove the optimistic message on failure
    const pending = document.querySelector(`[data-message-id="${optimisticMsg.id}"]`);
    if (pending) pending.remove();
    alert("Failed to send message. Please try again.");
  }
}


// ================================================
// 4. SEARCH / FILTER CONTACTS (client-side)
// ================================================
// Filters the already-loaded contacts list in real
// time as the user types. No extra network call.
// ================================================

function initSearch() {
  const searchInput = document.querySelector(".chat-search");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    const container = document.querySelector(".chat-list-scroll");
    if (!container) return;

    container.innerHTML = "";

    const filtered = contacts.filter((c) =>
      (c.name || "").toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      container.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }

    filtered.forEach((chat) => renderContactItem(chat, container));
  });
}


// ================================================
// CHAT MESSAGE ACTIONS (EDIT / DELETE)
// ================================================
// (kept exactly as original — just uses the shared
//  authHeaders helper now)
// ================================================

document.addEventListener("click", async function (e) {
  // ── DELETE MESSAGE ──
  if (e.target.classList.contains("delete-message")) {
    const messageEl = e.target.closest(".message");
    if (!messageEl) return;

    const messageId = messageEl.dataset.messageId;
    if (!messageId) return;

    if (!confirm("Delete this message?")) return;

    try {
      const res = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error(`Failed to delete message (${res.status})`);

      messageEl.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to delete message. Please try again.");
    }

    return;
  }

  // ── EDIT MESSAGE ──
  if (e.target.classList.contains("edit-message")) {
    const messageEl = e.target.closest(".message");
    if (!messageEl) return;

    const textEl = messageEl.querySelector(".message-text");
    const messageId = messageEl.dataset.messageId;
    if (!messageId || !textEl) return;

    const newText = prompt("Edit message:", textEl.innerText);
    if (!newText || newText.trim() === "") return;

    try {
      const res = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ content: newText.trim() }),
      });

      if (!res.ok) throw new Error(`Failed to edit message (${res.status})`);

      textEl.innerText = newText.trim();
    } catch (err) {
      console.error(err);
      alert("Failed to edit message. Please try again.");
    }
  }
});


// ================================================
// CHAT HEADER MENU (THREE DOTS)
// ================================================

document.addEventListener("DOMContentLoaded", () => {
  const moreBtn = document.querySelector(".more-chat");
  const chatMenu = document.querySelector(".chat-menu");
  const chatHeader = document.querySelector(".chat-header");

  if (!moreBtn || !chatMenu || !chatHeader) return;

  function closeMenu() {
    chatMenu.classList.remove("active");
  }

  // TOGGLE MENU
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    chatMenu.classList.toggle("active");
  });

  // CLOSE ON OUTSIDE CLICK
  document.addEventListener("click", (e) => {
    if (!chatMenu.contains(e.target) && !moreBtn.contains(e.target)) {
      closeMenu();
    }
  });

  // ── ALERT CHAT ──
  const alertBtn = document.querySelector(".alert-chat");
  if (alertBtn) {
    alertBtn.addEventListener("click", () => {
      alert("Alert action");
      closeMenu();
    });
  }

  // ── EDIT CHAT NAME ──
  const editChatBtn = document.querySelector(".edit-chat");
  if (editChatBtn) {
    editChatBtn.addEventListener("click", async () => {
      const chatId = chatHeader.dataset.chatId;
      if (!chatId) {
        alert("Chat ID not found.");
        closeMenu();
        return;
      }

      const newName = prompt("Edit chat name:");
      if (!newName || newName.trim() === "") {
        closeMenu();
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/chats/${chatId}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ name: newName.trim() }),
        });

        if (!res.ok) throw new Error(`Failed to rename chat (${res.status})`);

        const headerTitle = chatHeader.querySelector(".chat-name, h2, h3, .chat-title, span");
        if (headerTitle) headerTitle.innerText = newName.trim();

        // also update the contact list item
        const contactEl = document.querySelector(`.chat-user[data-chat-id="${chatId}"] .info strong`);
        if (contactEl) contactEl.innerText = newName.trim();

      } catch (err) {
        console.error(err);
        alert("Failed to rename chat. Please try again.");
      }

      closeMenu();
    });
  }

  // ── DELETE CHAT ──
  const deleteChatBtn = document.querySelector(".delete-chat");
  if (deleteChatBtn) {
    deleteChatBtn.addEventListener("click", async () => {
      const chatId = chatHeader.dataset.chatId;
      if (!chatId) {
        alert("Chat ID not found.");
        closeMenu();
        return;
      }

      if (!confirm("Delete this chat?")) {
        closeMenu();
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/chats/${chatId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });

        if (!res.ok) throw new Error(`Failed to delete chat (${res.status})`);

        // remove from local list + DOM
        contacts = contacts.filter((c) => c.id !== chatId);
        const contactEl = document.querySelector(`.chat-user[data-chat-id="${chatId}"]`);
        if (contactEl) contactEl.remove();

        // clear the chat window
        activeChatId = null;
        const msgContainer = document.querySelector(".chat-messages");
        if (msgContainer) msgContainer.innerHTML = "";
        const headerName = document.querySelector(".chat-user-info span");
        if (headerName) headerName.innerText = "";

      } catch (err) {
        console.error(err);
        alert("Failed to delete chat. Please try again.");
      }

      closeMenu();
    });
  }


  // ================================================
  // BOOT — wire up send + search, then load contacts
  // ================================================

  // Send button click
  const sendBtn = document.querySelector(".chat-input button");
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  // Enter key in input
  const msgInput = document.querySelector(".chat-input input");
  if (msgInput) {
    msgInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Client-side search filter
  initSearch();

  // Fetch and render the contacts list
  loadContacts();
});