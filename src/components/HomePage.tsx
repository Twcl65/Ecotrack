"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import StatsSection from "./StatsSection";
import FeatureCards from "./FeatureCards";
import LoginModal from "./LoginModal";
import type { FeatureCard, SiteMetrics } from "@/types/database";

type HomePageProps = {
  metrics: SiteMetrics;
  features: FeatureCard[];
};

export default function HomePage({ metrics, features }: HomePageProps) {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <Navbar
        onLoginClick={() => setLoginOpen(true)}
        onRegisterClick={() => setLoginOpen(true)}
      />
      <main>
        <HeroSection />
        <StatsSection metrics={metrics} />
        <FeatureCards features={features} />

        <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-eco-primary px-8 py-12 text-white sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">About ECOTRACK</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-green-50">
              ECOTRACK is Jasaan&apos;s smart waste management platform, built to
              help the local government unit monitor collection routes, track
              active pickups, and generate insights for a cleaner, greener
              community. Together, we&apos;re building a sustainable future for
              Jasaan.
            </p>
          </div>
        </section>

        <section id="contact" className="border-t border-gray-100 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900">Contact Us</h2>
            <p className="mt-2 text-gray-600">
              Municipal Government of Jasaan, Misamis Oriental
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Email: ecotrack@jasaan.gov.ph
            </p>
          </div>
        </section>
      </main>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <footer className="border-t border-gray-100 bg-gray-50 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ECOTRACK — Cleaner Jasaan, Greener Tomorrow
      </footer>
    </>
  );
}
