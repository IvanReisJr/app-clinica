# Sistema de Clínicas

## Visão Geral
O Sistema de Clínicas é uma plataforma moderna e escalável desenvolvida para a gestão completa de clínicas médicas. O sistema abrange prontuários eletrônicos, agendamento de consultas, gestão de estoque e faturamento, garantindo total conformidade com a LGPD e padrões de saúde (como a base estrutural adaptável para HIPAA).

## Tecnologias Principais
- **Backend:** Python + Django + Django REST Framework
- **Frontend:** React + Vite (via integração com projeto frontend separado)
- **Banco de Dados:** PostgreSQL (SQLite para desenvolvimento local)
- **Testes:** Pytest

## Estrutura do Projeto
Consulte a pasta `docs/` para obter informações detalhadas sobre a arquitetura do sistema, configuração do ambiente e decisões de design.

- `docs/setup.md`: Guia de instalação e execução do projeto.
- `docs/architecture.md`: Arquitetura do sistema (Backend e Frontend).
- `docs/api.md`: Documentação das interfaces da API REST.
- `docs/roadmap.md`: Próximos passos e backlog de produto.
- `docs/adr/`: Registros de Decisões Arquitetônicas (Architecture Decision Records).

## Módulos Implementados

### 💊 Gestão de Estoque (Farmácia)
- Cadastro de medicamentos com gestão de lotes, validades e estoques mínimos.
- **Kardex Unificado:** Visualização completa de entradas e saídas.
- Modal inteligente para lançamentos de estoque fácil.

### 👥 Usuários e Perfis
- Role-based Access Control (RBAC) com suporte a múltiplos cargos (Administrador, Médicos, etc).
- Cadastro refinado com separação de Login e Nome Completo.
- Filtros avançados e status de usuário.

### 🎨 UI/UX
- Sistema visual premium baseado em componentes customizados com Tailwind CSS.
- Dashboard unificado e responsivo para desktop.

## Início Rápido
Consulte [docs/setup.md](docs/setup.md) para configurar o projeto localmente.

```bash
# Clone e entre no repositório
cd f:\_Projetos\Joao\Clinica_1\app_clinica

# Ative o ambiente virtual
.\venv\Scripts\activate

# Instale as dependências (quando requirements.txt estiver disponível)
pip install -r requirements.txt
```
