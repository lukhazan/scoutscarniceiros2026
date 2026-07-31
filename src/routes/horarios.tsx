import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, MessageCircle } from "lucide-react";
import teamLogo from "@/assets/team-logo.png";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/team-data";
import {
  availableSlotsQueryOptions,
  formatTime,
  interestWhatsappLink,
  isThursday,
  weekdayLabel,
  whatsappNumberQueryOptions,
} from "@/lib/agenda-data";

export const Route = createFileRoute("/horarios")({
  head: () => ({
    meta: [
      { title: "Horários disponíveis — Carniceiros Fut 7" },
      {
        name: "description",
        content: "Datas e horários livres do Carniceiros Fut 7 para marcar amistosos.",
      },
      { property: "og:title", content: "Horários disponíveis — Carniceiros Fut 7" },
      {
        property: "og:description",
        content: "Datas e horários livres do Carniceiros Fut 7 para marcar amistosos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HorariosPublicos,
});

function HorariosPublicos() {
  const { data: slots, isLoading } = useQuery(availableSlotsQueryOptions);
  const { data: phone } = useQuery(whatsappNumberQueryOptions);
  const thursdays = (slots ?? []).filter((s) => isThursday(s.event_date));


  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-xl px-4 pb-16 pt-10">
        <div className="flex flex-col items-center text-center">
          <img
            src={teamLogo}
            alt="Escudo do Carniceiros Fut 7"
            width={72}
            height={72}
            className="size-18 object-contain"
          />
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Horários disponíveis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Datas livres para marcar amistosos com o Carniceiros Fut 7.
          </p>
        </div>

        {thursdays.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl">Próximas quintas-feiras disponíveis</h2>
            <ul className="mt-3 space-y-3">
              {thursdays.map((slot) => (
                <li key={slot.id} className="rounded-lg border border-border/60 bg-card p-4">
                  <p className="font-semibold">
                    {formatDate(slot.event_date)}
                    {formatTime(slot.start_time) ? ` · ${formatTime(slot.start_time)}` : ""}
                    {formatTime(slot.end_time) ? ` às ${formatTime(slot.end_time)}` : ""}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {weekdayLabel(slot.event_date)}
                  </p>
                  {slot.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" /> {slot.location}
                    </p>
                  )}
                  {slot.notes && <p className="mt-1 text-sm text-muted-foreground">{slot.notes}</p>}
                  <Button asChild className="mt-3 h-11 w-full">
                    <a
                      href={interestWhatsappLink(slot, phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 size-4" /> Tenho interesse
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>

        ) : (slots ?? []).length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border/70 p-8 text-center">
            <CalendarDays className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum horário disponível no momento.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {(slots ?? []).map((slot) => (
              <li key={slot.id} className="rounded-lg border border-border/60 bg-card p-4">
                <p className="font-semibold">
                  {formatDate(slot.event_date)}
                  {formatTime(slot.start_time) ? ` · ${formatTime(slot.start_time)}` : ""}
                  {formatTime(slot.end_time) ? ` às ${formatTime(slot.end_time)}` : ""}
                </p>
                {slot.location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {slot.location}
                  </p>
                )}
                {slot.notes && <p className="mt-1 text-sm text-muted-foreground">{slot.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
