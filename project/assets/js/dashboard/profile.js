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