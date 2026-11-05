import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "./Overlay";

/**
 * const [confirm, confirmElement] = useConfirm();
 * if (await confirm({ title, text, confirmLabel, tone })) { … }
 * {confirmElement} — відрендерити будь-де в компоненті.
 */
export function useConfirm() {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState(opts);
      }),
    [],
  );

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  const element = (
    <ConfirmDialog
      open={!!state}
      {...(state || {})}
      onConfirm={() => close(true)}
      onClose={() => close(false)}
    />
  );
  return [confirm, element];
}
