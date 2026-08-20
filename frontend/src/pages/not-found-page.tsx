import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export function NotFoundPage() {
  return (
    <div className="container-site max-w-2xl py-14 sm:py-24">
      <EmptyState
        icon={Compass}
        title="Страница не найдена"
        description="Такой страницы здесь нет. Проверь адрес или начни с главной — там всё нужное."
        actions={
          <Button asChild className="h-12 rounded-full px-6 text-base">
            <Link to="/">На главную</Link>
          </Button>
        }
      />
    </div>
  );
}