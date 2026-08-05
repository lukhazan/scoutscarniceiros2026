# Ajustes no Estúdio de Artes

Duas mudanças na página `/estudio`, aba "Estúdio".

## 1. Pré-visualização não atualiza

A causa exata ainda não está confirmada — a prévia e o nó de exportação compartilham o mesmo elemento React, e o contêiner usa escala por CSS (`container query`), o que pode fazer o navegador não repintar a área ao trocar textos/imagens.

Passos:
1. Reproduzir na página real (abrir o estúdio, alterar atleta, gols e texto) e observar se o DOM da prévia muda e se apenas a pintura fica congelada.
2. Corrigir conforme o achado. Se for o caso da escala/contêiner, trocar a técnica de escala do preview por um wrapper com `transform: scale()` calculado a partir da largura medida do contêiner (com `ResizeObserver`), renderizando a arte da prévia como instância própria em vez de reutilizar o mesmo nó do bloco de exportação.
3. Validar que cada campo (atleta, gols, título, subtítulo, fundo, foto) reflete imediatamente na prévia.

## 2. Foto do atleta: importação manual

Hoje a arte puxa automaticamente a foto do elenco. Passa a funcionar assim:

- A arte não usa mais `photo_url` do atleta.
- No bloco "Imagem" entra um novo campo "Foto do atleta", com o mesmo seletor já usado no fundo (enviar arquivo ou escolher da biblioteca de mídia).
- Se nenhuma foto for enviada, a arte mostra o espaço reservado atual (círculo com a inicial do nome), sem quebrar o layout.
- O enquadramento continua automático (sem distorção), como já é hoje.

## Detalhes técnicos

- `src/lib/studio/templates.tsx`: adicionar `playerPhotoUrl: string | null` em `ArtData`; `PlayerFigure` passa a receber essa URL em vez de ler `player.photo_url`; incluir o campo `playerPhoto` na lista de `fields`.
- `src/components/studio/ArtStudioPanel.tsx`: novo estado inicial com `playerPhotoUrl: null`, novo `<MediaPicker label="Foto do atleta" category="atleta" />`, remoção do texto que fala em foto automática, e ajuste do preview conforme o passo 1.
- `src/lib/studio-data.ts`: incluir a categoria `atleta` em `MediaCategory` se ainda não existir (verificar antes de alterar).
