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
  "∨I": {handler: introduceDisjunction, numLines: 2, hint: "∨I requires "
      + "selection of one formula to become one of the disjuncts and an "
      + "empty or goal line.", name: "∨I"},
  "∨E": {handler: eliminateDisjunction, numLines: 2, hint: "∨E requires "
      + "selection of one disjuction and an empty or goal line.", name: "∨E"},
  "→I": {handler: introduceImplication, numLines: 1, hint: "→I requires "
      + "selection of an empty or goal line.", name: "→I"},
  "→E": {handler: eliminateImplication, numLines: 3, hint: "→E requires "
      + "selection of an implication, formula matching the antecedent of the "
      + "implication and an empty or goal line.", name: "→E"},
  "¬I": {handler: introduceNegation, numLines: 1, hint: "¬I requires "
      + "selection of an empty or goal line.", name: "¬I"},
  "¬E": {handler: eliminateNegation, numLines: 3, hint: "¬E requires "
      + "selection of a formula, its negation and an empty or goal line.",
      name: "¬E"},
  "¬¬E": {handler: eliminateDoubleNegation, numLines: 2, hint: "¬¬E requires "
      + "selection of a double negation and an empty or goal line.",
      name: "¬¬E"},
  "⊤I": {handler: introduceTop, numLines: 1, hint: "⊤I requires "
      + "selection of an empty or goal line.", name: "⊤I"},
  "⊥I": {handler: introduceBottom, numLines: 3, hint: "⊥I requires "
      + "selection of a formula, its negation and an empty or goal line.",
      name: "⊥I"},
  "⊥E": {handler: eliminateBottom, numLines: 2, hint: "⊥E requires "
      + "selection of a bottom and an empty or goal line.", name: "⊥E"},
  "↔I": {handler: introduceBiconditional, numLines: 3, hint: "↔I requires "
      + 'selection of two implications in "opposite" directions and '
      + "an empty or goal line.", name: "↔I"},
  "↔E": {handler: eliminateBiconditional, numLines: 3, hint: "↔E requires "
      + 'selection of a biconditional, formula matching one of its "sides" '
      + "and an empty or goal line.", name: "↔E"},
  "EM": {handler: applyExcludedMiddle, numLines: 1, hint: "EM requires "
      + "selection of an empty or goal line.", name: "EM"},
  "PC": {handler: applyProofByContradiction, numLines: 1, hint: "PC requires "
      + "selection of an empty or goal line.", name: "PC"},
  "∃I": {handler: introduceExistential, numLines: 2, hint: "∃I requires "
      + "selection of a formula with term(s) to be replaced by the "
      + "quantified variable and an empty or goal line.", name: "∃I"},
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
  "✓": {handler: applyTick, numLines: 2, hint: "✓ requires selection "
      + "of a formula and an empty or goal line.", name: "✓"}
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
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
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
  extractOperands(justificationLines[0].formula, conjuncts,
      formulaTypes.CONJUNCTION);
  if (targetLine instanceof EmptyProofLine) {
    /* Targent line is an empty line - allow user to choose conjuncts to be
       eliminated */
    let modalBody
        = "Please select the conjunct(s) that you would like to eliminate:";
    for (let i = 0; i < conjuncts.length; i++) {
      modalBody +=
          `<div class="custom-control custom-checkbox">
             <input type="checkbox" class="custom-control-input" id="${"conjunctCheckbox" + i}">
             <label class="custom-control-label" for="${"conjunctCheckbox" + i}">${conjuncts[i].stringRep}</label>
           </div>`
    }
    showModal("Input required", modalBody, undefined,
        "eliminateConjunctionComplete");
  } else {
    /* Target line is a goal line */
    for (var i = 0; i < conjuncts.length; i++) {
      if (formulasDeepEqual(conjuncts[i], targetLine.formula)) {
        targetLine.justification
            = new Justification(justTypes.CON_ELIM, justificationLines);
        if (targetLine.prev instanceof EmptyProofLine) {
          targetLine.prev.delete();
        }
        return;
      }
    }
    throw new ProofProcessingError("Neither of the individiual conjuncts in "
        + "the justification formula matches the goal formula.")
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
}

/*
 * Function handling disjunction introduction
 */
