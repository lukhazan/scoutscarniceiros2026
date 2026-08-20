import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_EDITABLE_FIELDS,
  QUICK_FIELDS,
  type QuickField,
} from "@/lib/studio/saved-templates";

export type SaveTemplateSubmit = {
  name: string;
  editableFields: QuickField[];
  mode: "create" | "update";
};

/**
 * Salva a composição atual do Estúdio Avançado como um template reutilizável,
 * definindo quais campos ficam liberados no Modo Arte Rápida.
 */
export function SaveTemplateDialog({
  open,
  onOpenChange,
  initialName,
  initialFields,
  canUpdate,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string;
  initialFields?: QuickField[];
  canUpdate: boolean;
  saving: boolean;
  onSubmit: (value: SaveTemplateSubmit) => void;
}) {
  const [name, setName] = useState(initialName);
  const [fields, setFields] = useState<QuickField[]>(
    initialFields ?? DEFAULT_EDITABLE_FIELDS,
  );

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setFields(initialFields ?? DEFAULT_EDITABLE_FIELDS);
  }, [open, initialName, initialFields]);

  function toggle(id: QuickField, on: boolean) {
    setFields((prev) => (on ? [...new Set([...prev, id])] : prev.filter((f) => f !== id)));
  }

  function submit(mode: "create" | "update") {
    const clean = name.trim();
    if (!clean) return;
    onSubmit({ name: clean, editableFields: fields, mode });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como template</DialogTitle>
          <DialogDescription>
            A composição completa é guardada. Marque abaixo somente o que poderá ser
            trocado no Modo Arte Rápida — o restante fica travado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Nome do template
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="GOL — PADRÃO 01"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Campos editáveis
            </Label>
            <div className="space-y-1 rounded-lg border border-border/60 p-2">
              {QUICK_FIELDS.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm">{f.label}</span>
                  <Switch
                    checked={fields.includes(f.id)}
                    onCheckedChange={(v) => toggle(f.id, v)}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tudo que ficar desligado é considerado fixo (fundo, logo, tipografia,
              posições e demais elementos permanecem como você deixou).
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {canUpdate ? (
            <Button variant="secondary" disabled={saving} onClick={() => submit("update")}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Salvar alterações
            </Button>
          ) : null}
          <Button disabled={saving} onClick={() => submit("create")}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {canUpdate ? "Salvar como novo" : "Salvar template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
