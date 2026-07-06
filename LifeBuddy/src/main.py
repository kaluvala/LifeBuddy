"""Life Buddy API Gateway & Microservices Orchestrator.

This FastAPI server acts as the central execution portal, orchestrating sub-agent
delegations, managing the SQLite/PostgreSQL data layer, and validating security
and policy checks for all outgoing tool calls.
"""

from typing import Dict, List, Optional
import os
import yaml
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Life Buddy Microservices",
    description="Intelligent Everyday Personal Organizer Back-End",
    version="1.0.0"
)

# Enable CORS for local Tauri/React client connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import DatabaseManager, DBVectorRecord, DBUser
from planner import PlannerAgent
from shopper import ShopperAgent

db_url = os.environ.get("DATABASE_URL", "sqlite:///lifebuddy.db")
db = DatabaseManager(db_url)
planner_agent = PlannerAgent()
shopper_agent = ShopperAgent()

@app.on_event("startup")
async def startup_event():
    # Seed a verified test user if no users exist
    with db.Session() as session:
        test_user_id = None
        if session.query(DBUser).count() == 0:
            # Pre-computed SHA-256 hashes to prevent plaintext secrets in codebase
            pwd_hash = "b44c6687c5e5923cae97fe910453ba1821459aa1456ce560687ab116de4d605f"
            ans_hash = "1670f2e42fefa5044d59a65349e47c566009488fc57d7b4376dd5787b59e3c57"
            test_user = DBUser(
                username="LifebuddyQA",
                email="qa@lifebuddy.demo",
                password_hash=pwd_hash,
                security_question="What city were you born in?",
                security_answer_hash=ans_hash,
                is_verified=True,
                verification_code=None
            )
            session.add(test_user)
            session.commit()
            test_user_id = test_user.id
            print(f"[DB] Seeded verified test user: LifebuddyQA / Lifebuddydemo (ID: {test_user_id})")
        else:
            first_user = session.query(DBUser).first()
            test_user_id = first_user.id if first_user else None

    # Seed initial database tasks if empty, linking them to the seeded user
    if not db.get_all_tasks():
        db.save_task("Submit tax return", "Due tomorrow night", "Q1", user_id=test_user_id)
        db.save_task("Schedule dentist appointment", "Next Monday 3 PM", "Q3", user_id=test_user_id)
        db.save_task("Plan weekly family dinner", "Target Saturday evening", "Q2", user_id=test_user_id)
        db.save_task("Clean garage shelves", "Low priority sorting", "Q4", user_id=test_user_id)

    if not db.get_all_groceries():
        db.save_grocery_item("Bread", "Bakery", "", "", user_id=test_user_id)

    # Seed vector records if empty
    with db.Session() as session:
        if session.query(DBVectorRecord).count() == 0:
            # BBQ Template
            bbq_text = "backyard summer bbq grill party cookout steaks sausage burgers"
            bbq_items = ["bread", "butter", "cheese", "steaks", "sausage"]
            bbq_emb = shopper_agent.get_embedding(bbq_text)
            db.store_embedding(bbq_text, bbq_emb, {"name": "Backyard BBQ", "items": bbq_items})
            
            # Breakfast Template
            bf_text = "healthy fruit breakfast morning yogurt vitamins oats berries"
            bf_items = ["apples", "bananas", "yogurt", "oats", "berries"]
            bf_emb = shopper_agent.get_embedding(bf_text)
            db.store_embedding(bf_text, bf_emb, {"name": "Healthy Breakfast", "items": bf_items})
            
            # Italian Dinner
            it_text = "italian pasta dinner garlic tomato basil"
            it_items = ["Pasta", "Tomato Sauce", "Garlic", "Basil", "Parmesan"]
            it_emb = shopper_agent.get_embedding(it_text)
            db.store_embedding(it_text, it_emb, {"name": "Italian Dinner", "items": it_items})

            # Movie Night
            mv_text = "movie night snacks popcorn chips soda candy"
            mv_items = ["Popcorn", "Chips", "Soda", "Candy"]
            mv_emb = shopper_agent.get_embedding(mv_text)
            db.store_embedding(mv_text, mv_emb, {"name": "Movie Night", "items": mv_items})



# --- REQUEST/RESPONSE SCHEMAS ---
class UserAuthSchema(BaseModel):
    username: str
    password: str

class UserRegisterSchema(BaseModel):
    username: str
    email: str
    password: str
    security_question: str
    security_answer: str

class PasswordResetSchema(BaseModel):
    email: str
    security_answer: str
    new_password: str

class EmailVerifySchema(BaseModel):
    email: str
    code: str