function introduceDisjunction() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the additional disjunct of the introduced "
        + "formula and choose the order of the disjuncts:";
    let buttons =
        `<button id="introduceDisjunctionCompleteLeft" type="button" class="disable-parse-error btn btn-outline-primary" data-dismiss="modal" disabled>${justificationLines[0].formula.stringRep} ∨ ?</button>
         <button id="introduceDisjunctionCompleteRight" type="button" class="disable-parse-error btn btn-outline-primary" data-dismiss="modal" disabled>? ∨ ${justificationLines[0].formula.stringRep}</button>`
    requestFormulaInput(requestText, undefined, buttons);
  } else {
    /* Target line is a goal line - automatically attempt to derive goal
       formula */
    if (checkDisjunctionIntroduction(justificationLines[0].formula,
        targetLine.formula)) {
      targetLine.justification
          = new Justification(justTypes.DIS_INTRO, justificationLines);
    } else {
      throw new ProofProcessingError("Neither right nor left disjunct(s) "
          + "match(es) the justification formula and hence the disjunction "
          + "introduction rule can not be applied.");
    }
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceDisjunctionCompleteLeft");
  $("#dynamicModalArea").off("click", "#introduceDisjunctionCompleteRight");
  $("#dynamicModalArea").on("click", "#introduceDisjunctionCompleteLeft",
      function() {
    completeDisjunction(true);
  });
  $("#dynamicModalArea").on("click", "#introduceDisjunctionCompleteRight",
      function() {
    completeDisjunction(false);
  });

  /*
   * Complete rule application by introducing new disjunction
   */
  function completeDisjunction(left) {
    let userDisjunct = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    let newDisjunction;
    if (left) {
      /* Use justification formula as the left disjunct */
      newDisjunction = new Disjunction(justificationLines[0].formula,
          userDisjunct);
    } else {
      /* Use justification formula as the right disjunct */
      newDisjunction = new Disjunction(userDisjunct,
          justificationLines[0].formula);
    }
    let justification
        = new Justification(justTypes.DIS_INTRO, justificationLines);
    let newLine = new JustifiedProofLine(newDisjunction, justification);
    targetLine.prepend(newLine);
    completeProofUpdate();
  }

  /*
   * Checks whether the target formula can be derived from the justification
     formula using disjunction introduction
   */
   function checkDisjunctionIntroduction(justificationFormula, targetFormula) {
     let targetDisjuncts = [];
     extractOperands(targetFormula, targetDisjuncts, formulaTypes.DISJUNCTION);
     let justificationDisjuncts = [];
     extractOperands(justificationFormula, justificationDisjuncts,
         formulaTypes.DISJUNCTION);
     for (var i = 0; i < justificationDisjuncts.length; i++) {
       if (!formulasDeepEqual(targetDisjuncts[i], justificationDisjuncts[i])) {
         break;
       }
     }
     if (i === justificationDisjuncts.length) {
       return true;
     }
     for (i = targetDisjuncts.length - justificationDisjuncts.length;
         i < targetDisjuncts.length; i++) {
       let j = i - (targetDisjuncts.length - justificationDisjuncts.length);
       if (!formulasDeepEqual(targetDisjuncts[i], justificationDisjuncts[j])) {
         return false;
       }
     }
     return true;
   }
}

/*
 * Function handling disjunction elimination
 */
function eliminateDisjunction() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  if (justificationLines[0].formula.type !== formulaTypes.DISJUNCTION) {
    throw new ProofProcessingError("The selected justification formula is "
        + "not a disjunction.");
  }
  let targetLine = retrievedLines.targetLine;
  let disjunct1 = justificationLines[0].formula.operand1;
  let initialLine1 = new JustifiedProofLine(disjunct1,
      new SpecialJustification(justTypes.ASS));
  let disjunct2 = justificationLines[0].formula.operand2;
  let initialLine2 = new JustifiedProofLine(disjunct2,
      new SpecialJustification(justTypes.ASS));
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula that you would like to derive "
        + "using disjunction elimination rule:";
    requestFormulaInput(requestText, "eliminateDisjunctionComplete");
  } else {
    /* Target line is a goal line - choose automatically as the goal formula */
    let targetFormula = targetLine.formula;
    let goalLine1 = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox1 = new ProofBox(initialLine1, goalLine1, true);
    let goalLine2 = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox2 = new ProofBox(initialLine2, goalLine2, false);
    targetLine.prepend(proofBox1);
    targetLine.prepend(proofBox2);
    let ruleJustificationLines = justificationLines.
        concat([initialLine1, goalLine1, initialLine2, goalLine2]);
    targetLine.justification
        = new Justification(justTypes.DIS_ELIM, ruleJustificationLines);
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateDisjunctionComplete");
  $("#dynamicModalArea").on("click", "#eliminateDisjunctionComplete",
      function() {
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    let goalLine1 = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox1 = new ProofBox(initialLine1, goalLine1, true);
    let goalLine2 = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox2 = new ProofBox(initialLine2, goalLine2, false);
    let newEmptyLine = new EmptyProofLine();
    targetLine.append(newEmptyLine);
    newEmptyLine.prepend(proofBox1);
    newEmptyLine.prepend(proofBox2);
    let ruleJustificationLines = justificationLines.
        concat([initialLine1, goalLine1, initialLine2, goalLine2]);
    let justification
        = new Justification(justTypes.DIS_ELIM, ruleJustificationLines);
    let newJustifiedLine = new JustifiedProofLine(targetFormula, justification);
    newEmptyLine.prepend(newJustifiedLine);
    completeProofUpdate();
  });
}

