import { SIZES, SIZE_CHART } from "../constants/fit";

/**
 * The size-guide content — one component, two surfaces.
 *
 * Rendered inside the `SizeGuide` dialog and again on the `/size-guide` page,
 * so the chart can never drift between them. Keep it presentational: the page
 * owns the page chrome, the dialog owns the focus trap.
 */

/** How to take the measurements — shown under every chart block. */
const HOW_TO_MEASURE = [
  "Letakkan kaus atau celana terbaikmu di atas meja yang rata, lalu ratakan tanpa menarik.",
  "Lebar dada diukur dari keti ke keti, keliling lengan dikali dua.",
  "Panjang badan diukur dari titik tertinggi bahu sampai hem bawah.",
  "Celana: lingkar pinggang diukur di bagian terlebar, panjang dalam dari selangkangan sampai bawah kaki.",
];

export default function SizeGuideContent() {
  return (
    <>
      <p className="max-w-prose text-sm leading-relaxed text-fog">
        Potongan ours longgar dan sedikit dropped shoulder. Ukur clothing piece
        favoritmu lalu ambil baris yang paling dekat — kalau di antara dua
        ukuran, ambil yang lebih besar.
      </p>

      <div className="mt-6 space-y-8">
        {SIZE_CHART.map((block) => (
          <section key={block.id}>
            <h3 className="font-display text-lg text-bone">{block.appliesTo}</h3>
            <p className="mt-1 text-xs text-ash">{block.note}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Ukuran sentimeter untuk {block.appliesTo}
                </caption>
                <thead>
                  <tr className="border-b border-steel/60">
                    <th
                      scope="col"
                      className="py-2 pr-4 font-semibold uppercase tracking-[0.15em] text-fog"
                    >
                      cm
                    </th>
                    {SIZES.map((size) => (
                      <th
                        key={size}
                        scope="col"
                        className="px-3 py-2 text-center font-display text-sm text-bone"
                      >
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row.label} className="border-b border-steel/30">
                      <th scope="row" className="py-2.5 pr-4 font-normal text-fog">
                        {row.label}
                      </th>
                      {SIZES.map((size) => (
                        <td
                          key={size}
                          className="px-3 py-2.5 text-center tabular-nums text-bone"
                        >
                          {row.cm[size]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8 border border-steel/40 bg-smoke px-5 py-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-acid">
          Cara mengukur
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-fog">
          {HOW_TO_MEASURE.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </>
  );
}
