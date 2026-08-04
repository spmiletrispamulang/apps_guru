// js/login.js

document.addEventListener("DOMContentLoaded", function() {
    
    // Cek apakah sudah login sebelumnya (otomatis ke dashboard)
    const userData = localStorage.getItem('userGuru');
    if (userData) {
        window.location.href = 'dashboard.html';
    }

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value.trim();
        const btnSubmit = document.getElementById('btnSubmit');
        const alertMessage = document.getElementById('alertMessage');
        
        // UI State: Loading
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span> Memproses...';
        alertMessage.classList.add('d-none');

        const payload = {
            action: 'login',
            username: usernameInput,
            password: passwordInput
        };

        // Memanggil URL dari js/config.js
        fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                localStorage.setItem('userGuru', JSON.stringify(data.data));
                
                btnSubmit.classList.replace('bg-letris-primary', 'btn-success');
                btnSubmit.innerHTML = '<i class="fas fa-check"></i> Login Berhasil!';
                
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            } else {
                showError(data.message);
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            showError('Gagal menghubungi server. Periksa koneksi internet Anda.');
        });
    });

    function showError(msg) {
        const btnSubmit = document.getElementById('btnSubmit');
        const alertMessage = document.getElementById('alertMessage');
        
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Masuk ke Portal <i class="fas fa-sign-in-alt ml-2"></i>';
        alertMessage.textContent = msg;
        alertMessage.classList.remove('d-none');
    }
});