"use strict";

/*
 * Function handling conjunction introduction
 */
function introduceConjunction() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
  if (justificationLines.length + 1 < pithosData.selectedRuleData.numLines) {
    introduceConjunctionBackwards();
    return;
  }
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

  /*
   * Introduces conjunction through a backwards rule application
   */
  function introduceConjunctionBackwards() {
    if (targetLine instanceof EmptyProofLine) {
      throw new ProofProcessingError("The backward rule application cannot "
          + "be performed on an empty line.");
    }
    if (targetLine.formula.type !== formulaTypes.CONJUNCTION) {
      throw new ProofProcessingError("The selected goal formula is not a "
          + "conjunction.");
    }
    let targetFormula = targetLine.formula;
    let goalJustification = new SpecialJustification(justTypes.GOAL);
    if (justificationLines.length === 0) {
      let conjunct1 = targetFormula.operand1;
      let conjunct2 = targetFormula.operand2;
      requestOrder(conjunct1, conjunct2,
          "introduceConjunctionBackwardsComplete");
    } else {
      let justificationFormula = justificationLines[0].formula;
      let newGoalFormula;
      let matchData = {};
      if (checkMatchesSide(justificationFormula, targetFormula,
          formulaTypes.CONJUNCTION, matchData)) {
        newGoalFormula = matchData.remaining
            .reduce((f1, f2) => new Conjunction(f1, f2));
      } else {
        throw new ProofProcessingError("The selected justification formula "
            + "cannot be used for the application of backward conjunction "
            + "introduction since it does not correspond with either side "
            + "of the chosen target conjunction.");
      }
      let newGoalLine = new JustifiedProofLine(newGoalFormula,
          new SpecialJustification(justTypes.GOAL));
      targetLine.prepend(newGoalLine);
      justificationLines.push(newGoalLine);
      targetLine.justification = new Justification(justTypes.CON_INTRO,
          justificationLines);
    }

    /*
     * Catch user action for the backward rule application completion
     */
    /* Unbind possible previously bound event */
    $("#dynamicModalArea").off("click",
        "#introduceConjunctionBackwardsComplete1");
    $("#dynamicModalArea").off("click",
        "#introduceConjunctionBackwardsComplete2");
    $("#dynamicModalArea").on("click", "#introduceConjunctionBackwardsComplete1",
        function() {
      introduceConjunctionBackwardsComplete(true);
    });
    $("#dynamicModalArea").on("click", "#introduceConjunctionBackwardsComplete2",
        function() {
      introduceConjunctionBackwardsComplete(false);
    });

    function introduceConjunctionBackwardsComplete(conjunct1First) {
      let firstGoalLine;
      let secondGoalLine;
      if (conjunct1First) {
        firstGoalLine = new JustifiedProofLine(conjunct1,
            new SpecialJustification(justTypes.GOAL));
        secondGoalLine = new JustifiedProofLine(conjunct2,
            new SpecialJustification(justTypes.GOAL));
      } else {
        firstGoalLine = new JustifiedProofLine(conjunct2,
            new SpecialJustification(justTypes.GOAL));
        secondGoalLine = new JustifiedProofLine(conjunct1,
            new SpecialJustification(justTypes.GOAL));
      }
      targetLine.prepend(firstGoalLine);
      targetLine.prepend(new EmptyProofLine());
      targetLine.prepend(secondGoalLine);
      justificationLines = [firstGoalLine, secondGoalLine];
      targetLine.justification = new Justification(justTypes.CON_INTRO,
          justificationLines);
      completeProofUpdate();
    }
  }
}

/*
 * Function handling conjunction elimination
 */
