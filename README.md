# Escala Central

Aplicação estática para gestão de escalas de domingos e feriados, preparada para GitHub Pages e Cloud Firestore.

O painel é administrativo e não possui área de funcionários ou fluxo de solicitações. Os relatórios podem ser copiados como texto ou impressos.

## Equipe fixa e recomendações

- Cada funcionário pode possuir uma loja fixa.
- A equipe fixa é configurada diretamente no cartão da loja.
- A geração automática prioriza funcionários fixos, disponíveis e com menos domingos trabalhados.
- A recomendação não é obrigatória: na edição manual podem ser escolhidos funcionários de outras lojas.
- Um funcionário não pode ser escalado em duas lojas na mesma data.

## Lojas abertas ou fechadas

- No cadastro da loja, informe se ela abre aos domingos e/ou nos feriados.
- Se abre, informe o mínimo de funcionários; se está fechada, não gera escala naquela data.
- Os funcionários de lojas fechadas ficam livres e são realocados com prioridade para lojas abertas que faltarem equipe.
- Lojas antigas, sem essa informação, são tratadas como abertas.

## Relatórios

- Escala do mês, Por loja (escolha a loja, ou todas, e copie no formato WhatsApp) e Histórico de feriados.
- O histórico mostra quem trabalha em cada feriado e quem trabalhou no feriado anterior, destacando quem se repete.
- Ao gerar a escala de um mês com feriado, o sistema informa quem trabalhou no feriado anterior. Por padrão essas pessoas ficam fora da escala do feriado, mas é opcional: basta marcá-las para permitir.

## Disponibilidade

- A geração automática escala apenas quem está marcado como “Disponível” na data. “Indisponível” e “Não informado” não são escalados.
- Ao gerar, se houver funcionários com “Não informado”, o sistema avisa antes de continuar.
- A escala não é mais gerada sozinha ao abrir o sistema.

## Funcionários fixos na escala

- No cadastro da loja, “Funcionários fixos da loja na escala” define quantos fixos disponíveis são escalados. As vagas restantes vão primeiro para funcionários de lojas fechadas no dia, depois para os demais fixos da própria loja e, por último, para qualquer outro disponível.
- Lojas sem esse valor preenchido (cadastradas antes) continuam preenchendo toda a equipe com fixos.

## Funcionamento por data

- Na aba Calendário, o cartão “Funcionamento das lojas” lista os domingos e feriados do mês.
- Para cada data é possível manter o padrão das lojas, abrir escolhendo quais lojas ficam abertas, ou fechar todas as lojas.
- A escala gerada e o ajuste manual respeitam essa definição. Depois de alterar uma data, gere a escala do mês novamente.
- Fica salvo em `datas_especiais` com `tipo: FUNCIONAMENTO`.

## Ajuste manual

- Na aba Escala, “Ajustar equipe” lista quem está escalado na data, agrupado por loja.
- “Substituir” permite colocar alguém disponível no lugar ou trocar de lugar com quem está escalado em outra loja ou data. A troca é feita nas duas pontas.

## Estado inicial

O sistema carrega vazio: sem lojas, funcionários, feriados ou escalas de exemplo. Cadastre tudo pelo painel.

## Publicação

1. Envie `index.html` e `firebase.js` para a raiz do repositório.
2. Ative o GitHub Pages para a branch principal e a pasta raiz.
3. No Firebase, crie o banco Cloud Firestore.
4. Copie o conteúdo de `firestore.rules` para as regras do Firestore e publique.
5. Abra o site publicado e confirme o indicador “Firestore conectado”.

## Retenção

- Escalas de domingo: somente os três meses mais recentes.
- Escalas de feriado: histórico permanente em `historico_feriados`.
- A limpeza ocorre quando os dados são salvos após gerar uma nova escala.

## Segurança

O projeto foi solicitado sem login. Por isso, as regras permitem acesso público somente às coleções do sistema. Qualquer pessoa que acessar o site poderá alterar os dados. Ative o Firebase App Check antes do uso real.

## Coleções

`lojas`, `funcionarios`, `funcionario_loja`, `datas_especiais`, `disponibilidade_funcionario`, `escalas`, `escala_funcionarios`, `historico_feriados` e `logs`.
