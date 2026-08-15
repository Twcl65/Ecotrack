import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Leaf,
  MapPin,
  Radio,
  Route,
} from "lucide-react";

const highlights = [
  {
    icon: Radio,
    title: "Smart Monitoring",
    description: "Real-time tracking and monitoring",
  },
  {
    icon: Route,
    title: "Efficient Collection",
    description: "Optimized routes and schedules",
  },
  {
    icon: BarChart3,
    title: "Data-Driven",
    description: "Reports and insights for better decisions",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly",
    description: "Promoting sustainability in our community",
  },
];

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-eco-light/60 via-white to-blue-50/40"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1532996122724-e3c354a0b782?w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/70" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight text-eco-dark sm:text-4xl lg:text-5xl">
            Smart Waste Management for a Better Tomorrow
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            ECOTRACK helps Jasaan LGU efficiently manage, monitor, and optimize
            waste collection for a cleaner and healthier environment.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {highlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eco-primary/10 text-eco-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-eco-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-eco-dark"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-eco-primary px-5 py-3 text-sm font-semibold text-eco-primary transition hover:bg-eco-light"
            >
              <BarChart3 className="h-4 w-4" />
              View Reports
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-8 right-8 hidden opacity-30 lg:block">
          <MapPin className="h-32 w-32 text-eco-primary/20" />
        </div>
      </div>
    </section>
  );
}
