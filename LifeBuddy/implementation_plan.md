# Life Buddy: Production Architecture & Multi-Agent SDLC Blueprint

This document details the production design for the **Life Buddy** application (Part 1) and the autonomous multi-agent development workflow (Part 2) that will be used to construct it.

---

## PART 1: The Production Execution Plan (The Application)

**Life Buddy** is an intelligent personal organizer built using a code-first, graph-based agent architecture.

### 1. Multi-Agent Systems
*   **Planner Agent:** Handles calendar syncing and task auto-prioritization.
*   **Shopper Agent:** Handles predictive grocery lists based on historical context.

### 2. Model Context Protocol (MCP) Servers
*   **External Integration:** Employs MCP servers (specifically Google Calendar/Gmail MCP) to safely query schedules and execute task bookings.

### 3. Agent Skills
*   **Specialized Knowledge:** Procedural playbooks (e.g. `grocery-intelligence-skill` for aisle grouping, `productivity-coach-skill` for Eisenhower Matrix sorting) instruct the agents on specific domain logic without bloating prompt sizes.

### 4. Security & Permissions
*   **AI Auto-Pilot Toggle:** Granular permission switches. If Auto-Pilot is OFF for a tool, the agent's execution policy defaults to "Require Review." If ON, it operates with "Always Proceed" permissions.

### 5. Memory & Continuous Improvement
*   **Behavior Prediction:** Persistent episodic memory records customer behaviors to proactively predict outcomes.
*   **Opt-In Feedback Loops:** Occasionally prompts the user for brief feedback to refine predictions. Users have a global opt-out setting.

---

## PART 2: The SDLC Multi-Agent Development Plan (The Build Process)

The codebase will be built using a collaborative, multi-agent software engineering team. Each role is logically partitioned to reduce search space, limit attention dilution, and isolate failure points.

### The 7-Agent SDLC Team

1.  **Product Owner (PO) Agent:**
    *   **Persona:** Owns the scope and backlog.
    *   **Responsibilities:** Writes feature T-shirt size estimates, drafts feature epics, and creates user stories.
    *   **Harness Configuration:** Runs in Conductor mode (real-time interactive direction).
2.  **Business Analyst (BA) Agent:**
    *   **Persona:** Backlog refiner and spec writer.
    *   **Responsibilities:** Translates stories into Gherkin Behavior-Driven Development (BDD) specs (`Scenario/Given/When/Then`) to provide deterministic execution rails.
3.  **UX Designer Agent:**
    *   **Persona:** Aesthetic, layouts, and accessibility (A11y) specialist.
    *   **Responsibilities:** Generates frontend CSS assets, forms, button configurations, and visual structures. 
    *   **Continuous UX Loop:** Iterates on design layouts based on collaborative reviews from the PO, BA, and QA agents before coding.
4.  **Tech Lead / Architect Agent:**
    *   **Persona:** Security standards, code quality, and performance optimizer.
    *   **Responsibilities:** 
        *   Dictates directory structure, tech stack limits, and ADK design patterns. Enforces zero-trust boundaries.
        *   **Security Evaluations:** Performs code-level SAST and SCA scans to detect vulnerabilities, SQL injections, credential leaks, and malicious packages. Blocks lateral movement by validating SPIFFE cryptographic boundaries.
        *   **Performance Evaluations:** Evaluates the Dev agent's outputs for token consumption overhead, database index performance, API call latencies, and resource loops. Enforces small code batch sizes.
5.  **Developer (Dev) Agent:**
    *   **Persona:** Clean-code programmer.
    *   **Responsibilities:** Translates Gherkin specs and UX assets into working Python/ADK code and React files.
6.  **QA Engineer Agent:**
    *   **Persona:** Adversarial tester.
    *   **Responsibilities:** Translates BDD scenarios into Playwright automation suites. Performs trajectory-aware evaluations to ensure tools are called in the correct logical sequence.
7.  **Release Manager Agent:**
    *   **Persona:** DevOps and CI/CD engineer.
    *   **Responsibilities:** Handles containerization, provisions cloud resources, and establishes the pipeline to Google Cloud.

---

## PART 3: Context Engineering & File-System Memory Architecture

To optimize token economics and prevent context rot, the workspace separates static instructions from dynamic runtime states.

### 1. Global Workspace Context
*   `[NEW]` [AGENTS.md](file:///C:/Users/kaluv/OneDrive/מסמכים/AI/GoogleAI/LifeBuddy/AGENTS.md)
    *   **Type:** *Static Context (Global)*
    *   **Contents:** Core project guidelines, directories, conventions, and style rules read by all agents.
*   `[NEW]` [WORKSPACE_MEM.md](file:///C:/Users/kaluv/OneDrive/מסמכים/AI/GoogleAI/LifeBuddy/WORKSPACE_MEM.md)
    *   **Type:** *Dynamic Context (Global)*
    *   **Contents:** A shared task status bus containing active sprint backlogs and coordination logs.

### 2. Per-Agent Scoped Context Files
Each agent operates out of a scoped directory under `agents/` to enforce boundary isolation:
*   `agents/<name>/role.yaml` (*Static Persona*): Contains the agent configuration (Gemini model choice, SPIFFE ID, credentials, and structural permissions) in optimized YAML.
*   `agents/<name>/recent_memory.md` (*Dynamic Sessions*): Holds short-term session logs and user corrections.
*   `agents/<name>/skills/` (*Dynamic Skills*): Scoped procedural skills loaded on-demand.

---

## PART 4: Secure Vibe Coding Harness

To prevent rogue agent behaviors, dependency poisoning, and context drift, we implement three security gates:

### 1. The Red/Blue/Green SecOps Triad
*   **Red Team (QA Agent):** Proactively simulates prompt injections to test the Dev agent's security boundaries.
*   **Blue Team (Architect Agent):** Continually monitors dependencies (via SBOM/SCA) to block hallucinated software packages.
*   **Green Team (Dev Agent):** Automatically executes "Auto-Refactoring" when a security vulnerability is flagged, rewriting the code in quarantine.

### 2. Hybrid Policy Server (Structural + Semantic Gating)
Every tool call is intercepted by a Policy Server:
*   *Structural:* Verifies if the calling agent's SPIFFE ID is authorized for the tool (e.g. blocking PO from deploying).
*   *Semantic:* Passes the natural language action description to a secondary referee LLM to check for PII leakage (unmasked emails or keys) before tool execution.

### 3. Logic Review & The Vibe Diff
High-stakes actions (such as live cloud deployment) trigger a **Vibe Diff** block. The system translates the raw deployment code into a plain-English summary. The human operator must review and provide explicit approval (cryptographic hardware MFA token touch) to authorize execution.
