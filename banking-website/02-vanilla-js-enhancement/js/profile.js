import { getAuthToken, isLoggedIn } from "./auth.js";
import { apiRequest } from "./apiClient.js";
import { formatDate } from "./ui/formatters.js";
import { openModal, closeModal } from "./ui/modal.js";
import { createToast } from "./ui/toast.js";

const findFirst = (...selectors) => selectors.map((selector) => document.querySelector(selector)).find(Boolean);

const setReadOnly = (input) => {
  if (!input) return;
  input.readOnly = true;
  input.setAttribute("aria-readonly", "true");
};

const ensureCreatedField = (form) => {
  if (!form) return null;

  const existing = form.querySelector("#profile-created") || form.querySelector("[data-profile-created]");
  if (existing) return existing;

  const group = document.createElement("div");
  group.className = "form-group";
  group.dataset.profileCreated = "true";

  const label = document.createElement("label");
  label.setAttribute("for", "profile-created");
  label.textContent = "Account created";

  const input = document.createElement("input");
  input.id = "profile-created";
  input.type = "text";
  input.className = "input";
  input.readOnly = true;
  input.setAttribute("aria-readonly", "true");

  group.append(label, input);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton?.parentElement === form) {
    form.insertBefore(group, submitButton);
  } else {
    form.appendChild(group);
  }

  return input;
};

const renderProfile = (profile = {}, elements = {}) => {
  const { nameInput, emailInput, phoneInput, addressInput, createdInput } = elements;

  const safeName = profile.fullName || profile.name || "";
  const safeEmail = profile.email || "";
  const safePhone = profile.phone || "";
  const safeAddress = profile.address || "";
  const createdValue = profile.createdAt ? formatDate(profile.createdAt) : "—";

  if (nameInput) {
    nameInput.value = safeName;
    setReadOnly(nameInput);
  }

  if (emailInput) {
    emailInput.value = safeEmail;
    setReadOnly(emailInput);
  }

  if (phoneInput) {
    phoneInput.value = safePhone;
  }

  if (addressInput) {
    addressInput.value = safeAddress;
  }

  if (createdInput) {
    createdInput.value = createdValue;
    setReadOnly(createdInput);
  }
};

const buildChangePasswordSection = () => {
  const main = document.querySelector(".app-main") || document.querySelector("main");
  if (!main) return null;

  let section = main.querySelector('[data-change-password-section]');
  if (section) return section;

  section = document.createElement("section");
  section.className = "card stack-md";
  section.dataset.changePasswordSection = "true";

  const header = document.createElement("div");
  header.className = "card__header stack-xs";

  const title = document.createElement("h2");
  title.className = "card__title";
  title.textContent = "Change password";

  const subtitle = document.createElement("p");
  subtitle.className = "text-muted";
  subtitle.textContent = "Security is important—even in demos.";

  header.append(title, subtitle);

  const body = document.createElement("div");
  body.className = "stack-sm";

  const description = document.createElement("p");
  description.textContent = "Update your password from here when live systems are connected.";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn--secondary";
  button.textContent = "Change password";
  button.addEventListener("click", () => {
    const modalContent = document.createElement("div");
    modalContent.className = "stack-md";

    const modalHeader = document.createElement("header");
    modalHeader.className = "modal__header";

    const headerTextWrap = document.createElement("div");
    const modalEyebrow = document.createElement("p");
    modalEyebrow.className = "text-muted";
    modalEyebrow.textContent = "Security notice";

    const modalTitle = document.createElement("h2");
    modalTitle.className = "modal__title";
    modalTitle.textContent = "Password changes unavailable in this demo";

    headerTextWrap.append(modalEyebrow, modalTitle);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close change password info");
    closeButton.className = "modal__close";
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => closeModal());

    modalHeader.append(headerTextWrap, closeButton);

    const modalBody = document.createElement("div");
    modalBody.className = "modal__body stack-sm";

    const line1 = document.createElement("p");
    line1.textContent =
      "For your safety, password resets are disabled in this sandbox. No real credentials are stored.";
    const line2 = document.createElement("p");
    line2.textContent = "In a production app, you would receive a secure reset link via email or SMS.";

    const acknowledgeButton = document.createElement("button");
    acknowledgeButton.type = "button";
    acknowledgeButton.className = "btn btn--primary";
    acknowledgeButton.textContent = "Got it";
    acknowledgeButton.addEventListener("click", () => closeModal());

    modalBody.append(line1, line2, acknowledgeButton);
    modalContent.append(modalHeader, modalBody);
    openModal(modalContent);
  });

  body.append(description, button);
  section.append(header, body);
  main.appendChild(section);

  return section;
};

export const initProfile = async () => {
  if (!isLoggedIn()) {
    createToast("Please log in to view your profile.", { type: "warning" });
    window.location.href = "../../01-static-html-css/pages/login.html";
    return;
  }

  const form = document.querySelector('form[aria-label="Profile form"]') || document.querySelector("form");
  if (!form) {
    console.warn("[Banking Demo] Profile form not found; skipping profile initialization.");
  }

  const nameInput = findFirst("#profile-name", "[name='full-name']", "[data-profile-name]");
  const emailInput = findFirst("#profile-email", "[name='email']", "[data-profile-email]");
  const phoneInput = findFirst("#profile-phone", "[name='phone']", "[data-profile-phone]");
  const addressInput = findFirst("#profile-address", "[name='address']", "[data-profile-address]");
  const createdInput = ensureCreatedField(form);

  const authToken = getAuthToken();
  let profileData = {};

  try {
    const response = await apiRequest({ path: "/profile", authToken });
    profileData = response?.profile || {};
  } catch (error) {
    console.error("[Banking Demo] Failed to load profile data.", error);
    return;
  }

  renderProfile(profileData, { nameInput, emailInput, phoneInput, addressInput, createdInput });
  buildChangePasswordSection();

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const updatedPhone = phoneInput?.value?.trim() || "";
    const updatedAddress = addressInput?.value?.trim() || "";

    profileData = {
      ...profileData,
      phone: updatedPhone,
      address: updatedAddress,
    };

    renderProfile(profileData, { nameInput, emailInput, phoneInput, addressInput, createdInput });
    createToast("Profile updated locally. Changes will reset on refresh.", { type: "success" });
  });
};
