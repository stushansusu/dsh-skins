/**
 * Semantic adapter (issue #506, contract section 6, L2 compat adapter).
 *
 * One merged MutationObserver that stamps the semantic-attribute enumeration
 * (contracts/semantic-attrs-v1.md) onto the official shell DOM and onto
 * plugin roots that already expose stable anchors. This is explicitly a
 * COMPAT adapter — not a permanent public contract:
 *  - official areas migrate to first-party attributes when the upstream
 *    theme seam lands (then these rules are re-evaluated for deletion);
 *  - third-party plugin areas stay here long-term (plugins that opt in
 *    output the attributes themselves and the adapter becomes a no-op).
 *
 * Properties:
 *  - merged: a single observer handles every rule;
 *  - batched: one delivery collects its records before any rule runs, so a
 *    session switch that mounts thousands of nodes does not re-walk and
 *    re-match the same ancestors once per node (issue #1870);
 *  - idempotent: re-tagging an already-correct element is a no-op, so React
 *    re-renders simply get re-stamped when their nodes are re-added;
 *  - fail-closed diagnostics: rules that match nothing and selectors the
 *    engine rejects are reported, never thrown into the page;
 *  - the adapter never REMOVES attributes it did not set; disposal only
 *    disconnects the observer (stamping is cosmetic and scopes itself under
 *    html[data-dsh-skin] consumers).
 * @module @linxin666/dsh-client-ui-skin-center/runtime/semantic-adapter
 */

export type SemanticAttr = 'data-dsh-surface' | 'data-dsh-part' | 'data-dsh-plugin'

export interface SemanticRule {
  /** CSS selector matched against added/existing elements. */
  selector: string
  /** Attribute(s) applied on match. */
  attrs: readonly (readonly [SemanticAttr, string])[]
  /** Why this rule exists / what it anchors (audit trail). */
  note: string
}

/**
 * The v1 rule table. Single ownership: only the skin-center edits this.
 * Anchors verified against @deepseek-ai rc.7 (see docs/archive survey).
 */
