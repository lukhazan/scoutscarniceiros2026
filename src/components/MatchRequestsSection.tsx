import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/team-data";
import {
  confirmMatchRequest,
  matchRequestsQueryOptions,
  rejectMatchRequest,
  requestStatusLabel,
  requestWhatsappLink,
  type MatchRequest,
} from "@/lib/agenda-data";

export function MatchRequestsSection() {
  const queryClient = useQueryClient();
  const { data: requests } = useQuery(matchRequestsQueryOptions);
  const [busy, setBusy] = useState<string | null>(null);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["match_requests"] });
    queryClient.invalidateQueries({ queryKey: ["team_events"] });
    queryClient.invalidateQueries({ queryKey: ["availability", "generated"] });
  }

  async function confirm(request: MatchRequest) {
    setBusy(request.id);
    try {
      await confirmMatchRequest(request);
      toast.success("Solicitação confirmada e jogo criado na agenda.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível confirmar.");
    } finally {
      setBusy(null);
    }
  }

  async function reject(request: MatchRequest) {
    setBusy(request.id);
    try {
      await rejectMatchRequest(request.id);
      toast.success("Solicitação recusada. A data segue disponível.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível recusar.");
    } finally {
      setBusy(null);
    }
  }

  const list = requests ?? [];

  return (
    <section className="mt-4 rounded-lg border border-border/60 bg-card p-4">
      <Label>Solicitações de amistoso</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        Pedidos recebidos pela página pública de horários.
      </p>

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nenhuma solicitação recebida.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/60 rounded-md border border-border/60">
          {list.map((request) => (
            <li key={request.id} className="px-3 py-3">
              <p className="text-sm font-semibold">{request.team_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(request.request_date)} · {request.start_time.slice(0, 5)} às{" "}
                {request.end_time.slice(0, 5)}
                {request.location ? ` · ${request.location}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {request.contact_name} · {request.whatsapp} · {requestStatusLabel[request.status]}
              </p>
              {request.notes && <p className="mt-1 text-xs">{request.notes}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {request.status === "pendente" && (
                  <>
                    <Button
                      className="h-10"
                      disabled={busy === request.id}
                      onClick={() => confirm(request)}
                    >
                      <Check className="mr-1 size-4" /> Confirmar
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10"
                      disabled={busy === request.id}
                      onClick={() => reject(request)}
                    >
                      <X className="mr-1 size-4" /> Recusar
                    </Button>
                  </>
                )}
                <Button asChild variant="ghost" className="h-10">
                  <a href={requestWhatsappLink(request)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-1 size-4" /> WhatsApp
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