/*
 * Function handling implication introduction
 */
function introduceImplication() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula that you would like to "
        + "introduce using implication introduction rule:";
    requestFormulaInput(requestText, "introduceImplicationComplete");
  } else {
    /* Target line is a goal line - choose the goal formula automatically */
    let targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.IMPLICATION) {
      throw new ProofProcessingError("The selected formula is not an "
          + "implication.")
    }
    let initialLine = new JustifiedProofLine(targetFormula.operand1,
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(targetFormula.operand2,
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false);
    targetLine.prepend(proofBox);
    let ruleJustificationLines = [initialLine, goalLine];
    targetLine.justification
        = new Justification(justTypes.IMP_INTRO, ruleJustificationLines);
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceImplicationComplete");
  $("#dynamicModalArea").on("click", "#introduceImplicationComplete",
      function() {
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    if (targetFormula.type !== formulaTypes.IMPLICATION) {
      let error = new ProofProcessingError("The entered formula is not an "
          + "implication.");
      handleProofProcessingError(error);
      return;
    }
    let initialLine = new JustifiedProofLine(targetFormula.operand1,
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(targetFormula.operand2,
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false);
    let newEmptyLine = new EmptyProofLine();
    targetLine.append(newEmptyLine);
    newEmptyLine.prepend(proofBox);
    let ruleJustificationLines = [initialLine, goalLine];
    let justification
        = new Justification(justTypes.IMP_INTRO, ruleJustificationLines);
    let newJustifiedLine = new JustifiedProofLine(targetFormula, justification);
    newEmptyLine.prepend(newJustifiedLine);
    completeProofUpdate();
  });
}

/*
 * Function handling implication elimination
 */
function eliminateImplication() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let formula1 = justificationLines[0].formula;
  let formula2 = justificationLines[1].formula;
  let implicationFormula;
  let antecedentFormula;
  if (formula1.type === formulaTypes.IMPLICATION
      && formulasDeepEqual(formula1.operand1, formula2)) {
    implicationFormula = formula1;
    antecedentFormula = formula2;
  } else if (formula2.type === formulaTypes.IMPLICATION
      && formulasDeepEqual(formula2.operand1, formula1)) {
    implicationFormula = formula2;
    antecedentFormula = formula1;
  } else {
    throw new ProofProcessingError("The selected lines cannot be "
        + "used as a justification for implication elimination.");
  }
  let consequent = implicationFormula.operand2;
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    let justification
        = new Justification(justTypes.IMP_ELIM, justificationLines);
    let newLine = new JustifiedProofLine(consequent, justification);
    targetLine.prepend(newLine);
  } else {
    if (!formulasDeepEqual(targetLine.formula, consequent)) {
      throw new ProofProcessingError("The consequent of the implication does "
          + "not match the selected goal formula.")
    }
    targetLine.justification
        = new Justification(justTypes.IMP_ELIM, justificationLines);
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }
}

/*
 * Function handling negation introduction
 */
function introduceNegation() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula that you would like to "
        + "introduce using negation introduction rule:";
    requestFormulaInput(requestText, "introduceNegationComplete");
  } else {
    /* Target line is a goal line - choose target formula automatically */
    let targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.NEGATION) {
      throw new ProofProcessingError("The selected formula is not a negation.");
    }
    let initialLine = new JustifiedProofLine(targetFormula.operand,
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(new Bottom(),
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false);
    targetLine.prepend(proofBox);
    let ruleJustificationLines = [initialLine, goalLine];
    targetLine.justification
        = new Justification(justTypes.NEG_INTRO, ruleJustificationLines);
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceNegationComplete");
  $("#dynamicModalArea").on("click", "#introduceNegationComplete",
      function() {
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    if (targetFormula.type !== formulaTypes.NEGATION) {
      let error
          = new ProofProcessingError("The entered formula is not a negation.");
      handleProofProcessingError(error);
      return;

    }
    let initialLine = new JustifiedProofLine(targetFormula.operand,
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(new Bottom(),
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false);
    let newEmptyLine = new EmptyProofLine();
    targetLine.append(newEmptyLine);
    newEmptyLine.prepend(proofBox);
    let ruleJustificationLines = [initialLine, goalLine];
    let justification
        = new Justification(justTypes.NEG_INTRO, ruleJustificationLines);
    let newJustifiedLine = new JustifiedProofLine(targetFormula, justification);
    newEmptyLine.prepend(newJustifiedLine);
    completeProofUpdate();
  });
}

/*
 * Function handling negation elimination
 */
function eliminateNegation() {
  addBottom(justTypes.NEG_ELIM);
}

/*
 * Function handling double negation elimination
 */
function eliminateDoubleNegation() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.NEGATION
      || justificationFormula.operand.type !== formulaTypes.NEGATION) {
    throw new ProofProcessingError("The justification formula is not a double "
        + "negation.");
  }
  let targetLine = retrievedLines.targetLine;
  let newFormula = justificationFormula.operand.operand;
  let justification
      = new Justification(justTypes.DOUBLE_NEG_ELIM, justificationLines);
  if (targetLine instanceof EmptyProofLine) {
    let newLine = new JustifiedProofLine(newFormula, justification);
    targetLine.prepend(newLine);
  } else {
    if (!formulasDeepEqual(targetLine.formula, newFormula)) {
      throw new ProofProcessingError("The justification formula is not a "
          + "double negation of the selected goal formula.");
    }
    targetLine.justification = justification;
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }
}