export const SEMANTIC_RULES_V1: readonly SemanticRule[] = [
  // ---- surfaces (official shell) ----
  { selector: '[data-slot="root"]', attrs: [['data-dsh-surface', 'root']], note: 'ui-renderer root outlet' },
  { selector: '[data-slot="sidebar"]', attrs: [['data-dsh-surface', 'sidebar']], note: 'layout sidebar outlet' },
  {
    selector: '[data-slot="conversation"], [class*="centerCol"]',
    attrs: [['data-dsh-surface', 'conversation']],
    note: 'conversation column: legacy conversation outlet; since dsh 0.1.7 the column carries no data hook, so the css-module suffix (hash prefix varies, suffix stable) is the anchor',
  },
  { selector: '[data-slot="conversation.session.header"]', attrs: [['data-dsh-surface', 'session-header']], note: 'conversation header outlet' },
  { selector: '[data-slot="conversation.composer"]', attrs: [['data-dsh-surface', 'composer']], note: 'composer chain outlet' },
  {
    selector: '[data-slot="details"], [data-rightbar-col]',
    attrs: [['data-dsh-surface', 'details']],
    note: 'details column: legacy details outlet; since dsh 0.1.7 the right sidebar column carries the official data-rightbar-col hook (0-width while collapsed, so stamping it paints nothing when closed)',
  },
  { selector: '[data-shell-overlay]', attrs: [['data-dsh-surface', 'overlay']], note: 'frame overlay attribute' },
  { selector: '[data-slot="shell.overlay"]', attrs: [['data-dsh-surface', 'overlay']], note: 'shell overlay outlet' },
  {
    selector: '[role="dialog"]:has([data-slot="settings.section"])',
    attrs: [['data-dsh-surface', 'settings']],
    note: 'settings dialog (composite: dialog containing the section outlet)',
  },
  // ---- shell parts ----
  { selector: '[data-chat-flow-kind]', attrs: [['data-dsh-part', 'message-row']], note: 'chat flow item' },
  { selector: '[data-streaming]', attrs: [['data-dsh-part', 'message-body']], note: 'assistant markdown root' },
  { selector: '[data-conversation-scroll]', attrs: [['data-dsh-part', 'scrollport']], note: 'conversation scrollport' },
  {
    selector: 'textarea[data-phase], [data-composer-input]',
    attrs: [['data-dsh-part', 'composer-input']],
    note: 'composer input: legacy textarea; current shells render a Lexical contenteditable carrying data-composer-input',
  },
  { selector: '[data-decoration="chip"]', attrs: [['data-dsh-part', 'composer-chip']], note: 'composer reference chip' },
  { selector: '[data-queue-dock]', attrs: [['data-dsh-part', 'queue-dock']], note: 'queued turns dock' },
  { selector: '[data-turn-tail]', attrs: [['data-dsh-part', 'turn-tail']], note: 'turn tail row' },
  { selector: '[data-side]', attrs: [['data-dsh-part', 'resize-handle']], note: 'column resize handle' },
  {
    selector: 'button[class*="newSession"]',
    attrs: [['data-dsh-part', 'new-session']],
    note: 'sidebar new-session action (compat seam shields skins from localized labels)',
  },
  // ---- plugin roots (plugins without stable anchors opt in via AGENTS.md) ----
  {
    selector: '[data-dsh-taskboard-view], [data-dsh-taskboard-board]',
    attrs: [['data-dsh-plugin', 'task-board']],
    note: 'task-board panel/board (the sidebar row is shell-owned: its glyph carries data-dsh-panel-entry and the family rule below stamps the row)',
  },
  {
    selector: '[data-dsh-ssh-view]',
    attrs: [['data-dsh-plugin', 'ssh']],
    note: 'ssh panel (the sidebar row is shell-owned: its glyph carries data-dsh-panel-entry and the family rule below stamps the row)',
  },
  {
    selector: '[data-dsh-pet-root]',
    attrs: [['data-dsh-plugin', 'pet']],
    note: 'pet global root',
  },
  // ---- family parts ----
  {
    selector: '[class*="panelRow"]:has([data-dsh-panel-entry])',
    attrs: [['data-dsh-part', 'sidebar-entry']],
    note: 'a plugin-registered sidebar row (sidebar.panellist): the shell owns the row box and stamps no hook of its own, so the row is recognised by its css-module class plus the glyph identity the registering plugin outputs — same compat technique as newSession',
  },
]

/**
 * The anchors the rule table keys on, as one attribute filter for the
 * observer: a glyph or row anchor that is SET on an element already in the
 * tree must re-anchor its ancestors exactly like a newly inserted one.
 */
