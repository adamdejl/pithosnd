"use strict";

/* Object associating rule descriptions to the corresponding function handler
   and number of lines to be selected for application (including target empty
   line) */
const rulesData = Object.freeze({
  "∧I": {handler: introduceConjunction, numLines: 3, hint: "∧I requires "
      + "selection of two formulas to become conjuncts and an empty or "
      + "goal line."},
  "∧E": {handler: eliminateConjunction, numLines: 2, hint: "∧E requires "
      + "selection of a conjunction and an empty or goal line."},
  // "∨I": {handler: introduceDisjunction, numLines: 2, hint: "∨I requires "
  //     + "selection of one formula to become one of the disjuncts and an "
  //     + "empty or goal line."},
  // "∨E": {handler: eliminateDisjunction, numLines: 2, hint: "∨E requires "
  //     + "selection of one disjuction and an empty or goal line."},
  // "→I": {handler: introduceImplication, numLines: 1, hint: "→I requires "
  //     + "selection of an empty or goal line."},
  // "→E": {handler: eliminateImplication, numLines: 3, hint: "→E requires "
  //     + "selection of an implication, formula matching the antecedent of the "
  //     + "implication and an empty or goal line."},
  // "¬I": {handler: introduceNegation, numLines: 1, hint: "¬I requires "
  //     + "selection of an empty or goal line."},
  // "¬E": {handler: eliminateNegation, numLines: 3, hint: "¬E requires "
  //     + "selection of a formula, its negation and an empty or goal line."},
  // "¬¬E": {handler: eliminateDoubleNegation, numLines: 2, hint: "¬¬E requires "
  //     + "selection of a double negation and an empty or goal line."},
  // "⊤I": {handler: introduceTop, numLines: 1, hint: "⊤I requires "
  //     + "selection of an empty or goal line."},
  // "⊥I": {handler: introduceBottom, numLines: 3, hint: "⊥I requires "
  //     + "selection of a formula, its negation and an empty or goal line."},
  // "⊥E": {handler: eliminateBottom, numLines: 2, hint: "⊥E requires "
  //     + "selection of a bottom and an empty or goal line."},
  // "↔I": {handler: introduceBiconditional, numLines: 3, hint: "↔I requires "
  //     + 'selection of two implications in "opposite" directions and '
  //     + "an empty or goal line."},
  // "↔E": {handler: eliminateBiconditional, numLines: 3, hint: "↔E requires "
  //     + 'selection of a biconditional, formula matching one of its "sides" '
  //     + "and an empty or goal line."},
  // "EM": {handler: applyExcludedMiddle, numLines: 1, hint: "EM requires "
  //     + "selection of an empty or goal line."},
  // "PC": {handler: applyProofByContradicition, numLines: 1, hint: "PC requires "
  //     + "selection of an empty or goal line."},
  // "∃I": {handler: introduceExistential, numLines: 2, hint: "∃I requires "
  //     + "selection of a formula with a term to be replaced by the "
  //     + "quantified variable and an empty or goal line."},
  // "∃E": {handler: eliminateExistential, numLines: 2, hint: "∃E requires "
  //     + "selection of an existentially quantified formula and an empty or "
  //     + "goal line."},
  // "∀I": {handler: introduceUniversal, numLines: 1, hint: "∀I requires "
  //     + "selection of an empty or goal line."},
  // "∀E": {handler: eliminateUniversal, numLines: 2, hint: "∀E requires "
  //     + "selection of a universally quantified formula and an empty or "
  //     + "goal line."},
  // "∀→E": {handler: eliminateUniversalImplication, numLines: 3, hint: "∀→E "
  //     + "requires selection of a universally quantified formula with "
  //     + "an implication, formula corresponding to the antecedent of the "
  //     + "implication and an empty or goal line."},
  // "=sub": {handler: applyEqualitySubstitution, numLines: 3, hint: "=sub "
  //     + "requires selection of an equality, formula to perform substitution"
  //     + "in and an empty or goal line."},
  // "refl": {handler: applyEqualityReflexivity, numLines: 1, hint: "refl "
  //     + "requires selection of an empty or goal line."},
  // "=sym": {handler: applyEqualitySymmetry, numLines: 2, hint: "=sym "
  //     + "requires selection of an equality and an empty or goal line."},
  // "✓": {handler: applyTick, numLines: 2, hint: "✓ requires selection"
  //     + "of a formula and an empty or goal line."}
});

function introduceConjunction() {
  alert("Conjunction intro handled");
  return PithosData.proof;
}

function eliminateConjunction() {
  alert("Conjunction elim handled");
  return PithosData.proof;
}