import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { products } from "../constants/products";

export default function NewArrivals() {
  return (
    <section id="drop" className="scroll-mt-20 bg-ink py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-6 border-b border-steel/40 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acid">
              The drop / SS26
            </span>
            <h2 className="mt-3 font-display text-4xl leading-[0.9] text-bone sm:text-5xl lg:text-[4rem]">
              Latest <span className="text-outline">skins</span>
            </h2>
          </motion.div>

          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 border border-steel px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-bone transition-colors hover:border-acid hover:text-acid"
          >
            To the store
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
