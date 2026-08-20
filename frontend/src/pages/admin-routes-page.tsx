import { Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useDelivery } from "@/lib/delivery/store";
import { fmtTenge, fmtKm } from "@/lib/delivery/format";
import { findSettlement } from "@/lib/delivery/settlements";

export function AdminRoutesPage() {
  const { orders } = useDelivery();

  const byRoute = new Map<string, { count: number; revenue: number; km: number; minutes: number }>();
  for (const o of orders) {
    const key = `${o.fromId}→${o.toId}`;
    const cur = byRoute.get(key) ?? { count: 0, revenue: 0, km: 0, minutes: 0 };
    cur.count += 1;
    cur.revenue += o.price;
    cur.km += o.km;
    cur.minutes += o.minutes;
    byRoute.set(key, cur);
  }

  const rows = Array.from(byRoute.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue);

  const total = rows.reduce((s, r) => s + r.revenue, 0);
  const trips = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div>
      <PageHeader
        title="Маршруты"
        subtitle={`${trips} перевозок по ${rows.length} маршрутам · ${fmtTenge(total)} оборота`}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="size-4 text-caspi" aria-hidden />
            Активность по маршрутам
          </CardTitle>
          <CardDescription>Посчитано из заявок в демо-сторе. Сортировка: частота, затем оборот.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="px-6 py-3 font-semibold">Маршрут</th>
                  <th className="px-4 py-3 text-right font-semibold">Рейсы</th>
                  <th className="px-4 py-3 text-right font-semibold">Оборот</th>
                  <th className="px-4 py-3 text-right font-semibold">В среднем за рейс</th>
                  <th className="px-4 py-3 text-right font-semibold">Ср. км</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const [fromId, toId] = r.key.split("→");
                  return (
                    <tr key={r.key} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-6 py-3.5 font-bold">
                        {findSettlement(fromId)?.name} → {findSettlement(toId)?.name}
                        {rows[0]?.key === r.key && (
                          <span className="ml-2 rounded-full bg-caspi px-2 py-0.5 text-[10px] font-extrabold text-white uppercase">
                            самый активный
                          </span>
                        )}
                      </td>
                      <td className="tnum px-4 py-3.5 text-right font-bold">{r.count}</td>
                      <td className="tnum px-4 py-3.5 text-right font-extrabold">{fmtTenge(r.revenue)}</td>
                      <td className="tnum px-4 py-3.5 text-right">{fmtTenge(Math.round(r.revenue / r.count))}</td>
                      <td className="tnum px-4 py-3.5 text-right text-muted-foreground">{fmtKm(Math.round(r.km / r.count))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}