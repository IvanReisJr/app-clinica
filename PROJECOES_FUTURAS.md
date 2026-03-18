# Projeções Futuras - Clínica Meditrace

Este arquivo contém ideias e melhorias sugeridas durante o desenvolvimento para implementação em fases futuras.

## Módulo de Medicamentos
- [ ] **Estoque Mínimo por Produto**: Adicionar um campo `min_stock` na tabela de medicamentos. Atualmente a regra é fixa em 20 unidades, mas cada produto deve ter seu próprio limite de alerta.
- [x] **Histórico de Movimentação (Kardex)**: Implementada a visualização completa de entradas e saídas e filtragem histórica.
- [ ] **Relatórios de Consumo**: Gerar gráficos de uso mensal para prever compras futuras.
- [ ] **Integração com Prontuário**: Abater automaticamente do estoque quando um medicamento for prescrito/administrado.

## Módulo de Usuários e Perfis
- [ ] **Redefinição de Senha Facilitada**: Interface para o Administrador resetar senhas de outros usuários rapidamente.
- [ ] **Logs de Auditoria**: Registro de quem alterou o quê (quem apagou um medicamento, quem cadastrou uma entrada, etc).
- [ ] **Vínculo Profissional**: Relacionar usuários do tipo 'Médico' a especialidades e horários de agendamento.

## Interface e UX
- [ ] **Dashboard de Alertas**: Uma visão geral na home que mostre quantos itens estão vencidos ou com estoque baixo sem precisar entrar na página de Medicamentos.
- [ ] **Notificações por E-mail/WhatsApp**: Avisar o responsável quando um estoque atingir o nível crítico.

## Segurança e Distribuição Comercial (Anti-Pirataria)
- [ ] **Transição de `git clone` para Docker Registry Privado**: No momento (desenvolvimento/homologação), o sistema é clonado inteiro em texto aberto. Para instalações finais (*On-Premise*) na máquina da clínica cliente, é fundamental **NÃO enviar o código fonte**.
    - **Solução**: Vamos compilar o Backend e Frontend em imagens binárias fechadas Docker (ex: `ivanreis/medtrace-backend:latest`).
    - O cliente terá apenas um arquivo `docker-compose.yml` de 30 linhas apontando para nosso repositório privado (Docker Hub/GHCR).
    - Ele rodará `docker-compose pull` para baixar a aplicação compilada sem acesso às regras de negócio, arquivos TypeScript ou Python, protegendo 100% a Propriedade Intelectual do Medtrace.
