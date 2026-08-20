import { useCallback, useEffect, useState } from "react";
import { CircleCheck, Clock, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderList } from "@/components/order-card";
import { EmptyState } from "@/components/empty-state";
import { useDelivery } from "@/lib/delivery/store";
import { fmtTenge } from "@/lib/delivery/format";

export function BoardPage() {
  const { orders, acceptOrder, startOrder, deliverOrder, refreshOpen } = useDelivery();
  const [tab, setTab] = useState("open");

  const open = orders.filter((o) => o.status === "offered");
  const mine = orders.filter((o) => o.mine && (o.status === "accepted" || o.status === "in_progress"));
  const history = orders.filter((o) => o.mine && o.status === "delivered");

  const deliveredToday = history.filter(
    (o) => o.deliveredAt && new Date(o.deliveredAt).getDate() === new Date().getDate()
  );
  const todaySum = deliveredToday.reduce((s, o) => s + o.price, 0);

  const handleAccept = useCallback(
    (number: string) => {
      acceptOrder(number);
      toast("Заказ принят", {
        description: "Заказ появился в твоих заказах — забери груз вовремя.",
        icon: <CircleCheck className="size-5 text-caspi" />,
      });
    },
    [acceptOrder]
  );

  const handleStart = useCallback(
    (number: string) => {
      startOrder(number);
      toast("Заказ взят в работу", {
        description: "Грузополучатель видит, что ты в пути.",
        icon: <CircleCheck className="size-5 text-caspi" />,
      });
    },
    [startOrder]
  );

  const handleDeliver = useCallback(
    (number: string) => {
      deliverOrder(number);
      toast("Заказ доставлен", {
        description: "Деньги за доставку уже на балансе.",
        icon: <CircleCheck className="size-5 text-success" />,
      });
    },
    [deliverOrder]
  );

  useEffect(() => {
    const t = window.setInterval(refreshOpen, 60_000);
    return () => window.clearInterval(t);
  }, [refreshOpen]);

  return (
    <div className="container-site max-w-3xl py-10 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">Водителям</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Заявки рядом</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden /> Обновляются автоматически каждую минуту
          </p>
        </div>
        {todaySum > 0 && (
          <p className="tnum rounded-full bg-muted px-4 py-2 text-sm font-extrabold">
            Доставлено сегодня: {fmtTenge(todaySum)}
          </p>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="h-auto w-full gap-1 rounded-full border bg-paper p-1.5 sm:w-fit">
          <TabsTrigger
            value="open"
            className="h-11 flex-1 rounded-full px-5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-sand sm:flex-none"
          >
            Открытые заявки ({open.length})
          </TabsTrigger>
          <TabsTrigger
            value="mine"
            className="h-11 flex-1 rounded-full px-5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-sand sm:flex-none"
          >
            Мои заказы ({mine.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="h-11 flex-1 rounded-full px-5 text-sm font-bold data-[state=active]:bg-ink data-[state=active]:text-sand sm:flex-none"
          >
            История ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6">
          {open.length > 0 ? (
            <OrderList
              orders={open}
              actions={(o) => (
                <Button className="rounded-full" onClick={() => handleAccept(o.number)}>
                  <Truck className="size-4" aria-hidden /> Принять заказ
                </Button>
              )}
            />
          ) : (
            <div className="rounded-2xl border bg-paper">
              <EmptyState
                icon={RefreshCw}
                title="Сейчас открытых заявок нет"
                description="Новые заявки появляются в течение дня. Проверь позже или обнови список — они подгружаются автоматически."
                actions={
                  <Button className="rounded-full" onClick={refreshOpen}>
                    Проверить снова
                  </Button>
                }
              />
            </div>
          )}
          {open.length > 0 && (
            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-live rounded-full bg-caspi" />
                <span className="relative inline-flex size-2 rounded-full bg-caspi" />
              </span>
              Новые заявки приходят сюда первыми
            </p>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          {mine.length > 0 ? (
            <OrderList
              orders={mine}
              actions={(o) => (
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  {o.status === "accepted" && (
                    <Button className="rounded-full" onClick={() => handleStart(o.number)}>
                      Взять в работу
                    </Button>
                  )}
                  {o.status === "in_progress" && (
                    <Button className="rounded-full" onClick={() => handleDeliver(o.number)}>
                      Заказ доставлен
                    </Button>
                  )}
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    {o.status === "accepted"
                      ? "Едем за грузом — статус виден отправителю"
                      : "Груз в пути — получатель следит за тобой"}
                  </p>
                </div>
              )}
            />
          ) : (
            <div className="rounded-2xl border bg-paper">
              <EmptyState
                icon={Truck}
                title="Пока нет взятых заказов"
                description="Прими заказ из открытых — он сразу появится здесь со всеми статусами."
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {history.length > 0 ? (
            <OrderList
              orders={history}
              actions={(o) => (
                <p className="text-sm font-bold text-success">
                  Доставлено · {fmtTenge(o.price)} на балансе
                </p>
              )}
            />
          ) : (
            <div className="rounded-2xl border bg-paper">
              <EmptyState
                icon={CircleCheck}
                title="История пуста"
                description="Доставленные заказы появятся здесь — вместе с начисленными суммами."
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}