/*
 * Function handling top introduction
 */
function introduceTop() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  let justification = new SpecialJustification(justTypes.TOP_INTRO);
  if (targetLine instanceof EmptyProofLine) {
    let newLine = new JustifiedProofLine(new Top(), justification);
    targetLine.prepend(newLine);
  } else {
    if (targetLine.formula.type !== formulaTypes.TOP) {
      throw new ProofProcessingError("The selected goal formula is not top.");
    }
    targetLine.justification = justification;
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }
}

/*
 * Function handling bottom introduction
 */
function introduceBottom() {
  addBottom(justTypes.BOT_INTRO);
}

/*
 * Function handling bottom elimination
 */
function eliminateBottom() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.BOTTOM) {
    throw new ProofProcessingError("The selected justification formula is not "
        + "bottom.");
  }
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula that you would like to "
        + "introduce using bottom elimination:";
    requestFormulaInput(requestText, "eliminateBottomComplete");
  } else {
    /* Target line is a goal line - choose target formula automatically */
    let targetFormula = targetLine.formula;
    targetLine.justification
        = new Justification(justTypes.BOT_ELIM, justificationLines);
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateBottomComplete");
  $("#dynamicModalArea").on("click", "#eliminateBottomComplete",
      function() {
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    let justification
        = new Justification(justTypes.BOT_ELIM, justificationLines);
    let newLine = new JustifiedProofLine(targetFormula, justification);
    targetLine.prepend(newLine);
    completeProofUpdate();
  });
}

/*
 * Function handling biconditional introduction rule
 */
function introduceBiconditional() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let targetLine = retrievedLines.targetLine;
  if (justificationLines[0].formula.type !== formulaTypes.IMPLICATION
      && justificationLines[1].formula.type !== formulaTypes.IMPLICATION) {
    throw new ProofProcessingError("One or both of the selected justification "
        + "lines are not an implication.");
  }
  let antecedent1 = justificationLines[0].formula.operand1;
  let consequent1 = justificationLines[0].formula.operand2;
  let antecedent2 = justificationLines[1].formula.operand1;
  let consequent2 = justificationLines[1].formula.operand2;
  if (!formulasDeepEqual(antecedent1, consequent2)
      && formulasDeepEqual(consequent1, antecedent2)) {
    throw new ProofProcessingError("The antecedent of the first implication "
        + "does not match the consequent of the second implication or vice "
        + "versa.");
  }
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify order */
    let requestText = "Please choose the order of operands in the introduced "
        + "formula:";
    let buttons =
        `<button id="introduceBiconditionalCompleteFirst" type="button" class="disable-parse-error btn btn-outline-primary" data-dismiss="modal">${antecedent1.stringRep} ↔ ${consequent1.stringRep}</button>
         <button id="introduceBiconditionalCompleteSecond" type="button" class="disable-parse-error btn btn-outline-primary" data-dismiss="modal">${consequent1.stringRep} ↔ ${antecedent1.stringRep}</button>`
    showModal("Input required", requestText, undefined, undefined, buttons);
  } else {
    /* Target line is a goal line - automatically attempt to derive goal
       formula */
    if (targetLine.formula.type !== formulaTypes.BICONDITIONAL) {
      throw new ProofProcessingError("The selected goal formula is not a "
          + "biconditional.")
    }
    if ((formulasDeepEqual(targetLine.formula.operand1, antecedent1)
            && formulasDeepEqual(targetLine.formula.operand2, consequent1))
        || (formulasDeepEqual(targetLine.formula.operand1, consequent1)
            && formulasDeepEqual(targetLine.formula.operand2, antecedent1))) {
      targetLine.justification
          = new Justification(justTypes.BICOND_INTRO, justificationLines);
    } else {
      throw new ProofProcessingError("The operands of the selected goal "
          + "formula do not match the antecedents and consequents of "
          + "the justification implications.")
    }
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceBiconditionalCompleteFirst");
  $("#dynamicModalArea").off("click", "#introduceBiconditionalCompleteSecond");
  $("#dynamicModalArea").on("click", "#introduceBiconditionalCompleteFirst",
      function() {
    completeBiconditional(true);
  });
  $("#dynamicModalArea").on("click", "#introduceBiconditionalCompleteSecond",
      function() {
    completeBiconditional(false);
  });

  /*
   * Complete rule application by introducing new biconditional
   */
  function completeBiconditional(orderFirst) {
    let newBiconditional;
    if (orderFirst) {
      /* Use the order in the first selected implication */
      newBiconditional = new Biconditional(antecedent1, consequent1);
    } else {
      /* Use the order in the second selected implication */
      newBiconditional = new Biconditional(consequent1, antecedent1);
    }
    let justification
        = new Justification(justTypes.BICOND_INTRO, justificationLines);
    let newLine = new JustifiedProofLine(newBiconditional, justification);
    targetLine.prepend(newLine);
    completeProofUpdate();
  }
}

