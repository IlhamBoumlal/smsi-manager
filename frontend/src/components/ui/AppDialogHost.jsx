import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { closeAppDialog, subscribeAppDialog } from "../../utils/appDialogs";

const TITLE_STYLES = {
  alert: "from-blue-600 to-indigo-600",
  confirm: "from-blue-600 to-indigo-600",
  prompt: "from-blue-600 to-indigo-600",
};

export default function AppDialogHost() {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    return subscribeAppDialog((nextDialog) => {
      setDialog(nextDialog);
      setInputValue(nextDialog?.defaultValue ?? "");
    });
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (dialog.type === "prompt") closeAppDialog(null);
        else closeAppDialog(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  const isPrompt = dialog?.type === "prompt";
  const isConfirm = dialog?.type === "confirm";
  const isAlert = dialog?.type === "alert";

  const headerClass = useMemo(() => {
    const key = dialog?.type || "confirm";
    return TITLE_STYLES[key] || TITLE_STYLES.confirm;
  }, [dialog?.type]);

  if (!dialog) return null;

  const handleCancel = () => {
    if (isPrompt) closeAppDialog(null);
    else closeAppDialog(false);
  };

  const handleConfirm = () => {
    if (isPrompt) {
      closeAppDialog(String(inputValue || "").trim());
      return;
    }

    closeAppDialog(true);
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        handleCancel();
      }}
    >
      <div className="w-full max-w-[520px] rounded-3xl overflow-hidden shadow-2xl bg-white" onClick={(event) => event.stopPropagation()}>
        <div className={`px-6 py-5 flex items-center justify-between bg-gradient-to-r ${headerClass}`}>
          <div className="flex items-center gap-2 text-white">
            {(isConfirm || isPrompt) ? <AlertTriangle size={18} /> : null}
            <h3 className="font-bold text-[20px]">{dialog.title || "Confirmation"}</h3>
          </div>
          <button
            onClick={handleCancel}
            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-white hover:bg-white/15"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-[14px] leading-relaxed text-slate-700 whitespace-pre-line">{dialog.message}</p>

          {isPrompt && (
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              autoFocus
              placeholder="Saisir une valeur..."
              className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div className="px-6 py-5 border-t border-slate-200 flex items-center justify-end gap-3">
          {!isAlert && (
            <button
              onClick={handleCancel}
              className="h-11 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              {dialog.cancelText || "Annuler"}
            </button>
          )}

          <button
            onClick={handleConfirm}
            className="h-11 px-6 rounded-xl text-white font-semibold inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isConfirm ? <Trash2 size={16} /> : null}
            {dialog.confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
