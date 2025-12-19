/**
 * Authentication helpers for the vanilla JS banking demo.
 *
 * The app does not talk to a real backend yet, so all operations delegate to
 * the mock API client. The goal is to keep things secure-ish while focusing on
 * beginner-friendly readability.
 */

import { apiRequest, handleFailure } from "./apiClient.js";
import { createToast } from "./ui/toast.js";

// Storage key kept private to this module so we can swap strategies later.
const AUTH_TOKEN_KEY = "bankly:authToken";

/**
 * Safely write the auth token to localStorage.
 */
const persistAuthToken = (token) => {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.warn("[Banking Demo] Failed to persist auth token.", error);
  }
};

/**
 * Safely clear the auth token.
 */
const clearAuthToken = () => {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.warn("[Banking Demo] Failed to clear auth token.", error);
  }
};

/**
 * Read the currently stored auth token.
 * @returns {string|null}
 */
export const getAuthToken = () => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.warn("[Banking Demo] Failed to read auth token.", error);
    return null;
  }
};

/**
 * Lightweight check to see if a token exists.
 */
export const isLoggedIn = () => Boolean(getAuthToken());

/**
 * Basic email validation used across auth flows.
 */
const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Shared helper to redirect after a tiny delay.
 */
const redirect = (path) => window.setTimeout(() => (window.location.href = path), 400);

/**
 * Attach login form behavior.
 *
 * - Performs light validation (presence + email format + minimum password length).
 * - Calls the mock API client.
 * - Stores the returned auth token.
 * - Provides clear success/failure feedback.
 */
export const initLogin = () => {
  const form = document.querySelector('form[aria-label="Login form"]') || document.querySelector("form");
  if (!form) {
    console.warn("[Banking Demo] Login form not found; skipping initLogin.");
    return;
  }

  const emailInput = form.querySelector("#login-email");
  const passwordInput = form.querySelector("#login-password");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";

    // Minimal client-side validation to keep the UX friendly.
    if (!email || !password) {
      createToast("Please enter both your email and password.", { type: "warning" });
      return;
    }

    if (!isValidEmail(email)) {
      createToast("Please enter a valid email address.", { type: "warning" });
      emailInput?.focus();
      return;
    }

    if (password.length < 6) {
      createToast("Passwords must be at least 6 characters long.", { type: "warning" });
      passwordInput?.focus();
      return;
    }

    try {
      const { token, user } = await apiRequest({
        path: "/auth/login",
        method: "POST",
        body: { email, password },
      });

      persistAuthToken(token);
      createToast(`Welcome back${user?.name ? `, ${user.name}` : ""}! Redirecting to your dashboard.`, {
        type: "success",
      });
      redirect("dashboard.html");
    } catch (error) {
      // The mock API already routes known issues through handleFailure, which shows a toast.
      if (error?.errorCode) {
        console.error("[Banking Demo] Login failed.", error);
        return;
      }
      await handleFailure(error, "Login");
    }
  });
};

/**
 * Attach registration form behavior.
 *
 * - Performs light validation (presence, email format, password confirmation).
 * - Calls the mock API client.
 * - On success, sends the user to the login page to sign in.
 */
export const initRegister = () => {
  const form =
    document.querySelector('form[aria-label="Registration form"]') || document.querySelector("form");
  if (!form) {
    console.warn("[Banking Demo] Registration form not found; skipping initRegister.");
    return;
  }

  const nameInput = form.querySelector("#full-name");
  const emailInput = form.querySelector("#register-email");
  const passwordInput = form.querySelector("#register-password");
  const confirmInput = form.querySelector("#confirm-password");
  const termsCheckbox = form.querySelector("#terms");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = nameInput?.value?.trim() || "";
    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";
    const confirm = confirmInput?.value || "";
    const agreedToTerms = termsCheckbox?.checked || false;

    if (!fullName || !email || !password || !confirm) {
      createToast("Please fill in all required fields.", { type: "warning" });
      return;
    }

    if (!isValidEmail(email)) {
      createToast("Please enter a valid email address.", { type: "warning" });
      emailInput?.focus();
      return;
    }

    if (password.length < 8) {
      createToast("Passwords must be at least 8 characters long.", { type: "warning" });
      passwordInput?.focus();
      return;
    }

    if (password !== confirm) {
      createToast("Passwords must match before continuing.", { type: "warning" });
      confirmInput?.focus();
      return;
    }

    if (!agreedToTerms) {
      createToast("Please agree to the Terms before creating your account.", { type: "warning" });
      termsCheckbox?.focus();
      return;
    }

    try {
      await apiRequest({
        path: "/auth/register",
        method: "POST",
        body: { email, password, name: fullName },
      });

      createToast("Account created! You can now log in with your credentials.", { type: "success" });
      redirect("login.html");
    } catch (error) {
      if (error?.errorCode) {
        console.error("[Banking Demo] Registration failed.", error);
        return;
      }
      await handleFailure(error, "Registration");
    }
  });
};

/**
 * Clear session data and return to the login screen.
 */
export const initLogout = () => {
  clearAuthToken();
  redirect("login.html");
};
