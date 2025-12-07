// Firebase SDK (모듈 방식) 로드
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getDatabase,
  ref,
  push,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyAiF6AukDhkj1hbaoKK6Iw9imrmWJFnNFQ",
  authDomain: "fir-78f97.firebaseapp.com",
  databaseURL: "https://fir-78f97-default-rtdb.firebaseio.com",
  projectId: "fir-78f97",
  storageBucket: "fir-78f97.firebasestorage.app",
  messagingSenderId: "315472783806",
  appId: "1:315472783806:web:1b6d0ba68bac5bc38431ef",
  measurementId: "G-MVQ5YFF61T",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const todosRef = ref(db, "todos");

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoListEl = document.getElementById("todo-list");
const emptyMessageEl = document.getElementById("empty-message");
const todoTemplate = document.getElementById("todo-item-template");

let todos = [];

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

  li.dataset.id = String(todo.id);
  textSpan.textContent = todo.text;
  editInput.value = todo.text;
  checkbox.checked = !!todo.completed;

  if (todo.completed) {
    textSpan.classList.add("completed");
  }

  // 체크박스: 완료/미완료
  checkbox.addEventListener("change", () => {
    toggleTodoCompleted(todo.id, checkbox.checked);
  });

  // 수정 버튼
  editBtn.addEventListener("click", () => {
    startEdit(li);
  });

  // 저장 버튼
  saveBtn.addEventListener("click", () => {
    finishEdit(li, editInput.value.trim());
  });

  // 취소 버튼
  cancelBtn.addEventListener("click", () => {
    cancelEdit(li);
  });

  // Enter / Esc 키 처리
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEdit(li, editInput.value.trim());
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit(li);
    }
  });

  // 삭제 버튼
  deleteBtn.addEventListener("click", () => {
    deleteTodo(todo.id);
  });

  return li;
}

// ----- CRUD 로직 -----
function addTodo(text) {
  if (!text.trim()) return;
  const newTodo = {
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
  };
  // Firebase Realtime Database에 저장 (key는 push가 자동 생성)
  push(todosRef, newTodo).catch((err) => {
    console.error("할일 추가 실패:", err);
    alert("할일을 추가하는 중 오류가 발생했습니다.");
  });
}

function toggleTodoCompleted(id, completed) {
  const targetRef = ref(db, `todos/${id}`);
  update(targetRef, { completed }).catch((err) => {
    console.error("완료 상태 변경 실패:", err);
    alert("완료 상태 변경 중 오류가 발생했습니다.");
  });
}

function updateTodo(id, newText) {
  if (!newText.trim()) {
    // 빈 문자열로 저장하려고 하면 삭제할지 물어보는 대신 그냥 무시
    return;
  }
  const targetRef = ref(db, `todos/${id}`);
  update(targetRef, { text: newText.trim() }).catch((err) => {
    console.error("할일 수정 실패:", err);
    alert("할일을 수정하는 중 오류가 발생했습니다.");
  });
}

function deleteTodo(id) {
  const targetRef = ref(db, `todos/${id}`);
  remove(targetRef).catch((err) => {
    console.error("할일 삭제 실패:", err);
    alert("할일을 삭제하는 중 오류가 발생했습니다.");
  });
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

function finishEdit(li, newText) {
  const id = li.dataset.id;
  if (!newText) {
    // 비어 있으면 그냥 취소
    cancelEdit(li);
    return;
  }
  updateTodo(id, newText);
}

function cancelEdit(li) {
  li.classList.remove("editing");
}

// ----- 이벤트 바인딩 -----
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = todoInput.value.trim();
  if (!value) {
    todoInput.focus();
    return;
  }
  addTodo(value);
  todoInput.value = "";
  todoInput.focus();
});

// ----- 초기화 -----
function init() {
  // Realtime Database의 "todos" 경로를 실시간으로 구독
  onValue(
    todosRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([key, value]) => ({
        id: key,
        text: value.text || "",
        completed: !!value.completed,
        createdAt: value.createdAt || 0,
      }));

      // 생성 시간 역순 정렬 (최신이 위로)
      list.sort((a, b) => b.createdAt - a.createdAt);

      todos = list;
      renderTodos();
    },
    (error) => {
      console.error("할일 불러오기 실패:", error);
      alert("할일 목록을 불러오는 중 오류가 발생했습니다.");
    }
  );
}

document.addEventListener("DOMContentLoaded", init);


