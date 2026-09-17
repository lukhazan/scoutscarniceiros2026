import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  navOrderQueryOptions,
  orderModules,
  saveNavOrder,
  NAV_ORDER_KEY,
  NAV_MODULES,
} from "@/lib/nav-modules";

/** Permite reorganizar (arrastar e soltar) a ordem dos módulos da navegação. */
export function NavOrderPanel() {
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery(navOrderQueryOptions);
  const [items, setItems] = useState(NAV_MODULES);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(orderModules(order));
  }, [order]);

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    setItems((prev) => {
      const next = [...prev];
      const from = next.findIndex((m) => m.id === fromId);
      const to = next.findIndex((m) => m.id === toId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function shift(id: string, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const i = next.findIndex((m) => m.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveNavOrder(items.map((m) => m.id));
      await queryClient.invalidateQueries({ queryKey: NAV_ORDER_KEY });
      toast.success("Ordem do menu salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Arraste para definir a ordem do menu. Nenhum módulo pode ser removido.
      </p>

      <ul className="space-y-1.5">
        {items.map((m, index) => {
          const Icon = m.icon;
          return (
            <li
              key={m.id}
              draggable
              onDragStart={() => setDragging(m.id)}
              onDragEnd={() => setDragging(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragging && move(dragging, m.id)}
              className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2"
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{m.label}</span>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  disabled={index === 0}
                  onClick={() => shift(m.id, -1)}
                  aria-label={`Mover ${m.label} para cima`}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  disabled={index === items.length - 1}
                  onClick={() => shift(m.id, 1)}
                  aria-label={`Mover ${m.label} para baixo`}
                >
                  ↓
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Button onClick={handleSave} disabled={saving} variant="secondary">
        {saving ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Save className="mr-2 size-4" />
        )}
        Salvar ordem do menu
      </Button>
    </div>
  );
}
