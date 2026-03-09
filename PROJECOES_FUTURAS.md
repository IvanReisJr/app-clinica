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
