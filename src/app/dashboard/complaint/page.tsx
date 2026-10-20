import ComplaintPageContent from "@/components/dashboard/complaint/ComplaintPageContent";
import { getBarangays } from "@/lib/barangay/data";
import { getComplaints } from "@/lib/complaint/data";

export default async function ComplaintPage() {
  const [complaints, barangays] = await Promise.all([
    getComplaints(),
    getBarangays(),
  ]);

  const barangayOptions = [
    ...new Set([
      ...barangays.map((b) => b.name),
      ...complaints.map((c) => c.barangay),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <ComplaintPageContent
      initialComplaints={complaints}
      barangayOptions={barangayOptions}
    />
  );
}
