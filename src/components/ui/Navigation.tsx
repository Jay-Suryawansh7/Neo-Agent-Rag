import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Home, MessageCircle, Book, Headphones, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/reading", label: "Reading", icon: Book },
  { href: "/music", label: "Music", icon: Headphones },
  { href: "/boredom", label: "Boredom", icon: Sparkles },
];

export function Navigation() {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  if (location.pathname === "/chat") return null;

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-0 inset-x-0 z-50 flex justify-center py-6 pointer-events-none"
    >
      <nav className="flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full px-2 py-2 pointer-events-auto shadow-xl shadow-black/50">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full overflow-hidden group",
                isActive ? "text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ borderRadius: 9999 }}
                />
              )}

              <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110", isActive && "text-white")} />

              <span className={cn(
                "relative z-10 hidden md:block",
                isActive ? "font-medium" : "font-normal"
              )}>
                {link.label}
              </span>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
            </Link>
          );
        })}
      </nav>
    </motion.header>
  );
}
