// The free-quote form, driven by the Wix Forms store. The fields come from the form's schema
// (edit them in the Wix dashboard); no field is named here.
import { createFormStore, FORM_ERROR, otherText, otherValue } from "/plumbing-toronto/js/wix/form-store.js";
import { esc } from "/plumbing-toronto/js/cards.js";

const root = document.getElementById("quote-form");
const store = createFormStore({ formId: root.dataset.formId });
const OTHER = "__other__";
let formEl = null;
let layoutKey = "";

const INPUT_TYPE = { email: "email", url: "url", phone: "tel", password: "password", number: "number", date: "date", time: "time", datetime: "datetime-local" };
const AUTOCOMPLETE = { CONTACTS_FIRST_NAME: "given-name", CONTACTS_LAST_NAME: "family-name", CONTACTS_EMAIL: "email", CONTACTS_PHONE: "tel", CONTACTS_COMPANY: "organization" };

const fieldBy = (target) => (store.getState().form?.fields || []).find((f) => f.target === target);
const sel = (name) => `[name="${CSS.escape(name)}"]`;

function control(f, v) {
  const id = "f-" + f.target;
  const common = `id="${id}" name="${esc(f.target)}"${f.required ? ' aria-required="true"' : ""}${f.readOnly ? " disabled" : ""}${f.description ? ` aria-describedby="${id}-help"` : ""}`;
  const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "";
  switch (f.control) {
    case "textarea":
      return `<textarea ${common}${ph}${f.validation?.maxLength ? ` maxlength="${f.validation.maxLength}"` : ""}>${esc(v || "")}</textarea>`;
    case "select": {
      const other = !!f.otherOption && otherText(f, v) !== null;
      let h = `<select ${common}><option value="">Choose one</option>`;
      for (const c of f.choices) h += `<option value="${esc(c.value)}"${!other && v === c.value ? " selected" : ""}>${esc(c.label)}</option>`;
      if (f.otherOption) h += `<option value="${OTHER}"${other ? " selected" : ""}>${esc(f.otherOption.label)}</option>`;
      h += "</select>";
      if (f.otherOption) {
        h += `<input type="text" data-other-for="${esc(f.target)}" aria-label="${esc(f.otherOption.label)}" placeholder="${esc(f.otherOption.placeholder || "Please describe")}" value="${esc(other ? otherText(f, v) : "")}"${other ? "" : " hidden"}>`;
      }
      return h;
    }
    case "radio":
      return `<div role="radiogroup" aria-labelledby="${id}-label">` + f.choices.map((c, i) =>
        `<label class="choice"><input type="radio" name="${esc(f.target)}" value="${esc(c.value)}"${v === c.value ? " checked" : ""}${i === 0 ? ` id="${id}"` : ""}> ${esc(c.label)}</label>`).join("") + "</div>";
    case "checkboxGroup":
    case "tags":
      return f.choices.map((c) =>
        `<label class="choice"><input type="checkbox" name="${esc(f.target)}" value="${esc(c.value)}"${Array.isArray(v) && v.includes(c.value) ? " checked" : ""}> ${esc(c.label)}</label>`).join("");
    case "checkbox":
      return `<label class="choice"><input type="checkbox" ${common}${v === true ? " checked" : ""}> ${esc(f.label)}</label>`;
    case "file":
    case "signature":
      return `<input type="file" ${common}${f.validation?.accept ? ` accept="${esc(f.validation.accept)}"` : ""}${(f.validation?.fileLimit || 1) > 1 ? " multiple" : ""}>`;
    case "address":
    case "payment":
    case "appointment":
    case "unknown":
      return `<p class="field-help">This field can be filled in by phone. Call us and we will add it.</p>`;
    default:
      return `<input type="${INPUT_TYPE[f.control] || "text"}" ${common}${ph} value="${esc(v ?? "")}"${AUTOCOMPLETE[f.identifier] ? ` autocomplete="${AUTOCOMPLETE[f.identifier]}"` : ""}>`;
  }
}

function fieldHtml(f, s) {
  const id = "f-" + f.target;
  const ind = s.form.requiredIndicator;
  const mark = f.required && ind !== "NONE" ? (ind === "TEXT" ? ' <span class="req">(required)</span>' : ' <span class="req" aria-hidden="true">*</span>') : "";
  const label = f.control === "checkbox" ? "" :
    `<label id="${id}-label" for="${id}"${f.showLabel === false ? ' class="sr-only"' : ""}>${esc(f.label)}${mark}</label>`;
  const help = f.description ? `<p class="field-help" id="${id}-help">${esc(f.description)}</p>` : "";
  return `<div class="field" data-field="${esc(f.target)}">${label}${control(f, s.values[f.target])}${help}<p class="field-error" role="alert" hidden></p></div>`;
}

