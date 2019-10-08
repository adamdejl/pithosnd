"use strict"

/* Object associating rule descriptions to the corresponding function handler
   and number of lines to be selected for application (including target empty
   line) */
const rulesData = Object.freeze({
  "∧I": {handler: introduceConjunction, numLines: 3, hint: "The ∧I rule "
      + "can be used to derive conjunction formula from the individual "
      + "conjuncts.", name: "∧I"},
  "∧E": {handler: eliminateConjunction, numLines: 2, hint: "The ∧E rule "
      + "can be used to introduce one or more operands of a conjunction "
      + "as separate formulas.", name: "∧E"},
  "∨I": {handler: introduceDisjunction, numLines: 2, hint: "The ∨I rule "
      + "can be used to derive a disjunction from a formula identical to "
      + "one of the disjuncts.", name: "∨I"},
  "∨E": {handler: eliminateDisjunction, numLines: 2, hint: "The ∨E rule "
      + "can be used to derive formula from a disjunction provided that "
      + "this formula can be derived from each of the individual disjuncts.",
      name: "∨E"},
  "→I": {handler: introduceImplication, numLines: 1, hint: "The →I rule "
      + "can be used to introduce an implication provided that the consequent "
      + "of the implication can be derived from the antecedent in a separate "
      + "box.", name: "→I"},
  "→E": {handler: eliminateImplication, numLines: 3, hint: "The →E rule "
      + "can be used to derive a consequent of an implication from it's "
      + "antecedent and the implication itself.", name: "→E"},
  "¬I": {handler: introduceNegation, numLines: 1, hint: "The ¬I rule "
      + "can be used to introduce a negation provided that an assumption "
      + "of the negand leads to a contradiction (bottom).", name: "¬I"},
  "¬E": {handler: eliminateNegation, numLines: 3, hint: "The ¬E rule "
      + "can be used to introduce bottom from a formula along with its "
      + "negation. This rule is identical to ⊥I.", name: "¬E"},
  "¬¬E": {handler: eliminateDoubleNegation, numLines: 2, hint: "The ¬¬E rule "
      + "can be used to derive an inner negand of a double negation "
      + "as a separate formula.", name: "¬¬E"},
  "⊤I": {handler: introduceTop, numLines: 1, hint: "The ⊤I rule "
      + "can be used to introduce top at any time.", name: "⊤I"},
  "⊥I": {handler: introduceBottom, numLines: 3, hint: "The ⊥I rule "
      + "can be used to introduce bottom from a formula along with its "
      + "negation. This rule is identical to ¬E.", name: "⊥I"},
  "⊥E": {handler: eliminateBottom, numLines: 2, hint: "The ⊥E rule "
      + "can be used to derive any formula from a contradiction (bottom).",
      name: "⊥E"},
  "↔I": {handler: introduceBiconditional, numLines: 3, hint: "The ↔I rule "
      + "can be used to derive a biconditional from two implications "
      + 'in "opposite" directions.', name: "↔I"},
  "↔E": {handler: eliminateBiconditional, numLines: 3, hint: "The ↔E rule "
      + "can be used to derive one of the operands of an implication "
      + "from a formula matching the second operand of the biconditional "
      + "and the biconditional itself.", name: "↔E"},
  "EM": {handler: applyExcludedMiddle, numLines: 1, hint: "The EM rule "
      + "can be used to introduce any disjunction with formula and its"
      + "negation as operands", name: "EM"},
  "PC": {handler: applyProofByContradiction, numLines: 1, hint: "The PC rule "
      + "can be used to introduce any formula provided that assumption of "
      + "its negation leads to a contradiction (bottom).", name: "PC"},
  "∃I": {handler: introduceExistential, numLines: 2, hint: "The ∃I rule "
      + "can be used to introduce an existential quantification formula "
      + "from a matching formula that has term(s) in place of the "
      + "quantified variables.", name: "∃I"},
  "∃E": {handler: eliminateExistential, numLines: 2, hint: "The ∃E rule "
      + "can be used to derive a formula from an existential quantification "
      + "formula. The new formula must be derivable from the quantified "
      + "formula with variable(s) replaced by Skolem constant(s) and must "
      + "not contain any of these constants.", name: "∃E"},
  "∀I": {handler: introduceUniversal, numLines: 1, hint: "∀I requires "
      + "selection of an empty or goal line. It can be used to introduce "
      + "a universally quantified formula provided that this formula holds "
      + "for an arbitrary object (named by a unique sk constant).", name: "∀I"},
  "∀E": {handler: eliminateUniversal, numLines: 2, hint: "∀E requires "
      + "selection of a universally quantified formula and an empty or "
      + "goal line. It can be used to eliminate any number of outer "
      + "universal quantifiers and to introduce a new formula with variables "
      + "replaced by chosen terms.", name: "∀E"},
  "∀→I": {handler: introduceUniversalImplication, numLines: 1, hint: "∀→E "
      + "requires selection of an empty or goal line. This derived rule "
      + "can be used instead of subsequent application of universal and "
      + "implication introduction.", name: "∀→I"},
  "∀→E": {handler: eliminateUniversalImplication, numLines: 3, hint: "∀→E "
      + "requires selection of a universally quantified formula with "
      + "an implication, formula corresponding to the antecedent of the "
      + "implication and an empty or goal line. This derived rule can be used "
      + "instead of subsequent application of universal and implication "
      + "elimination.", name: "∀→E"},
  "=sub": {handler: applyEqualitySubstitution, numLines: 3, hint: "=sub "
      + "requires selection of an equality, formula to perform substitution "
      + "in and an empty or goal line.", name: "=sub"},
  "refl": {handler: applyEqualityReflexivity, numLines: 1, hint: "Refl "
      + "requires selection of an empty or goal line. It can be used to "
      + "introduce equality with identical terms on both sides.", name: "refl"},
  "=sym": {handler: applyEqualitySymmetry, numLines: 2, hint: "=sym "
      + "requires selection of an equality and an empty or goal line. It can "
      + "be used to introduce another equality with swapped terms.",
      name: "=sym"},
  "✓": {handler: applyTick, numLines: 2, hint: "✓ requires selection "
      + "of a formula and an empty or goal line. It can be used to "
      + "justify formula that has already been derived in the current "
      + "scope. This rule cannot be applied backwards.", name: "✓"}
});
