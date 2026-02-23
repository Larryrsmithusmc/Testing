const STORAGE_KEY = "siteUsers_v1";

function usernameValid(username) {
  return /^[a-z]{8}$/.test(username);
}

function passwordValid(password) {
  if (password.length !== 12) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSymbol;
}

async function seedUsersIfNeeded() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return;

  try {
    const res = await fetch("users.json", { cache: "no-store" });
    const data = await res.json();

    const map = {};
    for (const u of (data.users || [])) {
      map[u.username] = {
        username: u.username,
        password: u.password,
        type: u.type,
        email: u.email || "",
        failedAttempts: u.failedAttempts || 0,
        locked: !!u.locked
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    // If users.json fails to load, still initialize an empty store
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
  }
}

function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function setUsers(usersObj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usersObj));
}

function setMessage(el, msg, ok = false) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? "green" : "#b00000";
}

function redirectByType(type) {
  if (type === "user") window.location.href = "UserMainPage.html";
  else if (type === "admin") window.location.href = "AdminMainPage.html";
  else if (type === "groceryadmin") window.location.href = "GroceryAdminMainPage.html";
  else window.location.href = "Login.html";
}

/* ---------- Login page ---------- */
async function initLoginPage() {
  await seedUsersIfNeeded();

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");
  const createBtn = document.getElementById("goCreateAccount");

  createBtn?.addEventListener("click", () => {
    window.location.href = "CreateUser.html";
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = (document.getElementById("loginUsername").value || "").trim();
    const password = document.getElementById("loginPassword").value || "";

    const users = getUsers();
    const record = users[username];

    if (!record) {
      setMessage(msg, "Invalid username or password.");
      return;
    }

    if (record.locked) {
      setMessage(msg, "Account locked after 3 incorrect login attempts.");
      return;
    }

    if (record.password === password) {
      record.failedAttempts = 0;
      users[username] = record;
      setUsers(users);

      sessionStorage.setItem("currentUser", username);
      sessionStorage.setItem("currentType", record.type);

      redirectByType(record.type);
      return;
    }

    record.failedAttempts = (record.failedAttempts || 0) + 1;

    if (record.failedAttempts >= 3) {
      record.locked = true;
      users[username] = record;
      setUsers(users);
      setMessage(msg, "Account locked after 3 incorrect login attempts.");
      return;
    }

    users[username] = record;
    setUsers(users);

    const left = 3 - record.failedAttempts;
    setMessage(msg, `Invalid username or password. Attempts left: ${left}`);
  });
}

/* ---------- Create account page ---------- */
async function initCreateUserPage() {
  await seedUsersIfNeeded();

  const form = document.getElementById("createForm");
  const msg = document.getElementById("createMsg");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = (document.getElementById("newUsername").value || "").trim();
    const email = (document.getElementById("newEmail").value || "").trim();
    const password = document.getElementById("newPassword").value || "";

    const type = document.querySelector("input[name='acctType']:checked")?.value;

    if (!type) {
      setMessage(msg, "Choose an account type.");
      return;
    }

    if (!usernameValid(username)) {
      setMessage(msg, "Username must be exactly 8 characters and only lowercase letters.");
      return;
    }

    if (!passwordValid(password)) {
      setMessage(
        msg,
        "Password must be exactly 12 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol."
      );
      return;
    }

    // Optional email check (basic)
    if (email.length > 0 && !/^\S+@\S+\.\S+$/.test(email)) {
      setMessage(msg, "Email address is not valid.");
      return;
    }

    const users = getUsers();

    if (users[username]) {
      setMessage(msg, "That username already exists.");
      return;
    }

    users[username] = {
      username,
      password,
      type,
      email,
      failedAttempts: 0,
      locked: false
    };

    setUsers(users);
    setMessage(msg, "Account created. Returning to login...", true);

    setTimeout(() => {
      window.location.href = "Login.html";
    }, 900);
  });

  const cancelBtn = document.getElementById("cancelCreate");
  cancelBtn?.addEventListener("click", () => {
    window.location.href = "Login.html";
  });
}

/* ---------- Page router ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body?.dataset?.page;

  if (page === "login") initLoginPage();
  if (page === "create") initCreateUserPage();
});
