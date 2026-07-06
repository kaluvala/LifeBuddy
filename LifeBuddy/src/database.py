"""Life Buddy Database & Vector Search Interface.

Exposes connection adapters for relational SQL tables (tasks/groceries) and
vector database collections (pgvector/semantic search) to manage persistent agent state.
"""

import json
import time
from typing import List, Dict, Optional
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, Boolean, text
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class DBUser(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    security_question = Column(String(255), nullable=True)
    security_answer_hash = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_code = Column(String(10), nullable=True)
    created_at = Column(Float, default=time.time)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_verified": self.is_verified,
            "security_question": self.security_question
        }

class DBTask(Base):
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    desc = Column(Text, nullable=True)
    quadrant = Column(String(10), default="Q2")
    position = Column(Integer, default=0, nullable=False)
    subtasks_json = Column(Text, default="[]")
    created_at = Column(Float, default=time.time)

    def to_dict(self) -> Dict:
        import json
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "title": self.title,
            "desc": self.desc,
            "quadrant": self.quadrant,
            "position": self.position,
            "subtasks": json.loads(self.subtasks_json or "[]")
        }

class DBGroceryItem(Base):
    __tablename__ = 'groceries'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    name = Column(String(255), nullable=False)
    aisle = Column(String(100), nullable=False)
    quantity = Column(String(100), nullable=True, default="")
    note = Column(String(255), nullable=True, default="")
    timestamp = Column(Float, default=time.time)

    def to_dict(self) -> Dict:
        return {
            "id": f"g{self.id}",
            "user_id": self.user_id,
            "name": self.name,
            "aisle": self.aisle,
            "quantity": self.quantity or "",
            "note": self.note or ""
        }

class DBVectorRecord(Base):
    __tablename__ = 'vector_records'
    id = Column(Integer, primary_key=True, autoincrement=True)
    text_content = Column(Text, nullable=False)
    # Store vector as JSON string for SQLite compatibility; if pgvector is present, we cast to vector in PostgreSQL queries
    vector_data = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    timestamp = Column(Float, default=time.time)


