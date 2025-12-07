import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/client";
import Avatar from "./Avatar";

export default function SuggestedUsers({ limit = 6 }) {
  const { data, isLoading } = useQuery({
    queryKey: ["suggested-users", limit],
    queryFn: async () => {
      const { data } = await api.get("/users/me/suggested", { params: { limit } });
      return data;
    },
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Gente como vos</h3>
      {isLoading && <div className="text-sm text-slate-500">Cargando...</div>}
      <div className="space-y-3">
        {data?.map((u) => (
          <Link
            key={u.id}
            to={`/profile/${u.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Avatar user={{ ...u, avatar: u.avatar }} size={36} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
              <div className="text-xs text-slate-500">@{u.username}</div>
              <div className="text-[11px] text-slate-500">
                Intereses en común: {u.sharedInterests.slice(0, 2).join(", ") || "—"}
              </div>
              <div className="text-[11px] text-slate-500">Comparten {u.sharedSquadsCount} squads</div>
            </div>
          </Link>
        ))}
        {!isLoading && (!data || data.length === 0) && (
          <div className="text-sm text-slate-500">Sin sugerencias por ahora.</div>
        )}
      </div>
    </div>
  );
}
