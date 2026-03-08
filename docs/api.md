# API do Sistema de Clínicas

A API REST do Sistema de Clínicas foi desenhada sobre o **Django REST Framework (DRF)**, seguindo as melhores práticas RESTful para possibilitar integrações seguras e escaláveis.

## Autenticação e Segurança
- **JWT (JSON Web Tokens):** Utilizado para manter a sessão da conexão React (Frontend) com o Django (Backend).
- **Roles / Groups:** O acesso aos endpoints é granular, validado pelas permissões `IsAuthenticated` e customizações atreladas aos grupos de usuários (Ex: `Admin`, `Doctor`, `Receptionist`).
- **CORS e CSRF:** Configurados rigorosamente no `settings.py` para permitir comunicação exclusiva via *origins* conhecidos (ex: domínio do Frontend Vue/React).

## Endpoints Sugeridos

Abaixo, a estrutura principal de URLs projetada para o MVP:

### Autenticação `api/auth/`
- `POST /api/auth/token/` - Obtém Token JWT de Acesso e Refresh.
- `POST /api/auth/token/refresh/` - Renova o Token JWT com base no Refresh Token.

### Gestão de Pacientes `api/patients/`
- `GET /api/patients/` - Lista pacientes (permite filtros por nome, CPF e paginação).
- `POST /api/patients/` - Cria um novo cadastro de paciente.
- `GET /api/patients/{id}/` - Retorna detalhes do paciente (histórico, LGPD log).
- `PATCH /api/patients/{id}/` - Atualiza informações do paciente.

### Prontuários e Atendimentos `api/records/`
- `GET /api/records/?patient_id={id}` - Lista prontuários/atendimentos passados do paciente associado.
- `POST /api/records/` - Adiciona registro evolutivo a um paciente (requer permissão de Profissional Clínico).

### Gestão de Agendamento `api/appointments/`
- `GET /api/appointments/?date=2024-11-20&doctor_id=4` - Visualiza agendamentos do dia por médico.
- `POST /api/appointments/` - Cria um agendamento novo, bloqueando o horário (verificando disponibilidade concorrente).
- `PATCH /api/appointments/{id}/status/` - Atualiza status (Confirmado, Chegou, Atendido, Cancelado).

### Faturamento e Dashboards `api/finance/` `api/dashboards/`
- `GET /api/dashboards/clinical/` - Retorna indicadores (Total de Atendimentos, Cancelamentos, Tempo Médio de Espera). *Nota: os cálculos pesados devem ser processados offline via Celery/Redis*.

## Tratamento de Erros
A API segue o padrão HTTP RFCs para status code (200, 201, 400, 401, 403, 404, 500) e retorna estruturas de objeto padronizadas contendo `error_code` e `message` detalhada.
