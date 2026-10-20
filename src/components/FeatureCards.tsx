import Image from "next/image";
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
  route: {
    src: "/service-route.png",
    alt: "Route planning map across Jasaan barangays",
  },
  collection: {
    src: "/service-collection.png",
    alt: "Waste collection truck monitoring in the community",
  },
  analytics: {
    src: "/service-analytics.png",
    alt: "Reporting and analytics dashboard for waste collection",
  },
} as const;

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
            const illustration =
              illustrationMap[feature.icon_type] ?? illustrationMap.route;

            return (
              <article
                key={feature.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-40 overflow-hidden bg-eco-light">
                  <Image
                    src={illustration.src}
                    alt={illustration.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
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