class DatabaseManager:
    """Manages transactional databases and handles semantic vector similarity queries."""

    def __init__(self, connection_string: str = "sqlite:///:memory:"):
        self.connection_string = connection_string
        self.engine = None
        self.Session = None
        self.is_postgres = False
        self._init_connection()

    def _init_connection(self):
        """Initializes database connection with automatic PostgreSQL-to-SQLite fallback."""
        try:
            if self.connection_string and "postgresql" in self.connection_string:
                self.engine = create_engine(self.connection_string, connect_args={"connect_timeout": 3})
                # Check connection viability
                with self.engine.connect() as conn:
                    # check if pgvector extension is available and create it
                    try:
                        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                        conn.commit()
                        self.is_postgres = True
                    except Exception:
                        pass
            else:
                db_path = self.connection_string or "sqlite:///:memory:"
                self.engine = create_engine(db_path, connect_args={"check_same_thread": False})
        except Exception as e:
            print(f"[DB] Connection failed: {e}. Falling back to SQLite memory.")
            self.connection_string = "sqlite:///:memory:"
            self.engine = create_engine(self.connection_string, connect_args={"check_same_thread": False})


        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    @property
    def groceries_table(self) -> List[Dict]:
        """Provides backwards compatibility for legacy mock list tests."""
        return self.get_all_groceries()

    @property
    def tasks_table(self) -> List[Dict]:
        """Provides backwards compatibility for legacy mock list tests."""
        return self.get_all_tasks()

    def register_user(self, username: str, password: str, email: str, security_question: Optional[str] = None, security_answer: Optional[str] = None) -> Optional[Dict]:
        """Registers a new user enforcing password complexity rules, security questions, and email verification."""
        import hashlib
        import re
        import random

        # Enforce complexity: length >= 8, uppercase, lowercase, digit, special char
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[@$!%*?&_#^+\-=(){}\[\]:;\"'<>,.?/|\\]", password):
            raise ValueError("Password must contain at least one special character.")

        email_clean = email.strip().lower()
        if not email_clean or "@" not in email_clean:
            raise ValueError("Invalid email address format.")

        with self.Session() as session:
            existing_user = session.query(DBUser).filter(DBUser.username == username).first()
            if existing_user:
                raise ValueError("Username already exists.")
            existing_email = session.query(DBUser).filter(DBUser.email == email_clean).first()
            if existing_email:
                raise ValueError("Email address already exists.")

            pwd_hash = hashlib.sha256(password.encode()).hexdigest()
            ans_hash = hashlib.sha256(security_answer.strip().lower().encode()).hexdigest() if security_answer else None
            
            # Generate 6-digit verification code
            vcode = f"{random.randint(100000, 999999)}"
            
            user = DBUser(
                username=username,
                email=email_clean,
                password_hash=pwd_hash,
                security_question=security_question,
                security_answer_hash=ans_hash,
                is_verified=False,
                verification_code=vcode
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            return user.to_dict()

    def verify_email_code(self, email: str, code: str) -> Optional[Dict]:
        """Verifies the email verification code and activates the account."""
        with self.Session() as session:
            user = session.query(DBUser).filter(DBUser.email == email.strip().lower()).first()
            if not user:
                raise ValueError("User not found.")
            if user.is_verified:
                return user.to_dict()
            if user.verification_code == code.strip():
                user.is_verified = True
                user.verification_code = None
                session.commit()
                return user.to_dict()
            raise ValueError("Invalid verification code.")

    def verify_user(self, username: str, password: str) -> Optional[Dict]:
        """Verifies a user's password hash and returns the user dict if successful and verified."""
        import hashlib
        with self.Session() as session:
            pwd_hash = hashlib.sha256(password.encode()).hexdigest()
            user = session.query(DBUser).filter(DBUser.username == username, DBUser.password_hash == pwd_hash).first()
            if user:
                if not user.is_verified:
                    raise ValueError("Account is unverified. Please verify your email first.")
                return user.to_dict()
            return None

    def verify_security_answer(self, email: str, answer: str) -> bool:
        """Verifies if the security answer is correct for the given user email."""
        import hashlib
        with self.Session() as session:
            user = session.query(DBUser).filter(DBUser.email == email.strip().lower()).first()
            if not user or not user.security_answer_hash:
                return False
            ans_hash = hashlib.sha256(answer.strip().lower().encode()).hexdigest()
            return user.security_answer_hash == ans_hash

    def reset_password(self, email: str, new_password: str) -> bool:
        """Resets the user's password after validating complexity."""
        import hashlib
        import re
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", new_password):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", new_password):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", new_password):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[@$!%*?&_#^+\-=(){}\[\]:;\"'<>,.?/|\\]", new_password):
            raise ValueError("Password must contain at least one special character.")

        with self.Session() as session:
            user = session.query(DBUser).filter(DBUser.email == email.strip().lower()).first()
            if not user:
                return False
            pwd_hash = hashlib.sha256(new_password.encode()).hexdigest()
            user.password_hash = pwd_hash
            session.commit()
            return True

    def get_all_tasks(self, user_id: Optional[int] = None) -> List[Dict]:
        """Retrieves all tasks from the database sorted by position and ID, optionally filtered by user_id."""
        with self.Session() as session:
            query = session.query(DBTask)
            if user_id is not None:
                query = query.filter(DBTask.user_id == user_id)
            tasks = query.order_by(DBTask.position.asc(), DBTask.id.asc()).all()
            return [task.to_dict() for task in tasks]

    def reorder_tasks(self, task_ids: List[str], user_id: Optional[int] = None) -> None:
        """Assigns sequential position index values to tasks in the database to persist custom drag-and-drop order."""
        with self.Session() as session:
            for idx, tid in enumerate(task_ids):
                try:
                    tid_int = int(tid)
                except ValueError:
                    continue
                query = session.query(DBTask).filter(DBTask.id == tid_int)
                if user_id is not None:
                    query = query.filter(DBTask.user_id == user_id)
                task = query.first()
                if task:
                    task.position = idx
            session.commit()

    def get_all_groceries(self, user_id: Optional[int] = None) -> List[Dict]:
        """Retrieves all groceries from the database, optionally filtered by user_id."""
        with self.Session() as session:
            query = session.query(DBGroceryItem)
            if user_id is not None:
                query = query.filter(DBGroceryItem.user_id == user_id)
            items = query.all()
            return [item.to_dict() for item in items]

    def save_task(self, title: str, description: str, quadrant: str, user_id: Optional[int] = None) -> Dict:
        """Saves a task record to the database."""
        with self.Session() as session:
            task = DBTask(title=title, desc=description, quadrant=quadrant, user_id=user_id)
            session.add(task)
            session.commit()
            session.refresh(task)
            return task.to_dict()

    def update_task_quadrant(self, task_id: str, quadrant: str, user_id: Optional[int] = None) -> Optional[Dict]:
        """Updates the prioritization quadrant of a task."""
        with self.Session() as session:
            try:
                task_id_int = int(task_id)
            except ValueError:
                return None
            query = session.query(DBTask).filter(DBTask.id == task_id_int)
            if user_id is not None:
                query = query.filter(DBTask.user_id == user_id)
            task = query.first()
            if task:
                task.quadrant = quadrant
                session.commit()
                return task.to_dict()
            return None

    def update_task(self, task_id: str, title: str, desc: str, quadrant: str, subtasks: List[Dict], user_id: Optional[int] = None) -> Optional[Dict]:
        """Updates the full details of a task, including its title, description, quadrant, and subtasks JSON."""
        import json
        with self.Session() as session:
            try:
                task_id_int = int(task_id)
            except ValueError:
                return None
            query = session.query(DBTask).filter(DBTask.id == task_id_int)
            if user_id is not None:
                query = query.filter(DBTask.user_id == user_id)
            task = query.first()
            if task:
                task.title = title
                task.desc = desc
                task.quadrant = quadrant
                task.subtasks_json = json.dumps(subtasks)
                session.commit()
                return task.to_dict()
            return None

    def delete_task(self, task_id: str, user_id: Optional[int] = None) -> bool:
        """Deletes a task from the database."""
        with self.Session() as session:
            try:
                task_id_int = int(task_id)
            except ValueError:
                return False
            query = session.query(DBTask).filter(DBTask.id == task_id_int)
            if user_id is not None:
                query = query.filter(DBTask.user_id == user_id)
            task = query.first()
            if task:
                session.delete(task)
                session.commit()
                return True
            return False

    def save_grocery_item(self, name: str, aisle: str, quantity: str = "", note: str = "", user_id: Optional[int] = None) -> Dict:
        """Saves a grocery list item to the database."""
        with self.Session() as session:
            item = DBGroceryItem(name=name, aisle=aisle, quantity=quantity, note=note, user_id=user_id)
            session.add(item)
            session.commit()
            session.refresh(item)
            return item.to_dict()

    def update_grocery_item(self, item_id: str, quantity: str, note: str, user_id: Optional[int] = None) -> Optional[Dict]:
        """Updates the quantity and note of a grocery item."""
        with self.Session() as session:
            try:
                if item_id.startswith("g"):
                    item_id_int = int(item_id[1:])
                else:
                    item_id_int = int(item_id)
            except (ValueError, AttributeError):
                return None
            query = session.query(DBGroceryItem).filter(DBGroceryItem.id == item_id_int)
            if user_id is not None:
                query = query.filter(DBGroceryItem.user_id == user_id)
            item = query.first()
            if item:
                item.quantity = quantity
                item.note = note
                session.commit()
                return item.to_dict()
            return None

    def delete_grocery_item(self, item_id: str, user_id: Optional[int] = None) -> bool:
        """Deletes a grocery item from the database by ID or f'g{id}' representation."""
        with self.Session() as session:
            try:
                if item_id.startswith("g"):
                    item_id_int = int(item_id[1:])
                else:
                    item_id_int = int(item_id)
            except (ValueError, AttributeError):
                return False
            query = session.query(DBGroceryItem).filter(DBGroceryItem.id == item_id_int)
            if user_id is not None:
                query = query.filter(DBGroceryItem.user_id == user_id)
            item = query.first()
            if item:
                session.delete(item)
                session.commit()
                return True
            return False

    def store_embedding(self, text: str, embedding: List[float], metadata: Optional[Dict] = None) -> None:
        """Saves a text embedding to the vector database table."""
        with self.Session() as session:
            vector_str = json.dumps(embedding)
            meta_str = json.dumps(metadata) if metadata else None
            record = DBVectorRecord(text_content=text, vector_data=vector_str, metadata_json=meta_str)
            session.add(record)
            session.commit()

    def query_similar_vectors(self, query_embedding: List[float], limit: int = 5) -> List[Dict]:
        """Runs a cosine similarity query on the vector table."""
        if not query_embedding:
            return []

        with self.Session() as session:
            if self.is_postgres:
                try:
                    query_str = text("""
                        SELECT text_content, metadata_json, 
                               (1 - (vector_data::vector <=> :vector::vector)) as similarity, id 
                        FROM vector_records 
                        ORDER BY vector_data::vector <=> :vector::vector 
                        LIMIT :limit
                    """)
                    vector_param = "[" + ",".join(map(str, query_embedding)) + "]"
                    res = session.execute(query_str, {"vector": vector_param, "limit": limit})
                    results = []
                    for row in res:
                        results.append({
                            "id": row[3],
                            "text": row[0],
                            "metadata": json.loads(row[1]) if row[1] else {},
                            "similarity": float(row[2]) if row[2] is not None else 0.0
                        })
                    return results
                except Exception as e:
                    print(f"[DB] PostgreSQL pgvector query failed: {e}. Falling back to Python similarity.")

            # SQLite/Python Fallback
            records = session.query(DBVectorRecord).all()
            results = []
            for r in records:
                try:
                    vec = json.loads(r.vector_data)
                except Exception:
                    continue
                if len(vec) != len(query_embedding):
                    continue

                dot_product = sum(a * b for a, b in zip(query_embedding, vec))
                magnitude_a = sum(a * a for a in query_embedding) ** 0.5
                magnitude_b = sum(b * b for b in vec) ** 0.5
                similarity = dot_product / (magnitude_a * magnitude_b) if (magnitude_a * magnitude_b) > 0 else 0

                results.append({
                    "id": r.id,
                    "text": r.text_content,
                    "metadata": json.loads(r.metadata_json) if r.metadata_json else {},
                    "similarity": similarity
                })

            results.sort(key=lambda x: x["similarity"], reverse=True)
            return results[:limit]

    def get_all_templates(self) -> List[Dict]:
        """Returns all templates stored in the vector database."""
        with self.Session() as session:
            records = session.query(DBVectorRecord).all()
            results = []
            for r in records:
                try:
                    meta = json.loads(r.metadata_json) if r.metadata_json else {}
                except Exception:
                    meta = {}
                # Deduce name from text_content or meta
                name = meta.get("name", r.text_content.split()[0].capitalize() + " Template")
                results.append({
                    "id": r.id,
                    "name": name,
                    "text": r.text_content,
                    "items": meta.get("items", [])
                })
            return results
            
    def update_template(self, template_id: int, items: List[str]) -> bool:
        """Updates the items of an existing template."""
        with self.Session() as session:
            record = session.query(DBVectorRecord).filter(DBVectorRecord.id == template_id).first()
            if record:
                try:
                    meta = json.loads(record.metadata_json) if record.metadata_json else {}
                except Exception:
                    meta = {}
                meta["items"] = items
                record.metadata_json = json.dumps(meta)
                session.commit()
                return True
            return False

    def delete_template(self, template_id: int) -> bool:
        """Deletes a template from the vector database."""
        with self.Session() as session:
            record = session.query(DBVectorRecord).filter(DBVectorRecord.id == template_id).first()
            if record:
                session.delete(record)
                session.commit()
                return True
            return False
