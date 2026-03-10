# Sistema de Clínicas - Medtrace

## Visão Geral
O Medtrace é uma plataforma moderna e escalável desenvolvida para a gestão completa de clínicas médicas. O sistema abrange prontuários eletrônicos, agendamento de consultas, gestão de estoque e faturamento, agora com suporte total a **White Label** (Branding Customizável) e **Deploy via Docker**.

## Tecnologias Principais
- **Backend:** Python 3.12 + Django 6 + Django REST Framework
- **Frontend:** React + Vite + Tailwind CSS + Shadcn UI
- **Banco de Dados:** PostgreSQL (via Docker)
- **Containerização:** Docker + Docker Compose + Nginx

## Estrutura do Projeto
- `docs/setup.md`: Guia de instalação e execução do projeto.
- `GUIA_HOMOLOGACAO.md`: Guia específico para deploy em ambiente de QA/Produção.
- `resumo_para_amanha.txt`: Resumo técnico do estado atual do desenvolvimento.

## Módulos Implementados

### 🎨 Identidade Visual Dinâmica (White Label)
- Personalização total de Nome e Logo da clínica via painel de configurações.
- Branding automático em Login, Sidebar e Relatórios PDF.

### 📺 Painel de Chamada para TV
- Interface de alta fidelidade para recepção com alerta sonoro e relógio.
- Integração em tempo real com a fila de atendimento.

### 💊 Gestão de Estoque (Farmácia)
- Cadastro de medicamentos com gestão de lotes, validades e Kardex.
- Alertas de estoque baixo e relatórios de movimentação corrigidos.

## Início Rápido (Homologação)
```bash
# Clone o repositório
git clone https://github.com/IvanReisJr/app-clinica.git
cd app-clinica

# Suba tudo via Docker
docker-compose up -d --build

# Prepare o banco
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```
Acesse em: `http://localhost:8044`
