import HomePage from "@/components/HomePage";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_FEATURES,
  DEFAULT_METRICS,
  type FeatureCard,
  type SiteMetrics,
} from "@/types/database";

async function getSiteData(): Promise<{
  metrics: SiteMetrics;
  features: FeatureCard[];
}> {
  try {
    const supabase = await createClient();

    const [metricsResult, featuresResult] = await Promise.all([
      supabase.from("site_metrics").select("*").single(),
      supabase.from("feature_cards").select("*").order("sort_order"),
    ]);

    return {
      metrics: metricsResult.data ?? DEFAULT_METRICS,
      features:
        featuresResult.data && featuresResult.data.length > 0
          ? featuresResult.data
          : DEFAULT_FEATURES,
    };
  } catch {
    return {
      metrics: DEFAULT_METRICS,
      features: DEFAULT_FEATURES,
    };
  }
}

export default async function Home() {
  const { metrics, features } = await getSiteData();

  return <HomePage metrics={metrics} features={features} />;
}
