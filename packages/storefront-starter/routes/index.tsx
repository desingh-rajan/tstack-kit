import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import Hero from "../components/Hero.tsx";
import Features from "../components/Features.tsx";
import About from "../components/About.tsx";
import Contact from "../components/Contact.tsx";
import Footer from "../components/Footer.tsx";

export default define.page(function Home(ctx) {
  console.log("Shared value " + ctx.state.shared);

  return (
    <div class="min-h-screen bg-white">
      <Head>
        <title>TStack Storefront</title>
        <meta
          name="description"
          content="Premium Storefront starter for TStack"
        />
      </Head>

      <Hero />
      <Features />
      <About />
      <Contact />
      <Footer />
    </div>
  );
});
