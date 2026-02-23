const USER_STORAGE_KEY = "users";

function isValidUsername(username) {
  return /^[a-z]{8}$/.test(username);
}

function isValidPassword(password) {
  if (password.length !== 12) return false;

  const containsUppercase = /[A-Z]/.test(password);
  const containsLowercase = /[a-z]/.test(password);
  const containsNumber = /[0-9]/.test(password);
  const containsSymbol = /[^A-Za-z0-9]/.test(password);

  return (
    containsUppercase &&
    containsLowercase &&
    containsNumber &&
    containsSymbol
  );
}

function isValidEmail(email) {
  if (!email) return true;
  return /^\S+@\S+\.\S+$/.test(email);
}

async function loadHardcodedUsersIfNeeded() {
  if (localStorage.getItem(USER_STORAGE_KEY)) return;

  try {
    const response = await fetch("users.json", { cache: "no-store" });
    const jsonData = await response.json();

    const usersObject = {};

    (jsonData.users || []).forEach(function (userRecord) {
      usersObject[userRecord.username] = {
        username: userRecord.username,
        password: userRecord.password,
        accountType: userRecord.type,
        email: userRecord.email || "",
        failedLoginAttempts: 0,
        isLocked: false
      };
    });

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usersObject));
  } catch {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({}));
  }
}

function getStoredUsers() {
  return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "{}");
}

function saveStoredUsers(usersObject) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usersObject));
}

function displayMessage(element, text, isSuccess = false) {
  element.textContent = text;
  element.style.color = isSuccess ? "green" : "#b00000";
}

function redirectToAccountPage(accountType) {
  if (accountType === "user") {
    window.location.href = "UserMainPage.html";
  }

  if (accountType === "admin") {
    window.location.href = "AdminMainPage.html";
  }

  if (accountType === "groceryadmin") {
    window.location.href = "GroceryAdminMainPage.html";
  }
}

async function initializeLoginPage() {
  await loadHardcodedUsersIfNeeded();

  const loginForm = document.getElementById("loginForm");
  const loginMessageElement = document.getElementById("loginMsg");

  loginForm?.addEventListener("submit", function (event) {
    event.preventDefault();

    const enteredUsername =
      document.getElementById("loginUsername").value.trim();
    const enteredPassword =
      document.getElementById("loginPassword").value;

    const usersObject = getStoredUsers();
    const matchingUser = usersObject[enteredUsername];

    if (!matchingUser) {
      displayMessage(loginMessageElement, "Invalid username or password.");
      return;
    }

    if (matchingUser.isLocked) {
      displayMessage(
        loginMessageElement,
        "Account locked after 3 incorrect login attempts."
      );
      return;
    }

    if (matchingUser.password === enteredPassword) {
      matchingUser.failedLoginAttempts = 0;
      saveStoredUsers(usersObject);
      redirectToAccountPage(matchingUser.accountType);
      return;
    }

    matchingUser.failedLoginAttempts += 1;

    if (matchingUser.failedLoginAttempts >= 3) {
      matchingUser.isLocked = true;
      displayMessage(
        loginMessageElement,
        "Account locked after 3 incorrect login attempts."
      );
    } else {
      const attemptsRemaining = 3 - matchingUser.failedLoginAttempts;
      displayMessage(
        loginMessageElement,
        `Invalid username or password. Attempts left: ${attemptsRemaining}`
      );
    }

    saveStoredUsers(usersObject);
  });

  document
    .getElementById("goCreateAccount")
    ?.addEventListener("click", function () {
      window.location.href = "CreateUser.html";
    });
}

async function initializeCreateUserPage() {
  await loadHardcodedUsersIfNeeded();

  const createUserForm = document.getElementById("createForm");
  const createUserMessageElement =
    document.getElementById("createMsg");

  createUserForm?.addEventListener("submit", function (event) {
    event.preventDefault();

    const enteredUsername =
      document.getElementById("newUsername").value.trim();
    const enteredEmail =
      document.getElementById("newEmail").value.trim();
    const enteredPassword =
      document.getElementById("newPassword").value;

    const selectedAccountType =
      document.querySelector("input[name='acctType']:checked")?.value;

    if (!selectedAccountType) {
      displayMessage(createUserMessageElement, "Choose an account type.");
      return;
    }

    if (!isValidUsername(enteredUsername)) {
      displayMessage(
        createUserMessageElement,
        "Username must be exactly 8 lowercase letters."
      );
      return;
    }

    if (!isValidPassword(enteredPassword)) {
      displayMessage(
        createUserMessageElement,
        "Password must be exactly 12 characters with upper, lower, number, and symbol."
      );
      return;
    }

    if (!isValidEmail(enteredEmail)) {
      displayMessage(
        createUserMessageElement,
        "Email address is not valid."
      );
      return;
    }

    const usersObject = getStoredUsers();

    if (usersObject[enteredUsername]) {
      displayMessage(
        createUserMessageElement,
        "That username already exists."
      );
      return;
    }

    /* ===============================
       BACKEND PLACEHOLDER
       Future:
       - Send user data to server
       - Server saves user permanently
    =============================== */

    displayMessage(
      createUserMessageElement,
      "All validation passed. Backend not connected yet. User not saved.",
      true
    );

    setTimeout(function () {
      window.location.href = "Login.html";
    }, 1000);
  });

  document
    .getElementById("cancelCreate")
    ?.addEventListener("click", function () {
      window.location.href = "Login.html";
    });
}

switch (document.body.dataset.page) {
  case "login":
    initializeLoginPage();
    break;

  case "create":
    initializeCreateUserPage();
    break;

  default:
    break;
}
