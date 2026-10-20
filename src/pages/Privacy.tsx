const LAST_UPDATED = new Date().toISOString().slice(0, 10);

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
      <h1 className="font-display text-4xl text-bone">Kebijakan Privasi</h1>
      <p className="mt-2 text-xs text-fog/60">Privacy Policy (EN below)</p>
      <p className="mt-4 text-sm text-fog">
        Terakhir diperbarui: {LAST_UPDATED}
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-fog">
        <section>
          <h2 className="font-display text-xl text-bone">Data yang kami kumpulkan</h2>
          <p>
            Saat Anda melakukan pemesanan, kami mengumpulkan nama, email, nomor
            telepon, dan alamat pengiriman untuk memproses dan mengirim pesanan.
            Saat Anda menghubungi kami atau berlangganan newsletter, kami
            mengumpulkan email dan pesan yang Anda berikan.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-bone">Penggunaan data</h2>
          <p>
            Kami menggunakan informasi ini untuk memproses dan mengirim pesanan,
            membalas pesan Anda, dan mengirim newsletter yang Anda ikuti. Kami
            tidak menjual atau menyewakan data pribadi Anda kepada pihak ketiga.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-bone">Pembayaran</h2>
          <p>
            Pembayaran diproses oleh Midtrans. Kami tidak menyimpan kredensial
            kartu atau dompet digital Anda; hanya Midtrans yang menyimpannya.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-bone">Hak Anda</h2>
          <p>
            Anda dapat meminta salinan atau penghapusan data yang kami pegang
            tentang Anda dengan mengirim email ke studio. Kami akan merespons
            dalam waktu yang wajar.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-bone">Kontak</h2>
          <p>
            Pertanyaan tentang kebijakan ini? Email studio.
          </p>
        </section>
        <section className="border-t border-steel/40 pt-6">
          <h2 className="font-display text-xl text-bone">English version</h2>
          <p className="mt-2 text-xs text-fog/60">
            We collect name, email, phone and shipping address for orders; email
            and message for contact/newsletter. Data is used for order fulfilment,
            replies and opted-in newsletters. We do not sell or rent personal
            data. Payments are processed by Midtrans (we never store card/wallet
            credentials). You may request a copy or deletion of your data by
            emailing the studio.
          </p>
        </section>
      </div>
    </div>
  );
}
