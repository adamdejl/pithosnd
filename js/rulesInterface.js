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
      return;
    }
    throw new ProofProcessingError("Neither right nor left disjunct(s) "
        + "match(es) the justification formula and hence the disjunction "
        + "introduction rule can not be applied.");
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
  let disjunct2 = justificationLines[0].formula.operand2;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText = "Please enter the formula that you would like to derive "
        + "using disjunction elimination rule:";
    requestFormulaInput(requestText, "eliminateDisjunctionComplete");
  } else {
    /* Target line is a goal line - choose automatically as the goal formula */
    let targetFormula = targetLine.formula;
    let proofBox1 = new ProofBox(disjunct1, justTypes.ASS, targetFormula, true);
    let proofBox2
        = new ProofBox(disjunct2, justTypes.ASS, targetFormula, false);
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
    let proofBox1 = new ProofBox(disjunct1, justTypes.ASS, targetFormula, true);
    let proofBox2
        = new ProofBox(disjunct2, justTypes.ASS, targetFormula, false);
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
    let proofBox = new ProofBox(targetFormula.operand1, justTypes.ASS,
        targetFormula.operand2, false);
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
      throw new ProofProcessingError("The entered formula is not an "
          + "implication.");
    }
    let proofBox = new ProofBox(targetFormula.operand1, justTypes.ASS,
        targetFormula.operand2, false);
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
  let implicationFormula;
  let antecedentFormula;
  if (justificationLines[0].formula.type === formulaTypes.IMPLICATION) {
    implicationFormula = justificationLines[0].formula;
    antecedentFormula = justificationLines[1].formula;
  } else if (justificationLines[1].formula.type === formulaTypes.IMPLICATION) {
    implicationFormula = justificationLines[1].formula;
    antecedentFormula = justificationLines[0].formula;
  } else {
    throw new ProofProcessingError("Neither of the selected justification "
        + "formulas is an implication.")
  }
  if (!formulasDeepEqual(implicationFormula.operand1, antecedentFormula)) {
    throw new ProofProcessingError("The antecedent of the implication does "
        + "not match the additional justification formula.");
  }
  let consequent = implicationFormula.operand2;
  let targetLine = retrievedLines.targetLine;
  if (targetLine instanceof EmptyProofLine) {
    let justification
        = new Justification(justTypes.IMP_ELIM, justificationLines);
    let newJustifiedLine = new JustifiedProofLine(consequent, justification);
    targetLine.prepend(newJustifiedLine);
  } else {
    if (!formulasDeepEqual(targetLine.formula, consequent)) {
      throw new ProofProcessingError("The consequent of the implication does "
          + "not match the selected goal formula.")
    }
    targetLine.justification
        = new Justification(justTypes.IMP_ELIM, justificationLines);
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
    let proofBox = new ProofBox(targetFormula.operand, justTypes.ASS,
        new Bottom(), false);
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
      throw new ProofProcessingError("The entered formula is not a negation.");
    }
    let proofBox = new ProofBox(targetFormula.operand, justTypes.ASS,
        new Bottom(), false);
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
      = new Justification(justTypes.NEG_ELIM, justificationLines);
  if (targetLine instanceof EmptyProofLine) {
    let newJustifiedLine
        = new JustifiedProofLine(new Bottom(), justification);
    targetLine.prepend(newJustifiedLine);
  } else {
    if (targetLine.formula.type !== formulaTypes.BOTTOM) {
      throw new ProofProcessingError("The selected goal formula is not "
          + "bottom.");
    }
    targetLine.justification = justification;
  }
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
