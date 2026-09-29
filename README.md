# Escala Central

Aplicação estática para gestão de escalas de domingos e feriados, preparada para GitHub Pages e Cloud Firestore.

O painel é administrativo e não possui área de funcionários ou fluxo de solicitações. Os relatórios podem ser copiados como texto ou impressos.

## Equipe fixa e recomendações

- Cada funcionário pode possuir uma loja fixa.
- A equipe fixa é configurada diretamente no cartão da loja.
- A geração automática prioriza funcionários fixos, disponíveis e com menos domingos trabalhados.
- A recomendação não é obrigatória: na edição manual podem ser escolhidos funcionários de outras lojas.
- Um funcionário não pode ser escalado em duas lojas na mesma data.

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
