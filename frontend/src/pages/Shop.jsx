import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Shop() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["shop-items"],
    queryFn: async () => {
      const { data } = await api.get("/shop/items");
      return data || [];
    },
  });

  const purchase = useMutation({
    mutationFn: async (itemId) => api.post("/shop/purchase", { itemId }),
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ["shop-items"] });
      // refresh me
      api.get("/auth/me").then(({ data }) => setUser(data.user));
    },
  });

  const equip = useMutation({
    mutationFn: async (userItemId) => api.post("/shop/equip", { userItemId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shop-items"] }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Tienda</h1>
          <p className="text-sm text-slate-500">Compra temas y decoraciones con puntos.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Tus puntos</div>
          <div className="text-2xl font-bold text-indigo-600">{user?.points ?? 0}</div>
        </div>
      </div>
      {isLoading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-500">
          Cargando tienda...
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {items?.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.name}</div>
                <div className="text-xs text-slate-500">{item.description}</div>
                <div className="text-xs text-slate-500 capitalize">{item.category.toLowerCase()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Precio</div>
                <div className="text-lg font-bold text-indigo-600">{item.pricePoints} pts</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.owned ? (
                <button
                  onClick={() => item.userItemId && equip.mutate(item.userItemId)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {item.equipped ? "Equipado" : "Equipar"}
                </button>
              ) : (
                <button
                  onClick={() => purchase.mutate(item.id)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  disabled={(user?.points ?? 0) < item.pricePoints}
                >
                  Comprar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