const ANCHOR_ATTRIBUTES: readonly string[] = [
  'data-dsh-panel-entry',
  'data-dsh-surface',
  'data-dsh-part',
  'data-dsh-plugin',
  'data-slot',
  'data-chat-flow-kind',
  'data-conversation-scroll',
  'data-turn-tail',
  'data-composer-input',
  'data-queue-dock',
  'data-rightbar-col',
  'data-shell-overlay',
  'data-dsh-taskboard-view',
  'data-dsh-taskboard-board',
  'data-dsh-ssh-view',
  'data-dsh-pet-root',
  'data-decoration',
  'data-streaming',
  'data-side',
  'data-phase',
]
// 'class' is deliberately absent: React sets className when it creates the
// element, so a row whose class matters already carries it when the childList
// record arrives, and class toggles are by far the most frequent attribute
// traffic on the page. The filter stays on identity anchors.

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
const DESCENDANT_SENSITIVE_PSEUDO = /:has\(|:empty|:first-child|:last-child|:only-child|:first-of-type|:last-of-type|:only-of-type|:nth-/

/**
 * Attribute names a selector references. Deliberately a plain scan of the
 * bracket contents rather than a parsed selector: it also finds a reference
 * nested INSIDE a functional pseudo-class, which is what lets
 * `[role="dialog"]:has([data-slot="settings.section"])` answer to a late
 * data-slot flip on an element inside the dialog.
 */
const SELECTOR_ATTRIBUTE = /\[([A-Za-z0-9_-]+)/g

const attributeReferences = (selector: string): ReadonlySet<string> => {
  const names = new Set<string>()
  for (const found of selector.matchAll(SELECTOR_ATTRIBUTE)) names.add(found[1])
  return names
}

interface RuleTraits {
  /** True when a descendant or sibling change can flip this rule's verdict. */
  readonly descendantSensitive: boolean
  /** Every attribute the selector names, functional pseudo-classes included. */
  readonly attributes: ReadonlySet<string>
}

/**
 * Rule traits derived from the selector text ONCE, at module load, never per
 * element. The classification is what every batching decision below reads;
 * re-deriving it inside the walk would reintroduce exactly the per-node work
 * this change removes (issue #1870).
 */
const RULE_TRAITS: readonly RuleTraits[] = SEMANTIC_RULES_V1.map((rule) => ({
  descendantSensitive: DESCENDANT_SENSITIVE_PSEUDO.test(rule.selector),
  attributes: attributeReferences(rule.selector),
}))

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
const ANCESTOR_HOPS = 24

export interface SemanticAdapterDiagnostics {
  /** Rules whose selector the engine rejects (dropped, never retried). */
  invalidRules: string[]
  /** Rules that matched zero elements in the latest full pass. */
  unmatchedRules: string[]
  /** Total attributes stamped since start. */
  stamped: number
}

export interface SemanticAdapter {
  start(): void
  stop(): void
  diagnostics(): SemanticAdapterDiagnostics
  readonly running: boolean
}

interface LiveRule extends RuleTraits {
  rule: SemanticRule
  /** False once the engine rejected the selector. */
  usable: boolean
  /** Elements matched in the latest full pass. */
  matchedInPass: number
}

export function createSemanticAdapter(doc: Document): SemanticAdapter {
  const rules: LiveRule[] = SEMANTIC_RULES_V1.map((rule, index) => ({
    rule,
    usable: true,
    matchedInPass: 0,
    descendantSensitive: RULE_TRAITS[index].descendantSensitive,
    attributes: RULE_TRAITS[index].attributes,
  }))
  /**
   * The subset a childList delivery may walk: inserting a descendant can flip
   * a descendant-sensitive rule on an ancestor and nothing else. A self-only
   * ancestor was already rule-checked when it was added (or by fullPass), and
   * its verdict cannot change because something inside it grew, so
   * re-evaluating it is the cost, not the correctness, of the walk.
   */
  const descendantSensitiveRules: readonly LiveRule[] = rules.filter((live) => live.descendantSensitive)
  let observer: MutationObserver | null = null
  let stamped = 0
  let running = false

  const applyRule = (live: LiveRule, el: Element): void => {
    if (!live.usable) return
    let hit = false
    try {
      hit = el.matches(live.rule.selector)
    } catch {
      live.usable = false
      return
    }
    if (!hit) return
    live.matchedInPass += 1
    for (const [name, value] of live.rule.attrs) {
      if (el.getAttribute(name) !== value) {
        el.setAttribute(name, value)
        stamped += 1
      }
    }
  }

  const applyToTree = (rootEl: Element): void => {
    for (const live of rules) {
      if (!live.usable) continue
      applyRule(live, rootEl)
      let matches: Element[] = []
      try {
        matches = Array.from(rootEl.querySelectorAll(live.rule.selector))
      } catch {
        live.usable = false
        continue
      }
      for (const el of matches) applyRule(live, el)
    }
  }

  const fullPass = (): void => {
    for (const live of rules) live.matchedInPass = 0
    if (doc.documentElement) applyToTree(doc.documentElement)
  }

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
  const reanchorAncestors = (node: Element, subset: readonly LiveRule[]): void => {
    if (subset.length === 0) return
    const root = doc.body ?? doc.documentElement
    let current: Element | null = node
    for (let hop = 0; current !== null && hop <= ANCESTOR_HOPS; hop += 1) {
      for (const live of subset) {
        if (live.usable) applyRule(live, current)
      }
      // Stop at the observed root: going further cannot reach a node the
      // observer is even watching, and body is the ceiling it was given.
      if (current === root || current === doc.documentElement) return
      current = current.parentElement
    }
  }

  /**
   * Drop added roots that another root of the same delivery already contains:
   * applyToTree on the containing root scans the nested one as part of its own
   * subtree, and the containing root's own ancestor walk covers the nested
   * root's ancestors, so re-scanning it is pure duplicate work. Membership is a
   * Set probe per ancestor hop — no selector-engine call — which keeps a
   * delivery that mounts a whole subtree at once linear in that subtree.
   */
  const topmostRoots = (roots: ReadonlySet<Element>): Element[] => {
    const kept: Element[] = []
    for (const candidate of roots) {
      let parent = candidate.parentElement
      let nested = false
      while (parent !== null) {
        if (roots.has(parent)) {
          nested = true
          break
        }
        if (parent === doc.documentElement) break
        parent = parent.parentElement
      }
      if (!nested) kept.push(candidate)
    }
    return kept
  }

  return {
    get running() {
      return running
    },

    start() {
      if (running) return
      running = true
      fullPass()
      observer = new doc.defaultView!.MutationObserver((records) => {
        try {
          // The delivery is collected BEFORE any rule runs. Records of one
          // batch share ancestors and even targets, and re-walking them once
          // per record is what turned a session switch into tens of thousands
          // of matches() calls (issue #1870).
          const roots = new Set<Element>()
          const byAttribute = new Map<string, Set<Element>>()
          for (const record of records) {
            if (record.type === 'attributes') {
              // Only a rule that NAMES the attribute can flip because of it.
              // No rule in the table names the attributes the adapter itself
              // stamps, so every stamp it writes is an echo that now costs
              // zero rule evaluations instead of a full ancestor walk.
              const target = record.target.nodeType === 1 ? record.target as Element : null
              const name = record.attributeName
              if (target === null || name === null) continue
              const seen = byAttribute.get(name)
              if (seen === undefined) byAttribute.set(name, new Set([target]))
              else seen.add(target)
              continue
            }
            if (record.type !== 'childList') continue
            for (const node of Array.from(record.addedNodes)) {
              if (node.nodeType !== 1) continue
              roots.add(node as Element)
            }
          }

          // An added root keeps the full treatment, unchanged: every rule on
          // the root itself and on its whole subtree. Only the walk ABOVE it
          // is narrowed.
          for (const root of topmostRoots(roots)) {
            applyToTree(root)
            // The added subtree may itself be the glyph a row wants; the row
            // is an ANCESTOR of it and applyToTree never looks up (#1732).
            reanchorAncestors(root.parentElement ?? root, descendantSensitiveRules)
          }

          // A glyph whose ANCHOR is set on an element already in the tree (a
          // re-render that flips the attribute instead of replacing the node)
          // is the same signal, and childList alone never sees it.
          for (const [name, targets] of byAttribute) {
            const onTarget: LiveRule[] = []
            const onAncestors: LiveRule[] = []
            for (const live of rules) {
              if (!live.attributes.has(name)) continue
              onTarget.push(live)
              // An ancestor's verdict can only change when the rule reads
              // through the descendant that just changed its attribute.
              if (live.descendantSensitive) onAncestors.push(live)
            }
            if (onTarget.length === 0) continue
            for (const target of targets) {
              for (const live of onTarget) applyRule(live, target)
              reanchorAncestors(target.parentElement ?? target, onAncestors)
            }
          }
        } catch {
          // Fail-closed: a tagging error must never break the host page.
        }
      })
      observer.observe(doc.body ?? doc.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [...ANCHOR_ATTRIBUTES],
      })
    },

    stop() {
      running = false
      observer?.disconnect()
      observer = null
    },

    diagnostics() {
      return {
        invalidRules: rules.filter((r) => !r.usable).map((r) => r.rule.selector),
        unmatchedRules: rules.filter((r) => r.usable && r.matchedInPass === 0).map((r) => r.rule.selector),
        stamped,
      }
    },
  }
}
