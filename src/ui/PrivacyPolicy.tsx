import { t } from "../i18n";

export function PrivacyPolicy() {
  return (
    <details className="card" id="privasi">
      <summary style={{ fontWeight: 700, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>{t("Kebijakan privasi")}</summary>
      <div className="stack small">
        <p>{t("Foto wajah termasuk data biometrik, yaitu data pribadi yang sensitif. Rona.ku dirancang agar datamu tetap di perangkatmu.")}</p>
        <h3>{t("Apa yang kami lakukan")}</h3>
        <ul className="reasons">
          <li>{t("Foto dan titik-titik wajah diproses di browser perangkatmu. Tidak ada yang dikirim ke server kami atau layanan pihak ketiga.")}</li>
          <li>{t("Foto hanya ada di memori selama kamu memakai aplikasi. Foto hilang saat kamu menekan “Foto ulang” atau menutup halaman.")}</li>
          <li>{t("Kami tidak memakai analitik, pelacak, atau pencatat error yang menyertakan gambar atau data wajah.")}</li>
        </ul>
        <h3>{t("Yang tersimpan di perangkatmu")}</h3>
        <ul className="reasons">
          <li>{t("Hanya jika kamu menekan “Suka” atau “Kurang suka”: nama produk, kode warna, label kecocokan, dan pilihanmu. Tidak ada gambar wajah.")}</li>
          <li>{t("Pilihan bahasa (ID atau EN).")}</li>
        </ul>
        <h3>{t("Satu hal yang diunduh")}</h3>
        <ul className="reasons">
          <li>{t("Saat pertama kali membaca foto, browser mengunduh file model deteksi wajah. Yang diunduh hanya model, bukan fotomu.")}</li>
        </ul>
        <h3>{t("Menghapus data")}</h3>
        <ul className="reasons">
          <li>{t("Foto: tekan “Foto ulang” atau tutup halaman. Masukan suka/tidak dan pilihan bahasa: hapus data situs ini lewat pengaturan browser.")}</li>
        </ul>
        <p className="muted">{t("Draf ini mengikuti prinsip pelindungan data pribadi (UU PDP) dan perlu ditinjau ahli hukum sebelum rilis publik.")}</p>
      </div>
    </details>
  );
}
