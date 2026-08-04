// js/kelas.js

document.addEventListener("DOMContentLoaded", function() {
    const userData = JSON.parse(localStorage.getItem('userGuru'));
    const activeClass = localStorage.getItem('activeClass');
    const activeMapel = localStorage.getItem('activeMapel');
    let daftarSiswaGlobal = [];

    // Proteksi Halaman
    if (!userData || !activeClass) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Set Judul Header & Tanggal Default
    document.getElementById('kelasTitle').textContent = activeClass;
    document.getElementById('mapelTitle').textContent = `Mata Pelajaran: ${activeMapel}`;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalAbsensi').value = today;
    document.getElementById('tanggalJurnal').value = today;

    // Load Daftar Siswa
    fetchSiswa();

    // FUNGSI: Tarik Data Siswa
    function fetchSiswa() {
        const loader = document.getElementById('loaderSiswa');
        const container = document.getElementById('daftarSiswaContainer');
        const btnSimpan = document.getElementById('btnSimpanAbsensi');

        fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getSiswa', kelas: activeClass })
        })
        .then(res => res.json())
        .then(data => {
            loader.classList.add('d-none'); // Sembunyikan loading
            
            if (data.status === 'success') {
                daftarSiswaGlobal = data.data;
                renderDaftarSiswa(daftarSiswaGlobal);
                container.classList.remove('d-none');
                btnSimpan.classList.remove('d-none');
                
                // [FITUR BARU] Cek riwayat absensi di tanggal yang sedang aktif saat pertama kali buka
                cekDataTanggal(document.getElementById('tanggalAbsensi').value);
            } else {
                container.innerHTML = `<div class="alert alert-warning"><i class="fas fa-info-circle mr-2"></i>${data.message}</div>`;
                container.classList.remove('d-none');
            }
        })
        .catch(error => {
            // FIX: Sembunyikan loading jika terjadi error jaringan
            loader.classList.add('d-none'); 
            container.innerHTML = `<div class="alert alert-danger"><i class="fas fa-wifi mr-2"></i>Gagal mengambil data siswa. Periksa koneksi Anda.</div>`;
            container.classList.remove('d-none');
            console.error('Error:', error);
        });
    }

    // FUNGSI: Render UI Daftar Siswa
    function renderDaftarSiswa(siswaArray) {
        const container = document.getElementById('daftarSiswaContainer');
        let html = `
          <div class="row font-weight-bold d-none d-md-flex pb-2 border-bottom text-letris-primary mb-3">
            <div class="col-md-2">NIS</div>
            <div class="col-md-4">Nama Siswa</div>
            <div class="col-md-6 text-center">Status Kehadiran</div>
          </div>
        `;

        siswaArray.forEach((siswa, index) => {
            html += `
            <div class="row student-row align-items-center py-2 border-bottom">
              <div class="col-md-2 col-12 text-muted small"><i class="fas fa-id-badge mr-1"></i> ${siswa.nis}</div>
              <div class="col-md-4 col-12 font-weight-bold mb-2 mb-md-0">${siswa.nama} <span class="badge badge-info ml-1">${siswa.jk}</span></div>
              <div class="col-md-6 col-12 text-center">
                <div class="btn-group btn-group-toggle w-100 shadow-sm" data-toggle="buttons">
                  <label class="btn btn-outline-success active">
                    <input type="radio" name="status_${index}" value="Hadir" checked> Hadir
                  </label>
                  <label class="btn btn-outline-warning">
                    <input type="radio" name="status_${index}" value="Sakit"> Sakit
                  </label>
                  <label class="btn btn-outline-info">
                    <input type="radio" name="status_${index}" value="Izin"> Izin
                  </label>
                  <label class="btn btn-outline-danger">
                    <input type="radio" name="status_${index}" value="Alpa"> Alpa
                  </label>
                </div>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
    }

    // FUNGSI: Simpan Absensi
    document.getElementById('formAbsensi').addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = document.getElementById('btnSimpanAbsensi');
        btn.disabled = true; 
        btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span>Menyimpan...';

        let dataKehadiran = [];
        daftarSiswaGlobal.forEach((siswa, index) => {
            const status = document.querySelector(`input[name="status_${index}"]:checked`).value;
            dataKehadiran.push({ nis: siswa.nis, nama: siswa.nama, status: status });
        });

        const payload = {
            action: 'simpanAbsensi',
            tanggal: document.getElementById('tanggalAbsensi').value,
            kelas: activeClass,
            mapel: activeMapel,
            absensiData: dataKehadiran
        };

        fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            btn.disabled = false; 
            btn.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan Data Absensi';
        })
        .catch(err => {
            alert("Gagal menyimpan data absensi.");
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan Data Absensi';
        });
    });

    // FUNGSI: Simpan Jurnal
    document.getElementById('formJurnal').addEventListener('submit', function(e) {
        e.preventDefault();
        const btn = document.getElementById('btnSimpanJurnal');
        btn.disabled = true; 
        btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span>Menyimpan...';

        const payload = {
            action: 'simpanJurnal',
            tanggal: document.getElementById('tanggalJurnal').value,
            kelas: activeClass,
            mapel: activeMapel,
            guru: userData.nama_guru,
            materi: document.getElementById('materiJurnal').value,
            catatan: document.getElementById('catatanJurnal').value
        };

        fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            document.getElementById('materiJurnal').value = '';
            document.getElementById('catatanJurnal').value = '';
            btn.disabled = false; 
            btn.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan Jurnal Mengajar';
        })
        .catch(err => {
            alert("Gagal menyimpan jurnal.");
            btn.disabled = false; 
            btn.innerHTML = '<i class="fas fa-save mr-2"></i> Simpan Jurnal Mengajar';
        });
    });

    // EVENT LISTENER: Tab Materi Diklik
    document.getElementById('tab-materi').addEventListener('click', function() {
        const container = document.getElementById('materiContainer');
        const loader = document.getElementById('loaderMateri');
        const emptyState = document.getElementById('materiEmptyState');
        
        // Cek apakah sudah pernah diload agar tidak berulang
        if(container.innerHTML.trim() !== '') return;

        loader.classList.remove('d-none');
        if(emptyState) emptyState.classList.add('d-none');

        fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getMateri', mapel: activeMapel })
        })
        .then(res => res.json())
        .then(data => {
            loader.classList.add('d-none');
            if (data.status === 'success') {
                let html = '';
                data.data.forEach(materi => {
                    html += `
                    <div class="col-md-6 mb-3">
                        <div class="card bg-light border-left-primary shadow-sm h-100">
                            <div class="card-body">
                                <h5 class="font-weight-bold text-letris-primary"><i class="fas fa-file-pdf mr-2 text-danger"></i> ${materi.judul}</h5>
                                <p class="text-muted small">${materi.deskripsi}</p>
                                <a href="${materi.tautan}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">
                                    <i class="fas fa-external-link-alt mr-1"></i> Buka Materi
                                </a>
                            </div>
                        </div>
                    </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = `<div class="col-12"><div class="alert alert-warning"><i class="fas fa-info-circle mr-2"></i>${data.message}</div></div>`;
            }
        })
        .catch(error => {
            loader.classList.add('d-none');
            container.innerHTML = `<div class="col-12"><div class="alert alert-danger">Gagal memuat materi.</div></div>`;
        });
    });

    // =========================================================================
    // FITUR BARU: AUTO-CHECK UNTUK EDIT ABSENSI SAAT TANGGAL DIUBAH
    // =========================================================================

    // EVENT LISTENER: Cek data otomatis saat tanggal diubah
    document.getElementById('tanggalAbsensi').addEventListener('change', function(e) {
        cekDataTanggal(e.target.value);
    });

    // FUNGSI: Menarik riwayat di tanggal spesifik (Untuk Edit Absen)
    function cekDataTanggal(tanggalPilih) {
        const payload = { action: 'cekAbsensi', tanggal: tanggalPilih, kelas: activeClass, mapel: activeMapel };
        
        fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(resData => {
            if (resData.status === 'success') {
                const mapStatus = resData.data; 
                
                daftarSiswaGlobal.forEach((siswa, index) => {
                    // Jika ada data lama, gunakan itu. Jika tidak ada di DB, set ke default "Hadir"
                    const savedStatus = mapStatus[siswa.nis] || 'Hadir'; 
                    
                    const radio = document.querySelector(`input[name="status_${index}"][value="${savedStatus}"]`);
                    if(radio) {
                        radio.checked = true;
                        // Hapus class 'active' dari semua label warna di baris anak ini
                        const labels = document.querySelectorAll(`input[name="status_${index}"]`);
                        labels.forEach(lbl => lbl.parentElement.classList.remove('active'));
                        // Tambahkan class 'active' agar tombol terlihat nyala (terpilih)
                        radio.parentElement.classList.add('active');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Gagal mengecek data absensi di tanggal tersebut:', error);
        });
    }
});