import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CircleCheck,
  MapPin,
  Phone,
  Route,
  ShieldCheck,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavingsCounter } from "@/components/savings-counter";
import { RegionMap } from "@/components/region-map";
import { OrderList } from "@/components/order-card";
import { useDelivery } from "@/lib/delivery/store";
import { VEHICLE_LIST } from "@/lib/delivery/pricing";
import { fmtTenge } from "@/lib/delivery/format";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold tracking-[0.2em] text-caspi uppercase">{children}</p>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{desc}</p>}
    </div>
  );
}

const ROUTES = [
  { from: "Актау", to: "Жанаозен", time: "4 ч", km: "168 км", price: 45_100 },
  { from: "Актау", to: "Бейнеу", time: "6,5 ч", km: "460 км", price: 158_700 },
  { from: "Актау", to: "Форт-Шевченко", time: "5,5 ч", km: "235 км", price: 67_500 },
  { from: "Актау", to: "Курык", time: "1,5 ч", km: "72 км", price: 14_800 },
  { from: "Жанаозен", to: "Бейнеу", time: "4 ч", km: "320 км", price: 108_800 },
  { from: "Актау", to: "Шетпе", time: "2 ч", km: "120 км", price: 25_100 },
];

const STEPS = [
  {
    icon: MapPin,
    title: "Создаю заявку",
    desc: "Выбираю, откуда и куда поедет груз, указываю вес и что внутри. Уходит две минуты.",
  },
  {
    icon: Wallet,
    title: "Получаю живую цену",
    desc: "AI считает маршрут, машину, погоду и попутки — цена фиксируется до подтверждения.",
  },
  {
    icon: Route,
    title: "Слежу за грузом",
    desc: "Вижу машину на карте или получаю статусы по SMS — даже при слабом интернете.",
  },
];

const FAQ = [
  {
    q: "Как быстро найдётся водитель?",
    a: "Заявка сразу уходит всем подходящим водителям в регионе. Обычно первые отклики приходят за 5–10 минут, и можно выбрать лучшее предложение.",
  },
  {
    q: "Почему цена может отличаться?",
    a: "Цена зависит от маршрута, веса, машины и сезона. В плохую погоду дорога может занять больше времени — AI учитывает это заранее и предупреждает до создания заявки.",
  },
  {
    q: "Что такое попутные доставки?",
    a: "Если груз едет по маршруту, где уже есть машина, AI предлагает отправить его попутно со скидкой до 30%. Груз едет чуть дольше — зато заметно дешевле.",
  },
  {
    q: "Что будет, если груз повредят?",
    a: "Каждая заявка застрахована на сумму до 3 000 000 ₸. Если с грузом что-то случится по вине перевозчика, компенсация покрывает убытки.",
  },
  {
    q: "Как оплатить доставку?",
    a: "Оплата проходит после доставки — наличными водителю или переводом на баланс. Предоплата не требуется.",
  },
  {
    q: "Как отменить заявку?",
    a: "Открой заявку и нажми «Отменить заявку». Если водитель ещё не выехал — отмена бесплатная. Если уже в пути — вернём часть суммы.",
  },
];

