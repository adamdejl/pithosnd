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

/*
 * Function handling conjunction introduction
 */
function introduceConjunction() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let targetLine = retrievedLines.targetLine;
  let newConjunction = new Conjunction(justificationLines[0].formula,
      justificationLines[1].formula);
  let justification
      = new Justification(justTypes.CON_INTRO, justificationLines);
  if (targetLine instanceof EmptyProofLine) {
    let newLine = new JustifiedProofLine(newConjunction, justification);
    targetLine.prepend(newLine);
  } else {
    /* Target line is a goal line */
    let swappedConjunction = new Conjunction(justificationLines[1].formula,
        justificationLines[0].formula);
    if (!formulasDeepEqual(targetLine.formula, newConjunction)
        && !formulasDeepEqual(targetLine.formula, swappedConjunction)) {
      throw new ProofProcessingError("The selected goal does not correspond "
          + "to the conjunction of the remaining formulas.");
    }
    targetLine.justification = justification;
  }
}

/*
 * Function handling conjunction elimination
 */
function eliminateConjunction() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  if (justificationLines[0].formula.type !== formulaTypes.CONJUNCTION) {
    throw new ProofProcessingError("The selected justification formula is "
        + "not a conjunction.");
  }
  let targetLine = retrievedLines.targetLine;
  let conjuncts = [];
  extractConjuncts(justificationLines[0].formula, conjuncts);
  if (targetLine instanceof EmptyProofLine) {
    let message
        = "Please select the conjunct(s) that you would like to eliminate:";
    for (let i = 0; i < conjuncts.length; i++) {
      message +=
          `<div class="custom-control custom-checkbox">
             <input type="checkbox" class="custom-control-input" id="${"conjunctCheckbox" + i}">
             <label class="custom-control-label" for="${"conjunctCheckbox" + i}">${conjuncts[i].stringRep}</label>
           </div>`
    }
    showAlert("Input required", message, undefined,
        "eliminateConjunctionComplete");
  } else {
    /* Target line is a goal line */
    for (var i = 0; i < conjuncts.length; i++) {
      if (formulasDeepEqual(conjuncts[i], targetLine.formula)) {
        let justification
            = new Justification(justTypes.CON_ELIM, justificationLines);
        targetLine.justification = justification;
        return;
      }
    }
    throw new ProofProcessingError("Neither of the conjuncts in the "
        + "justification formula matches the goal formula.")
  }

  /*
   * Complete rule application by eliminating selected conjuncts
   */
  /* Unbind possible previously bound event */
  $("#dynamicModalArea").off("click", "#eliminateConjunctionComplete");
  $("#dynamicModalArea").on("click", "#eliminateConjunctionComplete",
      function() {
    for (let i = 0; i < conjuncts.length; i++) {
      if ($("#conjunctCheckbox" + i).is(":checked")) {
        let justification
            = new Justification(justTypes.CON_ELIM, justificationLines)
        let newLine = new JustifiedProofLine(conjuncts[i], justification);
        targetLine.prepend(newLine);
      }
    }
    completeProofUpdate();
  });

  /*
   * Extracts individual conjuncts from a conjunction formula
   */
  function extractConjuncts(formula, extractionTarget) {
    if (formula.type !== formulaTypes.CONJUNCTION) {
      extractionTarget.push(formula);
    } else {
      extractConjuncts(formula.operand1, extractionTarget);
      extractConjuncts(formula.operand2, extractionTarget);
    }
  }
}