function buildForm(s, fields) {
  const steps = s.form.steps;
  const last = s.step >= steps.length - 1;
  const progress = steps.length > 1 ? `<p class="form-status">Step ${s.step + 1} of ${steps.length}${steps[s.step].name ? ": " + esc(steps[s.step].name) : ""}</p>` : "";
  const back = s.step > 0 ? `<button type="button" class="btn btn-secondary" data-prev>${esc(s.form.previousText || "Back")}</button>` : "";
  const go = `<button type="submit" class="btn btn-primary">${esc(last ? s.form.submitText || "Request my free quote" : s.form.nextText || "Next")}</button>`;
  root.innerHTML = `<form novalidate>${progress}${fields.map((f) => fieldHtml(f, s)).join("")}<p class="form-error" role="alert" hidden></p><div class="hero-actions">${back}${go}</div></form>`;
  formEl = root.querySelector("form");
  formEl.addEventListener("input", onInput);
  formEl.addEventListener("change", onInput);
  formEl.addEventListener("focusout", (e) => {
    const name = e.target.name || e.target.dataset.otherFor;
    if (name) store.validate(name);
  });
  formEl.addEventListener("submit", (e) => {
    const st = store.getState();
    if (st.form && st.step < st.form.steps.length - 1) store.next(e);
    else store.submit(e);
  });
  formEl.addEventListener("click", (e) => { if (e.target.closest("[data-prev]")) store.previous(); });
}

function onInput(e) {
  const t = e.target;
  if (t.dataset.otherFor) {
    const f = fieldBy(t.dataset.otherFor);
    if (f) store.setValue(f.target, otherValue(f, t.value));
    return;
  }
  const f = t.name && fieldBy(t.name);
  if (!f) return;
  if (f.control === "select" && f.otherOption) {
    const box = formEl.querySelector(`[data-other-for="${CSS.escape(f.target)}"]`);
    if (t.value === OTHER) {
      box.hidden = false;
      store.setValue(f.target, otherValue(f, box.value));
      if (e.type === "change") box.focus();
      return;
    }
    box.hidden = true;
  }
  if (f.control === "checkbox") store.setValue(f.target, t.checked);
  else if (f.control === "checkboxGroup" || f.control === "tags") store.setValue(f.target, Array.from(formEl.querySelectorAll(sel(f.target) + ":checked")).map((x) => x.value));
  else if (f.control === "number") store.setValue(f.target, t.value === "" ? "" : Number(t.value));
  else if (f.control === "file" || f.control === "signature") store.setValue(f.target, Array.from(t.files || []));
  else store.setValue(f.target, t.value);
}

function render(s) {
  if (s.outcome) {
    if (s.outcome.url) {
      if (s.outcome.newTab) window.open(s.outcome.url, "_blank", "noopener"); else location.href = s.outcome.url;
      return;
    }
    const lines = (s.outcome.message || "").split("\n").map((l) => l.trim()).filter(Boolean);
    root.innerHTML = `<div class="form-done" role="status"><h3>Request sent</h3>${(lines.length ? lines : ["Thanks, your request is in. We will call you back."]).map((l) => `<p>${esc(l)}</p>`).join("")}</div>`;
    formEl = null; layoutKey = "";
    if (s.outcome.durationSeconds) setTimeout(() => store.reset(), s.outcome.durationSeconds * 1000);
    return;
  }
  if (!s.form) {
    root.innerHTML = `<p class="form-status">${esc(s.errors[FORM_ERROR] ? "The form could not load. Please call us instead." : "Loading the form…")}</p>`;
    formEl = null; layoutKey = "";
    return;
  }
  if (s.closed) {
    root.innerHTML = `<p class="form-status">${esc(s.form.disabledMessage || "The quote form is not taking requests right now. Please call us instead.")}</p>`;
    formEl = null; layoutKey = "";
    return;
  }
  const step = s.form.steps[s.step];
  const fields = s.form.fields.filter((f) => !step || f.stepId === step.id);
  const key = s.step + "|" + fields.map((f) => `${f.target}:${f.control}:${f.required}:${f.choices.length}`).join(",");
  if (key !== layoutKey || !formEl) { layoutKey = key; buildForm(s, fields); }
  for (const f of fields) {
    const box = formEl.querySelector(`[data-field="${CSS.escape(f.target)}"]`);
    if (!box) continue;
    const err = s.errors[f.target];
    const errEl = box.querySelector(".field-error");
    errEl.textContent = err || "";
    errEl.hidden = !err;
    box.querySelectorAll("input, select, textarea").forEach((c) => { if (err) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid"); });
  }
  const formErr = formEl.querySelector(".form-error");
  formErr.textContent = s.errors[FORM_ERROR] || "";
  formErr.hidden = !s.errors[FORM_ERROR];
  const btn = formEl.querySelector('button[type="submit"]');
  btn.disabled = s.loading;
  btn.setAttribute("aria-busy", String(s.loading));
}

store.subscribe(render);
render(store.getState());
store.start();
