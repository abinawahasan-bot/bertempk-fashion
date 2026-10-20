import { motion, type Variants } from "motion/react";
import { TextWord } from "./TextReveal";

const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/**
 * Brand statement — matches the reference video (Bajuku.mp4):
 * oversized display statement, revealed WORD-BY-WORD on scroll, with the
 * word "change" circled in red.
 */
export default function Statement() {
  return (
    <section className="border-y border-steel/40 bg-ink py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <motion.h2
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto max-w-[18ch] text-center font-display text-[11vw] leading-[0.88] text-bone sm:text-[7.5vw] lg:text-[4.4rem] xl:text-[5.2rem]"
        >
          <TextWord>Built</TextWord>
          <TextWord>to</TextWord>
          <TextWord>
            <span className="relative inline-block">
              change
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-3 -inset-y-1 rounded-[100%] border-2 border-signal"
              />
            </span>
          </TextWord>
          <TextWord>
            moods<span className="text-acid">,</span>
          </TextWord>
          <TextWord>and</TextWord>
          <TextWord>worlds</TextWord>
          <TextWord>without</TextWord>
          <TextWord>losing</TextWord>
          <TextWord>its</TextWord>
          <TextWord>
            <span className="text-acid">shape</span>.
          </TextWord>
        </motion.h2>
      </div>
    </section>
  );
}
