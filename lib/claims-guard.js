// ============================================
// Claims guardrail.
//
// Every public page is built on a few promises we must never overstate:
// Hash Future School GUIDES AND PREPARES learners for external boards, and the
// certificate is issued by the board. We are not an accredited board, not a
// NIOS study centre and not a Cambridge-registered school.
//
// This module lints HTML for language that would break that promise, so a future
// edit (or generated copy) cannot quietly turn "we prepare learners for NIOS"
// into "we are an NIOS-accredited institution".
//
// Negated statements are allowed on purpose: "we are not a Cambridge-registered
// school" is exactly the kind of sentence we want on the page.
// ============================================

// Language that turns a credential phrase into an accurate statement rather than
// a claim: "we are not a Cambridge-registered school", "instead of studying at a
// Cambridge-registered school", "rather than a NIOS-accredited institution".
const NEGATION_WINDOW = 100;
const NEGATION = /\b(?:not|never|no|isn't|aren't|isnt|arent|cannot|can't|without|instead of|rather than|other than|than a|than an|unlike|excludes?|excluded)\b[^.]{0,90}$/i;

const RULES = [
    {
        id: 'cambridge-credential',
        severity: 'error',
        pattern: /\bcambridge[-\s](?:accredited|registered|affiliated)\s+(?:school|institution|provider|centre|center)\b/gi,
        reason: 'We are not a Cambridge-accredited, Cambridge-registered or Cambridge-affiliated school. Say "Cambridge-approved exam centre" or "private candidate" instead.'
    },
    {
        id: 'nios-credential',
        severity: 'error',
        pattern: /\bnios[-\s](?:accredited|affiliated|approved|authorised|authorized)\s+(?:school|institution|provider|study\s+cent(?:re|er))\b/gi,
        reason: 'We are not an NIOS-accredited institution or study centre. Say "we guide and prepare learners for NIOS".'
    },
    {
        id: 'us-plus-credential',
        severity: 'error',
        pattern: /\b(?:we|we're|our\s+(?:school|institution)|hash\s+future\s+school)\b[^.]{0,80}\b(?:accredited|affiliated|authorised|authorized)\b/gi,
        reason: 'Never attach an accreditation word to the school itself; the credential is issued by the board.'
    },
    {
        id: 'self-accreditation',
        severity: 'error',
        pattern: /\b(?:we(?:'re| are)|hash future school is)\s+(?:an?\s+)?(?:accredited|affiliated|approved|authorised|authorized)\s+(?:school|institution|board|provider)\b/gi,
        reason: 'Never claim accreditation for the school itself; the credential comes from the board.'
    },
    {
        id: 'guarantee',
        severity: 'error',
        pattern: /\bguarantee(?:d|s|ing)?\b/gi,
        reason: 'We never guarantee marks, ranks, admissions or outcomes.'
    },
    {
        id: 'assured-outcome',
        severity: 'error',
        pattern: /\b(?:100\s?%|assured)\s+(?:results?|marks|grades?|rank|ranks|admission|admissions|placement)\b/gi,
        reason: 'Outcome promises of this kind are not supportable.'
    },
    {
        id: 'hardcoded-fee',
        severity: 'error',
        pattern: /(?:₹\s?\d|Rs\.?\s?\d|AED\s?\d|QAR\s?\d|SAR\s?\d|KWD\s?\d|USD\s?\d|\$\s?\d)/g,
        reason: 'Fees change; publish figures only through the admissions team, never hardcoded on a landing page.'
    },
    {
        id: 'centre-in-every-place',
        severity: 'error',
        pattern: /\b(?:exam|examination|study)\s+cent(?:re|er)s?\s+(?:in|of)\s+(?:every|all)\b/gi,
        reason: 'Never imply universal exam-centre coverage; availability is confirmed per subject and cycle.'
    },
    {
        id: 'superlative-school',
        severity: 'info',
        pattern: /\b(?:best|top|#1|number one)\s+(?:online\s+)?school\b/gi,
        reason: 'Superlatives are legal but weak for GEO. Prefer a specific, checkable claim.'
    },
    {
        id: 'market-statistic',
        severity: 'info',
        pattern: /\b(?:million|billion)\s+(?:indian|expat|students|families)\b/gi,
        reason: 'Only cite external statistics you can source and date.'
    }
];

/**
 * Returns every rule violation found in the HTML, with the matched text and a
 * short excerpt of the surrounding context.
 */
export function findClaimViolations(html) {
    // Keywords meta tags are search phrases, not prose claims, so they are not
    // scanned (a page can legitimately target "best online school in <city>").
    const scannable = html.replace(/(<meta name="keywords" content=")[^"]*(">)/gi, '$1$2');
    const violations = [];
    for (const rule of RULES) {
        const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match;
        while ((match = pattern.exec(scannable)) !== null) {
            const start = Math.max(0, match.index - NEGATION_WINDOW);
            // The cue can sit before the match ("is not a …") or inside it
            // ("we are not an accredited board"), so both are searched.
            const windowText = scannable.slice(start, match.index + match[0].length);
            if (rule.severity === 'error' && NEGATION.test(windowText)) continue;
            violations.push({
                id: rule.id,
                severity: rule.severity,
                match: match[0],
                context: scannable.slice(Math.max(0, match.index - 60), match.index + match[0].length + 60).replace(/\s+/g, ' ').trim(),
                reason: rule.reason
            });
        }
    }
    return violations;
}

export const CLAIM_RULES = RULES;