/*
 * Function handling biconditional elimination
 */
function eliminateBiconditional() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let formula1 = justificationLines[0].formula;
  let formula2 = justificationLines[1].formula;
  let biconditionalFormula;
  let newFormula;
  if (formula1.type === formulaTypes.BICONDITIONAL
      && (formulasDeepEqual(formula1.operand1, formula2)
          || formulasDeepEqual(formula1.operand2, formula2))) {
    biconditionalFormula = formula1;
    if (formulasDeepEqual(formula1.operand1, formula2)) {
      newFormula = formula1.operand2;
    } else {
      newFormula = formula1.operand1;
    }
  } else if (formula2.type === formulaTypes.BICONDITIONAL
      && (formulasDeepEqual(formula2.operand1, formula1)
          || formulasDeepEqual(formula2.operand2, formula1))) {
    biconditionalFormula = formula2;
    if (formulasDeepEqual(formula2.operand1, formula1)) {
      newFormula = formula2.operand2;
    } else {
      newFormula = formula2.operand1;
    }
  } else {
    throw new ProofProcessingError("The selected lines cannot be "
        + "used as a justification for biconditional elimination.");
  }
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    let justification
        = new Justification(justTypes.BICOND_ELIM, justificationLines);
    let newLine = new JustifiedProofLine(newFormula, justification);
    targetLine.prepend(newLine);
  } else {
    if (!formulasDeepEqual(targetLine.formula, newFormula)) {
      throw new ProofProcessingError("The formula derivable by biconditional "
          + "elimination does not match the selected goal formula.")
    }
    targetLine.justification
        = new Justification(justTypes.BICOND_ELIM, justificationLines);
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }
}

/*
 * Function handling excluded middle application
 */
function applyExcludedMiddle() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula for p in p ∨ ¬p and choose "
        + "the order of the disjuncts:";
    let buttons =
        `<button id="applyExcludedMiddleLeft" type="button" class="disable-parse-error btn btn-outline-primary" data-dismiss="modal">p ∨ ¬p</button>
         <button id="applyExcludedMiddleRight" type="button" class="disable-parse-error btn btn-outline-primary" data-dismiss="modal">¬p ∨ p</button>`
    requestFormulaInput(requestText, undefined, buttons);
  } else {
    let targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.DISJUNCTION) {
      throw new ProofProcessingError("The selected target formula is not a "
          + "disjunction.")
    }
    if ((targetFormula.operand2.type === formulaTypes.NEGATION
            && formulasDeepEqual(targetFormula.operand1,
                targetFormula.operand2.operand))
        || (targetFormula.operand1.type === formulaTypes.NEGATION
            && formulasDeepEqual(targetFormula.operand2,
                targetFormula.operand1.operand))) {
      targetLine.justification
          = new SpecialJustification(justTypes.EM);
    } else {
      throw new ProofProcessingError("The selected target formula cannot be "
          + "derived using rule of the excluded middle.")
    }
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#applyExcludedMiddleLeft");
  $("#dynamicModalArea").off("click", "#applyExcludedMiddleRight");
  $("#dynamicModalArea").on("click", "#applyExcludedMiddleLeft",
      function() {
    completeExcludedMiddle(true);
  });
  $("#dynamicModalArea").on("click", "#applyExcludedMiddleRight",
      function() {
    completeExcludedMiddle(false);
  });

  /*
   * Complete rule application by introducing new EM disjunction
   */
  function completeExcludedMiddle(basicLeft) {
    let pFormula = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    let emFormula;
    if (basicLeft) {
      /* Use p as the left disjunct */
      emFormula = new Disjunction(pFormula, new Negation(pFormula));
    } else {
      /* Use ~p as the left disjunct */
      emFormula = new Disjunction(new Negation(pFormula), pFormula);
    }
    let justification
        = new SpecialJustification(justTypes.EM);
    let newLine = new JustifiedProofLine(emFormula, justification);
    targetLine.prepend(newLine);
    completeProofUpdate();
  }
}

