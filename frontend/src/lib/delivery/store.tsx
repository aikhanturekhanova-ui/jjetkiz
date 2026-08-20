import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { apiClient } from "@/lib/apiClient";
import { calcPrice } from "./pricing";
import type { Priority, VehicleKind } from "./pricing";
import { findSettlement } from "./settlements";

export type OrderStatusKey =
  | "created"
  | "matching"
  | "offered"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  number: string;
  status: OrderStatusKey;
  fromId: string;
  toId: string;
  fromAddress?: string;
  toAddress?: string;
  vehicle: VehicleKind;
  vehicleName: string;
  weightKg: number;
  volumeM3: number | null;
  perishable: boolean;
  fragile: boolean;
  description?: string;
  priority: Priority;
  social: boolean;
  poputchik: boolean;
  price: number;
  savings: number;
  km: number;
  minutes: number;
  driverName?: string;
  driverPlate?: string;
  driverPhone?: string;
  backhaul?: boolean;
  mine: boolean;
  myOrder: boolean;
  createdAt: number;
  updatedAt: number;
  deliveredAt?: number;
  events: Partial<Record<OrderStatusKey, number>>;
}

export interface CreateOrderInput {
  fromId: string;
  toId: string;
  fromAddress?: string;
  toAddress?: string;
  vehicle: VehicleKind;
  weightKg: number;
  volumeM3?: number | null;
  perishable: boolean;
  fragile: boolean;
  description?: string;
  priority: Priority;
  social: boolean;
  poputchik: boolean;
}

const SEED_SAVINGS = 4_183_250;
const STORAGE_KEY = "jetkiz-store-v1";

const minutesAgo = (m: number) => Date.now() - m * 60_000;
const daysAgo = (d: number) => Date.now() - d * 86_400_000;

