import CollectionMonitoringPageContent from "@/components/dashboard/collection/CollectionMonitoringPageContent";
import { getCollectionMonitoringData } from "@/lib/collection/data";

export default async function CollectionPage() {
  const data = await getCollectionMonitoringData();

  return <CollectionMonitoringPageContent {...data} />;
}
