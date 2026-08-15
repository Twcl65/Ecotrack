import type { SystemUser, UserStats } from "@/types/user";

export function computeUserStats(users: SystemUser[]): UserStats {
  return users.reduce<UserStats>(
    (acc, user) => {
      acc.total += 1;
      if (user.status === "inactive") acc.inactive += 1;
      switch (user.role) {
        case "admin":
          acc.administrators += 1;
          break;
        case "driver":
          acc.drivers += 1;
          break;
        case "resident":
          acc.residents += 1;
          break;
      }
      return acc;
    },
    {
      total: 0,
      administrators: 0,
      drivers: 0,
      residents: 0,
      inactive: 0,
    }
  );
}
