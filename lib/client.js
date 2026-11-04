window.__ModuleLoader__.load({
	id: "@linxin666/dsh-client-ui-skin-center",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/runtime/effect-ledger.ts
		function createEffectLedger(now = () => Date.now()) {
			let seq = 0;
			let nextActivation = 1;
			const log = [];
			const live = /* @__PURE__ */ new Map();
			const disposed = /* @__PURE__ */ new Set();
			function push(activationId, kind, label, replacesSeq) {
				seq += 1;
				log.push({
					seq,
					activationId,
					kind,
					label,
					replacesSeq,
					at: now()
				});
				return seq;
			}
			function release(effect, activationId) {
				if (effect.released) return;
				effect.released = true;
				push(activationId, "release", effect.label);
				try {
					effect.teardown();
				} catch {
					push(activationId, "cleanup-failed", effect.label);
				}
			}
			return {
				beginActivation() {
					const id = nextActivation++;
					live.set(id, []);
					push(id, "create", "activation");
					return id;
				},
				record(activationId, label, teardown) {
					const bucket = live.get(activationId);
					if (!bucket || disposed.has(activationId)) throw new Error(`effect "${label}" recorded on disposed/unknown activation ${activationId}`);
					const entrySeq = push(activationId, "create", label);
					bucket.push({
						seq: entrySeq,
						label,
						teardown,
						released: false
					});
					return entrySeq;
				},
				replace(activationId, label, previousSeq, teardown) {
					const bucket = live.get(activationId);
					if (!bucket || disposed.has(activationId)) throw new Error(`effect "${label}" replaced on disposed/unknown activation ${activationId}`);
					if (previousSeq !== void 0) {
						const previous = bucket.find((e) => e.seq === previousSeq);
						if (previous) release(previous, activationId);
					}
					const entrySeq = push(activationId, "replace", label, previousSeq);
					bucket.push({
						seq: entrySeq,
						label,
						teardown,
						released: false
					});
					return entrySeq;
				},
				disposeActivation(activationId) {
					if (disposed.has(activationId)) return;
					disposed.add(activationId);
					const bucket = live.get(activationId) ?? [];
					for (const effect of [...bucket].reverse()) release(effect, activationId);
				},
				isDisposed(activationId) {
					return disposed.has(activationId);
				},
				entries() {
					return log;
				}
			};
		}
		//#endregion
		//#region src/client/runtime/semantic-adapter.ts
		/**
		* The v1 rule table. Single ownership: only the skin-center edits this.
		* Anchors verified against @deepseek-ai rc.7 (see docs/archive survey).
		*/
		const SEMANTIC_RULES_V1 = [
			{
				selector: "[data-slot=\"root\"]",
				attrs: [["data-dsh-surface", "root"]],
				note: "ui-renderer root outlet"
			},
			{
				selector: "[data-slot=\"sidebar\"]",
				attrs: [["data-dsh-surface", "sidebar"]],
				note: "layout sidebar outlet"
			},
			{
				selector: "[data-slot=\"conversation\"], [class*=\"centerCol\"]",
				attrs: [["data-dsh-surface", "conversation"]],
				note: "conversation column: legacy conversation outlet; since dsh 0.1.7 the column carries no data hook, so the css-module suffix (hash prefix varies, suffix stable) is the anchor"
			},
			{
				selector: "[data-slot=\"conversation.session.header\"]",
				attrs: [["data-dsh-surface", "session-header"]],
				note: "conversation header outlet"
			},
			{
				selector: "[data-slot=\"conversation.composer\"]",
				attrs: [["data-dsh-surface", "composer"]],
				note: "composer chain outlet"
			},
			{
				selector: "[data-slot=\"details\"], [data-rightbar-col]",
				attrs: [["data-dsh-surface", "details"]],
				note: "details column: legacy details outlet; since dsh 0.1.7 the right sidebar column carries the official data-rightbar-col hook (0-width while collapsed, so stamping it paints nothing when closed)"
			},
			{
				selector: "[data-shell-overlay]",
				attrs: [["data-dsh-surface", "overlay"]],
				note: "frame overlay attribute"
			},
			{
				selector: "[data-slot=\"shell.overlay\"]",
				attrs: [["data-dsh-surface", "overlay"]],
				note: "shell overlay outlet"
			},
			{
				selector: "[role=\"dialog\"]:has([data-slot=\"settings.section\"])",
				attrs: [["data-dsh-surface", "settings"]],
				note: "settings dialog (composite: dialog containing the section outlet)"
			},
			{
				selector: "[data-chat-flow-kind]",
				attrs: [["data-dsh-part", "message-row"]],
				note: "chat flow item"
			},
			{
				selector: "[data-streaming]",
				attrs: [["data-dsh-part", "message-body"]],
				note: "assistant markdown root"
			},
			{
				selector: "[data-conversation-scroll]",
				attrs: [["data-dsh-part", "scrollport"]],
				note: "conversation scrollport"
			},
			{
				selector: "textarea[data-phase], [data-composer-input]",
				attrs: [["data-dsh-part", "composer-input"]],
				note: "composer input: legacy textarea; current shells render a Lexical contenteditable carrying data-composer-input"
			},
			{
				selector: "[data-decoration=\"chip\"]",
				attrs: [["data-dsh-part", "composer-chip"]],
				note: "composer reference chip"
			},
			{
				selector: "[data-queue-dock]",
				attrs: [["data-dsh-part", "queue-dock"]],
				note: "queued turns dock"
			},
			{
				selector: "[data-turn-tail]",
				attrs: [["data-dsh-part", "turn-tail"]],
				note: "turn tail row"
			},
			{
				selector: "[data-side]",
				attrs: [["data-dsh-part", "resize-handle"]],
				note: "column resize handle"
			},
			{
				selector: "button[class*=\"newSession\"]",
				attrs: [["data-dsh-part", "new-session"]],
				note: "sidebar new-session action (compat seam shields skins from localized labels)"
			},
			{
				selector: "[data-dsh-taskboard-view], [data-dsh-taskboard-board]",
				attrs: [["data-dsh-plugin", "task-board"]],
				note: "task-board panel/board (the sidebar row is shell-owned: its glyph carries data-dsh-panel-entry and the family rule below stamps the row)"
			},
			{
				selector: "[data-dsh-ssh-view]",
				attrs: [["data-dsh-plugin", "ssh"]],
				note: "ssh panel (the sidebar row is shell-owned: its glyph carries data-dsh-panel-entry and the family rule below stamps the row)"
			},
			{
				selector: "[data-dsh-pet-root]",
				attrs: [["data-dsh-plugin", "pet"]],
				note: "pet global root"
			},
			{
				selector: "[class*=\"panelRow\"]:has([data-dsh-panel-entry])",
				attrs: [["data-dsh-part", "sidebar-entry"]],
				note: "a plugin-registered sidebar row (sidebar.panellist): the shell owns the row box and stamps no hook of its own, so the row is recognised by its css-module class plus the glyph identity the registering plugin outputs — same compat technique as newSession"
			}
		];
		/**
		* The anchors the rule table keys on, as one attribute filter for the
		* observer: a glyph or row anchor that is SET on an element already in the
		* tree must re-anchor its ancestors exactly like a newly inserted one.
		*/
		const ANCHOR_ATTRIBUTES = [
			"data-dsh-panel-entry",
			"data-dsh-surface",
			"data-dsh-part",
			"data-dsh-plugin",
			"data-slot",
			"data-chat-flow-kind",
			"data-conversation-scroll",
			"data-turn-tail",
			"data-composer-input",
			"data-queue-dock",
			"data-rightbar-col",
			"data-shell-overlay",
			"data-dsh-taskboard-view",
			"data-dsh-taskboard-board",
			"data-dsh-ssh-view",
			"data-dsh-pet-root",
			"data-decoration",
			"data-streaming",
			"data-side",
			"data-phase"
		];
		/**
		* Selector shapes whose verdict depends on the element's DESCENDANTS or on
		* its position among its siblings, rather than on the element alone.
		*
		* Everything outside this list is "self-only": inserting a descendant cannot
		* change whether the element itself matches. Splitting the table on that
		* boundary is what keeps the ancestor walk cheap without weakening what the
		* walk is FOR (issue #1732) — re-anchoring an ANCESTOR when a late descendant
		* turns out to be the anchor that ancestor keys on.
		*/
		const DESCENDANT_SENSITIVE_PSEUDO = /:has\(|:empty|:first-child|:last-child|:only-child|:first-of-type|:last-of-type|:only-of-type|:nth-/;
		/**
		* Attribute names a selector references. Deliberately a plain scan of the
		* bracket contents rather than a parsed selector: it also finds a reference
		* nested INSIDE a functional pseudo-class, which is what lets
		* `[role="dialog"]:has([data-slot="settings.section"])` answer to a late
		* data-slot flip on an element inside the dialog.
		*/
		const SELECTOR_ATTRIBUTE = /\[([A-Za-z0-9_-]+)/g;
		const attributeReferences = (selector) => {
			const names = /* @__PURE__ */ new Set();
			for (const found of selector.matchAll(SELECTOR_ATTRIBUTE)) names.add(found[1]);
			return names;
		};
		/**
		* Rule traits derived from the selector text ONCE, at module load, never per
		* element. The classification is what every batching decision below reads;
		* re-deriving it inside the walk would reintroduce exactly the per-node work
		* this change removes (issue #1870).
		*/
		const RULE_TRAITS = SEMANTIC_RULES_V1.map((rule) => ({
			descendantSensitive: DESCENDANT_SENSITIVE_PSEUDO.test(rule.selector),
			attributes: attributeReferences(rule.selector)
		}));
		/**
		* Safety bound of the ancestor walk, NOT a depth ceiling.
		*
		* The walk's normal terminator is the observed root: every node the observer
		* can report is inside document.body, so the walk returns there (measured —
		* with this bound removed the walk still stops at body on every delivery).
		* This constant only fires for a change inside a subtree that is not connected
		* to the observed root at all, where there is no ancestor to anchor yet and
		* the node's own childList delivery stamps it once it IS attached.
		*
		* It is deliberately far above any real markup depth (the shell's own sidebar
		* row is three hops deep) instead of a small number that would silently leave
		* a deeper row unanchored — which is the very defect this walk exists to fix
		* (issue #1732). A measured sweep anchors through 23 wrapper levels and misses
		* from 24, i.e. only past the point where the tree is pathological.
		*
		* Narrowing WHICH rules a hop applies does not make the hop count safe to drop
		* (issue #1870): a childList record only ever flips a descendant-sensitive
		* rule, and an attributes record only the rules naming the attribute that
		* actually changed, so a hop now costs one matches() call per APPLICABLE rule
		* instead of one per rule in the table. The bound stays as the backstop it has
		* always been.
		*/
		const ANCESTOR_HOPS = 24;
		function createSemanticAdapter(doc) {
			const rules = SEMANTIC_RULES_V1.map((rule, index) => ({
				rule,
				usable: true,
				matchedInPass: 0,
				descendantSensitive: RULE_TRAITS[index].descendantSensitive,
				attributes: RULE_TRAITS[index].attributes
			}));
			/**
			* The subset a childList delivery may walk: inserting a descendant can flip
			* a descendant-sensitive rule on an ancestor and nothing else. A self-only
			* ancestor was already rule-checked when it was added (or by fullPass), and
			* its verdict cannot change because something inside it grew, so
			* re-evaluating it is the cost, not the correctness, of the walk.
			*/
			const descendantSensitiveRules = rules.filter((live) => live.descendantSensitive);
			let observer = null;
			let stamped = 0;
			let running = false;
			const applyRule = (live, el) => {
				if (!live.usable) return;
				let hit = false;
				try {
					hit = el.matches(live.rule.selector);
				} catch {
					live.usable = false;
					return;
				}
				if (!hit) return;
				live.matchedInPass += 1;
				for (const [name, value] of live.rule.attrs) if (el.getAttribute(name) !== value) {
					el.setAttribute(name, value);
					stamped += 1;
				}
			};
			const applyToTree = (rootEl) => {
				for (const live of rules) {
					if (!live.usable) continue;
					applyRule(live, rootEl);
					let matches = [];
					try {
						matches = Array.from(rootEl.querySelectorAll(live.rule.selector));
					} catch {
						live.usable = false;
						continue;
					}
					for (const el of matches) applyRule(live, el);
				}
			};
			const fullPass = () => {
				for (const live of rules) live.matchedInPass = 0;
				if (doc.documentElement) applyToTree(doc.documentElement);
			};
			/**
			* Re-anchor one changed node's ancestor chain with the rules that change
			* could actually have flipped.
			*
			* applyToTree only walks DOWNWARD: a rule whose selector matches an ancestor
			* of the changed node (the panel-list row is recognised by the glyph INSIDE
			* it) is never re-evaluated when that descendant arrives. React mounts the
			* row first and the registering plugin's glyph a tick later, so without this
			* the row keeps no anchor at all until something forces a full pass
			* (issue #1732). The walk is bounded, stops at the document root, and
			* carries only the rules the reported change can flip: the caller's batch has
			* already deduplicated the hops it shares with sibling records, so a hop
			* costs one matches() call per applicable rule, not one per rule in the table
			* (issue #1870).
			*/
			const reanchorAncestors = (node, subset) => {
				if (subset.length === 0) return;
				const root = doc.body ?? doc.documentElement;
				let current = node;
				for (let hop = 0; current !== null && hop <= ANCESTOR_HOPS; hop += 1) {
					for (const live of subset) if (live.usable) applyRule(live, current);
					if (current === root || current === doc.documentElement) return;
					current = current.parentElement;
				}
			};
			/**
			* Drop added roots that another root of the same delivery already contains:
			* applyToTree on the containing root scans the nested one as part of its own
			* subtree, and the containing root's own ancestor walk covers the nested
			* root's ancestors, so re-scanning it is pure duplicate work. Membership is a
			* Set probe per ancestor hop — no selector-engine call — which keeps a
			* delivery that mounts a whole subtree at once linear in that subtree.
			*/
			const topmostRoots = (roots) => {
				const kept = [];
				for (const candidate of roots) {
					let parent = candidate.parentElement;
					let nested = false;
					while (parent !== null) {
						if (roots.has(parent)) {
							nested = true;
							break;
						}
						if (parent === doc.documentElement) break;
						parent = parent.parentElement;
					}
					if (!nested) kept.push(candidate);
				}
				return kept;
			};
			return {
				get running() {
					return running;
				},
				start() {
					if (running) return;
					running = true;
					fullPass();
					observer = new doc.defaultView.MutationObserver((records) => {
						try {
							const roots = /* @__PURE__ */ new Set();
							const byAttribute = /* @__PURE__ */ new Map();
							for (const record of records) {
								if (record.type === "attributes") {
									const target = record.target.nodeType === 1 ? record.target : null;
									const name = record.attributeName;
									if (target === null || name === null) continue;
									const seen = byAttribute.get(name);
									if (seen === void 0) byAttribute.set(name, /* @__PURE__ */ new Set([target]));
									else seen.add(target);
									continue;
								}
								if (record.type !== "childList") continue;
								for (const node of Array.from(record.addedNodes)) {
									if (node.nodeType !== 1) continue;
									roots.add(node);
								}
							}
							for (const root of topmostRoots(roots)) {
								applyToTree(root);
								reanchorAncestors(root.parentElement ?? root, descendantSensitiveRules);
							}
							for (const [name, targets] of byAttribute) {
								const onTarget = [];
								const onAncestors = [];
								for (const live of rules) {
									if (!live.attributes.has(name)) continue;
									onTarget.push(live);
									if (live.descendantSensitive) onAncestors.push(live);
								}
								if (onTarget.length === 0) continue;
								for (const target of targets) {
									for (const live of onTarget) applyRule(live, target);
									reanchorAncestors(target.parentElement ?? target, onAncestors);
								}
							}
						} catch {}
					});
					observer.observe(doc.body ?? doc.documentElement, {
						childList: true,
						subtree: true,
						attributes: true,
						attributeFilter: [...ANCHOR_ATTRIBUTES]
					});
				},
				stop() {
					running = false;
					observer?.disconnect();
					observer = null;
				},
				diagnostics() {
					return {
						invalidRules: rules.filter((r) => !r.usable).map((r) => r.rule.selector),
						unmatchedRules: rules.filter((r) => r.usable && r.matchedInPass === 0).map((r) => r.rule.selector),
						stamped
					};
				}
			};
		}
		//#endregion
		//#region src/client/runtime/shell-rendering.ts
		/**
		* Shared shell rendering corrections for every visual mode owned by the skin
		* center (issue #954). The official shell exposes stable slot / composer
		* anchors, while the workspace-list fade itself is still a CSS-module class.
		* Keep that fallback scoped below sidebar.workspaces so an unrelated animation
		* or overlay whose class contains "fade" is never affected.
		*
		* The stylesheet is inert for the stock look: a catalog skin or a custom theme
		* must be active. The wallpaper mode left this adapter with the built-in
		* Wallpaper Engine bridge (issue #39): the delegated plugin owns the shell
		* corrections for its own backdrop, and this plugin's visual work stands down
		* entirely while that plugin renders. The sheet is installed once per runtime
		* and removed with that runtime, so disabling the plugin restores the shell
		* unchanged.
		* @module @linxin666/dsh-client-ui-skin-center/runtime/shell-rendering
		*/
		/** Marker owned by the shared shell-rendering stylesheet. */
		const SHELL_RENDERING_STYLE_ATTR = "data-dsh-shell-rendering";
		const ACTIVE_VISUAL_SELECTOR = ["html[data-dsh-skin]", "html[data-dsh-custom-theme]:not([data-dsh-skin])"].join(", ");
		const COMPOSER_SEAT_SELECTORS = [
			"[data-slot=\"conversation.composer\"]",
			"[data-composer-seat]",
			"[data-dsh-surface=\"composer\"]"
		];
		/** Build the inert-by-default public rendering corrections. */
		function shellRenderingCss() {
			const scopes = ACTIVE_VISUAL_SELECTOR.split(", ");
			const scoped = (selector) => scopes.map((scope) => `${scope} ${selector}`).join(",\n");
			return `
    /* macOS window-drag guard. The official base stylesheet turns every DIRECT
       body child into a "-webkit-app-region: no-drag" region (its selector
       spares only the app's own root element), so a body-level element that
       spans the viewport subtracts the whole window from the macOS draggable
       region and cancels the official [data-window-drag] chrome rows with it:
       the window can no longer be dragged by its title area, and macOS no
       longer runs the system double-click action (zoom to fit the screen)
       there. "pointer-events: none" does not exempt an element from that
       computation - only a declaration of its own does.

       Every element in the list is a shell this runtime mounts as a body
       child and declares non-interactive, so the guard has to be inline here
       rather than imported from the aggregate patch layer (#1907): a
       standalone install of the skin center never loads that layer, and the
       decoration layers below are mounted for the stock look too, which is
       why this rule is NOT scoped under the active-visual heads above.

        - [data-dsh-skin-layer]: the six fixed decoration layers
          (runtime/decoration-layers.ts);
        - [data-dsh-composer-frost]: the composer frost follower
          (runtime/backdrop-scene.ts);
        - [aria-hidden="true"]: the skin backdrop-filter veil, which carries no
          data hook of its own (client/background.ts).

       "initial" is the initial value ("none"), which leaves the element and
       its whole subtree out of the app-region computation; the declaration
       must be !important because the official selector outranks this one. */
    html[data-platform="darwin"] body > :is(
      [data-dsh-skin-layer],
      [data-dsh-composer-frost],
      [aria-hidden="true"]
    ) {
      -webkit-app-region: initial !important;
    }
    /* Viewport lock: prevent outer page scrollbar and viewport
       displacement during element focus/scrollIntoView. */
    ${ACTIVE_VISUAL_SELECTOR},
    ${scoped("body")} {
      height: 100% !important;
      width: 100% !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    ${scoped("[data-slot=\"sidebar.workspaces\"] [class*=\"_fade\"]")} {
      background: none !important;
      background-image: none !important;
    }
    ${scoped("[data-composer-card] textarea[data-phase]::placeholder")},
    ${scoped("textarea[data-dsh-part=\"composer-input\"]::placeholder")} {
      color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-caption)) !important;
      -webkit-text-fill-color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-caption)) !important;
      opacity: 1 !important;
    }
    ${scoped("[data-phase=\"active\"] [data-slot=\"conversation.input.dock\"] > *")},
    ${scoped("[data-phase=\"active\"] [data-slot=\"conversation.composer.dock\"] > *")},
    ${scoped("[data-phase=\"active\"] [data-slot=\"conversation.composer.dock\"] + *")} {
      /* One skin-driven accessory surface for task and statistics docks. Skins
         automatically follow their existing semantic theme tokens and may
         override the --dsh-composer-accessory-* variables for a stronger
         signature without coupling this adapter to a specific catalog skin.

         The third head covers an accessory that is a SIBLING of the dock slot
         host rather than a child of it. The slot host is display: contents, so
         the shell lays its children out as items of the surrounding dock row
         and the child heads reach them; 0.1.7's context meter was placed beside
         that host instead of inside it, so it shared the row with the
         statistics pill but stayed bare (issue #1715) -- one line, two looks.
         The adjacent-sibling head keeps the row uniform without naming any
         hashed class or localized label, and covers whatever future accessory
         the shell seats next to the dock. The plate lands on the accessory's
         own seat, never on a trigger inside it, so a component's own hover
         feedback keeps painting on top. */
      background: var(--dsh-composer-accessory-bg, var(--dsw-specific-tip, var(--dsw-alias-bg-layer-1))) !important;
      color: var(--dsh-composer-accessory-color, var(--dsw-alias-label-tertiary)) !important;
      border: var(--dsh-composer-accessory-border, none) !important;
      border-radius: var(--dsh-composer-accessory-radius, 12px) !important;
      box-shadow: var(--dsh-composer-accessory-shadow, var(--dsw-shadow-lv1, 0 2px 10px rgba(7, 20, 38, 0.18)));
      backdrop-filter: blur(var(--dsh-composer-accessory-blur, var(--dsh-input-card-blur, 10px))) !important;
      -webkit-backdrop-filter: blur(var(--dsh-composer-accessory-blur, var(--dsh-input-card-blur, 10px))) !important;
    }
    ${scoped("[data-phase=\"active\"] [data-slot=\"conversation.composer.dock\"] > *")},
    ${scoped("[data-phase=\"active\"] [data-slot=\"conversation.composer.dock\"] + *")} {
      /* Same metrics for a dock child and for the sibling seat beside the dock
         slot host, so the two accessories of one row end up the same height:
         the plate must not make one of them look like a different control. */
      margin-top: var(--dsh-composer-accessory-gap, 4px);
      margin-bottom: var(--dsh-composer-accessory-gap, 4px);
      padding-top: 2px;
      padding-bottom: 2px;
    }
    ${scoped("[data-slot=\"conversation.input.dock\"] > [data-goal-bar=\"true\"][data-goal-bar=\"true\"][data-goal-bar=\"true\"]")} {
      /* The host goal dock spans the full composer seat and contains its own
         centered compact bar. Do not paint the outer dock as an accessory: that
         creates a viewport-wide veil behind the active-goal chip. The repeated
         stable marker deliberately raises specificity above catalog-skin dock
         selectors that load after this shared adapter. */
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped("[data-phase=\"active\"] [data-slot=\"conversation.input.dock\"] > [data-queue-dock]")} {
      /* The native queue dock stacks two boxes inside the input dock: a root
         wrapper that only supplies the shared dock inset, and the panel inside
         it that paints its own --dsw-specific-tip fill. Painting the wrapper as
         an accessory adds a second opaque plate one dock inset (8px) wider than
         the panel on each side, which reads as an extra sheet of paper under
         the queue (issue #1572). Reset the accessory surface so the panel stays
         the single layer; the wrapper keeps its inset, so the panel remains
         aligned with the composer card. */
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped("[data-phase=\"active\"] [data-slot=\"conversation.composer.dock\"] + *")} {
      /* Dropping blur on the sibling seat only (issue #1757 / dsh-skins#21). The
         adjacent sibling head added for #1715 lands on ContextMeter's seat
         (span.JObwrW_root). A non-none backdrop-filter makes that seat the
         containing block for its position:fixed descendants, causing its hover
         tooltip and click-open panel to resolve against the seat instead of the
         viewport and push 740px+ horizontal scrollable overflow into the
         conversation scrollport (causing scrollbar flicker on mouse enter/leave).
         The seat's background (--dsh-composer-accessory-bg, default --dsw-specific-tip)
         is fully opaque, so the blur on that element is invisible anyway and
         dropping it restores viewport positioning with zero visual change. */
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped("[data-conversation-scroll]")},
    ${scoped("[data-dsh-part=\"scrollport\"]")} {
      /* The composer is the scrollport's final in-flow child. Reserving physical
         padding after it lifts the active dock by one composer height and also
         shifts the hero above center. */
      padding-bottom: 0 !important;
    }
    /* #978 / #1133: Line-level scroll-margin retains scrollIntoView() clearance
       above the sticky composer without placing a scrollport-level scroll-padding
       that breaks browser caret-reveal geometry (which caused micro-scrolling on
       every keystroke while reading history). */
    ${scoped("[data-conversation-scroll] [data-chat-anchor-key]")},
    ${scoped("[data-conversation-scroll] [data-chat-flow-kind]")},
    ${scoped("[data-conversation-scroll] [data-dsh-part=\"message-row\"]")},
    ${scoped("[data-conversation-scroll] [data-turn-tail]")},
    ${scoped("[data-conversation-scroll] [class*=\"_userRow\"]")},
    ${scoped("[data-conversation-scroll] [class*=\"_compactionRow\"]")},
    ${scoped("[data-conversation-scroll] [class*=\"_contextRow\"]")},
    ${scoped("[data-conversation-scroll] [class*=\"_turnErrorRow\"]")} {
      scroll-margin-bottom: var(--dsh-composer-height, 100px) !important;
    }
    /* dsh 0.1.7 turned the right sidebar panel shell into an always-mounted,
       always-visible positioning box (only its inner dockkit surfaces hide
       while the panel is closed). Skin rules written for the older shell plate
       that shell element and, with the panel closed, cover the conversation
       area with a phantom column. Strip paint from the closed shell whatever
       the active skin; an open panel ([data-sidebar-right-open]) keeps every
       skin paint. The attribute predates the layout change, so the rule is a
       no-op on older shells. */
    ${scoped("[data-slot=\"rightbar.session\"] > [data-sidebar-right-panel]:not([data-sidebar-right-open])")} {
      background: none !important;
      background-color: transparent !important;
      background-image: none !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    /* #1117: The upstream recommended badge pairs two background-fill tokens
       as bg + text — in dark mode, skins like Blue Fantasy collapse them to
       near-identical dark navy values (contrast ~1:1). Override the text
       color to a readable foreground and tweak the background for contrast.
       The dark-theme attribute lives on <body>, so it belongs inside the
       scoped selector: prefixing the already-scoped list produced
       "body ... html ...", a descendant chain that can never match (#1490). */
    ${scoped("body[data-ds-dark-theme] [data-question-key] [class*=\"_badge\"]")},
    ${scoped("body[data-ds-dark-theme] [data-question-scroll] [class*=\"_badge\"]")} {
      color: var(--dsw-alias-label-primary, #ffffff) !important;
      background: var(--dsw-alias-interactive-bg-active, color-mix(in srgb, var(--dsw-alias-button-info-fill, #4a5fa8) 50%, transparent)) !important;
    }
  `;
		}
		/** Install the shared corrections and return their idempotent teardown. */
		function installShellRenderingAdapter(doc) {
			if (doc.head === null) return () => {};
			if (doc.head.querySelector(`style[data-dsh-shell-rendering]`) !== null) return () => {};
			const style = doc.createElement("style");
			style.setAttribute(SHELL_RENDERING_STYLE_ATTR, "");
			style.textContent = shellRenderingCss();
			doc.head.appendChild(style);
			const win = doc.defaultView;
			try {
				win?.scrollTo?.(0, 0);
			} catch {}
			const composerSelector = COMPOSER_SEAT_SELECTORS.join(", ");
			let resizeObserver = null;
			let mutationObserver = null;
			let observedComposer = null;
			let appliedHeight = "";
			let scheduledFrame = null;
			let disposed = false;
			const resolveComposer = () => {
				if (observedComposer !== null && observedComposer.isConnected) return observedComposer;
				return doc.body === null ? null : doc.body.querySelector(composerSelector);
			};
			const syncHeight = () => {
				if (doc.body === null) return;
				const composer = resolveComposer();
				if (composer === null) return;
				if (observedComposer !== composer) {
					if (observedComposer !== null && resizeObserver !== null) resizeObserver.unobserve(observedComposer);
					observedComposer = composer;
					if (resizeObserver !== null) resizeObserver.observe(composer);
				}
				const rect = composer.getBoundingClientRect();
				if (rect.height <= 0) return;
				const root = doc.documentElement;
				const next = `${Math.ceil(rect.height)}px`;
				if (next === appliedHeight || root === null) return;
				appliedHeight = next;
				root.style.setProperty("--dsh-composer-height", next);
			};
			const scheduleSync = () => {
				if (scheduledFrame !== null || disposed) return;
				if (win === null || typeof win.requestAnimationFrame !== "function") {
					syncHeight();
					return;
				}
				scheduledFrame = win.requestAnimationFrame(() => {
					scheduledFrame = null;
					if (disposed) return;
					syncHeight();
				});
			};
			if (win !== null && typeof win.ResizeObserver === "function") resizeObserver = new win.ResizeObserver(() => syncHeight());
			if (win !== null && typeof win.MutationObserver === "function" && doc.body !== null) {
				mutationObserver = new win.MutationObserver(() => scheduleSync());
				mutationObserver.observe(doc.body, {
					childList: true,
					subtree: true
				});
			}
			syncHeight();
			return () => {
				if (disposed) return;
				disposed = true;
				if (scheduledFrame !== null) {
					if (win !== null && typeof win.cancelAnimationFrame === "function") win.cancelAnimationFrame(scheduledFrame);
					scheduledFrame = null;
				}
				if (resizeObserver !== null) {
					resizeObserver.disconnect();
					resizeObserver = null;
				}
				if (mutationObserver !== null) {
					mutationObserver.disconnect();
					mutationObserver = null;
				}
				observedComposer = null;
				appliedHeight = "";
				doc.documentElement?.style.removeProperty("--dsh-composer-height");
				style.remove();
			};
		}
		//#endregion
		//#region src/client/runtime/backdrop-scene.ts
		/**
		* Unified "backdrop visible" scene marker (issue #777).
		*
		* A skin with painted background media or a mounted Wallpaper Engine
		* wallpaper both put real backdrop art behind the app. The two runtime
		* controllers (skin-controller and wallpaper) report their mount state
		* through setSceneBackdropActive(); this module folds them into ONE body /
		* html marker `data-dsh-backdrop-active` and installs the shared composer
		* seat neutralizer that keys on it.
		*
		* The shell's active composer seat paints a bottom occlusion gradient under
		* the sticky input card (rc.8: a linear gradient to --dsw-alias-bg-base,
		* z-index 7). Backdrop scenes intentionally remove that seat-wide gradient in
		* both active and hero phases so wallpaper art remains unobstructed down to the
		* viewport edge. Skin-provided seat-wide ::before masks are neutralized too.
		* Composer task/statistics surfaces are styled by the shared shell adapter
		* from skin theme tokens, not by this scene layer.
		*
		* The input card itself ([data-composer-card], the official shell's stable card
		* anchor) keeps its translucent tint and gains the configurable backdrop blur
		* (default INPUT_FROST_BLUR_PX).
		*
		* The card rule is enabled only while the conversation actually has message
		* content (data-dsh-conversation-content): an empty conversation has no正文 to
		* occlude, so the input keeps its normal hero appearance without a frost flash.
		* The strength is provided by --dsh-input-card-blur and falls back to the
		* compatibility default when the setting has not loaded yet.
		*
		* The marker is body/html level (managed outside the surface/part/plugin
		* enum, see contracts/semantic-attrs-v1.md) and survives a neutralizer
		* teardown; the style is inert whenever the marker is absent.
		* @module @linxin666/dsh-client-ui-skin-center/runtime/backdrop-scene
		*/
		/** Shared marker: set on html + body while a source reports backdrop art. */
		const BACKDROP_ACTIVE_ATTR = "data-dsh-backdrop-active";
		/** The shared composer-seat neutralizer style's own attribute. */
		const SCENE_NEUTRALIZER_ATTR = "data-dsh-scene-neutralizer";
		/**
		* Attribute of the composer frost follower: a body-level, fixed, empty element
		* sized to the input card's border box while a scene is active.
		*
		* It exists because the frost must NOT be painted on the card. A non-none
		* backdrop-filter (like transform, filter, contain or perspective) makes an
		* element the CONTAINING BLOCK for its fixed-position descendants, and the
		* official shell renders its tooltips inside the composer card: the composer
		* send arrow's bubble is position: fixed, so with the frost on the card it
		* resolved its viewport coordinates against the card, landed far outside it
		* but still inside the conversation scrollport, added its own height to
		* scrollHeight, and every hover clamped the scroll to the new bottom — the
		* whole conversation jumped by hundreds of pixels and snapped back on the
		* next frame (issue #1724). Documented throughout the catalog skins as the
		* reason a card ancestor never carries a filter.
		*
		* A body-level sibling is not an ancestor of the card, so it may carry the
		* blur; because nested backdrop-filters do not compose, the card itself must
		* stay filter-free for the follower's blur to read through its translucent
		* fill. The element is empty and pointer-events:none, and it is a sibling of
		* the app root, never inside the scrollport.
		*/
		const COMPOSER_FROST_ATTR = "data-dsh-composer-frost";
		/** Stacking rung of the follower: above the skin art layers, below the shell. */
		const COMPOSER_FROST_Z_INDEX = "-1";
		/** Conversation-content marker: set while the active conversation has rows. */
		const CONVERSATION_CONTENT_ATTR = "data-dsh-conversation-content";
		/**
		* Stable shell scrollport scoped row selectors. Official builds emit the chat
		* anchor; the CSS-module suffix fallbacks retain compatibility with older
		* shells without returning to a body-wide topic/session query.
		*/
		const ACTIVE_CONVERSATION_CONTENT_SELECTOR = [
			"[data-conversation-scroll] [data-chat-anchor-key]",
			"[data-conversation-scroll] [class*=\"_userRow\"]",
			"[data-conversation-scroll] [class*=\"_compactionRow\"]",
			"[data-conversation-scroll] [class*=\"_contextRow\"]",
			"[data-conversation-scroll] [class*=\"_turnErrorRow\"]"
		].join(", ");
		/**
		* Documents whose composer frost is suppressed by an external owner.
		*
		* The delegated wallpaper plugin paints a fixed frosted composer of its own,
		* and two fixed `backdrop-filter` stacks sample a shell the other one relaid,
		* so the skin center must not add a second one. A plain flag (rather than the
		* backdrop marker) keeps the two concerns apart: suppressing the frost must
		* not retract the skin's own backdrop marker or the seat neutralizer, which
		* the skin still needs.
		*/
		const frostSuppressed = /* @__PURE__ */ new WeakSet();
		/**
		* Suppress (or restore) the composer frost follower for one document.
		*
		* Called by the external-plugin interop watcher while
		* `body[data-we-wallpaper]` is present. Idempotent, and it re-evaluates the
		* follower immediately, so the suppression applies even when the backdrop and
		* conversation markers are unchanged.
		* @param doc - the document whose frost is gated.
		* @param suppressed - true while an external owner paints the composer glass.
		*/
		function setComposerFrostSuppressed(doc, suppressed) {
			if (suppressed) frostSuppressed.add(doc);
			else frostSuppressed.delete(doc);
			syncComposerFrost(doc);
		}
		const sourceSets = /* @__PURE__ */ new WeakMap();
		const contentObservers = /* @__PURE__ */ new WeakMap();
		const contentFrames = /* @__PURE__ */ new WeakMap();
		/** Write a marker attribute only when the desired state is not applied yet. */
		function applyMarker(el, attr, active) {
			if (el === null) return;
			if (active) {
				if (el.getAttribute(attr) !== "true") el.setAttribute(attr, "true");
				return;
			}
			if (el.hasAttribute(attr)) el.removeAttribute(attr);
		}
		/**
		* Report one source's backdrop-art presence. The marker stays on while any
		* source is active, so the skin and wallpaper controllers never clobber each
		* other across their mount/unmount cycles.
		*/
		function setSceneBackdropActive(doc, source, active) {
			let sources = sourceSets.get(doc);
			if (sources === void 0) {
				sources = /* @__PURE__ */ new Set();
				sourceSets.set(doc, sources);
			}
			if (active) sources.add(source);
			else sources.delete(source);
			syncMarker(doc, sources);
		}
		/** Reflect the source set onto html/body and ensure the neutralizer on use. */
		function syncMarker(doc, sources) {
			const active = sources.size > 0;
			applyMarker(doc.body, BACKDROP_ACTIVE_ATTR, active);
			applyMarker(doc.documentElement, BACKDROP_ACTIVE_ATTR, active);
			if (active) {
				ensureSceneNeutralizer(doc);
				startContentObserver(doc);
			} else stopContentObserver(doc);
			syncComposerFrost(doc);
		}
		/**
		* Track whether the active conversation scrollport has message rows for the
		* frost gate. Topic pickers and outgoing session trees can retain their own
		* data-chat-anchor-key nodes during a switch; a body-wide query would count
		* those stale rows and flash the composer frost over the new empty topic.
		*/
		function updateConversationContent(doc) {
			const has = doc.body !== null && doc.body.querySelector(ACTIVE_CONVERSATION_CONTENT_SELECTOR) !== null;
			applyMarker(doc.body, CONVERSATION_CONTENT_ATTR, has);
			applyMarker(doc.documentElement, CONVERSATION_CONTENT_ATTR, has);
			syncComposerFrost(doc);
		}
		/**
		* Coalesce the mutation bursts of a streaming conversation into one content
		* check per frame; a check scheduled for a document that stopped observing is
		* dropped so a late frame can never re-add the marker after teardown.
		*/
		function scheduleConversationContent(doc) {
			if (contentFrames.has(doc)) return;
			const win = doc.defaultView;
			if (win === null || typeof win.requestAnimationFrame !== "function") {
				updateConversationContent(doc);
				return;
			}
			contentFrames.set(doc, win.requestAnimationFrame(() => {
				contentFrames.delete(doc);
				if (!contentObservers.has(doc)) return;
				updateConversationContent(doc);
			}));
		}
		/** Observe the conversation tree while a backdrop is visible. */
		function startContentObserver(doc) {
			if (contentObservers.has(doc)) return;
			updateConversationContent(doc);
			const win = doc.defaultView;
			if (win === null || typeof win.MutationObserver !== "function") return;
			const observer = new win.MutationObserver(() => scheduleConversationContent(doc));
			observer.observe(doc.body ?? doc.documentElement, {
				childList: true,
				subtree: true
			});
			contentObservers.set(doc, observer);
		}
		/** Stop the content observer, cancel pending work and drop the marker. */
		function stopContentObserver(doc) {
			const frame = contentFrames.get(doc);
			if (frame !== void 0) {
				const win = doc.defaultView;
				if (win !== null && typeof win.cancelAnimationFrame === "function") win.cancelAnimationFrame(frame);
				contentFrames.delete(doc);
			}
			const observer = contentObservers.get(doc);
			if (observer !== void 0) {
				observer.disconnect();
				contentObservers.delete(doc);
			}
			applyMarker(doc.body, CONVERSATION_CONTENT_ATTR, false);
			applyMarker(doc.documentElement, CONVERSATION_CONTENT_ATTR, false);
			syncComposerFrost(doc);
		}
		/**
		* Install the shared composer-seat neutralizer, keyed by head presence so a
		* cleared head (tests) or a re-mount re-creates it. Without the marker the
		* rules are inert, so the style can outlive a single mount without changing
		* any other look.
		*
		* The composer card is deliberately absent from this sheet: its frost rides
		* {@link COMPOSER_FROST_ATTR} instead, because no rule here may put a
		* containing-block property back on the card (issue #1724).
		*/
		function ensureSceneNeutralizer(doc) {
			if (doc.head === null) return;
			if (doc.head.querySelector(`style[data-dsh-scene-neutralizer]`) !== null) return;
			const style = doc.createElement("style");
			style.setAttribute(SCENE_NEUTRALIZER_ATTR, "");
			style.textContent = `
    html[data-dsh-backdrop-active] [data-composer-seat],
    html[data-dsh-backdrop-active] [data-composer-seat]::before {
      background: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    html[data-dsh-backdrop-active][data-dsh-conversation-content] [${COMPOSER_FROST_ATTR}] {
      backdrop-filter: blur(var(--dsh-input-card-blur, 10px)) !important;
      -webkit-backdrop-filter: blur(var(--dsh-input-card-blur, 10px)) !important;
    }
  `;
			doc.head.appendChild(style);
		}
		const frostFollowers = /* @__PURE__ */ new WeakMap();
		/** The composer card the frost tracks, or null while none is mounted. */
		function composerCardOf(doc) {
			return doc.body === null ? null : doc.body.querySelector("[data-composer-card]");
		}
		/**
		* Create the follower on first use and keep it sized to the composer card.
		*
		* The element is empty, fixed and inert: it paints nothing of its own, and it
		* receives no pointer events, so it can never take a tap from the composer or
		* the sidebar. Sizing uses one measure per animation frame (the shape
		* shell-rendering.ts uses for the composer height) rather than a per-mutation
		* read, and writes only when the box actually changed.
		*/
		function syncFrostFollower(doc) {
			const follower = frostFollowers.get(doc);
			if (follower === void 0) return;
			const card = composerCardOf(doc);
			if (card === null) return;
			if (follower.observed !== card) {
				if (follower.observed !== null) follower.resizeObserver?.unobserve(follower.observed);
				follower.observed = card;
				follower.resizeObserver?.observe(card);
				follower.applied = "";
			}
			const rect = card.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;
			const radius = doc.defaultView?.getComputedStyle(card).borderRadius ?? "";
			const box = [
				rect.top,
				rect.left,
				rect.width,
				rect.height,
				radius
			].map((value) => typeof value === "number" ? Math.round(value) : value).join("|");
			if (box === follower.applied) return;
			follower.applied = box;
			const style = follower.el.style;
			style.top = `${Math.round(rect.top)}px`;
			style.left = `${Math.round(rect.left)}px`;
			style.width = `${Math.round(rect.width)}px`;
			style.height = `${Math.round(rect.height)}px`;
			style.borderRadius = radius;
		}
		/** Coalesce a burst of geometry changes into one measurement per frame. */
		function scheduleFrostSync(doc) {
			const follower = frostFollowers.get(doc);
			if (follower === void 0 || follower.frame !== null) return;
			const win = doc.defaultView;
			if (win === null || typeof win.requestAnimationFrame !== "function") {
				syncFrostFollower(doc);
				return;
			}
			follower.frame = win.requestAnimationFrame(() => {
				follower.frame = null;
				if (!frostFollowers.has(doc)) return;
				syncFrostFollower(doc);
			});
		}
		/** Mount the follower while a scene is visible and start tracking the card. */
		function startFrostFollower(doc) {
			if (frostFollowers.has(doc) || doc.body === null) return;
			const el = doc.createElement("div");
			el.setAttribute(COMPOSER_FROST_ATTR, "");
			el.setAttribute("aria-hidden", "true");
			const style = el.style;
			style.position = "fixed";
			style.pointerEvents = "none";
			style.zIndex = COMPOSER_FROST_Z_INDEX;
			style.borderRadius = "inherit";
			const follower = {
				el,
				resizeObserver: null,
				observed: null,
				onResize: null,
				frame: null,
				applied: ""
			};
			doc.body.appendChild(el);
			frostFollowers.set(doc, follower);
			const win = doc.defaultView;
			if (win !== null && typeof win.ResizeObserver === "function") follower.resizeObserver = new win.ResizeObserver(() => scheduleFrostSync(doc));
			if (win !== null && typeof win.addEventListener === "function") {
				follower.onResize = () => scheduleFrostSync(doc);
				win.addEventListener("resize", follower.onResize);
			}
			syncFrostFollower(doc);
		}
		/** Remove the follower and stop every loop that fed it. */
		function stopFrostFollower(doc) {
			const follower = frostFollowers.get(doc);
			if (follower === void 0) return;
			frostFollowers.delete(doc);
			const win = doc.defaultView;
			if (follower.frame !== null && win !== null && typeof win.cancelAnimationFrame === "function") {
				win.cancelAnimationFrame(follower.frame);
				follower.frame = null;
			}
			follower.resizeObserver?.disconnect();
			follower.resizeObserver = null;
			if (follower.onResize !== null) {
				win?.removeEventListener("resize", follower.onResize);
				follower.onResize = null;
			}
			follower.el.remove();
		}
		/**
		* Attach the composer frost to the current scene state. Called from the shared
		* marker sync so the follower exists exactly while a backdrop is visible and
		* the conversation has content — the same gate the card's old frost rule used.
		*
		* The follower tracks the card through a ResizeObserver on the card itself and
		* one interval-free re-schedule on every re-mount, so a conversation switch
		* that replaces the composer keeps the frost aligned without a polling loop.
		*/
		function syncComposerFrost(doc) {
			if (!(doc.body !== null && doc.body.hasAttribute("data-dsh-backdrop-active") && doc.body.hasAttribute("data-dsh-conversation-content")) || frostSuppressed.has(doc)) {
				stopFrostFollower(doc);
				return;
			}
			startFrostFollower(doc);
		}
		//#endregion
		//#region src/client/runtime/decoration-layers.ts
		const LAYER_ATTR = "data-dsh-skin-layer";
		/**
		* Per-layer paint order. The background sits at -2: negative z-index
		* elements paint ABOVE the html/body backgrounds (so a skin's own opaque
		* root background-color renders BEHIND its art — the v1 layering) yet below
		* every panel surface. It shares -2 with the WE scrim, which never paints
		* at the same time (an active WE wallpaper suppresses skin media, enforced
		* by the controller). The skin-background blur veil (-1) still samples the
		* art above it. Ambient effects paint above the veils; the strip/foreground
		* layers stay below the official overlay band (>=1000).
		*/
		const LAYER_STYLE = {
			background: "position:fixed;top:0;right:0;bottom:0;left:0;z-index:-2;pointer-events:none;will-change:transform;",
			ambient: "position:fixed;top:0;right:0;bottom:0;left:0;z-index:30;pointer-events:none;",
			top: "position:fixed;top:0;left:0;right:0;z-index:40;pointer-events:none;",
			bottom: "position:fixed;bottom:0;left:0;right:0;z-index:40;pointer-events:none;",
			sidebar: "position:fixed;top:0;bottom:0;left:0;z-index:40;pointer-events:none;",
			foreground: "position:fixed;top:0;right:0;bottom:0;left:0;z-index:41;pointer-events:none;"
		};
		function ensureOne(doc, name) {
			const existing = doc.querySelector(`[${LAYER_ATTR}="${name}"]`);
			if (existing) {
				existing.style.cssText = LAYER_STYLE[name];
				return existing;
			}
			const el = doc.createElement("div");
			el.setAttribute(LAYER_ATTR, name);
			el.setAttribute("aria-hidden", "true");
			el.style.cssText = LAYER_STYLE[name];
			doc.body.appendChild(el);
			return el;
		}
		/**
		* Ensure all six layers exist and return their handles. Idempotent; safe to
		* call on every activation.
		*/
		function ensureDecorationLayers(doc) {
			return {
				background: ensureOne(doc, "background"),
				ambient: ensureOne(doc, "ambient"),
				top: ensureOne(doc, "top"),
				bottom: ensureOne(doc, "bottom"),
				sidebar: ensureOne(doc, "sidebar"),
				foreground: ensureOne(doc, "foreground")
			};
		}
		/** Remove every node an activation left in a layer (used on dispose). */
		function clearLayer(layer) {
			while (layer.firstChild) layer.removeChild(layer.firstChild);
		}
		/**
		* Build the background media element for a manifest backgroundMedia layer.
		* Returns null when the theme variant has no media. The element fills the
		* background layer; the scrim (when declared) is a sibling overlay.
		*/
		function buildBackgroundMedia(doc, layer, assetBase) {
			const nodes = [];
			const fullBleed = "position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;object-fit:cover;";
			if (layer.type === "image") {
				const img = doc.createElement("img");
				img.src = `${assetBase}/${layer.src}`;
				img.alt = "";
				img.setAttribute("aria-hidden", "true");
				img.style.cssText = fullBleed;
				nodes.push(img);
			} else {
				const video = doc.createElement("video");
				video.src = `${assetBase}/${layer.src}`;
				video.muted = true;
				video.loop = true;
				video.autoplay = true;
				video.playsInline = true;
				video.setAttribute("aria-hidden", "true");
				video.style.cssText = fullBleed;
				nodes.push(video);
			}
			if (layer.scrim) {
				const scrim = doc.createElement("div");
				scrim.setAttribute("aria-hidden", "true");
				scrim.style.cssText = `position:absolute;inset:0;background:${layer.scrim};`;
				nodes.push(scrim);
			}
			return nodes;
		}
		//#endregion
		//#region src/client/runtime/skin-controller.ts
		/**
		* Whether this entry's visual belongs to a delegated plugin.
		*
		* A delegated skin is a real selection, not a stand-down: it is persisted,
		* adopted on boot, and shown as the active row. What it never does is paint.
		* @param entry - a catalog entry, or null.
		* @returns true when the entry is a delegated skin.
		*/
		function isDelegatedEntry(entry) {
			return entry?.manifest.delegated !== void 0;
		}
		/**
		* How long a user-initiated activation may hold the stage while another
		* plugin still owns the visual (issue #49).
		*
		* The claim exists to make the request VISIBLE on the public
		* `html[data-dsh-skin]` stamp, not to compete for the backdrop. The hand-back
		* itself is DOM-level (the other plugin observes that stamp and clears its
		* own), so this window only has to cover that round trip; when it expires
		* without a hand-back the activation withdraws and the remembered selection
		* repaints the moment that owner stops.
		*/
		const USER_INITIATED_YIELD_GRACE_MS = 1500;
		function createSkinController(deps) {
			const doc = deps.doc;
			const ledger = deps.ledger;
			const apiBase = deps.apiBase ?? "/api/skin-center/v2";
			const fetchImpl = deps.fetchImpl ?? fetch.bind(doc.defaultView);
			const layers = ensureDecorationLayers(doc);
			const onError = deps.onError ?? (() => {});
			const themeGet = deps.themeGet ?? (() => doc.body?.hasAttribute("data-ds-dark-theme") ? "dark" : "light");
			const themeSubscribe = deps.themeSubscribe ?? ((listener) => {
				let last = themeGet();
				const observer = new doc.defaultView.MutationObserver(() => {
					const next = themeGet();
					if (next !== last) {
						last = next;
						listener(next);
					}
				});
				if (doc.body) observer.observe(doc.body, {
					attributes: true,
					attributeFilter: ["data-ds-dark-theme"]
				});
				return () => observer.disconnect();
			});
			/**
			* Re-paint the current activation's background media for the live
			* light/dark theme (the controller owns the layer, so a theme flip must
			* swap the variant the same way an activation does). No-op when there is
			* nothing painted or the manifest carries no backgroundMedia.
			*/
			function repaintBackgroundForTheme() {
				if (active === null || currentActivation === null || lastEntry === null) return;
				if (stoodDown) return;
				const media = lastEntry.manifest.contributes?.backgroundMedia;
				if (!media) return;
				const variant = themeGet() === "dark" ? media.dark ?? media.light : media.light ?? media.dark;
				if (!variant) return;
				const assetBase = `${apiBase}/skins/${lastEntry.manifest.id}`;
				setBackgroundLayer(currentActivation, buildBackgroundMedia(doc, variant, assetBase));
			}
			const unsubscribeTheme = themeSubscribe(() => repaintBackgroundForTheme());
			const loadStylesheet = deps.loadStylesheet ?? ((href) => new Promise((resolveLink, rejectLink) => {
				const link = doc.createElement("link");
				link.rel = "stylesheet";
				link.href = href;
				const timer = setTimeout(() => rejectLink(/* @__PURE__ */ new Error(`stylesheet load timeout: ${href}`)), 15e3);
				link.onload = () => {
					clearTimeout(timer);
					resolveLink();
				};
				link.onerror = () => {
					clearTimeout(timer);
					rejectLink(/* @__PURE__ */ new Error(`stylesheet load failed: ${href}`));
				};
				doc.head.appendChild(link);
			}));
			let latestRequest = 0;
			/**
			* True from the moment a switch begins until the newest switch settles. A
			* page that recovers its selection asynchronously (the desktop client boots
			* without the tapIndex stamp) has an activation in flight while other
			* subsystems start publishing, and an external verdict flip read during that
			* window is replayed after it settles instead of racing it (issue #1805).
			*/
			let switching = false;
			/** An external verdict flip observed while a switch was in flight. */
			let refreshQueued = false;
			let currentActivation = null;
			const initialSkinId = doc.documentElement?.getAttribute("data-dsh-skin") || null;
			let active = initialSkinId;
			/** The committed selection try-on restores (component scope). */
			let committed = {
				id: initialSkinId,
				entry: null
			};
			/** Last non-null applied entry, so refresh() can re-activate it. */
			let lastEntry = null;
			/** Last evaluated stand-down verdict (refresh() skips no-ops). */
			let lastSuppressed = deps.suppressSkin?.() === true;
			let trying = null;
			let previewing = false;
			const listeners = /* @__PURE__ */ new Set();
			let stoodDown = lastSuppressed === true;
			let stateSnapshot = {
				active: initialSkinId,
				stoodDown,
				trying: null,
				previewing: false
			};
			const emit = () => {
				stateSnapshot = {
					active,
					stoodDown,
					trying,
					previewing
				};
				for (const listener of listeners) listener();
			};
			/**
			* Install one stylesheet as a tracked <link> (the load itself happened in
			* loadStylesheet; here we only register the teardown). Links keep relative
			* url() resolution intact — a <style> tag would resolve them against the
			* document and 404 every skin asset.
			*/
			function trackStylesheet(activation, label, href) {
				const link = doc.head.querySelector(`link[href="${href}"]`);
				ledger.record(activation, `style:${label}`, () => link?.remove());
			}
			/**
			* Paint the skin background art into the `background` decoration layer
			* (z-index:-2) with a snapshot for the activation ledger. Only the CURRENT
			* activation may restore: when an older activation is disposed after a
			* newer one already re-painted the layer, restoring its snapshot would
			* clobber the newer paint.
			*
			* Two reasons the art lives in the layer, not on `document.body`:
			*  - Chromium's backdrop-filter does not sample the canvas/body background,
			*    so the skin-center blur layer (z-index:-1) could never blur body-painted
			*    art (issue #732 defect A). A real fixed element IS sampled, so after
			*    this change the same blur + scrim controls work on the skin backdrop
			*    just like they already do on the Wallpaper Engine layers (issue #777).
			*  - dragon-heir hooks expect the art in ctx.layers.background (they swap
			*    the painted img and apply the v1 filter lift); the layer is the v2
			*    contract and body painting was a leftover half-migration.
			* The body's own opaque background is forced transparent while art is
			* mounted, or the shell's static panels would cover the negative-z layer.
			*/
			function setBackgroundLayer(activation, nodes) {
				const style = doc.body.style;
				const previousBackgroundColor = style.getPropertyValue("background-color");
				const previousBackgroundImage = style.getPropertyValue("background-image");
				const restore = () => {
					if (currentActivation !== activation) return;
					clearLayer(layers.background);
					setSceneBackdropActive(doc, "skin", false);
					if (previousBackgroundColor === "") style.removeProperty("background-color");
					else style.setProperty("background-color", previousBackgroundColor);
					if (previousBackgroundImage === "") style.removeProperty("background-image");
					else style.setProperty("background-image", previousBackgroundImage);
				};
				clearLayer(layers.background);
				if (nodes.length > 0) {
					for (const node of nodes) layers.background.appendChild(node);
					style.setProperty("background-color", "transparent");
					style.setProperty("background-image", "none");
					setSceneBackdropActive(doc, "skin", true);
				} else {
					setSceneBackdropActive(doc, "skin", false);
					if (previousBackgroundColor === "") style.removeProperty("background-color");
					else style.setProperty("background-color", previousBackgroundColor);
					if (previousBackgroundImage === "") style.removeProperty("background-image");
					else style.setProperty("background-image", previousBackgroundImage);
				}
				ledger.record(activation, "background:layer", restore);
			}
			function installBackground(activation, entry) {
				const media = entry.manifest.contributes?.backgroundMedia;
				if (!media) {
					setBackgroundLayer(activation, []);
					return;
				}
				const variant = themeGet() === "dark" ? media.dark ?? media.light : media.light ?? media.dark;
				if (!variant) {
					setBackgroundLayer(activation, []);
					return;
				}
				const assetBase = `${apiBase}/skins/${entry.manifest.id}`;
				setBackgroundLayer(activation, buildBackgroundMedia(doc, variant, assetBase));
			}
			async function installHooks(activation, entry) {
				if (!entry.manifest.facets?.client) return;
				const importHooks = deps.importHooks ?? ((url) => import(
					/* @vite-ignore */
					url
));
				try {
					const factory = (await importHooks(`${apiBase}/skins/${entry.manifest.id}/hooks.mjs`))?.default;
					if (typeof factory !== "function") throw new Error("hooks.mjs must default-export defineSkinHooks()");
					const hooks = factory();
					if (typeof hooks?.apply !== "function") throw new Error("defineSkinHooks() must return { apply }");
					const cleanups = [];
					const ctx = {
						skinId: entry.manifest.id,
						scopeAttr: entry.manifest.id,
						assetBase: `${apiBase}/skins/${entry.manifest.id}`,
						layers,
						theme: {
							get: themeGet,
							subscribe: themeSubscribe
						},
						onCleanup: (fn) => {
							cleanups.push(fn);
						}
					};
					hooks.apply(ctx);
					ledger.record(activation, "hooks", () => {
						try {
							hooks.dispose?.();
						} catch (error) {
							onError(`hooks dispose failed for ${entry.manifest.id}`, error);
						}
						for (const cleanup of cleanups.reverse()) try {
							cleanup();
						} catch (error) {
							onError(`hooks cleanup failed for ${entry.manifest.id}`, error);
						}
					});
				} catch (error) {
					onError(`hooks failed for ${entry.manifest.id}; static skin stays active`, error);
				}
			}
			async function persist(id) {
				if (deps.persist) {
					await deps.persist(id);
					return;
				}
				await fetchImpl(`${apiBase}/active`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ active: id })
				});
			}
			async function switchInternal(id, entry, mode, options) {
				const seq = ++latestRequest;
				switching = true;
				const activation = ledger.beginActivation();
				const suppressed = deps.suppressSkin?.() === true;
				const delegated = isDelegatedEntry(entry);
				const claimsStage = options?.userInitiated === true && id !== null && entry !== null && !delegated;
				const withheld = suppressed && !claimsStage;
				try {
					if (!withheld && !delegated && id !== null && entry !== null) {
						const stylesheetHref = `${apiBase}/skins/${id}/stylesheet`;
						const patchesHref = entry.manifest.contributes?.patches !== void 0 ? `${apiBase}/skins/${id}/patches` : null;
						await loadStylesheet(stylesheetHref);
						trackStylesheet(activation, "stylesheet", stylesheetHref);
						if (patchesHref !== null) {
							await loadStylesheet(patchesHref).catch(() => {});
							trackStylesheet(activation, "patches", patchesHref);
						}
						if (seq !== latestRequest) throw new StaleSwitch();
						installBackground(activation, entry);
						await installHooks(activation, entry);
					} else setBackgroundLayer(activation, []);
					if (seq !== latestRequest) throw new StaleSwitch();
					if (id === null || withheld || delegated) doc.documentElement.removeAttribute("data-dsh-skin");
					else doc.documentElement.setAttribute("data-dsh-skin", id);
					const previous = currentActivation;
					currentActivation = activation;
					active = id;
					stoodDown = withheld;
					lastSuppressed = withheld;
					if (entry !== null) lastEntry = entry;
					if (mode === "preview") {
						previewing = id !== committed.id;
						trying = previewing ? id : null;
					} else {
						committed = {
							id,
							entry
						};
						trying = null;
						previewing = false;
					}
					emit();
					if (previous !== null) ledger.disposeActivation(previous);
					if (claimsStage && suppressed) scheduleYieldCheck(activation);
					settleSwitch(seq);
					if (mode === "commit") await persist(id).catch((error) => onError("failed to persist the skin selection", error));
					return active;
				} catch (error) {
					ledger.disposeActivation(activation);
					if (error instanceof StaleSwitch) return active;
					if (currentActivation === null) {
						active = null;
						stoodDown = false;
						committed = {
							id: null,
							entry: null
						};
						doc.documentElement.removeAttribute("data-dsh-skin");
						emit();
					}
					onError(`switch to ${id ?? "stock"} failed; previous skin intact`, error);
					return active;
				} finally {
					settleSwitch(seq);
				}
			}
			/**
			* The visual half of a switch is done: release the in-flight flag and replay
			* a verdict flip that arrived while it was loading.
			*
			* Called at the atomic cut, NOT after the persist round-trip. POST /active
			* has no timeout and can hang on a paired desktop, and a page that has
			* already painted must still yield to an external owner the moment that
			* owner's verdict flips - waiting for the write would leave the skin painted
			* over the wallpaper (issue #1805). Idempotent, so the failure paths can
			* call it again from the switch's `finally`.
			*/
			function settleSwitch(seq) {
				if (seq !== latestRequest) return;
				if (!switching && !refreshQueued) return;
				switching = false;
				if (refreshQueued) {
					refreshQueued = false;
					refresh();
				}
			}
			/**
			* Re-check a stage claim once the hand-back window is over (issue #49).
			*
			* The claim is a request, not permission: if the external owner still
			* reports itself active at the end of the window, this activation withdraws
			* through the ordinary withheld path, so a peer that never answers the
			* `html[data-dsh-skin]` stamp cannot leave the skin painted over its visual.
			*
			* Three ways the check stands down without acting, each correct:
			*  - a newer activation replaced this one (it applies its own verdict, and
			*    a newer claim brings its own window);
			*  - another switch is in flight (that switch sampled the verdict itself);
			*  - the owner handed the page back (the paint is what the user asked for,
			*    and `refresh()` already sees a matching verdict, so it is left alone).
			*
			* The timer is ledger-recorded, so superseding this activation or shutting
			* the runtime down cancels it.
			* @param activation - the claiming activation this window belongs to.
			*/
			function scheduleYieldCheck(activation) {
				const timer = setTimeout(() => {
					if (activation !== currentActivation) return;
					if (switching) return;
					if (deps.suppressSkin?.() !== true) return;
					switchInternal(active, active === null ? null : lastEntry, "preview");
				}, USER_INITIATED_YIELD_GRACE_MS);
				ledger.record(activation, "yield:claim-window", () => clearTimeout(timer));
			}
			/**
			* Re-apply the current selection under the current external verdict.
			*
			* A switch already in flight sampled the verdict before this call, so this
			* defers the flip instead of opening a second activation: the second one
			* would bump the request sequence and cancel the first, which is how the
			* desktop boot lost its persisted selection (issue #1805).
			*/
			async function refresh() {
				const suppressed = deps.suppressSkin?.() === true;
				if (suppressed === lastSuppressed) return active;
				if (switching) {
					refreshQueued = true;
					return active;
				}
				lastSuppressed = suppressed;
				if (active !== null && lastEntry === null) return active;
				return await switchInternal(active, active === null ? null : lastEntry, "preview");
			}
			return {
				get active() {
					return active;
				},
				get layers() {
					return layers;
				},
				async switchTo(id, entry, options) {
					return await switchInternal(id, entry, "commit", options);
				},
				async tryOn(id, entry, options) {
					return await switchInternal(id, entry, "preview", options);
				},
				async adopt(id, entry, options) {
					return await switchInternal(id, entry, "adopt", options);
				},
				async exitTryOn() {
					return await switchInternal(committed.id, committed.entry, "preview");
				},
				subscribe(listener) {
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
				getState() {
					return stateSnapshot;
				},
				isSwitching() {
					return switching;
				},
				refresh,
				shutdown() {
					latestRequest += 1;
					unsubscribeTheme();
					if (currentActivation !== null) {
						ledger.disposeActivation(currentActivation);
						currentActivation = null;
					}
					active = null;
					stoodDown = false;
					trying = null;
					previewing = false;
					committed = {
						id: null,
						entry: null
					};
					emit();
					doc.documentElement.removeAttribute("data-dsh-skin");
				}
			};
		}
		var StaleSwitch = class extends Error {
			constructor() {
				super("superseded by a newer switch");
			}
		};
		//#endregion
		//#region src/client/runtime/boot.ts
		/**
		* Browser boot wiring for the v2 skin runtime (issue #506): one store per
		* document that owns the effect ledger, the skin controller, the semantic
		* adapter and the catalog snapshot. The settings card consumes the store;
		* the store outlives the card (settings panels unmount on close), so a
		* try-on preview survives closing and reopening the panel.
		*
		* Boot sequence: fetch the catalog snapshot once, read the persisted active
		* selection, and activate it (the tapIndex adapter already stamped the
		* attribute and preloaded the stylesheet for first paint; the controller
		* re-installs under ledger ownership so later switches stay atomic).
		* @module @linxin666/dsh-client-ui-skin-center/runtime/boot
		*/
		/** A catalog row whose visual belongs to a delegated plugin. */
		function isDelegatedCatalogSkin(skin) {
			return skin.manifest.delegated !== void 0;
		}
		function bootSkinRuntime(options = {}) {
			const doc = options.doc ?? document;
			const apiBase = options.apiBase ?? "/api/skin-center/v2";
			const fetchImpl = options.fetchImpl ?? fetch.bind(doc.defaultView);
			const controller = createSkinController({
				doc,
				ledger: createEffectLedger(),
				apiBase,
				fetchImpl,
				suppressSkin: options.suppressSkin,
				onError: (message, error) => {
					console.error(`[skin-center] ${message}`, error);
				}
			});
			const adapter = createSemanticAdapter(doc);
			adapter.start();
			const disposeShellRendering = installShellRenderingAdapter(doc);
			setComposerFrostSuppressed(doc, options.suppressComposerFrost?.() === true);
			let catalog = null;
			let diagnostics = [];
			const listeners = /* @__PURE__ */ new Set();
			const teardowns = /* @__PURE__ */ new Set();
			const emit = () => {
				for (const listener of listeners) listener();
			};
			async function refreshCatalog() {
				const res = await fetchImpl(`${apiBase}/catalog`);
				if (!res.ok) throw new Error(`catalog fetch -> ${res.status}`);
				const payload = await res.json();
				catalog = payload.skins ?? [];
				diagnostics = payload.diagnostics ?? [];
				emit();
			}
			const store = {
				controller,
				adapter,
				doc,
				window: doc.defaultView ?? window,
				apiBase,
				fetchImpl,
				catalog: () => catalog,
				diagnostics: () => diagnostics,
				refreshCatalog,
				find(id) {
					return catalog?.find((s) => s.manifest.id === id) ?? null;
				},
				subscribe(listener) {
					const off = controller.subscribe(listener);
					listeners.add(listener);
					return () => {
						off();
						listeners.delete(listener);
					};
				},
				shutdown() {
					adapter.stop();
					disposeShellRendering();
					controller.shutdown();
					for (const teardown of [...teardowns]) teardown();
					teardowns.clear();
					listeners.clear();
				}
			};
			{
				const root = doc.defaultView;
				root.__skinRuntime = store;
			}
			(async () => {
				try {
					await refreshCatalog();
					let active = doc.documentElement?.getAttribute("data-dsh-skin") || null;
					if (!active) {
						const payload = await (await fetchImpl(`${apiBase}/active`)).json();
						active = payload.ok && typeof payload.active === "string" ? payload.active : null;
					}
					if (active === null) return;
					let entry = store.find(active);
					if (entry === null) {
						const defaultEntry = store.find("blue-fantasy");
						if (defaultEntry !== null) await controller.adopt("blue-fantasy", defaultEntry);
						else await controller.adopt(null, null);
						return;
					}
					await controller.adopt(active, entry);
				} catch {
					await controller.adopt(null, null).catch(() => {});
				}
			})();
			teardowns.add(trackSkinAppliedEvents(store));
			return store;
		}
		/**
		* Install the skin-applied contract: a window event carrying the applied skin
		* id makes this page converge on that skin immediately.
		*
		* The v1 runtime booted through a full document reload, so any page that
		* switched the skin could assume the next load picked the new selection up -
		* the workshop card simply reloaded. The v2 runtime applies in place, so the
		* page that is already open has to converge on the write, and the workshop
		* installs the skin files itself. Legacy-bridge pages announce through that
		* reload event; wiring it here keeps one converge path instead of two.
		* @param store - the runtime store the event converges.
		* @param win - the window whose document the runtime owns.
		* @returns the idempotent listener teardown.
		*/
		function trackSkinAppliedEvents(store) {
			const win = store.window;
			const onApplied = (event) => {
				const detail = event.detail;
				if (detail === null || typeof detail !== "object") return;
				const id = detail.id;
				if (typeof id !== "string" || id === "") return;
				convergeOnSkin(store, id);
			};
			win.addEventListener("dsh-skin-applied", onApplied);
			return () => {
				win.removeEventListener("dsh-skin-applied", onApplied);
			};
		}
		/** Polling cadence for a selection changed outside this page. */
		const SELECTION_POLL_MS = 2e3;
		/** Read the persisted selection; undefined when the endpoint cannot answer. */
		async function fetchPersistedSelection(store) {
			let res;
			try {
				res = await store.fetchImpl(`${store.apiBase}/active`);
			} catch {
				return;
			}
			if (!res.ok) return void 0;
			let payload;
			try {
				payload = await res.json();
			} catch {
				return;
			}
			if (payload.ok !== true) return void 0;
			return typeof payload.active === "string" && payload.active !== "" ? payload.active : null;
		}
		/**
		* Read the persisted selection for a follower that may converge on it:
		* undefined while a switch is in flight, before AND after the read.
		*
		* A switch in flight owns the page's activation, and converging on a selection
		* read during that window supersedes it (that follower switch opens a newer
		* request). The desktop client boots exactly that way - no tapIndex stamp, so
		* its selection arrives from GET /active while the wallpaper watcher is
		* already publishing - and the follower would strand the page on the boot
		* activation's stale paint (issue #1805).
		*
		* The check brackets the request on both sides because a switch can start while
		* the GET is in flight: the value this read returns is then already older than
		* the page's activation, and converging on it would supersede that switch. The
		* read is not lost either way - the next poll sees the same value once the
		* switch has settled.
		*/
		async function readPersistedSelection(store) {
			if (store.controller.isSwitching()) return void 0;
			const selection = await fetchPersistedSelection(store);
			if (store.controller.isSwitching()) return void 0;
			return selection;
		}
		/**
		* Converge on the skin the persisted selection names, re-reading the catalog
		* first when the id is not in the current snapshot (a workshop install lands
		* after the page read the catalog).
		*
		* Convergence ADOPTS the selection (issue #54): this page is following a choice
		* made elsewhere, so it applies that choice without writing it back. The value
		* it is converging on was already persisted by whoever made it, and echoing it
		* would let a reader overwrite a newer write - the second page to boot would
		* win regardless of which choice was newer.
		*/
		async function convergeOnSelection(store, id) {
			if (id !== null && store.find(id) === null) try {
				await store.refreshCatalog();
			} catch {}
			if (id === null) {
				await store.controller.adopt(null, null);
				return;
			}
			const entry = store.find(id);
			if (entry === null) return;
			await store.controller.adopt(id, entry);
		}
		/** Converge on an announced skin id, re-reading the catalog when it is new. */
		async function convergeOnSkin(store, id) {
			await convergeOnSelection(store, id);
		}
		/**
		* Follow the persisted selection while this page is open.
		*
		* Applying a skin and saving that choice are one action in the GUI, but the
		* choice is persisted for the NEXT page load. The conventional route is the
		* official settings form: it writes the settings row this plugin owns, the
		* Host applies it, and nothing inside this page is told. That row is seeded
		* from the skin center's own configuration, so the two are the same choice
		* written twice, and this page reads it back rather than assuming it owns
		* every write (issue #1740).
		*
		* The poll only reads: it never writes the selection back (it converges through
		* `controller.adopt`, issue #54), it skips a value already applied, and it
		* stops while the page is hidden.
		* @param store - the booted runtime store.
		* @param intervalMs - polling cadence in milliseconds.
		* @returns the idempotent teardown of the poll.
		*/
		function watchPersistedSelection(store, intervalMs = SELECTION_POLL_MS) {
			let applied;
			let timer = null;
			let stopped = false;
			const tick = async () => {
				if (stopped) return;
				const next = await readPersistedSelection(store);
				if (stopped || next === void 0 || next === applied) return;
				applied = next;
				await convergeOnSelection(store, next);
			};
			const stopTimer = () => {
				if (timer !== null) store.window.clearInterval(timer);
				timer = null;
			};
			const startTimer = () => {
				if (stopped || timer !== null) return;
				timer = store.window.setInterval(() => {
					tick();
				}, intervalMs);
			};
			(async () => {
				const stamp = store.doc.documentElement?.getAttribute("data-dsh-skin") || null;
				const persisted = await fetchPersistedSelection(store);
				applied = persisted === void 0 ? void 0 : stamp === null || stamp === persisted ? persisted : void 0;
				if (!stopped) startTimer();
			})();
			const onVisibility = () => {
				if (store.doc.visibilityState === "visible") {
					startTimer();
					tick();
				} else stopTimer();
			};
			store.doc.addEventListener("visibilitychange", onVisibility);
			return () => {
				stopped = true;
				stopTimer();
				store.doc.removeEventListener("visibilitychange", onVisibility);
			};
		}
		//#endregion
		//#region src/client/plugin-install-faces.ts
		let faces = {
			native: null,
			family: null,
			navigation: null
		};
		const listeners = /* @__PURE__ */ new Set();
		/** Current faces snapshot (a cached reference, safe for useSyncExternalStore). */
		function getInstallFaces() {
			return faces;
		}
		/** Subscribe to face changes; returns the unsubscribe function. */
		function subscribeInstallFaces(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
		/** Merge one face change into the snapshot and notify subscribers. */
		function patchFaces(patch) {
			faces = {
				...faces,
				...patch
			};
			for (const listener of listeners) listener();
		}
		/**
		* npm package name (optionally scoped, lowercase) plus the optional concrete
		* version/tag suffix npm accepts. Mirrors the store's own rule so this module
		* can never hand a manager a spec the store would have rejected.
		*/
		const NPM_SPEC = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:@[0-9A-Za-z][0-9A-Za-z._-]*)?$/;
		/**
		* Whether one install spec is safe to hand to a plugin manager.
		* @param spec - the candidate spec.
		* @returns true for a plain npm package name (optionally `pkg@version`).
		*/
		function isInstallSpecValid(spec) {
			return NPM_SPEC.test(spec);
		}
		/**
		* Bridge both optional faces into the module store. Uses `ctx.inject` so each
		* face stays optional: the inner callback runs when the face is provided and is
		* disposed when it goes away, which clears the store.
		* @param ctx - the client root context.
		*/
		function bridgeInstallFaces(ctx) {
			ctx.inject(["remote.pluginManager"], (inner) => {
				inner.effect(() => {
					patchFaces({ native: inner.get("remote.pluginManager") ?? null });
					return () => {
						patchFaces({ native: null });
					};
				}, "ui-skin-center: official pluginManager bridge");
			});
			ctx.inject(["pluginManager"], (inner) => {
				inner.effect(() => {
					patchFaces({ family: inner.get("pluginManager") ?? null });
					return () => {
						patchFaces({ family: null });
					};
				}, "ui-skin-center: family pluginManager bridge");
			});
			ctx.inject(["pluginNavigation"], (inner) => {
				inner.effect(() => {
					patchFaces({ navigation: inner.get("pluginNavigation") ?? null });
					return () => {
						patchFaces({ navigation: null });
					};
				}, "ui-skin-center: official pluginNavigation bridge");
			});
		}
		/**
		* Install one spec through whichever management face is available.
		*
		* The official in-process manager is preferred whenever it is published: it is
		* the same call the official Plugins page makes and the only writer on the
		* packaged Desktop client. The family face is the fallback.
		*
		* @param spec - validated package spec.
		* @param requestId - id the run is tracked under.
		* @returns the outcome; never throws.
		*/
		async function installPluginSpec(spec, requestId) {
			const useNative = faces.native !== null && typeof faces.native.installBundle === "function";
			const useFamily = faces.family !== null && typeof faces.family.install === "function";
			if (!isInstallSpecValid(spec)) return {
				kind: "failed",
				message: "invalid install spec"
			};
			if (!useNative && !useFamily) return { kind: "no-manager" };
			try {
				if (useNative) {
					const result = await faces.native.installBundle(spec, {
						enabled: true,
						requestId
					});
					if (result !== null && typeof result === "object" && result.ok === false) {
						const error = result.error;
						return {
							kind: "failed",
							message: error?.message ?? error?.code ?? "install failed"
						};
					}
					return { kind: "installed" };
				}
				await faces.family.install(spec);
				return { kind: "installed" };
			} catch (error) {
				return {
					kind: "failed",
					message: error instanceof Error ? error.message : String(error)
				};
			}
		}
		//#endregion
		//#region \0dsh-css:src/client/skin-center.module.css.mjs
		const css = "body[data-dsh-skin-center] .TJMolG_sectionList{margin:0;padding:0;list-style:none;container-type:inline-size}body[data-dsh-skin-center] .TJMolG_pluginCard{list-style:none}body[data-dsh-skin-center] .TJMolG_cardHeaderStatic{align-items:center;gap:12px;width:100%;padding:0 0 4px;display:flex}body[data-dsh-skin-center] .TJMolG_headText{flex-direction:column;flex:1;gap:6px;min-width:0;display:flex}body[data-dsh-skin-center] .TJMolG_pluginName{color:var(--dsw-alias-label-primary);align-items:baseline;gap:8px;font-size:15px;font-weight:600;line-height:1.4;display:flex}body[data-dsh-skin-center] .TJMolG_cardDescription{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}body[data-dsh-skin-center] .TJMolG_cardBody{flex-direction:column;align-items:stretch;gap:0;margin:0;padding:0;display:flex}body[data-dsh-skin-center] .TJMolG_cardBody>*{min-width:0}body[data-dsh-skin-center] .TJMolG_pluginLooks{flex-direction:column;gap:10px;padding:4px 0 16px;display:flex}body[data-dsh-skin-center] .TJMolG_groupHeading{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;font-weight:600;line-height:18px}body[data-dsh-skin-center] .TJMolG_pluginLookGrid{grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:12px;display:grid}body[data-dsh-skin-center] .TJMolG_pluginLookCard{border-radius:10px;gap:8px;padding:14px}body[data-dsh-skin-center] .TJMolG_pluginLookCard>.TJMolG_actions{margin-top:auto}body[data-dsh-skin-center] .TJMolG_pluginLookCard .TJMolG_cardHead{flex-wrap:wrap;row-gap:6px}body[data-dsh-skin-center] .TJMolG_pluginLookCard .TJMolG_cardHead .TJMolG_cardName{min-width:min(100%, max-content);flex:auto}body[data-dsh-skin-center] .TJMolG_headPills{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px;margin-left:auto;display:flex}body[data-dsh-skin-center] .TJMolG_headPills :is(.TJMolG_delegatedBadge,.TJMolG_badge){white-space:nowrap;flex:none;margin-left:0}body[data-dsh-skin-center] .TJMolG_pluginLookMark{background:var(--dsw-alias-brand-primary,#2b7cd9)}body[data-dsh-skin-center] .TJMolG_delegatedCard{overflow:hidden}body[data-dsh-skin-center] .TJMolG_delegatedBadge{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500}body[data-dsh-skin-center] .TJMolG_delegatedDescription{color:var(--dsw-alias-label-secondary,#6b7280);margin:0;font-size:12px;line-height:1.6}body[data-dsh-skin-center] .TJMolG_delegatedStatus{color:var(--dsw-alias-label-secondary,#6b7280);margin:0;font-size:12px;line-height:1.5}body[data-dsh-skin-center] .TJMolG_delegatedLink{color:var(--dsw-alias-brand-primary,#1e63b8);align-self:flex-start;font-size:12px}body[data-dsh-skin-center] .TJMolG_externalWallpaperNotice{border-left:2px solid var(--dsw-alias-state-warning-primary,#b06000);flex-direction:column;gap:8px;padding:8px 0 8px 14px;display:flex}body[data-dsh-skin-center] .TJMolG_externalWallpaperTitle{color:var(--dsw-alias-state-warning-primary,#b06000);font-size:14px;font-weight:400;line-height:22px}body[data-dsh-skin-center] .TJMolG_externalWallpaperBody{max-width:62ch;color:var(--dsw-alias-label-secondary,#6b7280);margin:0;font-size:12px;line-height:18px}body[data-dsh-skin-center] .TJMolG_externalWallpaperCommand{white-space:nowrap;max-width:100%;font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Menlo, monospace);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;align-self:flex-start;padding:4px 8px;font-size:12px;overflow-x:auto}body[data-dsh-skin-center] .TJMolG_head{flex-direction:column;gap:6px;padding:6px 0 0;display:flex}body[data-dsh-skin-center] .TJMolG_titleBadge{color:var(--dsw-alias-label-secondary,#6b7280);font-size:11px;font-weight:500}body[data-dsh-skin-center] .TJMolG_themeRow{align-items:center;gap:8px;margin-top:2px;display:flex}body[data-dsh-skin-center] .TJMolG_themeLabel{color:var(--dsw-alias-label-secondary,#6b7280);margin-right:2px;font-size:12px}body[data-dsh-skin-center] .TJMolG_themeButton{font:inherit;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;line-height:1.5;transition:background .12s,border-color .12s,color .12s}body[data-dsh-skin-center] .TJMolG_themeButton:hover{border-color:var(--dsw-alias-label-dimmed)}body[data-dsh-skin-center] .TJMolG_themeButton:active{border-color:var(--dsw-alias-brand-primary,#2b7cd9);background:var(--dsw-alias-button-primary-dimmed,#e8f1fc);color:var(--dsw-alias-brand-primary,#1e63b8)}body[data-dsh-skin-center] .TJMolG_themeButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2b7cd9);outline-offset:2px}body[data-dsh-skin-center] .TJMolG_themeButtonActive{border-color:var(--dsw-alias-brand-primary,#2b7cd9);background:var(--dsw-alias-button-primary-dimmed,#e8f1fc);color:var(--dsw-alias-brand-primary,#1e63b8)}body[data-dsh-skin-center] .TJMolG_segmentGroup{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:9px;flex-wrap:wrap;align-items:center;gap:2px;padding:2px;display:inline-flex;position:relative}body[data-dsh-skin-center] .TJMolG_segmentGroup .TJMolG_segmentPill{background:color-mix(in srgb, var(--dsw-alias-label-primary) 9%, var(--dsw-alias-bg-layer-2));box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent), 0 1px 2px #0000001a;pointer-events:none;border-radius:6px;transition:transform .24s cubic-bezier(.22,.61,.36,1),width .24s cubic-bezier(.22,.61,.36,1),height .24s cubic-bezier(.22,.61,.36,1);position:absolute;top:0;left:0}body[data-dsh-skin-center] .TJMolG_segmentGroup .TJMolG_segmentButton{z-index:1;position:relative}body[data-dsh-skin-center] .TJMolG_segmentButton{appearance:none;color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border:0;border-radius:6px;margin:0;padding:4px 13px;font-size:12px;font-weight:500;line-height:18px;transition:background-color .12s,color .12s,box-shadow .12s}body[data-dsh-skin-center] .TJMolG_segmentButton:hover:not(:disabled):not(.TJMolG_segmentButtonActive){color:var(--dsw-alias-label-primary);background:color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent)}body[data-dsh-skin-center] .TJMolG_segmentButtonActive{color:var(--dsw-alias-label-primary);background:color-mix(in srgb, var(--dsw-alias-label-primary) 9%, var(--dsw-alias-bg-layer-2));box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent), 0 1px 2px #0000001a}body[data-dsh-skin-center] .TJMolG_segmentGroup:has(.TJMolG_segmentPill) .TJMolG_segmentButtonActive{box-shadow:none;background:0 0}body[data-dsh-skin-center] .TJMolG_segmentButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2b7cd9);outline-offset:1px}body[data-dsh-skin-center] .TJMolG_segmentButton:disabled{color:var(--dsw-alias-label-tertiary,#9aa4b5);cursor:default;opacity:.65}body[data-dsh-skin-center] .TJMolG_list{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding-top:16px;display:flex}body[data-dsh-skin-center] .TJMolG_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:8px;flex-direction:column;gap:6px;padding:12px;transition:border-color .16s;display:flex}body[data-dsh-skin-center] .TJMolG_card:hover{border-color:var(--dsw-alias-label-dimmed)}body[data-dsh-skin-center] .TJMolG_skinGrid{grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));gap:20px 16px;display:grid}body[data-dsh-skin-center] .TJMolG_skinCard{gap:8px;padding:14px}body[data-dsh-skin-center] .TJMolG_skinCard .TJMolG_actions{margin-top:auto}body[data-dsh-skin-center] .TJMolG_skinCard .TJMolG_cardTagline{-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.9em;display:-webkit-box;overflow:hidden}body[data-dsh-skin-center] .TJMolG_thumbWrap{aspect-ratio:16/9;background:var(--dsw-alias-bg-layer-2);border-radius:6px;position:relative;overflow:hidden}body[data-dsh-skin-center] .TJMolG_thumb{object-fit:cover;width:100%;height:100%;display:block}body[data-dsh-skin-center] .TJMolG_thumbEmpty{background:linear-gradient(135deg, var(--dsw-alias-bg-layer-3), var(--dsw-alias-bg-layer-1));width:100%;height:100%}body[data-dsh-skin-center] .TJMolG_thumbWrap .TJMolG_badge{margin-left:0;position:absolute;top:6px;right:6px}body[data-dsh-skin-center] .TJMolG_thumbWrap .TJMolG_thumbReport{left:6px;right:auto}body[data-dsh-skin-center] .TJMolG_cardHead{align-items:center;gap:10px;min-width:0;display:flex}body[data-dsh-skin-center] .TJMolG_swatch{width:14px;height:14px;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l4,#0f172a1f);border-radius:50%;flex:none}body[data-dsh-skin-center] .TJMolG_cardName{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:13px;font-weight:600;overflow:hidden}body[data-dsh-skin-center] .TJMolG_cardTagline{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:1.45}body[data-dsh-skin-center] .TJMolG_badge{letter-spacing:.02em;border-radius:999px;flex:none;min-width:0;margin-left:auto;padding:2px 8px;font-size:11px;font-weight:600}body[data-dsh-skin-center] .TJMolG_badgeActive{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-state-success-tertiary);border:1px solid var(--dsw-alias-state-success-primary)}body[data-dsh-skin-center] .TJMolG_badgeTrying{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-primary-dimmed);border:1px solid var(--dsw-alias-brand-primary)}body[data-ds-dark-theme][data-dsh-skin-center] .TJMolG_badgeTrying{background:var(--dsw-alias-state-business-tertiary)}body[data-dsh-skin-center] .TJMolG_actions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}body[data-dsh-skin-center] .TJMolG_button{font:inherit;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;line-height:1.5;transition:background .12s,border-color .12s,color .12s}body[data-dsh-skin-center] .TJMolG_button:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed)}body[data-dsh-skin-center] .TJMolG_button:active:not(:disabled){border-color:var(--dsw-alias-button-primary-hover,#1e63b8);background:var(--dsw-alias-button-primary-dimmed,#e8f1fc);color:var(--dsw-alias-brand-primary,#1e63b8)}body[data-dsh-skin-center] .TJMolG_button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2b7cd9);outline-offset:2px}body[data-dsh-skin-center] .TJMolG_buttonPrimary{border-color:var(--dsw-alias-button-info-fill);background:var(--dsw-alias-button-info-fill);color:var(--dsw-alias-bg-layer-3)}body[data-dsh-skin-center] .TJMolG_buttonPrimary:hover:not(:disabled),body[data-dsh-skin-center] .TJMolG_buttonPrimary:active:not(:disabled){opacity:.88}body[data-dsh-skin-center] .TJMolG_buttonDanger{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-state-danger-primary,#d93025);background:0 0}body[data-dsh-skin-center] .TJMolG_buttonDanger:hover:not(:disabled){border-color:var(--dsw-alias-state-danger-primary,#d93025);background:var(--dsw-alias-state-danger-tertiary,#d9302514)}body[data-dsh-skin-center] .TJMolG_buttonDangerConfirm{border-color:var(--dsw-alias-state-danger-primary,#d93025);background:var(--dsw-alias-state-danger-primary,#d93025);color:#fff}body[data-dsh-skin-center] .TJMolG_toolbar{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin:4px 0 2px;display:flex}body[data-dsh-skin-center] .TJMolG_actionRow{flex-wrap:wrap;align-items:center;gap:8px;display:flex}body[data-dsh-skin-center] .TJMolG_verifySummary{padding:6px 0;font-size:12px;line-height:1.4}body[data-dsh-skin-center] .TJMolG_verifySummarySuccess{color:var(--dsw-alias-state-success-primary,#0f6b3a);border-color:var(--dsw-alias-state-success-tertiary,#dcf3e5)}body[data-dsh-skin-center] .TJMolG_verifySummaryWarning{color:var(--dsw-alias-state-warning-primary,#b06000);border-color:var(--dsw-alias-state-warning-tertiary,#feebd3)}body[data-dsh-skin-center] .TJMolG_badgeSuccess{color:var(--dsw-alias-state-success-primary,#0f6b3a);background:var(--dsw-alias-state-success-tertiary,#dcf3e5)}body[data-dsh-skin-center] .TJMolG_badgeWarning{color:var(--dsw-alias-state-warning-primary,#b06000);background:var(--dsw-alias-state-warning-tertiary,#feebd3)}body[data-dsh-skin-center] .TJMolG_badgeDanger{color:var(--dsw-alias-state-danger-primary,#d93025);background:var(--dsw-alias-state-danger-tertiary,#d930251f)}body[data-dsh-skin-center] .TJMolG_integrityNote{color:var(--dsw-alias-state-warning-primary,#b06000);font-size:11px;line-height:1.4}body[data-dsh-skin-center] .TJMolG_buttonGhost{opacity:.5;background:0 0;border-color:#0000}body[data-dsh-skin-center] .TJMolG_button:disabled{opacity:.5;cursor:default}body[data-dsh-skin-center] .TJMolG_error{color:var(--dsw-alias-state-error-primary,#b42318);font-size:12px}body[data-dsh-skin-center] .TJMolG_enableRow{border-bottom:1px solid var(--dsw-alias-border-l2);grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:4px 16px;padding:16px 0;display:grid}body[data-dsh-skin-center] .TJMolG_enableRow .TJMolG_switch{grid-area:1/2}body[data-dsh-skin-center] .TJMolG_enableLabel{color:var(--dsw-alias-label-primary);grid-area:1/1;font-size:14px;font-weight:400;line-height:22px}body[data-dsh-skin-center] .TJMolG_enableHint{min-width:0;color:var(--dsw-alias-label-secondary,#6b7280);grid-area:2/1;margin:0;font-size:12px;line-height:18px}body[data-dsh-skin-center] .TJMolG_switch{border:1px solid var(--dsw-alias-border-l3,#cbd5e1);background:var(--dsw-alias-bg-layer-3,#e2e8f0);cursor:pointer;border-radius:999px;flex:none;align-items:center;width:40px;height:22px;padding:2px;transition:background .12s,border-color .12s;display:inline-flex;position:relative}body[data-dsh-skin-center] .TJMolG_switchOn{border-color:var(--dsw-alias-brand-primary,#2b7cd9);background:var(--dsw-alias-brand-primary,#2b7cd9)}body[data-dsh-skin-center] .TJMolG_switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2b7cd9);outline-offset:2px}body[data-dsh-skin-center] .TJMolG_switchThumb{background:var(--dsw-alias-label-primary-foreground,#fff);width:18px;height:18px;box-shadow:0 0 0 1px var(--dsw-alias-border-l4,#0f172a1f);border-radius:50%;transition:transform .12s;display:block;transform:translate(0)}body[data-dsh-skin-center] .TJMolG_switchOn .TJMolG_switchThumb{transform:translate(18px)}body[data-dsh-skin-center] .TJMolG_offNote{color:var(--dsw-alias-label-secondary,#6b7280);margin:0;font-size:12.5px;line-height:1.5}body[data-dsh-skin-center] .TJMolG_backgroundRow{flex-direction:column;gap:6px;padding:16px 0;display:flex}body[data-dsh-skin-center] .TJMolG_head+.TJMolG_backgroundRow,body[data-dsh-skin-center] .TJMolG_backgroundRow+.TJMolG_backgroundRow{border-top:1px solid var(--dsw-alias-border-l2)}body[data-dsh-skin-center] .TJMolG_backgroundHead{align-items:center;gap:8px;display:flex}body[data-dsh-skin-center] .TJMolG_backgroundLabel{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}body[data-dsh-skin-center] .TJMolG_backgroundValue{font-variant-numeric:tabular-nums;color:var(--dsw-alias-brand-primary,#2b7cd9);flex:none;margin-left:auto;font-size:12px;line-height:18px}body[data-dsh-skin-center] .TJMolG_stepperControl{flex:none;align-items:center;gap:8px;margin-left:auto;display:flex}body[data-dsh-skin-center] .TJMolG_stepper{background:color-mix(in srgb, var(--dsw-alias-label-primary,#131416) 4.5%, transparent);min-width:72px;height:36px;color:var(--dsw-alias-label-primary,#131416);border-radius:12px;align-items:center;display:flex}body[data-dsh-skin-center] .TJMolG_stepperValue{text-align:center;font-variant-numeric:tabular-nums;min-width:18px;padding-left:18px;font-size:14px;line-height:22px}body[data-dsh-skin-center] .TJMolG_stepperArrows{flex-direction:column;gap:2px;height:26px;margin-left:2px;display:flex}body[data-dsh-skin-center] .TJMolG_stepperArrow{appearance:none;background:color-mix(in srgb, var(--dsw-alias-label-primary,#131416) 3%, transparent);width:17px;height:12px;color:var(--dsw-alias-label-primary,#131416);cursor:pointer;border:0;border-radius:4px;justify-content:center;align-items:center;padding:0;display:flex}body[data-dsh-skin-center] .TJMolG_stepperArrow:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-label-primary,#131416) 9%, transparent)}body[data-dsh-skin-center] .TJMolG_stepperArrow:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2b7cd9);outline-offset:1px}body[data-dsh-skin-center] .TJMolG_stepperArrow:disabled{opacity:.35;cursor:default}body[data-dsh-skin-center] .TJMolG_stepperUnit{color:var(--dsw-alias-label-secondary,#656869);font-size:14px;line-height:22px}body[data-dsh-skin-center] .TJMolG_rangeAnchor{display:inline-flex;position:relative}body[data-dsh-skin-center] .TJMolG_rangeBubble{z-index:40;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);width:220px;box-shadow:0 8px 24px var(--dsw-alias-bg-mask-2,#0000002e);opacity:0;visibility:hidden;border-radius:10px;padding:10px 12px 6px;transition:opacity .12s,transform .12s,visibility 0s linear .12s;position:absolute;right:0}body[data-dsh-skin-center] .TJMolG_rangeBubble[data-side=above]{bottom:calc(100% + 6px);transform:translateY(4px)}body[data-dsh-skin-center] .TJMolG_rangeBubble[data-side=below]{top:calc(100% + 6px);transform:translateY(-4px)}body[data-dsh-skin-center] .TJMolG_rangeBubble[data-open]{opacity:1;visibility:visible;transition:opacity .12s,transform .12s,visibility;transform:none}body[data-dsh-skin-center] .TJMolG_rangeSlider{appearance:none;cursor:pointer;background:0 0;width:100%;height:18px;margin:0;display:block}body[data-dsh-skin-center] .TJMolG_rangeSlider::-webkit-slider-runnable-track{background:linear-gradient(to right, var(--dsw-alias-brand-primary,#2b7cd9) var(--range-fill,0%), color-mix(in srgb, var(--dsw-alias-label-primary,#131416) 12%, transparent) var(--range-fill,0%));border-radius:999px;height:4px}body[data-dsh-skin-center] .TJMolG_rangeSlider::-moz-range-track{background:color-mix(in srgb, var(--dsw-alias-label-primary,#131416) 12%, transparent);border-radius:999px;height:4px}body[data-dsh-skin-center] .TJMolG_rangeSlider::-moz-range-progress{background:var(--dsw-alias-brand-primary,#2b7cd9);border-radius:999px;height:4px}body[data-dsh-skin-center] .TJMolG_rangeSlider::-webkit-slider-thumb{appearance:none;background:#fff;border:0;border-radius:50%;width:14px;height:14px;margin-top:-5px;transition:transform .12s;box-shadow:0 0 0 1px #0000001f,0 1px 3px #00000040}body[data-dsh-skin-center] .TJMolG_rangeSlider::-moz-range-thumb{background:#fff;border:0;border-radius:50%;width:14px;height:14px;box-shadow:0 0 0 1px #0000001f,0 1px 3px #00000040}body[data-dsh-skin-center] .TJMolG_rangeSlider:active::-webkit-slider-thumb{transform:scale(1.15)}body[data-dsh-skin-center] .TJMolG_rangeSlider:focus-visible{outline:none}body[data-dsh-skin-center] .TJMolG_rangeSlider:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary,#2b7cd9)}body[data-dsh-skin-center] .TJMolG_rangeSlider:disabled{cursor:not-allowed}body[data-dsh-skin-center] .TJMolG_rangeEnds{color:var(--dsw-alias-label-secondary,#656869);font-variant-numeric:tabular-nums;justify-content:space-between;margin-top:2px;font-size:11px;line-height:16px;display:flex}body[data-dsh-skin-center] .TJMolG_backgroundRange{background:var(--dsw-alias-label-tertiary,#9aa4b5);background:color-mix(in srgb, var(--dsw-alias-label-tertiary,#9aa4b5) 45%, transparent);width:100%;height:4px;box-shadow:0 0 0 1px var(--dsw-alias-border-l3,#cbd5e1);-webkit-appearance:none;appearance:none;cursor:pointer;border-radius:999px;margin:0}body[data-dsh-skin-center] .TJMolG_backgroundRange::-webkit-slider-runnable-track{background:var(--dsw-alias-bg-layer-3,#e2e8f0);border-radius:999px;height:4px}body[data-dsh-skin-center] .TJMolG_backgroundRange::-moz-range-track{background:var(--dsw-alias-bg-layer-3,#e2e8f0);border-radius:999px;height:4px}body[data-dsh-skin-center] .TJMolG_backgroundRange::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;border:2px solid var(--dsw-alias-label-primary-foreground,#fff);background:var(--dsw-alias-brand-primary,#2b7cd9);width:14px;height:14px;box-shadow:0 0 0 1px var(--dsw-alias-border-l4,#0f172a1f);cursor:pointer;border-radius:50%;margin-top:-5px}body[data-dsh-skin-center] .TJMolG_backgroundRange::-moz-range-thumb{border:2px solid var(--dsw-alias-label-primary-foreground,#fff);background:var(--dsw-alias-brand-primary,#2b7cd9);width:12px;height:12px;box-shadow:0 0 0 1px var(--dsw-alias-border-l4,#0f172a1f);cursor:pointer;border-radius:50%}body[data-dsh-skin-center] .TJMolG_backgroundRange:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2b7cd9);outline-offset:2px}body[data-dsh-skin-center] .TJMolG_backgroundHint{color:var(--dsw-alias-label-secondary,#6b7280);margin:0;font-size:12px;line-height:18px}body[data-dsh-skin-center] .TJMolG_backgroundHintMuted{color:var(--dsw-alias-label-tertiary,#9aa4b5);margin:0;font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){body[data-dsh-skin-center] .TJMolG_pluginCard,body[data-dsh-skin-center] .TJMolG_card,body[data-dsh-skin-center] .TJMolG_themeButton,body[data-dsh-skin-center] .TJMolG_button,body[data-dsh-skin-center] .TJMolG_switch,body[data-dsh-skin-center] .TJMolG_switchThumb,body[data-dsh-skin-center] .TJMolG_rangeBubble{transition:none}}body[data-dsh-skin-center] .TJMolG_wallpaperSection{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding-top:10px;display:flex}body[data-dsh-skin-center] .TJMolG_wallpaperStatus{color:var(--dsw-alias-label-secondary,#6b7280);align-items:center;gap:8px;font-size:12px;display:flex}body[data-dsh-skin-center] .TJMolG_wallpaperStatusError{color:var(--dsw-alias-state-danger,#c53030)}body[data-dsh-skin-center] .TJMolG_wallpaperControls{flex-direction:column;gap:10px;display:flex}body[data-dsh-skin-center] .TJMolG_wallpaperGrid{grid-template-columns:repeat(auto-fill,minmax(min(180px,100%),1fr));gap:10px;display:grid}body[data-dsh-skin-center] .TJMolG_wallpaperCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:8px;flex-direction:column;gap:6px;padding:8px;transition:border-color .16s;display:flex}body[data-dsh-skin-center] .TJMolG_wallpaperCard:hover{border-color:var(--dsw-alias-label-dimmed)}body[data-dsh-skin-center] .TJMolG_wallpaperThumbWrap{aspect-ratio:16/9;background:var(--dsw-alias-bg-layer-1,#f1f5f9);border-radius:6px;position:relative;overflow:hidden}body[data-dsh-skin-center] .TJMolG_wallpaperThumb{object-fit:cover;width:100%;height:100%;display:block}body[data-dsh-skin-center] .TJMolG_wallpaperThumbEmpty{width:100%;height:100%}body[data-dsh-skin-center] .TJMolG_wallpaperType{color:var(--dsw-alias-label-primary,#172a45);background:var(--dsw-alias-bg-layer-2,#ffffffd9);border-radius:4px;padding:3px 6px;font-size:10.5px;line-height:1;position:absolute;top:6px;left:6px}body[data-dsh-skin-center] .TJMolG_wallpaperThumbWrap .TJMolG_badge{position:absolute;top:6px;right:6px}body[data-dsh-skin-center] .TJMolG_wallpaperName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.35;overflow:hidden}body[data-dsh-skin-center] .TJMolG_wallpaperActions{flex-wrap:wrap;gap:6px;display:flex}body[data-dsh-skin-center] .TJMolG_customThemeCard{overflow:hidden}body[data-dsh-skin-center] .TJMolG_customThemeEditor{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:14px;margin:0;padding:14px 0 2px;display:flex}body[data-dsh-skin-center] .TJMolG_customThemeScheme{flex-wrap:wrap;align-items:center;gap:8px;display:flex}body[data-dsh-skin-center] .TJMolG_customThemeFields{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;display:grid}body[data-dsh-skin-center] .TJMolG_customThemeField,body[data-dsh-skin-center] .TJMolG_customThemeContrast{flex-direction:column;gap:7px;min-width:0;display:flex}body[data-dsh-skin-center] .TJMolG_customThemeFieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500}body[data-dsh-skin-center] .TJMolG_customThemeInputRow{align-items:center;gap:7px;min-width:0;display:flex}body[data-dsh-skin-center] .TJMolG_customThemeColor{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;border-radius:7px;flex:none;width:34px;height:30px;padding:2px}body[data-dsh-skin-center] .TJMolG_customThemeHex{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major);width:100%;min-width:0;height:30px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:7px;outline:none;padding:0 9px;font-size:12px}body[data-dsh-skin-center] .TJMolG_customThemeHex:focus,body[data-dsh-skin-center] .TJMolG_customThemeColor:focus-visible{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px var(--dsw-alias-button-primary-dimmed)}body[data-dsh-skin-center] .TJMolG_customThemeFooter{justify-content:space-between;align-items:center;gap:12px;padding-top:2px;display:flex}@media (width<=680px){body[data-dsh-skin-center] .TJMolG_customThemeFields{grid-template-columns:1fr}body[data-dsh-skin-center] .TJMolG_customThemeFooter{flex-direction:column;align-items:flex-start}}body[data-dsh-skin-center] .TJMolG_wallpaperToolbar{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin:8px 0;display:flex}body[data-dsh-skin-center] .TJMolG_ratingFilterGroup{align-items:center;gap:4px;display:flex}body[data-dsh-skin-center] .TJMolG_ratingFilterButton{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:6px;padding:4px 10px;font-size:12px;transition:all .15s}body[data-dsh-skin-center] .TJMolG_ratingFilterButton:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff14);color:var(--dsw-alias-label-primary)}body[data-dsh-skin-center] .TJMolG_ratingFilterActive{background:var(--dsw-alias-brand-primary,#2563eb);color:#fff;border-color:#0000}body[data-dsh-skin-center] .TJMolG_ratingFilterActive:hover{background:var(--dsw-alias-brand-primary,#2563eb);color:#fff}body[data-dsh-skin-center] .TJMolG_wallpaperRating{text-transform:uppercase;border-radius:4px;padding:3px 6px;font-size:10px;font-weight:600;line-height:1;position:absolute;bottom:6px;right:6px}body[data-dsh-skin-center] .TJMolG_ratingG{color:var(--dsw-alias-label-secondary,#94a3b8);background:var(--dsw-alias-bg-layer-2,#0009)}body[data-dsh-skin-center] .TJMolG_ratingPg13{color:#fbbf24;background:#000000b3;border:1px solid #fbbf2466}body[data-dsh-skin-center] .TJMolG_ratingR18{color:#fff;background:#dc2626;font-weight:700;box-shadow:0 1px 4px #dc262666}body[data-dsh-skin-center] .TJMolG_wallpaperPagination{flex-wrap:wrap;justify-content:center;align-items:center;gap:6px;margin:16px 0 8px;display:flex}body[data-dsh-skin-center] .TJMolG_pageButton{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:center;border-radius:6px;min-width:30px;padding:4px 10px;font-size:12px;transition:all .15s}body[data-dsh-skin-center] .TJMolG_pageButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#ffffff14);color:var(--dsw-alias-label-primary)}body[data-dsh-skin-center] .TJMolG_pageButton:disabled{opacity:.4;cursor:not-allowed}body[data-dsh-skin-center] .TJMolG_pageButtonActive{background:var(--dsw-alias-brand-primary,#2563eb);color:#fff;border-color:#0000}body[data-dsh-skin-center] .TJMolG_pageEllipsis{color:var(--dsw-alias-label-dimmed,#888);user-select:none;padding:0 4px;font-size:12px}body[data-dsh-skin-center] .TJMolG_pageJumpForm{align-items:center;gap:4px;margin-left:8px;display:inline-flex}body[data-dsh-skin-center] .TJMolG_pageJumpInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major,#0003);width:44px;height:26px;color:var(--dsw-alias-label-primary);text-align:center;border-radius:6px;outline:none;padding:0 4px;font-size:12px}body[data-dsh-skin-center] .TJMolG_pageJumpInput:focus{border-color:var(--dsw-alias-brand-primary)}body[data-dsh-skin-center] .TJMolG_pageTotalInfo{color:var(--dsw-alias-label-dimmed,#888);margin-left:6px;font-size:12px}body[data-dsh-skin-center] .TJMolG_wallpaperDirs{flex-direction:column;gap:6px;display:flex}body[data-dsh-skin-center] .TJMolG_wallpaperDir{background:var(--dsw-alias-bg-layer-2,#7f7f7f14);border-radius:6px;align-items:center;gap:6px;padding:4px 6px;display:flex}body[data-dsh-skin-center] .TJMolG_wallpaperDirPath{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;overflow:hidden}body[data-dsh-skin-center] .TJMolG_wallpaperDirRemove{width:20px;height:20px;color:var(--dsw-alias-label-secondary,#6b7280);cursor:pointer;background:0 0;border:0;border-radius:4px;flex:none;font-size:13px;line-height:1}body[data-dsh-skin-center] .TJMolG_wallpaperDirRemove:hover{color:var(--dsw-alias-state-danger,#c53030)}body[data-dsh-skin-center] .TJMolG_wallpaperDirAdd{align-items:center;gap:6px;display:flex}body[data-dsh-skin-center] .TJMolG_wallpaperDirInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-input-major,#0003);min-width:0;height:28px;color:var(--dsw-alias-label-primary);border-radius:6px;outline:none;flex:1;padding:0 8px;font-size:12px}body[data-dsh-skin-center] .TJMolG_wallpaperDirInput:focus{border-color:var(--dsw-alias-brand-primary)}body[data-dsh-skin-center] .TJMolG_dirBrowserOverlay{z-index:60;background:#0000006b;justify-content:center;align-items:center;padding:16px;display:flex;position:fixed;inset:0}body[data-dsh-skin-center] .TJMolG_dirBrowser{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1,#1c1c1e);width:min(520px,100%);max-height:min(72vh,560px);color:var(--dsw-alias-label-primary);border-radius:12px;outline:none;flex-direction:column;gap:10px;padding:14px;display:flex;box-shadow:0 18px 48px #00000047}body[data-dsh-skin-center] .TJMolG_dirBrowserTitle{font-size:13px;font-weight:600}body[data-dsh-skin-center] .TJMolG_dirBrowserCrumbs{color:var(--dsw-alias-label-secondary,#6b7280);flex-wrap:wrap;align-items:center;gap:2px;font-size:12px;display:flex}body[data-dsh-skin-center] .TJMolG_dirBrowserCrumb{align-items:center;gap:2px;max-width:180px;display:inline-flex}body[data-dsh-skin-center] .TJMolG_dirBrowserCrumbSep{color:var(--dsw-alias-label-dimmed,#888)}body[data-dsh-skin-center] .TJMolG_dirBrowserCrumbButton{max-width:100%;color:inherit;cursor:pointer;text-overflow:ellipsis;white-space:nowrap;background:0 0;border:0;border-radius:4px;padding:2px 4px;font-size:12px;overflow:hidden}body[data-dsh-skin-center] .TJMolG_dirBrowserCrumbButton:hover{background:var(--dsw-alias-bg-layer-2,#7f7f7f1f);color:var(--dsw-alias-label-primary)}body[data-dsh-skin-center] .TJMolG_dirBrowserList{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;flex-direction:column;flex:1;gap:2px;min-height:140px;padding:4px;display:flex;overflow:auto}body[data-dsh-skin-center] .TJMolG_dirBrowserEntry{color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;text-overflow:ellipsis;white-space:nowrap;background:0 0;border:0;border-radius:6px;padding:7px 8px;font-size:12.5px;overflow:hidden}body[data-dsh-skin-center] .TJMolG_dirBrowserEntry:hover{background:var(--dsw-alias-bg-layer-2,#7f7f7f1f)}body[data-dsh-skin-center] .TJMolG_dirBrowserNote{color:var(--dsw-alias-label-secondary,#6b7280);padding:6px 8px;font-size:12px}body[data-dsh-skin-center] .TJMolG_dirBrowserError{color:var(--dsw-alias-state-danger,#c53030);word-break:break-all;padding:6px 8px;font-size:12px}body[data-dsh-skin-center] .TJMolG_dirBrowserHidden{color:var(--dsw-alias-label-secondary,#6b7280);cursor:pointer;align-items:center;gap:6px;font-size:12px;display:flex}body[data-dsh-skin-center] .TJMolG_dirBrowserActions{justify-content:flex-end;gap:8px;display:flex}";
		const tagId = "@linxin666/dsh-client-ui-skin-center/src/client/skin-center.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@linxin666/dsh-client-ui-skin-center";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var skin_center_module_css_default = {
			"actionRow": "TJMolG_actionRow",
			"actions": "TJMolG_actions",
			"backgroundHead": "TJMolG_backgroundHead",
			"backgroundHint": "TJMolG_backgroundHint",
			"backgroundHintMuted": "TJMolG_backgroundHintMuted",
			"backgroundLabel": "TJMolG_backgroundLabel",
			"backgroundRange": "TJMolG_backgroundRange",
			"backgroundRow": "TJMolG_backgroundRow",
			"backgroundValue": "TJMolG_backgroundValue",
			"badge": "TJMolG_badge",
			"badgeActive": "TJMolG_badgeActive",
			"badgeDanger": "TJMolG_badgeDanger",
			"badgeSuccess": "TJMolG_badgeSuccess",
			"badgeTrying": "TJMolG_badgeTrying",
			"badgeWarning": "TJMolG_badgeWarning",
			"button": "TJMolG_button",
			"buttonDanger": "TJMolG_buttonDanger",
			"buttonDangerConfirm": "TJMolG_buttonDangerConfirm",
			"buttonGhost": "TJMolG_buttonGhost",
			"buttonPrimary": "TJMolG_buttonPrimary",
			"card": "TJMolG_card",
			"cardBody": "TJMolG_cardBody",
			"cardDescription": "TJMolG_cardDescription",
			"cardHead": "TJMolG_cardHead",
			"cardHeaderStatic": "TJMolG_cardHeaderStatic",
			"cardName": "TJMolG_cardName",
			"cardTagline": "TJMolG_cardTagline",
			"customThemeCard": "TJMolG_customThemeCard",
			"customThemeColor": "TJMolG_customThemeColor",
			"customThemeContrast": "TJMolG_customThemeContrast",
			"customThemeEditor": "TJMolG_customThemeEditor",
			"customThemeField": "TJMolG_customThemeField",
			"customThemeFieldLabel": "TJMolG_customThemeFieldLabel",
			"customThemeFields": "TJMolG_customThemeFields",
			"customThemeFooter": "TJMolG_customThemeFooter",
			"customThemeHex": "TJMolG_customThemeHex",
			"customThemeInputRow": "TJMolG_customThemeInputRow",
			"customThemeScheme": "TJMolG_customThemeScheme",
			"delegatedBadge": "TJMolG_delegatedBadge",
			"delegatedCard": "TJMolG_delegatedCard",
			"delegatedDescription": "TJMolG_delegatedDescription",
			"delegatedLink": "TJMolG_delegatedLink",
			"delegatedStatus": "TJMolG_delegatedStatus",
			"dirBrowser": "TJMolG_dirBrowser",
			"dirBrowserActions": "TJMolG_dirBrowserActions",
			"dirBrowserCrumb": "TJMolG_dirBrowserCrumb",
			"dirBrowserCrumbButton": "TJMolG_dirBrowserCrumbButton",
			"dirBrowserCrumbSep": "TJMolG_dirBrowserCrumbSep",
			"dirBrowserCrumbs": "TJMolG_dirBrowserCrumbs",
			"dirBrowserEntry": "TJMolG_dirBrowserEntry",
			"dirBrowserError": "TJMolG_dirBrowserError",
			"dirBrowserHidden": "TJMolG_dirBrowserHidden",
			"dirBrowserList": "TJMolG_dirBrowserList",
			"dirBrowserNote": "TJMolG_dirBrowserNote",
			"dirBrowserOverlay": "TJMolG_dirBrowserOverlay",
			"dirBrowserTitle": "TJMolG_dirBrowserTitle",
			"enableHint": "TJMolG_enableHint",
			"enableLabel": "TJMolG_enableLabel",
			"enableRow": "TJMolG_enableRow",
			"error": "TJMolG_error",
			"externalWallpaperBody": "TJMolG_externalWallpaperBody",
			"externalWallpaperCommand": "TJMolG_externalWallpaperCommand",
			"externalWallpaperNotice": "TJMolG_externalWallpaperNotice",
			"externalWallpaperTitle": "TJMolG_externalWallpaperTitle",
			"groupHeading": "TJMolG_groupHeading",
			"head": "TJMolG_head",
			"headPills": "TJMolG_headPills",
			"headText": "TJMolG_headText",
			"integrityNote": "TJMolG_integrityNote",
			"list": "TJMolG_list",
			"offNote": "TJMolG_offNote",
			"pageButton": "TJMolG_pageButton",
			"pageButtonActive": "TJMolG_pageButtonActive",
			"pageEllipsis": "TJMolG_pageEllipsis",
			"pageJumpForm": "TJMolG_pageJumpForm",
			"pageJumpInput": "TJMolG_pageJumpInput",
			"pageTotalInfo": "TJMolG_pageTotalInfo",
			"pluginCard": "TJMolG_pluginCard",
			"pluginLookCard": "TJMolG_pluginLookCard",
			"pluginLookGrid": "TJMolG_pluginLookGrid",
			"pluginLookMark": "TJMolG_pluginLookMark",
			"pluginLooks": "TJMolG_pluginLooks",
			"pluginName": "TJMolG_pluginName",
			"rangeAnchor": "TJMolG_rangeAnchor",
			"rangeBubble": "TJMolG_rangeBubble",
			"rangeEnds": "TJMolG_rangeEnds",
			"rangeSlider": "TJMolG_rangeSlider",
			"ratingFilterActive": "TJMolG_ratingFilterActive",
			"ratingFilterButton": "TJMolG_ratingFilterButton",
			"ratingFilterGroup": "TJMolG_ratingFilterGroup",
			"ratingG": "TJMolG_ratingG",
			"ratingPg13": "TJMolG_ratingPg13",
			"ratingR18": "TJMolG_ratingR18",
			"sectionList": "TJMolG_sectionList",
			"segmentButton": "TJMolG_segmentButton",
			"segmentButtonActive": "TJMolG_segmentButtonActive",
			"segmentGroup": "TJMolG_segmentGroup",
			"segmentPill": "TJMolG_segmentPill",
			"skinCard": "TJMolG_skinCard",
			"skinGrid": "TJMolG_skinGrid",
			"stepper": "TJMolG_stepper",
			"stepperArrow": "TJMolG_stepperArrow",
			"stepperArrows": "TJMolG_stepperArrows",
			"stepperControl": "TJMolG_stepperControl",
			"stepperUnit": "TJMolG_stepperUnit",
			"stepperValue": "TJMolG_stepperValue",
			"swatch": "TJMolG_swatch",
			"switch": "TJMolG_switch",
			"switchOn": "TJMolG_switchOn",
			"switchThumb": "TJMolG_switchThumb",
			"themeButton": "TJMolG_themeButton",
			"themeButtonActive": "TJMolG_themeButtonActive",
			"themeLabel": "TJMolG_themeLabel",
			"themeRow": "TJMolG_themeRow",
			"thumb": "TJMolG_thumb",
			"thumbEmpty": "TJMolG_thumbEmpty",
			"thumbReport": "TJMolG_thumbReport",
			"thumbWrap": "TJMolG_thumbWrap",
			"titleBadge": "TJMolG_titleBadge",
			"toolbar": "TJMolG_toolbar",
			"verifySummary": "TJMolG_verifySummary",
			"verifySummarySuccess": "TJMolG_verifySummarySuccess",
			"verifySummaryWarning": "TJMolG_verifySummaryWarning",
			"wallpaperActions": "TJMolG_wallpaperActions",
			"wallpaperCard": "TJMolG_wallpaperCard",
			"wallpaperControls": "TJMolG_wallpaperControls",
			"wallpaperDir": "TJMolG_wallpaperDir",
			"wallpaperDirAdd": "TJMolG_wallpaperDirAdd",
			"wallpaperDirInput": "TJMolG_wallpaperDirInput",
			"wallpaperDirPath": "TJMolG_wallpaperDirPath",
			"wallpaperDirRemove": "TJMolG_wallpaperDirRemove",
			"wallpaperDirs": "TJMolG_wallpaperDirs",
			"wallpaperGrid": "TJMolG_wallpaperGrid",
			"wallpaperName": "TJMolG_wallpaperName",
			"wallpaperPagination": "TJMolG_wallpaperPagination",
			"wallpaperRating": "TJMolG_wallpaperRating",
			"wallpaperSection": "TJMolG_wallpaperSection",
			"wallpaperStatus": "TJMolG_wallpaperStatus",
			"wallpaperStatusError": "TJMolG_wallpaperStatusError",
			"wallpaperThumb": "TJMolG_wallpaperThumb",
			"wallpaperThumbEmpty": "TJMolG_wallpaperThumbEmpty",
			"wallpaperThumbWrap": "TJMolG_wallpaperThumbWrap",
			"wallpaperToolbar": "TJMolG_wallpaperToolbar",
			"wallpaperType": "TJMolG_wallpaperType"
		};
		//#endregion
		//#region src/client/ExternalWallpaperNotice.tsx
		/**
		* External Wallpaper Engine plugin pointer (issue #39, migration round).
		*
		* Wallpaper support no longer ships inside the skin center: it is delegated to
		* `dsh-plugin-wallpaper-engine`. This card leads the skin page beside the
		* delegated-skin cards, so the feature stays discoverable where users look.
		* The plugin is a recommended Workshop item, so the card offers a ONE-CLICK
		* INSTALL through whichever plugin-management face the host publishes
		* (see external-wallpaper-install.ts) and falls back to the copy-command line
		* when the host publishes none.
		*
		* Three states, all driven by the read-only host probe
		* (see src/external-wallpaper.ts):
		*  - not installed, with a management face: the recommended badge plus an
		*    Install button;
		*  - not installed, no face: the copy-command fallback;
		*  - installed: states that wallpapers are configured there, and that an
		*    active wallpaper pauses this card's skin.
		*
		* Nothing renders when the probe cannot be reached, so an older host never
		* shows a false "not installed" prompt.
		*/
		/** Host base path of the probe (mirrors src/routes-v2.ts). */
		const EXTERNAL_WALLPAPER_API = "/api/skin-center/v2/external-wallpaper";
		/** Fallbacks used only when the host omits a field. */
		const FALLBACK = {
			packageName: "dsh-plugin-wallpaper-engine",
			repository: "https://github.com/elysia395/dsh-wallpaper-engine",
			installCommand: "dsh plugin --profile web add dsh-plugin-wallpaper-engine",
			npm: "dsh-plugin-wallpaper-engine"
		};
		/** The copyable command line, used when no management face is available. */
		async function copyText$1(text) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {
				return false;
			}
		}
		/**
		* Render the delegated-plugin pointer, or nothing when the probe cannot be
		* reached.
		* @param props - the card's locale seat.
		* @returns the pointer, or null.
		*/
		function ExternalWallpaperNotice({ t }) {
			const [state, setState] = (0, react.useState)(null);
			const faces = (0, react.useSyncExternalStore)(subscribeInstallFaces, getInstallFaces);
			const [installing, setInstalling] = (0, react.useState)(false);
			const [notice, setNotice] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let cancelled = false;
				fetch(EXTERNAL_WALLPAPER_API).then((res) => res.ok ? res.json() : null).then((payload) => {
					if (cancelled || payload?.ok !== true) return;
					setState({
						installed: payload.installed === true,
						packageName: typeof payload.packageName === "string" && payload.packageName !== "" ? payload.packageName : FALLBACK.packageName,
						repository: typeof payload.repository === "string" && payload.repository !== "" ? payload.repository : FALLBACK.repository,
						installCommand: typeof payload.installCommand === "string" && payload.installCommand !== "" ? payload.installCommand : FALLBACK.installCommand,
						npm: typeof payload.npm === "string" && payload.npm !== "" ? payload.npm : FALLBACK.npm
					});
				}).catch(() => {});
				return () => {
					cancelled = true;
				};
			}, []);
			if (state === null) return null;
			const canInstall = faces.native !== null || faces.family !== null;
			const spec = state.npm;
			const onInstall = () => {
				if (installing || !isInstallSpecValid(spec)) return;
				setInstalling(true);
				setError(null);
				setNotice(null);
				const cryptoObj = typeof window === "undefined" ? void 0 : window.crypto;
				const requestId = cryptoObj && typeof cryptoObj.randomUUID === "function" ? cryptoObj.randomUUID() : "skin-center-wallpaper-" + spec;
				installPluginSpec(spec, requestId).then((outcome) => {
					if (outcome.kind === "failed") setError(outcome.message);
				}).finally(() => {
					setInstalling(false);
				});
			};
			const onCopy = () => {
				copyText$1(state.installCommand).then((ok) => {
					setNotice(ok ? "copied" : "failed");
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${skin_center_module_css_default.card} ${skin_center_module_css_default.pluginLookCard}`,
				role: "status",
				"data-external-wallpaper": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_center_module_css_default.cardHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: `${skin_center_module_css_default.swatch} ${skin_center_module_css_default.pluginLookMark}`,
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_center_module_css_default.cardName,
								children: t("externalWallpaperName")
							}),
							!state.installed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_center_module_css_default.headPills,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skin_center_module_css_default.delegatedBadge,
									children: t("externalWallpaperRecommended")
								})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skin_center_module_css_default.cardTagline,
						children: state.installed ? t("externalWallpaperReadyTitle") : t("externalWallpaperMissingTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_center_module_css_default.delegatedDescription,
						children: state.installed ? t("externalWallpaperReadyBody") : t("externalWallpaperMissingBody", { package: state.packageName })
					}),
					!state.installed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_center_module_css_default.actions,
						children: [
							canInstall && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.button + " " + skin_center_module_css_default.buttonPrimary,
								disabled: installing,
								onClick: onInstall,
								children: installing ? t("externalWallpaperInstalling") : t("externalWallpaperInstall")
							}),
							!canInstall && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
								className: skin_center_module_css_default.externalWallpaperCommand,
								children: state.installCommand
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.button,
								disabled: installing,
								onClick: onCopy,
								children: notice === "copied" ? t("externalWallpaperCopied") : t("externalWallpaperCopyCommand")
							})
						]
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_center_module_css_default.delegatedStatus,
						role: "alert",
						children: t("externalWallpaperInstallFailed", { reason: error })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
						className: skin_center_module_css_default.delegatedLink,
						href: state.repository,
						target: "_blank",
						rel: "noopener noreferrer",
						children: t("externalWallpaperLink")
					})
				]
			});
		}
		//#endregion
		//#region src/client/DelegatedSkinCard.tsx
		/**
		* The delegated-skin row: a skin whose visual is another plugin's.
		*
		* It renders where the wallpaper controls used to live and where a skin's own
		* card lives now, because it is both: it is a selection (apply it, and it is
		* remembered across a reload) and an install prompt (the plugin that paints it
		* is a separate package). The row is listed whether or not that package is
		* installed, because an installed-and-enabled plugin that the card hid until
		* the user went to the store is a plugin nobody finds.
		*
		* It sits in the plugin-looks group at the head of the page, beside the
		* Wallpaper Engine card, not among the skin tiles: it has no preview image
		* (the plugin paints, and this package holds no screenshot of it), so a tile
		* sized for a 16:9 thumbnail would be mostly empty. It carries the same
		* head / description / actions shape as the card beside it, and the catalog
		* tagline stays off the card because the localized description already says
		* what applying it gives you.
		*
		* The body is the LOOK, not the row's state: a short description of what
		* applying it gives you. State belongs to the badge (this row is active) and
		* to the buttons (you can pick it, or you cannot, and here is the button that
		* fixes that). Prose about the row's own state sat where a reader looks for a
		* description of the theme, and said nothing they could not already see.
		*
		* Two states still earn one line each, because in both the row withholds the
		* selection buttons and silence would read as a bug: a plugin that cannot hand
		* the page back yet, and a descriptor the installed package has outgrown.
		*
		* Three states, all read from two sources and never guessed:
		*
		*  - not installed: the one-click install through whichever plugin-management
		*    face the host publishes, or the exact command when it publishes none;
		*  - installed but not live: the plugin is wired into this profile but its
		*    browser half is not on the page, so this row cannot paint yet. The row
		*    says so instead of offering an apply that would deliver nothing;
		*  - live: the plugin paints. Try-on and apply are offered, because from here
		*    the selection is a normal one and every other skin, the stock look and a
		*    running wallpaper all take the page back.
		*
		* A live plugin that does NOT advertise the handoff attribute is a build that
		* cannot stand down. Offering apply on it would let the user select this skin
		* and then pick a real skin over it, which is the broken overlap the whole
		* delegation exists to prevent, so the row says the plugin has to be updated
		* and still lets them look at it.
		*
		* The state that needs care is ABSENT markers while a skin is painted. That is
		* what a working handoff looks like from out here: the plugin is installed,
		* running, and standing down because this card's own skin owns the page. Read
		* as "not running" it both lies and strands the reader — no buttons, no way
		* back — so the row takes {@link DelegatedSkinCardProps.yieldedToSkin} from the
		* card (which knows what is painted), says the plugin yielded, and keeps the
		* try-on / apply buttons: switching back is exactly the action that hands the
		* page over again.
		*
		* Everything the peer publishes is read, never written: the two attributes
		* (see runtime/delegated-theme.ts) and the install call the host itself makes.
		* @module @linxin666/dsh-client-ui-skin-center/DelegatedSkinCard
		*/
		/** The copyable command line, used when no management face is available. */
		async function copyText(text) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {
				return false;
			}
		}
		/**
		* Render one delegated-skin row.
		* @param props - the row's locale seat, its catalog entry and the card's actions.
		* @returns the row.
		*/
		function DelegatedSkinCard(props) {
			const { t, skin, theme, isActive, isTrying, yieldedToSkin, busy, disabled } = props;
			const manifest = skin.manifest;
			const payload = manifest.delegated;
			const accent = manifest.accent ?? "#98a1ab";
			const description = t(manifest.descriptionKey);
			const faces = (0, react.useSyncExternalStore)(subscribeInstallFaces, getInstallFaces);
			const [installing, setInstalling] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [notice, setNotice] = (0, react.useState)(null);
			const canInstall = faces.native !== null || faces.family !== null;
			const spec = payload.package;
			const applicable = props.selectable !== false && (payload.installed && theme.live ? theme.canYield : payload.installed && yieldedToSkin);
			const claimable = payload.installed && theme.live && !theme.canYield;
			const onInstall = () => {
				if (installing || !isInstallSpecValid(spec)) return;
				setInstalling(true);
				setError(null);
				const cryptoObj = typeof window === "undefined" ? void 0 : window.crypto;
				const requestId = cryptoObj && typeof cryptoObj.randomUUID === "function" ? cryptoObj.randomUUID() : "skin-center-delegated-" + spec;
				installPluginSpec(spec, requestId).then((outcome) => {
					if (outcome.kind === "failed") {
						setError(outcome.message);
						return;
					}
					if (outcome.kind === "installed") props.onInstalled();
				}).finally(() => {
					setInstalling(false);
				});
			};
			const onCopy = () => {
				copyText(payload.installCommand).then((ok) => {
					setNotice(ok ? "copied" : "failed");
				});
			};
			const blocker = props.selectable === false ? null : claimable ? t("delegatedSkinNoHandoff") : payload.installed && !applicable && !yieldedToSkin ? t("delegatedSkinNotRunning") : null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${skin_center_module_css_default.card} ${skin_center_module_css_default.delegatedCard} ${skin_center_module_css_default.pluginLookCard}`,
				"data-delegated-skin": manifest.id,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_center_module_css_default.cardHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_center_module_css_default.swatch,
								style: { background: accent },
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_center_module_css_default.cardName,
								title: manifest.nameEn,
								children: manifest.nameEn
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: skin_center_module_css_default.headPills,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skin_center_module_css_default.delegatedBadge,
									children: t("delegatedSkinBadge")
								}), (isActive || isTrying) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: `${skin_center_module_css_default.badge} ${isActive && !isTrying ? skin_center_module_css_default.badgeActive : skin_center_module_css_default.badgeTrying}`,
									children: isActive && !isTrying ? t("active") : t("tryingOn")
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_center_module_css_default.delegatedDescription,
						children: description
					}),
					blocker !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_center_module_css_default.delegatedStatus,
						role: "status",
						children: blocker
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_center_module_css_default.delegatedStatus,
						role: "alert",
						children: t("delegatedSkinInstallFailed", { reason: error })
					}),
					payload.descriptorMatches === false && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: skin_center_module_css_default.delegatedStatus,
						role: "alert",
						children: t("delegatedSkinDescriptorMismatch")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_center_module_css_default.actions,
						children: [
							!payload.installed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [canInstall ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonPrimary}`,
								disabled: installing || disabled,
								onClick: onInstall,
								children: installing ? t("delegatedSkinInstalling") : t("delegatedSkinInstall")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
								className: skin_center_module_css_default.externalWallpaperCommand,
								children: payload.installCommand
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.button,
								disabled: installing || disabled,
								onClick: onCopy,
								children: notice === "copied" ? t("externalWallpaperCopied") : t("externalWallpaperCopyCommand")
							})] }),
							payload.installed && faces.navigation !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.button,
								onClick: () => {
									faces.navigation?.openBundle(spec);
								},
								children: t("delegatedSkinManage")
							}),
							applicable && (isActive && !isTrying ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonGhost}`,
								disabled: true,
								children: t("tryOn")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonPrimary}`,
								disabled: busy || disabled,
								onClick: isTrying ? props.onExitTryOn : props.onTryOn,
								children: isTrying ? t("exitTryOn") : t("tryOn")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.button,
								disabled: busy || disabled,
								onClick: props.onApply,
								children: busy ? t("applying") : t("apply")
							})] }))
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
						className: skin_center_module_css_default.delegatedLink,
						href: payload.repository,
						target: "_blank",
						rel: "noopener noreferrer",
						children: t("delegatedSkinLink")
					})
				]
			});
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
		//#endregion
		//#region src/client/delegated-skin-handle.ts
		/**
		* The delegated-skin face the skin center injects into its card.
		*
		* A delegated skin (src/core/delegated-skins.ts) is painted by another
		* plugin, so the card cannot decide on its own whether that plugin is on the
		* page: the answer is the plugin's own document marker, watched in
		* runtime/delegated-theme.ts. This handle is the read-only projection of that
		* watcher the card renders from.
		*
		* It carries no controls. Nothing here writes the other plugin's attributes
		* and nothing here installs or disables it; the row's Install button goes
		* through the host's own plugin manager (plugin-install-faces.ts).
		*/
		/**
		* Build the card's delegated-skin face over a state reader.
		* @param read - the current state of one delegated skin id.
		* @param subscribe - subscribe to changes of any of them.
		* @returns the handle the card consumes.
		*/
		function createDelegatedSkinHandle(read, subscribe) {
			return {
				ids: () => DELEGATED_SKINS.map((skin) => skin.id),
				state: read,
				subscribe
			};
		}
		//#endregion
		//#region src/client/SegmentGroup.tsx
		/**
		* A segmented control with the sliding highlight the reference design uses:
		* one pill sits under the pressed option and TRAVELS to the next one, instead
		* of each option fading its own background out and the next one in.
		*
		* The pill is a real element rather than a pseudo-element because the options
		* are React buttons whose boxes change with the copy, the font and the
		* container width. Each placement measures the active button against the
		* group's padding box (the same origin an absolutely positioned child uses),
		* writes x/y/width/height once, and lets CSS transition them, so a control
		* that wraps onto a second line still lands the pill on the right row.
		* A ResizeObserver re-measures when the group or one of its options changes
		* size (a longer locale, a zoom step, the panel growing); nothing animates on
		* the first placement, because the pill appears where it belongs.
		*
		* The slide deliberately keeps playing when the system asks for reduced
		* motion: a quarter-second move of one small box is how this control reads,
		* and the reference control it copies does the same.
		*/
		/**
		* Render a segmented control whose highlight slides to the pressed option.
		* @param props - the control's accessible name and its options.
		* @returns the control.
		*/
		function SegmentGroup({ label, options }) {
			const group = (0, react.useRef)(null);
			const items = (0, react.useRef)(/* @__PURE__ */ new Map());
			const latest = (0, react.useRef)(options);
			latest.current = options;
			const [box, setBox] = (0, react.useState)(null);
			const measure = (0, react.useCallback)(() => {
				const active = latest.current.find((option) => option.active);
				const element = active === void 0 ? void 0 : items.current.get(active.key);
				if (element === void 0) {
					setBox(null);
					return;
				}
				const next = {
					x: element.offsetLeft,
					y: element.offsetTop,
					w: element.offsetWidth,
					h: element.offsetHeight
				};
				setBox((current) => current !== null && current.x === next.x && current.y === next.y && current.w === next.w && current.h === next.h ? current : next);
			}, []);
			(0, react.useLayoutEffect)(() => {
				measure();
			});
			(0, react.useLayoutEffect)(() => {
				const element = group.current;
				if (element === null || typeof ResizeObserver === "undefined") return;
				const observer = new ResizeObserver(() => {
					measure();
				});
				observer.observe(element);
				for (const item of items.current.values()) observer.observe(item);
				return () => {
					observer.disconnect();
				};
			}, [measure, options.length]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_center_module_css_default.segmentGroup,
				role: "group",
				"aria-label": label,
				ref: group,
				children: [box !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skin_center_module_css_default.segmentPill,
					"aria-hidden": "true",
					style: {
						width: `${box.w}px`,
						height: `${box.h}px`,
						transform: `translate(${box.x}px, ${box.y}px)`
					}
				}), options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					ref: (element) => {
						if (element === null) items.current.delete(option.key);
						else items.current.set(option.key, element);
					},
					"aria-pressed": option.active,
					disabled: option.disabled,
					className: option.active ? `${skin_center_module_css_default.segmentButton} ${skin_center_module_css_default.segmentButtonActive}` : skin_center_module_css_default.segmentButton,
					onClick: option.onSelect,
					children: option.label
				}, option.key))]
			});
		}
		//#endregion
		//#region src/client/RangeBubble.tsx
		/**
		* Coarse adjustment for a bounded number: resting the pointer on the control
		* (or moving focus into it) raises a small bubble holding a slider across the
		* field's whole range, so a large change is one drag instead of many presses
		* or a retyped value. The control itself stays the precise entry.
		*
		* The bubble belongs to the anchor's subtree, so moving from the control onto
		* the bubble never counts as leaving. It opens after a short rest and closes a
		* moment after the pointer and focus have both gone, so crossing the control
		* on the way elsewhere does not flash it. While a drag is in progress the
		* bubble stays put even if the pointer strays off it.
		*
		* Dragging reports each value through `onInput`, so the field shows it live;
		* releasing the thumb, or a key press on it, reports `onCommit` once. The
		* bubble opens on the side of the control that has room inside the nearest
		* scrolling ancestor, so a row near the top of a settings page does not hang
		* its bubble under the page edge.
		*/
		/** Rest on the control before the bubble opens. */
		const OPEN_DELAY_MS = 220;
		/** Grace after pointer and focus have left before the bubble closes. */
		const CLOSE_DELAY_MS = 200;
		/** Room the bubble needs between the control and the scroller's edge. */
		const BUBBLE_ROOM_PX = 64;
		/** The nearest ancestor that scrolls vertically, or the viewport's root. */
		function scroller(node) {
			for (let parent = node.parentElement; parent !== null; parent = parent.parentElement) {
				const overflow = getComputedStyle(parent).overflowY;
				if (overflow === "auto" || overflow === "scroll") return parent;
			}
			return node.ownerDocument.documentElement;
		}
		/**
		* Render the control with its coarse-adjustment bubble.
		* @param props - the range, the value and the two report callbacks.
		* @returns the anchor holding the control and the bubble.
		*/
		function RangeBubble(props) {
			const { min, max, step, disabled = false } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const [side, setSide] = (0, react.useState)("above");
			const [live, setLive] = (0, react.useState)(null);
			const anchorRef = (0, react.useRef)(null);
			const timer = (0, react.useRef)(void 0);
			const hovered = (0, react.useRef)(false);
			const focused = (0, react.useRef)(false);
			const dragging = (0, react.useRef)(false);
			(0, react.useEffect)(() => () => {
				clearTimeout(timer.current);
			}, []);
			(0, react.useEffect)(() => {
				if (disabled) {
					clearTimeout(timer.current);
					setOpen(false);
				}
			}, [disabled]);
			const show = () => {
				const anchor = anchorRef.current;
				if (anchor !== null) {
					const room = anchor.getBoundingClientRect().top - scroller(anchor).getBoundingClientRect().top;
					setSide(room >= BUBBLE_ROOM_PX ? "above" : "below");
				}
				setOpen(true);
			};
			const schedule = () => {
				clearTimeout(timer.current);
				if (disabled) return;
				if (hovered.current || focused.current || dragging.current) {
					if (!open) timer.current = setTimeout(show, focused.current ? 0 : OPEN_DELAY_MS);
					return;
				}
				timer.current = setTimeout(() => {
					setOpen(false);
				}, CLOSE_DELAY_MS);
			};
			const commit = (value) => {
				dragging.current = false;
				setLive(null);
				props.onCommit(value);
				schedule();
			};
			const onChange = (event) => {
				const value = Number(event.target.value);
				setLive(value);
				props.onInput(value);
			};
			const onKeyUp = (event) => {
				if (live !== null) commit(live);
				if (event.key === "Escape") {
					clearTimeout(timer.current);
					setOpen(false);
				}
			};
			const shown = live ?? Math.min(max, Math.max(min, props.value));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: anchorRef,
				className: skin_center_module_css_default.rangeAnchor,
				onPointerEnter: () => {
					hovered.current = true;
					schedule();
				},
				onPointerLeave: () => {
					hovered.current = false;
					schedule();
				},
				onFocus: () => {
					focused.current = true;
					schedule();
				},
				onBlur: (event) => {
					if (event.currentTarget.contains(event.relatedTarget)) return;
					focused.current = false;
					if (live !== null) commit(live);
					else schedule();
				},
				children: [props.children, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_center_module_css_default.rangeBubble,
					"data-open": open ? "" : void 0,
					"data-side": side,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "range",
						className: skin_center_module_css_default.rangeSlider,
						min,
						max,
						step,
						value: shown,
						"aria-label": props.label,
						tabIndex: open ? 0 : -1,
						disabled,
						style: { "--range-fill": `${(shown - min) / (max - min) * 100}%` },
						onPointerDown: () => {
							dragging.current = true;
						},
						onPointerUp: (event) => {
							commit(Number(event.currentTarget.value));
						},
						onPointerCancel: (event) => {
							commit(Number(event.currentTarget.value));
						},
						onChange,
						onKeyUp
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: skin_center_module_css_default.rangeEnds,
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: min }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: max })]
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/StepperControl.tsx
		/** A numeric stepper matching the harness's own font-size setting control. */
		/** Round a stepped value without float drift (0.3 + 0.1 style errors). */
		function stepped(value, step) {
			const precision = Math.max(0, (String(step).split(".")[1] ?? "").length);
			return Number(value.toFixed(precision));
		}
		/** Clamp one step; the bound owns the endpoint exactly. */
		function adjacent(value, direction, min, max, step) {
			if (direction > 0 && value >= max) return max;
			if (direction < 0 && value <= min) return min;
			return stepped(Math.min(max, Math.max(min, value + direction * step)), step);
		}
		/**
		* Official-style numeric stepper: current value, stacked increment/decrement
		* arrows and a unit. Both buttons are ordinary buttons, so keyboard and
		* assistive activation behave natively. Resting the pointer on it raises the
		* coarse slider bubble (RangeBubble.tsx) across the whole range: the value
		* follows the thumb while it moves and is written once, on release, so a drag
		* never floods the store with every intermediate value.
		*/
		function StepperControl(props) {
			const { value, min, max, step, disabled = false, ariaLabel } = props;
			const [live, setLive] = (0, react.useState)(null);
			const change = (direction) => {
				const next = adjacent(value, direction, min, max, step);
				if (next !== value) props.onChange(next);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: skin_center_module_css_default.stepperControl,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RangeBubble, {
					min,
					max,
					step,
					value,
					label: `${ariaLabel} ${min}–${max}`,
					disabled,
					onInput: setLive,
					onCommit: (next) => {
						setLive(null);
						if (next !== value) props.onChange(next);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						id: props.id,
						className: skin_center_module_css_default.stepper,
						role: "group",
						"aria-label": ariaLabel,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("output", {
							className: skin_center_module_css_default.stepperValue,
							children: live ?? value
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: skin_center_module_css_default.stepperArrows,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.stepperArrow,
								"aria-label": `${ariaLabel} +${step}`,
								title: `${ariaLabel} +${step}`,
								disabled: disabled || value >= max,
								onClick: () => {
									change(1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									width: "9",
									height: "9",
									viewBox: "0 0 16 16",
									fill: "none",
									"aria-hidden": "true",
									strokeWidth: "1",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
										d: "M12 10L8.70711 6.70711C8.31658 6.31658 7.68342 6.31658 7.29289 6.70711L4 10",
										stroke: "currentColor"
									})
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.stepperArrow,
								"aria-label": `${ariaLabel} -${step}`,
								title: `${ariaLabel} -${step}`,
								disabled: disabled || value <= min,
								onClick: () => {
									change(-1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									width: "9",
									height: "9",
									viewBox: "0 0 16 16",
									fill: "none",
									"aria-hidden": "true",
									strokeWidth: "1",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
										d: "M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6",
										stroke: "currentColor"
									})
								})
							})]
						})]
					})
				}), props.unit === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: skin_center_module_css_default.stepperUnit,
					children: props.unit
				})]
			});
		}
		//#endregion
		//#region src/client/CustomThemePanel.tsx
		function CustomThemeCard(props) {
			const { t, customTheme, scheme, setScheme, isActive, isTrying, busy, disabled, onTryOn, onExitTryOn, onApply } = props;
			const customThemeState = (0, react.useSyncExternalStore)(customTheme.subscribe, customTheme.getState);
			const profile = customTheme.profile(scheme);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [draftColors, setDraftColors] = (0, react.useState)({
				accent: profile.accent,
				background: profile.background,
				foreground: profile.foreground
			});
			(0, react.useEffect)(() => {
				setDraftColors({
					accent: profile.accent,
					background: profile.background,
					foreground: profile.foreground
				});
			}, [
				scheme,
				profile.accent,
				profile.background,
				profile.foreground
			]);
			const setDraft = (key, value) => {
				setDraftColors((current) => ({
					...current,
					[key]: value
				}));
			};
			const commitColor = (key) => {
				const value = draftColors[key];
				if (/^#[0-9a-f]{6}$/i.test(value)) customTheme.setProfileValue(scheme, key, value);
				else setDraft(key, profile[key]);
			};
			const colorField = (key, label) => {
				const draft = draftColors[key];
				const pickerValue = /^#[0-9a-f]{6}$/i.test(draft) ? draft : profile[key];
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: skin_center_module_css_default.customThemeField,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: skin_center_module_css_default.customThemeFieldLabel,
						children: label
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: skin_center_module_css_default.customThemeInputRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: skin_center_module_css_default.customThemeColor,
							type: "color",
							value: pickerValue,
							"aria-label": label,
							disabled,
							onChange: (event) => {
								const value = event.target.value;
								setDraft(key, value);
								customTheme.setProfileValue(scheme, key, value);
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							className: skin_center_module_css_default.customThemeHex,
							type: "text",
							value: draft,
							inputMode: "text",
							maxLength: 7,
							spellCheck: false,
							"aria-label": `${label} hex`,
							disabled,
							onChange: (event) => {
								setDraft(key, event.target.value);
							},
							onBlur: () => {
								commitColor(key);
							},
							onKeyDown: (event) => {
								if (event.key === "Enter") event.currentTarget.blur();
							}
						})]
					})]
				}, key);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${skin_center_module_css_default.card} ${skin_center_module_css_default.customThemeCard}`,
				"data-dsh-custom-theme-card": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_center_module_css_default.cardHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_center_module_css_default.swatch,
								style: { background: profile.accent },
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_center_module_css_default.cardName,
								children: t("customThemeTitle")
							}),
							(isActive || isTrying) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: `${skin_center_module_css_default.badge} ${isActive ? skin_center_module_css_default.badgeActive : skin_center_module_css_default.badgeTrying}`,
								children: isActive ? t("active") : t("tryingOn")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skin_center_module_css_default.cardTagline,
						children: t("customThemeTagline")
					}),
					customThemeState.writeError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: skin_center_module_css_default.error,
						role: "alert",
						children: t("customThemeSaveFailed")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_center_module_css_default.actions,
						children: [
							isActive && !isTrying ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonGhost}`,
								disabled: true,
								children: t("tryOn")
							}) : isTrying ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonPrimary}`,
								disabled,
								onClick: onExitTryOn,
								children: t("exitTryOn")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonPrimary}`,
								disabled,
								onClick: onTryOn,
								children: busy ? t("loading") : t("tryOn")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.button,
								disabled,
								onClick: onApply,
								children: busy ? t("applying") : t("apply")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: skin_center_module_css_default.button,
								"aria-expanded": expanded,
								disabled,
								onClick: () => {
									setExpanded((value) => !value);
								},
								children: expanded ? t("customThemeCloseEdit") : t("customThemeEdit")
							})
						]
					}),
					expanded && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: skin_center_module_css_default.customThemeEditor,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.customThemeScheme,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skin_center_module_css_default.themeLabel,
									children: t("customThemeMode")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SegmentGroup, {
									label: t("customThemeMode"),
									options: [{
										key: "light",
										label: t("customThemeLight"),
										active: scheme === "light",
										disabled,
										onSelect: () => {
											setScheme("light");
										}
									}, {
										key: "dark",
										label: t("customThemeDark"),
										active: scheme === "dark",
										disabled,
										onSelect: () => {
											setScheme("dark");
										}
									}]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.customThemeFields,
								children: [
									colorField("accent", t("customThemeAccent")),
									colorField("background", t("customThemeBackground")),
									colorField("foreground", t("customThemeForeground"))
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: skin_center_module_css_default.customThemeContrast,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: skin_center_module_css_default.backgroundHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skin_center_module_css_default.customThemeFieldLabel,
										children: t("customThemeContrast")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepperControl, {
										id: "skin-center-custom-theme-contrast",
										min: 0,
										max: 100,
										step: 1,
										unit: "%",
										value: profile.contrast,
										disabled,
										ariaLabel: t("customThemeContrast"),
										onChange: (value) => {
											customTheme.setProfileValue(scheme, "contrast", value);
										}
									})]
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.customThemeFooter,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skin_center_module_css_default.backgroundHintMuted,
									children: t("customThemeResetHint")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: skin_center_module_css_default.button,
									disabled,
									onClick: () => {
										customTheme.reset(scheme);
									},
									children: t("customThemeReset")
								})]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/SkinCenter.tsx
		/**
		* The skin-center card: rendered as the content of a first-level settings
		* section, listing the official stock look plus every installed skin in the
		* v2 catalog (package-shipped built-ins + user dirs under $DSH_HOME/skins).
		*
		* v2 architecture (issue #506): skins are pure asset directories loaded by
		* the skin-center runtime. Try-on and apply both go through the same atomic
		* switch engine (src/client/runtime/skin-controller.ts) — try-on simply
		* skips persistence, and apply is one click with NO page reload, no
		* cordis.patch.yml rewrite, no boot-graph regeneration. The "trying on"
		* badge tracks the controller's live state, so closing and reopening the
		* settings panel keeps showing the skin that is still being previewed.
		* Copy rides the standard `t` seat; the theme preview control drives the
		* official theme service (persisted, same as the Appearance row).
		*/
		/** The apply target of the official stock-look card. */
		const OFFICIAL = "official";
		/** Stand-in for a host that injects no delegated-skin face: nothing is live. */
		const INERT_DELEGATED = createDelegatedSkinHandle(() => ({
			live: false,
			canYield: false
		}), () => () => {});
		/**
		* Render the skin-center card: a static header naming the plugin, with the
		* always-visible skin list (official default + every installed skin; try-on /
		* theme preview / one-click apply) rendered below it.
		* @param props - card props.
		* @returns the plugin card.
		*/
		function SkinCenter({ t, runtime, theme, background, externalWallpaper, delegated, preview, customTheme }) {
			(0, react.useSyncExternalStore)((listener) => theme.subscribe(listener), () => theme.getTheme());
			const enabled = (0, react.useSyncExternalStore)(background.subscribe, background.enabled);
			const opacity = (0, react.useSyncExternalStore)(background.subscribe, background.opacity);
			const blurEmpty = (0, react.useSyncExternalStore)(background.subscribe, background.blurEmpty);
			const blurContent = (0, react.useSyncExternalStore)(background.subscribe, background.blurContent);
			const inputCardBlur = (0, react.useSyncExternalStore)(background.subscribe, background.inputCardBlur);
			const bubbleOpacity = (0, react.useSyncExternalStore)(background.subscribe, background.bubbleOpacity);
			const bubbleBlur = (0, react.useSyncExternalStore)(background.subscribe, background.bubbleBlur);
			const catalog = (0, react.useSyncExternalStore)(runtime.subscribe, runtime.catalog);
			const delegatedEntries = (catalog ?? []).filter(isDelegatedCatalogSkin);
			const isAssetSkin = (entry) => !isDelegatedCatalogSkin(entry);
			const state = (0, react.useSyncExternalStore)(runtime.subscribe, runtime.controller.getState);
			const customThemeState = (0, react.useSyncExternalStore)(customTheme.subscribe, customTheme.getState);
			const activeId = state.active;
			const previewing = state.previewing;
			const tryingId = state.trying;
			const activeEntry = activeId === null ? null : runtime.find(activeId);
			const backdropActive = activeEntry?.manifest.contributes?.backgroundMedia !== void 0;
			const delegatedSkins = delegated ?? INERT_DELEGATED;
			const [delegatedStates, setDelegatedStates] = (0, react.useState)({});
			(0, react.useEffect)(() => {
				const read = () => {
					const next = {};
					for (const id of delegatedSkins.ids()) next[id] = delegatedSkins.state(id);
					setDelegatedStates(next);
				};
				read();
				return delegatedSkins.subscribe(read);
			}, [delegatedSkins]);
			/**
			* Whether an asset skin this card selected is standing on the delegated
			* plugin.
			*
			* The plugin's markers vanish while it yields, which from out here looks
			* exactly like a plugin that never loaded. The card knows the difference:
			* with the delegated row itself selected, absent markers mean the plugin
			* owns the page; with a real skin selected, absent markers mean the plugin
			* stood down for that skin, which is the handoff working. Stock look
			* (activeId null) is neither, and says so.
			*/
			const delegatedSelected = activeEntry !== null && isDelegatedCatalogSkin(activeEntry);
			const assetSkinPainted = activeId !== null && !delegatedSelected;
			const paintsOverDelegated = (entry, state) => assetSkinPainted && activeId !== entry.manifest.id && state?.live !== true;
			const [busyId, setBusyId] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [verifying, setVerifying] = (0, react.useState)(false);
			const [verifySummary, setVerifySummary] = (0, react.useState)(null);
			const [verifyReports, setVerifyReports] = (0, react.useState)({});
			const [confirmUninstallId, setConfirmUninstallId] = (0, react.useState)(null);
			const [uninstallingId, setUninstallingId] = (0, react.useState)(null);
			const [bulk, setBulk] = (0, react.useState)(null);
			const [uninstallAllArmed, setUninstallAllArmed] = (0, react.useState)(false);
			const mounted = (0, react.useRef)(false);
			const requestSeq = (0, react.useRef)(0);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			const run = (target, action) => {
				const seq = ++requestSeq.current;
				setError(null);
				setBusyId(target);
				action().catch(() => {
					if (!mounted.current || seq !== requestSeq.current) return;
					setError(t("applyFailed"));
				}).finally(() => {
					if (!mounted.current || seq !== requestSeq.current) return;
					setBusyId(null);
				});
			};
			const tryOn = (entry) => {
				run(entry.manifest.id, () => preview.runSkin(() => runtime.controller.tryOn(entry.manifest.id, entry, { userInitiated: true })));
			};
			const tryOnOfficial = () => {
				run(OFFICIAL, () => preview.runSkin(() => runtime.controller.tryOn(null, null)));
			};
			const exitTryOn = () => {
				run(tryingId ?? OFFICIAL, () => preview.runSkin(() => runtime.controller.exitTryOn()));
			};
			const restoreCommittedSkin = async (state) => {
				const entry = state.active === null ? null : runtime.find(state.active);
				if (state.active !== null && entry === null) throw new Error(`cannot restore skin ${state.active}`);
				if (await runtime.controller.switchTo(state.active, entry) !== state.active) throw new Error(`skin ${state.active ?? "stock"} did not restore`);
			};
			const switchAndDeactivateCustomTheme = async (target, entry, options) => {
				const previous = { ...runtime.controller.getState() };
				const active = await runtime.controller.switchTo(target, entry, options);
				if (active !== target) throw new Error(`${target === null ? "stock theme" : `skin ${target}`} did not activate`);
				try {
					await customTheme.deactivate();
					return active;
				} catch (error) {
					try {
						await restoreCommittedSkin(previous);
					} catch (rollbackError) {
						throw new AggregateError([error, rollbackError], "skin switch cleanup and rollback failed");
					}
					throw error;
				}
			};
			const restoreOfficialLook = async () => {
				return await switchAndDeactivateCustomTheme(null, null);
			};
			/**
			* One-click apply: atomic client-side switch + persisted selection. No
			* reload, no boot-graph wait — the tapIndex adapter makes the next page
			* load boot straight into this skin.
			* @param target - skin id, or `official` for the stock look.
			*/
			const applySkin = (target) => {
				if (target === OFFICIAL) {
					run(OFFICIAL, () => preview.runSkin(restoreOfficialLook));
					return;
				}
				const entry = runtime.find(target);
				if (entry === null) {
					setError(t("applyFailed"));
					return;
				}
				run(target, () => preview.runSkin(() => switchAndDeactivateCustomTheme(target, entry, { userInitiated: true })));
			};
			const tryOnCustomTheme = () => {
				run("custom-theme", () => preview.runCustomTheme(async () => {
					const active = await runtime.controller.tryOn(null, null);
					if (active !== null) throw new Error("stock preview did not activate");
					customTheme.tryOn();
					return active;
				}));
			};
			const exitCustomThemeTryOn = () => {
				run("custom-theme", () => preview.runCustomTheme(async () => {
					customTheme.exitTryOn();
					return await runtime.controller.exitTryOn();
				}));
			};
			const applyCustomTheme = () => {
				run("custom-theme", () => preview.runCustomTheme(async () => {
					await customTheme.apply();
					const active = await runtime.controller.switchTo(null, null);
					if (active !== null) {
						await customTheme.deactivate();
						throw new Error("stock theme did not activate");
					}
					return active;
				}));
			};
			const handleVerify = async () => {
				setVerifying(true);
				setError(null);
				try {
					const res = await fetch("/api/skin-center/v2/verify", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ autoRepair: true })
					});
					const json = await res.json().catch(() => null);
					if (!res.ok || json?.ok !== true) throw new Error("verify failed");
					if (!mounted.current) return;
					setVerifySummary({
						total: json.total ?? 0,
						valid: json.valid ?? 0,
						issues: json.issues ?? 0,
						repaired: json.repaired ?? [],
						repairFailed: json.repairFailed ?? []
					});
					const map = {};
					for (const item of json.details ?? []) map[item.id] = item;
					setVerifyReports(map);
					if (json.repaired && json.repaired.length > 0) {
						await runtime.refreshCatalog();
						if (activeId && json.repaired.includes(activeId)) {
							const freshEntry = runtime.find(activeId);
							if (freshEntry) await preview.runSkin(() => switchAndDeactivateCustomTheme(activeId, freshEntry));
						}
					}
				} catch {
					if (mounted.current) setError(t("applyFailed"));
				} finally {
					if (mounted.current) setVerifying(false);
				}
			};
			/** Repair every installed skin the market publishes a newer release of. */
			const handleUpdateAll = async () => {
				setError(null);
				setBulk({
					phase: "checking",
					done: 0,
					total: 0,
					failed: 0,
					note: ""
				});
				let targets;
				try {
					const res = await fetch("/api/skin-center/v2/skins/versions", { cache: "no-store" });
					const json = await res.json().catch(() => null);
					if (!res.ok || json?.ok !== true || !Array.isArray(json.rows)) throw new Error("versions-unavailable");
					targets = json.rows.filter((row) => row.outdated).map((row) => row.id);
				} catch {
					if (mounted.current) {
						setBulk(null);
						setError(t("marketUnreachable"));
					}
					return;
				}
				if (!mounted.current) return;
				if (targets.length === 0) {
					setBulk({
						phase: "idle",
						done: 0,
						total: 0,
						failed: 0,
						note: t("updateAllNone")
					});
					return;
				}
				let done = 0;
				let failed = 0;
				for (const id of targets) {
					setBulk({
						phase: "updating",
						done,
						total: targets.length,
						failed,
						note: ""
					});
					try {
						if (!(await fetch(`/api/skin-center/v2/skins/${encodeURIComponent(id)}/repair`, { method: "POST" })).ok) failed++;
					} catch {
						failed++;
					}
					done++;
				}
				await runtime.refreshCatalog();
				if (!mounted.current) return;
				if (activeId !== null) {
					const freshEntry = runtime.find(activeId);
					if (freshEntry) await preview.runSkin(() => switchAndDeactivateCustomTheme(activeId, freshEntry));
				}
				setBulk({
					phase: "idle",
					done,
					total: targets.length,
					failed,
					note: failed === 0 ? t("updateAllDone", { count: done }) : t("updateAllFailed", { count: failed })
				});
			};
			/**
			* Uninstall every market-installed skin, including the active one. Builtins
			* are never touched: they ship inside the package and are replaced by
			* upgrading it. The first tap only arms the button, matching the per-skin
			* uninstall affordance, because this cannot be undone.
			*/
			const handleUninstallAll = async () => {
				const targets = (catalog ?? []).filter((skin) => skin.origin === "user");
				if (!uninstallAllArmed) {
					if (targets.length === 0) {
						setBulk({
							phase: "idle",
							done: 0,
							total: 0,
							failed: 0,
							note: t("bulkNoUserSkins")
						});
						return;
					}
					setUninstallAllArmed(true);
					return;
				}
				setUninstallAllArmed(false);
				setError(null);
				const wasActive = activeId;
				const wasTrying = tryingId;
				if (wasTrying !== null && targets.some((skin) => skin.manifest.id === wasTrying)) await preview.runSkin(() => runtime.controller.exitTryOn());
				let done = 0;
				let failed = 0;
				for (const skin of targets) {
					setBulk({
						phase: "uninstalling",
						done,
						total: targets.length,
						failed,
						note: ""
					});
					try {
						if (!(await fetch(`/api/skin-center/v2/skins/${encodeURIComponent(skin.manifest.id)}/uninstall`, { method: "POST" })).ok) failed++;
					} catch {
						failed++;
					}
					done++;
				}
				await runtime.refreshCatalog();
				if (wasActive !== null && targets.some((skin) => skin.manifest.id === wasActive)) await preview.runSkin(restoreOfficialLook);
				if (!mounted.current) return;
				setBulk({
					phase: "idle",
					done,
					total: targets.length,
					failed,
					note: failed === 0 ? t("uninstallAllDone", { count: done }) : t("uninstallAllFailed", { count: failed })
				});
			};
			const handleUninstall = async (entry) => {
				const id = entry.manifest.id;
				setUninstallingId(id);
				setError(null);
				try {
					if (tryingId === id) await preview.runSkin(() => runtime.controller.exitTryOn());
					if (activeId === id) await preview.runSkin(restoreOfficialLook);
					const res = await fetch(`/api/skin-center/v2/skins/${encodeURIComponent(id)}/uninstall`, {
						method: "POST",
						headers: { "content-type": "application/json" }
					});
					const json = await res.json().catch(() => null);
					if (!res.ok || json?.ok !== true) throw new Error("uninstall failed");
					await runtime.refreshCatalog();
					if (mounted.current) setConfirmUninstallId(null);
				} catch {
					if (mounted.current) setError(t("uninstallFailed"));
				} finally {
					if (mounted.current) setUninstallingId(null);
				}
			};
			const dark = document.body.hasAttribute("data-ds-dark-theme");
			const apiBase = runtime.apiBase ?? "/api/skin-center/v2";
			/** One row: try-on control + apply button + optional uninstall. Shared by the official card and every skin card. */
			const actionButtons = (opts) => {
				const isUser = opts.entry?.origin === "user";
				const isConfirming = isUser && confirmUninstallId === opts.key;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_center_module_css_default.actions,
					children: [
						opts.isActive && !opts.isTrying ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonGhost}`,
							disabled: true,
							children: t("tryOn")
						}) : opts.isTrying ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonPrimary}`,
							disabled: busyId !== null || uninstallingId !== null,
							onClick: exitTryOn,
							children: t("exitTryOn")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonPrimary}`,
							disabled: busyId !== null || uninstallingId !== null,
							onClick: opts.onTryOn,
							children: busyId === opts.key ? t("loading") : t("tryOn")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: skin_center_module_css_default.button,
							disabled: busyId !== null || uninstallingId !== null,
							onClick: () => {
								applySkin(opts.key);
							},
							children: busyId === opts.key ? t("applying") : opts.applyLabel
						}),
						isUser && (isConfirming ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonDangerConfirm}`,
							disabled: busyId !== null || uninstallingId !== null,
							onClick: () => {
								if (opts.entry) handleUninstall(opts.entry);
							},
							children: uninstallingId === opts.key ? t("uninstalling") : t("confirm")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: skin_center_module_css_default.button,
							disabled: uninstallingId !== null,
							onClick: () => {
								setConfirmUninstallId(null);
							},
							children: t("cancel")
						})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${skin_center_module_css_default.button} ${skin_center_module_css_default.buttonDanger}`,
							disabled: busyId !== null || uninstallingId !== null,
							onClick: () => {
								setConfirmUninstallId(opts.key);
							},
							children: t("uninstall")
						}))
					]
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: skin_center_module_css_default.pluginCard,
				"data-dsh-plugin": "skin-center",
				"data-dsh-part": "panel",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: skin_center_module_css_default.cardHeaderStatic,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: skin_center_module_css_default.headText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: skin_center_module_css_default.pluginName,
							children: [t("title"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: skin_center_module_css_default.titleBadge,
								children: String(catalog?.length ?? 0)
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: skin_center_module_css_default.cardDescription,
							title: t("cardDescription"),
							children: t("cardDescription")
						})]
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: skin_center_module_css_default.cardBody,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: skin_center_module_css_default.pluginLooks,
							"aria-labelledby": "skin-center-plugin-looks",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: skin_center_module_css_default.groupHeading,
								id: "skin-center-plugin-looks",
								children: t("pluginLooksTitle")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.pluginLookGrid,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ExternalWallpaperNotice, { t }), delegatedEntries.map((entry) => {
									const id = entry.manifest.id;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DelegatedSkinCard, {
										t,
										skin: entry,
										theme: delegatedStates[id] ?? {
											live: false,
											canYield: false
										},
										isActive: id === activeId && !previewing,
										isTrying: previewing && id === tryingId,
										yieldedToSkin: paintsOverDelegated(entry, delegatedStates[id]),
										selectable: enabled,
										busy: busyId === id,
										disabled: busyId !== null || uninstallingId !== null,
										onTryOn: () => {
											tryOn(entry);
										},
										onExitTryOn: exitTryOn,
										onApply: () => {
											applySkin(id);
										},
										onInstalled: () => {
											runtime.refreshCatalog();
										}
									}, id);
								})]
							})]
						}),
						state.stoodDown && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skin_center_module_css_default.externalWallpaperNotice,
							role: "status",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: skin_center_module_css_default.externalWallpaperTitle,
								children: t("stoodDownTitle")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: skin_center_module_css_default.externalWallpaperBody,
								children: t("stoodDownBody")
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: skin_center_module_css_default.enableRow,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: skin_center_module_css_default.enableLabel,
									title: t("enabled"),
									children: t("enabled")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "switch",
									"aria-checked": enabled,
									"aria-label": t("enabled"),
									className: enabled ? skin_center_module_css_default.switch + " " + skin_center_module_css_default.switchOn : skin_center_module_css_default.switch,
									onClick: () => {
										background.setEnabled(!enabled);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: skin_center_module_css_default.switchThumb })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: skin_center_module_css_default.enableHint,
									children: t("enabledHint")
								})
							]
						}),
						enabled ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.head,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skin_center_module_css_default.toolbar,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: skin_center_module_css_default.themeRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: skin_center_module_css_default.themeLabel,
												children: t("theme")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SegmentGroup, {
												label: t("theme"),
												options: [{
													key: "light",
													label: t("themeLight"),
													active: !dark,
													onSelect: () => {
														theme.setTheme("light");
													}
												}, {
													key: "dark",
													label: t("themeDark"),
													active: dark,
													onSelect: () => {
														theme.setTheme("dark");
													}
												}]
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: skin_center_module_css_default.actionRow,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: skin_center_module_css_default.themeButton,
													disabled: verifying || busyId !== null || uninstallingId !== null,
													onClick: () => {
														handleVerify();
													},
													children: verifying ? t("verifyingIntegrity") : t("verifyIntegrity")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: skin_center_module_css_default.themeButton,
													disabled: bulk !== null && bulk.phase !== "idle" || verifying || busyId !== null || uninstallingId !== null,
													onClick: () => {
														handleUpdateAll();
													},
													children: bulk?.phase === "checking" ? t("updateAllChecking") : bulk?.phase === "updating" ? t("updateAllRunning", {
														done: bulk.done,
														total: bulk.total
													}) : t("updateAll")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: `${skin_center_module_css_default.themeButton} ${uninstallAllArmed ? skin_center_module_css_default.buttonDangerConfirm : skin_center_module_css_default.buttonDanger}`,
													disabled: bulk !== null && bulk.phase !== "idle" || verifying || busyId !== null || uninstallingId !== null,
													onClick: () => {
														handleUninstallAll();
													},
													children: bulk?.phase === "uninstalling" ? t("uninstallAllRunning", {
														done: bulk.done,
														total: bulk.total
													}) : uninstallAllArmed ? t("confirm") : t("uninstallAll")
												})
											]
										})]
									}),
									bulk !== null && bulk.note !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: bulk.failed > 0 ? skin_center_module_css_default.verifySummaryWarning : skin_center_module_css_default.verifySummarySuccess,
										children: bulk.note
									}),
									verifySummary !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: `${skin_center_module_css_default.verifySummary} ${verifySummary.issues === 0 ? skin_center_module_css_default.verifySummarySuccess : skin_center_module_css_default.verifySummaryWarning}`,
										children: verifySummary.repaired && verifySummary.repaired.length > 0 && verifySummary.issues === 0 ? t("verifyRepaired", { count: verifySummary.repaired.length }) : verifySummary.issues === 0 ? t("verifyAllPassed", { count: verifySummary.total }) : verifySummary.repaired && verifySummary.repaired.length > 0 ? `${t("verifyRepaired", { count: verifySummary.repaired.length })}, ${t("verifyFoundIssues", { count: verifySummary.issues })}` : t("verifyFoundIssues", { count: verifySummary.issues })
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.backgroundRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skin_center_module_css_default.backgroundHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skin_center_module_css_default.backgroundLabel,
										children: t("backgroundOpacity")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepperControl, {
										id: "skin-center-background-opacity",
										min: 0,
										max: 100,
										step: 5,
										unit: "%",
										value: opacity,
										ariaLabel: t("backgroundOpacity"),
										onChange: (value) => {
											background.set(value);
										}
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: backdropActive ? skin_center_module_css_default.backgroundHint : skin_center_module_css_default.backgroundHintMuted,
									children: backdropActive ? t("backgroundHint") : t("backgroundHintInert")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.backgroundRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skin_center_module_css_default.backgroundHead,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skin_center_module_css_default.backgroundLabel,
											children: t("backgroundBlurEmpty")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepperControl, {
											id: "skin-center-background-blur-empty",
											min: 0,
											max: 20,
											step: 1,
											unit: "px",
											value: blurEmpty,
											ariaLabel: t("backgroundBlurEmpty"),
											onChange: (value) => {
												background.setBlurEmpty(value);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: skin_center_module_css_default.backgroundHead,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: skin_center_module_css_default.backgroundLabel,
											children: t("backgroundBlurContent")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepperControl, {
											id: "skin-center-background-blur-content",
											min: 0,
											max: 20,
											step: 1,
											unit: "px",
											value: blurContent,
											ariaLabel: t("backgroundBlurContent"),
											onChange: (value) => {
												background.setBlurContent(value);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: backdropActive ? skin_center_module_css_default.backgroundHint : skin_center_module_css_default.backgroundHintMuted,
										children: backdropActive ? t("backgroundBlurHint") : t("backgroundBlurInert")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.backgroundRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skin_center_module_css_default.backgroundHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skin_center_module_css_default.backgroundLabel,
										children: t("inputCardBlur")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepperControl, {
										id: "skin-center-input-card-blur",
										min: 0,
										max: 20,
										step: 1,
										unit: "px",
										value: inputCardBlur,
										ariaLabel: t("inputCardBlur"),
										onChange: (value) => {
											background.setInputCardBlur(value);
										}
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: skin_center_module_css_default.backgroundHint,
									children: t("inputCardBlurHint")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.backgroundRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skin_center_module_css_default.backgroundHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skin_center_module_css_default.backgroundLabel,
										children: t("bubbleOpacity")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepperControl, {
										id: "skin-center-bubble-opacity",
										min: 0,
										max: 100,
										step: 5,
										unit: "%",
										value: bubbleOpacity,
										ariaLabel: t("bubbleOpacity"),
										onChange: (value) => {
											background.setBubbleOpacity(value);
										}
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: skin_center_module_css_default.backgroundHint,
									children: t("bubbleOpacityHint")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.backgroundRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skin_center_module_css_default.backgroundHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: skin_center_module_css_default.backgroundLabel,
										children: t("bubbleBlur")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepperControl, {
										id: "skin-center-bubble-blur",
										min: 0,
										max: 20,
										step: 1,
										unit: "px",
										value: bubbleBlur,
										ariaLabel: t("bubbleBlur"),
										onChange: (value) => {
											background.setBubbleBlur(value);
										}
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: skin_center_module_css_default.backgroundHint,
									children: t("bubbleBlurHint")
								})]
							}),
							error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: skin_center_module_css_default.error,
								children: error
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: skin_center_module_css_default.list,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: skin_center_module_css_default.skinGrid,
									children: [(() => {
										const isActive = activeId === null && !previewing && !customThemeState.applied;
										const isTrying = previewing && tryingId === null && !customThemeState.previewing;
										const badge = isActive ? t("active") : isTrying ? t("tryingOn") : null;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: `${skin_center_module_css_default.card} ${skin_center_module_css_default.skinCard}`,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: skin_center_module_css_default.thumbWrap,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: skin_center_module_css_default.thumbEmpty,
														"aria-hidden": "true"
													}), badge !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: `${skin_center_module_css_default.badge} ${isActive ? skin_center_module_css_default.badgeActive : skin_center_module_css_default.badgeTrying}`,
														children: badge
													})]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: skin_center_module_css_default.cardHead,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: skin_center_module_css_default.swatch,
														style: { background: "#98a1ab" },
														"aria-hidden": "true"
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: skin_center_module_css_default.cardName,
														title: t("official"),
														children: t("official")
													})]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: skin_center_module_css_default.cardTagline,
													title: t("officialTagline"),
													children: t("officialTagline")
												}),
												actionButtons({
													key: OFFICIAL,
													isActive,
													isTrying,
													onTryOn: tryOnOfficial,
													applyLabel: t("restore")
												})
											]
										}, OFFICIAL);
									})(), (catalog ?? []).filter(isAssetSkin).map((entry) => {
										const id = entry.manifest.id;
										const isActive = id === activeId && !previewing;
										const isTrying = previewing && id === tryingId;
										const badge = isActive ? t("active") : isTrying ? t("tryingOn") : null;
										const report = verifyReports[id];
										const previewPath = dark ? entry.manifest.preview?.dark ?? entry.manifest.preview?.light : entry.manifest.preview?.light ?? entry.manifest.preview?.dark;
										const previewSrc = previewPath === void 0 ? null : `${apiBase}/skins/${encodeURIComponent(id)}/${previewPath}`;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: `${skin_center_module_css_default.card} ${skin_center_module_css_default.skinCard}`,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: skin_center_module_css_default.thumbWrap,
													children: [
														previewSrc !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
															className: skin_center_module_css_default.thumb,
															src: previewSrc,
															alt: entry.manifest.nameEn,
															loading: "lazy"
														}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
															className: skin_center_module_css_default.thumbEmpty,
															style: { background: entry.manifest.accent ?? void 0 },
															"aria-hidden": "true"
														}),
														report && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: `${skin_center_module_css_default.badge} ${skin_center_module_css_default.thumbReport} ${report.status === "valid" ? skin_center_module_css_default.badgeSuccess : report.status === "tampered" ? skin_center_module_css_default.badgeWarning : skin_center_module_css_default.badgeDanger}`,
															title: report.status === "valid" ? t("integrityValid") : [...report.mismatches, ...report.missing].join(", ") || report.status,
															children: report.status === "valid" ? t("integrityValid") : report.status === "tampered" ? t("integrityTampered") : report.status === "missing-files" ? t("integrityMissing") : t("integrityHooksRefused")
														}),
														badge !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: `${skin_center_module_css_default.badge} ${isActive ? skin_center_module_css_default.badgeActive : skin_center_module_css_default.badgeTrying}`,
															children: badge
														})
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: skin_center_module_css_default.cardHead,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: skin_center_module_css_default.swatch,
														style: { background: entry.manifest.accent ?? "#98a1ab" },
														"aria-hidden": "true"
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: skin_center_module_css_default.cardName,
														title: entry.manifest.nameEn,
														children: entry.manifest.nameEn
													})]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: skin_center_module_css_default.cardTagline,
													title: entry.manifest.tagline ?? "",
													children: entry.manifest.tagline ?? ""
												}),
												report && report.status !== "valid" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: skin_center_module_css_default.integrityNote,
													children: [report.mismatches.length > 0 ? `${t("integrityTampered")}: ${report.mismatches.join(", ")}` : null, report.missing.length > 0 ? `${t("integrityMissing")}: ${report.missing.join(", ")}` : null].filter(Boolean).join(" | ")
												}),
												actionButtons({
													key: id,
													entry,
													isActive,
													isTrying,
													onTryOn: () => {
														tryOn(entry);
													},
													applyLabel: t("apply")
												})
											]
										}, id);
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CustomThemeCard, {
									t,
									customTheme,
									scheme: dark ? "dark" : "light",
									setScheme: (scheme) => {
										theme.setTheme(scheme);
									},
									isActive: customThemeState.applied && activeId === null && !previewing,
									isTrying: customThemeState.previewing,
									busy: busyId === "custom-theme",
									disabled: busyId !== null,
									onTryOn: tryOnCustomTheme,
									onExitTryOn: exitCustomThemeTryOn,
									onApply: applyCustomTheme
								})]
							})
						] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: skin_center_module_css_default.offNote,
							role: "status",
							children: t("offNote")
						})
					]
				})]
			});
		}
		/** Render the skin-center card as a first-level settings page. */
		function SkinCenterSection(props) {
			const { t, runtime, theme, background, externalWallpaper, delegated, preview, customTheme } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
				className: skin_center_module_css_default.sectionList,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkinCenter, {
					t,
					runtime,
					theme,
					background,
					externalWallpaper,
					delegated,
					preview,
					customTheme
				})
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
		/** Fill every absent field from {@link SKIN_BACKGROUND_DEFAULTS}. */
		function resolveSkinBackground(value) {
			return {
				...SKIN_BACKGROUND_DEFAULTS,
				...value ?? {}
			};
		}
		//#endregion
		//#region src/client/background.ts
		/**
		* Background-scrim handle for the skin center: applies the chosen occlusion
		* to the page's backdrop, plus an optional per-state Gaussian blur of that
		* backdrop.
		*
		* Occlusion is a CSS variable on `document.body` (--dsw-skin-scrim), which
		* backdrop-painting skins (blue-fantasy / whale-song) read inside their
		* setBackdrop() so the veil stays in sync across theme flips and try-on
		* restores. The official stock look paints no backdrop, so the variable is
		* inert there — the value still persists so it is ready for the next backdrop
		* skin.
		*
		* The Gaussian blur targets the same painted backdrop through a fixed child
		* of `document.body` using backdrop-filter: it samples the body's own
		* background painted behind it. Separate strengths apply to the empty
		* conversation and the conversation-with-content states, detected from the
		* shell's stable message-row class suffixes (hash prefix varies, suffix is
		* stable). When the active blur is 0 no element exists, so there is no GPU
		* cost. Blur never changes the occlusion behavior above.
		*
		* Occlusion values are 0-100 (0 = no extra veil, 100 = fully obscured); they
		* are written through as a 0..1 alpha for the CSS variable. Blur values are
		* 0-20 px. Dragging the controls applies instantly (live).
		*
		* Persistence (issue #996): the controller owns no settings scope — the
		* remote pairing channel fences settings.* as loopback-only, which is what
		* stranded remote clients on defaults. The caller hands in the initial
		* values and a `persist` callback (the v2 /active channel); later external
		* edits (the official settings page locally, the refetched state remotely)
		* arrive through `init()`.
		*/
		/** The namespace string the Host registers (mirrors src/index.ts). */
		const SKIN_BACKGROUND_NS = "skin-background";
		/** CSS custom property written to document.body and read by backdrop skins. */
		const SCRIM_VAR = "--dsw-skin-scrim";
		/** CSS custom property consumed by skins that expose translucent bubbles. */
		const BUBBLE_ALPHA_VAR = "--dsh-skin-bubble-alpha";
		/** CSS custom property consumed by skins that expose a bubble backdrop blur. */
		const BUBBLE_BLUR_VAR = "--dsh-skin-bubble-blur";
		/** CSS custom property consumed by the shared composer neutralizer. */
		const INPUT_CARD_BLUR_VAR = "--dsh-input-card-blur";
		SKIN_BACKGROUND_DEFAULTS.backgroundOpacity;
		SKIN_BACKGROUND_DEFAULTS.bubbleOpacity;
		SKIN_BACKGROUND_DEFAULTS.bubbleBlur;
		SKIN_BACKGROUND_DEFAULTS.backgroundBlurEmpty;
		/**
		* Selector for a conversation message row inside the shell's center column.
		* Official shell message rows carry `data-chat-anchor-key`; the
		* `data-pane="conversation"` attribute is stamped by the dsh-web-all compat
		* shim on the center column, where the _userRow / _compactionRow /
		* _contextRow / _turnErrorRow suffixes are CSS-module message-row classes
		* (hash prefix varies, suffix is stable).
		*/
		const CONVERSATION_CONTENT_SELECTOR = [
			"[data-chat-anchor-key]",
			"[data-pane=\"conversation\"] [class*=\"_userRow\"]",
			"[data-pane=\"conversation\"] [class*=\"_compactionRow\"]",
			"[data-pane=\"conversation\"] [class*=\"_contextRow\"]",
			"[data-pane=\"conversation\"] [class*=\"_turnErrorRow\"]"
		].join(", ");
		/**
		* Own the background preference set: apply the values to the body instantly
		* and persist user edits through the caller-provided channel.
		*/
		var BackgroundController = class {
			enabledValue = SKIN_BACKGROUND_DEFAULTS.enabled;
			opacityValue = SKIN_BACKGROUND_DEFAULTS.backgroundOpacity;
			blurEmptyValue = SKIN_BACKGROUND_DEFAULTS.backgroundBlurEmpty;
			blurContentValue = SKIN_BACKGROUND_DEFAULTS.backgroundBlurContent;
			inputCardBlurValue = SKIN_BACKGROUND_DEFAULTS.inputCardBlur;
			bubbleOpacityValue = SKIN_BACKGROUND_DEFAULTS.bubbleOpacity;
			bubbleBlurValue = SKIN_BACKGROUND_DEFAULTS.bubbleBlur;
			listeners = /* @__PURE__ */ new Set();
			persist;
			/** The fixed backdrop-filter element, present only while active blur > 0. */
			blurElement = null;
			/** Currently applied backdrop-filter blur px (cached to avoid redundant style writes during streaming). */
			appliedBlur = null;
			/** The body MutationObserver, installed lazily once a blur is active. */
			observer = null;
			/** Pending requestAnimationFrame id for a coalesced recheck. */
			rafId = null;
			/** Guard: after dispose no scheduled work may reinstall anything. */
			disposed = false;
			/**
			* @param initial - values known at construction (the local settings scope
			*   snapshot on loopback); null starts from defaults until init() arrives.
			* @param persist - persistence channel for user edits (v2 /active POST).
			*/
			constructor(initial, persist) {
				this.persist = persist;
				if (initial !== null) this.assign(initial);
				this.applyOcclusion();
				this.applyInputCardBlur();
				this.applyBubbleOpacity();
				this.applyBubbleBlur();
				this.syncBlur();
			}
			/**
			* Replace the current values with externally sourced ones (the refetched
			* v2 state, or a live settings-scope publish). Never persists — the source
			* already owns the stored copy; the caller decides whether to forward the
			* change into the v2 store.
			*/
			init(next) {
				if (this.disposed) return;
				this.assign(next ?? {});
				this.applyOcclusion();
				this.applyInputCardBlur();
				this.applyBubbleOpacity();
				this.applyBubbleBlur();
				this.syncBlur();
				this.publish();
			}
			/** The current values as a persistable config (every field concrete). */
			snapshot() {
				return {
					enabled: this.enabledValue,
					backgroundOpacity: this.opacityValue,
					backgroundBlurEmpty: this.blurEmptyValue,
					backgroundBlurContent: this.blurContentValue,
					inputCardBlur: this.inputCardBlurValue,
					bubbleOpacity: this.bubbleOpacityValue,
					bubbleBlur: this.bubbleBlurValue
				};
			}
			enabled = () => this.enabledValue;
			setEnabled(value) {
				this.enabledValue = value;
				this.applyOcclusion();
				this.applyInputCardBlur();
				this.applyBubbleOpacity();
				this.applyBubbleBlur();
				this.syncBlur();
				this.publish();
				this.persist(this.snapshot());
			}
			opacity = () => this.opacityValue;
			blurEmpty = () => this.blurEmptyValue;
			blurContent = () => this.blurContentValue;
			inputCardBlur = () => this.inputCardBlurValue;
			bubbleOpacity = () => this.bubbleOpacityValue;
			bubbleBlur = () => this.bubbleBlurValue;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			set(opacity) {
				this.opacityValue = this.clampPercent(opacity);
				this.applyOcclusion();
				this.publish();
				this.persist(this.snapshot());
			}
			setBlurEmpty(value) {
				this.blurEmptyValue = this.clampBlur(value);
				this.ensureObserver();
				this.syncBlur();
				this.publish();
				this.persist(this.snapshot());
			}
			setBlurContent(value) {
				this.blurContentValue = this.clampBlur(value);
				this.ensureObserver();
				this.syncBlur();
				this.publish();
				this.persist(this.snapshot());
			}
			setInputCardBlur(value) {
				this.inputCardBlurValue = this.clampBlur(value);
				this.applyInputCardBlur();
				this.publish();
				this.persist(this.snapshot());
			}
			setBubbleOpacity(value) {
				this.bubbleOpacityValue = this.clampPercent(value);
				this.applyBubbleOpacity();
				this.publish();
				this.persist(this.snapshot());
			}
			setBubbleBlur(value) {
				this.bubbleBlurValue = this.clampBlur(value);
				this.applyBubbleBlur();
				this.publish();
				this.persist(this.snapshot());
			}
			dispose() {
				this.disposed = true;
				if (this.rafId !== null) {
					cancelAnimationFrame(this.rafId);
					this.rafId = null;
				}
				this.removeBlurElement();
				document.body.style.removeProperty(INPUT_CARD_BLUR_VAR);
				document.body.style.removeProperty(BUBBLE_ALPHA_VAR);
				document.body.style.removeProperty(BUBBLE_BLUR_VAR);
				if (this.observer !== null) {
					this.observer.disconnect();
					this.observer = null;
				}
			}
			/** Copy one config into the live fields, defaults filling the gaps. */
			assign(config) {
				const resolved = resolveSkinBackground(config);
				this.enabledValue = resolved.enabled;
				this.opacityValue = resolved.backgroundOpacity;
				this.blurEmptyValue = resolved.backgroundBlurEmpty;
				this.blurContentValue = resolved.backgroundBlurContent;
				this.inputCardBlurValue = resolved.inputCardBlur;
				this.bubbleOpacityValue = resolved.bubbleOpacity;
				this.bubbleBlurValue = resolved.bubbleBlur;
			}
			clampBlur(value) {
				return Math.max(0, Math.min(20, Math.round(value)));
			}
			clampPercent(value) {
				return Math.max(0, Math.min(100, Math.round(value)));
			}
			applyInputCardBlur() {
				if (!this.enabledValue) {
					document.body.style.removeProperty(INPUT_CARD_BLUR_VAR);
					return;
				}
				document.body.style.setProperty(INPUT_CARD_BLUR_VAR, this.inputCardBlurValue + "px");
			}
			applyBubbleOpacity() {
				if (!this.enabledValue) {
					document.body.style.removeProperty(BUBBLE_ALPHA_VAR);
					return;
				}
				document.body.style.setProperty(BUBBLE_ALPHA_VAR, String(this.bubbleOpacityValue / 100));
			}
			applyBubbleBlur() {
				if (!this.enabledValue) {
					document.body.style.removeProperty(BUBBLE_BLUR_VAR);
					return;
				}
				document.body.style.setProperty(BUBBLE_BLUR_VAR, this.bubbleBlurValue + "px");
			}
			/** Write the current occlusion onto the body CSS variable (0..1 alpha). */
			applyOcclusion() {
				if (!this.enabledValue) {
					document.body.style.removeProperty(SCRIM_VAR);
					return;
				}
				document.body.style.setProperty(SCRIM_VAR, String(this.opacityValue / 100));
			}
			/**
			* Apply the active blur: empty or with-content strength depending on the
			* conversation state. A value > 0 ensures the fixed blur element exists
			* with the matching backdrop-filter; 0 removes it.
			*/
			syncBlur() {
				if (this.disposed) return;
				if (this.hasExternalWallpaper()) {
					this.removeBlurElement();
					return;
				}
				if (!this.enabledValue) {
					this.removeBlurElement();
					return;
				}
				this.ensureObserver();
				const active = this.hasConversationContent() ? this.blurContentValue : this.blurEmptyValue;
				if (active > 0) this.ensureBlurElement(active);
				else this.removeBlurElement();
			}
			/** True when the conversation pane hosts at least one message row. */
			hasConversationContent() {
				return document.querySelector(CONVERSATION_CONTENT_SELECTOR) !== null;
			}
			/**
			* True while the delegated Wallpaper Engine plugin renders a wallpaper.
			*
			* The marker is the plugin's own stable `body` attribute (issue #39); this
			* layer reads it, never writes it.
			*/
			hasExternalWallpaper() {
				return document.body?.hasAttribute("data-we-wallpaper") === true;
			}
			/** Create (if needed) and size the fixed backdrop-filter element. */
			ensureBlurElement(active) {
				if (this.blurElement === null) {
					const element = document.createElement("div");
					element.style.position = "fixed";
					element.style.inset = "0";
					element.style.zIndex = "-1";
					element.style.pointerEvents = "none";
					element.setAttribute("aria-hidden", "true");
					this.blurElement = element;
					document.body.appendChild(element);
					this.appliedBlur = null;
				}
				if (this.appliedBlur === active) return;
				this.appliedBlur = active;
				const blur = "blur(" + active + "px)";
				this.blurElement.style.backdropFilter = blur;
				this.blurElement.style.setProperty("-webkit-backdrop-filter", blur);
			}
			/** Remove the fixed blur element, if present. */
			removeBlurElement() {
				if (this.blurElement === null) return;
				this.blurElement.remove();
				this.blurElement = null;
				this.appliedBlur = null;
			}
			/**
			* Install the MutationObserver on document.body only when either blur
			* field is active, so a fully-disabled blur never pays the observation
			* cost. Runs lazily on the first non-zero set.
			*/
			ensureObserver() {
				if (this.disposed || this.observer !== null) return;
				if (this.blurEmptyValue <= 0 && this.blurContentValue <= 0) return;
				this.observer = new MutationObserver(() => this.scheduleRecheck());
				this.observer.observe(document.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["class", "data-we-wallpaper"]
				});
			}
			/** Coalesce burst mutations into one rAF-delayed recheck. */
			scheduleRecheck() {
				if (this.disposed || this.rafId !== null) return;
				this.rafId = requestAnimationFrame(() => {
					this.rafId = null;
					if (this.disposed) return;
					this.syncBlur();
				});
			}
			publish() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region src/core/background-scope.ts
		/**
		* Safe reconciliation helpers for the legacy skin-background settings scope.
		*
		* The scope's resolved value contains schema defaults, while its raw user layer
		* contains only fields explicitly stored by the user. The v2 active-state
		* document is authoritative, so a scope update may merge only those raw fields
		* into the live background values.
		*/
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		/** Return the known, explicitly stored skin-background fields from a user layer. */
		function extractSkinBackgroundUserLayer(value) {
			if (!isRecord(value)) return null;
			const normalized = normalizeSkinBackground(value);
			const knownFields = Object.keys(normalized);
			if (knownFields.length === 0) return null;
			const owned = {};
			for (const field of knownFields) owned[field] = normalized[field];
			return owned;
		}
		/**
		* Build a v2-safe patch from the raw user layer. Absent fields, including
		* schema-default fields absent from the user layer, never enter the patch.
		*/
		function skinBackgroundUserPatch(current, user) {
			const userConfig = extractSkinBackgroundUserLayer(user);
			if (userConfig === null) return null;
			const patch = {};
			for (const field of SKIN_BACKGROUND_FIELDS) {
				if (!Object.hasOwn(userConfig, field)) continue;
				const value = userConfig[field];
				if (value === void 0 || value === current[field]) continue;
				patch[field] = value;
			}
			return Object.keys(patch).length === 0 ? null : patch;
		}
		/** Deterministic serialization of the user layer for content-based dedup. */
		function serializeSkinBackgroundUserLayer(user) {
			const extracted = extractSkinBackgroundUserLayer(user);
			return extracted === null ? "" : JSON.stringify(extracted);
		}
		/** Seed the reconcile state from the scope snapshot visible at construction. */
		function initialSkinBackgroundReconcileState(snapshot) {
			return {
				v2Loaded: false,
				bootSyncSeen: false,
				lastRevision: snapshot.revision,
				lastUserJson: serializeSkinBackgroundUserLayer(snapshot.user)
			};
		}
		/**
		* Fold one scope publication into the reconcile state and produce the v2-safe
		* patch to merge into the live background values (null = nothing to apply).
		*
		* The boot document never merges, whichever order it lands in:
		*  - a publication seen before the v2 GET completes is only recorded, so the
		*    post-load check reads it as the unchanged boot snapshot, not an edit;
		*  - the first revisioned publication of the plugin's lifetime (the document
		*    resync itself) is consumed as the boot sync even when it lands after the
		*    GET, because a genuine settings-page edit can only follow the document.
		*/
		function reconcileSkinBackgroundPublication(state, current, snapshot) {
			const seen = {
				...state,
				lastRevision: snapshot.revision ?? state.lastRevision,
				lastUserJson: serializeSkinBackgroundUserLayer(snapshot.user)
			};
			if (!state.v2Loaded) return {
				state: seen,
				patch: null
			};
			if (!state.bootSyncSeen) return {
				state: snapshot.revision === void 0 ? seen : {
					...seen,
					bootSyncSeen: true
				},
				patch: null
			};
			return {
				state: seen,
				patch: reconcileSkinBackgroundScope(current, snapshot, state.lastRevision, state.lastUserJson).patch
			};
		}
		/**
		* Accept a scope publication only when its namespace revision is new AND the
		* user layer has actually changed. A revision bump with identical user-layer
		* content is a replay (settings-mirror resync, WS reconnect, or another
		* plugin writing to the global settings document) and must not overwrite the
		* authoritative v2 state.
		*/
		function reconcileSkinBackgroundScope(current, snapshot, lastRevision, lastUserJson) {
			const currentUserJson = serializeSkinBackgroundUserLayer(snapshot.user);
			if (snapshot.revision === void 0 || snapshot.revision === lastRevision || currentUserJson === lastUserJson || currentUserJson === "") return {
				accepted: false,
				revision: snapshot.revision ?? lastRevision,
				lastUserJson: currentUserJson,
				patch: null
			};
			return {
				accepted: true,
				revision: snapshot.revision,
				lastUserJson: currentUserJson,
				patch: skinBackgroundUserPatch(current, snapshot.user)
			};
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
		/**
		* How long a first-screen prediction stands down the skin before it expires on
		* its own.
		*
		* The prediction covers exactly one window: the peer's client chain resolving
		* its persisted selection and stamping its marker, measured at roughly
		* 300ms-1s. This is the same bounded hand-back window the user-initiated
		* stage claim uses (USER_INITIATED_YIELD_GRACE_MS in skin-controller.ts), for
		* the same reason: the peer's answer is the live marker, and this only has to
		* cover the round trip to it.
		*
		* Expiry is what keeps a wrong prediction from stranding the page. A wallpaper
		* that never renders (a broken file, a decode failure) never stamps the
		* marker, so the window is the only thing standing between that user and their
		* skin. When it closes, the boot activation paints the remembered selection.
		*/
		const PREDICTED_WALLPAPER_GRACE_MS = 1500;
		//#endregion
		//#region src/client/runtime/external-wallpaper-engine.ts
		/**
		* External Wallpaper Engine plugin interop (issue #39, migration round).
		*
		* The skin center no longer ships a Wallpaper Engine bridge: wallpaper support
		* is delegated to `dsh-plugin-wallpaper-engine`, which owns the WE library,
		* the wallpaper rendering and the theme follows the wallpaper. That plugin
		* signals an active wallpaper on the document itself with the stable
		* `body[data-we-wallpaper]` attribute (it stamps the attribute while a
		* wallpaper renders and removes it when playback stops).
		*
		* While that attribute is present the skin center stands its own visual work
		* down, so the wallpaper owns the backdrop:
		*
		*  - the composer frost follower is not mounted (the wallpaper plugin paints
		*    its own glass, and two fixed `backdrop-filter` stacks sample a shell the
		*    other one relaid);
		*  - the skin manifest's `backgroundMedia` is not painted, so the wallpaper is
		*    never covered by skin art (this replaces the old in-house priority rule);
		*  - the active skin keeps its token remaps and patches, which remain correct
		*    over a wallpaper because every skin already yields its opaque plates to
		*    `body[data-we-wallpaper]` (see the catalog skins and
		*    contracts/semantic-attrs-v1.md).
		*
		* The watcher is attribute-only and read-only: it never writes the other
		* plugin's marker, never mounts a layer of its own, and reports through a
		* plain callback so the two consumers (the skin controller's background-media
		* gate and the scene marker) stay independent.
		* @module @linxin666/dsh-client-ui-skin-center/runtime/external-wallpaper-engine
		*/
		/**
		* The stable attribute `dsh-plugin-wallpaper-engine` stamps on `body` while a
		* wallpaper is rendering. This is the plugin's public interop contract, the
		* same one other third-party plugins key on.
		*/
		const EXTERNAL_WE_ACTIVE_ATTR = "data-we-wallpaper";
		/** True when the external wallpaper plugin currently renders a wallpaper. */
		function externalWallpaperEngineActive(doc) {
			return doc.body?.hasAttribute(EXTERNAL_WE_ACTIVE_ATTR) === true;
		}
		/**
		* True when the host withheld this document's skin for a PREDICTED wallpaper
		* (issue #51), and no marker has arrived yet to confirm or deny it.
		*
		* This is what closes the second half of the flash. The host can pre-judge the
		* first screen from the peer's persisted selection, but the browser half boots
		* asynchronously: with no stamp in the document it recovers the selection from
		* GET /active and activates it, which is exactly the switch that would paint a
		* frame of skin into the gap the host just left. The prediction is what tells
		* that switch to stand down until the peer's marker speaks.
		*
		* It expires (see {@link releasePrediction}) rather than standing forever: a
		* wallpaper that never renders must not keep the user off their own skin.
		* @param doc - the document the host stamped.
		* @returns true while a prediction is outstanding.
		*/
		function externalWallpaperPredicted(doc) {
			return doc.documentElement?.hasAttribute(WALLPAPER_EXPECTED_ATTR) === true;
		}
		/**
		* Drop the host's prediction from the document, so a later read reports none.
		*
		* Called once the peer's marker has answered (either way) or the grace window
		* has closed. The attribute is this package's own - the host half stamped it
		* and no other plugin reads it - so clearing it here only ends this package's
		* own first-screen bookkeeping and never touches the peer's marker.
		* @param doc - the document the host stamped.
		*/
		function releasePrediction(doc) {
			doc.documentElement?.removeAttribute(WALLPAPER_EXPECTED_ATTR);
		}
		/**
		* Observe the external plugin's active marker.
		*
		* The callback fires once immediately with the current state (so a page that
		* boots with a wallpaper already rendering never paints a frame of skin art
		* first), then on every flip while the returned teardown is live.
		*
		* @param doc - the document whose `body` carries the marker.
		* @param listener - called with the new state on every change.
		* @returns the idempotent teardown.
		*/
		function watchExternalWallpaperEngine(doc, listener) {
			let last = false;
			let stopped = false;
			const read = () => externalWallpaperEngineActive(doc);
			const report = () => {
				if (stopped) return;
				const next = read();
				if (next === last) return;
				last = next;
				listener(next);
			};
			try {
				last = read();
				listener(last);
			} catch {}
			const win = doc.defaultView;
			if (win === null || typeof win.MutationObserver !== "function") return () => {
				stopped = true;
			};
			const observer = new win.MutationObserver(report);
			observer.observe(doc.body ?? doc.documentElement, {
				attributes: true,
				attributeFilter: [EXTERNAL_WE_ACTIVE_ATTR]
			});
			return () => {
				stopped = true;
				observer.disconnect();
			};
		}
		//#endregion
		//#region src/client/runtime/delegated-theme.ts
		/**
		* Read one delegated plugin's state from the document.
		* @param doc - the document the plugin stamps.
		* @param markers - the two attributes that plugin owns.
		* @returns whether it is live, and whether it can stand down.
		*/
		function delegatedThemeState(doc, markers) {
			const body = doc.body;
			if (body === null) return {
				live: false,
				canYield: false
			};
			return {
				live: body.hasAttribute(markers.bodyAttr),
				canYield: body.hasAttribute(markers.handoffAttr)
			};
		}
		/**
		* Observe one delegated plugin's markers.
		*
		* The callback fires once immediately with the current state, so a page that
		* boots while the plugin is already live never renders a row that claims it is
		* not, then on every flip while the returned teardown is live.
		*
		* @param doc - the document whose body carries the markers.
		* @param markers - the two attributes that plugin owns.
		* @param listener - called with the new state on every change.
		* @returns the idempotent teardown.
		*/
		function watchDelegatedTheme(doc, markers, listener) {
			let last = null;
			let stopped = false;
			const report = () => {
				if (stopped) return;
				const next = delegatedThemeState(doc, markers);
				if (last !== null && next.live === last.live && next.canYield === last.canYield) return;
				last = next;
				listener(next);
			};
			try {
				last = delegatedThemeState(doc, markers);
				listener(last);
			} catch {
				last = {
					live: false,
					canYield: false
				};
			}
			const win = doc.defaultView;
			if (win === null || typeof win.MutationObserver !== "function") return () => {
				stopped = true;
			};
			const observer = new win.MutationObserver(report);
			const target = doc.body ?? doc.documentElement;
			if (target !== null) observer.observe(target, {
				attributes: true,
				attributeFilter: [markers.bodyAttr, markers.handoffAttr]
			});
			return () => {
				stopped = true;
				observer.disconnect();
			};
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
		//#endregion
		//#region src/client/locales.ts
		const en = {
			title: "Skin Center",
			cardDescription: "Try on any skin and exit to restore; applying reloads the page.",
			externalWallpaperReadyTitle: "Wallpapers come from their own plugin",
			externalWallpaperReadyBody: "The library, rendering and settings live in {package}. While it plays a wallpaper, the skin sits on top.",
			externalWallpaperMissingTitle: "Wallpaper Engine is its own plugin now",
			externalWallpaperMissingBody: "Install {package} and restart dsh to use Wallpaper Engine wallpapers.",
			externalWallpaperLink: "Open the wallpaper plugin docs",
			pluginLooksTitle: "Looks from other plugins",
			externalWallpaperName: "Wallpaper Engine",
			externalWallpaperRecommended: "Recommended",
			externalWallpaperInstall: "Install",
			externalWallpaperInstalling: "Installing...",
			externalWallpaperCopyCommand: "Copy command",
			externalWallpaperCopied: "Copied",
			externalWallpaperInstallFailed: "Install failed: {reason}",
			delegatedSkinBadge: "Plugin theme",
			delegatedSkinDescriptionClaudeStyle: "The whole interface as Claude Code Desktop, with its own settings page.",
			delegatedSkinNotRunning: "Installed but not running. Enable it in Plugins, then reopen this page.",
			delegatedSkinNoHandoff: "This build cannot hand the page to another skin. Update dsh-claude-style.",
			delegatedSkinInstall: "Install now",
			delegatedSkinManage: "Manage in Plugins",
			delegatedSkinInstalling: "Installing...",
			delegatedSkinInstallFailed: "Install failed: {reason}",
			delegatedSkinDescriptorMismatch: "The plugin declares a different skin than this page knows. Update the plugin.",
			delegatedSkinLink: "Open the plugin docs",
			stoodDownTitle: "Skin paused while a wallpaper plays",
			stoodDownBody: "The skin stays selected and comes back when the wallpaper stops.",
			enabled: "Skin center",
			enabledHint: "When off, try-on, apply and background controls stop.",
			offNote: "The skin center is off.",
			official: "Official default",
			officialTagline: "The default DSH look.",
			active: "Active",
			tryingOn: "Trying on",
			tryOn: "Try on",
			loading: "Loading…",
			exitTryOn: "Exit try-on",
			apply: "Apply",
			applying: "Applying…",
			restore: "Restore",
			applyFailed: "Apply failed",
			appliedUnconfirmed: "Written but not confirmed yet: refresh in dev mode, or restart DSH Desktop.",
			appliedNeedRestart: "Written and confirmed, but the host did not hot-reload; restart dsh.",
			theme: "Theme preview",
			themeLight: "Light",
			themeDark: "Dark",
			tryOnError: "Try-on failed; see the console.",
			backgroundOpacity: "Background occlusion",
			backgroundBlurEmpty: "Blur when empty",
			backgroundBlurContent: "Blur with content",
			inputCardBlur: "Input card blur",
			inputCardBlurHint: "Blurs only the area behind the input card.",
			bubbleOpacity: "Bubble opacity",
			bubbleOpacityHint: "For skins with translucent bubbles, such as Whale Mom.",
			bubbleBlur: "Bubble blur",
			bubbleBlurHint: "Blurs the area behind message bubbles; 0 turns it off.",
			backgroundBlurHint: "One blur for an empty chat and one for a busy chat; 0 turns it off.",
			backgroundBlurInert: "Only for skins with backdrop art.",
			backgroundHint: "Veils the backdrop; higher values fade the art.",
			backgroundHintInert: "Only for skins with backdrop art, such as Blue Fantasy or Whale Song.",
			wallpaperTitle: "Wallpaper Engine",
			wallpaperEnable: "Enable wallpapers",
			wallpaperHint: "Use your local Wallpaper Engine library as the GUI backdrop: video, web, and scene wallpapers render live (scene wallpapers need WebGL). On macOS there is no Wallpaper Engine library, so the feature starts off — turn it on, then add a folder of videos.",
			wallpaperLoadError: "Wallpaper library failed to load",
			wallpaperLibraryFound: "Wallpaper Engine library detected",
			wallpaperLibraryManual: "Folders you added",
			wallpaperRefresh: "Refresh",
			wallpaperMode: "Render mode",
			wallpaperModeLive: "Live",
			wallpaperModeFrame: "Static frame",
			wallpaperFit: "Sizing mode",
			wallpaperFitCover: "Cover (fill)",
			wallpaperFitContain: "Fit (entire image)",
			wallpaperFitFill: "Stretch",
			wallpaperClear: "Turn off wallpaper",
			wallpaperDim: "Wallpaper dimming",
			wallpaperOpacity: "Wallpaper opacity",
			wallpaperBlur: "Wallpaper blur",
			wallpaperPauseHidden: "Pause when window hidden",
			wallpaperSound: "Wallpaper sound",
			wallpaperSoundHint: "Play video wallpaper audio. The browser may keep it silent until you click or press a key once.",
			wallpaperVolume: "Wallpaper volume",
			wallpaperImport: "Import",
			wallpaperImportHint: "Copy this wallpaper into local storage, so it keeps working even if the Steam library moves or changes",
			wallpaperReimport: "Update",
			wallpaperRemove: "Remove",
			wallpaperUpdateAvailable: "The workshop original changed since import — update the local copy",
			wallpaperEmpty: "No wallpapers found. Add a folder of videos below, or subscribe in the Wallpaper Engine workshop on Windows.",
			wallpaperTypeVideo: "Video",
			wallpaperTypeWeb: "Web",
			wallpaperTypeScene: "Scene (static)",
			wallpaperTypeApp: "Unsupported",
			wallpaperLoadMore: "Load more",
			wallpaperDirs: "Manual folders",
			wallpaperDirsEmpty: "No folders yet — add one to load its videos.",
			wallpaperDirsHint: "On macOS: pick a folder of .mp4/.webm videos (or a wallpaper project folder). On Windows, folders extend the auto-detected Wallpaper Engine library.",
			wallpaperDirPlaceholder: "/path/to/wallpapers or ~/Movies/wallpapers",
			wallpaperDirAdd: "Add",
			wallpaperDirBrowse: "Browse…",
			wallpaperDirBrowseHint: "Pick a folder with the system file manager (Finder / Explorer)",
			wallpaperDirBrowseFailed: "Could not open the system folder picker — type the path manually instead",
			wallpaperDirBrowseTitle: "Select a folder",
			wallpaperDirBrowseChoose: "Use this folder",
			wallpaperDirBrowseEmpty: "No subfolders",
			wallpaperDirBrowseHidden: "Show hidden folders",
			wallpaperDirBrowseTruncated: "Too many folders to list; only the beginning is shown.",
			wallpaperSaveFailed: "Could not save wallpaper settings.",
			wallpaperRatingAll: "All",
			wallpaperRatingG: "G",
			wallpaperRatingPg13: "PG-13",
			wallpaperRatingR18: "R18",
			wallpaperPagePrev: "Previous",
			wallpaperPageNext: "Next",
			wallpaperPageJump: "Go",
			wallpaperPageTotal: "Page {page} / {total}",
			customThemeTitle: "Custom theme",
			customThemeTagline: "A palette derived from the default theme and saved on its own.",
			customThemeEdit: "Edit",
			customThemeCloseEdit: "Collapse",
			customThemeMode: "Editing mode",
			customThemeLight: "Light",
			customThemeDark: "Dark",
			customThemeAccent: "Accent",
			customThemeBackground: "Background",
			customThemeForeground: "Foreground",
			customThemeContrast: "Contrast",
			customThemeReset: "Restore current mode default",
			customThemeResetHint: "Resets only the light or dark profile in view.",
			customThemeSaveFailed: "Could not save custom theme changes.",
			uninstall: "Uninstall",
			uninstalling: "Uninstalling…",
			uninstallConfirm: "Are you sure you want to uninstall \"{name}\"? Local files will be deleted.",
			uninstallFailed: "Uninstall failed",
			verifyIntegrity: "Verify integrity",
			verifyingIntegrity: "Verifying…",
			verifyAllPassed: "All {count} installed skin(s) passed integrity verification",
			verifyFoundIssues: "Found {count} skin(s) with integrity issues",
			integrityValid: "Verified",
			integrityTampered: "Modified",
			integrityMissing: "Missing files",
			integrityHooksRefused: "Hooks refused",
			cancel: "Cancel",
			confirm: "Confirm",
			verifyRepaired: "Successfully repaired {count} skin(s) with integrity issues",
			verifyRepairFailed: "Failed to repair {count} skin(s)",
			updateAll: "Update all",
			updateAllChecking: "Checking versions…",
			updateAllRunning: "Updating {done}/{total}…",
			updateAllNone: "All installed skins are up to date",
			updateAllDone: "Updated {count} skin(s)",
			updateAllFailed: "{count} skin(s) failed to update",
			uninstallAll: "Uninstall all",
			uninstallAllConfirm: "Uninstall all {count} market-installed skin(s)? Their local files are deleted permanently and the GUI returns to the default look.",
			uninstallAllRunning: "Uninstalling {done}/{total}…",
			uninstallAllDone: "Uninstalled {count} skin(s)",
			uninstallAllFailed: "{count} skin(s) failed to uninstall",
			marketUnreachable: "Could not reach the skin market to read versions",
			bulkNoUserSkins: "No market-installed skins to act on",
			repair: "Repair",
			repairing: "Repairing…",
			repaired: "Repaired"
		};
		const zh = {
			title: "皮肤",
			cardDescription: "试穿任意皮肤，退出即还原；应用后页面自动刷新。",
			externalWallpaperReadyTitle: "壁纸由独立插件提供",
			externalWallpaperReadyBody: "壁纸库、渲染与设置都在 {package} 里。它播放壁纸时，皮肤叠在壁纸之上。",
			externalWallpaperMissingTitle: "Wallpaper Engine 已独立成插件",
			externalWallpaperMissingBody: "安装 {package} 后重启 dsh，就能用 Wallpaper Engine 壁纸。",
			externalWallpaperLink: "打开壁纸插件文档",
			pluginLooksTitle: "插件提供的外观",
			externalWallpaperName: "Wallpaper Engine",
			externalWallpaperRecommended: "推荐",
			externalWallpaperInstall: "一键安装",
			externalWallpaperInstalling: "安装中…",
			externalWallpaperCopyCommand: "复制命令",
			externalWallpaperCopied: "已复制",
			externalWallpaperInstallFailed: "安装失败：{reason}",
			delegatedSkinBadge: "插件皮肤",
			delegatedSkinDescriptionClaudeStyle: "整个界面换成 Claude Code Desktop 的样子，自带设置页。",
			delegatedSkinNotRunning: "插件已安装但没有运行。在「插件」里启用后刷新本页。",
			delegatedSkinNoHandoff: "当前版本不能和别的皮肤交接页面，请更新 dsh-claude-style。",
			delegatedSkinInstall: "一键安装",
			delegatedSkinManage: "在插件页管理",
			delegatedSkinInstalling: "安装中…",
			delegatedSkinInstallFailed: "安装失败：{reason}",
			delegatedSkinDescriptorMismatch: "插件声明的皮肤与这里记录的不一致，请更新插件。",
			delegatedSkinLink: "打开插件文档",
			stoodDownTitle: "壁纸播放时皮肤暂停",
			stoodDownBody: "皮肤仍然选着，壁纸停下后自动恢复。",
			enabled: "皮肤中心",
			enabledHint: "关闭后停用试穿、应用与背景调节。",
			offNote: "皮肤中心已关闭。",
			official: "官方默认",
			officialTagline: "DSH 的默认外观。",
			active: "当前激活",
			tryingOn: "试穿中",
			tryOn: "试穿",
			loading: "加载中…",
			exitTryOn: "退出试穿",
			apply: "应用",
			applying: "应用中…",
			restore: "恢复默认",
			applyFailed: "应用失败",
			appliedUnconfirmed: "已写入配置，尚未确认生效：开发模式请刷新页面，DSH Desktop 请重启应用。",
			appliedNeedRestart: "已写入并确认，但宿主没有热重载，请重启 dsh。",
			theme: "主题预览",
			themeLight: "亮色",
			themeDark: "暗色",
			tryOnError: "试穿失败，详情见控制台。",
			backgroundOpacity: "背景遮挡",
			backgroundBlurEmpty: "空对话背景模糊",
			backgroundBlurContent: "有对话背景模糊",
			inputCardBlur: "输入卡模糊",
			inputCardBlurHint: "只模糊输入卡背后的区域。",
			bubbleOpacity: "气泡不透明度",
			bubbleOpacityHint: "适用于支持气泡透明度的皮肤，例如鲸鱼妈妈。",
			bubbleBlur: "气泡模糊程度",
			bubbleBlurHint: "模糊消息气泡背后的区域，0 为关闭。",
			backgroundBlurHint: "空对话与有内容时各用一档模糊，0 为关闭。",
			backgroundBlurInert: "只对带背景图的皮肤有效。",
			backgroundHint: "给背景加一层遮罩，数值越高插画越淡。",
			backgroundHintInert: "只对带背景图的皮肤有效，例如蓝色幻想、鲸吟。",
			wallpaperTitle: "Wallpaper Engine",
			wallpaperEnable: "启用动态壁纸",
			wallpaperHint: "把本机 Wallpaper Engine 壁纸库用作 GUI 背景：视频、网页与场景壁纸均动态渲染（场景壁纸需要 WebGL）。macOS 没有 Wallpaper Engine 壁纸库，该功能默认关闭；开启后添加一个存放视频的目录即可。",
			wallpaperLoadError: "壁纸库加载失败",
			wallpaperLibraryFound: "已检测到 Wallpaper Engine 壁纸库",
			wallpaperLibraryManual: "来自你添加的目录",
			wallpaperRefresh: "刷新",
			wallpaperMode: "渲染模式",
			wallpaperModeLive: "动态",
			wallpaperModeFrame: "静态帧",
			wallpaperFit: "适应方式",
			wallpaperFitCover: "铺满裁剪",
			wallpaperFitContain: "完整缩放",
			wallpaperFitFill: "拉伸铺满",
			wallpaperClear: "关闭壁纸",
			wallpaperDim: "壁纸暗化",
			wallpaperOpacity: "壁纸不透明度",
			wallpaperBlur: "壁纸模糊",
			wallpaperPauseHidden: "窗口隐藏时暂停",
			wallpaperSound: "壁纸声音",
			wallpaperSoundHint: "播放视频壁纸的声音。浏览器可能在首次点击或按键前保持静音。",
			wallpaperVolume: "壁纸音量",
			wallpaperImport: "导入",
			wallpaperImportHint: "把该壁纸复制到本地存储，Steam 库迁移或变动后仍可继续使用",
			wallpaperReimport: "更新",
			wallpaperRemove: "移除",
			wallpaperUpdateAvailable: "工坊原件在导入后有更新——同步更新本地副本",
			wallpaperEmpty: "未发现壁纸。请在下方添加一个存放视频的目录；Windows 上也可先在 Wallpaper Engine 创意工坊订阅。",
			wallpaperTypeVideo: "视频",
			wallpaperTypeWeb: "网页",
			wallpaperTypeScene: "场景(静态)",
			wallpaperTypeApp: "不支持",
			wallpaperLoadMore: "加载更多",
			wallpaperDirs: "手动目录",
			wallpaperDirsEmpty: "还没有目录——添加一个以加载其中的视频。",
			wallpaperDirsHint: "macOS：选择一个存放 .mp4/.webm 视频的目录（或单个壁纸项目文件夹）。Windows：这里添加的目录会扩展自动检测到的 Wallpaper Engine 壁纸库。",
			wallpaperDirPlaceholder: "/path/to/wallpapers 或 ~/Movies/wallpapers",
			wallpaperDirAdd: "添加",
			wallpaperDirBrowse: "浏览…",
			wallpaperDirBrowseHint: "通过系统文件管理器（访达 / 资源管理器）选择文件夹",
			wallpaperDirBrowseFailed: "无法打开系统目录选择框——请手动输入路径",
			wallpaperDirBrowseTitle: "选择文件夹",
			wallpaperDirBrowseChoose: "使用此目录",
			wallpaperDirBrowseEmpty: "没有子目录",
			wallpaperDirBrowseHidden: "显示隐藏目录",
			wallpaperDirBrowseTruncated: "目录过多，仅显示开头部分。",
			wallpaperSaveFailed: "壁纸设置保存失败。",
			wallpaperRatingAll: "全部",
			wallpaperRatingG: "G",
			wallpaperRatingPg13: "PG-13",
			wallpaperRatingR18: "R18",
			wallpaperPagePrev: "上一页",
			wallpaperPageNext: "下一页",
			wallpaperPageJump: "跳转",
			wallpaperPageTotal: "第 {page} / {total} 页",
			customThemeTitle: "自定义主题",
			customThemeTagline: "从默认主题派生、单独保存的配色。",
			customThemeEdit: "编辑",
			customThemeCloseEdit: "收起",
			customThemeMode: "编辑模式",
			customThemeLight: "浅色",
			customThemeDark: "深色",
			customThemeAccent: "强调色",
			customThemeBackground: "背景色",
			customThemeForeground: "前景色",
			customThemeContrast: "对比度",
			customThemeReset: "恢复当前模式默认",
			customThemeResetHint: "只重置当前的浅色或深色配置。",
			customThemeSaveFailed: "自定义主题修改保存失败。",
			uninstall: "卸载",
			uninstalling: "卸载中…",
			uninstallConfirm: "确定要卸载皮肤「{name}」吗？本地文件将被永久删除。",
			uninstallFailed: "卸载失败",
			verifyIntegrity: "验证完整性",
			verifyingIntegrity: "正在验证…",
			verifyAllPassed: "所有 {count} 款已安装皮肤完整性正常",
			verifyFoundIssues: "发现 {count} 款皮肤存在完整性异常",
			verifyRepaired: "已自动修复 {count} 款皮肤的完整性异常",
			verifyRepairFailed: "{count} 款皮肤自动修复失败",
			updateAll: "全部更新",
			updateAllChecking: "正在检查版本…",
			updateAllRunning: "正在更新 {done}/{total}…",
			updateAllNone: "所有已安装皮肤均为最新版本",
			updateAllDone: "已更新 {count} 款皮肤",
			updateAllFailed: "{count} 款皮肤更新失败",
			uninstallAll: "全部卸载",
			uninstallAllConfirm: "确定要卸载全部 {count} 款市场安装的皮肤吗？本地文件将被永久删除，界面回到默认外观。",
			uninstallAllRunning: "正在卸载 {done}/{total}…",
			uninstallAllDone: "已卸载 {count} 款皮肤",
			uninstallAllFailed: "{count} 款皮肤卸载失败",
			marketUnreachable: "无法连接皮肤市场以读取版本",
			bulkNoUserSkins: "没有可操作的市场安装皮肤",
			repair: "修复",
			repairing: "修复中…",
			repaired: "已修复",
			integrityValid: "完整",
			integrityTampered: "文件已修改",
			integrityMissing: "缺少文件",
			integrityHooksRefused: "Hooks 已拒绝",
			cancel: "取消",
			confirm: "确定"
		};
		//#endregion
		//#region src/client/preview-coordinator.ts
		var PreviewCoordinator = class {
			skin;
			customTheme;
			tail = Promise.resolve();
			constructor(skin, customTheme) {
				this.skin = skin;
				this.customTheme = customTheme;
			}
			runSkin(action) {
				return this.enqueue(async () => {
					if (this.customTheme?.getState().previewing === true) this.customTheme.exitTryOn();
					this.customTheme?.suspend();
					try {
						return await action();
					} finally {
						if (!this.skin.getState().previewing) this.customTheme?.resume();
					}
				});
			}
			runCustomTheme(action) {
				return this.enqueue(async () => {
					if (!(this.customTheme?.getState().previewing === true) && this.skin.getState().previewing) await this.skin.exitTryOn();
					this.customTheme?.resume();
					return await action();
				});
			}
			enqueue(action) {
				const run = this.tail.then(action, action);
				this.tail = run.then(() => void 0, () => void 0);
				return run;
			}
		};
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
		function record(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
		}
		function color(value, fallback) {
			return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
		}
		function contrast(value, fallback) {
			if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
			return Math.max(0, Math.min(100, Math.round(value)));
		}
		function normalizeProfile(value, fallback) {
			const source = record(value);
			return {
				accent: color(source.accent, fallback.accent),
				background: color(source.background, fallback.background),
				foreground: color(source.foreground, fallback.foreground),
				contrast: contrast(source.contrast, fallback.contrast)
			};
		}
		/** Normalize untrusted settings data into the current contract version. */
		function normalizeCustomThemeConfig(value) {
			const source = record(value);
			if (source.version !== void 0 && source.version !== 1) return {
				version: 1,
				applied: false,
				light: { ...CUSTOM_THEME_DEFAULTS.light },
				dark: { ...CUSTOM_THEME_DEFAULTS.dark }
			};
			return {
				version: 1,
				applied: source.applied === true,
				light: normalizeProfile(source.light, CUSTOM_THEME_DEFAULTS.light),
				dark: normalizeProfile(source.dark, CUSTOM_THEME_DEFAULTS.dark)
			};
		}
		function mix(a, aPercent, b) {
			return `color-mix(in srgb, ${a} ${aPercent}%, ${b})`;
		}
		function declarations(profile) {
			const { accent, background, foreground } = profile;
			const depth1 = 2 + Math.round(profile.contrast * .12);
			const depth2 = depth1 + 4;
			const depth3 = depth2 + 4;
			const border = 12 + Math.round(profile.contrast * .18);
			const mutedText = 60 + Math.round(profile.contrast * .2);
			return [
				["--dsw-alias-bg-base", background],
				["--dsw-alias-bg-layer-1", mix(background, 100 - depth1, foreground)],
				["--dsw-alias-bg-layer-2", mix(background, 100 - depth2, foreground)],
				["--dsw-alias-bg-layer-3", mix(background, 100 - depth3, foreground)],
				["--dsw-alias-bg-multi-select", mix(background, 84, accent)],
				["--dsw-alias-bg-overlay", mix(background, 90 - Math.round(profile.contrast * .08), foreground)],
				["--dsw-alias-bg-skeleton", mix(background, 82, foreground)],
				["--dsw-alias-border-l1", mix(background, 100 - border, foreground)],
				["--dsw-alias-border-l2", mix(background, 100 - Math.max(8, border - 5), foreground)],
				["--dsw-alias-border-l3", mix(background, 100 - Math.max(5, border - 9), foreground)],
				["--dsw-alias-border-l4", mix(background, 96, foreground)],
				["--dsw-alias-brand-primary", accent],
				["--dsw-alias-brand-primary-invert", background],
				["--dsw-alias-brand-text", accent],
				["--dsw-alias-button-primary-dimmed", mix(accent, 48, background)],
				["--dsw-alias-button-primary-fill", accent],
				["--dsw-alias-button-primary-hover", mix(accent, 82, foreground)],
				["--dsw-alias-interactive-bg-active", mix(background, 78, accent)],
				["--dsw-alias-interactive-bg-hover", mix(background, 100 - depth2, foreground)],
				["--dsw-alias-interactive-bg-hover-accent", mix(background, 84, accent)],
				["--dsw-alias-label-dimmed", mix(foreground, 42, background)],
				["--dsw-alias-label-primary", foreground],
				["--dsw-alias-label-primary-foreground", foreground],
				["--dsw-alias-label-secondary", mix(foreground, mutedText, background)],
				["--dsw-alias-label-tertiary", mix(foreground, Math.max(45, mutedText - 18), background)],
				["--dsw-alias-markdown-code-block", mix(background, 100 - depth2, foreground)],
				["--dsw-alias-markdown-code-block-banner", mix(background, 100 - depth3, foreground)],
				["--dsw-alias-markdown-inline-code", mix(background, 86, accent)],
				["--dsw-alias-scrollbar-bg-l1", mix(background, 94, foreground)],
				["--dsw-alias-scrollbar-hover-l1", mix(background, 76, foreground)],
				["--dsw-alias-toast-bg", mix(background, 100 - depth3, foreground)],
				["--dsw-alias-tooltip-bg", mix(background, 28, foreground)],
				["--dsw-specific-bubble", mix(background, 92, accent)],
				["--dsw-specific-bubble-highlight", mix(background, 82, accent)],
				["--dsw-specific-input-major", mix(background, 100 - depth1, foreground)],
				["--dsw-specific-menu", mix(background, 100 - depth1, foreground)],
				["--dsw-specific-selector", mix(background, 100 - depth2, foreground)],
				["--dsw-specific-sidebar-fill", mix(background, 100 - depth1, foreground)],
				["--dsw-specific-sidebar-nav-item-active", mix(background, 86, accent)],
				["--dsw-specific-sidebar-nav-item-active-accent", accent]
			];
		}
		function block(selector, profile) {
			return `${selector} {\n${declarations(profile).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`;
		}
		/** Build stock-only CSS from normalized, fixed token declarations. */
		function buildCustomThemeCss(value) {
			const config = normalizeCustomThemeConfig(value);
			return [block("html[data-dsh-custom-theme]:not([data-dsh-skin]) body", config.light), block("html[data-dsh-custom-theme]:not([data-dsh-skin]) body[data-ds-dark-theme]", config.dark)].join("\n\n");
		}
		//#endregion
		//#region src/client/custom-theme-controller.ts
		/** Owns the custom-theme configuration section and its inert-by-default style. */
		var CustomThemeController = class {
			scope;
			doc;
			style;
			unsubscribe;
			listeners = /* @__PURE__ */ new Set();
			config;
			previewingValue = false;
			suspended = false;
			state;
			disposed = false;
			writeQueue = [];
			pendingWrites = 0;
			drainingWrites = false;
			constructor(scope, options = {}) {
				this.scope = scope;
				this.doc = options.doc ?? document;
				this.config = normalizeCustomThemeConfig(scope.getSnapshot().value);
				this.style = this.doc.createElement("style");
				this.style.dataset.dshCustomThemeStyle = "";
				this.doc.head.appendChild(this.style);
				this.state = {
					applied: this.config.applied,
					previewing: false,
					visible: false,
					writeError: null
				};
				this.syncDom();
				this.unsubscribe = scope.subscribe(() => {
					if (this.disposed || this.pendingWrites > 0) return;
					this.syncFromScope();
				});
			}
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			getState = () => this.state;
			profile(scheme) {
				return { ...this.config[scheme] };
			}
			setProfileValue(scheme, key, value) {
				const next = normalizeCustomThemeConfig({
					...this.config,
					[scheme]: {
						...this.config[scheme],
						[key]: value
					}
				});
				this.config = next;
				this.clearWriteError();
				this.syncDom();
				this.publish();
				this.queueWrite(scheme, { ...next[scheme] }).catch((error) => {
					this.setWriteError(error);
				});
			}
			reset(scheme) {
				const profile = { ...CUSTOM_THEME_DEFAULTS[scheme] };
				this.config = {
					...this.config,
					[scheme]: profile
				};
				this.clearWriteError();
				this.syncDom();
				this.publish();
				this.queueWrite(scheme, profile).catch((error) => {
					this.setWriteError(error);
				});
			}
			tryOn() {
				this.previewingValue = true;
				this.suspended = false;
				this.syncDom();
				this.publish();
			}
			exitTryOn() {
				this.previewingValue = false;
				this.suspended = false;
				this.syncDom();
				this.publish();
			}
			async apply() {
				this.config = {
					...this.config,
					applied: true
				};
				this.previewingValue = false;
				this.suspended = false;
				this.syncDom();
				this.publish();
				await this.queueWrite("applied", true);
				if (!this.config.applied) throw new Error("custom theme activation was not persisted");
			}
			async deactivate() {
				if (!this.config.applied) {
					this.previewingValue = false;
					this.suspended = false;
					this.syncDom();
					this.publish();
					return;
				}
				this.config = {
					...this.config,
					applied: false
				};
				this.previewingValue = false;
				this.suspended = false;
				this.syncDom();
				this.publish();
				if (this.scope.getSnapshot().status === "unavailable") return;
				await this.queueWrite("applied", false);
				if (this.config.applied) throw new Error("custom theme deactivation was not persisted");
			}
			suspend() {
				if (this.suspended) return;
				this.suspended = true;
				this.syncDom();
				this.publish();
			}
			resume() {
				if (!this.suspended) return;
				this.suspended = false;
				this.syncDom();
				this.publish();
			}
			dispose() {
				if (this.disposed) return;
				this.disposed = true;
				this.unsubscribe();
				this.listeners.clear();
				this.style.remove();
				this.doc.documentElement.removeAttribute("data-dsh-custom-theme");
			}
			syncDom() {
				this.style.textContent = buildCustomThemeCss(this.config);
				const visible = (this.config.applied || this.previewingValue) && !this.suspended;
				if (visible) this.doc.documentElement.setAttribute("data-dsh-custom-theme", "true");
				else this.doc.documentElement.removeAttribute("data-dsh-custom-theme");
				this.state = {
					applied: this.config.applied,
					previewing: this.previewingValue,
					visible,
					writeError: this.state.writeError
				};
			}
			publish() {
				for (const listener of this.listeners) listener();
			}
			syncFromScope() {
				this.config = normalizeCustomThemeConfig(this.scope.getSnapshot().value);
				this.syncDom();
				this.publish();
			}
			clearWriteError() {
				if (this.state.writeError === null) return;
				this.state = {
					...this.state,
					writeError: null
				};
			}
			setWriteError(error) {
				this.state = {
					...this.state,
					writeError: error instanceof Error ? error.message : String(error)
				};
				this.publish();
			}
			/**
			* Identity of the settings section a refused write addressed, for the error a
			* user sees. It carries the Host's own status and revision — which entry
			* answered, whether it can be written, and at which revision — and never any
			* stored configuration value, so a refused save can be diagnosed from the
			* message alone without exposing what the user configured.
			* @returns a short diagnostic fragment naming the section and its state.
			*/
			sectionState() {
				const snapshot = this.scope.getSnapshot();
				const revision = snapshot.revision === void 0 ? "none" : String(snapshot.revision);
				return `${SKIN_CUSTOM_THEME_NS}: status ${snapshot.status}, writable ${String(snapshot.writable)}, revision ${revision}`;
			}
			queueWrite(field, value) {
				this.pendingWrites += 1;
				const pending = new Promise((resolve, reject) => {
					this.writeQueue.push({
						field,
						value,
						resolve,
						reject
					});
				});
				this.drainWrites();
				return pending;
			}
			async drainWrites() {
				if (this.drainingWrites) return;
				this.drainingWrites = true;
				const settled = [];
				while (this.writeQueue.length > 0) {
					const write = this.writeQueue.shift();
					if (write === void 0) break;
					try {
						if (!await this.scope.set(write.field, write.value)) throw new Error(`the Host did not accept the custom theme setting (${this.sectionState()})`);
					} catch (error) {
						settled.push({
							write,
							ok: false,
							error
						});
						continue;
					} finally {
						this.pendingWrites -= 1;
					}
					settled.push({
						write,
						ok: true
					});
				}
				this.drainingWrites = false;
				if (!this.disposed) this.syncFromScope();
				const failure = settled.find((result) => !result.ok);
				if (!this.disposed && failure !== void 0 && !failure.ok) this.setWriteError(failure.error);
				for (const result of settled) if (result.ok) result.write.resolve();
				else result.write.reject(result.error);
			}
		};
		//#endregion
		//#region src/client/settings-section.ts
		/** Read one object-shaped layer of a form snapshot. */
		function layerOf(layer, key) {
			return typeof layer === "object" && layer !== null ? layer[key] : void 0;
		}
		/**
		* Project one entry form onto the section behind `key`.
		* @param parent - the form of the profile entry that owns this section.
		* @param key - the section key inside the entry's Config.
		* @returns the section's form: its own value/user/base layers, and writes
		*   addressed at `[key, field]` on the parent.
		*/
		function settingsSection(parent, key) {
			let source;
			let projected;
			const project = () => {
				const snapshot = parent.getSnapshot();
				if (projected !== void 0 && source === snapshot) return projected;
				source = snapshot;
				projected = {
					status: snapshot.status,
					value: layerOf(snapshot.value, key),
					base: layerOf(snapshot.base, key),
					user: layerOf(snapshot.user, key),
					revision: snapshot.revision,
					writable: snapshot.writable
				};
				return projected;
			};
			return {
				getSnapshot: project,
				subscribe: (listener) => parent.subscribe(listener),
				set: (field, value) => parent.mutate([{
					op: "set",
					path: [key, field],
					value
				}]),
				unset: (field) => parent.mutate([{
					op: "unset",
					path: [key, field]
				}]),
				mutate: (ops, expectedRevision) => parent.mutate(ops.map((op) => "value" in op ? {
					op: "set",
					path: [key, ...op.path],
					value: op.value
				} : {
					op: "unset",
					path: [key, ...op.path]
				}), expectedRevision)
			};
		}
		/**
		* Profile entry ids this package's rows can be served under: its own standalone
		* row, the family aggregate's generated row, and the legacy background
		* namespace a profile that named the row after it still serves. The served
		* mirror decides which one is real; this list only ranks the candidates.
		*/
		const SKIN_CENTER_ENTRY_IDS = [
			"ui-skin-center",
			"web-ui-skin-center",
			"skin-background"
		];
		/**
		* The entry id of the first skin-center row the Host says it serves, or `null`
		* when the mirror cannot say. `null` means "unknown", never "none": the mirror
		* is asynchronous, so an unreadable snapshot is a pre-boot window, not proof
		* that this package is absent.
		* @param forms - the shared configuration forms service.
		* @param candidates - entry ids to look for, in preference order.
		* @returns the served entry id, or `null` when the mirror cannot answer.
		*/
		function servedEntryId(forms, candidates = SKIN_CENTER_ENTRY_IDS) {
			let served;
			try {
				served = forms.describe().getSnapshot().view?.namespaces.map((view) => view.ns);
			} catch {
				served = void 0;
			}
			if (served === void 0) return null;
			return candidates.find((id) => served.includes(id)) ?? null;
		}
		/**
		* Snapshot for a form whose entry is unserved or whose describe mirror has
		* not yet answered.
		*/
		function unavailableSnapshot() {
			return {
				status: "unavailable",
				value: void 0,
				base: void 0,
				user: void 0,
				revision: void 0,
				writable: false
			};
		}
		/**
		* A deferred ConfigForm that binds the row actually served once the describe
		* mirror answers, and degrades to 'unavailable' without issuing silent writes to
		* guessed entry ids while the mirror is unready or absent.
		*
		* @param forms - the shared configuration forms service.
		* @param candidates - candidate entry ids in preference order.
		* @returns a ConfigForm delegating to the resolved entry's form.
		*/
		function boundConfigForm(forms, candidates = SKIN_CENTER_ENTRY_IDS) {
			const listeners = /* @__PURE__ */ new Set();
			let bound;
			let boundId;
			let offBound;
			let subscribedToMirror = false;
			let binding = false;
			const resolve = () => {
				return servedEntryId(forms, candidates);
			};
			const publish = () => {
				for (const listener of [...listeners]) listener();
			};
			const bind = () => {
				if (binding) return;
				binding = true;
				try {
					ensureMirrorSubscription();
					const target = resolve();
					if (target === boundId) return;
					offBound?.();
					offBound = void 0;
					if (target === null) {
						const hadBinding = bound !== void 0;
						boundId = void 0;
						bound = void 0;
						if (hadBinding) publish();
						return;
					}
					let form;
					try {
						form = forms.get(target);
					} catch {
						const hadBinding = bound !== void 0;
						boundId = void 0;
						bound = void 0;
						if (hadBinding) publish();
						return;
					}
					boundId = target;
					bound = form;
					offBound = form.subscribe(() => {
						publish();
					});
					publish();
				} finally {
					binding = false;
				}
			};
			const ensureMirrorSubscription = () => {
				if (subscribedToMirror) return;
				try {
					const describeFace = forms.describe();
					if (typeof describeFace?.subscribe === "function") {
						describeFace.subscribe(() => {
							bind();
						});
						subscribedToMirror = true;
					}
					if (typeof describeFace?.ensure === "function") describeFace.ensure();
				} catch {}
			};
			bind();
			return {
				getSnapshot: () => {
					if (bound === void 0) bind();
					return bound?.getSnapshot() ?? unavailableSnapshot();
				},
				subscribe: (listener) => {
					ensureMirrorSubscription();
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				set: (field, value) => {
					if (bound === void 0) bind();
					return bound?.set(field, value) ?? Promise.resolve(false);
				},
				unset: (field) => {
					if (bound === void 0) bind();
					return bound?.unset(field) ?? Promise.resolve(false);
				},
				mutate: (ops, expectedRevision) => {
					if (bound === void 0) bind();
					return bound?.mutate(ops, expectedRevision) ?? Promise.resolve(false);
				}
			};
		}
		//#endregion
		//#region src/client/telemetry.ts
		const VISITOR_KEY = "dsh-web-ui-telemetry-visitor";
		const DAY_KEY_PREFIX = "dsh-web-ui-telemetry-day:";
		const ENDPOINT = "https://dsh-market.com/api/telemetry/event";
		/** The building package's version, when the bundle carries it. */
		function bakedVersion() {
			try {
				return "0.4.14";
			} catch {
				return;
			}
		}
		/** Read or lazily create the anonymous visitor id; null when storage is unavailable. */
		function visitorId() {
			try {
				const existing = localStorage.getItem(VISITOR_KEY);
				if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
				const fresh = crypto.randomUUID().replaceAll("-", "");
				localStorage.setItem(VISITOR_KEY, fresh);
				return fresh;
			} catch {
				return null;
			}
		}
		/** Drop stale per-day dedup keys so localStorage does not grow forever. */
		function pruneDayKeys(today) {
			try {
				for (let index = localStorage.length - 1; index >= 0; index -= 1) {
					const key = localStorage.key(index);
					if (key !== null && key.startsWith(DAY_KEY_PREFIX) && key !== DAY_KEY_PREFIX + today) localStorage.removeItem(key);
				}
			} catch {}
		}
		/**
		* Fire the daily heartbeat for the given items at most once per UTC day per
		* browser. Never throws and never blocks the caller. Items without an explicit
		* version inherit the bundle's baked build version.
		*/
		function reportDailyHeartbeat(items) {
			try {
				if (items.length === 0) return;
				const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (navigator.webdriver) return;
				if (localStorage.getItem(DAY_KEY_PREFIX + today) !== null) return;
				const visitor = visitorId();
				if (visitor === null) return;
				pruneDayKeys(today);
				const payloadItems = items.map((item) => {
					const out = { name: item.name };
					const version = item.version ?? bakedVersion();
					if (version !== void 0) out.version = version;
					if (item.channel !== void 0) out.channel = item.channel;
					return out;
				});
				const body = JSON.stringify({
					kind: "heartbeat",
					visitor,
					items: payloadItems
				});
				fetch(ENDPOINT, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body,
					keepalive: true
				}).then((response) => {
					if (response.ok) localStorage.setItem(DAY_KEY_PREFIX + today, "1");
				}).catch(() => {});
			} catch {}
		}
		//#endregion
		//#region src/client/web-extension-page.ts
		const SETTINGS_SECTION = "settings.section";
		const WEB_EXTENSION_SLOT = "web-ui.extension";
		function serviceOf(ctx) {
			if (typeof ctx.get !== "function") return void 0;
			try {
				const candidate = ctx.get("webUiExtensions");
				return candidate !== null && typeof candidate === "object" && typeof candidate.sectionId === "string" && typeof candidate.registerPage === "function" ? candidate : void 0;
			} catch {
				return;
			}
		}
		function warn(seat, error) {
			try {
				console.warn(`[dsh-web-settings] page "${seat}" could not be mounted`, error);
			} catch {}
		}
		/**
		* Keep exactly one reachable page contribution while the parent loads or
		* unloads. The parent service owns integrated mounting; only the fallback uses
		* this plugin's own slot registry. Slot disposal is synchronous, so the latch
		* prevents a move from recursively registering a duplicate.
		*/
		function installWebExtensionPage(ctx, page) {
			let dispose;
			let current;
			let reconciling = false;
			let disposed = false;
			const present = (seat) => {
				if (typeof ctx.slots.entries !== "function") return current === seat;
				const slot = seat === "integrated" ? WEB_EXTENSION_SLOT : SETTINGS_SECTION;
				return ctx.slots.entries(slot).some((entry) => entry.component === page.component && (seat === "integrated" ? entry.options.key : entry.options.id) === page.key);
			};
			const registerSeat = (seat) => {
				if (seat === "integrated") {
					const service = serviceOf(ctx);
					if (service === void 0) throw new Error("webUiExtensions service is unavailable");
					return service.registerPage(page);
				}
				return ctx.slots.register({
					name: SETTINGS_SECTION,
					id: page.key,
					order: page.order,
					label: page.label,
					locale: page.locale,
					inject: page.inject,
					...page.children === void 0 ? {} : { children: page.children }
				}, page.component);
			};
			const reconcile = () => {
				if (disposed || reconciling) return;
				const target = serviceOf(ctx) === void 0 ? "legacy" : "integrated";
				if (current === target && present(target)) return;
				const slot = target === "integrated" ? WEB_EXTENSION_SLOT : SETTINGS_SECTION;
				if (typeof ctx.slots.spec === "function" && ctx.slots.spec(slot) === void 0) return;
				reconciling = true;
				const previous = current;
				const disposePrevious = dispose;
				current = void 0;
				dispose = void 0;
				disposePrevious?.();
				try {
					dispose = registerSeat(target);
					current = target;
				} catch (error) {
					warn(target, error);
					if (previous !== void 0 && previous !== target) try {
						dispose = registerSeat(previous);
						current = previous;
					} catch (restoreError) {
						warn(previous, restoreError);
					}
				} finally {
					reconciling = false;
				}
			};
			if (typeof ctx.on === "function") try {
				ctx.on("slots/changed", reconcile);
			} catch {}
			reconcile();
			return () => {
				if (disposed) return;
				disposed = true;
				dispose?.();
				dispose = void 0;
				current = void 0;
			};
		}
		//#endregion
		//#region src/client/extension-seat.ts
		/** This package's stable key in either seat. */
		const SKIN_CENTER_ENTRY_KEY = "skin-center";
		/**
		* Install the one live skin-page contribution.
		* @param ctx - browser plugin context.
		* @param registration - seat-independent component, locale and business face.
		* @returns cleanup for whichever registration is currently live.
		*/
		function installSkinCenterSeat(ctx, registration) {
			return installWebExtensionPage(ctx, {
				key: SKIN_CENTER_ENTRY_KEY,
				order: 120,
				locale: "skinCenter",
				label: registration.label,
				inject: registration.inject,
				component: registration.component
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace owned by this plugin. */
		const NS = "skinCenter";
		/**
		* The configuration form of this plugin's own profile entry.
		*
		* `ctx.configForms` addresses one form per profile entry id and carries no
		* package identity, so the entry is reached through the family binder, whose
		* namespace-to-entry mapping the settings group owns: `skin-background` is
		* the namespace this package has always owned, and the bridge resolves it to
		* whichever entry id the profile gave this row. A deployment without the
		* group serves no such mapping, so the shared forms service is asked which row
		* it actually serves via deferred binding: rather than freezing a guess while the
		* describe mirror is unanswered (#1769), `boundConfigForm` degrades to
		* 'unavailable' and binds whichever row the Host serves (`web-ui-skin-center`
		* under an aggregate install, or `ui-skin-center` under a standalone install).
		* @param ctx - client root context.
		* @returns the entry form carrying every preference family.
		*/
		function bindConfigForm(ctx) {
			const binder = ctx.get("webUiSettings");
			if (binder !== void 0 && typeof binder.bind === "function") return binder.bind({ namespace: SKIN_BACKGROUND_NS });
			return boundConfigForm(ctx.configForms);
		}
		/**
		* Required services: slots + locale (plugin card), theme (preview toggle) and
		* configForms (settings sections).
		*
		* The Remote faces this plugin used (the wallpaper panel's folder picker)
		* left with the built-in Wallpaper Engine bridge: wallpaper configuration now
		* belongs to `dsh-plugin-wallpaper-engine`, which owns its own directory
		* pickers. Dropping the `remote.directoryPicker` inject also releases the
		* parking it imposed, so the card mounts on a Host that serves no picker.
		*/
		const inject = [
			"slots",
			"locale",
			"theme",
			"configForms"
		];
		/** Self-report item for the install heartbeat. */
		const SELF_ITEM = [{ name: "@linxin666/dsh-client-ui-skin-center" }];
		/**
		* Beat the install heartbeat (docs/telemetry.md), enriching it with the
		* installed skin inventory (skin:<id> + version + channel) once the v2
		* catalog answers. Offline or pre-boot the beat stays package-only.
		*/
		function beatHeartbeat() {
			reportDailyHeartbeat(SELF_ITEM);
			fetch("/api/skin-center/v2/catalog").then((res) => res.ok ? res.json() : null).then((catalog) => {
				if (!catalog || !Array.isArray(catalog.skins)) return;
				const items = [...SELF_ITEM];
				for (const skin of catalog.skins) {
					const id = skin && skin.manifest && typeof skin.manifest.id === "string" ? skin.manifest.id : "";
					if (!id) continue;
					const item = { name: "skin:" + id };
					if (typeof skin.manifest.version === "string") item.version = skin.manifest.version;
					if (typeof skin.channel === "string") item.channel = skin.channel;
					items.push(item);
				}
				reportDailyHeartbeat(items.slice(0, 64));
			}).catch(() => {});
		}
		/**
		* Register the skin-center dictionaries, the body scope attribute, and the
		* Skin Center as a first-level settings section.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			beatHeartbeat();
			ctx.effect(() => {
				try {
					return ctx.locale.register(NS, {
						zh,
						en
					});
				} catch {
					return () => {};
				}
			}, "ui-skin-center: dictionaries");
			ctx.effect(() => {
				document.body.dataset.dshSkinCenter = "";
				return () => {
					delete document.body.dataset.dshSkinCenter;
				};
			}, "ui-skin-center: body scope");
			const theme = ctx.get("theme");
			const settings = bindConfigForm(ctx);
			const V2_ACTIVE_URL = "/api/skin-center/v2/active";
			let persistTimer = null;
			const postBackground = (next, keepalive = false) => {
				fetch(V2_ACTIVE_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ background: next }),
					keepalive
				}).catch(() => {});
			};
			const persistBackground = (next) => {
				if (persistTimer !== null) clearTimeout(persistTimer);
				persistTimer = setTimeout(() => {
					persistTimer = null;
					postBackground(next);
				}, 250);
			};
			const flushBackground = () => {
				if (persistTimer === null) return;
				clearTimeout(persistTimer);
				persistTimer = null;
				postBackground(background.snapshot(), true);
			};
			const backgroundSection = settingsSection(settings, SKIN_BACKGROUND_NS);
			const scopeConfig = () => {
				const value = backgroundSection.getSnapshot().value;
				if (value === void 0 || value === null) return null;
				return value;
			};
			const background = new BackgroundController(scopeConfig(), persistBackground);
			let reconcileState = initialSkinBackgroundReconcileState(backgroundSection.getSnapshot());
			const reconcileScope = () => {
				const result = reconcileSkinBackgroundPublication(reconcileState, background.snapshot(), backgroundSection.getSnapshot());
				reconcileState = result.state;
				if (result.patch === null) return;
				const currentSnapshot = background.snapshot();
				background.init({
					...currentSnapshot,
					...result.patch
				});
				persistBackground(background.snapshot());
			};
			fetch(V2_ACTIVE_URL).then((res) => res.ok ? res.json() : null).then((body) => {
				reconcileState = {
					...reconcileState,
					v2Loaded: true
				};
				if (body?.background) background.init(body.background);
				reconcileScope();
			}).catch(() => {
				reconcileState = {
					...reconcileState,
					v2Loaded: true
				};
				reconcileScope();
			});
			ctx.effect(() => backgroundSection.subscribe(reconcileScope), "ui-skin-center: background section sync");
			ctx.effect(() => () => {
				flushBackground();
				background.dispose();
			}, "ui-skin-center: background dispose");
			const customTheme = new CustomThemeController(settingsSection(settings, SKIN_CUSTOM_THEME_NS));
			ctx.effect(() => () => customTheme.dispose(), "ui-skin-center: custom theme dispose");
			bridgeInstallFaces(ctx);
			const delegatedStates = /* @__PURE__ */ new Map();
			const delegatedListeners = /* @__PURE__ */ new Set();
			for (const descriptor of DELEGATED_SKINS) delegatedStates.set(descriptor.id, delegatedThemeState(document, descriptor));
			ctx.effect(() => {
				const stops = DELEGATED_SKINS.map((descriptor) => watchDelegatedTheme(document, {
					bodyAttr: descriptor.bodyAttr,
					handoffAttr: descriptor.handoffAttr
				}, (state) => {
					delegatedStates.set(descriptor.id, state);
					for (const listener of delegatedListeners) listener();
				}));
				return () => {
					for (const stop of stops) stop();
				};
			}, "ui-skin-center: delegated theme interop");
			let externalWallpaperActive = externalWallpaperEngineActive(document);
			let externalWallpaperPredictedStill = externalWallpaperPredicted(document);
			const externalWallpaperListeners = /* @__PURE__ */ new Set();
			const runtime = bootSkinRuntime({
				suppressSkin: () => externalWallpaperActive || externalWallpaperPredictedStill,
				suppressComposerFrost: () => externalWallpaperActive
			});
			ctx.effect(() => () => runtime.shutdown(), "ui-skin-center: runtime shutdown");
			ctx.effect(() => watchPersistedSelection(runtime), "ui-skin-center: follow the persisted selection");
			ctx.effect(() => {
				const dropPrediction = () => {
					if (!externalWallpaperPredictedStill) return;
					externalWallpaperPredictedStill = false;
					releasePrediction(document);
				};
				const stopWatch = watchExternalWallpaperEngine(document, (active) => {
					dropPrediction();
					if (active === externalWallpaperActive) return;
					externalWallpaperActive = active;
					setComposerFrostSuppressed(document, active);
					for (const listener of externalWallpaperListeners) listener();
					runtime.controller.refresh();
				});
				let graceTimer = null;
				if (externalWallpaperPredictedStill) graceTimer = setTimeout(() => {
					graceTimer = null;
					dropPrediction();
					if (externalWallpaperActive) return;
					for (const listener of externalWallpaperListeners) listener();
					runtime.controller.refresh();
				}, PREDICTED_WALLPAPER_GRACE_MS);
				return () => {
					stopWatch();
					if (graceTimer !== null) clearTimeout(graceTimer);
					dropPrediction();
				};
			}, "ui-skin-center: external wallpaper engine interop");
			const preview = new PreviewCoordinator(runtime.controller, customTheme);
			const injected = () => ({
				runtime,
				preview,
				customTheme,
				theme: {
					getTheme: () => theme.getTheme(),
					subscribe: (listener) => ctx.on("theme/change", listener),
					setTheme: (id) => theme.setTheme(id)
				},
				background: {
					enabled: () => background.enabled(),
					setEnabled: (value) => background.setEnabled(value),
					opacity: () => background.opacity(),
					blurEmpty: () => background.blurEmpty(),
					blurContent: () => background.blurContent(),
					inputCardBlur: () => background.inputCardBlur(),
					bubbleOpacity: () => background.bubbleOpacity(),
					bubbleBlur: () => background.bubbleBlur(),
					subscribe: (listener) => background.subscribe(listener),
					set: (opacity) => background.set(opacity),
					setBlurEmpty: (value) => background.setBlurEmpty(value),
					setBlurContent: (value) => background.setBlurContent(value),
					setInputCardBlur: (value) => background.setInputCardBlur(value),
					setBubbleOpacity: (value) => background.setBubbleOpacity(value),
					setBubbleBlur: (value) => background.setBubbleBlur(value),
					dispose: () => background.dispose()
				},
				externalWallpaper: {
					active: () => externalWallpaperActive,
					subscribe: (listener) => {
						externalWallpaperListeners.add(listener);
						return () => {
							externalWallpaperListeners.delete(listener);
						};
					},
					repository: EXTERNAL_WE_REPO,
					packageName: EXTERNAL_WE_PLUGIN
				},
				delegated: createDelegatedSkinHandle((id) => delegatedStates.get(id) ?? {
					live: false,
					canYield: false
				}, (listener) => {
					delegatedListeners.add(listener);
					return () => {
						delegatedListeners.delete(listener);
					};
				})
			});
			ctx.effect(() => installSkinCenterSeat(ctx, {
				inject: injected,
				label: () => ctx.locale.bind("skinCenter")("title"),
				component: SkinCenterSection
			}), "ui-skin-center: settings seat");
		}
		//#endregion
		exports.NS = NS;
		exports.apply = apply;
		exports.bootSkinRuntime = bootSkinRuntime;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map