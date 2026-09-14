# Ajustes no template Resultado do Jogo

## O que será alterado
- Dar mais espaço entre os dois números e o “X”, mantendo o placar centralizado e legível.
- Adicionar um campo para editar o nome da equipe principal somente nesse template.
- Permitir enviar a logo da equipe principal e a do adversário; quando houver logo, ela substitui o nome correspondente.
- Criar áreas padronizadas para as duas logos e controles individuais de tamanho e posição para ajustes manuais.
- Adicionar a opção “Remover fundo automaticamente” ao envio de uma nova foto do atleta, usando o processamento já existente no sistema.

## Detalhes técnicos
- Ampliar os dados do template com nome personalizado, URLs das duas logos e ajustes de escala/posição.
- Atualizar a camada de placar para alternar automaticamente entre nome e logo e evitar compressão visual no placar.
- Adicionar uploads e controles no painel “Placar”, sem alterar outros templates.
- Preservar os novos campos ao salvar/reabrir templates e ao exportar PNG/JPG.
- Validar o resultado no editor em tela móvel e desktop.
