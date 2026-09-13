"use client";

// Guard against the React crash:
//   "Cannot read properties of null (reading 'removeChild')"
//   at commitDeletionEffectsOnFiber
//
// Root cause: non-React code (browser extensions like Google Translate, or our
// own runtime DOM injection into document.head / body — see TrackingCodeInjector
// and ProductDetails' client-side meta/JSON-LD tags) removes or re-parents a
// node that React still believes it owns. When React later unmounts that subtree
// it walks up to find the host parent, gets null, and does null.removeChild(...).
//
// The fix has to run BEFORE any commit, so we patch at module-eval time (client
// import happens very early) rather than in useEffect. We make removeChild and
// insertBefore no-op safely when the node isn't actually a child of the target,
// which stops the DOM/React desync upstream — the crash is always downstream of
// one of these mismatched calls. This is the standard mitigation for this error.

if (typeof window !== "undefined" && !window.__domReconciliationGuardInstalled) {
  window.__domReconciliationGuardInstalled = true;

  const isDev = process.env.NODE_ENV !== "production";
  const warn = (msg, node, parent) => {
    if (!isDev) return;
    // Surfaces the offending node in dev so the real culprit can still be found,
    // without taking the whole app down.
    console.warn(
      `[DomReconciliationGuard] ${msg}`,
      "\n  node:",
      node?.nodeName,
      node?.id ? "#" + node.id : "",
      String(node?.className || "").slice(0, 120),
      "\n  expected parent:",
      parent?.nodeName,
      String(parent?.className || "").slice(0, 120),
      "\n  actual parent:",
      node?.parentNode
        ? node.parentNode.nodeName + " ." + String(node.parentNode.className || "").slice(0, 80)
        : "DETACHED",
    );
  };

  const origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      warn("Skipped removeChild — node is not a child of the target", child, this);
      // React (or the caller) only needs the node gone; it already is, so
      // return it as removeChild contractually does instead of throwing.
      return child;
    }
    return origRemoveChild.apply(this, arguments);
  };

  const origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      warn("Redirected insertBefore — reference node has a different parent", referenceNode, this);
      // Fall back to appending onto the intended parent rather than throwing.
      return this.appendChild(newNode);
    }
    return origInsertBefore.apply(this, arguments);
  };
}

// Kept as a mounted (no-op) component so app/layout.js's import/usage is stable;
// all the work happens at module load above.
export default function RemoveChildDebugger() {
  return null;
}
