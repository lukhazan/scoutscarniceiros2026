# Remoção automática de fundo na foto do jogador

Hoje, ao enviar a foto no cadastro/edição do elenco, a imagem é apenas recortada em quadrado e reduzida. A proposta é que, logo após o envio, o fundo seja removido automaticamente e reste só o atleta.

## Como vai funcionar

1. O admin escolhe o PNG/JPG normalmente.
2. Aparece um indicador "Removendo fundo…" no lugar da miniatura.
3. A foto volta já recortada, sem fundo, sobre o círculo do avatar.
4. Um botão "Usar foto original" permite desfazer a remoção caso o resultado fique ruim.
5. Se a remoção falhar, a foto original é usada e um aviso discreto é exibido — nunca bloqueia o cadastro.

## Abordagem técnica

Remoção no próprio navegador, sem custo por imagem e sem novo backend:

- Adicionar a biblioteca `@imgly/background-removal` (roda via WebAssembly/WebGPU no browser).
- Em `src/lib/player-photo.ts`, criar `fileToCutoutDataUrl(file)`:
  - valida tipo/tamanho como hoje (até 8 MB);
  - executa a remoção de fundo sobre o arquivo original;
  - passa o resultado pelo pipeline atual de recorte quadrado + redimensionamento para 256px;
  - exporta PNG com transparência (`canvas.toDataURL("image/png")` já preserva alfa).
- A função existente `fileToAvatarDataUrl` continua como fallback (foto original).
- Carregar a biblioteca com `import()` dinâmico dentro do handler, para não pesar no bundle inicial nem no SSR.

Na UI (`src/routes/_authenticated/elenco.tsx`):
- estado `processingPhoto` para o indicador de carregamento e para desabilitar "Salvar" durante o processo;
- guardar a versão original em memória para o botão "Usar foto original";
- nenhuma mudança no banco: continua salvando data URL PNG em `players.photo_url`.

`PlayerAvatar` já usa `object-cover` sobre `bg-secondary`, então o recorte transparente aparece bem tanto no elenco quanto nos rankings e no card de exportação.

## Observação

O primeiro uso baixa o modelo (alguns MB) e leva alguns segundos; depois fica em cache no navegador. Como só o admin envia fotos, isso não afeta quem apenas visualiza os rankings.