function seedOrders(): OrderItem[] {
  const ev = (o: OrderItem, key: OrderStatusKey, ts: number) => {
    o.events[key] = ts;
  };
  const base = {
    fromAddress: undefined,
    toAddress: undefined,
    volumeM3: null,
    perishable: false,
    fragile: false,
    description: undefined,
    priority: "normal" as Priority,
    social: false,
    poputchik: false,
    driverPlate: undefined,
    driverPhone: undefined,
    deliveredAt: undefined,
  };

  const open1: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0841",
    status: "offered",
    fromId: "aktau",
    toId: "zhanauzen",
    vehicle: "tent",
    vehicleName: "Фура-тент",
    weightKg: 8200,
    volumeM3: 22,
    description: "Запчасти для промысла, 5 паллет",
    priority: "high",
    price: 96_500,
    savings: 0,
    km: 168,
    minutes: 163,
    myOrder: false,
    mine: false,
    createdAt: minutesAgo(12),
    updatedAt: minutesAgo(12),
  };
  ev(open1, "created", minutesAgo(14));
  ev(open1, "matching", minutesAgo(13));
  ev(open1, "offered", minutesAgo(12));

  const open2: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0843",
    status: "offered",
    fromId: "aktau",
    toId: "kuryk",
    vehicle: "pickup",
    vehicleName: "Пикап",
    weightKg: 640,
    volumeM3: 1.2,
    description: "Документы и запчасти на порт",
    price: 14_800,
    savings: 0,
    km: 72,
    minutes: 70,
    myOrder: false,
    mine: false,
    createdAt: minutesAgo(5),
    updatedAt: minutesAgo(5),
  };
  ev(open2, "created", minutesAgo(7));
  ev(open2, "matching", minutesAgo(6));
  ev(open2, "offered", minutesAgo(5));

  const open3: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0840",
    status: "offered",
    fromId: "zhanauzen",
    toId: "aktau",
    vehicle: "fridge",
    vehicleName: "Рефрижератор",
    weightKg: 2100,
    volumeM3: 6,
    perishable: true,
    description: "Свежая рыба, 12 ящиков",
    price: 41_300,
    savings: 0,
    km: 168,
    minutes: 163,
    myOrder: false,
    mine: false,
    createdAt: minutesAgo(20),
    updatedAt: minutesAgo(20),
  };
  ev(open3, "created", minutesAgo(22));
  ev(open3, "matching", minutesAgo(21));
  ev(open3, "offered", minutesAgo(20));

  const open4: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0837",
    status: "offered",
    fromId: "aktau",
    toId: "beineu",
    vehicle: "tent",
    vehicleName: "Фура-тент",
    weightKg: 6400,
    volumeM3: 18,
    description: "Стройматериалы",
    price: 154_000,
    savings: 0,
    km: 460,
    minutes: 445,
    myOrder: false,
    mine: false,
    createdAt: minutesAgo(110),
    updatedAt: minutesAgo(110),
  };
  ev(open4, "created", minutesAgo(115));
  ev(open4, "matching", minutesAgo(112));
  ev(open4, "offered", minutesAgo(110));

  const open5: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0836",
    status: "offered",
    fromId: "fort",
    toId: "aktau",
    vehicle: "pickup",
    vehicleName: "Пикап",
    weightKg: 380,
    volumeM3: 0.8,
    description: "Продукты для магазина",
    price: 34_600,
    savings: 0,
    km: 235,
    minutes: 227,
    myOrder: false,
    mine: false,
    createdAt: minutesAgo(95),
    updatedAt: minutesAgo(95),
  };
  ev(open5, "created", minutesAgo(98));
  ev(open5, "matching", minutesAgo(96));
  ev(open5, "offered", minutesAgo(95));

  const mine1: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0838",
    status: "accepted",
    fromId: "zhetybai",
    toId: "aktau",
    vehicle: "tent",
    vehicleName: "Фура-тент",
    weightKg: 5400,
    volumeM3: 14,
    description: "Стройматериалы",
    price: 68_400,
    savings: 0,
    km: 86,
    minutes: 83,
    driverName: "Ты",
    driverPlate: "12 KZ 487 A",
    mine: true,
    myOrder: false,
    createdAt: minutesAgo(35),
    updatedAt: minutesAgo(8),
  };
  ev(mine1, "created", minutesAgo(40));
  ev(mine1, "matching", minutesAgo(36));
  ev(mine1, "offered", minutesAgo(30));
  ev(mine1, "accepted", minutesAgo(8));

  const mine2: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0835",
    status: "in_progress",
    fromId: "aktau",
    toId: "kuryk",
    vehicle: "fridge",
    vehicleName: "Рефрижератор",
    weightKg: 1800,
    volumeM3: 4.5,
    perishable: true,
    description: "Рыба для ресторана",
    price: 38_700,
    savings: 0,
    km: 72,
    minutes: 70,
    driverName: "Ты",
    driverPlate: "12 KZ 487 A",
    mine: true,
    myOrder: false,
    createdAt: minutesAgo(120),
    updatedAt: minutesAgo(50),
  };
  ev(mine2, "created", minutesAgo(125));
  ev(mine2, "matching", minutesAgo(121));
  ev(mine2, "offered", minutesAgo(115));
  ev(mine2, "accepted", minutesAgo(100));
  ev(mine2, "in_progress", minutesAgo(50));

  const hist1: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0834",
    status: "delivered",
    fromId: "zhanauzen",
    toId: "aktau",
    vehicle: "tent",
    vehicleName: "Фура-тент",
    weightKg: 9600,
    volumeM3: 26,
    description: "Оборудование с промысла",
    price: 88_200,
    savings: 0,
    km: 168,
    minutes: 163,
    driverName: "Ты",
    driverPlate: "12 KZ 487 A",
    mine: true,
    myOrder: false,
    createdAt: minutesAgo(260),
    updatedAt: minutesAgo(100),
    deliveredAt: minutesAgo(100),
  };
  ev(hist1, "created", minutesAgo(270));
  ev(hist1, "matching", minutesAgo(262));
  ev(hist1, "offered", minutesAgo(255));
  ev(hist1, "accepted", minutesAgo(250));
  ev(hist1, "in_progress", minutesAgo(240));
  ev(hist1, "delivered", minutesAgo(100));

  const hist2: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0830",
    status: "delivered",
    fromId: "aktau",
    toId: "munayly",
    vehicle: "pickup",
    vehicleName: "Пикап",
    weightKg: 150,
    volumeM3: 0.4,
    description: "Канцтовары",
    price: 8_000,
    savings: 0,
    km: 9,
    minutes: 12,
    driverName: "Ты",
    driverPlate: "12 KZ 487 A",
    mine: true,
    myOrder: false,
    createdAt: daysAgo(1) + 3 * 3_600_000,
    updatedAt: daysAgo(1) + 5 * 3_600_000,
    deliveredAt: daysAgo(1) + 5 * 3_600_000,
  };
  ev(hist2, "created", daysAgo(1) + 3 * 3_600_000);
  ev(hist2, "matching", daysAgo(1) + 3 * 3_600_000 + 60_000);
  ev(hist2, "offered", daysAgo(1) + 3 * 3_600_000 + 120_000);
  ev(hist2, "accepted", daysAgo(1) + 3 * 3_600_000 + 180_000);
  ev(hist2, "in_progress", daysAgo(1) + 3.5 * 3_600_000);
  ev(hist2, "delivered", daysAgo(1) + 5 * 3_600_000);

  const mineCustomer: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0839",
    status: "in_progress",
    fromId: "aktau",
    toId: "zhanauzen",
    vehicle: "fridge",
    vehicleName: "Рефрижератор",
    weightKg: 2400,
    volumeM3: 7,
    perishable: true,
    description: "Мороженая рыба для торговой точки",
    price: 52_300,
    savings: 0,
    km: 168,
    minutes: 163,
    driverName: "Болат",
    driverPlate: "12 KB 118 A",
    driverPhone: "+7 700 218 4456",
    myOrder: true,
    mine: false,
    createdAt: minutesAgo(200),
    updatedAt: minutesAgo(130),
  };
  ev(mineCustomer, "created", minutesAgo(205));
  ev(mineCustomer, "matching", minutesAgo(200));
  ev(mineCustomer, "offered", minutesAgo(190));
  ev(mineCustomer, "accepted", minutesAgo(175));
  ev(mineCustomer, "in_progress", minutesAgo(130));

  const custHist: OrderItem = {
    ...base,
    events: {},
    number: "JKZ-0832",
    status: "delivered",
    fromId: "aktau",
    toId: "beineu",
    vehicle: "tent",
    vehicleName: "Фура-тент",
    weightKg: 7800,
    volumeM3: 24,
    description: "Стройматериалы",
    price: 158_600,
    savings: 0,
    km: 460,
    minutes: 445,
    driverName: "Нурлан",
    driverPlate: "12 NQ 034 A",
    driverPhone: "+7 700 331 7782",
    myOrder: true,
    mine: false,
    createdAt: daysAgo(1) + 2 * 3_600_000,
    updatedAt: daysAgo(1) + 6 * 3_600_000,
    deliveredAt: daysAgo(1) + 6 * 3_600_000,
  };
  ev(custHist, "created", daysAgo(1) + 2 * 3_600_000);
  ev(custHist, "matching", daysAgo(1) + 2 * 3_600_000 + 300_000);
  ev(custHist, "offered", daysAgo(1) + 2 * 3_600_000 + 600_000);
  ev(custHist, "accepted", daysAgo(1) + 2 * 3_600_000 + 900_000);
  ev(custHist, "in_progress", daysAgo(1) + 3 * 3_600_000);
  ev(custHist, "delivered", daysAgo(1) + 6 * 3_600_000);

  return [mineCustomer, custHist, open1, open2, open3, open4, open5, mine1, mine2, hist1, hist2];
}

