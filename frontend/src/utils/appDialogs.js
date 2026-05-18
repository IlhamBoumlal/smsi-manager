let currentDialog = null;
const subscribers = new Set();
let counter = 0;

function publish(nextDialog) {
  subscribers.forEach((listener) => {
    try {
      listener(nextDialog);
    } catch {
      // Ignore listener errors to keep dialog bus resilient.
    }
  });
}

function openDialog(type, options = {}) {
  return new Promise((resolve) => {
    currentDialog = {
      id: ++counter,
      type,
      title: options.title || "Confirmation",
      message: options.message || "",
      confirmText: options.confirmText || "Confirmer",
      cancelText: options.cancelText || "Annuler",
      defaultValue: options.defaultValue ?? "",
      resolve,
    };

    publish(currentDialog);
  });
}

export function subscribeAppDialog(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  subscribers.add(listener);

  if (currentDialog) {
    listener(currentDialog);
  }

  return () => {
    subscribers.delete(listener);
  };
}

export function closeAppDialog(result) {
  if (!currentDialog) return;

  const { resolve } = currentDialog;
  currentDialog = null;
  publish(null);
  resolve(result);
}

export async function appConfirm(message, options = {}) {
  const result = await openDialog("confirm", {
    ...options,
    title: options.title || "Confirmer l'action",
    message,
    confirmText: options.confirmText || "Confirmer",
    cancelText: options.cancelText || "Annuler",
  });

  return Boolean(result);
}

export async function appPrompt(message, options = {}) {
  const result = await openDialog("prompt", {
    ...options,
    title: options.title || "Saisie requise",
    message,
    confirmText: options.confirmText || "Valider",
    cancelText: options.cancelText || "Annuler",
  });

  if (typeof result !== "string") {
    return null;
  }

  return result;
}

export async function appAlert(message, options = {}) {
  await openDialog("alert", {
    ...options,
    title: options.title || "Information",
    message,
    confirmText: options.confirmText || "OK",
  });
}
