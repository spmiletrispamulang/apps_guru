// js/rekap.js

document.addEventListener("DOMContentLoaded", function() {
    const activeClass = localStorage.getItem('activeClass');
    const activeMapel = localStorage.getItem('activeMapel');

    if (!activeClass) { window.location.href = 'dashboard.html'; return; }

    document.getElementById('kelasTitle').textContent = activeClass;
    document.getElementById('mapelTitle').textContent = `Mata Pelajaran: ${activeMapel}`;

    fetchRekapMatrix();

    function fetchRekapMatrix() {
        const loader = document.getElementById('loaderRekap');
        const container = document.getElementById('tableContainer');
        const errorDiv = document.getElementById('errorMessage');

        // Tarik Data Siswa & Absensi secara bersamaan dengan Header yang benar
        const pSiswa = fetch(CONFIG.SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getSiswa', kelas: activeClass }) 
        }).then(r => r.json());

        const pAbsen = fetch(CONFIG.SCRIPT_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getRekapAbsensi', kelas: activeClass, mapel: activeMapel }) 
        }).then(r => r.json());

        Promise.all([pSiswa, pAbsen]).then(([resSiswa, resAbsen]) => {
            loader.classList.add('d-none');
            
            if (resSiswa.status !== 'success' || !resSiswa.data || resSiswa.data.length === 0) {
                errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> Data siswa tidak ditemukan.`;
                errorDiv.classList.remove('d-none');
                return;
            }

            const siswaList = resSiswa.data;
            const absenData = resAbsen.data || [];

            // 1. Ekstrak tanggal unik & urutkan
            let dates = [...new Set(absenData.map(item => item.tanggal))].sort();

            // 2. Bangun Header Tabel (2 Baris)
            let theadHtml = `
                <tr>
                    <th rowspan="2" class="text-center align-middle" width="5%">No. Urut</th>
                    <th rowspan="2" class="text-center align-middle" width="10%">Induk</th>
                    <th rowspan="2" class="align-middle" width="30%">NAMA SISWA</th>
                    <th rowspan="2" class="text-center align-middle" width="5%">L/P</th>
                    <th colspan="${dates.length || 1}" class="text-center bg-light">Pertemuan Ke <i class="fas fa-arrow-right"></i></th>
                </tr>
                <tr class="bg-light">
                    ${dates.length > 0 ? dates.map((d, i) => `<th class="text-center">${i+1}<br><small class="text-muted">${formatTgl(d)}</small></th>`).join('') : '<th class="text-center">-</th>'}
                </tr>
            `;
            document.getElementById('rekapHead').innerHTML = theadHtml;

            // 3. Bangun Isi Tabel (Matriks)
            let tbodyHtml = '';
            siswaList.forEach((siswa, index) => {
                // Sederhanakan format Jenis Kelamin (Laki-laki -> L, Perempuan -> P)
                let gender = (siswa.jk.toLowerCase().startsWith('l')) ? 'L' : 'P';
                
                tbodyHtml += `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td class="text-center">${siswa.nis}</td>
                        <td class="font-weight-bold">${siswa.nama}</td>
                        <td class="text-center">${gender}</td>
                `;

                if (dates.length === 0) {
                    tbodyHtml += `<td class="text-center">-</td>`;
                } else {
                    dates.forEach(date => {
                        let record = absenData.find(a => a.nis === siswa.nis && a.tanggal === date);
                        let kode = '-';
                        if (record) {
                            if (record.status === 'Hadir') kode = 'H';
                            else if (record.status === 'Sakit') kode = 'S';
                            else if (record.status === 'Izin') kode = 'I';
                            else if (record.status === 'Alpa') kode = 'A';
                        }
                        tbodyHtml += `<td class="text-center font-weight-bold">${kode}</td>`;
                    });
                }
                tbodyHtml += `</tr>`;
            });
            document.getElementById('rekapBody').innerHTML = tbodyHtml;
            container.classList.remove('d-none');

            // 4. Inisialisasi DataTables
            $('#tableRekap').DataTable({
                "responsive": true,
                "autoWidth": false,
                "ordering": false, // Matikan sorting default agar baris No. Urut tidak kacau
                "language": { "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/id.json" },
                "dom": "<'row'<'col-sm-12 col-md-6 mb-2'B><'col-sm-12 col-md-6'f>>" +
                       "<'row'<'col-sm-12'tr>>" +
                       "<'row mt-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                "buttons": [
                    { extend: 'excelHtml5', className: 'btn btn-success btn-sm shadow-sm font-weight-bold mr-1' },
                    { extend: 'print', className: 'btn bg-letris-primary btn-sm shadow-sm font-weight-bold', 
                      title: 'Rekap Absensi - ' + activeClass + ' (' + activeMapel + ')',
                      customize: function ( win ) {
                          $(win.document.body).find('table').addClass('table-bordered');
                      }
                    }
                ]
            });
        }).catch(err => {
            loader.classList.add('d-none');
            errorDiv.innerHTML = `<i class="fas fa-wifi mr-2"></i> Gagal merender tabel. ${err}`;
            errorDiv.classList.remove('d-none');
        });
    }

// Ubah format string tanggal panjang menjadi DD/MM
    function formatTgl(dateString) {
        if (!dateString) return '';
        // Memotong string secara paksa hanya mengambil 10 karakter awal (YYYY-MM-DD)
        const cleanDate = dateString.substring(0, 10);
        const parts = cleanDate.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
        return cleanDate;
    }
});