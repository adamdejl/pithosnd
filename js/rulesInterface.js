"use strict";

/* Object associating rule descriptions to the corresponding function handler
   and number of lines to be selected for application (including target empty
   line) */
const rulesData = Object.freeze({
  "∧I": {handler: introduceConjunction, numLines: 3, hint: "∧I requires "
      + "selection of two formulas to become conjuncts and an empty or "
      + "goal line.", name: "∧I"},
  "∧E": {handler: eliminateConjunction, numLines: 2, hint: "∧E requires "
      + "selection of a conjunction and an empty or goal line.", name: "∧E"},
  // "∨I": {handler: introduceDisjunction, numLines: 2, hint: "∨I requires "
  //     + "selection of one formula to become one of the disjuncts and an "
  //     + "empty or goal line.", name: "∨I"},
  // "∨E": {handler: eliminateDisjunction, numLines: 2, hint: "∨E requires "
  //     + "selection of one disjuction and an empty or goal line.", name: "∨E"},
  // "→I": {handler: introduceImplication, numLines: 1, hint: "→I requires "
  //     + "selection of an empty or goal line.", name: "→I"},
  // "→E": {handler: eliminateImplication, numLines: 3, hint: "→E requires "
  //     + "selection of an implication, formula matching the antecedent of the "
  //     + "implication and an empty or goal line.", name: "→E"},
  // "¬I": {handler: introduceNegation, numLines: 1, hint: "¬I requires "
  //     + "selection of an empty or goal line.", name: "¬I"},
  // "¬E": {handler: eliminateNegation, numLines: 3, hint: "¬E requires "
  //     + "selection of a formula, its negation and an empty or goal line.",
  //     name: "¬E"},
  // "¬¬E": {handler: eliminateDoubleNegation, numLines: 2, hint: "¬¬E requires "
  //     + "selection of a double negation and an empty or goal line.",
  //     name: "¬¬E"},
  // "⊤I": {handler: introduceTop, numLines: 1, hint: "⊤I requires "
  //     + "selection of an empty or goal line.", name: "⊤I"},
  // "⊥I": {handler: introduceBottom, numLines: 3, hint: "⊥I requires "
  //     + "selection of a formula, its negation and an empty or goal line.",
  //     name: "⊥I"},
  // "⊥E": {handler: eliminateBottom, numLines: 2, hint: "⊥E requires "
  //     + "selection of a bottom and an empty or goal line.", name: "⊥E"},
  // "↔I": {handler: introduceBiconditional, numLines: 3, hint: "↔I requires "
  //     + 'selection of two implications in "opposite" directions and '
  //     + "an empty or goal line.", name: "↔I"},
  // "↔E": {handler: eliminateBiconditional, numLines: 3, hint: "↔E requires "
  //     + 'selection of a biconditional, formula matching one of its "sides" '
  //     + "and an empty or goal line.", name: "↔E"},
  // "EM": {handler: applyExcludedMiddle, numLines: 1, hint: "EM requires "
  //     + "selection of an empty or goal line.", name: "EM"},
  // "PC": {handler: applyProofByContradicition, numLines: 1, hint: "PC requires "
  //     + "selection of an empty or goal line.", name: "PC"},
  // "∃I": {handler: introduceExistential, numLines: 2, hint: "∃I requires "
  //     + "selection of a formula with a term to be replaced by the "
  //     + "quantified variable and an empty or goal line.", name: "∃I"},
  // "∃E": {handler: eliminateExistential, numLines: 2, hint: "∃E requires "
  //     + "selection of an existentially quantified formula and an empty or "
  //     + "goal line.", name: "∃E"},
  // "∀I": {handler: introduceUniversal, numLines: 1, hint: "∀I requires "
  //     + "selection of an empty or goal line.", name: "∀I"},
  // "∀E": {handler: eliminateUniversal, numLines: 2, hint: "∀E requires "
  //     + "selection of a universally quantified formula and an empty or "
  //     + "goal line.", name: "∀E"},
  // "∀→E": {handler: eliminateUniversalImplication, numLines: 3, hint: "∀→E "
  //     + "requires selection of a universally quantified formula with "
  //     + "an implication, formula corresponding to the antecedent of the "
  //     + "implication and an empty or goal line.", name: "∀→E"},
  // "=sub": {handler: applyEqualitySubstitution, numLines: 3, hint: "=sub "
  //     + "requires selection of an equality, formula to perform substitution"
  //     + "in and an empty or goal line.", name: "=sub"},
  // "refl": {handler: applyEqualityReflexivity, numLines: 1, hint: "refl "
  //     + "requires selection of an empty or goal line.", name: "refl"},
  // "=sym": {handler: applyEqualitySymmetry, numLines: 2, hint: "=sym "
  //     + "requires selection of an equality and an empty or goal line.",
  //     name: "=sym"},
  // "✓": {handler: applyTick, numLines: 2, hint: "✓ requires selection"
  //     + "of a formula and an empty or goal line.", name: "✓"}
});

function introduceConjunction() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  console.log(retrievedLines);
  // let justificationLines = retrievedLines.justificationLines;
  // let targetLine = retrievedLines.targetLine;
  // let newConjunction = new Conjunction(justificationsLines[0].formula,
  //     justificationLines[1].formula);
  // if (targetLine.justification.type === justTypes.GOAL) {
  //   let swappedConjunction = new Conjunction(justificationslines[1].formula,
  //       justificationLines[0].formula);
  //   if (!limitedDeepEqual(targetLine.formula, newConjunction)
  //       && !limitedDeepEqual(targetLine.formula, swappedConjunction)) {
  //     throw new ProofProcessingError("The selected goal does not correspond "
  //         + "to the conjunction of the remaining formulas.");
  //   }
  //   targetLine.justification = new Justification(CON_INTRO, justificationLines);
  // } else {
  //   // TODO: Insert newly constructed proof line
  // }
}

function eliminateConjunction() {
  alert("Conjunction elim handled");
}

/*
 * Checks for deep equality using JSON.stringify
 * May not work correctly for objects with different order of attributes
   or more complex objects (such as HTML elements)
 */
function limitedDeepEqual(object1, object2) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}
