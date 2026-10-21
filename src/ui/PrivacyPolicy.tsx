export function PrivacyPolicy() {
  return (
    <details className="card" id="privasi">
      <summary style={{ fontWeight: 700, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Kebijakan privasi</summary>
      <div className="stack small">
        <p>
          Foto wajah termasuk data biometrik, yaitu data pribadi yang sensitif. Rona.ku dirancang agar datamu tetap di perangkatmu.
        </p>
        <h3>Apa yang kami lakukan</h3>
        <ul className="reasons">
          <li>Foto dan titik-titik wajah diproses di browser perangkatmu. Tidak ada yang dikirim ke server kami atau layanan pihak ketiga.</li>
          <li>Foto hanya ada di memori selama kamu memakai aplikasi. Foto hilang saat kamu menekan “Foto ulang” atau menutup halaman.</li>
          <li>Kami tidak memakai analitik, pelacak, atau pencatat error yang menyertakan gambar atau data wajah.</li>
        </ul>
        <h3>Yang tersimpan di perangkatmu</h3>
        <ul className="reasons">
          <li>Hanya jika kamu menekan “Suka” atau “Kurang suka”: nama produk, kode warna, label kecocokan, dan pilihanmu. Tidak ada gambar wajah.</li>
        </ul>
        <h3>Satu hal yang diunduh</h3>
        <ul className="reasons">
          <li>Saat pertama kali membaca foto, browser mengunduh file model deteksi wajah. Yang diunduh hanya model, bukan fotomu.</li>
        </ul>
        <h3>Menghapus data</h3>
        <ul className="reasons">
          <li>Foto: tekan “Foto ulang” atau tutup halaman. Masukan suka/tidak: hapus data situs ini lewat pengaturan browser.</li>
        </ul>
        <p className="muted">Draf ini mengikuti prinsip pelindungan data pribadi (UU PDP) dan perlu ditinjau ahli hukum sebelum rilis publik.</p>
      </div>
    </details>
  );
}
