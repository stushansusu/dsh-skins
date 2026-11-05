import z from "@deepseek-ai/schemastery";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { fork } from "node:child_process";
//#region src/http.ts
/** Default body cap for readJsonBody: 64 KiB. */
const DEFAULT_JSON_BODY_MAX_BYTES = 65536;
/** Family-default JSON response headers; callers may append or override. */
const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"referrer-policy": "no-referrer"
};
/**
* Lenient bounded body reader: parse a request body as JSON, or null on an
* empty body, invalid JSON, or a body past maxBytes (default 64 KiB).
* Overflow destroys the request instead of draining the remainder (no drain
* call, matching the current repo-wide behavior); callers must not keep
* reading the request afterwards. With objectOnly, non-JSON-object payloads
* also yield null.
*/
async function readJsonBody(req, opts = {}) {
	const maxBytes = opts.maxBytes ?? DEFAULT_JSON_BODY_MAX_BYTES;
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = chunk;
		size += buffer.length;
		if (size > maxBytes) {
			req.destroy();
			return null;
		}
		chunks.push(buffer);
	}
	const text = Buffer.concat(chunks).toString("utf8");
	if (text === "") return null;
	try {
		const parsed = JSON.parse(text);
		if (opts.objectOnly && !isJsonObject(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}
/** Whether a value is a JSON object: typeof object, not null, not an array. */
function isJsonObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Write one JSON response. Default headers are the family defaults
* (content-type and referrer-policy); caller headers are appended or
* override them.
*/
function writeJson(res, status, body, headers = {}) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		...JSON_HEADERS,
		...headers
	});
	res.end(payload);
}
//#endregion
//#region src/http-utils.ts
/** True when an `Origin` header names a host other than the request Host.
*  Browsers send Origin on CORS requests and on all POSTs; opaque origins
*  (sandboxed iframes) serialize as the literal string "null". */
function hasForeignOrigin(req) {
	const origin = req.headers.origin;
	if (typeof origin !== "string" || origin === "" || origin === "null") return false;
	const host = req.headers.host;
	if (typeof host !== "string" || host === "") return true;
	try {
		return new URL(origin).host !== host;
	} catch {
		return true;
	}
}
/**
* Same-origin fence. Browsers send Sec-Fetch-Site on every fetch: a
* cross-site fetch is always rejected, and an Origin that does not match the
* request Host is rejected. Requests without either header (curl, node http,
* old browsers) pass — this is a local single-user tool, and the fence only
* targets the cross-site browser vector.
*/
function isSameOriginRequest(req) {
	const site = req.headers["sec-fetch-site"];
	if (typeof site === "string" && site === "cross-site") return false;
	return !hasForeignOrigin(req);
}
/** Reject cross-site requests with 403. */
function requireSameOrigin(req, res) {
	if (isSameOriginRequest(req)) return true;
	writeJson(res, 403, {
		ok: false,
		error: "cross-site-request-rejected"
	});
	return false;
}
//#endregion
//#region src/reviewed-hooks.generated.ts
const REVIEWED_SKIN_HOOKS = {
	"abyssal-serenade": {
		entry: "hooks.mjs",
		manifestSha256: "ff9ac39a1e5b6607e0a0795505e9556a1c957e956b50d7dbdeca59e96edcf874",
		hooksSha256: "c920106a33ffabbf235d2f11cbd4d1d55a40bda36a69b154567307eaaa0bf982"
	},
	"blue-fantasy": {
		entry: "hooks.mjs",
		manifestSha256: "b22cc82145e1f90f4257af1411724e34a99513761290980fb5f8d25727809808",
		hooksSha256: "21ac2ad4d4423acf31e3391bfba18ce2d9eec7b192f7a0ba47e8a0c843ff15a5"
	},
	"blueprint": {
		entry: "hooks.mjs",
		manifestSha256: "e36d9d53aae73c4693e36fc2e130bca2996cda6dcd8f80917627897774232a3e",
		hooksSha256: "086184c78ea212c3674bae76eee077cbe83862e4c6cdcd0e2ee65804f6784b54"
	},
	"cyber-night": {
		entry: "hooks.mjs",
		manifestSha256: "38de22962a80602c22910324e7c5fec171342363760972b7421debeb628d8508",
		hooksSha256: "199f37fe6969e3dfae4891708604b6b639f011068c10356f774145512fd3be69"
	},
	"diy-journal": {
		entry: "hooks.mjs",
		manifestSha256: "3bb6ed40ad441fd0286fb8040ba4d8697f5c4a30a099ec4cbef8ba1aaddd68f1",
		hooksSha256: "6a286d2191b2ffdf2bdec7f92ffb9896cd9dfd12055160118fc120dc8efa9572"
	},
	"dragon-heir": {
		entry: "hooks.mjs",
		manifestSha256: "e963197ef3d7b0b444c5976b4dd42cb9e30ce79880bfcb4a076da3426ff60056",
		hooksSha256: "ccc644148fd71cc32723891e97ed586b86fe2f86e0f36362133de7d66d08f5bd"
	},
	"furina": {
		entry: "hooks.mjs",
		manifestSha256: "eaac87525cf305e6a7d78b5257705301fa3818e696c3ccbba205bd72a135f108",
		hooksSha256: "713668d3a50da8878337feb4553f953eea781734934610af37a58dea37112ec9"
	},
	"harbor": {
		entry: "hooks.mjs",
		manifestSha256: "a09949fdf5217ac2f6d5d37603df525e56713385ad799cf4c496fbd71cc5861d",
		hooksSha256: "7981a2f98d1ade2815f7e33e2d79672c280334001a00406bb11b5362ce8182bf"
	},
	"hologram-sanctum": {
		entry: "hooks.mjs",
		manifestSha256: "a655bbde8580eddb45271949a7864355cc5c368f91bd811f3632809134c9c3e8",
		hooksSha256: "f82cf61957efb9d9f53557637b00333aa307b3c9642e73620afdbb1fa9511e9e"
	},
	"last-exile": {
		entry: "hooks.mjs",
		manifestSha256: "ce6f66c6da9f4ab6e350784f9a837f73caaeef492da97ad43f20beed4097d947",
		hooksSha256: "1472017007cc8c99385f27f287d1e42d8f0af07c93a4923bc96c461275173a03"
	},
	"maid-atelier": {
		entry: "hooks.mjs",
		manifestSha256: "7596a704bce65006381d27417d4c12bb09d7e5ede038a6f486cfa58e62314aa5",
		hooksSha256: "1f2e0f12c19c8b07301d290dc8d8ca5428f0051fe9417b50c8951919f8136e74"
	},
	"matrix": {
		entry: "hooks.mjs",
		manifestSha256: "6bcadb4f3da51a12838e002c8956baac2326bf67d7c1cf1f6108d93f1a7a6485",
		hooksSha256: "2e13e495adabe900df797cdbe930b8cb7fdb2ce721c1ba021e6eb2e74326e551"
	},
	"miku": {
		entry: "hooks.mjs",
		manifestSha256: "50b7512a140b272d7250eacc3c8bddb40191fba0e580ded8c57d59b85a1f29eb",
		hooksSha256: "7d1d144d749cb786a102cbd243c3f35f4e9c0a3b5fb0a75f18a82d8e7197994d"
	},
	"minecraft": {
		entry: "hooks.mjs",
		manifestSha256: "08d4a527db2281e84d919b04392b9101e2c4445dd06746fd8514ac8e0dd3d8c3",
		hooksSha256: "deb4abe5e9dc64b075cb6ab1cfbdb153534a6cf837e3558cc0daee7b1bc6eb1a"
	},
	"orca-link": {
		entry: "hooks.mjs",
		manifestSha256: "48b9c76b6f8fc4fad1473d987c0ebd8c10f4734e2eff2091bbb9040c9a5ce089",
		hooksSha256: "603b0b8aa5ab1d580011bc4ba5d00e82f0d3d76c9a3cd76cbb83043906e3a026"
	},
	"phoebe-atelier": {
		entry: "hooks.mjs",
		manifestSha256: "76cfe0d34f644fcaff6c03dbf84fd82ececf18ef56f3c791a9ab0b5b17a30615",
		hooksSha256: "f39b57db0de26c1b0972cd7160d6197c281c4d66ba6abb6fe193a666da0d5f22"
	},
	"porco-rosso": {
		entry: "hooks.mjs",
		manifestSha256: "2b556e8e7481859be70b3123031607a4819b2e63d5173846954db1ffb4b364ab",
		hooksSha256: "41c0a7ba9af1360a6e9427db34a0bc0da4d61bba04d5cbf6ba613831475b1474"
	},
	"starry-nocturne": {
		entry: "hooks.mjs",
		manifestSha256: "5a5bd138ed156d1877e00ea9acfbf94f8342b751d21796942ed3175562801a61",
		hooksSha256: "5493c9d0c28c80c18e0fe39ee851f3ffe7813f0a126c67c95b36674b2a4bcf65"
	},
	"stellar-diva": {
		entry: "hooks.mjs",
		manifestSha256: "66a56618fbd36da1423d97a0f1196aec391c478f6bdc40fc38f99e23df3dbdbe",
		hooksSha256: "22efa5c0860f8f20c425c79d29a82ee9a98cfb710e2e9c3c6ca633a9eae7086b"
	},
	"trading": {
		entry: "hooks.mjs",
		manifestSha256: "945b5c1f6ef387060a9b7dbb4451a261ecbffedf7949890925cf2b97c6b0c3a8",
		hooksSha256: "76954acbe0925f470fdfc79d60c5402fd11f617342df719382265b70e3f5a36a"
	},
	"verdandi": {
		entry: "hooks.mjs",
		manifestSha256: "538eba4041d5cd5630742d62ebd3f536cc602640b16a59039998f4c8755d3bbf",
		hooksSha256: "221a8647ae4effbfdada0b7e6984d7bf8e325db96a4f481c69865176e666e731"
	},
	"war-thunder": {
		entry: "hooks.mjs",
		manifestSha256: "3779eeb27f441deed0be277a5d67342c254305683214bda68fc814565dadab89",
		hooksSha256: "c44435d89e1de3713a2e46da031acc8a1de0cc6502067ba1e1ca2aa3a1d9d88e"
	},
	"whale-mom": {
		entry: "hooks.mjs",
		manifestSha256: "310d99a3f66b8d085830295d2ec5bd979f384d3ea0f785feb01578d5e8e0364f",
		hooksSha256: "be8921f66e7ef6d73a0c12686f9b0134fb1f4d47e38d1dedc09f4a74c1533b83"
	},
	"whale-song": {
		entry: "hooks.mjs",
		manifestSha256: "fa53ef0c536e672fad0448b199f784d22ee7f1a2dd4da6a06c45836800d33331",
		hooksSha256: "beb0f140dab1abb40bda52ad2ae1970feb761e2184e64e1d5810fab7c32dfff3"
	},
	"white-snake": {
		entry: "hooks.mjs",
		manifestSha256: "8ccc4052918b0796e731d0211ccf8ee769240bea0f07374e1740d6572dbcd97b",
		hooksSha256: "b8df769405646e50bab4fd3993896d81e0db28201dd2c79480c89002efaca9e9"
	},
	"xp": {
		entry: "hooks.mjs",
		manifestSha256: "8bceb95c45b400b67ceb80a7f063b6c2086c0e9f9907a7b72a592d33017623eb",
		hooksSha256: "1574d30f271f481a681feddc0608b04b0aec684e323fec0b00481f08450e4eb3"
	}
};
//#endregion
//#region src/provenance.ts
/**
* Official-market provenance verification (issue #1073).
*
* Skins installed one-click from the DSH Market carry a
* dsh-market.provenance.json written by the market installer at install
* time, pinning every installed file to its sha256 and to the market
* origin. The market's skin content is built from THIS repository (same
* review, same release), so when the on-disk skin.json and hooks entry
* hash-match the provenance, the hooks bytes are exactly the reviewed
* bytes and may run like a built-in skin's.
*
* Fail-closed: invalid provenance and any post-install byte mismatch keep the
* hooks-refused behavior for user-directory skins. A pre-provenance install
* recovers only by matching this release's generated reviewed identity.
* Forging the provenance
* requires write access to $DSH_HOME itself — an attacker with that access
* can already install full plugins, so the file is a provenance record,
* not a capability guard against the local user.
* @module @linxin666/dsh-client-ui-skin-center/provenance
*/
/** Provenance filename written by the market installer (mirrors PROVENANCE_FILENAME in @linxin666/dsh-client-ui-market; no cross-package runtime import). */
const MARKET_PROVENANCE_FILENAME = "dsh-market.provenance.json";
/** Market origin the provenance must pin (mirrors MARKET_ORIGIN in @linxin666/dsh-client-ui-market). */
const MARKET_PROVENANCE_SOURCE = "https://dsh-market.com";
function sha256Hex(abs) {
	try {
		return createHash("sha256").update(readFileSync(abs)).digest("hex");
	} catch {
		return null;
	}
}
/**
* Whether the skin directory at dir carries valid official-market
* provenance for skinId whose declared hooks entry (already validated as a
* safe relative path by the manifest validator) hash-matches the recorded
* bytes — skin.json included, so the facet entry path itself is pinned.
*/
function verifyMarketProvenance(dir, skinId, hooksEntry) {
	let raw;
	try {
		raw = JSON.parse(readFileSync(join(dir, MARKET_PROVENANCE_FILENAME), "utf8"));
	} catch {
		return false;
	}
	if (typeof raw !== "object" || raw === null) return false;
	const prov = raw;
	if (prov.version !== 1) return false;
	if (prov.source !== "https://dsh-market.com") return false;
	if (prov.id !== skinId) return false;
	const files = prov.files;
	if (typeof files !== "object" || files === null) return false;
	const hashes = files;
	for (const rel of ["skin.json", hooksEntry]) {
		const expected = hashes[rel];
		if (typeof expected !== "string" || !/^[0-9a-f]{64}$/.test(expected)) return false;
		const actual = sha256Hex(join(dir, ...rel.split("/")));
		if (actual === null || actual !== expected) return false;
	}
	return true;
}
/**
* Recover a pre-provenance Workshop install only when its executable identity
* is byte-for-byte one of this release's reviewed market skins. This is a
* read-only fallback: no provenance is minted and no user file is replaced.
*/
function verifyReviewedLegacyHooks(dir, skinId, hooksEntry) {
	const reviewed = REVIEWED_SKIN_HOOKS[skinId];
	if (reviewed === void 0 || reviewed.entry !== hooksEntry) return false;
	const manifestHash = sha256Hex(join(dir, "skin.json"));
	const hooksHash = sha256Hex(join(dir, ...hooksEntry.split("/")));
	return manifestHash === reviewed.manifestSha256 && hooksHash === reviewed.hooksSha256;
}
/**
* Deep integrity verification of one skin directory: checks all files declared
* in dsh-market.provenance.json against recorded sha256 hashes, or verifies
* against the reviewed legacy registry when provenance is absent.
*/
function verifySkinIntegrity(dir, skinId, options = {}) {
	if (options.isBuiltin) return {
		id: skinId,
		status: "valid",
		hooksTrusted: true,
		hasProvenance: false,
		mismatches: [],
		missing: [],
		totalFilesChecked: 0
	};
	let raw = null;
	try {
		raw = JSON.parse(readFileSync(join(dir, MARKET_PROVENANCE_FILENAME), "utf8"));
	} catch {
		raw = null;
	}
	if (typeof raw === "object" && raw !== null) {
		const prov = raw;
		if (prov.version === 1 && prov.source === "https://dsh-market.com" && prov.id === skinId && typeof prov.files === "object" && prov.files !== null) {
			const hashes = prov.files;
			const mismatches = [];
			const missing = [];
			let totalFilesChecked = 0;
			for (const [rel, expected] of Object.entries(hashes)) {
				if (typeof expected !== "string") continue;
				totalFilesChecked++;
				const actual = sha256Hex(join(dir, ...rel.split("/")));
				if (actual === null) missing.push(rel);
				else if (actual !== expected) mismatches.push(rel);
			}
			if (missing.length > 0) return {
				id: skinId,
				status: "missing-files",
				hooksTrusted: false,
				hasProvenance: true,
				mismatches,
				missing,
				totalFilesChecked
			};
			if (mismatches.length > 0) return {
				id: skinId,
				status: "tampered",
				hooksTrusted: false,
				hasProvenance: true,
				mismatches,
				missing,
				totalFilesChecked
			};
			return {
				id: skinId,
				status: "valid",
				hooksTrusted: true,
				hasProvenance: true,
				mismatches: [],
				missing: [],
				totalFilesChecked
			};
		}
	}
	const hooksEntry = options.hooksEntry;
	if (hooksEntry) {
		if (verifyReviewedLegacyHooks(dir, skinId, hooksEntry)) return {
			id: skinId,
			status: "valid",
			hooksTrusted: true,
			hasProvenance: false,
			mismatches: [],
			missing: [],
			totalFilesChecked: 2
		};
		return {
			id: skinId,
			status: "missing-provenance",
			hooksTrusted: false,
			hasProvenance: false,
			mismatches: [],
			missing: [],
			totalFilesChecked: 0
		};
	}
	return {
		id: skinId,
		status: "unverified",
		hooksTrusted: false,
		hasProvenance: false,
		mismatches: [],
		missing: [],
		totalFilesChecked: 0
	};
}
const SAFE_REL_RE = /^[A-Za-z0-9._][A-Za-z0-9._\-/]{0,199}$/;
function isSafeRel(rel) {
	if (typeof rel !== "string" || !SAFE_REL_RE.test(rel)) return false;
	if (rel.includes("..") || rel.includes("//") || rel.startsWith("/") || rel.endsWith("/")) return false;
	return true;
}
function collectLocalFiles(dir, base = "") {
	const list = [];
	for (const name of readdirSync(dir)) {
		if (name.startsWith(".") || name === "dsh-market.provenance.json") continue;
		const abs = join(dir, name);
		const rel = base ? `${base}/${name}` : name;
		const st = statSync(abs);
		if (st.isDirectory()) list.push(...collectLocalFiles(abs, rel));
		else if (st.isFile()) list.push(rel);
	}
	return list;
}
/**
* Repairs a corrupted or tampered skin directory by pulling pristine files
* from the local source tree or the official DSH Market and rewriting provenance.
*/
async function repairSkinFromMarket(destDir, skinId, options = {}) {
	if (!skinId || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(skinId)) return {
		ok: false,
		id: skinId,
		error: "invalid-id"
	};
	const localDir = options.localSourceDir ?? (existsSync(join(import.meta.dirname, "..", "skins", skinId, "skin.json")) ? join(import.meta.dirname, "..", "skins", skinId) : null);
	if (localDir && existsSync(join(localDir, "skin.json"))) {
		const files = collectLocalFiles(localDir);
		if (files.length > 0) {
			const hashes = {};
			mkdirSync(destDir, { recursive: true });
			for (const rel of files) {
				const src = join(localDir, ...rel.split("/"));
				const target = join(destDir, ...rel.split("/"));
				const guard = rel.split("/").slice(0, -1).join(sep);
				if (guard) mkdirSync(join(destDir, guard), { recursive: true });
				cpSync(src, target, { force: true });
				const h = sha256Hex(target);
				if (h) hashes[rel] = h;
			}
			const provenance = {
				version: 1,
				source: MARKET_PROVENANCE_SOURCE,
				kind: "skin",
				id: skinId,
				installedAt: (/* @__PURE__ */ new Date()).toISOString(),
				files: hashes
			};
			writeFileSync(join(destDir, MARKET_PROVENANCE_FILENAME), JSON.stringify(provenance, null, 2) + "\n");
			return {
				ok: true,
				id: skinId,
				repairedFiles: files.length
			};
		}
	}
	const fetchImpl = options.fetchImpl ?? fetch;
	const timeoutMs = options.timeoutMs ?? 15e3;
	try {
		const res = await fetchImpl(`${MARKET_PROVENANCE_SOURCE}/manifest/skins.json`, { signal: AbortSignal.timeout(timeoutMs) });
		if (!res.ok) return {
			ok: false,
			id: skinId,
			error: `manifest-fetch-failed: ${res.status}`
		};
		const item = (await res.json())?.items?.find((it) => it.id === skinId);
		if (!item || !Array.isArray(item.files) || item.files.length === 0) return {
			ok: false,
			id: skinId,
			error: "skin-not-found-on-market"
		};
		const tmp = destDir + ".repair-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
		mkdirSync(tmp, { recursive: true });
		const hashes = {};
		try {
			for (const rel of item.files) {
				if (!isSafeRel(rel)) throw new Error(`unsafe manifest path: ${rel}`);
				const fileRes = await fetchImpl(`${MARKET_PROVENANCE_SOURCE}/assets/skins/${encodeURIComponent(skinId)}/${rel.split("/").map(encodeURIComponent).join("/")}`, { signal: AbortSignal.timeout(timeoutMs) });
				if (!fileRes.ok) throw new Error(`failed to download ${rel}: ${fileRes.status}`);
				const buf = Buffer.from(await fileRes.arrayBuffer());
				const target = join(tmp, ...rel.split("/"));
				const guard = rel.split("/").slice(0, -1).join(sep);
				if (guard) mkdirSync(join(tmp, guard), { recursive: true });
				writeFileSync(target, buf);
				hashes[rel] = createHash("sha256").update(buf).digest("hex");
			}
			const provenance = {
				version: 1,
				source: MARKET_PROVENANCE_SOURCE,
				kind: "skin",
				id: skinId,
				installedAt: (/* @__PURE__ */ new Date()).toISOString(),
				files: hashes
			};
			writeFileSync(join(tmp, MARKET_PROVENANCE_FILENAME), JSON.stringify(provenance, null, 2) + "\n");
			if (existsSync(destDir)) rmSync(destDir, {
				recursive: true,
				force: true,
				maxRetries: 3,
				retryDelay: 50
			});
			try {
				renameSync(tmp, destDir);
			} catch {
				const start = Date.now();
				while (Date.now() - start < 50);
				renameSync(tmp, destDir);
			}
			return {
				ok: true,
				id: skinId,
				repairedFiles: item.files.length
			};
		} finally {
			try {
				if (existsSync(tmp)) rmSync(tmp, {
					recursive: true,
					force: true,
					maxRetries: 3,
					retryDelay: 50
				});
			} catch {}
		}
	} catch (err) {
		return {
			ok: false,
			id: skinId,
			error: err instanceof Error ? err.message : String(err)
		};
	}
}
//#endregion
//#region src/bulk.ts
/**
* Bulk skin maintenance for the Skin Center.
*
* Integrity verification (provenance.ts) answers "are these bytes the ones I
* installed?" — a stale install passes it, because a whole old release is
* internally consistent. Nothing in the catalog can tell a user that a newer
* release exists, which is why an install can silently fall many versions
* behind and still look healthy. These helpers ask the official market
* manifest instead and answer the two questions the bulk buttons need:
* which installed skins are behind, and what does the market publish.
*
* Deliberately read-only. The bulk update and bulk uninstall buttons drive the
* existing, individually tested per-skin `repair` and `uninstall` routes, so
* this module never mutates a skin directory itself.
*
* @module @linxin666/dsh-client-ui-skin-center/bulk
*/
/** The market manifest URL that publishes one version per published skin. */
const MARKET_SKINS_MANIFEST_URL = `${MARKET_PROVENANCE_SOURCE}/manifest/skins.json`;
/** Default network budget for one manifest read. */
const DEFAULT_TIMEOUT_MS = 15e3;
/**
* Compare two dotted numeric versions segment by segment; a missing segment
* reads as 0 so "1.2" and "1.2.0" are equal. Non-numeric segments read as 0
* too, which keeps a malformed version from ever claiming to be newer.
* @param a - left version.
* @param b - right version.
* @returns negative when a < b, 0 when equal, positive when a > b.
*/
function compareVersions(a, b) {
	const left = a.split(".");
	const right = b.split(".");
	const length = Math.max(left.length, right.length, 3);
	for (let index = 0; index < length; index++) {
		const l = Number.parseInt(left[index] ?? "0", 10);
		const r = Number.parseInt(right[index] ?? "0", 10);
		const lv = Number.isNaN(l) ? 0 : l;
		const rv = Number.isNaN(r) ? 0 : r;
		if (lv !== rv) return lv < rv ? -1 : 1;
	}
	return 0;
}
/**
* Read the market manifest and return its id -> version map.
*
* Fails closed: any transport, status, or shape problem resolves to an empty
* map plus an error string, so a caller can never mistake "the market is
* unreachable" for "everything is up to date" or "everything is outdated".
* @param options - fetch override and timeout for tests.
* @returns the version map and a null-or-error status.
*/
async function fetchMarketVersions(options = {}) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	let payload;
	try {
		const res = await fetchImpl(MARKET_SKINS_MANIFEST_URL, { signal: AbortSignal.timeout(timeoutMs) });
		if (!res.ok) return {
			versions: /* @__PURE__ */ new Map(),
			error: `manifest-fetch-failed: ${res.status}`
		};
		payload = await res.json();
	} catch (error) {
		return {
			versions: /* @__PURE__ */ new Map(),
			error: `manifest-fetch-failed: ${error?.message ?? "network"}`
		};
	}
	if (typeof payload !== "object" || payload === null) return {
		versions: /* @__PURE__ */ new Map(),
		error: "manifest-malformed"
	};
	const items = payload.items;
	if (!Array.isArray(items)) return {
		versions: /* @__PURE__ */ new Map(),
		error: "manifest-malformed"
	};
	const versions = /* @__PURE__ */ new Map();
	for (const item of items) {
		if (typeof item !== "object" || item === null) continue;
		const record = item;
		if (typeof record.id !== "string" || record.id === "") continue;
		if (typeof record.version !== "string" || record.version === "") continue;
		if (!versions.has(record.id)) versions.set(record.id, record.version);
	}
	return {
		versions,
		error: null
	};
}
/**
* Pair every catalog skin with the market's version for it.
*
* Builtin skins are never outdated: they ship inside the package and are
* replaced by upgrading that package, not by pulling from the market.
* @param catalog - the current skin catalog snapshot.
* @param versions - id -> version map from the market manifest.
* @returns one row per catalog skin, catalog order preserved.
*/
function planVersionRows(catalog, versions) {
	return catalog.skins.map((entry) => {
		const id = entry.manifest.id;
		const installed = entry.manifest.version;
		const latest = versions.get(id) ?? null;
		return {
			id,
			origin: entry.origin,
			installed,
			latest,
			outdated: entry.origin === "user" && latest !== null && compareVersions(installed, latest) < 0
		};
	});
}
//#endregion
//#region src/core/background.ts
/** Effective value of every field when the state carries none. */
const SKIN_BACKGROUND_DEFAULTS = {
	enabled: true,
	backgroundOpacity: 0,
	backgroundBlurEmpty: 0,
	backgroundBlurContent: 0,
	inputCardBlur: 10,
	bubbleOpacity: 50,
	bubbleBlur: 10
};
/** The fields normalize/sanitize know about; unknown keys are dropped. */
const SKIN_BACKGROUND_FIELDS = Object.keys(SKIN_BACKGROUND_DEFAULTS);
function clampInt(value, min, max) {
	return Math.max(min, Math.min(max, Math.round(value)));
}
const RANGES = {
	backgroundOpacity: [0, 100],
	backgroundBlurEmpty: [0, 20],
	backgroundBlurContent: [0, 20],
	inputCardBlur: [0, 20],
	bubbleOpacity: [0, 100],
	bubbleBlur: [0, 20]
};
function isRecord$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Lenient normalization for stored/legacy data: unknown keys and wrongly
* typed fields are dropped, numeric fields are clamped into range. Never
* fails; a non-object input yields an empty config.
*/
function normalizeSkinBackground(value) {
	if (!isRecord$1(value)) return {};
	const out = {};
	if (typeof value.enabled === "boolean") out.enabled = value.enabled;
	for (const field of Object.keys(RANGES)) {
		const raw = value[field];
		if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
		const [min, max] = RANGES[field];
		out[field] = clampInt(raw, min, max);
	}
	return out;
}
/**
* Strict validation for the POST /active write surface: a background value
* must be an object whose known fields are correctly typed (numbers are then
* clamped). Returns null for anything else so the route can answer 400.
*/
function sanitizeSkinBackground(value) {
	if (!isRecord$1(value)) return null;
	if (value.enabled !== void 0 && typeof value.enabled !== "boolean") return null;
	for (const field of Object.keys(RANGES)) {
		const raw = value[field];
		if (raw !== void 0 && (typeof raw !== "number" || !Number.isFinite(raw))) return null;
	}
	return normalizeSkinBackground(value);
}
/** True when at least one field departs from its default (customized data). */
function hasCustomSkinBackground(value) {
	return SKIN_BACKGROUND_FIELDS.some((field) => value[field] !== void 0 && value[field] !== SKIN_BACKGROUND_DEFAULTS[field]);
}
//#endregion
//#region src/core/manifest-v2/types.ts
/** v1 fields accepted but ignored with a migration warning (never fail-closed). */
const DEPRECATED_V1_FIELDS = [
	"package",
	"wiring",
	"bodyAttr"
];
//#endregion
//#region src/core/manifest-v2/validate.ts
/**
* Fail-closed validator for skin.json manifest v2.
*
* Pure, dependency-free, safe in both the host (node) and the browser
* bundle. Rules (issue #506, section 5):
*  - unknown top-level / nested fields are hard errors (fail-closed);
*  - the v1 fields `package` / `wiring` / `bodyAttr` are an explicit
*    deprecated allowlist: ignored with a migration warning, never an
*    error — otherwise the 11 legacy manifests would be rejected by their
*    own validator;
*  - all file references must be relative paths inside the skin directory
*    (no leading slash, no "..", no protocol URLs);
*  - `skinManifestVersion` declares file structure only; hooks runtime
*    compatibility is carried by `facets.client.apiVersion` and checked
*    by the loader, not here.
*/
const REL_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*:\/\/)[A-Za-z0-9._\-/]+$/;
const SKIN_ID$1 = /^[a-z][a-z0-9-]{0,31}$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const API_VERSION = /^x-org\.linxin666\.skin-center\/[a-z0-9]+$/;
const TOP_LEVEL_KEYS = /* @__PURE__ */ new Set([
	"$schema",
	"skinManifestVersion",
	"id",
	"name",
	"nameEn",
	"version",
	"author",
	"tagline",
	"description",
	"tags",
	"accent",
	"order",
	"preview",
	"license",
	"licenseUrl",
	"noticeUrl",
	"sourceUrl",
	"attribution",
	"requires",
	"contributes",
	"facets",
	...DEPRECATED_V1_FIELDS
]);
const DEPRECATED_SET = new Set(DEPRECATED_V1_FIELDS);
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function checkKeys(obj, allowed, path, errors) {
	for (const key of Object.keys(obj)) if (!allowed.has(key)) errors.push(`${path}: unknown field "${key}"`);
}
function checkRelPath(value, path, errors) {
	if (typeof value !== "string" || !REL_PATH.test(value)) errors.push(`${path}: must be a relative path inside the skin directory (got ${JSON.stringify(value)})`);
}
function checkOptionalString(value, path, errors) {
	if (value !== void 0 && typeof value !== "string") errors.push(`${path}: must be a string`);
}
function checkBackgroundLayer(value, path, errors) {
	if (value === void 0) return;
	if (!isRecord(value)) {
		errors.push(`${path}: must be an object`);
		return;
	}
	checkKeys(value, /* @__PURE__ */ new Set([
		"type",
		"src",
		"scrim"
	]), path, errors);
	if (value.type !== "image" && value.type !== "video") errors.push(`${path}.type: must be "image" or "video"`);
	checkRelPath(value.src, `${path}.src`, errors);
	checkOptionalString(value.scrim, `${path}.scrim`, errors);
}
function checkContracts(value, path, errors) {
	if (value === void 0) return;
	if (!Array.isArray(value)) {
		errors.push(`${path}: must be an array`);
		return;
	}
	value.forEach((entry, index) => {
		const p = `${path}[${index}]`;
		if (!isRecord(entry)) {
			errors.push(`${p}: must be an object`);
			return;
		}
		checkKeys(entry, /* @__PURE__ */ new Set([
			"apiVersion",
			"kind",
			"optional"
		]), p, errors);
		if (typeof entry.apiVersion !== "string" || !API_VERSION.test(entry.apiVersion)) errors.push(`${p}.apiVersion: must match x-org.linxin666.skin-center/<tag>`);
		if (entry.kind !== "SkinRuntime" && entry.kind !== "SkinHooks") errors.push(`${p}.kind: must be "SkinRuntime" or "SkinHooks"`);
		if (entry.optional !== void 0 && typeof entry.optional !== "boolean") errors.push(`${p}.optional: must be a boolean`);
	});
}
/**
* Validate a parsed skin.json payload against the v2 contract.
* Never throws; malformed input yields `ok: false` with human-readable errors.
*/
function validateSkinManifestV2(input) {
	const errors = [];
	const warnings = [];
	if (!isRecord(input)) return {
		ok: false,
		errors: ["manifest: must be a JSON object"],
		warnings
	};
	for (const field of Object.keys(input)) if (DEPRECATED_SET.has(field)) warnings.push(`deprecated v1 field "${field}" ignored; run the v1→v2 migration codemod`);
	checkKeys(input, TOP_LEVEL_KEYS, "manifest", errors);
	if (input.skinManifestVersion !== 2) errors.push("manifest.skinManifestVersion: must be 2 (v1 manifests need the migration codemod)");
	if (typeof input.id !== "string" || !SKIN_ID$1.test(input.id)) errors.push(`manifest.id: must match ${SKIN_ID$1} (got ${JSON.stringify(input.id)})`);
	for (const field of [
		"name",
		"nameEn",
		"author"
	]) if (typeof input[field] !== "string" || input[field].length === 0) errors.push(`manifest.${field}: required non-empty string`);
	if (typeof input.version !== "string" || !SEMVER.test(input.version)) errors.push(`manifest.version: required SemVer string (got ${JSON.stringify(input.version)})`);
	checkOptionalString(input.tagline, "manifest.tagline", errors);
	checkOptionalString(input.description, "manifest.description", errors);
	for (const field of [
		"license",
		"licenseUrl",
		"noticeUrl",
		"sourceUrl",
		"attribution"
	]) checkOptionalString(input[field], `manifest.${field}`, errors);
	if (input.tags !== void 0) {
		if (!Array.isArray(input.tags) || input.tags.some((t) => typeof t !== "string")) errors.push("manifest.tags: must be a string array");
	}
	if (input.accent !== void 0 && (typeof input.accent !== "string" || !HEX_COLOR.test(input.accent))) errors.push(`manifest.accent: must be a #rrggbb color (got ${JSON.stringify(input.accent)})`);
	if (input.order !== void 0 && !Number.isInteger(input.order)) errors.push("manifest.order: must be an integer");
	if (input.$schema !== void 0 && typeof input.$schema !== "string") errors.push("manifest.$schema: must be a string");
	if (input.preview !== void 0) {
		if (!isRecord(input.preview)) errors.push("manifest.preview: must be an object");
		else {
			checkKeys(input.preview, /* @__PURE__ */ new Set(["light", "dark"]), "manifest.preview", errors);
			checkRelPath(input.preview.light, "manifest.preview.light", errors);
			checkRelPath(input.preview.dark, "manifest.preview.dark", errors);
		}
	}
	if (input.requires !== void 0) {
		if (!isRecord(input.requires)) errors.push("manifest.requires: must be an object");
		else {
			checkKeys(input.requires, /* @__PURE__ */ new Set(["contracts"]), "manifest.requires", errors);
			checkContracts(input.requires.contracts, "manifest.requires.contracts", errors);
		}
	}
	if (!isRecord(input.contributes)) errors.push("manifest.contributes: required object with at least \"stylesheet\"");
	else {
		const contributes = input.contributes;
		checkKeys(contributes, /* @__PURE__ */ new Set([
			"stylesheet",
			"patches",
			"backgroundMedia"
		]), "manifest.contributes", errors);
		checkRelPath(contributes.stylesheet, "manifest.contributes.stylesheet", errors);
		if (contributes.patches !== void 0) checkRelPath(contributes.patches, "manifest.contributes.patches", errors);
		if (contributes.backgroundMedia !== void 0) {
			if (!isRecord(contributes.backgroundMedia)) errors.push("manifest.contributes.backgroundMedia: must be an object");
			else {
				checkKeys(contributes.backgroundMedia, /* @__PURE__ */ new Set(["light", "dark"]), "manifest.contributes.backgroundMedia", errors);
				checkBackgroundLayer(contributes.backgroundMedia.light, "manifest.contributes.backgroundMedia.light", errors);
				checkBackgroundLayer(contributes.backgroundMedia.dark, "manifest.contributes.backgroundMedia.dark", errors);
			}
		}
	}
	if (input.facets !== void 0) {
		if (!isRecord(input.facets)) errors.push("manifest.facets: must be an object");
		else {
			checkKeys(input.facets, /* @__PURE__ */ new Set(["client"]), "manifest.facets", errors);
			if (input.facets.client !== void 0) {
				const client = input.facets.client;
				if (!isRecord(client)) errors.push("manifest.facets.client: must be an object");
				else {
					checkKeys(client, /* @__PURE__ */ new Set(["entry", "apiVersion"]), "manifest.facets.client", errors);
					checkRelPath(client.entry, "manifest.facets.client.entry", errors);
					if (typeof client.apiVersion !== "string" || !API_VERSION.test(client.apiVersion)) errors.push("manifest.facets.client.apiVersion: must match x-org.linxin666.skin-center/<tag>");
				}
			}
		}
	}
	const manifest = errors.length === 0 ? input : void 0;
	return {
		ok: errors.length === 0,
		errors,
		warnings,
		manifest
	};
}
//#endregion
//#region src/core/css-safety/token-audit.ts
const PRIMARY_ACTION_FILL = "--dsw-alias-button-primary-fill";
const PRIMARY_ACTION_HOVER = "--dsw-alias-button-primary-hover";
const PRIMARY_ACTION_DIMMED = "--dsw-alias-button-primary-dimmed";
const PRIMARY_ACTION_FOREGROUND = "--dsw-alias-label-primary-foreground";
const BRAND_PRIMARY = "--dsw-alias-brand-primary";
const BRAND_PRIMARY_INVERT = "--dsw-alias-brand-primary-invert";
/** Shell fill/foreground defaults per theme (both resolve to the official
* theme's own matched CTA: #0f1115 on #ffffff light, #f9fafb on #0f1115 dark). */
const SHELL_CTA = {
	light: {
		fill: "#0f1115",
		foreground: "#ffffff"
	},
	dark: {
		fill: "#f9fafb",
		foreground: "#0f1115"
	}
};
/**
* Official static palette values referenced through var() by skinned tokens
* (the subset the built-in skins actually use; mirrors the official
* dsh-client-ui-theme static table). If a value ever drifts, contrast
* resolution degrades to "skip", never to a wrong verdict.
*/
const STATIC_PALETTE = {
	"--dsw-static-amber-400": "#f7ad31",
	"--dsw-static-amber-500": "#f59e0b",
	"--dsw-static-blue-100": "#dbeafe",
	"--dsw-static-blue-300": "#93c5fd",
	"--dsw-static-blue-400": "#60a5fa",
	"--dsw-static-blue-450": "#4d93f8",
	"--dsw-static-blue-500": "#3b82f6",
	"--dsw-static-blue-600": "#2563eb",
	"--dsw-static-blue-800": "#1e40af",
	"--dsw-static-green-400": "#4ed17e",
	"--dsw-static-green-500": "#22c55e",
	"--dsw-static-neutral-bluish-00": "#fff",
	"--dsw-static-neutral-bluish-1000": "#0f1115",
	"--dsw-static-neutral-bluish-200": "#e1e5ee",
	"--dsw-static-neutral-bluish-300": "#cfd3d6",
	"--dsw-static-neutral-bluish-400": "#adb2b8",
	"--dsw-static-neutral-bluish-500": "#979da6",
	"--dsw-static-neutral-bluish-600": "#81858c",
	"--dsw-static-neutral-bluish-700": "#61666b",
	"--dsw-static-neutral-bluish-750": "#43454a",
	"--dsw-static-neutral-bluish-800": "#353638",
	"--dsw-static-neutral-bluish-950": "#151517"
};
/** Index of the brace that closes the one opened at `open`. */
function matchClose(css, open) {
	let depth = 0;
	for (let i = open; i < css.length; i += 1) {
		const ch = css[i];
		if (ch === "{") depth += 1;
		else if (ch === "}") {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	return -1;
}
/** Recursive scan: map every custom-property declaration to a theme bucket. */
function parseDefinitions(css) {
	const defined = /* @__PURE__ */ new Set();
	const light = /* @__PURE__ */ new Map();
	const dark = /* @__PURE__ */ new Map();
	const source = withoutComments(css);
	const visit = (start, limit, parentDark) => {
		let i = start;
		for (;;) {
			const open = source.indexOf("{", i);
			if (open === -1 || open >= limit) return;
			const rawClose = matchClose(source, open);
			const close = rawClose === -1 || rawClose >= limit ? -1 : rawClose;
			const head = source.slice(i, open);
			const atRule = head.trimStart().startsWith("@");
			const darkHere = parentDark || /data-ds-dark-theme/.test(head) || /prefers-color-scheme\s*:\s*dark/i.test(head);
			if (atRule) {
				visit(open + 1, close === -1 ? limit : close, darkHere);
				i = close === -1 ? source.length : close + 1;
			} else {
				const end = close === -1 ? source.length : close;
				const body = source.slice(open + 1, end);
				const target = darkHere ? dark : light;
				for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
					const name = match[1];
					const value = match[2];
					if (name === void 0 || value === void 0) continue;
					defined.add(name);
					target.set(name, value.trim());
				}
				i = end + 1;
			}
		}
	};
	visit(0, source.length, false);
	return {
		defined,
		byTheme: {
			light,
			dark
		}
	};
}
function withoutComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}
/** Normalize #rgb / #rrggbb / #rrggbbaa to #rrggbb (alpha ignored). */
function normalizeHex(v) {
	const m = /^#([0-9a-f]{3,8})$/i.exec(v);
	if (m === null) return null;
	const h = m[1] ?? "";
	if (h.length === 3) return "#" + h.split("").map((c) => c + c).join("");
	if (h.length >= 6) return "#" + h.slice(0, 6);
	return null;
}
/** Resolve one declaration value to a #rrggbb color (one theme map). */
function resolveColor(value, theme, parsed, depth = 0) {
	const v = value.trim();
	const hex = normalizeHex(v);
	if (hex !== null) return hex;
	const viaVar = /^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\s*\)$/.exec(v);
	if (viaVar === null || depth >= 4) return null;
	const name = viaVar[1];
	if (name !== void 0 && STATIC_PALETTE[name] !== void 0) return STATIC_PALETTE[name];
	const own = name !== void 0 ? parsed.byTheme[theme].get(name) ?? parsed.byTheme[theme === "light" ? "dark" : "light"].get(name) : void 0;
	if (own !== void 0) return resolveColor(own, theme, parsed, depth + 1);
	const fallback = viaVar[2];
	return fallback !== void 0 ? resolveColor(fallback, theme, parsed, depth + 1) : null;
}
function rgbOf(hex) {
	const m = /^#([0-9a-f]{6})$/i.exec(hex);
	if (m === null) return null;
	const h = m[1] ?? "";
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16)
	];
}
/** WCAG 2.x relative luminance of a #rrggbb/#rgb color. */
function luminance(hex) {
	const rgb = rgbOf(hex);
	if (rgb === null) return null;
	const [r, g, b] = rgb;
	const linear = (c) => {
		const s = c / 255;
		return s <= .04045 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4);
	};
	return .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
}
/** WCAG contrast ratio between two colors (foreground over background). */
function contrastRatio(fg, bg) {
	const l1 = luminance(fg);
	const l2 = luminance(bg);
	if (l1 === null || l2 === null) return null;
	const high = Math.max(l1, l2);
	const low = Math.min(l1, l2);
	return (high + .05) / (low + .05);
}
function anchorDefined(defined) {
	return [...ANCHOR_TOKENS].some((token) => defined.has(token));
}
const ANCHOR_TOKENS = [
	PRIMARY_ACTION_FILL,
	PRIMARY_ACTION_HOVER,
	PRIMARY_ACTION_DIMMED,
	PRIMARY_ACTION_FOREGROUND,
	BRAND_PRIMARY,
	BRAND_PRIMARY_INVERT
];
/**
* Audit one skin's stylesheets (in application order) against the
* primary-action token contract. Warning-only: the loader's completion
* rules keep every outcome legible, so this never fails a skin.
*/
function auditTokenContract(stylesheets) {
	const warnings = [];
	if (stylesheets.length === 0) return { warnings };
	const parsed = mergeTokens(stylesheets);
	const { defined, byTheme } = parsed;
	if (!anchorDefined(defined)) return { warnings };
	const fillDefined = defined.has("--dsw-alias-button-primary-fill") || defined.has("--dsw-alias-brand-primary");
	const hoverDefined = defined.has("--dsw-alias-button-primary-hover") || fillDefined;
	const foregroundDefined = defined.has("--dsw-alias-label-primary-foreground") || defined.has("--dsw-alias-brand-primary") && defined.has("--dsw-alias-brand-primary-invert");
	if (!fillDefined) warnings.push("primary action contract: \"button-primary-fill\" is not defined and \"brand-primary\" is not an anchor; buttons render the official shell CTA — define button-primary-fill (with button-primary-hover and label-primary-foreground) to adopt the skin palette");
	if (!hoverDefined) warnings.push("primary action contract: \"button-primary-hover\" is not defined; the loader derives it from the button fill (color-mix toward the surface) — define it explicitly for the exact hover look");
	if (!foregroundDefined) warnings.push("primary action contract: \"label-primary-foreground\" is not defined; the loader keeps the official shell foreground (#fff light / #0f1115 dark) — pair it with the fill, or declare the matched pair brand-primary + brand-primary-invert (legacy convention)");
	for (const theme of ["light", "dark"]) {
		const map = byTheme[theme];
		const fill = map.get("--dsw-alias-button-primary-fill") ?? map.get("--dsw-alias-brand-primary") ?? SHELL_CTA[theme].fill;
		const brandInvert = map.get(BRAND_PRIMARY_INVERT);
		const foreground = map.get("--dsw-alias-label-primary-foreground") ?? (map.get("--dsw-alias-brand-primary") !== void 0 && brandInvert !== void 0 ? brandInvert : SHELL_CTA[theme].foreground);
		const fillResolved = resolveColor(fill, theme, parsed);
		const foregroundResolved = resolveColor(foreground, theme, parsed);
		if (fillResolved === null || foregroundResolved === null) continue;
		const ratio = contrastRatio(foregroundResolved, fillResolved);
		if (ratio !== null && ratio < 3) warnings.push(`primary action contrast: ${foregroundResolved} on ${fillResolved} is ${ratio.toFixed(2)}:1 (${theme} theme) — below the 3:1 UI gate; pick a foreground that pairs with the fill`);
	}
	return { warnings };
}
function mergeTokens(stylesheets) {
	const defined = /* @__PURE__ */ new Set();
	const light = /* @__PURE__ */ new Map();
	const dark = /* @__PURE__ */ new Map();
	for (const sheet of stylesheets) {
		const parsed = parseDefinitions(sheet.css);
		for (const name of parsed.defined) defined.add(name);
		for (const [name, value] of parsed.byTheme.light) light.set(name, value);
		for (const [name, value] of parsed.byTheme.dark) dark.set(name, value);
	}
	return {
		defined,
		byTheme: {
			light,
			dark
		}
	};
}
//#endregion
//#region src/harness-home.ts
/**
* DSH harness-home / profile path resolution. Extracted from the retired
* skin-switch.ts (issue #506): the v2 runtime only needs to KNOW where the
* harness home and the active profile's cordis.patch.yml live — the legacy
* bridge reads/cleans the old managed section once, nothing rewrites it
* afterwards.
*
* Precedence rules are the dsh launcher's own (kept byte-compatible with the
* retired module so the bridge reads the same file the old CLI wrote).
* @module @linxin666/dsh-client-ui-skin-center/harness-home
*/
/** First non-blank string in a list of candidate values. */
function firstNonBlank(...values) {
	for (const value of values) if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed !== "") return trimmed;
	}
}
/**
* Derive the harness home + profile from this package's install layout
* (…/<harnessHome>/profiles/<profile>/node_modules/<this package>). Returns
* null outside such a layout (repo checkouts, tests).
*/
function resolveInstallLayout(fromUrl = import.meta.url) {
	const starts = [fileURLToPath(fromUrl)];
	try {
		const real = realpathSync(starts[0]);
		if (real !== starts[0]) starts.push(real);
	} catch {}
	for (const start of starts) {
		let current = dirname(start);
		for (;;) {
			if (basename(current) === "node_modules") {
				const profileDir = dirname(current);
				const profilesDir = dirname(profileDir);
				const profile = basename(profileDir);
				if (basename(profilesDir) === "profiles" && profile !== "" && profile !== "." && profile !== ".." && profile !== "node_modules") return {
					harnessHome: dirname(profilesDir),
					profile
				};
			}
			const parent = dirname(current);
			if (parent === current) break;
			current = parent;
		}
	}
	return null;
}
/**
* Resolve the DSH harness home exactly like the dsh launcher:
* injected home → <home>/.dsh; $DSH_HOME directly; install-layout home;
* homedir()/.dsh.
*/
function resolveHarnessHome(optsHome, env = process.env, installHome) {
	if (optsHome !== void 0) return join(optsHome, ".dsh");
	return firstNonBlank(env.DSH_HOME, installHome) ?? join(homedir(), ".dsh");
}
/** The profile name when cwd sits directly under <harnessHome>/profiles/<name>. */
function profileFromCwd(cwd, profilesRoot) {
	const root = resolve(profilesRoot);
	const normalizedCwd = resolve(cwd);
	const canonicalDir = (p) => {
		try {
			return realpathSync(p);
		} catch {
			return resolve(p);
		}
	};
	if (canonicalDir(dirname(normalizedCwd)) === canonicalDir(root)) {
		const name = basename(normalizedCwd);
		try {
			if (name !== "" && statSync(normalizedCwd, { throwIfNoEntry: false })?.isDirectory() === true) return name;
		} catch {}
	}
}
/**
* Resolve the DSH paths under a HOME. Precedence (harness home): injected
* home > $DSH_HOME > install layout > homedir()/.dsh. Precedence (profile):
* injected profile > $DSH_SKIN_PROFILE > $DSH_PROFILE > cwd under
* profiles/<name> > install layout profile > web.
*/
function resolveHarnessPaths(home, profile, fromUrl = import.meta.url) {
	const install = resolveInstallLayout(fromUrl);
	const harnessHome = resolveHarnessHome(home, process.env, install?.harnessHome);
	const profilesRoot = join(harnessHome, "profiles");
	const activeProfile = firstNonBlank(profile, process.env.DSH_SKIN_PROFILE, process.env.DSH_PROFILE) ?? profileFromCwd(process.cwd(), profilesRoot) ?? install?.profile ?? "web";
	return {
		patchPath: join(harnessHome, "profiles", activeProfile, "cordis.patch.yml"),
		legacyPatchPath: join(harnessHome, "cordis.patch.yml"),
		profileModulesDir: join(harnessHome, "profiles", activeProfile, "node_modules"),
		profileManifestPath: join(harnessHome, "profiles", activeProfile, "package.json")
	};
}
//#endregion
//#region src/skin-repo.ts
/**
* Skin repository (issue #506, M2): dual-source discovery of v2 skin asset
* directories.
*
* Sources, in precedence order:
*  1. user:   $DSH_HOME/skins/<id>/   (community / locally dropped skins)
*  2. builtin: <skin-center package>/skins/<id>/  (shipped inside the one
*     npm package; no per-skin packages, no boot graph, no cordis.patch.yml)
*
* A user directory with the same id shadows the built-in one (with a
* catalog warning) — that is how a community skin overrides a bundled one
* without touching node_modules.
*
* Fail-closed: a directory whose skin.json fails validateSkinManifestV2 is
* excluded from the catalog and reported under diagnostics; it never loads.
*
* The catalog is an immutable snapshot: callers keep the object they got and
* an activation never sees the catalog change underneath it (contract
* section 8, "catalog immutable snapshot per activation").
*
* Scans are memoized per (builtinDir, userDir): a snapshot is reused until a
* cheap fingerprint of both roots (skin-dir names plus skin.json stat)
* changes, so client requests never rescan the same sources. The fingerprint
* covers add/remove/change of any skin directory, while writes outside the
* sources (POST /active state) never invalidate it.
* @module @linxin666/dsh-client-ui-skin-center/skin-repo
*/
/** Read the manifest-referenced stylesheets for one skin directory. */
function stylesheetEntries(manifest, dir) {
	const entries = [];
	const rels = [manifest.contributes.stylesheet, manifest.contributes.patches ?? null];
	for (const rel of rels) {
		if (!rel) continue;
		const abs = join(dir, rel);
		if (existsSync(abs)) entries.push({
			filename: rel,
			css: readFileSync(abs, "utf8")
		});
	}
	return entries;
}
/** Built-in skins ship inside the skin-center package under skins/. */
function builtinSkinsDir(fromUrl = import.meta.url) {
	return join(dirname(fileURLToPath(fromUrl)), "..", "skins");
}
/**
* Shipped builtin skin ids: the npm package.json files whitelist entries
* under `skins/` (the "<id>/" directory name). The published package
* contains only these directories, so a builtin catalog directory outside
* the set is a repository catalog source rather than an installed skin —
* the settings catalog lists shipped builtins plus user dirs and leaves
* the rest to the market store.
*/
function shippedSkinIds(fromUrl = import.meta.url) {
	try {
		const pkgPath = join(dirname(fileURLToPath(fromUrl)), "..", "package.json");
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
		const ids = /* @__PURE__ */ new Set();
		for (const f of Array.isArray(pkg.files) ? pkg.files : []) {
			if (typeof f !== "string" || !f.startsWith("skins/")) continue;
			const id = f.slice(6).split("/")[0];
			if (id !== void 0 && id !== "" && id !== ".") ids.add(id);
		}
		return ids;
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
/** User skins live in $DSH_HOME/skins with explicit directory overrides. */
function userSkinsDir(env = process.env) {
	const home = env.DSH_SKINS_HOME;
	if (home && home.trim() !== "") return resolve(home);
	const dir = env.DSH_SKINS_DIR;
	if (dir && dir.trim() !== "") return resolve(dir);
	return join(resolveHarnessHome(void 0, env), "skins");
}
function readManifest(dir) {
	const manifestPath = join(dir, "skin.json");
	if (!existsSync(manifestPath)) return null;
	try {
		return JSON.parse(readFileSync(manifestPath, "utf8"));
	} catch {
		return null;
	}
}
/**
* Hooks trust for one user-directory skin: official-market installs whose
* skin.json and hooks entry hash-match recorded provenance run their hooks.
* Historical Workshop installs from before provenance existed recover only
* when both files match this release's generated reviewed identity. Anything
* else keeps the refusal warning. Built-in skins never reach this — their
* origin is the trust signal.
*/
function marketHooksTrust(manifest, dir) {
	const facet = manifest.facets?.client;
	if (!facet) return {
		trusted: false,
		warning: null
	};
	if (verifyMarketProvenance(dir, manifest.id, facet.entry) || verifyReviewedLegacyHooks(dir, manifest.id, facet.entry)) return {
		trusted: true,
		warning: null
	};
	return {
		trusted: false,
		warning: "declares hooks.mjs, but hooks only run for built-in or byte-verified official-market (same-review) skins; the hooks facet will be refused"
	};
}
/** Re-evaluate the executable trust gate against the current on-disk bytes. */
function canServeSkinHooks(entry) {
	if (entry.manifest.facets?.client === void 0) return false;
	return entry.origin === "builtin" || marketHooksTrust(entry.manifest, entry.dir).trusted;
}
function collectSource(spec, catalog, claimed) {
	if (!existsSync(spec.root)) return;
	let dirNames;
	try {
		dirNames = readdirSync(spec.root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
	} catch {
		return;
	}
	for (const dirName of dirNames) {
		const dir = join(spec.root, dirName);
		const raw = readManifest(dir);
		if (raw === null) {
			catalog.diagnostics.push({
				subject: dirName,
				origin: spec.origin,
				errors: ["skin.json missing or not valid JSON"]
			});
			continue;
		}
		const result = validateSkinManifestV2(raw);
		if (!result.ok || !result.manifest) {
			catalog.diagnostics.push({
				subject: dirName,
				origin: spec.origin,
				errors: result.errors
			});
			continue;
		}
		const manifest = result.manifest;
		if (manifest.id !== dirName) {
			catalog.diagnostics.push({
				subject: dirName,
				origin: spec.origin,
				errors: [`manifest id "${manifest.id}" must equal the directory name "${dirName}"`]
			});
			continue;
		}
		const existing = claimed.get(manifest.id);
		if (existing) {
			if (spec.origin === "user" && existing.origin === "builtin") {
				catalog.skins = catalog.skins.filter((s) => s !== existing);
				const winnerWarnings = [...result.warnings, `shadows the built-in "${manifest.id}" skin`];
				const trust = marketHooksTrust(manifest, dir);
				if (trust.warning !== null) winnerWarnings.push(trust.warning);
				const winner = {
					manifest,
					origin: "user",
					dir,
					warnings: winnerWarnings,
					...trust.trusted ? { hooksTrusted: true } : {}
				};
				claimed.set(manifest.id, winner);
				catalog.skins.push(winner);
			} else existing.warnings.push(`duplicate ${spec.origin} id "${manifest.id}" ignored from ${dir}`);
			continue;
		}
		const warnings = [...result.warnings];
		const trust = spec.origin === "user" ? marketHooksTrust(manifest, dir) : {
			trusted: false,
			warning: null
		};
		if (trust.warning !== null) warnings.push(trust.warning);
		const contractWarnings = auditTokenContract(stylesheetEntries(manifest, dir));
		warnings.push(...contractWarnings.warnings);
		const entry = {
			manifest,
			origin: spec.origin,
			dir,
			warnings,
			...trust.trusted ? { hooksTrusted: true } : {}
		};
		claimed.set(manifest.id, entry);
		catalog.skins.push(entry);
	}
}
/**
* Process-wide cache: (builtinDir, userDir) -> latest snapshot. Shared by
* every loadSkinCatalog caller in the host process (index tap, v2 routes,
* seed). Tests inject their own Map through the catalogCache option.
*/
const DEFAULT_CATALOG_CACHE = /* @__PURE__ */ new Map();
/** Bound the process cache so a long-lived process can never accumulate. */
const CATALOG_CACHE_MAX_ENTRIES = 16;
/**
* Cheap invalidation fingerprint of one catalog root: the sorted skin-dir
* names plus the stat of each skin.json. The catalog content depends only on
* skin.json, so this is the exact change signal — a new or removed skin dir
* changes the name set, an in-place manifest change changes the stat. A
* missing or unreadable root yields the same marker as an empty source,
* mirroring collectSource's silent empty result.
*/
function rootFingerprint(root) {
	let dirNames;
	try {
		dirNames = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
	} catch {
		return "";
	}
	const lines = [];
	for (const dirName of dirNames) {
		const manifestPath = join(root, dirName, "skin.json");
		try {
			const st = statSync(manifestPath);
			lines.push(JSON.stringify([
				dirName,
				st.mtimeMs,
				st.size,
				st.mode
			]));
		} catch {
			lines.push(JSON.stringify([dirName]));
		}
	}
	return lines.join("\n");
}
/**
* Snapshot the skin catalog from both sources. Never throws: unreadable
* roots and invalid skins land in diagnostics instead. When the source
* fingerprint matches the last scan the memoized snapshot is returned as-is
* (capturedAt re-stamped to the observation time); a changed fingerprint
* triggers a fresh scan and updates the cache.
*/
function loadSkinCatalog(options = {}) {
	const builtinDir = options.builtinDir ?? builtinSkinsDir();
	const userDir = options.userDir ?? userSkinsDir();
	const cache = options.catalogCache ?? DEFAULT_CATALOG_CACHE;
	const cacheKey = builtinDir + "\0" + userDir;
	const fingerprint = JSON.stringify([rootFingerprint(builtinDir), rootFingerprint(userDir)]);
	const hit = cache.get(cacheKey);
	if (hit && hit.fingerprint === fingerprint) return {
		...hit.catalog,
		capturedAt: (options.now ?? Date.now)()
	};
	const catalog = {
		skins: [],
		diagnostics: [],
		capturedAt: (options.now ?? Date.now)()
	};
	const claimed = /* @__PURE__ */ new Map();
	collectSource({
		origin: "builtin",
		root: builtinDir
	}, catalog, claimed);
	collectSource({
		origin: "user",
		root: userDir
	}, catalog, claimed);
	catalog.skins.sort((a, b) => (a.manifest.order ?? Number.MAX_SAFE_INTEGER) - (b.manifest.order ?? Number.MAX_SAFE_INTEGER) || a.manifest.id.localeCompare(b.manifest.id));
	cache.set(cacheKey, {
		fingerprint,
		catalog
	});
	if (cache.size > CATALOG_CACHE_MAX_ENTRIES) cache.clear();
	return catalog;
}
/** Find one skin in a snapshot by id. */
function findSkin(catalog, id) {
	return catalog.skins.find((s) => s.manifest.id === id) ?? null;
}
/**
* Resolve a file inside a skin directory, refusing any escape. Returns null
* when the resolved path leaves the skin root.
*/
function resolveInsideSkin(entry, relPath) {
	const abs = resolve(entry.dir, relPath);
	const root = resolve(entry.dir);
	const rootWithSep = root.endsWith(sep) ? root : root + sep;
	if (abs !== root && !abs.startsWith(rootWithSep)) return null;
	return abs;
}
/**
* Uninstall one user-directory skin by removing its directory under userDir.
* Fails closed if the id is invalid, escapes the user directory, or targets a builtin.
*/
function uninstallUserSkin(skinId, options = {}) {
	if (!skinId || typeof skinId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(skinId)) return {
		ok: false,
		error: "invalid-id"
	};
	const userDir = options.userDir ?? userSkinsDir();
	const target = resolve(userDir, skinId);
	const userRoot = resolve(userDir);
	const userRootWithSep = userRoot.endsWith(sep) ? userRoot : userRoot + sep;
	if (!target.startsWith(userRootWithSep)) return {
		ok: false,
		error: "invalid-id"
	};
	if (!existsSync(target)) return {
		ok: false,
		error: "skin-not-found"
	};
	try {
		rmSync(target, {
			recursive: true,
			force: true,
			maxRetries: 3,
			retryDelay: 50
		});
	} catch (error) {
		return {
			ok: false,
			error: "write-error",
			detail: error instanceof Error ? error.message : String(error)
		};
	}
	(options.catalogCache ?? DEFAULT_CATALOG_CACHE).clear();
	return { ok: true };
}
/**
* Verify integrity of all skins in the catalog.
*/
function verifyAllSkinsIntegrity(catalog) {
	const details = [];
	let validCount = 0;
	let issuesCount = 0;
	for (const entry of catalog.skins) {
		const isBuiltin = entry.origin === "builtin";
		const hooksEntry = entry.manifest.facets?.client?.entry ?? null;
		const report = verifySkinIntegrity(entry.dir, entry.manifest.id, {
			isBuiltin,
			hooksEntry
		});
		details.push(report);
		if (report.status === "valid") validCount++;
		else issuesCount++;
	}
	return {
		total: details.length,
		valid: validCount,
		issues: issuesCount,
		details
	};
}
/**
* Repairs a specific user skin by id.
*/
async function repairSkin(skinId, options = {}) {
	const userDir = options.userDir ?? userSkinsDir();
	const res = await repairSkinFromMarket(join(userDir, skinId), skinId, {
		fetchImpl: options.fetchImpl,
		timeoutMs: options.timeoutMs,
		localSourceDir: options.localSourceDir
	});
	if (res.ok) (options.catalogCache ?? DEFAULT_CATALOG_CACHE).clear();
	return res;
}
/**
* Verifies all skins in catalog, and automatically repairs any skin with integrity issues.
*/
async function verifyAndRepairAllSkins(catalogGetter, options = {}) {
	const initialCatalog = catalogGetter();
	const initialSummary = verifyAllSkinsIntegrity(initialCatalog);
	if (options.autoRepair === false || initialSummary.issues === 0) return {
		...initialSummary,
		repaired: [],
		repairFailed: []
	};
	const repaired = [];
	const repairFailed = [];
	for (const report of initialSummary.details) if (report.status !== "valid") {
		const skinEntry = findSkin(initialCatalog, report.id);
		if (skinEntry && skinEntry.origin === "user") {
			const res = await repairSkin(report.id, options);
			if (res.ok) repaired.push(report.id);
			else repairFailed.push({
				id: report.id,
				error: res.error ?? "unknown-error"
			});
		}
	}
	return {
		...verifyAllSkinsIntegrity(catalogGetter()),
		repaired,
		repairFailed
	};
}
//#endregion
//#region src/active-state.ts
/**
* Active-skin selection persistence (issue #506): a tiny JSON document under
* $DSH_HOME written by POST /api/skin-center/v2/active and read on every
* index.html response by the tapIndex adapter. Since issue #996 the same
* document also carries the skin-background preference set, so paired remote
* desktops (where the settings scope is loopback-only) read and persist
* background values through the v2 channel. Kept dependency-free and
* synchronous: the tap runs per response and must never await.
* @module @linxin666/dsh-client-ui-skin-center/active-state
*/
/**
* The single skin shipped with the package (the market on-demand plan): the
* default look for a fresh install. Every other skin is a market download
* into the user skins directory; nothing else is bundled.
*/
const DEFAULT_SKIN_ID = "blue-fantasy";
/** Default location: $DSH_HOME/skin-center-active.json. */
function defaultActiveStatePath() {
	return join(userSkinsDir(), "..", "skin-center-active.json");
}
/** Read the whole state document; unreadable data yields all-null fields and initialized=false. */
function readActiveState(path) {
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		const hasInitialized = typeof parsed.initialized === "boolean" ? parsed.initialized : typeof parsed === "object" && parsed !== null && ("active" in parsed || "background" in parsed);
		return {
			active: typeof parsed.active === "string" ? parsed.active : null,
			background: parsed.background === void 0 || parsed.background === null ? null : normalizeSkinBackground(parsed.background),
			initialized: hasInitialized
		};
	} catch {
		return {
			active: null,
			background: null,
			initialized: false
		};
	}
}
/** Read the persisted active skin id (null = stock look / unreadable). */
function readActiveSelection(path) {
	return readActiveState(path).active;
}
/**
* Persist an update with merge semantics: keys absent from `update` keep
* their stored value, so a skin switch never wipes the background section
* and a background write never wipes the selection. The background key is
* omitted from the document while it is null, keeping legacy files clean.
*/
function writeActiveState(path, update) {
	const current = readActiveState(path);
	const active = update.active === void 0 ? current.active : update.active;
	const background = update.background === void 0 ? current.background : update.background;
	const dir = dirname(path);
	mkdirSync(dir, { recursive: true });
	const tmpDir = mkdtempSync(join(dir, `${basename(path)}.tmp-`));
	const tmp = join(tmpDir, basename(path));
	const document = {
		active,
		initialized: true
	};
	if (background !== null) document.background = background;
	try {
		writeFileSync(tmp, JSON.stringify(document, null, 2) + "\n", {
			encoding: "utf8",
			flag: "wx"
		});
		renameSync(tmp, path);
	} finally {
		rmSync(tmpDir, {
			recursive: true,
			force: true
		});
	}
}
/** Persist the active skin id (creates the parent directory). */
function writeActiveSelection(path, id) {
	writeActiveState(path, { active: id });
}
/**
* Seed the active selection on a first boot (no persisted selection): the
* shipped default skin becomes the active look. Never overwrites an existing
* selection — in particular an upgrade keeps (and later resolves) whatever
* the user had picked, and a selection that vanished from the catalog falls
* back to the stock look on the browser side.
* @param path - active-state file path.
* @param find - whether the default id exists in the current catalog.
* @returns whether the seed wrote the selection.
*/
function seedDefaultActiveSkin(path, find) {
	const state = readActiveState(path);
	if (state.initialized || state.active !== null) return false;
	if (!find("blue-fantasy")) return false;
	writeActiveSelection(path, DEFAULT_SKIN_ID);
	return true;
}
//#endregion
//#region src/core/css-safety/errors.ts
/**
* CSS safety error types (lightningcss-free).
*
* The host half and the worker half must agree on what a failure means, but
* the host half may not import anything that reaches lightningcss (issue
* #98). These error classes therefore live in their own module: the worker
* raises them, the host re-raises them from the IPC answer, and the HTTP
* layer maps them (whitelist violation -> 422, overloaded -> 503, everything
* else -> 500).
* @module @linxin666/dsh-client-ui-skin-center/css-safety/errors
*/
/**
* The stable kind marker of a whitelist violation.
*
* The worker and the transform live in DIFFERENT bundles, so an
* `instanceof` check cannot see the same class identity. The kind marker is
* a plain string that both bundles agree on, which is what lets the worker
* tell a whitelist violation from any other error.
*/
const SKIN_CSS_SAFETY_ERROR_KIND = "SkinCssSafetyError";
/** Violation of the CSS whitelist. Always fatal (fail-closed). */
var SkinCssSafetyError = class extends Error {
	name = SKIN_CSS_SAFETY_ERROR_KIND;
	/** The stable marker the worker classifies on (bundle-independent). */
	kind = SKIN_CSS_SAFETY_ERROR_KIND;
	violations;
	constructor(message, violations) {
		super(message);
		this.violations = violations;
	}
};
/**
* The transform could not be produced at all: the worker crashed, the
* request timed out, or the pipeline was disposed. Distinct from a whitelist
* violation, which is a rejected stylesheet rather than a broken pipeline.
*/
var SkinCssTransformFailureError = class extends Error {
	name = "SkinCssTransformFailureError";
	/** The stable marker of this error family. */
	kind = "SkinCssTransformFailureError";
};
/**
* The pipeline already holds as many requests as it may. The request is
* refused immediately instead of waiting for a free slot.
*/
var SkinCssOverloadedError = class extends SkinCssTransformFailureError {
	name = "SkinCssOverloadedError";
	kind = "SkinCssOverloadedError";
};
/** The transform did not finish inside the per-request budget. */
var SkinCssTransformTimeoutError = class extends SkinCssTransformFailureError {
	name = "SkinCssTransformTimeoutError";
	kind = "SkinCssTransformTimeoutError";
};
/** The pipeline was disposed before the request could run. */
var SkinCssWorkerDisposedError = class extends SkinCssTransformFailureError {
	name = "SkinCssWorkerDisposedError";
	kind = "SkinCssWorkerDisposedError";
};
//#endregion
//#region src/core/css-safety/host-transform.ts
/**
* Host-side CSS safety scheduler (issue #98).
*
* The CSS safety pipeline needs lightningcss, whose Windows build ships a
* native addon. A top-level import in the host half maps that addon into the
* DSH host process, and Windows refuses to replace a mapped file: while the
* host holds the addon, `pnpm add` fails with ERR_PNPM_EPERM when it
* renames lightningcss-win32-x64-msvc.
*
* This module is the host half of the fix and never imports lightningcss.
* Every request is served by a short-lived worker process that is forked for
* that request alone, answers over IPC, and is terminated and awaited before
* the stylesheet response settles. The native addon therefore exists only
* inside the worker, and the host process holds no mapping at all.
*
* Rules:
*  - one worker at a time: the pipeline serializes requests, so the addon
*    exists in exactly one process at any moment;
*  - at most SKIN_CSS_MAX_OUTSTANDING requests are held at once, the active
*    one and every waiting one included; a request beyond that cap is
*    refused immediately with a typed overload error;
*  - every request carries a total budget (queue wait + transform +
*    settlement) of SKIN_CSS_REQUEST_TIMEOUT_MS, which also covers a worker
*    that answered but refuses to exit;
*  - a request settles only after its worker process has exited, and a
*    worker that cannot be killed still cannot make a request hang.
*
* Lifecycle: a scheduler belongs to ONE plugin mount. The mount creates it,
* injects its transform into the route factory and disposes it with the
* mount. A global singleton would be wrong here: the loader may mount a new
* instance while the old one is still tearing down, and the old mount's
* disposal must not disable the new mount.
*
* Residual window: while one transform runs, the worker holds the addon, so
* a package install in that exact window still sees a mapped addon. The
* window is one stylesheet transform long; the host process itself holds
* nothing.
* @module @linxin666/dsh-client-ui-skin-center/css-safety/host-transform
*/
/** Requests the pipeline holds at once, the active one included. */
const SKIN_CSS_MAX_OUTSTANDING = 8;
/** Total per-request budget in milliseconds (queue wait + transform + settlement). */
const SKIN_CSS_REQUEST_TIMEOUT_MS = 1e4;
/** How long a request may wait for a worker that refuses to die. */
const SKIN_CSS_FORCE_SETTLE_MS = 1500;
/** Worker bundle file name inside the package lib/ directory. */
const WORKER_FILE = "css-safety-worker.js";
/**
* The schedulers that currently hold a worker.
*
* The process exit hook is shared by all of them and installed only while
* at least one scheduler is live, so a remount never accumulates listeners.
*/
const liveSchedulers = /* @__PURE__ */ new Set();
let exitHookInstalled = false;
/** End every live worker's process when the host exits. */
function killLiveSchedulers() {
	for (const scheduler of liveSchedulers) scheduler.killActiveSync();
}
/** Register a scheduler and install the shared exit hook when it is the first. */
function registerScheduler(scheduler) {
	liveSchedulers.add(scheduler);
	if (exitHookInstalled) return;
	exitHookInstalled = true;
	process.on("exit", killLiveSchedulers);
}
/** Unregister a scheduler and drop the shared exit hook when the last one goes. */
function unregisterScheduler(scheduler) {
	liveSchedulers.delete(scheduler);
	if (liveSchedulers.size > 0 || !exitHookInstalled) return;
	exitHookInstalled = false;
	process.removeListener("exit", killLiveSchedulers);
}
/** Keep a pending timer from holding the host process open. */
function unrefTimer(timer) {
	timer.unref?.();
}
/**
* Locate the worker bundle.
*
* The worker is resolved from THIS module's URL, never from the process
* working directory: the host may run from anywhere (a profile directory, a
* service manager's cwd), and the worker must always be the sibling bundle
* of the skin-center package that asked for it.
* @returns the absolute path of the worker entry script.
*/
function resolveSkinCssWorkerPath() {
	const here = dirname(fileURLToPath(import.meta.url));
	const candidates = [join(here, WORKER_FILE), join(here, "..", "..", "..", "lib", WORKER_FILE)];
	for (const candidate of candidates) if (existsSync(candidate)) return candidate;
	throw new SkinCssTransformFailureError(`skin CSS safety worker not found (${WORKER_FILE} beside the skin-center module)`);
}
/**
* The request pipeline: fork a worker per request, serialize the work, and
* settle only after the worker process has exited.
*/
var SkinCssScheduler = class {
	workerPath;
	timeoutMs;
	maxOutstanding;
	forkImpl;
	pending = [];
	active = null;
	disposed = false;
	peakOutstanding = 0;
	rejected = 0;
	lastWorkerPid = null;
	lastWorkerExited = true;
	constructor(options = {}) {
		this.workerPath = options.workerPath ?? null;
		this.timeoutMs = options.timeoutMs ?? 1e4;
		this.maxOutstanding = options.maxOutstanding ?? 8;
		this.forkImpl = options.forkImpl ?? ((modulePath, forkOptions) => fork(modulePath, forkOptions));
	}
	/**
	* Transform one stylesheet through a short-lived worker process.
	* @param css - the raw stylesheet bytes.
	* @param options - the skin id, logical filename and fallback flag.
	* @returns the transformed stylesheet and the pipeline warnings.
	*/
	transform(css, options) {
		if (this.disposed) return Promise.reject(new SkinCssWorkerDisposedError("skin CSS safety worker was disposed"));
		if (this.heldCount() >= this.maxOutstanding) {
			this.rejected += 1;
			return Promise.reject(new SkinCssOverloadedError(`skin CSS safety pipeline is full (${this.maxOutstanding} requests held)`));
		}
		return new Promise((resolve, reject) => {
			const request = {
				css,
				options,
				resolve,
				reject,
				timer: null,
				settled: false
			};
			request.timer = setTimeout(() => {
				this.onTimeout(request);
			}, this.timeoutMs);
			unrefTimer(request.timer);
			this.pending.push(request);
			this.peakOutstanding = Math.max(this.peakOutstanding, this.heldCount());
			this.pump();
		});
	}
	/** Current pipeline counters. */
	stats() {
		return {
			active: this.active ? 1 : 0,
			pending: this.pending.length,
			held: this.heldCount(),
			maxOutstanding: this.maxOutstanding,
			rejected: this.rejected,
			peakOutstanding: this.peakOutstanding,
			lastWorkerPid: this.lastWorkerPid,
			lastWorkerExited: this.lastWorkerExited
		};
	}
	/**
	* Stop the pipeline: queued work is rejected, the running worker is
	* terminated and awaited, and no worker is left behind.
	* @returns a promise that resolves once the active worker has exited.
	*/
	async dispose() {
		if (this.disposed) return;
		this.disposed = true;
		const error = new SkinCssWorkerDisposedError("skin CSS safety worker was disposed");
		for (const request of this.pending.splice(0)) this.settle(request, error);
		const run = this.active;
		if (run) {
			run.disposed = true;
			this.terminate(run);
			await this.waitForExit(run);
			this.finish(run, error);
		}
		unregisterScheduler(this);
	}
	/** Terminate the running worker without waiting (process exit path). */
	killActiveSync() {
		if (this.active) this.terminate(this.active);
	}
	/** Requests the pipeline holds, the active one included. */
	heldCount() {
		return this.pending.length + (this.active ? 1 : 0);
	}
	/** Admit waiting requests and start the next worker when the pipeline is free. */
	pump() {
		if (this.disposed) return;
		while (this.active === null && this.pending.length > 0) {
			const request = this.pending.shift();
			this.start(request);
		}
	}
	/** Fork one worker for one request. */
	start(request) {
		let workerPath;
		try {
			workerPath = this.workerPath ?? resolveSkinCssWorkerPath();
		} catch (error) {
			this.settle(request, error);
			return;
		}
		let child;
		try {
			child = this.forkImpl(workerPath, {
				env: {
					...process.env,
					ELECTRON_RUN_AS_NODE: "1"
				},
				execArgv: [],
				stdio: [
					"ignore",
					"ignore",
					"inherit",
					"ipc"
				]
			});
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			this.settle(request, new SkinCssTransformFailureError(`skin CSS safety worker could not start: ${detail}`));
			return;
		}
		const run = {
			child,
			request,
			response: null,
			spawnError: null,
			timedOut: false,
			disposed: false,
			exited: false,
			finished: false,
			killTimer: null,
			forceTimer: null,
			exitWaiters: []
		};
		this.active = run;
		this.lastWorkerPid = child.pid ?? null;
		this.lastWorkerExited = false;
		registerScheduler(this);
		child.on("message", (message) => {
			this.onMessage(run, message);
		});
		child.on("error", (error) => {
			this.onError(run, error);
		});
		child.on("disconnect", () => {
			this.onDisconnect(run);
		});
		child.on("exit", () => {
			this.onExit(run);
		});
	}
	/** Handle one message from the worker. */
	onMessage(run, message) {
		if (message && message.type === "ready") {
			try {
				run.child.send({
					type: "transform",
					css: run.request.css,
					options: run.request.options
				});
			} catch (error) {
				run.spawnError = error instanceof Error ? error : new Error(String(error));
				this.terminate(run);
			}
			return;
		}
		run.response = message;
		this.terminate(run);
	}
	/**
	* The worker process failed.
	*
	* A spawn failure never produces an exit event, so the request must be
	* settled here; the pipeline advances at once.
	*/
	onError(run, error) {
		run.spawnError = error;
		if (run.child.pid === void 0) {
			this.finish(run, new SkinCssTransformFailureError(`skin CSS safety worker could not start: ${error.message}`));
			return;
		}
		this.terminate(run);
	}
	/** The worker lost its IPC channel; it cannot answer any more. */
	onDisconnect(run) {
		if (run.exited) return;
		this.terminate(run);
	}
	/** End the worker process if it is still running. */
	terminate(run) {
		if (run.exited) return;
		if (run.child.exitCode !== null || run.child.signalCode !== null) return;
		try {
			run.child.kill();
		} catch {}
		if (run.killTimer !== null) return;
		run.killTimer = setTimeout(() => {
			run.killTimer = null;
			if (run.exited) return;
			try {
				run.child.kill("SIGKILL");
			} catch {}
		}, 500);
		unrefTimer(run.killTimer);
	}
	/** The worker process exited: settle the request it served. */
	onExit(run) {
		run.exited = true;
		this.lastWorkerExited = true;
		for (const waiter of run.exitWaiters.splice(0)) waiter();
		if (run.disposed) {
			this.finish(run, new SkinCssWorkerDisposedError("skin CSS safety worker was disposed"));
			return;
		}
		if (run.timedOut) {
			this.finish(run, new SkinCssTransformTimeoutError(`skin CSS safety transform timed out after ${this.timeoutMs}ms`));
			return;
		}
		if (run.response === null) {
			const detail = run.spawnError?.message ?? "worker exited without a result";
			this.finish(run, new SkinCssTransformFailureError(`skin CSS safety worker failed: ${detail}`));
			return;
		}
		try {
			this.finish(run, void 0, this.toResult(run.response));
		} catch (error) {
			this.finish(run, error);
		}
	}
	/**
	* Close one run: clear its timers, settle its request and free the slot.
	* @param run - the finished run.
	* @param error - the failure to report, if any.
	* @param result - the transform result, if the run succeeded.
	*/
	finish(run, error, result) {
		if (run.finished) return;
		run.finished = true;
		if (run.killTimer !== null) {
			clearTimeout(run.killTimer);
			run.killTimer = null;
		}
		if (run.forceTimer !== null) {
			clearTimeout(run.forceTimer);
			run.forceTimer = null;
		}
		if (this.active === run) this.active = null;
		if (!run.request.settled) {
			if (error !== void 0) this.settle(run.request, error);
			else this.settle(run.request, void 0, result);
		}
		this.pump();
	}
	/** Map one worker answer onto the host contract. */
	toResult(response) {
		if (!response || typeof response !== "object") throw new SkinCssTransformFailureError("skin CSS safety worker sent a malformed answer");
		if (response.type === "result") return {
			code: response.code,
			warnings: response.warnings ?? []
		};
		if (response.type === "violation") throw new SkinCssSafetyError(response.message, response.violations ?? []);
		throw new SkinCssTransformFailureError(response.message);
	}
	/**
	* The request ran out of budget.
	*
	* The budget covers the whole request, including a worker that answered
	* but refuses to exit: the late answer is never turned into a result.
	*/
	onTimeout(request) {
		if (request.settled) return;
		const run = this.active;
		if (run && run.request === request) {
			if (run.timedOut) return;
			run.timedOut = true;
			this.terminate(run);
			run.forceTimer = setTimeout(() => {
				run.forceTimer = null;
				if (request.settled) return;
				this.settle(request, new SkinCssTransformTimeoutError(`skin CSS safety transform timed out after ${this.timeoutMs}ms`));
			}, SKIN_CSS_FORCE_SETTLE_MS);
			unrefTimer(run.forceTimer);
			return;
		}
		this.removeQueued(request);
		this.settle(request, new SkinCssTransformTimeoutError(`skin CSS safety transform timed out after ${this.timeoutMs}ms`));
		this.pump();
	}
	/** Remove a queued request from the pipeline. */
	removeQueued(request) {
		const index = this.pending.indexOf(request);
		if (index !== -1) this.pending.splice(index, 1);
	}
	/** Resolve or reject one request exactly once. */
	settle(request, error, result) {
		if (request.settled) return;
		request.settled = true;
		if (request.timer) {
			clearTimeout(request.timer);
			request.timer = null;
		}
		if (error !== void 0) request.reject(error);
		else request.resolve(result);
	}
	/**
	* Resolve once the worker process has exited, or after a bounded grace.
	* @param run - the run to wait for.
	* @returns a promise that resolves on the exit or after the grace.
	*/
	waitForExit(run) {
		if (run.exited) return Promise.resolve();
		return new Promise((resolve) => {
			let done = false;
			const settle = () => {
				if (done) return;
				done = true;
				clearTimeout(timer);
				resolve();
			};
			const timer = setTimeout(settle, SKIN_CSS_FORCE_SETTLE_MS);
			unrefTimer(timer);
			run.exitWaiters.push(settle);
		});
	}
};
/**
* The pipeline used when no scheduler was injected.
*
* It exists for direct callers of the route factory (tests, tools). A plugin
* mount creates its own scheduler instead, so a mount disposal can never
* disable another mount.
*/
let defaultScheduler = null;
/** The fallback transform used when the route factory gets no scheduler. */
function defaultSkinCssTransform(css, options) {
	defaultScheduler ??= new SkinCssScheduler();
	return defaultScheduler.transform(css, options);
}
//#endregion
//#region src/core/profile-plugin-probe.ts
/**
* Profile plugin probe: is one package installed in THIS profile?
*
* Two features of this package delegate a whole surface to another plugin and
* need the same answer before they can point the user at it — the Wallpaper
* Engine bridge handed wallpapers to `dsh-plugin-wallpaper-engine` (issue #39)
* and a delegated skin hands the page to the theme plugin that ships it (see
* ./delegated-skins.ts). The reads are identical, so they live here once and
* each caller keeps its own constants and report shape.
*
* Detection is best-effort by construction: the profile layout, a hand-edited
* patch file and a remote install all move under it, so every read is fenced
* and a missing or unreadable input simply means "not installed".
*
* Signals, any of which is enough:
*  - the profile manifest's dependencies name the package (npm/registry and
*    `link:` installs both land here);
*  - any patch layer reachable from the harness home carries a row naming the
*    package (the plugin-manager write, including rows the manifest no longer
*    backs).
*
* Nothing here writes. A probe that installs, disables or rewrites a plugin it
* does not own is not a probe.
* @module @linxin666/dsh-client-ui-skin-center/core/profile-plugin-probe
*/
/** Signal names, stable enough to assert on and to log. */
const SIGNAL_PROFILE_DEPENDENCY = "profile-dependency";
const SIGNAL_CORDIS_ROW = "cordis-row";
/**
* Read one file, or null when it is absent, a directory, or unreadable.
* @param path - absolute path to read.
* @returns the file's UTF-8 text, or null.
*/
function readIfFile(path) {
	try {
		if (!existsSync(path)) return null;
		if (!statSync(path).isFile()) return null;
		return readFileSync(path, "utf8");
	} catch {
		return null;
	}
}
/**
* Read one JSON file into an object, or null when it is absent or invalid.
* @param path - absolute path to read.
* @returns the parsed object, or null.
*/
function readJsonIfFile(path) {
	const text = readIfFile(path);
	if (text === null) return null;
	try {
		const parsed = JSON.parse(text);
		return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
/**
* Whether a package.json dependency map names one package.
*
* Matched by key only: a `link:`, a `file:`, a caret range and a bare tag all
* put the same key in the map, and the version range is not this probe's
* business.
* @param manifest - parsed profile package.json, or null.
* @param packageName - the package to look for.
* @returns true when any dependency section names the package.
*/
function manifestNamesPlugin(manifest, packageName) {
	if (manifest === null) return false;
	for (const section of [
		"dependencies",
		"devDependencies",
		"optionalDependencies",
		"peerDependencies"
	]) {
		const map = manifest[section];
		if (typeof map !== "object" || map === null || Array.isArray(map)) continue;
		if (Object.prototype.hasOwnProperty.call(map, packageName)) return true;
	}
	return false;
}
/**
* Whether a cordis patch layer activates a row naming one package.
*
* The row form is `name: '<package>'` under an insert list or an id-targeted
* override; both spell the same package string, so the probe looks for the
* package name as a quoted or bare scalar. A DISABLED row still means the
* plugin is installed and wired (the loader keeps it mounted as inactive),
* which is a real installation a caller must not offer to install again.
* @param patch - raw cordis.patch.yml text, or null.
* @param packageName - the package to look for.
* @returns true when the text names the package.
*/
function patchNamesPlugin(patch, packageName) {
	if (patch === null) return false;
	const pattern = new RegExp(`(^|[^a-z0-9._-])${packageName.replace(/\./g, "\\.")}([^a-z0-9._-]|$)`);
	return patch.split(/\r?\n/).some((line) => pattern.test(line.replace(/#.*$/, "")));
}
/**
* Resolve the files the probe reads for a harness home / profile pair. The
* profile patch comes first, then the harness-home patch layer, then the
* profile's own composition file, so an install written by any of the
* manager's paths is seen.
* @param options - explicit harness home / profile (tests), else the live layout.
* @returns the paths, whether or not they exist.
*/
function profilePluginPaths(options = {}) {
	const paths = resolveHarnessPaths(options.home, options.profile);
	const profileDir = join(paths.patchPath, "..");
	return {
		profileManifestPath: paths.profileManifestPath,
		patchPaths: [
			paths.patchPath,
			paths.legacyPatchPath,
			join(profileDir, "cordis.yml")
		],
		profileDir
	};
}
/**
* Probe this profile for one package.
*
* Never throws: an unreadable or missing input is "no signal" and the result
* simply says not installed. The probe only reads.
* @param packageName - the package to look for.
* @param options - explicit harness home / profile (tests), else the live layout.
* @returns whether the package is installed, and the signals that found it.
*/
function detectProfilePlugin(packageName, options = {}) {
	const signals = [];
	try {
		const paths = profilePluginPaths(options);
		if (manifestNamesPlugin(readJsonIfFile(paths.profileManifestPath), packageName)) signals.push(SIGNAL_PROFILE_DEPENDENCY);
		if (paths.patchPaths.some((path) => patchNamesPlugin(readIfFile(path), packageName))) signals.push(SIGNAL_CORDIS_ROW);
	} catch {}
	return {
		installed: signals.length > 0,
		signals
	};
}
/**
* Where an installed npm package's own files live under a profile root.
*
* A `link:` install resolves its realpath outside the profile tree, but the
* link itself stays inside `node_modules`, and reading through it follows the
* link — so one candidate covers npm, registry and link installs alike.
* @param profileDir - the active profile's root directory.
* @param packageName - the installed package.
* @returns the absolute package directory, whether or not it exists.
*/
function installedPackageDir(profileDir, packageName) {
	return join(profileDir, "node_modules", ...packageName.split("/"));
}
//#endregion
//#region src/external-wallpaper.ts
/**
* External Wallpaper Engine plugin probe (issue #39, migration round).
*
* Wallpaper support no longer ships inside the skin center: it is delegated to
* `dsh-plugin-wallpaper-engine`, which owns the WE library scan, the video /
* web / scene rendering paths, the wallpaper settings surface and the theme
* that follows the wallpaper. The skin center keeps only the skin side, and
* interoperates with that plugin through its public document marker
* `body[data-we-wallpaper]` (see
* src/client/runtime/external-wallpaper-engine.ts).
*
* This module is the READ-ONLY half of that relationship: it reports whether
* the external plugin is installed in this profile, so the card can point the
* user at it instead of offering a wallpaper feature of its own. It never
* installs, removes, disables or rewrites anything; installation is the user's,
* performed through the official plugin manager.
*
* The reads themselves are the shared profile probe
* (core/profile-plugin-probe.ts), which the delegated-skin registry asks the
* same questions. This file keeps the wallpaper-specific constants, the report
* shape, and the peer's own persisted selection read.
*
* That persisted read is the FIRST-SCREEN prediction (issue #51). The runtime
* withholds the skin off `body[data-we-wallpaper]`, which that plugin stamps
* from its own client chain a few hundred milliseconds into the boot - later
* than the browser's first paint, which the document itself decides. So the
* first screen would paint the skin and then cut to the wallpaper, and this
* package reads the peer's own persisted selection synchronously to pre-judge
* the first screen instead. The prediction is exactly that: the runtime still
* decides on the marker, and a prediction the peer never confirms costs one
* extra stylesheet fetch when the boot activation repaints the skin.
* @module @linxin666/dsh-client-ui-skin-center/external-wallpaper
*/
/** The delegated wallpaper plugin this package interoperates with. */
const EXTERNAL_WE_PLUGIN = "dsh-plugin-wallpaper-engine";
/** Upstream repository of the delegated plugin (install + docs pointer). */
const EXTERNAL_WE_REPO = "https://github.com/elysia395/dsh-wallpaper-engine";
/** The install command the card shows when the plugin is missing. */
const EXTERNAL_WE_INSTALL_COMMAND = "dsh plugin --profile web add " + EXTERNAL_WE_PLUGIN;
/**
* Probe this profile for the delegated Wallpaper Engine plugin.
*
* Never throws: an unreadable or missing input is "no signal" and the report
* simply says not installed. The probe only reads.
* @param options - explicit harness home / profile (tests), else the live layout.
* @returns the report the card and the API render.
*/
function detectExternalWallpaperEngine(options = {}) {
	const probe = detectProfilePlugin(EXTERNAL_WE_PLUGIN, options);
	return {
		installed: probe.installed,
		signals: probe.signals,
		packageName: EXTERNAL_WE_PLUGIN,
		repository: EXTERNAL_WE_REPO,
		installCommand: EXTERNAL_WE_INSTALL_COMMAND,
		npm: EXTERNAL_WE_PLUGIN
	};
}
/** The file that directory carries, where the peer persists its selection. */
const EXTERNAL_WE_CONFIG_FILE = "config.json";
/**
* The peer's data directory: its own `$DSH_WE_DATA_DIR` override when set, and
* the documented default under the user's home otherwise. The host file is the
* only source of truth for the selection; this override moves where it lives
* and changes nothing else.
* @param env - the environment to read (tests), else this process's.
* @returns an absolute directory path.
*/
function externalWallpaperDataDir(env = process.env) {
	return firstNonBlank(env["DSH_WE_DATA_DIR"]) ?? join(homedir(), ".dsh-wallpaper-engine");
}
/**
* The persisted-selection file the first-screen prediction reads.
* @param env - the environment to read (tests), else this process's.
* @returns an absolute file path, whether or not it exists.
*/
function externalWallpaperConfigPath(env = process.env) {
	return join(externalWallpaperDataDir(env), EXTERNAL_WE_CONFIG_FILE);
}
/**
* Whether the peer's persisted selection names a wallpaper (issue #51).
*
* `settings.id` is that plugin's stable contract: its host owns the file and
* writes the chosen wallpaper into it, so a non-empty id means the wallpaper is
* what the next page load is about to bring up. Reading it synchronously is
* what lets the first screen already be the wallpaper.
*
* This is a FIRST-SCREEN pre-judgment, not a second source of truth. The
* runtime still decides on `body[data-we-wallpaper]`, which is the live
* verdict, so a prediction the peer never confirms (a wallpaper that fails to
* render and takes its marker with it) costs one stylesheet fetch when the
* boot activation repaints the skin. It is therefore fail-OPEN toward the
* skin: an absent, unreadable or malformed file means "no wallpaper", never a
* reason to withhold the skin the user selected.
* @param env - the environment to read (tests), else this process's.
* @returns true when a wallpaper is persisted.
*/
function persistedExternalWallpaperActive(env = process.env) {
	try {
		const config = readJsonIfFile(externalWallpaperConfigPath(env));
		if (config === null) return false;
		const settings = config.settings;
		if (typeof settings !== "object" || settings === null || Array.isArray(settings)) return false;
		const id = settings.id;
		return typeof id === "string" && id.trim() !== "";
	} catch {
		return false;
	}
}
/** Every delegated skin this package knows. Order is the card's row order. */
const DELEGATED_SKINS = Object.freeze([{
	id: "claude-style",
	package: "dsh-claude-style",
	repository: "https://github.com/Nwflower/dsh-claude-style",
	installCommand: "dsh plugin --profile web add dsh-claude-style",
	bodyAttr: "data-dsh-claude-style",
	handoffAttr: "data-dsh-claude-style-handoff",
	wiringId: "ui-skin-claude-style",
	name: "Claude Code Style",
	nameEn: "Claude Code Style",
	tagline: "Claude Code Desktop theme, provided by the dsh-claude-style plugin",
	descriptionKey: "delegatedSkinDescriptionClaudeStyle",
	accent: "#d97757"
}]);
/**
* The delegated skin with this id, or null.
* @param id - a persisted selection value.
* @returns the descriptor, or null when the id is an asset skin or unknown.
*/
function findDelegatedSkin(id) {
	return DELEGATED_SKINS.find((skin) => skin.id === id) ?? null;
}
/** Whether this id names a delegated skin (an asset skin resolves to false). */
function isDelegatedSkinId(id) {
	return findDelegatedSkin(id) !== null;
}
/**
* Parse a delegated plugin's own descriptor file.
*
* The shape is the v1 delegated-skin manifest the peer already ships: an id, a
* package, the attribute it stamps, and the wiring row it inserts. Only the
* fields this package acts on are read, each one type-checked; anything else
* is ignored rather than rejected, because the file belongs to another package
* and this one must not become a second validator for it.
* @param input - the parsed JSON (or anything else).
* @returns the fields this package understands, or null when the core ones
*   are missing or of the wrong type.
*/
function parseDelegatedDescriptor(input) {
	if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
	const record = input;
	const id = record.id;
	const pkg = record.package;
	const bodyAttr = record.bodyAttr;
	if (typeof id !== "string" || id === "") return null;
	if (typeof pkg !== "string" || pkg === "") return null;
	if (typeof bodyAttr !== "string" || bodyAttr === "") return null;
	const wiring = record.wiring;
	return {
		id,
		package: pkg,
		bodyAttr,
		wiringId: typeof wiring === "object" && wiring !== null && !Array.isArray(wiring) && typeof wiring.id === "string" ? wiring.id : null
	};
}
/**
* Read a delegated package's own descriptor file from the installed tree.
* @param profileDir - the active profile's root directory.
* @param packageName - the installed package.
* @returns the parsed fields, or null when the file is absent or unreadable.
*/
function readInstalledDescriptor(profileDir, packageName) {
	const dir = installedPackageDir(profileDir, packageName);
	return parseDelegatedDescriptor(readJsonIfFile(join(dir, "skin.json")));
}
/**
* Build one catalog row per delegated skin.
*
* The row is built whether or not the plugin is installed: a listed row with
* installed=false is the install prompt, which is the whole point of a
* delegated skin. The descriptor comparison is advisory, a mismatch becomes a
* descriptorMatches=false the card can explain, and never a thrown error or a
* skipped row.
* @param deps - test seams; the live profile otherwise.
* @returns one row per registry entry, in registry order.
*/
function delegatedSkinRows(deps = {}) {
	const registry = deps.skins ?? DELEGATED_SKINS;
	let profileDir = null;
	try {
		profileDir = profilePluginPaths({
			home: deps.home,
			profile: deps.profile
		}).profileDir;
	} catch {
		profileDir = null;
	}
	return registry.map((descriptor) => {
		const probe = detectProfilePlugin(descriptor.package, {
			home: deps.home,
			profile: deps.profile
		});
		let descriptorMatches = null;
		if (probe.installed && profileDir !== null) {
			const installed = readInstalledDescriptor(profileDir, descriptor.package);
			descriptorMatches = installed === null ? null : installed.id === descriptor.id && installed.package === descriptor.package && installed.bodyAttr === descriptor.bodyAttr;
		}
		return {
			descriptor,
			installed: probe.installed,
			signals: probe.signals,
			descriptorMatches
		};
	});
}
//#endregion
//#region src/routes-v2.ts
/**
* Skin-center v2 HTTP routes (issue #506, M2) — the loading/serving half of
* the new architecture. Pure read-only asset serving plus the active-skin
* selection write; the actual switch happens browser-side (atomic swap, no
* reload, no cordis.patch.yml rewrite).
*
* Endpoints (all under /api/skin-center/v2):
*  - GET  /catalog                     catalog snapshot (installed skins + diagnostics)
*  - GET  /skins/<id>/stylesheet       transformed + scoped skin.css
*  - GET  /skins/<id>/patches          transformed + scoped patches.css (404 when absent)
*  - GET  /skins/<id>/hooks.mjs        the escape-hatch entry (404 when absent)
*  - GET  /skins/<id>/assets/<path>    static in-directory assets (incl. preview/)
*  - GET  /active                      the persisted active skin id + background preferences
*  - POST /active                      persist active id and/or background (same-origin fenced)
*  - GET  /external-wallpaper          whether the delegated WE plugin is installed (issue #39)
*
* The stylesheet/patches responses pass through the CSS safety pipeline
* (force-scoped under html[data-dsh-skin="<id>"], whitelist fail-closed), so
* the browser can inject them blindly. hooks.mjs is served verbatim — it is
* trusted, same-review same-release code (high sensitivity, see contracts/),
* served for built-in skins and for byte-verified official-market user
* installs, including exact reviewed legacy installs (issue #1073).
* @module @linxin666/dsh-client-ui-skin-center/routes-v2
*/
const SKIN_CENTER_V2_PREFIX = "/api/skin-center/v2";
const MIME = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".mp4": "video/mp4",
	".webm": "video/webm",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".json": "application/json; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8"
};
/**
* Whether a persisted selection still names something this package can show.
*
* Two kinds of selection exist: an asset skin in the catalog, and a delegated
* skin whose visual belongs to another plugin (core/delegated-skins.ts). The
* delegated ids come from this package's own registry rather than the catalog,
* so they resolve with or without that plugin installed: the row is the
* install prompt, and a selection that names it is the user having chosen it.
* Anything else is a selection whose files are gone, which resolves to the
* stock look instead of stranding the page on a missing id.
* @param catalog - the current catalog snapshot.
* @param id - a persisted selection value.
* @returns true when the selection can still be applied.
*/
function selectionResolves(catalog, id) {
	return findDelegatedSkin(id) !== null || findSkin(catalog, id) !== null;
}
function sendCss(res, status, code) {
	res.writeHead(status, {
		"content-type": "text/css; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(code);
}
/**
* Serve one manifest-referenced stylesheet through the safety pipeline.
*
* The transform runs in a short-lived worker process (issue #98), so this
* handler awaits it: the response is written only after the worker has
* answered and exited.
* @param res - the HTTP response.
* @param entry - the catalog row of the skin being served.
* @param relPath - the manifest-relative stylesheet path.
* @param filename - the logical filename used in pipeline diagnostics.
*/
async function serveStylesheet(res, entry, relPath, filename, transformCss) {
	const abs = resolveInsideSkin(entry, relPath);
	if (!abs || !existsSync(abs)) {
		writeJson(res, 404, {
			ok: false,
			error: "stylesheet-not-found"
		});
		return;
	}
	try {
		const { code } = await transformCss(readFileSync(abs, "utf8"), {
			skinId: entry.manifest.id,
			filename,
			deriveFallbacks: filename === "skin.css"
		});
		sendCss(res, 200, code);
	} catch (error) {
		if (error instanceof SkinCssSafetyError) {
			writeJson(res, 422, {
				ok: false,
				error: "css-whitelist-violation",
				violations: error.violations
			});
			return;
		}
		if (error instanceof SkinCssOverloadedError) {
			writeJson(res, 503, {
				ok: false,
				error: "css-transform-overloaded",
				detail: error?.message ?? String(error)
			});
			return;
		}
		writeJson(res, 500, {
			ok: false,
			error: "css-transform-failed",
			detail: error?.message ?? String(error)
		});
	}
}
/** Serve one static file from inside the skin directory (fail-closed). */
function serveAsset(req, res, entry, relPath) {
	const abs = resolveInsideSkin(entry, relPath);
	if (!abs || !existsSync(abs) || !statSync(abs).isFile()) {
		writeJson(res, 404, {
			ok: false,
			error: "asset-not-found"
		});
		return;
	}
	const mime = MIME[extname(abs).toLowerCase()] ?? "application/octet-stream";
	const body = readFileSync(abs);
	const size = body.length;
	const headers = {
		"content-type": mime,
		"cache-control": "no-store",
		"accept-ranges": "bytes"
	};
	const range = req.headers.range;
	if (range !== void 0) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
		let start = match?.[1] ? Number(match[1]) : 0;
		let end = match?.[2] ? Number(match[2]) : size - 1;
		if (match && !match[1] && match[2]) {
			start = Math.max(0, size - Number(match[2]));
			end = size - 1;
		}
		if (!match || !match[1] && !match[2] || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end || size === 0) {
			res.writeHead(416, {
				...headers,
				"content-range": `bytes */${size}`
			});
			res.end();
			return;
		}
		end = Math.min(end, size - 1);
		res.writeHead(206, {
			...headers,
			"content-range": `bytes ${start}-${end}/${size}`,
			"content-length": end - start + 1
		});
		res.end(body.subarray(start, end + 1));
		return;
	}
	res.writeHead(200, {
		...headers,
		"content-length": size
	});
	res.end(body);
}
/**
* Build the v2 route set. Registration is the caller's job (the host entry
* keeps the mount-once discipline).
*/
function makeSkinCenterV2Routes(deps = {}) {
	const loadCatalog = deps.loadCatalog ?? (() => loadSkinCatalog());
	const transformCss = deps.transformCss ?? defaultSkinCssTransform;
	const activeStatePath = deps.activeStatePath ?? defaultActiveStatePath();
	const shippedSet = (deps.shippedSkinIds ?? shippedSkinIds)();
	const listDelegatedSkins = deps.listDelegatedSkins ?? (() => delegatedSkinRows());
	/** One catalog row per delegated skin, shaped like an asset skin's. */
	const delegatedCatalogRows = () => listDelegatedSkins().map((row) => ({
		origin: "delegated",
		warnings: row.descriptorMatches === false ? ["delegated-descriptor-mismatch"] : [],
		manifest: {
			id: row.descriptor.id,
			name: row.descriptor.name,
			nameEn: row.descriptor.nameEn,
			tagline: row.descriptor.tagline,
			descriptionKey: row.descriptor.descriptionKey,
			accent: row.descriptor.accent,
			delegated: {
				package: row.descriptor.package,
				repository: row.descriptor.repository,
				installCommand: row.descriptor.installCommand,
				bodyAttr: row.descriptor.bodyAttr,
				handoffAttr: row.descriptor.handoffAttr,
				wiringId: row.descriptor.wiringId,
				installed: row.installed,
				signals: row.signals,
				descriptorMatches: row.descriptorMatches
			}
		}
	}));
	const catalogHandler = (_req, res) => {
		const catalog = loadCatalog();
		writeJson(res, 200, {
			ok: true,
			capturedAt: catalog.capturedAt,
			skins: [...catalog.skins.filter((s) => s.origin === "user" || shippedSet.has(s.manifest.id)).map((s) => ({
				origin: s.origin,
				warnings: s.warnings,
				manifest: s.manifest,
				channel: s.origin === "user" ? existsSync(join(s.dir, "dsh-market.provenance.json")) ? "market" : "unknown" : "npm"
			})), ...delegatedCatalogRows()],
			diagnostics: catalog.diagnostics
		});
	};
	const versionsHandler = async (_req, res) => {
		const catalog = loadCatalog();
		const { versions, error } = await fetchMarketVersions({ fetchImpl: deps.fetchImpl });
		if (error !== null) {
			writeJson(res, 200, {
				ok: false,
				error,
				rows: []
			});
			return;
		}
		const rows = planVersionRows(catalog, versions);
		writeJson(res, 200, {
			ok: true,
			rows,
			outdated: rows.filter((row) => row.outdated).length,
			total: rows.length
		});
	};
	const detectExternalWallpaper = deps.detectExternalWallpaper ?? (() => detectExternalWallpaperEngine());
	const externalWallpaperHandler = (_req, res) => {
		writeJson(res, 200, {
			ok: true,
			...detectExternalWallpaper()
		});
	};
	const verifyHandler = async (req, res) => {
		if (!requireSameOrigin(req, res)) return;
		if (req.method !== "POST") {
			writeJson(res, 405, {
				ok: false,
				error: "method-not-allowed"
			});
			return;
		}
		let body = null;
		try {
			body = await readJsonBody(req, { maxBytes: 16384 });
		} catch {
			body = null;
		}
		const autoRepair = body?.autoRepair !== false;
		writeJson(res, 200, {
			ok: true,
			...await verifyAndRepairAllSkins(loadCatalog, {
				userDir: deps.userDir,
				fetchImpl: deps.fetchImpl,
				localSourceDir: deps.localSourceDir,
				autoRepair
			})
		});
	};
	const skinPrefix = `${SKIN_CENTER_V2_PREFIX}/skins/`;
	const skinsHandler = async (req, res) => {
		const [id, ...tail] = new URL(req.url ?? "/", "http://localhost").pathname.slice(skinPrefix.length).split("/");
		const sub = tail.join("/");
		const catalog = loadCatalog();
		const entry = id ? findSkin(catalog, id) : null;
		if (sub === "uninstall") {
			if (!requireSameOrigin(req, res)) return;
			if (req.method !== "POST") {
				writeJson(res, 405, {
					ok: false,
					error: "method-not-allowed"
				});
				return;
			}
			if (!entry) {
				writeJson(res, 404, {
					ok: false,
					error: "skin-not-found"
				});
				return;
			}
			if (entry.origin === "builtin") {
				writeJson(res, 400, {
					ok: false,
					error: "cannot-uninstall-builtin"
				});
				return;
			}
			const uninstallRes = uninstallUserSkin(id, { userDir: deps.userDir ?? (entry.dir ? dirname(entry.dir) : void 0) });
			if (!uninstallRes.ok) {
				writeJson(res, uninstallRes.error === "skin-not-found" ? 404 : 500, {
					ok: false,
					error: uninstallRes.error,
					detail: uninstallRes.detail
				});
				return;
			}
			if (readActiveState(activeStatePath).active === id) writeActiveState(activeStatePath, { active: null });
			writeJson(res, 200, {
				ok: true,
				id
			});
			return;
		}
		if (sub === "repair") {
			if (!requireSameOrigin(req, res)) return;
			if (req.method !== "POST") {
				writeJson(res, 405, {
					ok: false,
					error: "method-not-allowed"
				});
				return;
			}
			if (!entry) {
				writeJson(res, 404, {
					ok: false,
					error: "skin-not-found"
				});
				return;
			}
			if (entry.origin === "builtin") {
				writeJson(res, 400, {
					ok: false,
					error: "cannot-repair-builtin"
				});
				return;
			}
			const repairRes = await repairSkin(id, {
				userDir: deps.userDir ?? (entry.dir ? dirname(entry.dir) : void 0),
				fetchImpl: deps.fetchImpl,
				localSourceDir: deps.localSourceDir
			});
			writeJson(res, repairRes.ok ? 200 : 500, repairRes);
			return;
		}
		if (!entry) {
			writeJson(res, 404, {
				ok: false,
				error: "skin-not-found"
			});
			return;
		}
		if (sub === "stylesheet") {
			await serveStylesheet(res, entry, entry.manifest.contributes.stylesheet, "skin.css", transformCss);
			return;
		}
		if (sub === "patches") {
			const patches = entry.manifest.contributes.patches;
			if (!patches) {
				writeJson(res, 404, {
					ok: false,
					error: "no-patches"
				});
				return;
			}
			await serveStylesheet(res, entry, patches, "patches.css", transformCss);
			return;
		}
		if (sub === "hooks.mjs") {
			const facet = entry.manifest.facets?.client;
			if (!facet) {
				writeJson(res, 404, {
					ok: false,
					error: "no-hooks"
				});
				return;
			}
			if (!canServeSkinHooks(entry)) {
				writeJson(res, 403, {
					ok: false,
					error: "hooks-require-review",
					origin: entry.origin
				});
				return;
			}
			const abs = resolveInsideSkin(entry, facet.entry);
			if (!abs || !existsSync(abs)) {
				writeJson(res, 404, {
					ok: false,
					error: "hooks-not-found"
				});
				return;
			}
			res.writeHead(200, {
				"content-type": "text/javascript; charset=utf-8",
				"cache-control": "no-store"
			});
			res.end(readFileSync(abs));
			return;
		}
		if (sub.startsWith("assets/") || sub.startsWith("preview/")) {
			serveAsset(req, res, entry, sub);
			return;
		}
		writeJson(res, 404, {
			ok: false,
			error: "unknown-skin-resource"
		});
	};
	const activeGetHandler = (_req, res) => {
		const state = readActiveState(activeStatePath);
		const catalog = loadCatalog();
		writeJson(res, 200, {
			ok: true,
			active: state.active !== null && !selectionResolves(catalog, state.active) ? null : state.active,
			background: state.background
		});
	};
	const activePostHandler = async (req, res) => {
		if (!requireSameOrigin(req, res)) return;
		let body;
		try {
			body = await readJsonBody(req, { maxBytes: 16384 });
		} catch {
			writeJson(res, 400, {
				ok: false,
				error: "invalid-body"
			});
			return;
		}
		if (body === null) {
			writeJson(res, 400, {
				ok: false,
				error: "invalid-body"
			});
			return;
		}
		const hasActive = typeof body === "object" && body !== null && "active" in body;
		const hasBackground = typeof body === "object" && body !== null && "background" in body;
		if (!hasActive && !hasBackground) {
			writeJson(res, 400, {
				ok: false,
				error: "nothing-to-update"
			});
			return;
		}
		const active = body.active;
		if (hasActive && active !== null && typeof active !== "string") {
			writeJson(res, 400, {
				ok: false,
				error: "active-must-be-string-or-null"
			});
			return;
		}
		if (typeof active === "string" && !selectionResolves(loadCatalog(), active)) {
			writeJson(res, 404, {
				ok: false,
				error: "skin-not-found"
			});
			return;
		}
		const update = {};
		if (hasActive) update.active = active;
		if (hasBackground) {
			const background = sanitizeSkinBackground(body.background);
			if (background === null) {
				writeJson(res, 400, {
					ok: false,
					error: "invalid-background"
				});
				return;
			}
			update.background = background;
		}
		writeActiveState(activeStatePath, update);
		const state = readActiveState(activeStatePath);
		writeJson(res, 200, {
			ok: true,
			active: state.active,
			background: state.background
		});
	};
	return [
		{
			kind: "exact",
			path: `${SKIN_CENTER_V2_PREFIX}/catalog`,
			handler: catalogHandler
		},
		{
			kind: "exact",
			path: `${SKIN_CENTER_V2_PREFIX}/external-wallpaper`,
			handler: externalWallpaperHandler
		},
		{
			kind: "exact",
			path: `${SKIN_CENTER_V2_PREFIX}/verify`,
			handler: verifyHandler
		},
		{
			kind: "exact",
			path: `${SKIN_CENTER_V2_PREFIX}/skins/versions`,
			handler: versionsHandler
		},
		{
			kind: "prefix",
			path: skinPrefix.replace(/\/$/, ""),
			handler: skinsHandler
		},
		{
			kind: "exact",
			path: `${SKIN_CENTER_V2_PREFIX}/active`,
			handler: (req, res) => {
				if (req.method === "GET") return activeGetHandler(req, res);
				if (req.method === "POST") return activePostHandler(req, res);
				writeJson(res, 405, {
					ok: false,
					error: "method-not-allowed"
				});
			}
		}
	];
}
//#endregion
//#region src/core/wallpaper-handoff.ts
/**
* First-screen handoff contract with the delegated wallpaper plugin (issue #51).
*
* The browser's first paint is decided by the delivered document, and the
* delegated plugin's `body[data-we-wallpaper]` marker only exists after its
* own client chain has run. The host half therefore withholds the skin from
* the document when the peer's persisted selection names a wallpaper, and
* stamps this attribute so the browser half knows the withholding was a
* PREDICTION rather than an observed verdict.
*
* The attribute is a first-screen prediction, never a verdict: it stands down
* the skin for the window in which the peer's marker is expected to arrive, and
* then expires on its own (see
* src/client/runtime/external-wallpaper-engine.ts). The marker remains the only
* thing that decides the page once the peer has spoken.
*
* Shared by both halves of this package (host stamps it, browser reads it), so
* it lives in `core/` rather than in either runtime.
* @module @linxin666/dsh-client-ui-skin-center/core/wallpaper-handoff
*/
/**
* The `<html>` attribute the host stamps when it withheld the skin from a
* document because the delegated wallpaper plugin's persisted selection says a
* wallpaper is about to render. Presence means "the skin is withheld for a
* predicted wallpaper"; the value carries nothing.
*/
const WALLPAPER_EXPECTED_ATTR = "data-dsh-wallpaper-expected";
//#endregion
//#region src/tap-index-adapter.ts
const HTML_TAG = /<html(\s[^>]*)?>/i;
const HEAD_CLOSE = /<\/head>/i;
const SKIN_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Stamp or replace an attribute on the <html> tag. */
function stampHtmlAttribute(html, name, value) {
	return html.replace(HTML_TAG, (match, attrs) => {
		const rest = attrs ?? "";
		const quoted = ` ${name}="${value}"`;
		if (new RegExp(`\\s${name}=`).test(rest)) return match.replace(new RegExp(`\\s${name}=("[^"]*"|'[^']*'|[^\\s>]+)`), quoted);
		return `<html${rest}${quoted}>`;
	});
}
/**
* Mark a document as withheld for a PREDICTED wallpaper (issue #51).
*
* The withheld document alone is not enough: the browser half boots
* asynchronously and recovers the selection from GET /active, so without this
* mark its first activation would paint the very frame the host declined to
* deliver. The mark is what tells that switch to stand down, and the browser
* half releases it once the peer's marker answers.
* @param html - the document about to be served.
* @returns the document with the prediction attribute on <html>.
*/
function stampWallpaperExpected(html) {
	return stampHtmlAttribute(html, WALLPAPER_EXPECTED_ATTR, "");
}
/** Stamp or replace data-dsh-skin on the <html> tag. */
function stampSkinAttribute(html, skinId) {
	return html.replace(HTML_TAG, (match, attrs) => {
		const rest = attrs ?? "";
		if (/\sdata-dsh-skin=/.test(rest)) return match.replace(/\sdata-dsh-skin=("[^"]*"|'[^']*'|[^\s>]+)/, ` data-dsh-skin="${skinId}"`);
		return `<html${rest} data-dsh-skin="${skinId}">`;
	});
}
/** Build the link tags injected before </head>. */
function skinLinkTags(skinId, hasPatches) {
	if (!SKIN_ID.test(skinId)) throw new TypeError(`invalid skin id: ${skinId}`);
	const base = `${SKIN_CENTER_V2_PREFIX}/skins/${skinId}`;
	const links = [`<link rel="stylesheet" href="${base}/stylesheet" data-dsh-skin-link="stylesheet">`];
	if (hasPatches) links.push(`<link rel="stylesheet" href="${base}/patches" data-dsh-skin-link="patches">`);
	return links.join("");
}
/** Build the structured rows collected fresh for every index render. */
function makeSkinIndexRows(deps) {
	const loadCatalog = deps.loadCatalog ?? (() => loadSkinCatalog());
	const warn = deps.warn ?? ((message) => console.warn(`[skin-center] ${message}`));
	const wallpaperOnStage = deps.readWallpaperOnStage ?? (() => false);
	const warned = /* @__PURE__ */ new Set();
	const warnOnce = (reason, message) => {
		if (warned.has(reason)) return;
		warned.add(reason);
		warn(message);
	};
	return () => {
		try {
			const active = deps.readActiveId();
			if (!active) return [];
			if (isDelegatedSkinId(active)) return [];
			if (wallpaperOnStage()) return [];
			const entry = findSkin(loadCatalog(), active);
			if (!entry) {
				warnOnce(`missing:${active}`, `active skin "${active}" not in catalog; serving stock look`);
				return [];
			}
			return [{
				kind: "html",
				placement: "head",
				html: skinLinkTags(active, entry.manifest.contributes.patches !== void 0)
			}];
		} catch (error) {
			warnOnce("row-error", `skin index rows failed closed: ${error?.message ?? error}`);
			return [];
		}
	};
}
/**
* Create the raw index tap. Structured rows run before it on DSH 0.1.1; when
* their marker is present the tap only stamps the html element. Without the
* marker it also injects links, preserving fail-closed behavior on older hosts.
*/
function makeSkinIndexTap(deps) {
	const loadCatalog = deps.loadCatalog ?? (() => loadSkinCatalog());
	const warn = deps.warn ?? ((message) => console.warn(`[skin-center] ${message}`));
	const wallpaperOnStage = deps.readWallpaperOnStage ?? (() => false);
	const warned = /* @__PURE__ */ new Set();
	const warnOnce = (reason, message) => {
		if (warned.has(reason)) return;
		warned.add(reason);
		warn(message);
	};
	return (html) => {
		try {
			const active = deps.readActiveId();
			if (!active) return html;
			if (isDelegatedSkinId(active)) return html;
			if (wallpaperOnStage()) return stampWallpaperExpected(html);
			const entry = findSkin(loadCatalog(), active);
			if (!entry) {
				warnOnce(`missing:${active}`, `active skin "${active}" not in catalog; serving stock look`);
				return html;
			}
			if (!HTML_TAG.test(html) || !HEAD_CLOSE.test(html)) {
				warnOnce("malformed-html", "index.html has no <html>/</head> anchors; skipping skin injection");
				return html;
			}
			const stamped = stampSkinAttribute(html, active);
			if (stamped.includes("data-dsh-skin-link=")) return stamped;
			const links = skinLinkTags(active, entry.manifest.contributes.patches !== void 0);
			return stamped.replace(HEAD_CLOSE, `${links}</head>`);
		} catch (error) {
			warnOnce("tap-error", `skin index tap failed closed: ${error?.message ?? error}`);
			return html;
		}
	};
}
//#endregion
//#region src/background-migration.ts
/**
* One-shot background-preference migration (issue #996): the
* `skin-background` settings namespace used to be the only store, but the
* remote pairing channel fences settings.* as loopback-only, so paired
* desktops read defaults and dropped writes. The values now live in the v2
* active-state document; on boot the host copies a customized legacy section
* into it exactly once (later boots see the background key and stop). The
* legacy namespace stays registered as the official settings page's input
* face — the browser half keeps listening to it and forwards page edits into
* the v2 store.
*
* "Customized" means at least one field departs from its schema default:
* resolved settings always carry defaults, so a never-touched section is
* indistinguishable from an explicit all-defaults section — migrating either
* is a no-op in behavior, and skipping both keeps the state document clean.
* Never throws: a failed migration leaves both stores untouched.
* @module @linxin666/dsh-client-ui-skin-center/background-migration
*/
/**
* Run the one-shot migration. Idempotent: once the v2 state carries a
* background section this is a silent no-op.
* @param options.activeStatePath - the v2 state document location.
* @param options.readSettings - thunk resolving the legacy settings section.
*/
function migrateBackgroundFromSettings(options) {
	const notes = [];
	const result = {
		migrated: false,
		notes
	};
	try {
		if (readActiveState(options.activeStatePath).background !== null) return result;
		const legacy = normalizeSkinBackground(options.readSettings());
		if (!hasCustomSkinBackground(legacy)) return result;
		writeActiveState(options.activeStatePath, { background: legacy });
		result.migrated = true;
		notes.push("migrated the skin-background settings section into the v2 active state");
		return result;
	} catch (error) {
		notes.push(`background migration failed closed: ${error?.message ?? error}`);
		return result;
	}
}
//#endregion
//#region src/legacy-bridge.ts
/**
* Legacy bridge (issue #506, migration path): ONE-SHOT, THIN. On the first
* v2 boot it reads the retired dsh-skin machinery's state — the
* "dsh-skin managed" section of the harness home cordis.patch.yml (where the
* v1 CLI wrote it; issue #788) with the active profile's cordis.patch.yml
* probed as a secondary location — migrates the active skin id into the v2
* selection store (skin-center-active.json), and strips the managed/legacy
* skin rows so the config watcher's next reload boots without the old
* bundle. No old runtime is kept: after the migration the managed section
* is gone for good.
*
* Reading the active id without the retired registry:
*  1. an insert row naming a dsh-client-ui-skin-<id> package → that id;
*  2. otherwise, with the v2 catalog as the known-id universe: the known id
*     whose ui-skin-<id> row is NOT disabled inside the managed section
*     (bundle-wired active skins carried no row of their own);
*  3. a managed section disabling everything (or no section at all) → stock.
* @module @linxin666/dsh-client-ui-skin-center/legacy-bridge
*/
/**
* Atomic replace: write a sibling temp file then rename over the target, so
* a crash mid-write can never leave a half-written boot patch and the config
* watcher only ever sees complete content (ported from the retired
* skin-switch.ts).
*/
function writePatchAtomic(filePath, next) {
	const dir = dirname(filePath);
	mkdirSync(dir, { recursive: true });
	let previousMode;
	try {
		previousMode = statSync(filePath).mode & 511;
	} catch {
		previousMode = void 0;
	}
	const tmpDir = mkdtempSync(join(dir, `${basename(filePath)}.tmp-`));
	const tmp = join(tmpDir, basename(filePath));
	try {
		writeFileSync(tmp, next, { flag: "wx" });
		chmodSync(tmp, previousMode ?? 384);
		renameSync(tmp, filePath);
	} catch (error) {
		try {
			rmSync(tmpDir, {
				recursive: true,
				force: true
			});
		} catch {}
		throw error;
	}
	try {
		rmSync(tmpDir, {
			recursive: true,
			force: true
		});
	} catch {}
}
const MANAGED_START = "# --- dsh-skin managed (auto-generated; do not edit) ---";
const MANAGED_END = "# --- end dsh-skin managed ---";
/**
* Remove every managed skin section (issue #676: a second stray section kept
* hasLegacyState true and re-ran the migration on each boot). Throws on an
* unterminated section (a malformed boot patch must fail loudly, never be
* silently half-written).
*/
function stripManaged(patch) {
	let out = patch;
	while (true) {
		const start = out.indexOf(MANAGED_START);
		if (start === -1) return out;
		const end = out.indexOf(MANAGED_END, start);
		if (end === -1) throw new Error("managed skin section is unterminated; fix the harness cordis.patch.yml");
		out = out.slice(0, start) + out.slice(end + 30);
	}
}
/** Remove - insert: items left with no - id: rows after legacy cleanup. */
function dropEmptyInserts(text) {
	const lines = text.split("\n");
	const out = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();
		if (/^-\s*insert:\s*(?:\[\s*\])?\s*$/.exec(trimmed) === null) {
			out.push(line);
			i += 1;
			continue;
		}
		const indent = line.length - trimmed.length;
		let j = i + 1;
		let hasRow = false;
		while (j < lines.length) {
			const t = lines[j].trim();
			if (t === "") {
				j += 1;
				continue;
			}
			if (lines[j].length - t.length <= indent) break;
			if (!t.startsWith("#") && /^- id:/.test(t)) hasRow = true;
			j += 1;
		}
		if (hasRow) for (let k = i; k < j; k += 1) out.push(lines[k]);
		i = j;
	}
	return out.join("\n");
}
/**
* Drop legacy hand-written skin insert rows (and their touch comments).
* Id-target rows (- id: ui-skin-x + disabled: true, no name: line) carry the
* mutual-exclusion wiring and are removed by stripManaged together with the
* section; stragglers outside the section are dropped here only when they
* are insert rows (a name: line directly below).
*
* A row is removed as a whole block, never as its first two lines (issue
* #1719): the host's plugin managers and the config editor write `{ id, name,
* disabled }` and `{ id, name, config }` rows, so a trailing continuation line
* left behind would merge into the entry above and duplicate its key — the
* resulting `cordis.patch.yml` parses as "Map keys must be unique" and the next
* boot dies. The block runs while lines are indented deeper than the `- id:`
* line, or blank inside the row.
*/
function stripLegacySkinRows(patch) {
	const lines = patch.split(/\r?\n/);
	const kept = [];
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const idMatch = /^(\s*)- id:\s*(ui-skin-[a-z0-9-]+)\s*$/.exec(line);
		if (idMatch !== null) {
			const next = lines[i + 1];
			if ((next === void 0 ? null : /^\s*name:\s*['"]?@[a-z0-9][a-z0-9._-]*\/dsh-client-ui-skin-(?!center['"]?\s*$)[^'"]*['"]?\s*$/.exec(next)) !== null) {
				if (i > 0 && /^\s*#[^\n]*$/.test(lines[i - 1]) && kept[kept.length - 1] === lines[i - 1]) kept.pop();
				const indent = idMatch[1].length;
				i += 1;
				while (i + 1 < lines.length) {
					let next = i + 1;
					while (next < lines.length && lines[next].trim() === "") next += 1;
					if (next >= lines.length) break;
					const candidate = lines[next];
					if (candidate.length - candidate.trimStart().length <= indent) break;
					i = next;
				}
				continue;
			}
		}
		kept.push(line);
	}
	let text = kept.join("\n").replace(/^# \(touch\)[^\n]*\n?/gm, "");
	text = dropEmptyInserts(text);
	return text.replace(/\n{3,}/g, "\n\n");
}
/** Drop bare top-level empty flow lists left by the stock profile template. */
function stripEmptyPatchList(patch) {
	return patch.replace(/^[ \t]*\[\s*\][ \t]*\r?\n?/gm, "");
}
/** Full legacy cleanup: managed section + insert rows + empty flow list. */
function stripLegacySkinState(patch) {
	return stripEmptyPatchList(stripLegacySkinRows(stripManaged(patch)));
}
/**
* Read the active legacy skin id from a patch text.
* @param patch - raw cordis.patch.yml text.
* @param knownIds - the v2 catalog's known skin ids (bundle-wired detection).
*/
function readLegacyActiveId(patch, knownIds) {
	for (const m of patch.matchAll(/name:\s*['"]?@linxin666\/dsh-client-ui-skin-([a-z0-9-]+)['"]?/g)) if (m[1] !== "center") return m[1];
	if (!patch.includes("# --- dsh-skin managed (auto-generated; do not edit) ---")) return null;
	const disabled = /* @__PURE__ */ new Set();
	for (const m of patch.matchAll(/^- id: (ui-skin-[a-z0-9-]+)\r?\n  disabled: true/gm)) disabled.add(m[1].replace("ui-skin-", ""));
	const candidates = knownIds.filter((id) => !disabled.has(id));
	return candidates.length === 1 ? candidates[0] : null;
}
/**
* Candidate patch paths, harness home first (issue #788): the v1 dsh-skin
* CLI wrote its managed section into the home cordis.patch.yml, not the
* active profile's. An explicit override (test seam) stays single-path.
*/
function candidatePatchPaths(options) {
	if (options.patchPath !== void 0) return [options.patchPath];
	const paths = resolveHarnessPaths();
	return [paths.legacyPatchPath, paths.patchPath];
}
/**
* Run the one-shot migration. Idempotent: once the v2 selection file exists
* and the patch carries no managed section, this is a no-op. Never throws —
* a failed migration leaves the legacy state untouched (the old mechanism
* still works until M4 removes it) and reports via notes.
*/
function migrateLegacySelection(options) {
	const notes = [];
	const result = {
		migrated: null,
		patchCleaned: false,
		failed: false,
		notes
	};
	try {
		let sawLegacyState = false;
		let readablePatch = false;
		let idMigrationDone = false;
		for (const patchPath of candidatePatchPaths(options)) {
			let patch;
			try {
				patch = readFileSync(patchPath, "utf8");
				readablePatch = true;
			} catch {
				continue;
			}
			if (!(patch.includes("# --- dsh-skin managed (auto-generated; do not edit) ---") || /name:\s*['"]?@linxin666\/dsh-client-ui-skin-/.test(patch))) continue;
			sawLegacyState = true;
			if (!idMigrationDone) {
				if (readActiveSelection(options.activeStatePath) !== null) notes.push("v2 selection already present; skipped id migration");
				else {
					const active = readLegacyActiveId(patch, options.knownIds);
					if (active !== null) {
						writeActiveSelection(options.activeStatePath, active);
						result.migrated = active;
						notes.push(`migrated active skin "${active}" to the v2 selection store`);
					} else notes.push("legacy state resolves to the stock look; selection store left unset");
				}
				idMigrationDone = true;
			}
			let cleaned = stripLegacySkinState(patch);
			if (cleaned.split(/\r?\n/).every((line) => line.trim() === "" || line.trimStart().startsWith("#"))) cleaned = "[]\n";
			if (cleaned !== patch) {
				(options.writePatch ?? writePatchAtomic)(patchPath, cleaned);
				result.patchCleaned = true;
				notes.push("stripped the legacy managed skin rows from cordis.patch.yml");
			}
		}
		if (!sawLegacyState) notes.push(readablePatch ? "no legacy managed skin state; nothing to migrate" : "no readable cordis.patch.yml; nothing to migrate");
		return result;
	} catch (error) {
		result.failed = true;
		notes.push(`legacy migration failed closed: ${error?.message ?? error}`);
		return result;
	}
}
//#endregion
//#region src/mount-once.ts
/**
* Host single-instance guard shared by the plugin family. The family bundle
* (dsh-web-all / dsh-skins) namespaces every child row id (web-ui-*), so
* the loader accepts a standalone install of the same package side by side;
* without this guard the second instance would still re-register the same
* webserver routes, tools, settings namespaces, and system-prompt sections
* and fail the boot. mountOnce makes a mount of an already-mounted package a
* no-op for as long as the first instance lives (the browser half is already
* deduped by package name in the client module host).
*
* A no-op is only safe while the holder is ALIVE. The holder can be disposed
* long after the refused mount ran its course: the Host reloads a profile by
* creating the new loader entries before the old ones are torn down (a
* plugin-manager enable/disable/install write, a settings-driven row reload,
* HMR), so the new aggregate shell entry mounts its family plugin while the
* previous entry still owns the name. Dropping that refused mount lost the
* plugin for good - the previous entry then disposed its own mount, releasing
* the name with nobody left to take it, and the family row stayed listed as
* active while its host routes 404ed (the task-board panel showed
* "board.hostError.notMounted", no degraded record appeared, and only a Host
* restart recovered it).
*
* The refused mount is therefore QUEUED, not dropped, and replayed the moment
* the holder releases the name - if the waiting fiber is still alive then. The
* single-instance guarantee is unchanged: exactly one mount is live per
* package name, and the replay re-enters the guard so a later mount still
* dedupes against it.
*
* The registry rides a global symbol so two module instances of the same
* package (npm copy vs repository link) still share one verdict. That symbol
* is a CROSS-REPOSITORY contract, not this file's private state: the four
* satellite packages (dsh-skins / dsh-pet / dsh-presets /
* dsh-community-plugins) are separate repositories carrying their own copy of
* this guard, rebuilt on their own schedule, so the value under `MOUNTED`
* must keep the shape every published copy reads (a `Set` of package names
* with `has`/`add`/`delete`). The wait queues this guard added therefore live
* under their own additive key, and the registry reads back a `Set` even when
* some other build left a different value there. Changing `MOUNTED`'s shape
* in place broke that contract once: a satellite's legacy copy created a
* `Set`, the family's new copy read it as a `Map`, and every family row
* mounted after it failed with "claims.get is not a function".
*
* cordis `ctx.effect` runs its callback immediately and treats the callback's
* return value as the fiber disposer, so the unmarker is returned, not run.
*/
/** Published cross-repository contract: package names currently mounted. */
const MOUNTED = Symbol.for("dsh-web.mounted-plugins");
/** Additive key this guard owns: refused mounts waiting for the name. */
const WAITERS = Symbol.for("dsh-web.mounted-plugins.waiters");
/**
* The shared name registry, always a `Set` whatever another build stored here:
* a foreign value (an interim shape, a hand-written global) must not take every
* family plugin down with it.
* @returns the process-wide set of mounted package names.
*/
function mountedSet() {
	const registry = globalThis;
	const existing = registry[MOUNTED];
	if (existing instanceof Set) return existing;
	const created = /* @__PURE__ */ new Set();
	registry[MOUNTED] = created;
	return created;
}
/** Queue per package name for mounts refused while a holder was alive. */
function mountWaiters() {
	const registry = globalThis;
	return registry[WAITERS] ??= /* @__PURE__ */ new Map();
}
/**
* Wrap a cordis plugin apply so the package runs at most once per process.
* The first mount registers normally and releases the name when its fiber
* disposes; a mount refused while that name is held waits for the release and
* then runs, unless its own fiber disposes first.
* @param packageName - npm package identity shared by every install source.
* @param fn - the original plugin apply.
* @returns an apply of the same shape.
*/
function mountOnce(packageName, fn) {
	const mount = (...args) => {
		const mounted = mountedSet();
		const ctx = args[0];
		if (mounted.has(packageName)) {
			const waiters = mountWaiters();
			const queue = waiters.get(packageName) ?? [];
			let alive = true;
			const pending = { run: () => {
				if (alive) mount(...args);
			} };
			ctx?.effect?.(() => () => {
				alive = false;
				const index = queue.indexOf(pending);
				if (index >= 0) queue.splice(index, 1);
			});
			queue.push(pending);
			waiters.set(packageName, queue);
			return;
		}
		mounted.add(packageName);
		ctx?.effect?.(() => () => {
			mounted.delete(packageName);
			const waiters = mountWaiters();
			const queue = waiters.get(packageName);
			if (queue === void 0) return;
			waiters.delete(packageName);
			for (const waiter of queue.splice(0)) queueMicrotask(() => {
				waiter.run();
			});
		});
		return fn(...args);
	};
	return mount;
}
//#endregion
//#region src/core/custom-theme.ts
/** Versioned user theme derived from the official stock theme. */
const SKIN_CUSTOM_THEME_NS = "skin-custom-theme";
const CUSTOM_THEME_DEFAULTS = {
	version: 1,
	applied: false,
	light: {
		accent: "#4d6bfe",
		background: "#f7f8fa",
		foreground: "#262626",
		contrast: 50
	},
	dark: {
		accent: "#7c91ff",
		background: "#171719",
		foreground: "#f3f3f3",
		contrast: 50
	}
};
//#endregion
//#region src/index.ts
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "ui-skin-center";
/** Services required before the skin-center can mount its routes. */
const inject = ["webServer"];
/**
* Configuration section for the main-interface background scrim. Its name is
* the settings namespace this package owned before 0.1.7; the browser half
* spells the same string, both as this section's key and as the family
* namespace the family settings binder resolves this plugin's profile entry
* id by (it is the entry's only client-side handle).
*/
const SKIN_BACKGROUND_NAMESPACE = "skin-background";
/** Configuration section for the official-theme palette editor. */
const SKIN_CUSTOM_THEME_NAMESPACE = SKIN_CUSTOM_THEME_NS;
const CustomThemeProfileSchema = z.object({
	accent: z.string().default(CUSTOM_THEME_DEFAULTS.light.accent),
	background: z.string().default(CUSTOM_THEME_DEFAULTS.light.background),
	foreground: z.string().default(CUSTOM_THEME_DEFAULTS.light.foreground),
	contrast: z.number().min(0).max(100).step(1).default(50)
});
/** Host-side persistence schema; browser normalization remains fail-closed. */
const SkinCustomThemeConfigSchema = z.object({
	version: z.number().min(1).max(1).step(1).default(1).volatile(),
	applied: z.boolean().default(false).volatile(),
	light: CustomThemeProfileSchema.default(CUSTOM_THEME_DEFAULTS.light).volatile(),
	dark: z.object({
		accent: z.string().default(CUSTOM_THEME_DEFAULTS.dark.accent),
		background: z.string().default(CUSTOM_THEME_DEFAULTS.dark.background),
		foreground: z.string().default(CUSTOM_THEME_DEFAULTS.dark.foreground),
		contrast: z.number().min(0).max(100).step(1).default(50)
	}).default(CUSTOM_THEME_DEFAULTS.dark).volatile()
});
/**
* Runtime schema for SkinBackgroundConfig. Persists the master switch
* (`enabled`) alongside the background strength fields; every field is
* volatile so the settings page can write it.
*/
const SkinBackgroundConfigSchema = z.object({
	enabled: z.boolean().default(SKIN_BACKGROUND_DEFAULTS.enabled).volatile(),
	backgroundOpacity: z.number().min(0).max(100).step(5).default(SKIN_BACKGROUND_DEFAULTS.backgroundOpacity).volatile(),
	backgroundBlurEmpty: z.number().min(0).max(20).step(1).default(SKIN_BACKGROUND_DEFAULTS.backgroundBlurEmpty).volatile(),
	backgroundBlurContent: z.number().min(0).max(20).step(1).default(SKIN_BACKGROUND_DEFAULTS.backgroundBlurContent).volatile(),
	inputCardBlur: z.number().min(0).max(20).step(1).default(SKIN_BACKGROUND_DEFAULTS.inputCardBlur).volatile(),
	bubbleOpacity: z.number().min(0).max(100).step(5).default(SKIN_BACKGROUND_DEFAULTS.bubbleOpacity).volatile(),
	bubbleBlur: z.number().min(0).max(20).step(1).default(SKIN_BACKGROUND_DEFAULTS.bubbleBlur).volatile()
});
/**
* Editable configuration of the skin center: what 0.1.7 serves as this
* profile entry's settings page (the Host derives the page from this schema
* and there is no separate settings document). The two sections are the
* preference families the browser half owns — the same names this package
* registered as settings namespaces before 0.1.7, now sections of one Config.
*
* A volatile field is the only kind the Host projects into the entry's form
* or accepts a write for, and an edit is committed into the running
* activation's references instead of remounting the row. The schema carries
* no `z<...>` annotation on purpose: a volatile field parses to a `Volatile`
* reference while accepting the plain value, so the annotation no longer
* describes it ({@link SkinCenterConfig} is the runtime face instead).
*/
const Config = z.object({
	"skin-background": SkinBackgroundConfigSchema,
	"skin-custom-theme": SkinCustomThemeConfigSchema
});
/**
* Read one live config field.
* @param field - the resolved field (a reference, a plain value, or absent).
* @param fallback - schema default to use when the field carries no value.
* @returns the field's current value.
*/
function readField(field, fallback) {
	if (field === void 0) return fallback;
	const ref = field;
	if (typeof ref === "object" && ref !== null && typeof ref.get === "function") {
		const value = ref.get();
		return value === void 0 ? fallback : value;
	}
	return field;
}
/** The live skin-background section, every field resolved over its default. */
function readBackgroundSection(section) {
	return {
		enabled: readField(section?.enabled, SKIN_BACKGROUND_DEFAULTS.enabled),
		backgroundOpacity: readField(section?.backgroundOpacity, SKIN_BACKGROUND_DEFAULTS.backgroundOpacity),
		backgroundBlurEmpty: readField(section?.backgroundBlurEmpty, SKIN_BACKGROUND_DEFAULTS.backgroundBlurEmpty),
		backgroundBlurContent: readField(section?.backgroundBlurContent, SKIN_BACKGROUND_DEFAULTS.backgroundBlurContent),
		inputCardBlur: readField(section?.inputCardBlur, SKIN_BACKGROUND_DEFAULTS.inputCardBlur),
		bubbleOpacity: readField(section?.bubbleOpacity, SKIN_BACKGROUND_DEFAULTS.bubbleOpacity),
		bubbleBlur: readField(section?.bubbleBlur, SKIN_BACKGROUND_DEFAULTS.bubbleBlur)
	};
}
/**
* Register the skin-center API routes.
*
* Failure policy: route mounting problems are logged, never thrown — the web
* shell fails the whole boot when a plugin apply throws, and the skin center
* must not take the GUI down.
* @param ctx - cordis context.
*/
const apply = mountOnce("@linxin666/dsh-client-ui-skin-center", applyImpl);
/**
* @param ctx - cordis context.
* @param config - this entry's effective configuration (the Host resolves
*   `Config` over the profile patch and hands it to the activation).
*/
function applyImpl(ctx, config) {
	try {
		const migration = migrateBackgroundFromSettings({
			activeStatePath: defaultActiveStatePath(),
			readSettings: () => readBackgroundSection(config?.["skin-background"])
		});
		for (const note of migration.notes) if (migration.migrated) console.info(`[ui-skin-center] background migration: ${note}`);
		else console.error(`[ui-skin-center] background migration: ${note}`);
	} catch (error) {
		console.error("[ui-skin-center] background migration failed:", error);
	}
	const cssScheduler = new SkinCssScheduler();
	const routes = [...makeSkinCenterV2Routes({ transformCss: (css, options) => cssScheduler.transform(css, options) })];
	try {
		ctx.effect(() => {
			const disposers = [];
			try {
				for (const route of routes) disposers.push(ctx.webServer.register(route));
				const statePath = defaultActiveStatePath();
				const indexDeps = {
					readActiveId: () => readActiveSelection(statePath),
					readWallpaperOnStage: () => persistedExternalWallpaperActive()
				};
				const collectSkinRows = makeSkinIndexRows(indexDeps);
				disposers.push(ctx.on("webserver/index-inject", (table) => {
					table.push(...collectSkinRows());
				}));
				disposers.push(ctx.webServer.tapIndex(makeSkinIndexTap(indexDeps)));
			} catch (error) {
				for (const dispose of disposers) dispose();
				throw error;
			}
			return async () => {
				for (const dispose of disposers) dispose();
				await cssScheduler.dispose();
			};
		}, "ui-skin-center: routes");
	} catch (error) {
		console.error("[ui-skin-center] route registration failed:", error);
		cssScheduler.dispose();
	}
	try {
		seedDefaultActiveSkin(defaultActiveStatePath(), (id) => findSkin(loadSkinCatalog(), id) !== null);
	} catch (error) {
		console.error("[ui-skin-center] default-skin seed failed:", error);
	}
	try {
		const statePath = defaultActiveStatePath();
		const migration = migrateLegacySelection({
			knownIds: loadSkinCatalog().skins.map((s) => s.manifest.id),
			activeStatePath: statePath
		});
		if (migration.failed) for (const note of migration.notes) console.error(`[ui-skin-center] legacy bridge: ${note}`);
		else if (migration.migrated !== null || migration.patchCleaned) for (const note of migration.notes) console.info(`[ui-skin-center] legacy bridge: ${note}`);
	} catch (error) {
		console.error("[ui-skin-center] legacy bridge failed:", error);
	}
}
//#endregion
export { Config, SKIN_BACKGROUND_NAMESPACE, SKIN_CENTER_V2_PREFIX, SKIN_CSS_MAX_OUTSTANDING, SKIN_CSS_REQUEST_TIMEOUT_MS, SKIN_CUSTOM_THEME_NAMESPACE, SkinBackgroundConfigSchema, SkinCssOverloadedError, SkinCssSafetyError, SkinCssScheduler, SkinCssTransformFailureError, SkinCssTransformTimeoutError, SkinCssWorkerDisposedError, SkinCustomThemeConfigSchema, apply, auditTokenContract, builtinSkinsDir, canServeSkinHooks, defaultActiveStatePath, findSkin, inject, loadSkinCatalog, makeSkinCenterV2Routes, name, readActiveSelection, resolveInsideSkin, userSkinsDir, validateSkinManifestV2, writeActiveSelection };
