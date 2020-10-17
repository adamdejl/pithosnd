"use strict";

/* Object associating rule descriptions to the corresponding function handler
   and number of lines to be selected for application (including target empty
   line) */
const rulesData = Object.freeze({
  "∧I": {
    handler: introduceConjunction,
    numLines: 3,
    hint:
      "∧I requires " +
      "selection of two formulas to become conjuncts and an empty or " +
      "goal line.",
    name: "∧I",
  },
  "∧E": {
    handler: eliminateConjunction,
    numLines: 2,
    hint:
      "∧E requires " +
      "selection of a conjunction and an empty or goal line. Any of the " +
      "conjuncts can then be introduced as a separate formula.",
    name: "∧E",
  },
  "∨I": {
    handler: introduceDisjunction,
    numLines: 2,
    hint:
      "∨I requires " +
      "selection of one formula to become one of the disjuncts and an " +
      "empty or goal line.",
    name: "∨I",
  },
  "∨E": {
    handler: eliminateDisjunction,
    numLines: 2,
    hint:
      "∨E requires " +
      "selection of one disjuction and an empty or goal line. It can be used " +
      "to justify any formula provided that this formula can be derived " +
      "from both disjuncts separately.",
    name: "∨E",
  },
  "→I": {
    handler: introduceImplication,
    numLines: 1,
    hint:
      "→I requires " +
      "selection of an empty or goal line. Completion of this rule " +
      "application requires working from the antecedent towards the " +
      "consequent in a separate box.",
    name: "→I",
  },
  "→E": {
    handler: eliminateImplication,
    numLines: 3,
    hint:
      "→E requires " +
      "selection of an implication, formula matching the antecedent of the " +
      "implication and an empty or goal line. The consequent can than be " +
      "eliminated as a separate formula.",
    name: "→E",
  },
  "¬I": {
    handler: introduceNegation,
    numLines: 1,
    hint:
      "¬I requires " +
      "selection of an empty or goal line. The rule can be used to justify " +
      "a negation formula when assumption of negand leads to a contradiction " +
      "(bottom).",
    name: "¬I",
  },
  "¬E": {
    handler: eliminateNegation,
    numLines: 3,
    hint:
      "¬E requires " +
      "selection of a formula, its negation and an empty or goal line. It " +
      "can be used to introduce bottom (a contradiction) and is identical " +
      "to the bottom introduction rule.",
    name: "¬E",
  },
  "¬¬E": {
    handler: eliminateDoubleNegation,
    numLines: 2,
    hint:
      "¬¬E requires " +
      "selection of a double negation and an empty or goal line. It can " +
      "be used to eliminate the inner negand as a separate formula.",
    name: "¬¬E",
  },
  "⊤I": {
    handler: introduceTop,
    numLines: 1,
    hint:
      "⊤I requires " +
      "selection of an empty or goal line and can be used to introduce top.",
    name: "⊤I",
  },
  "⊥I": {
    handler: introduceBottom,
    numLines: 3,
    hint:
      "⊥I requires " +
      "selection of a formula, its negation and an empty or goal line. It " +
      "can be used to introduce bottom (a contradiction) and is identical " +
      "to the negation elimination rule.",
    name: "⊥I",
  },
  "⊥E": {
    handler: eliminateBottom,
    numLines: 2,
    hint:
      "⊥E requires " +
      "selection of a bottom and an empty or goal line. It can be used to " +
      "justify any formula.",
    name: "⊥E",
  },
  "↔I": {
    handler: introduceBiconditional,
    numLines: 3,
    hint:
      "↔I requires " +
      'selection of two implications in "opposite" directions and ' +
      "an empty or goal line. It can be used to introduce a biconditional " +
      "with operands identical to the antecedents and consequents of the " +
      "justification fomulas.",
    name: "↔I",
  },
  "↔E": {
    handler: eliminateBiconditional,
    numLines: 3,
    hint:
      "↔E requires " +
      "selection of a biconditional, formula matching one of its operands " +
      "and an empty or goal line. It can be used to eliminate one of the " +
      "biconditional operands as a distinct formula.",
    name: "↔E",
  },
  EM: {
    handler: applyExcludedMiddle,
    numLines: 1,
    hint:
      "EM requires " +
      "selection of an empty or goal line. It can be used to introduce " +
      "any disjunction with formula and its negation as operands.",
    name: "EM",
  },
  PC: {
    handler: applyProofByContradiction,
    numLines: 1,
    hint:
      "PC requires " +
      "selection of an empty or goal line. It can be used to introduce any " +
      "formula if assumption of its negation leads to a contradiction.",
    name: "PC",
  },
  "∃I": {
    handler: introduceExistential,
    numLines: 2,
    hint:
      "∃I requires " +
      "selection of a formula with term(s) to be replaced by the " +
      "quantified variable and an empty or goal line.",
    name: "∃I",
  },
  "∃E": {
    handler: eliminateExistential,
    numLines: 2,
    hint:
      "∃E requires " +
      "selection of an existentially quantified formula and an empty or " +
      "goal line. Completion of this rule requires working from the " +
      "quantified formula with variable(s) replaced by Skolem constant(s) " +
      "towards the newly introduced formula.",
    name: "∃E",
  },
  "∀I": {
    handler: introduceUniversal,
    numLines: 1,
    hint:
      "∀I requires " +
      "selection of an empty or goal line. It can be used to introduce " +
      "a universally quantified formula provided that this formula holds " +
      "for an arbitrary object (named by a unique sk constant).",
    name: "∀I",
  },
  "∀E": {
    handler: eliminateUniversal,
    numLines: 2,
    hint:
      "∀E requires " +
      "selection of a universally quantified formula and an empty or " +
      "goal line. It can be used to eliminate any number of outer " +
      "universal quantifiers and to introduce a new formula with variables " +
      "replaced by chosen terms.",
    name: "∀E",
  },
  "∀→I": {
    handler: introduceUniversalImplication,
    numLines: 1,
    hint:
      "∀→E " +
      "requires selection of an empty or goal line. This derived rule " +
      "can be used instead of subsequent application of universal and " +
      "implication introduction.",
    name: "∀→I",
  },
  "∀→E": {
    handler: eliminateUniversalImplication,
    numLines: 3,
    hint:
      "∀→E " +
      "requires selection of a universally quantified formula with " +
      "an implication, formula corresponding to the antecedent of the " +
      "implication and an empty or goal line. This derived rule can be used " +
      "instead of subsequent application of universal and implication " +
      "elimination.",
    name: "∀→E",
  },
  "=sub": {
    handler: applyEqualitySubstitution,
    numLines: 3,
    hint:
      "=sub " +
      "requires selection of an equality, formula to perform substitution " +
      "in and an empty or goal line.",
    name: "=sub",
  },
  refl: {
    handler: applyEqualityReflexivity,
    numLines: 1,
    hint:
      "Refl " +
      "requires selection of an empty or goal line. It can be used to " +
      "introduce equality with identical terms on both sides.",
    name: "refl",
  },
  "=sym": {
    handler: applyEqualitySymmetry,
    numLines: 2,
    hint:
      "=sym " +
      "requires selection of an equality and an empty or goal line. It can " +
      "used to introduce another equality with swapped terms.",
    name: "=sym",
  },
  "✓": {
    handler: applyTick,
    numLines: 2,
    hint:
      "✓ requires selection " +
      "of a formula and an empty or goal line. It can be used to " +
      "justify formula that has already been derived in the current " +
      "scope.",
    name: "✓",
  },
});
