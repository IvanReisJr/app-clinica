# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.3.1] - 2026-03-19
### Corrigido
- **Interface e UX Global (Dark Mode Leak)**:
    - Desativação do modo escuro pelo sistema operacional (`darkMode: 'class'` no Tailwind) para forçar o sistema 100% no Modo Claro (Light Theme) em todos os ambientes.
    - Correção definitiva de "telas pretas" em `DialogContent`, `SelectContent` e `DropdownMenuContent`.
    - Ajuste de responsividade e alinhamento do componente `ScheduleConfig` (Duração do agendamento agora empilhada para maior intuitividade).
- **TypeScript e Build**:
    - Eliminação de mais de 50 erros de compilação (variáveis não lidas, imports incorretos do `apiClient`).
    - Exclusão de componentes não utilizados do Shadcn UI que causavam falhas no pipeline do Docker.
    - Refatoração dos tipos de agendamento na `AgendaPage` para suportar `full_name`.

## [1.3.0] - 2026-03-18
### Adicionado
- **Módulo de Faturamento (TISS/TUSS)**:
    - Criação do app backend `faturamento` com tabelas `BillingLot` e `BillingItem`.
    - Lógica de extração de agendamentos finalizados com convênio para a fila de controle.
    - Nova Tela no menu lateral: **Faturamento de Lotes**.
    - Implementação de abas para **Pendentes** e **Lotes Enviados**.
    - Mecânica de agrupar atendimentos e gerar blocos (Lotes) com 1 clique.
    - Tela de **Conciliação de Guias** em real-time (Botões: Pago, Glosa, Recurso).
- **Adequação do TUSS no Check-in (Agenda)**:
    - Inserção dos campos `procedimento_tuss`, `guia_number` e `authorization_number` no modelo `Appointment`.
    - Formulário dinâmico no Frontend: Ao selecionar Convênio, os inputs de faturamento do Check-in abrem imediatamente.

### Alterado
- **Agenda Multiponto**:
    - Bloqueio Dinâmico "Real-time" de Slots Antigos: Slots com horário antes do relógio atual mudam visualmente para Cinza com Badge "Expirado" instantaneamente na tela, ignorando lixo de cash.
    - Ajuste nos Ícones da tabela de Agenda (Sempre visíveis em vez de visíveis apenas no hover).
    - Campo *Observação* substituído por Textarea ampla com sombra interna (`shadow-inner`) e Dica Direta.

## [1.2.1] - 2026-03-17
### Adicionado
- **Módulo de Convênios**: Criação inicial do app backend para gestão de operadoras e tabelas TUSS.
- **Validação de Convênio em Pacientes**: Adicionada trava de segurança no formulário de pacientes para evitar glosa, tornando o Convênio obrigatório (ou Particular).

## [1.2.0] - 2026-03-10

### Adicionado
- **Configurações de Marca (White Label)**:
    - Novo app `system_settings` para armazenar Nome e Logo da clínica.
    - `SettingsContext` no frontend para propagação global da identidade visual.
    - Tela de configurações com upload de logo e visualização em tempo real.
- **Painel de Chamada TV**:
    - Rota `/painel` otimizada para televisores da recepção.
    - Efeito sonoro de chamada (Ding) com controle de áudio.
    - Relógio sincronizado e histórico de senhas em destaque.
- **Infraestrutura Docker Profissional**:
    - `Dockerfile` para Backend e Frontend (Nginx).
    - Orquestração completa via `docker-compose.yml`.
    - Suporte a múltiplos dispositivos via IP dinâmico no servidor.

### Alterado
- **Relatórios**:
    - Adicionado suporte a cabeçalhos dinâmicos com Logo e Nome da Clínica em todos os PDFs.
- **Prontuário**:
    - Visual mais compacto e IDs formatados (#00000X) para agilizar o atendimento.

### Corrigido
- Erros de dependências nativas no Docker (libcaido, pango).
- Bug de interpolação no relatório de Kardex.

## [1.1.0] - 2026-03-09
- **Módulo de Estoque (Farmácia)**:
    - CRUD completo de medicamentos com gestão de lotes e validade.
    - Implementação do **Kardex** (movimentações históricas) com filtros de data.
    - Modal Unificado de Movimentação (`GeneralMovementModal`) para Entradas, Saídas e Perdas.
    - Sistema de cálculo automático de saldo e validação de estoque negativo.
- **Módulo de Usuários e Perfis**:
    - Sistema de perfis (Roles): Administrador, Médico, Recepção, Enfermagem, Farmácia, Financeiro e Painel.
    - CRUD de usuários com gestão segura de senhas e campo `full_name`.
    - Página de listagem com busca em tempo real e filtros de status (Ativo/Inativo).
- **Interface e UX**:
    - Design premium com componentes customizados (Badges, Tooltips, Switches).
    - Layout de Dashboard responsivo com navegação lateral funcional.
    - Feedback visual com `sonner` para todas as operações.
- **Infraestrutura**:
    - Migração completa de Supabase para API Django REST própria.
    - Scripts de inicialização (`start.bat`, `start.ps1`) para facilitação do ambiente.
    - Migrações de banco de dados para os novos modelos de `medications` e `users`.
- Estrutura inicial do repositório de documentação e código base.
- Configuração de ambiente virtual automatizada.
- Registros de decisão arquitetural (ADR) para uso de Django, PostgreSQL e REST.
- Esqueleto de testes unitários básicos com Pytest.

### Alterado
- Refatoração do modelo de dados para suportar múltiplos perfis de acesso.
- Ajuste de lógica de movimentação no banco para garantir integridade do Kardex.

### Corrigido
- Problema de validação de `username` no Django (adicionado campo de nome completo).
- Erro no cálculo de saldo acumulado no relatório do Kardex.
- Ajustes críticos de layout e sobreposição de componentes no Dashboard.
