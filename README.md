# DADAM — Dashboard Analisis Data Aktual Kabupaten Merangin

DADAM adalah situs web interaktif untuk membantu masyarakat dan pemerintah memahami kondisi ekonomi, sosial, ketenagakerjaan, dan kependudukan Kabupaten Merangin, Provinsi Jambi.

## Fitur

- **Dashboard Ringkasan** menampilkan PDRB, indikator sosial ekonomi, serta peta demografi dan kependudukan.
- **Dashboard Ekonomi** menyajikan PDRB menurut lapangan usaha atau pengeluaran, analisis tenaga kerja, produktivitas, dan sektor dengan pangsa terbesar.
- **Tahun referensi** mengikuti tahun data terbaru secara otomatis dan dapat dipilih untuk seluruh analisis.
- **Unduhan data** menyediakan data dalam format CSV beserta metadata.
- **Akun pengguna dan admin** membatasi pengelolaan data dan pengguna sesuai peran.
- **Pembaruan data oleh admin** menerima berkas JSON atau XLSX untuk data dashboard, tenaga kerja, dan demografi.

## Teknologi

- Next.js 16, React 19, dan TypeScript
- Firebase Authentication, Cloud Firestore, dan Firebase Admin SDK
- Recharts, D3, dan Tailwind CSS

## Persyaratan

- Node.js `26.13.0` (lihat `.node-version`)
- npm
- Proyek Firebase dengan Authentication dan Cloud Firestore

## Menjalankan secara lokal

1. Salin berkas contoh konfigurasi:

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Isi nilai pada `.env.local` sesuai proyek Firebase.
3. Pasang dependensi:

   ```bash
   npm install
   ```

4. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

Buka `http://localhost:3000` di peramban.

## Konfigurasi Firebase

1. Aktifkan metode masuk **Email/Password** pada Firebase Authentication.
2. Buat basis data Cloud Firestore dengan nama `(default)`.
3. Tambahkan `localhost` dan nama domain produksi ke daftar domain yang diizinkan pada Firebase Authentication.
4. Isi variabel `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, dan `NEXT_PUBLIC_FIREBASE_APP_ID` pada `.env.local`.
5. Pastikan ID proyek Firebase Admin SDK sama dengan `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
6. Simpan berkas JSON akun layanan Firebase Admin SDK di luar repositori, lalu arahkan `GOOGLE_APPLICATION_CREDENTIALS` ke lokasi berkas tersebut. Jangan unggah kunci akun layanan ke GitHub.

Berkas `.env.local` diabaikan oleh Git. Jangan menghapus aturan tersebut atau memasukkan nilai rahasia ke berkas yang dilacak Git.

## Akun dan hak akses

- Pengguna baru memperoleh peran `user` dan harus memverifikasi alamat email sebelum masuk.
- Peran yang tersedia adalah `user` dan `admin`. Peran admin dikelola di sisi server melalui dokumen `users/{uid}` di Firestore; formulir dari peramban tidak dapat menetapkan peran admin.
- Admin dapat mengelola data dashboard dan akun pengguna. Pengguna dapat melihat dashboard serta mengunduh data dan metadata.
- Keluar dari semua perangkat mencabut token penyegaran Firebase agar sesi lama tidak dapat digunakan kembali.
- Saat akun Firebase pertama kali ditautkan ke profil lama dengan alamat email yang sama, nama dan peran lama disalin ke profil Firebase. Profil lama ditandai telah dipindahkan dan hash kata sandi lamanya dihapus.

## Memperbarui data

Admin dapat membuka **Kelola data dashboard** melalui menu akun atau tombol admin pada dashboard.

- Data utama menerima berkas JSON atau XLSX dari templat yang tersedia di halaman pengelolaan data. Dataset `pdrb_lu`, `pdrb_exp`, dan `socioeko` harus memiliki tahun yang sama.
- Data tenaga kerja diperbarui melalui formulir khusus tenaga kerja dengan berkas JSON atau XLSX.
- Data demografi menerima JSON atau XLSX. Sistem memperbarui atribut pada peta kecamatan yang sudah ada; unggahan tidak perlu berisi ulang geometri. Data demografi untuk tahun yang diunggah harus mencakup seluruh 24 kecamatan.
- Untuk pembaruan peta, kolom masukan mencakup nama kecamatan `nmkec`, tahun `periode`, jumlah penduduk `Jumlah_Pen`, laju pertumbuhan `Laju_Pertu`, persentase penduduk `Persentase`, kepadatan `Kepadata_`, dan rasio jenis kelamin `Rasio_Jeni`.
- Data dashboard disimpan pada koleksi `dashboardData/{year}` di Firestore dan dibaca melalui endpoint server yang memeriksa sesi pengguna.

## Perintah proyek

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan |
| `npm run lint` | Memeriksa kualitas kode dengan ESLint |
| `npm run build` | Membuat hasil produksi |
| `npm run start` | Menjalankan hasil produksi |

## Catatan keamanan

- Jangan masukkan `.env.local`, kunci akun layanan, token, atau berkas kredensial ke repositori.
- Firebase Admin SDK hanya digunakan di sisi server.
- Atur Firebase Security Rules agar akses langsung ke Firestore hanya diberikan sesuai kebutuhan aplikasi.