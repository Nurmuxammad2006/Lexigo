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
    inputs.forEach(i => i.disabled = false);
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
};

saveBtn.onclick = () => {
    inputs.forEach(i => i.disabled = true);
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
    isCircularCrop = (targetImg === avatarImage);

    if (cropper) {
        cropper.destroy();
        cropper = null;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        cropImage.src = e.target.result;
        
        // CRITICAL FIX: Zoom fails if max-width is 100%. 
        // This line ensures the image can grow.
        cropImage.style.maxWidth = "none";

        cropModal.classList.remove('circular-mode');
        if (isCircularCrop) {
            cropModal.classList.add('circular-mode');
        }

        cropModal.style.display = "flex";

        setTimeout(() => {
            cropper = new Cropper(cropImage, {
                
                aspectRatio: aspectRatio,
                viewMode: 0, 
                dragMode: 'move',      
                responsive: true,
                autoCropArea: 0.8,     
                checkOrientation: true,
                guides: false,
                zoomable: true, // Required for zoom() to work
                ready() {
                    if (isCircularCrop) {
                        const canvasData = cropper.getCanvasData();
                        const cropSize = Math.min(canvasData.width, canvasData.height) * 0.8;
                        
                        cropper.setCropBoxData({
                            width: cropSize,
                            height: cropSize,
                            left: canvasData.left + (canvasData.width - cropSize) / 2,
                            top: canvasData.top + (canvasData.height - cropSize) / 2
                        });
                    }
                }
            });
        }, 200); 
    };
    reader.readAsDataURL(file);
}

// Monica: Zoom Control Logic
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
        imageSmoothingQuality: 'high',
    });

    if (isCircularCrop) {
        const circleCanvas = document.createElement('canvas');
        const ctx = circleCanvas.getContext('2d');
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

// CANCEL/CLOSE
cancelCropBtn.onclick = () => closeModal();

function closeModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropModal.style.display = "none";
    coverInput.value = "";
    avatarInput.value = "";
    cropImage.src = ""; // Clear source
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
// CHAT MESSAGE ACTIONS (EDIT / DELETE MESSAGE)
// ================================================

document.addEventListener("click", function (e) {

    // DELETE MESSAGE
    if (e.target.classList.contains("delete-message")) {
        const messageEl = e.target.closest(".message");
        if (!messageEl) return;

        const messageId = messageEl.dataset.messageId;
        if (!messageId) return;

        if (!confirm("Delete this message?")) return;

        fetch(`/api/messages/${messageId}`, {
            method: "DELETE",
            headers: {
                Authorization: "Bearer TOKEN"
            }
        }).then(() => {
            messageEl.remove();
        });
    }

    // EDIT MESSAGE
    if (e.target.classList.contains("edit-message")) {
        const messageEl = e.target.closest(".message");
        if (!messageEl) return;

        const textEl = messageEl.querySelector(".message-text");
        const messageId = messageEl.dataset.messageId;
        if (!messageId) return;

        const newText = prompt("Edit message:", textEl.innerText);
        if (!newText) return;

        fetch(`/api/messages/${messageId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer TOKEN"
            },
            body: JSON.stringify({ content: newText })
        }).then(() => {
            textEl.innerText = newText;
        });
    }
});


// ================================================
// CHAT HEADER MENU (THREE DOTS) — FINAL FIXED
// ================================================

document.addEventListener("DOMContentLoaded", () => {

    const moreBtn = document.querySelector(".more-chat");
    const chatMenu = document.querySelector(".chat-menu");
    const chatHeader = document.querySelector(".chat-header");

    if (!moreBtn || !chatMenu || !chatHeader) return;

    // TOGGLE MENU
    moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chatMenu.classList.toggle("active");
    });

    // CLOSE MENU WHEN CLICK OUTSIDE
    document.addEventListener("click", () => {
        chatMenu.classList.remove("active");
    });

    // ALERT CHAT
    const alertBtn = document.querySelector(".alert-chat");
    if (alertBtn) {
        alertBtn.addEventListener("click", () => {
            alert("Alert action");
            chatMenu.classList.remove("active");
        });
    }

    // EDIT CHAT
    const editChatBtn = document.querySelector(".edit-chat");
    if (editChatBtn) {
        editChatBtn.addEventListener("click", () => {
            const newName = prompt("Edit chat name:");
            if (newName) {
                console.log("Rename chat to:", newName);
                // later → PUT /api/chats/:id
            }
            chatMenu.classList.remove("active");
        });
    }

    // DELETE CHAT
    const deleteChatBtn = document.querySelector(".delete-chat");
    if (deleteChatBtn) {
        deleteChatBtn.addEventListener("click", () => {
            const chatId = chatHeader.dataset.chatId;
            if (!chatId) return;

            if (!confirm("Delete this chat?")) return;

            fetch(`/api/chats/${chatId}`, {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer TOKEN"
                }
            }).then(() => {
                alert("Chat deleted");
                window.location.href = "chat.html";
            });

            chatMenu.classList.remove("active");
        });
    }

});