function eliminateConjunction() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
  if (justificationLines.length + 1 < pithosData.selectedRuleData.numLines) {
    eliminateConjunctionBackwards();
    return;
  }
  if (justificationLines[0].formula.type !== formulaTypes.CONJUNCTION) {
    throw new ProofProcessingError("The selected justification formula is "
        + "not a conjunction.");
  }
  let conjuncts = [];
  extractOperands(justificationLines[0].formula, conjuncts,
      formulaTypes.CONJUNCTION);
  if (targetLine instanceof EmptyProofLine) {
    /* Targent line is an empty line - allow user to choose conjuncts to be
       eliminated */
    let modalBody = "<p>Please select the conjunct(s) that you would like to "
        + "eliminate:</p>";
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

  /*
   * Introduces conjunction through a backwards rule application
   */
  function eliminateConjunctionBackwards() {
    if (targetLine instanceof EmptyProofLine) {
      throw new ProofProcessingError("The backward rule application cannot "
          + "be performed on an empty line.");
    }
    let targetFormula = targetLine.formula;
    requestFormulaInput("Please enter the conjunction that should pose as the "
        + "new goal.", "eliminateConjunctionBackwardsComplete");

    /*
     * Catch user action for the backward rule application completion
     */
    /* Unbind possible previously bound event */
    $("#dynamicModalArea").off("click",
        "#eliminateConjunctionBackwardsComplete");
    $("#dynamicModalArea").on("click", "#eliminateConjunctionBackwardsComplete",
        function() {
      let skolemConstants = getSkolemConstants(targetLine);
      let newGoalFormula = parseFormula($("#additionalFormulaInput")[0].value,
          pithosData.proof.signature, skolemConstants);
      if (newGoalFormula.type !== formulaTypes.CONJUNCTION) {
        let error = new ProofProcessingError("The entered formula is not a "
            + "conjunction and hence cannot be used as a new goal.")
        handleProofProcessingError(error);
        return;
      }
      let conjuncts = [];
      extractOperands(newGoalFormula, conjuncts,
          formulaTypes.CONJUNCTION);
      if (!_.some(conjuncts, c => formulasDeepEqual(targetLine.formula, c))) {
        let error = new ProofProcessingError("The goal formula does not match "
            + "any of the individual conjuncts in the entered formula and "
            + "hence the application of backward conjunction elimination "
            + "cannot be completed.");
        handleProofProcessingError(error);
        return;
      }
      let newGoalLine = new JustifiedProofLine(newGoalFormula,
          new SpecialJustification(justTypes.GOAL));
      targetLine.prepend(newGoalLine);
      justificationLines = [newGoalLine];
      targetLine.justification = new Justification(justTypes.CON_ELIM,
          justificationLines);
      completeProofUpdate();
    });
  }
}

/*
 * Function handling disjunction introduction
 */
function introduceDisjunction() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    if (checkMatchesSide(justificationLines[0].formula,
        targetLine.formula, formulaTypes.DISJUNCTION)) {
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
    let skolemConstants = getSkolemConstants(targetLine);
    let userDisjunct = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
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
}

/*
 * Function handling disjunction elimination
 */
function eliminateDisjunction() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  if (justificationLines[0].formula.type !== formulaTypes.DISJUNCTION) {
    throw new ProofProcessingError("The selected justification formula is "
        + "not a disjunction.");
  }
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    let proofBox1 = new ProofBox(initialLine1, goalLine1, true, new Set([]));
    let goalLine2 = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox2 = new ProofBox(initialLine2, goalLine2, false, new Set([]));
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
    let skolemConstants = getSkolemConstants(targetLine);
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
    let goalLine1 = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox1 = new ProofBox(initialLine1, goalLine1, true, new Set([]));
    let goalLine2 = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox2 = new ProofBox(initialLine2, goalLine2, false, new Set([]));
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    let proofBox = new ProofBox(initialLine, goalLine, false, new Set([]));
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
    let skolemConstants = getSkolemConstants(targetLine);
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
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
    let proofBox = new ProofBox(initialLine, goalLine, false, new Set([]));
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
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
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    let proofBox = new ProofBox(initialLine, goalLine, false, new Set([]));
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
    let skolemConstants = getSkolemConstants(targetLine);
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
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
    let proofBox = new ProofBox(initialLine, goalLine, false, new Set([]));
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.NEGATION
      || justificationFormula.operand.type !== formulaTypes.NEGATION) {
    throw new ProofProcessingError("The justification formula is not a double "
        + "negation.");
  }
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.BOTTOM) {
    throw new ProofProcessingError("The selected justification formula is not "
        + "bottom.");
  }
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    let skolemConstants = getSkolemConstants(targetLine);
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    let requestText = "<p>Please choose the order of operands in the "
        + "introduced formula:</p>";
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
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
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    let skolemConstants = getSkolemConstants(targetLine);
    let pFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
    let proofBox = new ProofBox(initialLine, goalLine, false, new Set([]));
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
    let skolemConstants = getSkolemConstants(targetLine);
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
    let initialLine = new JustifiedProofLine(new Negation(targetFormula),
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(new Bottom(),
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false, new Set([]));
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
 * Function handling tick rule application
 */
function applyTick() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  let targetLine = retrievedLines.targetLine;
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
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
  /* Used for dynamic parsing of additional formulas */
  pithosData.targetLine = targetLine;
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
