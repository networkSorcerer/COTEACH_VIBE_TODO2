// 백엔드 API 엔드포인트
const API_BASE_URL = 'http://localhost:5000/todos';

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoListEl = document.getElementById("todo-list");
const emptyMessageEl = document.getElementById("empty-message");
const todoTemplate = document.getElementById("todo-item-template");

let todos = [];

// ----- API 호출 함수들 -----
async function fetchTodos() {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("할일 목록 불러오기 실패:", error);
    alert("할일 목록을 불러오는 중 오류가 발생했습니다.");
    return [];
  }
}

async function createTodo(title, description = '') {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("할일 추가 실패:", error);
    alert(`할일을 추가하는 중 오류가 발생했습니다: ${error.message}`);
    throw error;
  }
}

async function updateTodo(id, updates) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("할일 수정 실패:", error);
    alert(`할일을 수정하는 중 오류가 발생했습니다: ${error.message}`);
    throw error;
  }
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("할일 삭제 실패:", error);
    alert(`할일을 삭제하는 중 오류가 발생했습니다: ${error.message}`);
    throw error;
  }
}

// ----- UI 렌더링 -----
function renderTodos() {
  todoListEl.innerHTML = "";

  if (!todos.length) {
    emptyMessageEl.style.display = "block";
    return;
  }
  emptyMessageEl.style.display = "none";

  todos.forEach((todo) => {
    const li = createTodoElement(todo);
    todoListEl.appendChild(li);
  });
}

function createTodoElement(todo) {
  const fragment = todoTemplate.content.cloneNode(true);
  const li = fragment.querySelector(".todo-item");
  const checkbox = fragment.querySelector(".todo-checkbox");
  const textSpan = fragment.querySelector(".todo-text");
  const editInput = fragment.querySelector(".todo-edit-input");
  const editBtn = fragment.querySelector(".edit-btn");
  const saveBtn = fragment.querySelector(".save-btn");
  const cancelBtn = fragment.querySelector(".cancel-btn");
  const deleteBtn = fragment.querySelector(".delete-btn");

  li.dataset.id = String(todo._id);
  textSpan.textContent = todo.title;
  editInput.value = todo.title;
  checkbox.checked = !!todo.completed;

  if (todo.completed) {
    textSpan.classList.add("completed");
  }

  // 체크박스: 완료/미완료
  checkbox.addEventListener("change", async () => {
    try {
      await updateTodo(todo._id, { completed: checkbox.checked });
      await loadTodos(); // 목록 다시 불러오기
    } catch (error) {
      // 에러 발생 시 체크박스 상태 되돌리기
      checkbox.checked = !checkbox.checked;
    }
  });

  // 수정 버튼
  editBtn.addEventListener("click", () => {
    startEdit(li);
  });

  // 저장 버튼
  saveBtn.addEventListener("click", async () => {
    const newTitle = editInput.value.trim();
    if (!newTitle) {
      cancelEdit(li);
      return;
    }
    try {
      await updateTodo(todo._id, { title: newTitle });
      await loadTodos(); // 목록 다시 불러오기
    } catch (error) {
      // 에러 발생 시 편집 모드 유지
    }
  });

  // 취소 버튼
  cancelBtn.addEventListener("click", () => {
    cancelEdit(li);
  });

  // Enter / Esc 키 처리
  editInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTitle = editInput.value.trim();
      if (!newTitle) {
        cancelEdit(li);
        return;
      }
      try {
        await updateTodo(todo._id, { title: newTitle });
        await loadTodos(); // 목록 다시 불러오기
      } catch (error) {
        // 에러 발생 시 편집 모드 유지
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit(li);
    }
  });

  // 삭제 버튼
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    try {
      await deleteTodo(todo._id);
      await loadTodos(); // 목록 다시 불러오기
    } catch (error) {
      // 에러는 이미 deleteTodo에서 처리됨
    }
  });

  return li;
}

// ----- CRUD 로직 -----
async function addTodo(title) {
  if (!title.trim()) return;
  try {
    await createTodo(title.trim());
    await loadTodos(); // 목록 다시 불러오기
  } catch (error) {
    // 에러는 이미 createTodo에서 처리됨
  }
}

// ----- 편집 모드 -----
function startEdit(li) {
  li.classList.add("editing");
  const editInput = li.querySelector(".todo-edit-input");
  if (editInput) {
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }
}

function cancelEdit(li) {
  li.classList.remove("editing");
  // 원래 값으로 복원
  const todoId = li.dataset.id;
  const todo = todos.find(t => t._id === todoId);
  if (todo) {
    const editInput = li.querySelector(".todo-edit-input");
    if (editInput) {
      editInput.value = todo.title;
    }
  }
}

// ----- 이벤트 바인딩 -----
todoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = todoInput.value.trim();
  if (!value) {
    todoInput.focus();
    return;
  }
  await addTodo(value);
  todoInput.value = "";
  todoInput.focus();
});

// ----- 초기화 -----
async function loadTodos() {
  todos = await fetchTodos();
  renderTodos();
}

async function init() {
  await loadTodos();
}

document.addEventListener("DOMContentLoaded", init);
