import { ArrowRight, BarChart3, Map, Truck } from "lucide-react";
import type { FeatureCard } from "@/types/database";

type FeatureCardsProps = {
  features: FeatureCard[];
};

const iconMap = {
  route: Map,
  collection: Truck,
  analytics: BarChart3,
};

const illustrationMap = {
  route: (
    <div className="relative flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-green-50">
      <div className="absolute inset-4 rounded-lg border-2 border-dashed border-eco-primary/30" />
      <Map className="relative h-16 w-16 text-eco-primary/60" />
      <div className="absolute bottom-6 left-8 h-3 w-3 rounded-full bg-eco-primary" />
      <div className="absolute right-10 top-8 h-3 w-3 rounded-full bg-blue-400" />
      <div className="absolute left-1/2 top-1/2 h-2 w-16 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-eco-primary/40" />
    </div>
  ),
  collection: (
    <div className="relative flex h-36 items-end justify-center overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="mb-4 flex h-20 w-32 items-center justify-center rounded-t-lg bg-eco-primary">
        <Truck className="h-10 w-10 text-white" />
      </div>
      <div className="absolute bottom-0 h-2 w-full bg-gray-300/50" />
    </div>
  ),
  analytics: (
    <div className="relative flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex items-end gap-2">
        <div className="h-8 w-5 rounded-t bg-eco-primary/60" />
        <div className="h-14 w-5 rounded-t bg-eco-primary/80" />
        <div className="h-10 w-5 rounded-t bg-blue-400/70" />
        <div className="h-16 w-5 rounded-t bg-eco-primary" />
      </div>
      <BarChart3 className="absolute right-6 top-6 h-8 w-8 text-eco-primary/30" />
    </div>
  ),
};

export default function FeatureCards({ features }: FeatureCardsProps) {
  return (
    <section id="services" className="bg-gray-50/80 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-eco-dark sm:text-3xl">
            Our Services
          </h2>
          <p className="mt-2 text-gray-600">
            Comprehensive waste management solutions for Jasaan LGU
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = iconMap[feature.icon_type] ?? Map;
            return (
              <article
                key={feature.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {illustrationMap[feature.icon_type]}
                <div className="p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-eco-primary" />
                    <h3 className="text-lg font-bold text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-eco-primary transition hover:gap-2"
                  >
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
