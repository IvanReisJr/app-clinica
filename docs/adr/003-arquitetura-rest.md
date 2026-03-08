# ADR 003: Adoção de Arquitetura RESTful

## Status
Aceito

## Contexto
Precisamos prover uma interface de comunicação padronizada para o frontend atual (desenvolvido com React via Vite) e garantir que aplicações futuras (ex: Apps Mobile nativos, ou integração com parceiros de convênio) consigam interoperar com facilidade.

## Decisão
A comunicação Backend <-> Interfaces ocorrerá via web API seguindo os princípios de Design REST. O Django REST Framework será nossa ferramenta de implementação.

## Consequências
**Positivas:**
- Interface padronizada (Verbos HTTP claros: `GET`, `POST`, `PATCH`, `DELETE`).
- Desacoplamento total entre o Frontend e o Backend.
- Facilidade em escalar os nós de leitura e gravação independentemente da interface do usuário.
- Status codes previsíveis e uniformes.

**Negativas:**
- "Over-fetching" e "Under-fetching" eventuais comuns ao REST (ao invés do GraphQL), que podem requerer a criação de endpoints agregados pesados para relatórios. (Risco contido separando os endpoints de relatórios/dashboards).
