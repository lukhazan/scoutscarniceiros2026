## Objetivo

Substituir o bloco de notas por um app onde você faz login, cadastra o elenco, lança gols e assistências de cada jogo, e a tabela geral de artilharia/assistências se atualiza sozinha.

## Telas

1. **/ (Início)** — página pública com o nome do time, a tabela geral de estatísticas (somente leitura) e botão "Entrar".
2. **/auth** — login e cadastro por e-mail e senha (apenas você/administrador).
3. **/elenco** (protegida) — cadastrar, editar e remover jogadores (nome, apelido, posição, número).
4. **/jogos** (protegida) — lista de jogos lançados, com opção de editar ou excluir um lançamento.
5. **/jogos/novo** (protegida) — o formulário principal: escolhe a data e o adversário (opcional), depois marca quantos gols e assistências cada jogador do elenco fez naquele jogo. Ao salvar, a tabela principal recalcula automaticamente.

## Tabela principal

Duas tabelas separadas em formato de ranking ( Gols ) e ( Assistências) . Busca por nome e possibilidade de ordenar por cada coluna. Layout pensado para celular primeiro, já que você vai lançar direto do campo.

## Como funciona por dentro

- Backend com Lovable Cloud (banco de dados + login inclusos, sem contas externas).
- Tabelas: `players` (elenco), `matches` (jogos), `match_stats` (gols e assistências por jogador por jogo).
- Os totais nunca são digitados à mão: são somados a partir dos lançamentos, então corrigir um jogo antigo já corrige a tabela.
- Leitura pública da tabela; escrita apenas para o usuário autenticado, com políticas de segurança no banco.

## Detalhes técnicos

- TanStack Start com rotas protegidas em `_authenticated` e página inicial pública.
- Server functions para as escritas (jogos e elenco); leitura pública da tabela via cliente publicável com política SELECT para anônimos.
- Estatísticas agregadas por uma view/consulta no banco, para não recalcular no navegador.
- Zod validando os formulários (nome do jogador, quantidades não negativas).

## Fora do escopo (por agora)

Cartões, placar do jogo e vários usuários lançando — dá para adicionar depois.