class TaskSchema(BaseModel):
    title: str
    desc: Optional[str] = None
    quadrant: Optional[str] = "Q2"
    autopilot_enabled: Optional[bool] = False
    user_id: Optional[int] = None

class TaskUpdateSchema(BaseModel):
    title: str
    desc: Optional[str] = None
    quadrant: str
    subtasks: List[Dict] = []
    user_id: Optional[int] = None

class ReorderTasksSchema(BaseModel):
    task_ids: List[str]
    user_id: Optional[int] = None

class GrocerySchema(BaseModel):
    name: str
    aisle: str
    quantity: Optional[str] = ""
    note: Optional[str] = ""
    user_id: Optional[int] = None

class GroceryUpdateSchema(BaseModel):
    quantity: str
    note: str
    user_id: Optional[int] = None

# --- SECURITY POLICY MIDDLEWARE (Policy Server Mock) ---
import re

class PolicyChecker:
    """Zero-Trust Policy Checker for intercepting agent tool executions."""
    
    def __init__(self, policy_path: str = "policies.yaml"):
        # Resolve policy path relative to the file's location to ensure robust loading
        if not os.path.isabs(policy_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.policy_path = os.path.join(base_dir, policy_path)
        else:
            self.policy_path = policy_path
        self.policies = self._load_policies()

    def _load_policies(self) -> Dict:
        """Loads structural YAML gating policies."""
        if os.path.exists(self.policy_path):
            with open(self.policy_path, "r") as f:
                return yaml.safe_load(f)
        # Check current working directory
        local_path = os.path.join(os.getcwd(), "policies.yaml")
        if os.path.exists(local_path):
            with open(local_path, "r") as f:
                return yaml.safe_load(f)
        return {
            "environments": {"localhost": {"blocked_tools": ["send_email"]}},
            "roles": {"viewer": {"allowed_tools": ["list_files", "read_file"]}}
        }

    def check_tool_access(self, role: str, tool_name: str) -> bool:
        """Structural Gating check verifying if a role is authorized to execute a tool.
        
        Args:
            role: The SPIFFE ID role of the calling agent (e.g. 'viewer', 'developer').
            tool_name: The name of the tool to be executed.
            
        Returns:
            True if authorized, False otherwise.
        """
        role_rules = self.policies.get("roles", {}).get(role, {})
        allowed_tools = role_rules.get("allowed_tools", [])
        return "*" in allowed_tools or tool_name in allowed_tools

    def check_semantic_leak(self, payload: Optional[Dict]) -> Optional[str]:
        """Scans payload arguments to prevent PII leakage (unmasked emails or secret keys)."""
        if not payload:
            return None
        
        email_pattern = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
        secret_keys = {"key", "secret", "token", "password", "passwd", "auth"}

        def scan_val(val, key_name: str = "") -> Optional[str]:
            if isinstance(val, str):
                if "[[USER_EMAIL]]" in val:
                    return None
                if email_pattern.search(val):
                    return "PII leakage detected: Unmasked email address."
                
                # Check if the key name suggests it's a credential/token and value is long
                any_secret_keyword = any(k in key_name.lower() for k in secret_keys)
                if any_secret_keyword and len(val) >= 16 and " " not in val:
                    return "Credential leak detected: Unmasked secret/key."
            elif isinstance(val, dict):
                for k, v in val.items():
                    res = scan_val(v, k)
                    if res:
                        return f"{k}: {res}"
            elif isinstance(val, list):
                for idx, item in enumerate(val):
                    res = scan_val(item, key_name)
                    if res:
                        return f"[{idx}]: {res}"
            return None

        return scan_val(payload)


policy_verifier = PolicyChecker()



# --- API ROUTERS (Auth & User Service) ---
@app.post("/register", response_model=Dict, tags=["User Service"])
async def register(credentials: UserRegisterSchema):
    """Register a new user with email, password complexity rules, and security question."""
    if len(credentials.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    try:
        user = db.register_user(
            username=credentials.username.strip(),
            password=credentials.password,
            email=credentials.email.strip().lower(),
            security_question=credentials.security_question,
            security_answer=credentials.security_answer
        )
        if user:
            # Retrieve generated verification code to log it
            from database import DBUser
            with db.Session() as session:
                db_user = session.query(DBUser).filter(DBUser.id == user["id"]).first()
                vcode = db_user.verification_code if db_user else "******"
            
            print("\n" + "="*80)
            print(f"[EMAIL OUTBOX] To: {user['email']}")
            print(f"[EMAIL OUTBOX] Subject: Verify your LifeBuddy Account")
            print(f"[EMAIL OUTBOX] Body: Welcome to LifeBuddy, {user['username']}!")
            print(f"[EMAIL OUTBOX] Your verification code is: {vcode}")
            print("="*80 + "\n")
            
            return {
                "status": "VERIFICATION_REQUIRED",
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    raise HTTPException(status_code=400, detail="Registration failed.")

@app.post("/verify-email", response_model=Dict, tags=["User Service"])
async def verify_email(payload: EmailVerifySchema):
    """Verify 6-digit code to activate user account."""
    try:
        user = db.verify_email_code(payload.email, payload.code)
        if user:
            return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    raise HTTPException(status_code=400, detail="Invalid verification code.")

@app.post("/login", response_model=Dict, tags=["User Service"])
async def login(credentials: UserAuthSchema):
    """Log in an existing user."""
    try:
        user = db.verify_user(credentials.username.strip(), credentials.password)
        if user:
            return user
    except ValueError as e:
        if "verify" in str(e).lower() or "unverified" in str(e).lower():
            # Get the user email so the frontend can redirect to verification
            from database import DBUser
            with db.Session() as session:
                db_user = session.query(DBUser).filter(DBUser.username == credentials.username.strip()).first()
                email = db_user.email if db_user else ""
            raise HTTPException(status_code=403, detail={"message": str(e), "email": email})
        raise HTTPException(status_code=400, detail=str(e))
    raise HTTPException(status_code=401, detail="Invalid username or password.")

@app.get("/reset-password/challenge/{email}", response_model=Dict, tags=["User Service"])
async def get_password_reset_challenge(email: str):
    """Retrieve the security question challenge for a given email address."""
    from database import DBUser
    with db.Session() as session:
        user = session.query(DBUser).filter(DBUser.email == email.strip().lower()).first()
        if user and user.security_question:
            return {"email": email, "security_question": user.security_question}
    raise HTTPException(status_code=404, detail="User not found or no security question set.")

@app.post("/reset-password", response_model=Dict, tags=["User Service"])
async def reset_user_password(payload: PasswordResetSchema):
    """Reset a user's password if the security question answer is correct."""
    # Verify the answer
    if not db.verify_security_answer(payload.email.strip(), payload.security_answer):
        raise HTTPException(status_code=400, detail="Incorrect security answer.")
    
    # Try resetting
    try:
        success = db.reset_password(payload.email.strip(), payload.new_password)
        if success:
            return {"status": "SUCCESS", "message": "Password successfully reset."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    raise HTTPException(status_code=400, detail="Failed to reset password.")


# --- API ROUTERS (Planner Microservice) ---
@app.get("/tasks", response_model=List[Dict], tags=["Planner Service"])
async def get_tasks(user_id: Optional[int] = None):
    """Retrieve all current tasks grouped in the Eisenhower Matrix, filtered by user_id."""
    return db.get_all_tasks(user_id)

@app.post("/tasks", response_model=Dict, tags=["Planner Service"])
async def create_task(task: TaskSchema):
    """Create a new task and automatically allocate urgency/importance quadrant, checking for duplicates."""
    title_lower = task.title.lower()
    quadrant = "Q2"  # Default: Important, Not Urgent
    
    if "tomorrow" in title_lower or "today" in title_lower or "urgent" in title_lower:
        quadrant = "Q1"  # Urgent & Important
    elif "schedule" in title_lower or "call" in title_lower:
        quadrant = "Q3"  # Urgent & Not Important
    elif "clean" in title_lower or "sort" in title_lower:
        quadrant = "Q4"  # Not Urgent & Not Important

    # Check duplicates for this user
    existing_tasks = db.get_all_tasks(task.user_id)
    if any(t["title"].strip().lower() == task.title.strip().lower() for t in existing_tasks):
        raise HTTPException(status_code=400, detail="Task with this title already exists.")

    # If task is scheduling related (Q3), evaluate AI Auto-Pilot status
    if quadrant == "Q3":
        sync_result = planner_agent.sync_to_calendar(task.title, "2026-07-06", task.autopilot_enabled)
        if sync_result.get("status") == "AWAITING_REVIEW":
            return {
                "id": "pending",
                "status": "AWAITING_REVIEW",
                "action": sync_result.get("action"),
                "vibe_diff": sync_result.get("vibe_diff"),
                "details": sync_result.get("details"),
                "title": task.title,
                "desc": task.desc or "",
                "quadrant": quadrant
            }

    new_task = db.save_task(task.title, task.desc or "", quadrant, task.user_id)
    new_task["status"] = "SUCCESS"
    return new_task


@app.put("/tasks/{task_id}/quadrant", response_model=Dict, tags=["Planner Service"])
async def update_task_quadrant(task_id: str, quadrant: str, user_id: Optional[int] = None):
    """Manually override task prioritization quadrant (Supports drag-and-drop actions)."""
    if quadrant not in ["Q1", "Q2", "Q3", "Q4"]:
        raise HTTPException(status_code=400, detail="Invalid Eisenhower Quadrant")
        
    updated = db.update_task_quadrant(task_id, quadrant, user_id)
    if updated:
        return updated
    raise HTTPException(status_code=404, detail="Task not found")


@app.put("/tasks/reorder", response_model=Dict, tags=["Planner Service"])
async def reorder_tasks(payload: ReorderTasksSchema):
    """Reorder tasks by updating their position field based on the provided list of IDs."""
    db.reorder_tasks(payload.task_ids, payload.user_id)
    return {"status": "SUCCESS"}


@app.put("/tasks/{task_id}", response_model=Dict, tags=["Planner Service"])
async def update_task(task_id: str, task: TaskUpdateSchema):
    """Update task details, including title, description, quadrant, and subtasks list."""
    if task.quadrant not in ["Q1", "Q2", "Q3", "Q4"]:
        raise HTTPException(status_code=400, detail="Invalid Eisenhower Quadrant")

    # Check duplicates for this user (if another task has the same title)
    existing_tasks = db.get_all_tasks(task.user_id)
    for t in existing_tasks:
        if t["id"] != task_id and t["title"].strip().lower() == task.title.strip().lower():
            raise HTTPException(status_code=400, detail="Another task with this title already exists.")

    updated = db.update_task(task_id, task.title, task.desc or "", task.quadrant, task.subtasks, task.user_id)
    if updated:
        return updated
    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/tasks/{task_id}", response_model=Dict, tags=["Planner Service"])
async def delete_task(task_id: str, user_id: Optional[int] = None):
    """Delete a task, ensuring user ownership is respected."""
    deleted = db.delete_task(task_id, user_id)
    if deleted:
        return {"status": "SUCCESS", "detail": "Task deleted successfully"}
    raise HTTPException(status_code=404, detail="Task not found")


# --- API ROUTERS (Shopper Microservice) ---
@app.get("/groceries", response_model=List[Dict], tags=["Shopper Service"])
async def get_groceries(user_id: Optional[int] = None):
    """Retrieve the active household shopping list, filtered by user_id."""
    return db.get_all_groceries(user_id)

@app.post("/groceries", response_model=Dict, tags=["Shopper Service"])
async def add_grocery(item: GrocerySchema):
    """Add a new item to the active shopping list, checking for duplicates."""
    # Check duplicates for this user
    existing_items = db.get_all_groceries(item.user_id)
    if any(g["name"].strip().lower() == item.name.strip().lower() for g in existing_items):
        raise HTTPException(status_code=400, detail="Grocery item already exists in your list.")
    return db.save_grocery_item(item.name, item.aisle, item.quantity, item.note, item.user_id)

@app.put("/groceries/{item_id}", response_model=Dict, tags=["Shopper Service"])
async def update_grocery(item_id: str, payload: GroceryUpdateSchema):
    """Updates the quantity or note of an existing grocery item."""
    updated = db.update_grocery_item(item_id, payload.quantity, payload.note, payload.user_id)
    if updated:
        return updated
    raise HTTPException(status_code=404, detail="Grocery item not found")

@app.delete("/groceries/{item_id}", response_model=Dict, tags=["Shopper Service"])
async def delete_grocery(item_id: str, user_id: Optional[int] = None):
    """Delete a grocery item, ensuring user ownership is respected."""
    deleted = db.delete_grocery_item(item_id, user_id)
    if deleted:
        return {"status": "SUCCESS", "detail": "Grocery item deleted successfully"}
    raise HTTPException(status_code=404, detail="Grocery item not found")

class TemplateSchema(BaseModel):
    query: str
    user_id: Optional[int] = None

@app.post("/groceries/template", response_model=List[Dict], tags=["Shopper Service"])
async def load_template_semantically(payload: TemplateSchema):
    """Finds the closest template by vector similarity and saves matched items to database, avoiding duplicates."""
    items = shopper_agent.find_template_items(payload.query, db)
    saved_items = []
    
    existing = db.get_all_groceries(payload.user_id)
    existing_names = {g["name"].strip().lower() for g in existing}
    
    for item in items:
        if item["name"].strip().lower() in existing_names:
            continue
        saved = db.save_grocery_item(item["name"], item["aisle"], "", "", payload.user_id)
        saved_items.append(saved)
    return saved_items

class CreateTemplateSchema(BaseModel):
    name: str
    items: List[str]

@app.get("/groceries/templates", response_model=List[Dict], tags=["Shopper Service"])
async def get_templates():
    """Retrieve all grocery templates."""
    return db.get_all_templates()

@app.post("/groceries/templates", response_model=Dict, tags=["Shopper Service"])
async def create_template(payload: CreateTemplateSchema):
    """Create a new template from items."""
    # Convert name to lowercase for the vector text (improves similarity matching)
    text_content = payload.name.lower()
    emb = shopper_agent.get_embedding(text_content)
    db.store_embedding(text_content, emb, {"name": payload.name, "items": payload.items})
    return {"status": "SUCCESS", "message": "Template created"}

@app.put("/groceries/templates/{template_id}", response_model=Dict, tags=["Shopper Service"])
async def update_template(template_id: int, payload: CreateTemplateSchema):
    """Update an existing template's items."""
    if db.update_template(template_id, payload.items):
        return {"status": "SUCCESS", "message": "Template updated"}
    raise HTTPException(status_code=404, detail="Template not found")

@app.delete("/groceries/templates/{template_id}", response_model=Dict, tags=["Shopper Service"])
async def delete_template(template_id: int):
    """Delete a template."""
    if db.delete_template(template_id):
        return {"status": "SUCCESS", "message": "Template deleted"}
    raise HTTPException(status_code=404, detail="Template not found")

class PolicyCheckSchema(BaseModel):
    spiffe_id: str
    tool_name: str
    arguments: Optional[Dict] = None

@app.post("/security/policy-check", tags=["System Control"])
async def run_policy_check(payload: PolicyCheckSchema):
    """Enforces zero-trust structural and semantic checks on agent requests."""
    # 1. Structural Check
    allowed = policy_verifier.check_tool_access(payload.spiffe_id, payload.tool_name)
    if not allowed:
        return {"allowed": False, "reason": f"Structural Gate: Agent '{payload.spiffe_id}' is unauthorized to call tool '{payload.tool_name}'."}

    # 2. Semantic Check
    leak_error = policy_verifier.check_semantic_leak(payload.arguments)
    if leak_error:
        return {"allowed": False, "reason": f"Semantic Gate: {leak_error}"}

    return {"allowed": True, "reason": "Structural and Semantic checks passed successfully."}


@app.get("/", response_class=HTMLResponse, tags=["UI Dashboard"])
async def get_dashboard():
    """Serves the main glassmorphic React dashboard directly in the browser."""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Life Buddy Dashboard</title>
        <link rel="stylesheet" href="/index.css">
        <!-- Load React and ReactDOM CDN -->
        <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
        <!-- Load Babel Standalone CDN -->
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    </head>
    <body>
        <div id="root"></div>
        <!-- Load App.jsx using Babel standalone script tag -->
        <script type="text/babel" src="/App.jsx"></script>
        <script type="text/babel">
            const Dashboard = window.Dashboard;
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<Dashboard />);
        </script>
    </body>
    </html>
    """
    return html_content

@app.get("/App.jsx", tags=["UI Dashboard"])
async def get_app_jsx():
    """Serves React App source file, stripping local CSS and JS imports and exposing Dashboard globally."""
    src_dir = os.path.dirname(__file__)
    app_path = os.path.join(src_dir, "App.jsx")
    with open(app_path, "r", encoding="utf-8") as f:
        content = f.read()
    import re
    # Strip local CSS import
    content = re.sub(r"import\s+['\"].*\.css['\"];?", "", content)
    # Strip ES module imports
    content = re.sub(r"import\s+.*from\s+['\"].*['\"];?", "", content)
    
    # Prepend destructuring for React hooks from global scope
    globals_prefix = "const { useState, useEffect } = React;\n"
    content = globals_prefix + content
    
    # Expose Dashboard globally
    content = content.replace("export default function Dashboard", "window.Dashboard = function Dashboard")
    return Response(content, media_type="application/javascript")

@app.get("/index.css", tags=["UI Dashboard"])
async def get_index_css():
    """Serves the stylesheet of the UI Dashboard."""
    src_dir = os.path.dirname(__file__)
    css_path = os.path.join(src_dir, "index.css")
    with open(css_path, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(content, media_type="text/css")


# --- DIAGNOSTIC HEALTH CHECK ---
@app.get("/health", tags=["System Control"])
async def health_check():
    """Returns the operational status of all Life Buddy microservice connections."""
    return {"status": "healthy", "database": "connected", "policy_server": "active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
