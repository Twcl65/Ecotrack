import UserPageContent from "@/components/dashboard/users/UserPageContent";
import { getSystemUsers } from "@/lib/users/data";

export default async function UsersPage() {
  const users = await getSystemUsers();

  return <UserPageContent initialUsers={users} />;
}