interface PersistedState {
  orders: OrderItem[];
  savings: number;
  seq: number;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && Array.isArray(parsed.orders) && typeof parsed.savings === "number") {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return { orders: seedOrders(), savings: SEED_SAVINGS, seq: 844 };
}

interface DeliveryApi {
  orders: OrderItem[];
  savings: number;
  apiState: "checking" | "online" | "demo";
  createOrder: (input: CreateOrderInput) => OrderItem;
  acceptOrder: (number: string) => void;
  startOrder: (number: string) => void;
  deliverOrder: (number: string) => void;
  deliverTrip: (number: string) => void;
  refreshOpen: () => void;
  addSavings: (n: number) => void;
  simulateGrowth: () => void;
}

const DeliveryContext = createContext<DeliveryApi | null>(null);

const POOL: Array<Pick<OrderItem, "fromId" | "toId" | "vehicle" | "vehicleName" | "weightKg" | "volumeM3" | "description" | "price" | "km" | "minutes">> = [
  { fromId: "aktau", toId: "shetpe", vehicle: "pickup", vehicleName: "Пикап", weightKg: 900, volumeM3: 2, description: "Стройматериалы на точку", price: 22_800, km: 120, minutes: 116 },
  { fromId: "zhanauzen", toId: "zhetybai", vehicle: "pickup", vehicleName: "Пикап", weightKg: 450, volumeM3: 1, description: "Продукты", price: 15_200, km: 71, minutes: 69 },
  { fromId: "aktau", toId: "fort", vehicle: "tent", vehicleName: "Фура-тент", weightKg: 5200, volumeM3: 15, description: "Мебель и бытовая техника", price: 92_400, km: 235, minutes: 227 },
  { fromId: "beineu", toId: "aktau", vehicle: "tent", vehicleName: "Фура-тент", weightKg: 7100, volumeM3: 20, description: "Оборудование", price: 161_800, km: 460, minutes: 445 },
  { fromId: "aktau", toId: "zhanauzen", vehicle: "pickup", vehicleName: "Пикап", weightKg: 720, volumeM3: 1.8, description: "Запчасти", price: 31_900, km: 168, minutes: 163 },
];

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [apiState, setApiState] = useState<"checking" | "online" | "demo">("checking");
  const customerIdRef = useRef<string | null>(null);
  const seqRef = useRef(state.seq);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — demo continues in memory
    }
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setApiState((s) => (s === "checking" ? "demo" : s));
    }, 3000);
    (async () => {
      try {
        const health = await apiClient.health();
        if (cancelled || health.status !== "healthy") return;
        setApiState("online");
        try {
          const users = await apiClient.users();
          const customer = users.find((u) => u.role === "customer");
          if (customer) customerIdRef.current = customer.id;
        } catch {
          // users endpoint unreachable — createOrder will skip the API call
        }
      } catch {
        if (!cancelled) setApiState("demo");
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  const postToApi = useCallback((order: OrderItem) => {
    const customerId = customerIdRef.current;
    if (!customerId) return;
    const from = findSettlement(order.fromId);
    const to = findSettlement(order.toId);
    if (!from || !to) return;
    apiClient
      .createOrder({
        customer_id: customerId,
        status: "created",
        point_a_lat: from.lat,
        point_a_lng: from.lng,
        point_a_address: order.fromAddress ?? from.name,
        point_b_lat: to.lat,
        point_b_lng: to.lng,
        point_b_address: order.toAddress ?? to.name,
        cargo_weight_kg: order.weightKg,
        cargo_volume_m3: Math.max(0.1, order.volumeM3 ?? 0.5),
        is_perishable: order.perishable,
        is_fragile: order.fragile,
        cargo_description: order.description ?? null,
        priority_level: order.priority === "high" ? "high" : "normal",
        is_social_priority: order.social,
        price_offer: order.price,
        estimated_delivery_minutes: order.minutes,
        is_ltl_group: order.poputchik,
      })
      .catch(() => undefined);
  }, []);

  const createOrder = useCallback(
    (input: CreateOrderInput): OrderItem => {
      const from = findSettlement(input.fromId);
      const to = findSettlement(input.toId);
      if (!from || !to) throw new Error("Маршрут не выбран");

      const breakdown = calcPrice({
        from,
        to,
        vehicle: input.vehicle,
        weightKg: input.weightKg,
        perishable: input.perishable,
        fragile: input.fragile,
        priority: input.priority,
        social: input.social,
        poputchik: input.poputchik,
      });

      const seq = seqRef.current + 1;
      seqRef.current = seq;
      const now = Date.now();
      const order: OrderItem = {
        number: `JKZ-${seq}`,
        status: "matching",
        fromId: input.fromId,
        toId: input.toId,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        vehicle: input.vehicle,
        vehicleName:
          input.vehicle === "pickup" ? "Пикап" : input.vehicle === "tent" ? "Фура-тент" : "Рефрижератор",
        weightKg: input.weightKg,
        volumeM3: input.volumeM3 ?? null,
        perishable: input.perishable,
        fragile: input.fragile,
        description: input.description,
        priority: input.priority,
        social: input.social,
        poputchik: input.poputchik,
        price: breakdown.total,
        savings: breakdown.savings,
        km: breakdown.km,
        minutes: Math.round((breakdown.km / 62) * 60),
        mine: false,
        myOrder: true,
        createdAt: now,
        updatedAt: now,
        events: { created: now, matching: now },
      };

      setState((prev) => ({ ...prev, seq, orders: [order, ...prev.orders] }));
      if (breakdown.savings > 0) {
        setState((prev) => ({ ...prev, savings: prev.savings + breakdown.savings }));
      }
      postToApi(order);
      return order;
    },
    [postToApi]
  );

  const mutateOrder = useCallback((number: string, fn: (o: OrderItem) => OrderItem) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.number === number ? fn(o) : o)),
    }));
  }, []);

  const acceptOrder = useCallback(
    (number: string) => {
      const now = Date.now();
      mutateOrder(number, (o) => ({
        ...o,
        status: "accepted",
        driverName: "Ты",
        driverPlate: "12 KZ 487 A",
        mine: true,
        updatedAt: now,
        events: { ...o.events, accepted: now },
      }));
    },
    [mutateOrder]
  );

  const startOrder = useCallback(
    (number: string) => {
      const now = Date.now();
      mutateOrder(number, (o) => ({
        ...o,
        status: "in_progress",
        updatedAt: now,
        events: { ...o.events, in_progress: now },
      }));
    },
    [mutateOrder]
  );

  const deliverOrder = useCallback(
    (number: string) => {
      const now = Date.now();
      mutateOrder(number, (o) => ({
        ...o,
        status: "delivered",
        deliveredAt: now,
        updatedAt: now,
        events: { ...o.events, delivered: now },
      }));
    },
    [mutateOrder]
  );

  const deliverTrip = useCallback((number: string) => {
    setState((prev) => {
      const target = prev.orders.find((o) => o.number === number);
      if (!target || target.status !== "in_progress") return prev;
      const now = Date.now();
      const orders = prev.orders.map((o) =>
        o.number === number
          ? {
              ...o,
              status: "delivered" as const,
              deliveredAt: now,
              updatedAt: now,
              events: { ...o.events, delivered: now },
            }
          : o
      );
      let next: PersistedState = { ...prev, orders };
      const hasReverse = prev.orders.some(
        (o) => o.status === "offered" && o.fromId === target.toId && o.toId === target.fromId
      );
      if (!hasReverse) {
        const seq = seqRef.current + 1;
        seqRef.current = seq;
        const backhaulOrder: OrderItem = {
          fromAddress: undefined,
          toAddress: undefined,
          volumeM3: target.volumeM3,
          perishable: false,
          fragile: false,
          description: "Обратный груз — товары для обратной дороги",
          priority: "normal",
          social: false,
          poputchik: false,
          driverPlate: undefined,
          driverPhone: undefined,
          deliveredAt: undefined,
          driverName: undefined,
          events: { created: now, matching: now, offered: now },
          number: `JKZ-${seq}`,
          status: "offered",
          fromId: target.toId,
          toId: target.fromId,
          vehicle: target.vehicle,
          vehicleName: target.vehicleName,
          weightKg: Math.max(150, Math.round(target.weightKg * 0.55)),
          price: Math.max(5_000, Math.round((target.price * 0.75) / 100) * 100),
          savings: 0,
          km: target.km,
          minutes: target.minutes,
          backhaul: true,
          mine: false,
          myOrder: false,
          createdAt: now,
          updatedAt: now,
        };
        next = { ...next, seq, orders: [backhaulOrder, ...orders] };
      }
      const saving = Math.round(target.price * 0.15);
      next = { ...next, savings: next.savings + saving };
      return next;
    });
  }, []);

  const refreshOpen = useCallback(() => {
    setState((prev) => {
      const openCount = prev.orders.filter((o) => o.status === "offered").length;
      if (openCount >= 8) return prev;
      const used = new Set(prev.orders.map((o) => `${o.fromId}→${o.toId}`));
      const pool = POOL.filter((p) => !used.has(`${p.fromId}→${p.toId}`));
      const template = pool[Math.floor(Math.random() * pool.length)] ?? POOL[0];
      const seq = seqRef.current + 1;
      seqRef.current = seq;
      const now = Date.now();
      const order: OrderItem = {
        ...template,
        number: `JKZ-${seq}`,
        status: "offered",
        perishable: template.vehicle === "fridge",
        fragile: false,
        priority: Math.random() < 0.25 ? "high" : "normal",
        social: false,
        poputchik: false,
        savings: 0,
        driverPlate: undefined,
        driverPhone: undefined,
        deliveredAt: undefined,
        driverName: undefined,
        mine: false,
        myOrder: false,
        createdAt: now,
        updatedAt: now,
        events: { created: now, matching: now, offered: now },
      };
      return { ...prev, seq, orders: [order, ...prev.orders] };
    });
  }, []);

  const addSavings = useCallback((n: number) => {
    if (n <= 0) return;
    setState((prev) => ({ ...prev, savings: prev.savings + n }));
  }, []);

  const simulateGrowth = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    const delta = 25 + Math.floor(Math.random() * 180);
    setState((prev) => ({ ...prev, savings: prev.savings + delta }));
  }, []);

  const value = useMemo<DeliveryApi>(
    () => ({
      orders: state.orders,
      savings: state.savings,
      apiState,
      createOrder,
      acceptOrder,
      startOrder,
      deliverOrder,
      deliverTrip,
      refreshOpen,
      addSavings,
      simulateGrowth,
    }),
    [state, apiState, createOrder, acceptOrder, startOrder, deliverOrder, deliverTrip, refreshOpen, addSavings, simulateGrowth]
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery(): DeliveryApi {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used within DeliveryProvider");
  return ctx;
}