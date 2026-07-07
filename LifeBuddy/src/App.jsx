import React, { useState, useEffect } from 'react';
import './index.css';

// Mock Data for Grocery Predictions
const initialPredictions = [
  { id: 'p1', name: 'Milk', aisle: 'Dairy', frequency: 'Every 7 days' },
  { id: 'p2', name: 'Apples', aisle: 'Produce', frequency: 'Every 5 days' }
];

function TaskCard({ task, onUpdate, userId, onError, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.desc || '');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDesc(task.desc || '');
    setSubtasks(task.subtasks || []);
  }, [task]);

  const handleToggleExpand = (e) => {
    if (e.target.closest('input') || e.target.closest('textarea') || e.target.closest('button')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const updated = [...subtasks, { title: newSubtask, completed: false }];
    setSubtasks(updated);
    setNewSubtask('');
  };

  const handleToggleSubtask = (index) => {
    const updated = subtasks.map((sub, i) => 
      i === index ? { ...sub, completed: !sub.completed } : sub
    );
    setSubtasks(updated);
  };

  const handleDeleteSubtask = (index) => {
    const updated = subtasks.filter((_, i) => i !== index);
    setSubtasks(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          desc,
          quadrant: task.quadrant,
          subtasks,
          user_id: userId
        })
      });
      if (res.ok) {
        onUpdate();
        setIsExpanded(false);
      } else {
        const errData = await res.json();
        onError(errData.detail || "Failed to save task changes");
      }
    } catch (err) {
      console.error("Error saving task:", err);
      onError("Network error saving task changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setIsSaving(true);
    try {
      const url = `http://localhost:8000/tasks/${task.id}` + (userId ? `?user_id=${userId}` : '');
      const res = await fetch(url, {
        method: 'DELETE'
      });
      if (res.ok) {
        onUpdate();
        setIsExpanded(false);
      } else {
        const errData = await res.json();
        onError(errData.detail || "Failed to delete task");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      onError("Network error deleting task");
    } finally {
      setIsSaving(false);
    }
  };

  let borderColor = 'var(--border-color)';
  if (task.quadrant === 'Q1') borderColor = 'var(--color-q1)';
  else if (task.quadrant === 'Q2') borderColor = 'var(--color-q2)';
  else if (task.quadrant === 'Q3') borderColor = 'var(--color-q3)';
  else if (task.quadrant === 'Q4') borderColor = 'var(--color-q4)';

  return (
    <div 
      className={`task-card ${isExpanded ? 'expanded' : ''}`} 
      style={{ borderLeft: `4px solid ${borderColor}` }}
      onClick={handleToggleExpand}
      draggable={!isExpanded}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver && onDragOver(e, task.id)}
      onDrop={(e) => onDrop && onDrop(e, task.id, task.quadrant)}
    >
      <div className="task-card-header">
        {isExpanded ? (
          <input 
            type="text" 
            className="task-edit-title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h4 className="task-title">{task.title}</h4>
        )}
        <span className="task-toggle-icon">
          {isExpanded ? '\u25bc' : '\u25b6'}
        </span>
      </div>

      {isExpanded && (
        <div className="task-card-body" onClick={(e) => e.stopPropagation()}>
          <div className="task-field-group">
            <label>Description</label>
            <textarea 
              className="task-edit-desc" 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Add description..."
              rows={2}
            />
          </div>

          <div className="subtasks-section">
            <h5>Subtasks</h5>
            <div className="subtasks-list">
              {subtasks.map((sub, idx) => (
                <div key={idx} className="subtask-item">
                  <input 
                    type="checkbox" 
                    checked={sub.completed} 
                    onChange={() => handleToggleSubtask(idx)}
                  />
                  <span className={sub.completed ? 'completed' : ''}>{sub.title}</span>
                  <button 
                    type="button" 
                    className="btn-delete-subtask" 
                    onClick={() => handleDeleteSubtask(idx)}
                    title="Delete Subtask"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="add-subtask-form">
              <input 
                type="text" 
                placeholder="New subtask..." 
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
              />
              <button type="button" onClick={handleAddSubtask} title="Add Subtask">➕</button>
            </div>
          </div>

          <div className="task-actions-row">
            <button 
              type="button" 
              className="btn-delete-task" 
              onClick={handleDelete} 
              disabled={isSaving}
              title="Delete Task"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <button 
              type="button" 
              className="btn-save-task" 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : '💾 Save'}
            </button>
            <button 
              type="button" 
              className="btn-close-task" 
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lifebuddy_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [laterExpanded, setLaterExpanded] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [predictions, setPredictions] = useState(initialPredictions);
  const [groceryList, setGroceryList] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [templateQuery, setTemplateQuery] = useState('');
  const [pendingApproval, setPendingApproval] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [calendarView, setCalendarView] = useState('Day');
  const [addingToQuadrant, setAddingToQuadrant] = useState(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryAisle, setNewGroceryAisle] = useState('Produce');
  const [scheduledSlots, setScheduledSlots] = useState({
    '08:00 AM': 'inbox',
    '12:00 PM': 'lunch',
    '05:00 PM': 'review'
  });
  
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // Auth Form Input States
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify'
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What was the name of your first school?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // Forgot Password / Reset states
  const [resetChallengeQuestion, setResetChallengeQuestion] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Security Permissions State (AI Auto-Pilot toggles)
  const [autopilotCalendar, setAutopilotCalendar] = useState(false);
  const [autopilotEmail, setAutopilotEmail] = useState(false);

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 8000);
  };

  // Fetch tasks and grocery items
  const fetchTasks = async (uId = user?.id) => {
    try {
      const url = 'http://localhost:8000/tasks' + (uId ? `?user_id=${uId}` : '');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const fetchGroceries = async (uId = user?.id) => {
    try {
      const url = 'http://localhost:8000/groceries' + (uId ? `?user_id=${uId}` : '');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGroceryList(data);
      }
    } catch (err) {
      console.error("Error fetching groceries:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('http://localhost:8000/groceries/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || groceryList.length === 0) return;
    try {
      const items = groceryList.map(g => g.name);
      const res = await fetch('http://localhost:8000/groceries/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTemplateName, items })
      });
      if (res.ok) {
        setNewTemplateName('');
        fetchTemplates();
      } else {
        showError("Failed to create template");
      }
    } catch (err) {
      showError("Network error creating template");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId || groceryList.length === 0) return;
    try {
      const items = groceryList.map(g => g.name);
      const tpl = templates.find(t => t.id.toString() === selectedTemplateId);
      const res = await fetch(`http://localhost:8000/groceries/templates/${selectedTemplateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tpl.name, items })
      });
      if (res.ok) {
        fetchTemplates();
      } else {
        showError("Failed to update template");
      }
    } catch (err) {
      showError("Network error updating template");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;
    try {
      const res = await fetch(`http://localhost:8000/groceries/templates/${selectedTemplateId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedTemplateId('');
        fetchTemplates();
      } else {
        showError("Failed to delete template");
      }
    } catch (err) {
      showError("Network error deleting template");
    }
  };

  const handleLoadSelectedTemplate = async () => {
    if (!selectedTemplateId) return;
    const tpl = templates.find(t => t.id.toString() === selectedTemplateId);
    if (!tpl) return;
    try {
      const res = await fetch('http://localhost:8000/groceries/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tpl.text, user_id: user?.id })
      });
      if (res.ok) {
        fetchGroceries();
      }
    } catch (err) {
      showError("Network error loading template");
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDraggedOverColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetQuadrant) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If target quadrant is the same, do nothing (reordering uses handleDropOnTask)
    if (task.quadrant === targetQuadrant) return;

    try {
      const url = `http://localhost:8000/tasks/${taskId}/quadrant?quadrant=${targetQuadrant}` + (user?.id ? `&user_id=${user.id}` : '');
      const res = await fetch(url, { method: 'PUT' });
      if (res.ok) {
        const otherTasks = tasks.filter(t => t.quadrant === targetQuadrant && t.id !== taskId);
        const reorderedIds = [...otherTasks.map(t => t.id), taskId];
        
        await fetch('http://localhost:8000/tasks/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_ids: reorderedIds,
            user_id: user?.id
          })
        });
        
        fetchTasks(user?.id);
      } else {
        const err = await res.json();
        showError(err.detail || "Failed to move task");
      }
    } catch (err) {
      showError("Network error moving task");
    }
  };

  const handleDropOnTask = async (e, targetTaskId, targetQuadrant) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId || taskId === targetTaskId) return;

    const draggedTask = tasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    let quadrantTasks = tasks.filter(t => {
      const isTargetCol = targetQuadrant === 'Q1'
        ? (t.quadrant === 'Q1' || t.quadrant === 'Q3')
        : (t.quadrant === targetQuadrant);
      return isTargetCol && t.id !== taskId;
    });

    const targetIdx = quadrantTasks.findIndex(t => t.id === targetTaskId);
    if (targetIdx === -1) return;

    const originalQuadrant = draggedTask.quadrant;
    const newQuadrant = targetQuadrant === 'Q1'
      ? (tasks.find(t => t.id === targetTaskId)?.quadrant || 'Q1')
      : targetQuadrant;

    if (originalQuadrant !== newQuadrant) {
      try {
        const url = `http://localhost:8000/tasks/${taskId}/quadrant?quadrant=${newQuadrant}` + (user?.id ? `&user_id=${user.id}` : '');
        const res = await fetch(url, { method: 'PUT' });
        if (!res.ok) {
          const err = await res.json();
          showError(err.detail || "Failed to move task");
          return;
        }
      } catch (err) {
        showError("Network error moving task");
        return;
      }
    }

    const targetTaskModel = tasks.find(t => t.id === taskId) || { ...draggedTask, quadrant: newQuadrant };
    quadrantTasks.splice(targetIdx, 0, targetTaskModel);

    const reorderedIds = quadrantTasks.map(t => t.id);
    try {
      const res = await fetch('http://localhost:8000/tasks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_ids: reorderedIds,
          user_id: user?.id
        })
      });
      if (res.ok) {
        fetchTasks(user?.id);
      } else {
        const err = await res.json();
        showError(err.detail || "Failed to reorder tasks");
      }
    } catch (err) {
      showError("Network error reordering tasks");
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchGroceries();
      fetchTemplates();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!usernameInput.trim() || !passwordInput) return;
    try {
      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      if (res.ok) {
        const loggedInUser = await res.json();
        localStorage.setItem('lifebuddy_user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        setUsernameInput('');
        setPasswordInput('');
        setSuccessMessage('');
      } else if (res.status === 403) {
        const err = await res.json();
        showError(err.detail?.message || "Please verify your email.");
        if (err.detail?.email) {
          setEmailInput(err.detail.email);
          setAuthMode('verify');
        }
      } else {
        const err = await res.json();
        showError(err.detail || "Invalid credentials");
      }
    } catch (err) {
      showError("Connection error during login");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!usernameInput.trim() || !emailInput.trim() || !passwordInput || !confirmPasswordInput || !securityAnswer.trim()) {
      showError("All fields are required to register.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      showError("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          email: emailInput.trim().toLowerCase(),
          password: passwordInput,
          security_question: securityQuestion,
          security_answer: securityAnswer
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "VERIFICATION_REQUIRED") {
          setAuthMode('verify');
          setEmailInput(data.email);
          setSuccessMessage("Account registered! Please enter the 6-digit verification code sent to your email.");
          setPasswordInput('');
          setConfirmPasswordInput('');
        } else {
          localStorage.setItem('lifebuddy_user', JSON.stringify(data));
          setUser(data);
          setUsernameInput('');
          setPasswordInput('');
          setConfirmPasswordInput('');
          setSuccessMessage('');
        }
      } else {
        const err = await res.json();
        showError(err.detail || "Registration failed");
      }
    } catch (err) {
      showError("Connection error during registration");
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!emailInput.trim() || !verificationCodeInput.trim()) {
      showError("Email and verification code are required.");
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          code: verificationCodeInput.trim()
        })
      });
      if (res.ok) {
        const verifiedUser = await res.json();
        localStorage.setItem('lifebuddy_user', JSON.stringify(verifiedUser));
        setUser(verifiedUser);
        setUsernameInput('');
        setPasswordInput('');
        setEmailInput('');
        setVerificationCodeInput('');
        setSuccessMessage("Account verified successfully! Welcome to LifeBuddy.");
      } else {
        const err = await res.json();
        showError(err.detail || "Verification failed");
      }
    } catch (err) {
      showError("Connection error during verification");
    }
  };

  const handleGetChallenge = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!emailInput.trim()) {
      showError("Please enter your email address first.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/reset-password/challenge/${encodeURIComponent(emailInput.trim().toLowerCase())}`);
      if (res.ok) {
        const data = await res.json();
        setResetChallengeQuestion(data.security_question);
      } else {
        const err = await res.json();
        showError(err.detail || "User not found or no security question set.");
      }
    } catch (err) {
      showError("Connection error fetching challenge.");
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!securityAnswer.trim() || !newPasswordInput || !confirmNewPasswordInput) {
      showError("All fields are required.");
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      showError("New passwords do not match.");
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          security_answer: securityAnswer,
          new_password: newPasswordInput
        })
      });
      if (res.ok) {
        setSuccessMessage("Password reset successfully! You can now log in.");
        setAuthMode('login');
        setPasswordInput('');
        setEmailInput('');
        setNewPasswordInput('');
        setConfirmNewPasswordInput('');
        setSecurityAnswer('');
        setResetChallengeQuestion('');
      } else {
        const err = await res.json();
        showError(err.detail || "Failed to reset password.");
      }
    } catch (err) {
      showError("Connection error during password reset.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lifebuddy_user');
    setUser(null);
    setTasks([]);
    setGroceryList([]);
    setSuccessMessage('');
    setUsernameInput('');
    setPasswordInput('');
    setEmailInput('');
    setVerificationCodeInput('');
  };

  // Submit quick create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setErrorMessage('');

    try {
      const res = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          autopilot_enabled: autopilotCalendar,
          user_id: user?.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "AWAITING_REVIEW") {
          setPendingApproval(data);
        } else {
          setNewTaskTitle('');
          fetchTasks();
        }
      } else {
        const err = await res.json();
        showError(err.detail || "Error creating task");
      }
    } catch (err) {
      console.error("Error creating task:", err);
      showError("Connection error creating task");
    }
  };

  const handleCreateInlineTask = async (e, targetQuadrant) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) {
      setAddingToQuadrant(null);
      return;
    }
    setErrorMessage('');

    try {
      const res = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inlineTaskTitle,
          user_id: user?.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status !== "AWAITING_REVIEW" && data.id) {
          // Immediately move to the correct quadrant
          if (data.quadrant !== targetQuadrant) {
             await fetch(`http://localhost:8000/tasks/${data.id}/quadrant?quadrant=${targetQuadrant}${user?.id ? `&user_id=${user.id}` : ''}`, { method: 'PUT' });
          }
        }
        setInlineTaskTitle('');
        setAddingToQuadrant(null);
        fetchTasks();
      } else {
        const err = await res.json();
        showError(err.detail || "Error creating task");
      }
    } catch (err) {
      console.error("Error creating inline task:", err);
      showError("Connection error creating task");
    }
  };

  // Approve intercepted action
  const handleApproveAction = async () => {
    if (!pendingApproval) return;
    setErrorMessage('');
    try {
      const res = await fetch('http://localhost:8000/security/policy-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'spiffe://lifebuddy.local/agent/product-owner',
          tool: pendingApproval.action,
          arguments: {
            summary: pendingApproval.details,
            calendar_slot: pendingApproval.vibe_diff
          }
        })
      });

      if (res.ok) {
        const check = await res.json();
        if (check.allowed) {
          // Execute creation
          const createRes = await fetch('http://localhost:8000/tasks/confirm-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: pendingApproval.task_title,
              quadrant: 'Q3',
              user_id: user?.id
            })
          });

          if (createRes.ok) {
            setPendingApproval(null);
            setNewTaskTitle('');
            fetchTasks();
          }
        } else {
          alert(`Security Gate Intercept: ${check.reason}`);
          setPendingApproval(null);
        }
      }
    } catch (err) {
      console.error("Error approving action:", err);
    }
  };

  // Load semantic grocery template
  const handleLoadTemplate = async (e) => {
    e.preventDefault();
    if (!templateQuery.trim()) return;
    setErrorMessage('');

    try {
      const res = await fetch('http://localhost:8000/groceries/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: templateQuery,
          user_id: user?.id
        })
      });

      if (res.ok) {
        setTemplateQuery('');
        fetchGroceries();
      } else {
        const err = await res.json();
        showError(err.detail || "Error loading template");
      }
    } catch (err) {
      console.error("Error loading template:", err);
      showError("Connection error loading template");
    }
  };

  // Add predicted item to active list
  const acceptPrediction = async (pred) => {
    setErrorMessage('');
    try {
      const res = await fetch('http://localhost:8000/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pred.name,
          aisle: pred.aisle,
          user_id: user?.id
        })
      });

      if (res.ok) {
        const newItem = await res.json();
        setGroceryList(prev => [...prev, newItem]);
        setPredictions(prev => prev.filter(p => p.id !== pred.id));
      } else {
        const err = await res.json();
        showError(err.detail || "Error adding predicted item");
      }
    } catch (err) {
      console.error("Error adding grocery item:", err);
      showError("Connection error adding predicted item");
    }
  };

  const handleCreateGrocery = async (e) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;
    setErrorMessage('');
    try {
      const res = await fetch('http://localhost:8000/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroceryName,
          aisle: newGroceryAisle,
          user_id: user?.id
        })
      });

      if (res.ok) {
        setNewGroceryName('');
        fetchGroceries();
      } else {
        const err = await res.json();
        showError(err.detail || "Error adding grocery item");
      }
    } catch (err) {
      console.error("Error adding grocery item:", err);
      showError("Connection error adding grocery item");
    }
  };

  const handleAutoSchedule = () => {
    const q1Tasks = tasks.filter(t => t.quadrant === 'Q1' || t.quadrant === 'Q3');
    const q2Tasks = tasks.filter(t => t.quadrant === 'Q2');
    
    const newSchedule = {
      '08:00 AM': 'inbox',
      '12:00 PM': 'lunch',
      '05:00 PM': 'review'
    };
    
    const morningSlots = ['09:00 AM', '10:00 AM', '11:00 AM'];
    const afternoonSlots = ['01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
    
    let q1Idx = 0;
    morningSlots.forEach(slot => {
      if (q1Idx < q1Tasks.length) {
        newSchedule[slot] = q1Tasks[q1Idx].id;
        q1Idx++;
      }
    });
    
    let q2Idx = 0;
    afternoonSlots.forEach(slot => {
      if (q2Idx < q2Tasks.length) {
        newSchedule[slot] = q2Tasks[q2Idx].id;
        q2Idx++;
      }
    });
    
    setScheduledSlots(newSchedule);
  };

  // Reject prediction
  const dismissPrediction = (id) => {
    setPredictions(predictions.filter(p => p.id !== id));
  };

  const handleUpdateGrocery = async (itemId, newQuantity, newNote) => {
    // Optimistically update UI
    setGroceryList(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity, note: newNote } : item
    ));

    try {
      const url = `http://localhost:8000/groceries/${itemId}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: newQuantity || '',
          note: newNote || '',
          user_id: user?.id
        })
      });
      if (!res.ok) {
        const err = await res.json();
        showError(err.detail || "Error updating grocery item");
        fetchGroceries(); // Revert on failure
      }
    } catch (err) {
      console.error("Error updating grocery:", err);
      showError("Connection error updating grocery item");
      fetchGroceries(); // Revert on failure
    }
  };

  const handleCheckGrocery = async (itemId) => {
    setErrorMessage('');
    try {
      const url = `http://localhost:8000/groceries/${itemId}` + (user?.id ? `?user_id=${user.id}` : '');
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        setGroceryList(prev => prev.filter(i => i.id !== itemId));
      } else {
        const err = await res.json();
        showError(err.detail || "Error removing grocery item");
      }
    } catch (err) {
      console.error("Error checking off grocery:", err);
      showError("Connection error removing grocery item");
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[@$!%*?&_#^+\-=(){}\[\]:;\"'<>,.?/|\\#]/.test(pass)) score++;
    
    if (score <= 2) return { score, label: 'Weak (needs 8+ chars, upper, lower, digit, special)', color: '#ef4444' };
    if (score <= 4) return { score, label: 'Medium (almost secure)', color: '#eab308' };
    return { score, label: 'Strong (secure)', color: '#22c55e' };
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Life Buddy</h1>
            <p>Your Everyday Organizer & Companion</p>
          </div>
          {errorMessage && (
            <div className="error-banner">
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage('')}>&times;</button>
            </div>
          )}
          {successMessage && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{successMessage}</span>
              <button type="button" onClick={() => setSuccessMessage('')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>&times;</button>
            </div>
          )}

          {authMode === 'login' && (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-input-group">
                <label htmlFor="auth-username">Username</label>
                <input 
                  type="text" 
                  id="auth-username" 
                  placeholder="e.g. alex" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="auth-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="auth-password" 
                    placeholder="••••••••" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', padding: '0.2rem' }}
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>
              <div className="auth-actions">
                <button type="submit" className="btn-primary">Login</button>
                <button type="button" className="btn-secondary" onClick={() => { setAuthMode('register'); setErrorMessage(''); setSuccessMessage(''); setPasswordInput(''); setConfirmPasswordInput(''); }}>Register New Account</button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setAuthMode('forgot'); setErrorMessage(''); setSuccessMessage(''); setEmailInput(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                  Forgot Password?
                </button>
              </div>
            </form>
          )}

          {authMode === 'register' && (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="auth-input-group">
                <label htmlFor="auth-username">Username</label>
                <input 
                  type="text" 
                  id="auth-username" 
                  placeholder="e.g. alex" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="auth-email">Email Address</label>
                <input 
                  type="email" 
                  id="auth-email" 
                  placeholder="e.g. alex@example.com" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="auth-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="auth-password" 
                    placeholder="Must be 8+ chars" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem', width: '100%' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', padding: '0.2rem' }}
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {passwordInput && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: getPasswordStrength(passwordInput).color, fontWeight: '700' }}>
                    Strength: {getPasswordStrength(passwordInput).label}
                  </div>
                )}
              </div>
              <div className="auth-input-group">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <input 
                  type="password" 
                  id="auth-confirm-password" 
                  placeholder="Re-enter password" 
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="auth-security-question">Security Question (for reset)</label>
                <select 
                  id="auth-security-question"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                </select>
              </div>
              <div className="auth-input-group">
                <label htmlFor="auth-security-answer">Security Answer</label>
                <input 
                  type="text" 
                  id="auth-security-answer" 
                  placeholder="Your secret answer" 
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  required
                />
              </div>
              <div className="auth-actions">
                <button type="submit" className="btn-primary">Register Account</button>
                <button type="button" className="btn-secondary" onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}>Back to Login</button>
              </div>
            </form>
          )}

          {authMode === 'verify' && (
            <form className="auth-form" onSubmit={handleVerifyEmail}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
                We have logged a 6-digit verification code to the server outbox/console for <strong>{emailInput}</strong>. Please enter the verification code below to activate your account.
              </p>
              <div className="auth-input-group">
                <label htmlFor="auth-verification-code">Verification Code</label>
                <input 
                  type="text" 
                  id="auth-verification-code" 
                  placeholder="e.g. 123456" 
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value)}
                  required
                />
              </div>
              <div className="auth-actions">
                <button type="submit" className="btn-primary">Verify & Activate</button>
                <button type="button" className="btn-secondary" onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); setVerificationCodeInput(''); }}>Back to Login</button>
              </div>
            </form>
          )}

          {authMode === 'forgot' && (
            <form className="auth-form" onSubmit={resetChallengeQuestion ? handleResetSubmit : handleGetChallenge}>
              <div className="auth-input-group">
                <label htmlFor="auth-email">Email Address</label>
                <input 
                  type="email" 
                  id="auth-email" 
                  placeholder="Enter registered email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={!!resetChallengeQuestion}
                  required
                />
              </div>

              {!resetChallengeQuestion ? (
                <div className="auth-actions">
                  <button type="submit" className="btn-primary">Find Account</button>
                  <button type="button" className="btn-secondary" onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}>Back to Login</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Security Question:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{resetChallengeQuestion}</span>
                  </div>
                  <div className="auth-input-group">
                    <label htmlFor="auth-security-answer">Your Answer</label>
                    <input 
                      type="text" 
                      id="auth-security-answer" 
                      placeholder="Enter security answer" 
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-input-group">
                    <label htmlFor="auth-new-password">New Password</label>
                    <input 
                      type="password" 
                      id="auth-new-password" 
                      placeholder="Must be 8+ characters" 
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      required
                    />
                    {newPasswordInput && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: getPasswordStrength(newPasswordInput).color, fontWeight: '700' }}>
                        Strength: {getPasswordStrength(newPasswordInput).label}
                      </div>
                    )}
                  </div>
                  <div className="auth-input-group">
                    <label htmlFor="auth-confirm-new-password">Confirm New Password</label>
                    <input 
                      type="password" 
                      id="auth-confirm-new-password" 
                      placeholder="Re-enter new password" 
                      value={confirmNewPasswordInput}
                      onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-actions">
                    <button type="submit" className="btn-primary">Reset Password</button>
                    <button type="button" className="btn-secondary" onClick={() => { setResetChallengeQuestion(''); setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}>Cancel</button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar" aria-label="Main Navigation">
        <div className="sidebar-brand">
          <h1>Life Buddy</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Everyday Companion</p>
        </div>
        
        <div className="sidebar-menu">
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`sidebar-link ${activeTab === 'tasks' ? 'active' : ''}`}
          >
            Tasks
          </button>
          <button 
            onClick={() => setActiveTab('groceries')} 
            className={`sidebar-link ${activeTab === 'groceries' ? 'active' : ''}`}
          >
            Groceries
          </button>
          <button 
            onClick={() => setActiveTab('calendar')} 
            className={`sidebar-link ${activeTab === 'calendar' ? 'active' : ''}`}
          >
            Calendar
          </button>
        </div>

        {/* Global Security Toggles & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>


          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button 
              type="button" 
              onClick={handleLogout} 
              className="sidebar-link"
              style={{ color: '#ef4444', background: 'transparent', padding: '0.6rem 0.8rem' }}
            >
              Logout ({user.username})
            </button>
          </div>
        </div>
      </nav>

      {/* Main content workspace */}
      <main className="main-content" role="main">
        {errorMessage && (
          <div className="error-banner">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage('')}>&times;</button>
          </div>
        )}

        {activeTab === 'tasks' && (
          <section aria-label="Task Manager Section">
            <header style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Task Buddy</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Organize your schedule dynamically</p>
            </header>

            {/* Quick-Create Box */}
            <form onSubmit={handleCreateTask} className="input-container" aria-label="Quick Create Task Form" style={{ marginBottom: '2rem' }}>
              <input
                type="text"
                id="quick-create-input"
                className="input-field"
                placeholder="Schedule dentist appointment for next Monday at 3 PM..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                aria-label="Natural Language Task Input"
              />
              <button type="submit" className="btn-primary">
                Quick Create
              </button>
            </form>

            {/* 3-Column Layout */}
            <div className="tasks-columns-container">
              {/* Urgent Column */}
              <div className="tasks-column urgent-col">
                <div className="column-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3>Urgent</h3>
                    <span className="task-count">
                      {tasks.filter(t => t.quadrant === 'Q1' || t.quadrant === 'Q3').length}
                    </span>
                  </div>
                  <button type="button" onClick={() => setAddingToQuadrant('Q1')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Add Urgent Task">➕</button>
                  {addingToQuadrant === 'Q1' && (
                    <form onSubmit={(e) => handleCreateInlineTask(e, 'Q1')} style={{ width: '100%', display: 'flex', gap: '0.2rem' }}>
                      <input type="text" autoFocus value={inlineTaskTitle} onChange={(e) => setInlineTaskTitle(e.target.value)} placeholder="New task..." className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      <button type="submit" className="btn-primary" style={{ padding: '0.4rem' }}>✓</button>
                      <button type="button" onClick={() => setAddingToQuadrant(null)} style={{ padding: '0.4rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                    </form>
                  )}
                </div>
                <div 
                  className={`column-body ${draggedOverColumn === 'Q1' ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDraggedOverColumn('Q1')}
                  onDragLeave={() => setDraggedOverColumn(null)}
                  onDrop={(e) => handleDrop(e, 'Q1')}
                >
                  {tasks.filter(t => t.quadrant === 'Q1' || t.quadrant === 'Q3').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onUpdate={fetchTasks} 
                      userId={user.id} 
                      onError={showError} 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDropOnTask}
                    />
                  ))}
                </div>
              </div>

              {/* Important Column */}
              <div className="tasks-column important-col">
                <div className="column-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3>Important</h3>
                    <span className="task-count">
                      {tasks.filter(t => t.quadrant === 'Q2').length}
                    </span>
                  </div>
                  <button type="button" onClick={() => setAddingToQuadrant('Q2')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Add Important Task">➕</button>
                  {addingToQuadrant === 'Q2' && (
                    <form onSubmit={(e) => handleCreateInlineTask(e, 'Q2')} style={{ width: '100%', display: 'flex', gap: '0.2rem' }}>
                      <input type="text" autoFocus value={inlineTaskTitle} onChange={(e) => setInlineTaskTitle(e.target.value)} placeholder="New task..." className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      <button type="submit" className="btn-primary" style={{ padding: '0.4rem' }}>✓</button>
                      <button type="button" onClick={() => setAddingToQuadrant(null)} style={{ padding: '0.4rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                    </form>
                  )}
                </div>
                <div 
                  className={`column-body ${draggedOverColumn === 'Q2' ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDraggedOverColumn('Q2')}
                  onDragLeave={() => setDraggedOverColumn(null)}
                  onDrop={(e) => handleDrop(e, 'Q2')}
                >
                  {tasks.filter(t => t.quadrant === 'Q2').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onUpdate={fetchTasks} 
                      userId={user.id} 
                      onError={showError} 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDropOnTask}
                    />
                  ))}
                </div>
              </div>

              {/* Later Column */}
              <div className={`tasks-column later-col ${laterExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="column-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setLaterExpanded(!laterExpanded)}>
                    <h3>Later</h3>
                    <span className="task-count">
                      {tasks.filter(t => t.quadrant === 'Q4').length}
                    </span>
                    <button type="button" className="btn-toggle-column">
                      {laterExpanded ? '\u25c0' : '\u25b6'}
                    </button>
                  </div>
                  <button type="button" onClick={() => { setLaterExpanded(true); setAddingToQuadrant('Q4'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Add Later Task">➕</button>
                  {addingToQuadrant === 'Q4' && laterExpanded && (
                    <form onSubmit={(e) => handleCreateInlineTask(e, 'Q4')} style={{ width: '100%', display: 'flex', gap: '0.2rem' }}>
                      <input type="text" autoFocus value={inlineTaskTitle} onChange={(e) => setInlineTaskTitle(e.target.value)} placeholder="New task..." className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      <button type="submit" className="btn-primary" style={{ padding: '0.4rem' }}>✓</button>
                      <button type="button" onClick={() => setAddingToQuadrant(null)} style={{ padding: '0.4rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                    </form>
                  )}
                </div>
                {laterExpanded && (
                  <div 
                    className={`column-body ${draggedOverColumn === 'Q4' ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDraggedOverColumn('Q4')}
                    onDragLeave={() => setDraggedOverColumn(null)}
                    onDrop={(e) => handleDrop(e, 'Q4')}
                  >
                    {tasks.filter(t => t.quadrant === 'Q4').map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onUpdate={fetchTasks} 
                        userId={user.id} 
                        onError={showError} 
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDropOnTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'groceries' && (
          <section aria-label="Groceries Buddy Section">
            <header style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Groceries Buddy</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Manage your shopping list and load smart templates</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Left Column: Active List & Manual Add */}
              <div>
                {/* Manual Add Form */}
                <form onSubmit={handleCreateGrocery} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--border-color)' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ flex: 2, padding: '0.6rem', fontSize: '0.9rem' }}
                    placeholder="Add item (e.g. Milk)..."
                    value={newGroceryName}
                    onChange={(e) => setNewGroceryName(e.target.value)}
                  />
                  <select 
                    className="input-field" 
                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}
                    value={newGroceryAisle}
                    onChange={(e) => setNewGroceryAisle(e.target.value)}
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Meat">Meat</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Other">Other</option>
                  </select>
                  <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1rem', flexShrink: 0 }}>➕</button>
                </form>

                {/* Active Grocery List */}
                <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--rounded-xl)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Active List</h3>
                  {groceryList.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Your list is empty. Add items or load a template.</p>
                  ) : (
                    ['Produce', 'Dairy', 'Bakery', 'Meat', 'Pantry', 'Other'].map(aisle => {
                      const items = groceryList.filter(i => i.aisle === aisle);
                      if (items.length === 0) return null;
                      return (
                        <div key={aisle} style={{ marginBottom: '1.2rem' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: '700' }}>{aisle}</h4>
                          {items.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.6rem 0' }}>
                              <input 
                                type="checkbox" 
                                style={{ cursor: 'pointer', marginTop: '0.3rem' }} 
                                id={`item-${item.id}`} 
                                onChange={() => handleCheckGrocery(item.id)}
                              />
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <label htmlFor={`item-${item.id}`} style={{ fontSize: '0.95rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}>
                                    {item.name}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Qty/Wt (e.g. 2 lbs)"
                                    value={item.quantity || ''}
                                    onChange={(e) => {
                                      setGroceryList(prev => prev.map(g => g.id === item.id ? { ...g, quantity: e.target.value } : g));
                                    }}
                                    onBlur={(e) => handleUpdateGrocery(item.id, e.target.value, item.note)}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '4px', width: '110px' }}
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Add a small note..."
                                  value={item.note || ''}
                                  onChange={(e) => {
                                    setGroceryList(prev => prev.map(g => g.id === item.id ? { ...g, note: e.target.value } : g));
                                  }}
                                  onBlur={(e) => handleUpdateGrocery(item.id, item.quantity, e.target.value)}
                                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', border: '1px solid transparent', background: '#f1f5f9', borderRadius: '4px', color: 'var(--text-secondary)', width: '100%' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Templates & Predictions */}
              <div>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--rounded-xl)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem' }}>Smart Templates</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Click a template to load matching items via semantic search.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        value={selectedTemplateId} 
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      >
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                        {templates.length === 0 && <option value="" disabled>No templates available</option>}
                      </select>
                      <button onClick={handleLoadSelectedTemplate} className="btn-primary" style={{ padding: '0.6rem 1rem' }} disabled={!selectedTemplateId}>Load</button>
                    </div>
                    {selectedTemplateId && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleUpdateTemplate} style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Overwrite with Active List</button>
                        <button onClick={handleDeleteTemplate} style={{ flex: 1, padding: '0.4rem', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', background: '#fef2f2', cursor: 'pointer', fontSize: '0.8rem' }}>Delete Template</button>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem' }}>Save Active List as Template</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="New template name..." 
                        value={newTemplateName} 
                        onChange={(e) => setNewTemplateName(e.target.value)} 
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }} 
                      />
                      <button onClick={handleCreateTemplate} className="btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={!newTemplateName.trim() || groceryList.length === 0}>Save</button>
                    </div>
                  </div>

                  {/* Proactive Prediction Alerts */}
                  {predictions.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.8rem', color: 'var(--primary)' }}>Predicted from History</h3>
                      {predictions.map(pred => (
                        <div key={pred.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.8rem 1rem', borderRadius: 'var(--rounded-lg)', marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <div>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{pred.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>({pred.aisle} - {pred.frequency})</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => acceptPrediction(pred)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Add</button>
                            <button onClick={() => dismissPrediction(pred.id)} style={{ background: '#e2e8f0', color: 'var(--text-primary)', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>Dismiss</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'calendar' && (
          <section aria-label="Calendar Agenda Section">
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Timeline Buddy</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View your schedule by Day, Week, or Month</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.05)', padding: '0.3rem', borderRadius: '8px' }}>
                {['Day', 'Week', 'Month'].map(view => (
                  <button 
                    key={view}
                    onClick={() => setCalendarView(view)}
                    style={{ 
                      padding: '0.4rem 1rem', 
                      background: calendarView === view ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: calendarView === view ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      color: calendarView === view ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </header>

            {calendarView === 'Day' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Daily Timeblocker</h3>
                  <button onClick={handleAutoSchedule} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>✨</span> Auto-Schedule My Day
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--border-color)' }}>
                  {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map((hour) => (
                    <div key={hour} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', width: '80px' }}>{hour}</span>
                      <select 
                        value={scheduledSlots[hour] || ''} 
                        onChange={(e) => setScheduledSlots({...scheduledSlots, [hour]: e.target.value})}
                        style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#ffffff', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        <option value="">-- Open Slot --</option>
                        <option value="inbox">Morning Inbox Triage</option>
                        <option value="lunch">Lunch & Break</option>
                        <option value="review">Day Review Wrap-up</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.quadrant})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {calendarView === 'Week' && (
              <div style={{ display: 'flex', gap: '0.5rem', minHeight: '400px' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={day} style={{ flex: 1, background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--rounded-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{ textAlign: 'center', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>{day}</h3>
                    {idx === 0 && <div style={{ background: 'var(--color-q1)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>{tasks.find(t => t.quadrant === 'Q1')?.title || 'Urgent Task'}</div>}
                    {idx === 2 && <div style={{ background: 'var(--color-q2)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>{tasks.find(t => t.quadrant === 'Q2')?.title || 'Important Task'}</div>}
                    {idx === 4 && <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Weekly Review</div>}
                  </div>
                ))}
              </div>
            )}

            {calendarView === 'Month' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem', background: '#e2e8f0', border: '1px solid var(--border-color)', borderRadius: 'var(--rounded-lg)', padding: '0.3rem' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={`header-${day}`} style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{day}</div>
                ))}
                {Array.from({ length: 30 }).map((_, idx) => (
                  <div key={idx} style={{ background: '#ffffff', minHeight: '80px', padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{idx + 1}</span>
                    {idx === 14 && <div style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem', borderRadius: '2px', fontSize: '0.65rem', marginTop: 'auto' }}>Project Due</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Logic Review Modal (HITL Gate) */}
      {pendingApproval && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content">
            <h2 id="modal-title" className="modal-header">Logic Review: {pendingApproval.action}</h2>
            <div className="modal-body">
              <p style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Proposed Action Summary:</p>
              <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--primary)' }}>"{pendingApproval.vibe_diff}"</p>
              <p style={{ fontSize: '0.85rem' }}>{pendingApproval.details}</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setPendingApproval(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleApproveAction} className="btn-approve">
                Approve & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
