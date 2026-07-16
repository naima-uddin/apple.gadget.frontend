"use client";

import { useEffect } from "react";

// TEMPORARY dev-only tripwire for the "Failed to execute 'removeChild'" crash.
// When React (or anything) tries to remove a node that is no longer where it
// expects, this logs exactly WHICH node and WHERE it actually is — that
// identifies the code that moved it. Remove this component once the culprit
// is found. No-op in production builds.
export default function RemoveChildDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (window.__removeChildDebuggerInstalled) return;
    window.__removeChildDebuggerInstalled = true;

    const orig = Node.prototype.removeChild;
    Node.prototype.removeChild = function (child) {
      try {
        return orig.call(this, child);
      } catch (e) {
        console.error(
          "[RemoveChildDebugger] CULPRIT NODE →",
          "\n  node:", child?.nodeName, child?.id ? "#" + child.id : "", String(child?.className || "").slice(0, 120),
          "\n  html:", child?.outerHTML ? child.outerHTML.slice(0, 300) : String(child?.textContent).slice(0, 120),
          "\n  React expected parent:", this?.nodeName, String(this?.className || "").slice(0, 120),
          "\n  actual parent now:", child?.parentNode ? child.parentNode.nodeName + " ." + String(child.parentNode.className || "").slice(0, 120) : "DETACHED (already removed)"
        );
        throw e;
      }
    };
  }, []);

  return null;
}
