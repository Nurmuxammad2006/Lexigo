(function() {
    "use strict";

    // ----- DOM elements -----
    const coverElement = document.getElementById('coverSection');
    const avatarElement = document.getElementById('avatarImg');
    const fetchStatus = document.getElementById('fetchStatus');

    // Display fields
    const displayName = document.getElementById('displayName');
    const displayNickname = document.getElementById('displayNickname');
    const displayUni = document.getElementById('displayUni');
    const displayUniName = document.getElementById('displayUniName');
    const displayDegree = document.getElementById('displayDegree'); // we'll keep as is or edit?
    const displayLocation = document.getElementById('displayLocation');
    const displayBio = document.getElementById('displayBio');
    const displayContact = document.getElementById('displayContact');

    // Edit modal
    const editOverlay = document.getElementById('editModalOverlay');
    const editBtn = document.getElementById('editProfileBtn');
    const cancelEdit = document.getElementById('cancelEditBtn');
    const saveEdit = document.getElementById('saveEditBtn');
    const editName = document.getElementById('editName');
    const editNickname = document.getElementById('editNickname');
    const editUni = document.getElementById('editUni');
    const editLocation = document.getElementById('editLocation');
    const editBio = document.getElementById('editBio');

    // ----- Default images via fetch (unchanged) -----
    const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1740&q=80';
    const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';

    async function fetchImageAsBlob(url) {
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (err) {
            console.warn('fetch failed', err);
            return null;
        }
    }

    async function setDefaultCover() {
        const blobUrl = await fetchImageAsBlob(DEFAULT_COVER_URL);
        if (blobUrl) {
            coverElement.style.backgroundImage = `url('${blobUrl}')`;
            fetchStatus.innerHTML = '<i class="fas fa-check-circle"></i> Cover loaded via fetch + blob';
        } else {
            coverElement.style.backgroundImage = `url('${DEFAULT_COVER_URL}')`;
            fetchStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Fetch failed, direct URL';
        }
        coverElement.style.backgroundSize = 'cover';
        coverElement.style.backgroundPosition = 'center 30%';
    }
    async function setDefaultAvatar() {
        const blobUrl = await fetchImageAsBlob(DEFAULT_AVATAR_URL);
        if (blobUrl) {
            avatarElement.style.backgroundImage = `url('${blobUrl}')`;
        } else {
            avatarElement.style.backgroundImage = `url('${DEFAULT_AVATAR_URL}')`;
        }
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center 20%';
    }
    setDefaultCover();
    setDefaultAvatar();

    // ----- CROPPER LOGIC (unchanged) -----
    const coverUpload = document.getElementById('coverUpload');
    const avatarUpload = document.getElementById('avatarUpload');
    const coverCornerBtn = document.getElementById('coverCornerBtn');
    const avatarCornerBtn = document.getElementById('avatarCornerBtn');
    const modal = document.getElementById('cropperModal');
    const cropImage = document.getElementById('cropImage');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelCropBtn = document.getElementById('cancelCropBtn');
    const applyCropBtn = document.getElementById('applyCropBtn');
    const modalTitle = document.getElementById('modalTitle');

    let cropper = null;
    let uploadedImageURL = '';
    let activeTarget = null;

    coverCornerBtn.addEventListener('click', (e) => { e.preventDefault(); activeTarget = 'cover'; coverUpload.click(); });
    avatarCornerBtn.addEventListener('click', (e) => { e.preventDefault(); activeTarget = 'avatar'; avatarUpload.click(); });

    function handleFileSelect(input, targetType) {
        const files = input.files;
        if (!files || !files[0]) return;
        const file = files[0];
        const url = URL.createObjectURL(file);
        if (cropper) cropper.destroy();
        cropImage.src = url;
        uploadedImageURL = url;
        modalTitle.innerHTML = (targetType === 'cover') ? '<i class="fas fa-crop"></i> Crop cover (16:9)' : '<i class="fas fa-crop"></i> Crop avatar (1:1)';
        modal.style.display = 'flex';
        cropImage.onload = function() {
            cropper = new Cropper(cropImage, {
                aspectRatio: (targetType === 'avatar') ? 1 : 16/9,
                viewMode: 1,
                background: false,
                autoCropArea: 0.8,
            });
        };
        input.value = '';
    }
    coverUpload.addEventListener('change', function() { handleFileSelect(coverUpload, 'cover'); });
    avatarUpload.addEventListener('change', function() { handleFileSelect(avatarUpload, 'avatar'); });

    function applyCropAndSet() {
        if (!cropper || !activeTarget) return;
        const canvas = (activeTarget === 'cover') ? cropper.getCroppedCanvas({ width: 1000, height: 563 }) : cropper.getCroppedCanvas({ width: 400, height: 400 });
        const croppedURL = canvas.toDataURL('image/jpeg');
        if (activeTarget === 'cover') coverElement.style.backgroundImage = `url('${croppedURL}')`;
        else avatarElement.style.backgroundImage = `url('${croppedURL}')`;
        closeModal();
    }
    function closeModal() {
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
        if (uploadedImageURL) URL.revokeObjectURL(uploadedImageURL);
        cropImage.src = '';
        activeTarget = null; cropper = null;
    }
    closeModalBtn.addEventListener('click', closeModal);
    cancelCropBtn.addEventListener('click', closeModal);
    applyCropBtn.addEventListener('click', applyCropAndSet);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.querySelector('.cropper-container').addEventListener('click', (e) => e.stopPropagation());

    // ----- EDIT PROFILE FUNCTIONALITY -----
    // Populate modal with current values
    function openEditModal() {
        // Extract current text (remove extra icons etc)
        let rawName = displayName.childNodes[0]?.nodeValue?.trim() || "Нуримухаммад Гофуржонов";
        editName.value = rawName;

        let nicknameText = displayNickname.childNodes[0]?.nodeValue?.trim() || "You can call me NIKO";
        editNickname.value = nicknameText;

        editUni.value = displayUni.innerText.trim() || "PDP University";

        // location: from displayLocation (first part)
        let locFull = displayLocation.innerText.trim();
        let locSimple = locFull.split('·')[0].replace('Ташкент,', 'Ташкент,').trim() || "Ташкент, Узбекистан";
        editLocation.value = locSimple;

        // bio
        let bioText = displayBio.innerText.replace('“', '').replace('”','').trim() || "Computer Science Student...";
        editBio.value = bioText;

        editOverlay.style.display = 'flex';
    }

    function closeEditModal() {
        editOverlay.style.display = 'none';
    }

    function saveEditChanges() {
        // Name
        displayName.childNodes[0].nodeValue = editName.value + ' '; // keep space before icon
        // Nickname
        displayNickname.childNodes[0].nodeValue = editNickname.value + ' ';
        // University inside subtitle and block
        displayUni.innerText = editUni.value;
        displayUniName.innerText = editUni.value;
        // Location (simple) + we keep the extra span
        let locationSpan = displayLocation.querySelector('span');
        displayLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${editLocation.value} `;
        if (locationSpan) displayLocation.appendChild(locationSpan);
        // Bio
        displayBio.innerHTML = `<i class="fas fa-quote-left" style="opacity:0.6;"></i> ${editBio.value}`;
        // Contact line
        displayContact.innerText = `${editLocation.value} · Контактные сведения`;

        closeEditModal();
    }

    editBtn.addEventListener('click', openEditModal);
    cancelEdit.addEventListener('click', closeEditModal);
    saveEdit.addEventListener('click', saveEditChanges);
    editOverlay.addEventListener('click', (e) => { if (e.target === editOverlay) closeEditModal(); });

    // prevent closing when clicking inside card
    document.querySelector('.edit-card').addEventListener('click', (e) => e.stopPropagation());

    // minor initial sync for edit fields (first time)
    window.addEventListener('load', function() {
        // ensure edit fields have placeholder fallback
    });
})();