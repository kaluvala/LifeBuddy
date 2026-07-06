# Life Buddy Product Backlog & Feature Estimates (backlog.md)

This backlog is owned by the **Product Owner Agent** and serves as the source of truth for features, user stories, and complexity estimates.

---

## 1. Feature Estimates (T-Shirt Sizing)

| Epic/Feature | Description | Complexity | Key Architectural Dependency |
| :--- | :--- | :--- | :--- |
| **Planner Core** | Relational SQL database setup, task CRUD API, and Eisenhower matrix prioritization logic. | **Medium (M)** | Local SQLite/PostgreSQL schema definitions. |
| **Shopper Core** | Grocery list management, pgvector similarity mapping, and automatic categorization logic. | **Medium (M)** | Vector DB partition, embedding models. |
| **GCal/Gmail Sync** | Two-way syncing of calendar events and drafting of notification emails. | **Large (L)** | Gmail/Google Calendar MCP server integration. |
| **Security Gateway** | Policy Server interceptor, SPIFFE verification, and JIT token downscoping. | **Large (L)** | Token lifecycle API & mTLS layer. |
| **Unified UI** | React frontend with design token styles and Tauri desktop package wrapper. | **Large (L)** | A2UI rendering schemas. |

---

## 2. Sprint Backlog: User Stories

### `LB-US-001`: Task Creation & Eisenhower Matrix Prioritization
*   **User Story:**
    *   *As a* Life Buddy User,
    *   *I want to* quickly create tasks using natural language and have the system automatically categorize them by urgency and importance,
    *   *So that* I can focus on high-priority items without wasting time organizing them manually.
*   **Business Value:** High (Core workflow organizer and daily efficiency booster).
*   **User-Centric Usability Constraint:** Task creation must take under 3 seconds. The interface must dynamically render the list as a clean, draggable Kanban Board or 2x2 grid representing the Eisenhower quadrants (Urgent/Important).
*   **Initial Acceptance Criteria:**
    *   System parses natural language (e.g. *"Plan BBQ Saturday morning"* -> Task: Plan BBQ, Date: Saturday, Urgency: High).
    *   Tasks are automatically assigned to one of the 4 Eisenhower quadrants.
    *   Users can manually drag and drop tasks between quadrants to override AI prioritization.

### `LB-US-002`: Predictive Grocery List Creation
*   **User Story:**
    *   *As a* Life Buddy User,
    *   *I want* the Shopper Agent to analyze my past shopping frequency and automatically suggest a predicted weekly grocery list,
    *   *So that* I do not forget standard household staples (like milk) when preparing for a shopping trip.
*   **Business Value:** High (Proactive automation that builds long-term user habits and saves time).
*   **User-Centric Usability Constraint:** Suggestions must be presented as a dismissible "Predicted Items" list. Users must be able to add or dismiss items in a single click without navigating menus.
*   **Initial Acceptance Criteria:**
    *   System queries historical grocery orders from the vector database.
    *   AI predicts list items based on purchase dates and average consumption rates.
    *   Grocery items are automatically grouped under aisle category headers (e.g., Dairy, Produce).

### `LB-US-003`: AI Auto-Pilot Security Toggle
*   **User Story:**
    *   *As a* security-conscious User,
    *   *I want to* toggle the "AI Auto-Pilot" setting for my calendar and email tools,
    *   *So that* I can explicitly decide when the agent is allowed to book appointments autonomously versus when it must halt for my manual review.
*   **Business Value:** Critical (Establishes user trust, guarantees data protection, and prevents rogue action side-effects).
*   **User-Centric Usability Constraint:** The Auto-Pilot toggle must be easily accessible directly on the main dashboard page. If disabled, a clear "Action Pending Approval" banner must appear when the agent attempts a mutation.
*   **Initial Acceptance Criteria:**
    *   Dashboard provides visual toggle switches for "Calendar Auto-Pilot" and "Email Auto-Pilot."
    *   When Auto-Pilot is OFF, attempts to create calendar slots are intercepted, and the system prompts the user with a plain-English logic review.
    *   When Auto-Pilot is ON, the system executes the tool call silently using JIT downscoped credentials.