export function HomePage() {
  const { orders } = useDelivery();
  const { lite } = useMode();
  const openOrders = orders.filter((o) => o.status === "offered").slice(0, 2);

  return (
    <div>
      <section className="container-site grid items-center gap-10 pt-10 pb-16 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-1.5 text-xs font-bold text-muted-foreground">
            <Truck className="size-3.5 text-caspi" aria-hidden />
            Доставка грузов · Мангистау
          </p>
          <h1 className="mt-6 text-[2.1rem] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-5xl lg:text-[3.4rem]">
            Доставлю груз по Мангистау — <span className="text-caspi">в день отгрузки.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Создаю заявку за две минуты: маршрут, груз, живая цена. AI объединяет попутные рейсы и
            экономит до 30% — сервис уже тикает.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <Link to="/order/new">Создать заявку</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
              <Link to="/track">Отследить заказ</Link>
            </Button>
          </div>
          <p className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-caspi" aria-hidden /> Страховка груза до 3 000 000 ₸
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-caspi" aria-hidden /> Проверенные водители
            </span>
          </p>
        </div>
        <SavingsCounter />
      </section>

      <section id="how" className="border-t border-line py-14 sm:py-20">
        <div className="container-site">
          <SectionTitle
            eyebrow="Как это работает"
            title="От заявки до машины — три шага"
            desc="Никаких звонков и ожидания на линии. Всё происходит в заявке."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border bg-paper p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-caspi">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-sm font-semibold text-line">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="routes" className="border-t border-line py-14 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <RegionMap className="aspect-[4/3] max-h-[460px] w-full" />
          </div>
          <div className="order-1 lg:order-2">
            <SectionTitle
              eyebrow="Куда везём"
              title="Популярные маршруты"
              desc="Цена от — для пикапа с грузом до 1,5 т. Точную цену рассчитает AI при создании заявки."
            />
            <ul className="mt-8">
              {ROUTES.map((r) => (
                <li key={`${r.from}${r.to}`} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5 last:border-b-0">
                  <div>
                    <p className="font-bold">
                      {r.from} <ArrowRight className="inline size-4 text-caspi" aria-hidden /> {r.to}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.time} · {r.km}
                    </p>
                  </div>
                  <p className="tnum shrink-0 font-extrabold">от {fmtTenge(r.price)}</p>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/order/new">Рассчитать мою цену</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="tariffs" className="border-t border-line py-14 sm:py-20">
        <div className="container-site">
          <SectionTitle
            eyebrow="Тарифы"
            title="Три машины — под любой груз"
            desc="Цена фиксируется при создании заявки и не меняется в пути."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {VEHICLE_LIST.map((v) => (
              <div key={v.id} className="flex flex-col rounded-2xl border bg-paper p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-caspi">
                    {v.id === "pickup" ? (
                      <Truck className="size-5" aria-hidden />
                    ) : v.id === "tent" ? (
                      <Boxes className="size-5" aria-hidden />
                    ) : (
                      <Zap className="size-5" aria-hidden />
                    )}
                  </span>
                  <p className="text-[13px] font-bold text-muted-foreground">{v.hint}</p>
                </div>
                <h3 className="mt-5 text-lg font-extrabold tracking-tight">{v.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                <p className="tnum mt-5 text-2xl font-extrabold tracking-tight">
                  от {fmtTenge(v.ratePerKm)}/км
                </p>
                <p className="mt-1 text-xs text-muted-foreground">минимальная заявка {fmtTenge(v.minPrice)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="drivers" className="border-t border-line py-14 sm:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="Водителям"
              title="Беру заказы рядом с собой — без простоев"
            />
            <ul className="mt-7 space-y-4">
              <li className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-caspi" aria-hidden />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Заявки по всему Мангистау.</span> Вижу
                  только подходящие по машине и направлению.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-caspi" aria-hidden />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Оплата сразу после доставки.</span> Деньги
                  приходят на баланс, вывод в любой момент.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-caspi" aria-hidden />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Страховка груза до 3 000 000 ₸.</span> Груз
                  застрахован — спорные случаи решаем за 24 часа.
                </p>
              </li>
            </ul>
            <Button asChild className="mt-8 h-12 rounded-full px-7 text-base">
              <Link to="/board">Смотреть заявки</Link>
            </Button>
          </div>

          <div className={cn(lite && "border-t border-line pt-6")}>
            <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Сейчас открыто
            </p>
            {openOrders.length > 0 ? (
              <div className="mt-4">
                <OrderList orders={openOrders} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Заявок на этот момент нет — но они появляются в течение дня.
              </p>
            )}
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3.5" aria-hidden /> Для тех, кто без интернета: заявки приходят и
              по SMS.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-line py-14 sm:py-20">
        <div className="container-site max-w-3xl">
          <SectionTitle eyebrow="Вопросы" title="Частые вопросы" />
          <div className="mt-8">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-line">
                <summary className="flex items-center justify-between gap-4 py-5 font-bold">
                  {item.q}
                  <span className="text-caspi" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-sand sm:p-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Груз уже ждёт отправки?</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-sand/60 sm:text-base">
              Создай заявку — водитель найдётся за 10 минут. В лёгком режиме всё тоже работает: без
              карт, но с полными статусами.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 shrink-0 rounded-full bg-paper px-7 text-base text-ink hover:bg-paper/90"
          >
            <Link to="/order/new">Создать заявку</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}