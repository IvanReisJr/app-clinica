# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
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
