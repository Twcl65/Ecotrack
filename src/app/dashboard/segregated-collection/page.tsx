import SegregatedCollectionPageContent from "@/components/dashboard/segregated-collection/SegregatedCollectionPageContent";
import { getMonthlyCollectionReports } from "@/lib/segregated-collection/monthly-data";

export default async function SegregatedCollectionPage() {
  const reportYear = new Date().getFullYear();
  const initialReports = await getMonthlyCollectionReports(reportYear);

  return (
    <SegregatedCollectionPageContent
      reportYear={reportYear}
      initialReports={initialReports}
    />
  );
}
