import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
/**
* Whether an error is a whitelist violation.
*
* The check is deliberately strict: the stable kind marker AND a violations
* list. An error that merely carries a `violations` array (a lookalike from
* another library, or a differently named failure) is NOT a whitelist
* violation and must not be answered with 422.
* @param error - the thrown value.
* @returns true when the error is a whitelist violation.
*/
function isSkinCssSafetyViolation(error) {
	if (typeof error !== "object" || error === null) return false;
	const candidate = error;
	if (candidate.kind !== "SkinCssSafetyError") return false;
	return Array.isArray(candidate.violations);
}
//#endregion
//#region src/core/css-safety/worker-entry.ts
/**
* CSS safety worker process (issue #98).
*
* This file is the entry point of the short-lived worker that serves ONE
* stylesheet transform. It is the only place where lightningcss is loaded:
* the host half forks this bundle, sends one request over IPC, and waits for
* the process to exit. The native addon therefore lives in this process and
* never in the DSH host process.
*
* The worker loads the transform bundle from its own module URL (never from
* the process working directory) and answers with the transformed CSS, a
* whitelist violation, or a failure.
* @module @linxin666/dsh-client-ui-skin-center/css-safety/worker-entry
*/
/** Bundle file name that carries the transform (beside this worker bundle). */
const CSS_SAFETY_FILE = "css-safety.js";
/**
* Load the css-safety bundle.
*
* The bundle is resolved from this module's URL: the built package keeps it
* beside the worker bundle, the source tree keeps it under lib/.
* @returns the transform function.
*/
async function loadCssSafety() {
	const here = dirname(fileURLToPath(import.meta.url));
	const candidates = [join(here, CSS_SAFETY_FILE), join(here, "..", "..", "..", "lib", CSS_SAFETY_FILE)];
	let lastError = null;
	for (const candidate of candidates) try {
		const mod = await import(pathToFileURL(candidate).href);
		if (typeof mod.transformSkinCss === "function") return mod;
	} catch (error) {
		lastError = error;
	}
	throw lastError instanceof Error ? lastError : /* @__PURE__ */ new Error(`${CSS_SAFETY_FILE} not found beside the CSS safety worker`);
}
let cssSafetyPromise = null;
/** Load the css-safety bundle once per worker process. */
function loadCssSafetyOnce() {
	cssSafetyPromise ??= loadCssSafety();
	return cssSafetyPromise;
}
/**
* Serve one request.
* @param message - the host request (one stylesheet plus its options).
*/
async function serve(message) {
	let response;
	try {
		const { transformSkinCss } = await loadCssSafetyOnce();
		const result = transformSkinCss(message.css, message.options);
		response = {
			type: "result",
			code: result.code,
			warnings: result.warnings
		};
	} catch (error) {
		if (isSkinCssSafetyViolation(error)) response = {
			type: "violation",
			message: error.message,
			violations: error.violations
		};
		else response = {
			type: "failure",
			message: error instanceof Error ? error.message : String(error)
		};
	}
	process.send?.(response, () => {
		process.exit(0);
	});
}
process.on("message", (message) => {
	if (!message || message.type !== "transform") return;
	serve(message);
});
process.on("disconnect", () => {
	process.exit(0);
});
process.send?.({ type: "ready" });
//#endregion
export {};
