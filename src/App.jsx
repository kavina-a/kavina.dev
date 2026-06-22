import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "./lib/gsap";
import Intro from "./components/Intro";
import FluidHero from "./components/paint/PaintInvert";
import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import SocialSidebar from "./components/SocialSidebar";
import Footer from "./components/Footer";
import Work from "./components/sections/Work";
import AboutMe from "./components/sections/AboutMe";
import About from "./components/sections/About";
import Clients from "./components/sections/Clients";
import Awards from "./components/sections/AwardsCinematic";
import ProjectsShowcase from "./components/sections/ProjectsShowcase";
import Contact from "./components/sections/Contact";
import VoiceAgent from "./components/voice/VoiceAgent";
import { useLenis } from "./lib/useLenis";
import "./App.css";

function useSiteScrollEffects(mainRef) {
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const ctx = gsap.context(() => {
      // Hero "scroll to explore" — fades out as user scrolls away
      gsap.to(".hero__scroll", {
        opacity: 0,
        y: -20,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "15% top",
          scrub: true,
        },
      });

      // Work section heading — slight upward parallax for depth
      gsap.fromTo(
        ".work .section__heading",
        { y: 40 },
        {
          y: -20,
          ease: "none",
          scrollTrigger: {
            trigger: ".work",
            start: "top bottom",
            end: "top 20%",
            scrub: true,
          },
        }
      );

      // Contact header — dramatic scale-up on entry
      gsap.fromTo(
        ".contact__header h2",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "expo.out",
          duration: 1,
          scrollTrigger: {
            trigger: ".contact",
            start: "top 80%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );

      // Footer tagline — slides up from below
      gsap.fromTo(
        ".footer__tagline",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "expo.out",
          duration: 1.2,
          scrollTrigger: {
            trigger: ".footer",
            start: "top 85%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );

      // Footer social links — staggered fade
      gsap.fromTo(
        ".footer__socials a",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.06,
          ease: "power3.out",
          duration: 0.8,
          scrollTrigger: {
            trigger: ".footer__row",
            start: "top 90%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    }, main);

    return () => ctx.revert();
  }, [mainRef]);
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const mainRef = useRef(null);
  const lenisRef = useLenis();
  useSiteScrollEffects(mainRef);

  const handleIntroDone = () => {
    setIntroDone(true);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  // Pinned ScrollTrigger sections can restore/jump scroll on init — always
  // land on the fluid hero after triggers mount and after assets load.
  useEffect(() => {
    const resetScroll = () => {
      ScrollTrigger.clearScrollMemory();
      window.scrollTo(0, 0);
      lenisRef.current?.scrollTo(0, { immediate: true });
    };

    resetScroll();

    const refreshAndReset = () => {
      ScrollTrigger.refresh();
      resetScroll();
    };

    const t = window.setTimeout(refreshAndReset, 120);
    window.addEventListener("load", refreshAndReset);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("load", refreshAndReset);
    };
  }, [lenisRef]);

  return (
    <>
      <Cursor />
      {/* {!introDone && <Intro onDismiss={handleIntroDone} />} */}

      <Navbar />
      <SocialSidebar />

      <main className="site" id="top" ref={mainRef}>
        <FluidHero />
        <AboutMe />
        <Work />
        {/* <About /> */}
        {/* <Clients /> */}
        <Awards />
        <ProjectsShowcase />
        <Contact />
      </main>

      <Footer />
      <VoiceAgent />
    </>
  );
}
