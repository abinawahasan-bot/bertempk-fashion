import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import NewArrivals from "../components/NewArrivals";
import Statement from "../components/Statement";
import Story from "../components/Story";
import Contact from "../components/Contact";

const ticker = [
  "Wear your version",
  "No default",
  "We were never part of the default story",
];

export default function Home() {
  return (
    <>
      <Hero />
      <NewArrivals />
      <Statement />
      <Marquee items={ticker} variant="signal" />
      <Story />
      <Marquee
        items={["BERTEMPK — SS26", "Technical streetwear", "Indonesia", "Wear your version"]}
        variant="ink"
        reverse
      />
      <Contact />
    </>
  );
}