/*
 * Function handling proof by contradiction application
 */
function applyProofByContradiction() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula that you would like to "
        + "introduce using proof by contradiction:";
    requestFormulaInput(requestText, "proofByContradictionComplete");
  } else {
    /* Target line is a goal line - choose target formula automatically */
    let targetFormula = targetLine.formula;
    let initialLine = new JustifiedProofLine(new Negation(targetFormula),
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(new Bottom(),
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false);
    targetLine.prepend(proofBox);
    let ruleJustificationLines = [initialLine, goalLine];
    targetLine.justification
        = new Justification(justTypes.PC, ruleJustificationLines);
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#proofByContradictionComplete");
  $("#dynamicModalArea").on("click", "#proofByContradictionComplete",
      function() {
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    let initialLine = new JustifiedProofLine(new Negation(targetFormula),
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(new Bottom(),
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false);
    let newEmptyLine = new EmptyProofLine();
    targetLine.append(newEmptyLine);
    newEmptyLine.prepend(proofBox);
    let ruleJustificationLines = [initialLine, goalLine];
    let justification
        = new Justification(justTypes.PC, ruleJustificationLines);
    let newJustifiedLine = new JustifiedProofLine(targetFormula, justification);
    newEmptyLine.prepend(newJustifiedLine);
    completeProofUpdate();
  });
}

/*
 * Function handling existential introduction
 */
function introduceExistential() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula that you would like to "
        + "introduce using existential introduction rule:";
    requestFormulaInput(requestText, "introduceExistentialComplete");
  } else {
    /* Target line is a goal line - choose the goal formula automatically */
    let targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.EXISTENTIAL) {
      throw new ProofProcessingError("The selected formula is not an "
          + "existential.");
    }
    if (!verifyExistentialIntroduction(justificationFormula, targetFormula)) {
      throw new ProofProcessingError("The selected target formula cannot be "
          + "derived from the selected justification formula using existential "
          + "introduction. Please check that only closed terms have been "
          + "replaced by quantified variables and that terms replaced by "
          + "the same variable are identical.")
    }
    targetLine.justification
        = new Justification(justTypes.EXIS_INTRO, justificationLines);
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceExistentialComplete");
  $("#dynamicModalArea").on("click", "#introduceExistentialComplete",
      function() {
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        PithosData.proof.signature);
    if (targetFormula.type !== formulaTypes.EXISTENTIAL) {
      let error = new ProofProcessingError("The entered formula is not an "
          + "existential.");
      handleProofProcessingError(error);
      return;
    }
    if (!verifyExistentialIntroduction(justificationFormula, targetFormula)) {
      let error = new ProofProcessingError("The selected target formula cannot "
          + "be derived from the selected justification formula using "
          + "existential introduction. Please check that only closed terms "
          + "have been replaced by quantified variables and that terms "
          + "replaced by the same variable are identical.")
      handleProofProcessingError(error);
      return;
    }
    let justification
        = new Justification(justTypes.EXIS_INTRO, justificationLines);
    let newLine = new JustifiedProofLine(targetFormula, justification);
    targetLine.prepend(newLine);
    completeProofUpdate();
  });

  /*
   * Function checking existential introduction application
   */
  function verifyExistentialIntroduction(justificationFormula, targetFormula) {
    /* Determine the difference in the number of existential quantifiers */
    let justificationExistentialCount = 0;
    let currFormula = justificationFormula;
    while (currFormula.type === formulaTypes.EXISTENTIAL) {
      justificationExistentialCount++;
      currFormula = currFormula.predicate;
    }
    let targetExistentialCount = 0;
    currFormula = targetFormula;
    while (currFormula.type === formulaTypes.EXISTENTIAL) {
      targetExistentialCount++;
      currFormula = currFormula.predicate;
    }
    if (targetExistentialCount <= justificationExistentialCount) {
      /* Fail verification if there are no additional existential quantifiers
         in the target formula */
      return false;
    }
    /* Attempt to match formulas to verify rule application */
    let addedExistentialCount
        = targetExistentialCount - justificationExistentialCount;
    let existentialVariablesSet = new Set([]);
    currFormula = targetFormula;
    for (let i = 0; i < addedExistentialCount; i++) {
      existentialVariablesSet.add(currFormula.variableString);
      currFormula = currFormula.predicate;
    }
    return existentialIntroductionMatch(justificationFormula, currFormula,
        existentialVariablesSet, {});
  }

  /*
   * Checks whether the trimmed target formula can be matched to the
     justification formula for the purposes of existential introduction
   * variablesSet contains textual representation of variables quantified by
     the introduced existentials
   */
  function existentialIntroductionMatch(justification, target, variablesSet,
      replacements) {
    if (justification.type !== target.type
        && !(justification instanceof Term && target instanceof Term)) {
      return false;
    }
    if (justification instanceof Term) {
      if (formulasDeepEqual(justification, target)) {
        /* Terms are identical - no replacement occured */
        return true;
      }
      if (justification.type === termTypes.VARIABLE) {
        /* Variables do not match and hence the formulas do not match (only
           closed terms can be replaced by a variable) */
        return false;
      }
      if (justification.type === termTypes.CONSTANT) {
        if (target.type !== termTypes.VARIABLE
            || !variablesSet.has(target.name)) {
          /* Constant was not replaced by variable - formulas do not match */
          return false;
        }
        /* Constant has been replaced by variable - check whether the
           replacement is valid */
        if (!replacements.hasOwnProperty(target.name)) {
          /* No previous replacement by the given variable has been encountered
             - log the first */
          replacements[target.name] = justification;
          return true;
        }
        /* Replacement by the given variable has already occured - check
           whether the replaced constants match */
        if (replacements[target.name].type === termTypes.CONSTANT &&
            formulasDeepEqual(replacements[target.name], justification)) {
          /* Successful match */
          return true;
        }
        /* Replaced terms do not match - report failure */
        return false;
      }
      if (justification.type === termTypes.FUNCTION) {
        if (target.type === termTypes.CONSTANT) {
          /* Constant in target formula cannot be matched to a function in
             the justification formula */
          return false;
        }
        if (target.type === termTypes.FUNCTION) {
          /* Check deep match - possible replacement by variable must have
             occured inside function */
          if (justification.name !== target.name) {
            /* The names of functions do not match */
            return false;
          }
          return _.zipWith(justification.terms, target.terms,
              (t1, t2) => existentialIntroductionMatch(t1, t2,
                  variablesSet, replacements))
              .reduce((b1, b2) => b1 && b2, true);
        }
        if (target.type === termTypes.VARIABLE) {
          /* Function was replaced by a variable - check whether the replacement
             is valid */
          if (!variablesSet.has(target.name)) {
            /* The encountered variable is not quantified by an added
               existential - report failure */
            return false;
          }
          if (!replacements.hasOwnProperty(target.name)) {
            /* No previous replacement by the given variable has been
               encountered - log the first */
            replacements[target.name] = justification;
            return true;
          }
          /* Replacement by the given variable has already occured - check
             whether the replaced functions match */
          if (replacements[target.name].type === termTypes.FUNCTION &&
              formulasDeepEqual(replacements[target.name], justification)) {
            /* Successful match */
            return true;
          }
          /* Replaced terms do not match - report failure */
          return false;
        }
      }
    } else if (justification instanceof Quantifier) {
      if (justification.variableString !== target.variableString) {
        return false;
      }
      if (variablesSet.has(justification.variableString)) {
        /* Cannot replace constants by variable that is already
           quantified at "deeper" level in the given sub-formula */
        variablesSet.delete(justification.variableString);
      }
      return existentialIntroductionMatch(justification.predicate,
          target.predicate, variablesSet, replacements);
    } else if (justification.type === formulaTypes.RELATION) {
      if (justification.name !== target.name) {
        return false;
      }
      return _.zipWith(justification.terms, target.terms,
          (t1, t2) => existentialIntroductionMatch(t1, t2,
              variablesSet, replacements))
          .reduce((b1, b2) => b1 && b2, true);
    } else if (justification instanceof Equality) {
      return existentialIntroductionMatch(justification.term1, target.term1)
          && existentialIntroductionMatch(justification.term2, target.term2);
    } else if (justification.type === formulaTypes.NEGATION) {
      return existentialIntroductionMatch(justification.operand,
          target.operand);
    } else if (justification instanceof BinaryConnective) {
      if (justification.isAssociative) {
        let operandsJustification = [];
        extractOperands(justification, operandsJustification,
            justification.type);
        let operandsTarget = [];
        extractOperands(target, operandsTarget, justification.type);
        return _.zipWith(operandsJustification, operandsTarget,
            (f1, f2) => existentialIntroductionMatch(f1, f2, variablesSet,
                replacements))
            .reduce((b1, b2) => b1 && b2, true);
      } else {
        return existentialIntroductionMatch(justification.operand1,
                target.operand1)
            && existentialIntroductionMatch(justification.operand2,
                target.operand2);
      }
    } else {
      return formulasDeepEqual(justification, target);
    }
  }
}

