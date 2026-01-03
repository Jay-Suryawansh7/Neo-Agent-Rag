import TypeAnimation from "@/components/ui/typeanimation";
import { SplineScene } from "@/components/ui/spline";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";


export default function Home() {
  return (
    <>
      <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center">

        <div className="w-full h-full flex flex-col md:flex-row items-center relative z-10">

          {/* Left Column: Text Content */}
          <div className="w-full md:w-[45%] flex flex-col items-start justify-center h-full text-left z-20 pointer-events-none md:pointer-events-auto px-4 md:pl-24 lg:pl-32">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto"
            >
              <div className="mb-6">
                <h1 className="text-5xl md:text-7xl lg:text-7xl font-bold tracking-tighter text-white leading-[1.1] mb-2">
                  Where thinking
                </h1>
                <TypeAnimation
                  words={[" becomes visible.", " becomes clearer.", " becomes reality."]}
                  typingSpeed={100}
                  deletingSpeed={75}
                  pauseDuration={2000}
                  className="text-5xl md:text-7xl lg:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-600"
                  cursorClassName="bg-white"
                />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl text-zinc-400 max-w-lg mb-10 font-light tracking-wide pointer-events-auto"
            >
              Chat, reason, explore ideas, and escape boredom — all inside a single, calm system.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex flex-col items-start gap-4"
            >
              <Link to="/chat">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-black hover:bg-zinc-200 transition-all group">
                  Enter the Interface
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-sm text-zinc-500 font-light tracking-wide pl-2">
                No noise. No feeds. Just thinking.
              </p>
            </motion.div>
          </div>

          {/* Right Column: 3D Scene */}
          <div className="w-full md:w-[55%] h-full absolute inset-0 md:relative md:inset-auto z-10 overflow-visible">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
            {/* Mobile overlay to ensure text is readable if model overlaps on small screens */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:hidden pointer-events-none" />
          </div>

        </div>

        {/* Footer Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-8 text-zinc-600 text-xs tracking-widest uppercase z-20"
        >
          Antigravity System v1.0
        </motion.div>

        {/* Decorative Gradient Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0" />

      </div>

      {/* About / Narrative Section */}
      <section className="bg-black w-full py-32 md:py-48 relative z-10">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-16 md:space-y-24"
          >
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight">
                Interface is no longer static. <span className="text-zinc-500">It breathes.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-12 text-lg md:text-2xl text-zinc-400 font-light leading-relaxed">
              <p>
                For decades, we have been constrained by the flat, unresponsive rectangles of our screens.
                Information was trapped in rigid grids, waiting for us to come find it. The cognitive load
                was entirely ours.
              </p>
              <p>
                Antigravity represents a fundamental shift. We are moving from static retrieval to
                dynamic, spatial understanding. It’s an interface that doesn't just display data,
                but anticipates intention.
              </p>
              <p>
                Experience the fluidity of a system that adapts to your thought process.
                Here, depth isn't just a visual effect—it's a dimension of meaning.
              </p>
            </div>

            {/* Testimonial Placeholder */}
            <div id="testimonial-anchor" className="pt-16">
              {/* DesignTestimonial will be inserted here */}
            </div>

          </motion.div>
        </div>
      </section>

      {/* Transition / Portal Section */}
      <section className="bg-black w-full min-h-[50vh] flex flex-col items-center justify-center relative z-10 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/20 pointer-events-none" />

        <Link to="/chat">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="group relative px-12 py-6 bg-transparent overflow-hidden"
          >
            <span className="relative z-10 text-zinc-500 font-mono text-sm md:text-base tracking-[0.5em] group-hover:text-white transition-colors duration-700">
              [ INITIALIZE_INTERFACE ]
            </span>
            <span className="absolute inset-x-0 bottom-0 h-[1px] bg-zinc-800 group-hover:bg-white transition-colors duration-700" />
            <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl" />
          </motion.button>
        </Link>
      </section>

    </>
  );
}
