const LAST_UPDATED = new Date().toISOString().slice(0, 10);

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
      <h1 className="font-display text-4xl text-bone">Syarat &amp; Ketentuan</h1>
      <p className="mt-2 text-xs text-fog/60">Terms of Service (EN below)</p>
      <p className="mt-4 text-sm text-fog">
        Terakhir diperbarui: {LAST_UPDATED}
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-fog">
        <section>
          <h2 className="font-display text-xl text-bone">Pesanan &amp; harga</h2>
          <p>
            Harga ditampilkan dalam Rupiah Indonesia (IDR) dan dikonfirmasi di
            server saat checkout. Kami berhak membatalkan pesanan jika
            ditemukan kesalahan harga sebelum pengiriman.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-bone">Pembayaran</h2>
          <p>
            Pesanan ditahan sebagai pending hingga pembayaran diterima dan
            diverifikasi. Transfer bank manual harus menyertakan nomor pesanan
            pada catatan transfer.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-bone">Pengiriman &amp; pengembalian</h2>
          <p>
            Waktu pengiriman adalah estimasi. Pengembalian diterima dalam 14
            hari setelah pengiriman untuk barang yang belum dipakai dalam
            kondisi asli. Hubungi studio untuk memulai pengembalian.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-bone">Batasan tanggung jawab</h2>
          <p>
            Sejauh diizinkan oleh hukum, studio tidak bertanggung jawab atas
            kerugian tidak langsung atau konsekuensial yang timbul dari
            penggunaan situs atau produk.
          </p>
        </section>
        <section className="border-t border-steel/40 pt-6">
          <h2 className="font-display text-xl text-bone">English version</h2>
          <p className="mt-2 text-xs text-fog/60">
            Prices in IDR, confirmed on server at checkout. We may cancel orders
            on pricing errors before shipment. Orders held pending until payment
            verified. Manual transfers must include order number. Returns
            accepted within 14 days for unworn items in original condition.
            Studio not liable for indirect/consequential damages to the fullest
            extent permitted by law.
          </p>
        </section>
      </div>
    </div>
  );
}
