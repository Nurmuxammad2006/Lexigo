// Toggle password visibility (works on both register and login pages)
document.querySelectorAll('.toggle-password').forEach(function(toggleIcon) {
    toggleIcon.addEventListener('click', function() {
        const passwordInput = this.previousElementSibling;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.classList.remove('fa-eye-slash');
            this.classList.add('fa-eye');
        } else {
            passwordInput.type = 'password';
            this.classList.remove('fa-eye');
            this.classList.add('fa-eye-slash');
        }
    });
});

// Register Form Validation (only if the form exists)
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('passwordError');

        if (password !== confirmPassword) {
            e.preventDefault();
            errorElement.textContent = 'Passwords not matched';
        } else {
            errorElement.textContent = '';
            // Form submits normally
        }
    });
}

// Login Form (basic handling - you can extend later)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        // e.preventDefault(); // Remove this when connecting to real backend
        // For now, just lets it submit (or you can add checks here later)
        console.log('Login attempted');
    });
}


// email confirmation page redirect (if exists)
const inputs = document.querySelectorAll('.otp-input');
    const errorMsg = document.getElementById('otp-error');

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length > 0 && !/^\d$/.test(value)) {
                e.target.value = ''; // only allow digits
                return;
            }
            if (value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            if (paste.length >= 6) {
                inputs.forEach((inp, i) => {
                    if (i < 6) inp.value = paste[i];
                });
                inputs[5].focus();
                e.preventDefault();
            }
        });
    });