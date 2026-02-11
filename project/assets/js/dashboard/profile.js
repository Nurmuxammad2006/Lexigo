(function() {
            "use strict";

            // ---------- FETCH IMPLEMENTATION: load default images from URLs (like from API) ----------
            // We replace inline static image URLs with fetch calls to mimic API.
            
            const coverElement = document.getElementById('coverSection');
            const avatarElement = document.getElementById('avatarImg');
            const fetchStatus = document.getElementById('fetchStatus');
            
            // Default image URLs (Unsplash) – we'll fetch them as blobs and create object URLs
            const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1740&q=80';
            const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';

            // Fetch with retry / error handling
            async function fetchImageAsBlob(url) {
                try {
                    const response = await fetch(url, { mode: 'cors' }); // CORS enabled
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    const blob = await response.blob();
                    return URL.createObjectURL(blob);
                } catch (err) {
                    console.warn('Fetch failed, using fallback:', err);
                    // fallback to direct URL if fetch fails (CORS issues) - but we use no-cors mode? we try.
                    // We'll just return the original url as fallback but it might not be blob.
                    // Better: create a dummy colored background.
                    return null; // will handle fallback
                }
            }

            async function setDefaultCover() {
                const blobUrl = await fetchImageAsBlob(DEFAULT_COVER_URL);
                if (blobUrl) {
                    coverElement.style.backgroundImage = `url('${blobUrl}')`;
                    fetchStatus.innerHTML = '<i class="fas fa-check-circle"></i> Cover loaded via fetch + blob';
                } else {
                    // fallback color
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

            // Initialize both with fetch
            setDefaultCover();
            setDefaultAvatar();

            // ---------- CROPPER & UPLOAD LOGIC (unchanged, but uses fetch only for defaults) ----------
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

            // Corner button triggers
            coverCornerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                activeTarget = 'cover';
                coverUpload.click();
            });
            avatarCornerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                activeTarget = 'avatar';
                avatarUpload.click();
            });

            // File change handler
            function handleFileSelect(input, targetType) {
                const files = input.files;
                if (!files || !files[0]) return;
                const file = files[0];
                const url = URL.createObjectURL(file);

                if (cropper) cropper.destroy();
                cropImage.src = url;
                uploadedImageURL = url;

                modalTitle.innerHTML = (targetType === 'cover') 
                    ? '<i class="fas fa-crop"></i> Crop cover image (16:9)' 
                    : '<i class="fas fa-crop"></i> Crop avatar image (1:1)';
                
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

            // Apply crop
            function applyCropAndSet() {
                if (!cropper || !activeTarget) return;
                let canvas;
                if (activeTarget === 'cover') {
                    canvas = cropper.getCroppedCanvas({ width: 1000, height: 563 });
                } else {
                    canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
                }
                const croppedURL = canvas.toDataURL('image/jpeg');
                if (activeTarget === 'cover') {
                    coverElement.style.backgroundImage = `url('${croppedURL}')`;
                } else {
                    avatarElement.style.backgroundImage = `url('${croppedURL}')`;
                }
                closeModal();
            }

            function closeModal() {
                modal.style.display = 'none';
                if (cropper) cropper.destroy();
                if (uploadedImageURL) URL.revokeObjectURL(uploadedImageURL);
                cropImage.src = '';
                activeTarget = null;
                cropper = null;
            }

            closeModalBtn.addEventListener('click', closeModal);
            cancelCropBtn.addEventListener('click', closeModal);
            applyCropBtn.addEventListener('click', applyCropAndSet);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
            document.querySelector('.cropper-container').addEventListener('click', (e) => e.stopPropagation());

            // cleanup
            window.addEventListener('beforeunload', () => {
                if (uploadedImageURL) URL.revokeObjectURL(uploadedImageURL);
            });
        })();