/*
 * Function handling tick rule application
 */
function applyTick() {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  let targetLine = retrievedLines.targetLine;
  let justification = new Justification(justTypes.TICK, justificationLines);
  if (targetLine instanceof EmptyProofLine) {
    let newLine = new JustifiedProofLine(justificationFormula, justification);
    targetLine.prepend(newLine);
  } else {
    if (!formulasDeepEqual(targetLine.formula, justificationFormula)) {
      throw new ProofProcessingError("The justification and goal formulas do "
          + "not match.");
    }
    targetLine.justification = justification;
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }
}

/*
 * Function handling negation elimination and bottom introduction rules
 */
function addBottom(justType) {
  let retrievedLines
      = retrieveLines(PithosData.proof, PithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let negatedFormula;
  let formula;
  if (justificationLines[0].formula.type === formulaTypes.NEGATION
      && formulasDeepEqual(justificationLines[0].formula.operand,
          justificationLines[1].formula)) {
    negatedFormula = justificationLines[0].formula;
    formula = justificationLines[1].formula;
  } else if (justificationLines[1].formula.type === formulaTypes.NEGATION
      && formulasDeepEqual(justificationLines[1].formula.operand,
          justificationLines[0].formula)) {
    negatedFormula = justificationLines[1].formula;
    formula = justificationLines[0].formula;
  } else {
    throw new ProofProcessingError("The justification formulas are not a "
        + "formula and its negation.")
  }
  let targetLine = retrievedLines.targetLine;
  let justification
      = new Justification(justType, justificationLines);
  if (targetLine instanceof EmptyProofLine) {
    let newLine
        = new JustifiedProofLine(new Bottom(), justification);
    targetLine.prepend(newLine);
  } else {
    if (targetLine.formula.type !== formulaTypes.BOTTOM) {
      throw new ProofProcessingError("The selected goal line is not bottom.");
    }
    targetLine.justification = justification;
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }
}

/*
 * Shows modal prompting user to enter additional formula required for
   one of the supported natural deduction ruless
 */
function requestFormulaInput(requestText, customId, buttons) {
  let modalBody =
      `<div class="py-2 text-center sticky-top">
         <div class="btn-group pb-1" role="group" aria-label="Insert logical connectives">
           <button type="button" class="btn btn-secondary insert-char-btn">¬</button>
           <button type="button" class="btn btn-secondary insert-char-btn">∧</button>
           <button type="button" class="btn btn-secondary insert-char-btn">∨</button>
           <button type="button" class="btn btn-secondary insert-char-btn">→</button>
           <button type="button" class="btn btn-secondary insert-char-btn">↔</button>
           <button type="button" class="btn btn-secondary insert-char-btn">∀</button>
           <button type="button" class="btn btn-secondary insert-char-btn">∃</button>
         </div>
         <div class="btn-group pb-1" role="group" aria-label="Insert top or bottom">
           <button type="button" class="btn btn-secondary insert-char-btn">⊤</button>
           <button type="button" class="btn btn-secondary insert-char-btn">⊥</button>
         </div>
         <div class="btn-group pb-1" role="group" aria-label="Insert brackets">
           <button type="button" class="btn btn-secondary insert-char-btn">(</button>
           <button type="button" class="btn btn-secondary insert-char-btn">)</button>
           <button type="button" class="btn btn-secondary insert-char-btn">[</button>
           <button type="button" class="btn btn-secondary insert-char-btn">]</button>
         </div>
       </div>
       <p>${requestText}</p>
       <input id="additionalFormulaInput" class="additional-formula-input form-control mb-2" type="text" placeholder="Please type your formula here." value="" autocomplete="off">
       <div id="additionalFormulaParsed" class="alert alert-dark" role="alert" style="word-wrap: break-word; ">
         The result of the parsing will appear here.
       </div>`
    showModal("Input required", modalBody, undefined, customId, buttons);
}

/*
 * Parse additional formulas inputted in modals
 */
jQuery(function($) {
  $("#dynamicModalArea").on("input", "#additionalFormulaInput",
      parseAdditionalFormula);
});

/*
 * Parses additional formula entered to the input field in a modal
 */
function parseAdditionalFormula() {
  /* Backup signature in case of error in parsing */
  let signatureCopy = $.extend(true, {}, PithosData.proof.signature);
  let inputSelector = $("#additionalFormulaInput");
  let outputSelector = $("#additionalFormulaParsed");
  let parsedFormula;
  try {
    parsedFormula = parseFormula(inputSelector[0].value, signatureCopy);
  } catch (error) {
    if (error instanceof FormulaParsingError) {
      /* Show result and disable action buttons */
      $(".disable-parse-error").attr("disabled", true);
      outputSelector.text(error.message);
      outputSelector
          .removeClass("alert-dark alert-success")
          .addClass("alert-danger");
      return;
    } else {
      throw error;
    }
  }
  /* Show result on success */
  $(".disable-parse-error").attr("disabled", false);
  outputSelector.text(parsedFormula.stringRep);
  outputSelector
      .removeClass("alert-dark alert-danger")
      .addClass("alert-success");
}

/*
 * Extracts individual operands for associative operators
 */
function extractOperands(formula, extractionTarget, type) {
  if (formula.type !== type) {
    extractionTarget.push(formula);
  } else {
    extractOperands(formula.operand1, extractionTarget, type);
    extractOperands(formula.operand2, extractionTarget, type);
  }
}
