import BarangayPageContent from "@/components/dashboard/barangay/BarangayPageContent";
import { getBarangays } from "@/lib/barangay/data";

export default async function BarangayPage() {
  const barangays = await getBarangays();

  return <BarangayPageContent initialBarangays={barangays} />;
}
