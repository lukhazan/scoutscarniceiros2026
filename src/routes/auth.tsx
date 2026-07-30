import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Súmula do time" },
      { name: "description", content: "Acesso do administrador para lançar jogos do time." },
      { property: "og:title", content: "Entrar — Súmula do time" },
      { property: "og:description", content: "Acesso do administrador para lançar jogos." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/jogos", replace: true });
    });
  }, [navigate]);

  async function submit(mode: "login" | "signup") {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: "/jogos", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/jogos", replace: true });
        } else {
          toast.success("Conta criada! Confirme o e-mail para entrar.");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/jogos", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="font-display text-3xl">
        Súmula
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">Acesso de quem lança os jogos</p>

      <div className="mt-6 w-full max-w-sm rounded-xl border border-border/60 bg-card p-5">
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          {(["login", "signup"] as const).map((mode) => (
            <TabsContent key={mode} value={mode} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`email-${mode}`}>E-mail</Label>
                <Input
                  id={`email-${mode}`}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`password-${mode}`}>Senha</Label>
                <Input
                  id={`password-${mode}`}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => submit(mode)}>
                {mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </TabsContent>
          ))}
        </Tabs>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" disabled={busy} onClick={signInWithGoogle}>
          Continuar com Google
        </Button>
      </div>
    </div>
  );
}
