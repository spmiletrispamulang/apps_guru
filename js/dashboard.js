document.addEventListener("DOMContentLoaded", function() {
    // Ambil data sesi dari localStorage
    const userData = JSON.parse(localStorage.getItem('userGuru'));
    
    // Proteksi Halaman: Jika belum login, tendang ke index.html
    if (!userData || !userData.username) {
        window.location.href = 'index.html';
        return;
    }

    // Tampilkan Profil di Sidebar
    document.getElementById('namaGuruDisplay').textContent = userData.nama_guru;
    document.getElementById('roleDisplay').textContent = userData.role;

    // Tarik Jadwal Mengajar dari Server
    fetchJadwal(userData.username);

    // Event Listener untuk Tombol Logout
    document.getElementById('btnLogout').addEventListener('click', function() {
        if(confirm('Apakah Anda yakin ingin keluar dari portal?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });
});

// Fungsi untuk menarik data jadwal dari GAS
function fetchJadwal(username) {
    const payload = {
        action: 'getJadwal',
        username: username
    };

    fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('loader').classList.add('d-none');
        const container = document.getElementById('jadwalContainer');
        const errorMsg = document.getElementById('errorMessage');

        if (data.status === 'success') {
            let htmlContent = '';
            
            // Render Kartu Jadwal dengan Desain Modern
            data.data.forEach(item => {
                htmlContent += `
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card card-modern h-100 border-top-0" style="border-left: 5px solid #0056b3;">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 class="font-weight-bold text-letris-primary mb-0">Kelas ${item.kelas}</h5>
                                    <div class="badge badge-warning text-dark px-2 py-1"><i class="fas fa-graduation-cap text-white"></i></div>
                                </div>
                                <h6 class="text-dark font-weight-bold"><i class="fas fa-book mr-2 text-letris-primary"></i>${item.mapel}</h6>
                                <p class="text-muted small mb-4 mt-2">Kelola absensi siswa, jurnal harian, dan akses materi pelajaran.</p>
                                <button class="btn bg-letris-primary btn-block rounded shadow-sm font-weight-bold" onclick="bukaMenuKelas('${item.kelas}', '${item.mapel}')">
                                    Masuk Kelas <i class="fas fa-arrow-right ml-2 text-letris-gold"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = htmlContent;
        } else {
            errorMsg.classList.remove('d-none');
            errorMsg.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${data.message || 'Data jadwal tidak ditemukan.'}`;
        }
    })
    .catch(error => {
        document.getElementById('loader').classList.add('d-none');
        const errorMsg = document.getElementById('errorMessage');
        errorMsg.classList.remove('d-none');
        errorMsg.innerHTML = '<i class="fas fa-wifi mr-2"></i> Gagal mengambil data dari server. Periksa koneksi internet Anda.';
        console.error('API Error:', error);
    });
}

// Navigasi ke halaman kelas
function bukaMenuKelas(kelas, mapel) {
    localStorage.setItem('activeClass', kelas);
    localStorage.setItem('activeMapel', mapel);
    window.location.href = 'kelas.html';
}