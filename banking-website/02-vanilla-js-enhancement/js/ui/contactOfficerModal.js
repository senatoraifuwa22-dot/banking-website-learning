/**
 * Contact Officer modal.
 *
 * This file leans heavily on comments so beginners can see exactly what is
 * happening. It uses the shared modal helper to render the dialog.
 */

import { openModal, closeModal } from "./modal.js";
import { makeReferenceCode } from "./formatters.js";

/**
 * Attempt to find an author-provided modal template in the DOM.
 * The template can either be a hidden <template> tag or a hidden element.
 */
const findExistingTemplate = () => {
  const tpl = document.getElementById("contact-officer-modal");
  if (!tpl) return null;

  // If it's a <template> tag we can use its content directly.
  if (tpl.tagName.toLowerCase() === "template") {
    const fragment = tpl.content.cloneNode(true);
    // Prefer the first element inside the template for predictable styling.
    if (fragment.firstElementChild) return fragment.firstElementChild;
    const wrapper = document.createElement("div");
    wrapper.appendChild(fragment);
    return wrapper;
  }

  // Otherwise clone the node (so we do not move the original).
  const clone = tpl.cloneNode(true);
  clone.id = ""; // Avoid duplicate IDs once inserted into the modal root.
  return clone;
};

/**
 * When the page doesn't provide a modal skeleton, we generate a safe fallback.
 * The content is minimal yet contains all the required fields.
 */
const createFallbackTemplate = () => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div>
      <header style="display:flex; align-items:center; justify-content:space-between; gap:1rem;">
        <div>
          <p style="margin:0; font-size:0.85rem; color:#475569;">Need to speak with us?</p>
          <h2 style="margin:0; font-size:1.35rem; color:#0f172a;">Contact your account officer</h2>
        </div>
        <button type="button" aria-label="Close contact modal" id="close-contact-modal" style="background:none; border:none; font-size:1.25rem; cursor:pointer;">×</button>
      </header>
      <section style="margin-top:1rem; display:grid; gap:0.5rem;">
        <p id="officer-reason" style="margin:0; color:#334155;"></p>
        <div><strong>Name:</strong> <span id="officer-name"></span></div>
        <div><strong>Phone:</strong> <span id="officer-phone"></span></div>
        <div><strong>Email:</strong> <span id="officer-email"></span></div>
        <div><strong>Reference code:</strong> <span id="officer-ref"></span></div>
      </section>
    </div>
  `;

  return wrapper;
};

/**
 * Populate dynamic fields inside the modal content.
 */
const populateOfficerDetails = (root, { officer, referenceCode, reason }) => {
  const safeRef = referenceCode || makeReferenceCode();

  const nameEl = root.querySelector("#officer-name");
  const phoneEl = root.querySelector("#officer-phone");
  const emailEl = root.querySelector("#officer-email");
  const refEl = root.querySelector("#officer-ref");
  const reasonEl = root.querySelector("#officer-reason");

  if (nameEl) nameEl.textContent = officer?.name || "Not provided";
  if (phoneEl) phoneEl.textContent = officer?.phone || "Not provided";
  if (emailEl) emailEl.textContent = officer?.email || "Not provided";
  if (refEl) refEl.textContent = safeRef;
  if (reasonEl && reason) {
    reasonEl.textContent = `Reason: ${reason}`;
  }

  // Wire close buttons found inside the modal.
  root.querySelectorAll("[data-close-modal], #close-contact-modal").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      closeModal();
    });
  });
};

/**
 * Public entry point: opens the Contact Officer modal with provided details.
 */
export const openContactOfficerModal = ({ officer = {}, referenceCode, reason } = {}) => {
  // Prefer a page-supplied template, but fall back to our own markup.
  const content =
    findExistingTemplate() ||
    // .firstElementChild ensures we pass a single node to openModal.
    createFallbackTemplate().firstElementChild;

  if (!content) {
    // As a last resort, show a tiny error modal.
    openModal("Unable to load contact officer details right now.");
    return;
  }

  populateOfficerDetails(content, { officer, referenceCode, reason });
  openModal(content);
};

// Convenience export so other scripts can close the modal without importing modal.js directly.
export { closeModal };
