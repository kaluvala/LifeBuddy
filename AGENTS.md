# Global Agents Blueprint & Conventions (AGENTS.md)

This file represents the **Static Global Context** for the Life Buddy development workspace. All agents read this configuration on startup to align with the core conventions, folder directory, security constraints, and technical stack definitions.

---

## 1. Core Technical Stack
*   **Frontend:** React.js (built in a responsive, accessible layout utilizing modern design principles like glassmorphism and tailored dark modes). Packaged using **Tauri** for desktop distribution.
*   **Backend:** Python **FastAPI** serving as the asynchronous microservices routing engine.
*   **Orchestration:** Google **Agent Development Kit (ADK 2.0)** for graph-based, multi-agent communication.
*   **Database:** **PostgreSQL** with the `pgvector` extension for storing relational data and semantic vector embeddings.
*   **Integrations:** **Model Context Protocol (MCP)** for secure external tool execution (e.g. Gmail/Google Calendar MCP).

---

## 2. Directory Directory Index
```
workspace/
├── AGENTS.md               # [THIS FILE] Global Static project rules and coding stylebooks
├── WORKSPACE_MEM.md        # Global Dynamic sprint task tracking and message bus
├── implementation_plan.md  # Architectural overview and design documentation
├── architecture_plan.md    # Microservices and security interaction design
├── agents/                 # Scoped directories for the 7 SDLC Agents
│   ├── product_owner/      # Product Owner Agent folder (role.md, recent_memory.md)
│   ├── business_analyst/   # Business Analyst Agent folder
│   ├── ux_designer/        # UX Designer Agent folder
│   ├── tech_lead/          # Tech Lead / Architect Agent folder
│   ├── developer/          # Developer Agent folder
│   ├── qa_engineer/        # QA Engineer Agent folder
│   └── release_manager/    # Release Manager Agent folder
├── src/                    # Source code root directory
└── specs/                  # Gherkin BDD test specifications (.feature files)
```

---

## 3. General Agent Conventions
*   **Usability over Novelty:** Every feature, UI element, and automated flow must be designed for actual end-user utility and simplicity, rather than aesthetic complexity. User satisfaction, ease of use, and functional value are the ultimate success metrics. Avoid over-engineering fancy features that do not solve a direct user need.
*   **Write Code, Not Rules:** Pushing logical constraints into code/scripts (e.g. Playwright assertions, Policy Server yaml filters) takes priority over embedding negative instructions inside agent prompts.
*   **Progressive Disclosure:** Large reference material is stored in `references/` or `skills/` folders. Agents only load metadata upfront and fetch detailed instructions on-demand when a task matches.
*   **Format Tax Optimization:** All structured configurations use clean, flat YAML. Narration and instruction guides use simple Markdown. Avoid raw JSON/XML inputs in prompts.
*   **Zero Ambient Authority:** Agents execute actions strictly via JIT downscoped tokens. No agent is granted global access credentials.

---

## 4. Universal Security Boundaries
*   **Binary Authorization:** All container builds must be digitally signed before cloud deployment.
*   **PII Masking:** Any variables containing personal identifiable information (emails, keys, credentials) must be sanitized and replaced with placeholders (e.g., `[[USER_EMAIL]]`) via the ContextResolver middleware before being passed to the model.
*   **Human-in-the-Loop (HITL):** High-stakes actions require visual logic reviews ("Vibe Diffs") and explicit cryptographic hardware approval.
