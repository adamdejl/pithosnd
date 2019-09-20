"use strict";

/*
 * Function handling existential introduction
 */
function introduceExistential() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
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
    let skolemConstants = getSkolemConstants(targetLine);
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
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
    return matchFormulasVariablesReplace(justificationFormula, currFormula,
        existentialVariablesSet, {});
  }
}

/*
 * Function handling existential elimination
 */
function eliminateExistential() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.EXISTENTIAL) {
    throw new ProofProcessingError("The selected justification formula is "
        + "not an existential.");
  }
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Ask the user how many outer exists quantifiers should be eliminated */
  let modalBody =
       "<p>Please choose the number of outer quantifiers that should be "
       + `eliminated from the formula ${justificationFormula.stringRep}:</p>`;
  let existentialCount = 0;
  for (let currFormula = justificationFormula;
      currFormula.type === formulaTypes.EXISTENTIAL;
      currFormula = currFormula.predicate) {
    modalBody +=
        `<div class="custom-control custom-radio">
           <input type="radio" id="existentialRadio${existentialCount}" class="custom-control-input">
           <label class="custom-control-label" for="existentialRadio${existentialCount}">${existentialCount + 1}</label>
         </div>`
    existentialCount++;
  }
  /* Declared for use by following code */
  let initialFormula;
  let newSkolemConstants = new Set([]);
  if (existentialCount === 1) {
    eliminateExistentialContinue(existentialCount);
  } else {
    showModal("Input required", modalBody, undefined,
        "eliminateExistentialContinue");
  }

  /*
   * Catch user action to proceed with the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateExistentialContinue");
  $("#dynamicModalArea").on("click", "#eliminateExistentialContinue",
      function() {
    let numberEliminated = 0;
    for (let i = 0; i < existentialCount; i++) {
      if ($("#existentialRadio" + i).is(":checked")) {
        numberEliminated = i + 1;
        break;
      }
    }
    if (numberEliminated === 0) {
      numberEliminated = existentialCount;
    }
    eliminateExistentialContinue(numberEliminated);
  })

  function eliminateExistentialContinue(numberEliminated) {
    let replacements = {};
    let currFormula = justificationFormula;
    for (let i = 0; i < numberEliminated;
        i++) {
      replacements[currFormula.variableString]
          = new Constant(`sk${pithosData.proof.signature.skolemNext}`);
      newSkolemConstants.add(`sk${pithosData.proof.signature.skolemNext}`);
      pithosData.proof.signature.skolemNext++;
      currFormula = currFormula.predicate;
    }
    initialFormula = replaceVariables(currFormula, replacements);
    if (targetLine instanceof EmptyProofLine) {
      /* Target line is an empty line - allow user to specify resulting formula */
      let requestText = "Please enter the formula that you would like to "
          + "introduce using existential elimination rule:";
      requestFormulaInput(requestText, "eliminateExistentialComplete");
    } else {
      /* Target line is a goal line - choose target formula automatically */
      let targetFormula = targetLine.formula;
      let initialLine = new JustifiedProofLine(initialFormula,
          new SpecialJustification(justTypes.ASS));
      let goalLine = new JustifiedProofLine(targetFormula,
          new SpecialJustification(justTypes.GOAL));
      let proofBox = new ProofBox(initialLine, goalLine, false,
          newSkolemConstants);
      targetLine.prepend(proofBox);
      let ruleJustificationLines = [initialLine, goalLine];
      targetLine.justification
          = new Justification(justTypes.EXIS_ELIM, ruleJustificationLines);
      completeProofUpdate();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateExistentialComplete");
  $("#dynamicModalArea").on("click", "#eliminateExistentialComplete",
      function() {
    let skolemConstants = getSkolemConstants(targetLine);
    let targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
    let initialLine = new JustifiedProofLine(initialFormula,
        new SpecialJustification(justTypes.ASS));
    let goalLine = new JustifiedProofLine(targetFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false,
        newSkolemConstants);
    let newEmptyLine = new EmptyProofLine();
    targetLine.append(newEmptyLine);
    newEmptyLine.prepend(proofBox);
    let ruleJustificationLines = [initialLine, goalLine];
    let justification
        = new Justification(justTypes.EXIS_ELIM, ruleJustificationLines);
    let newJustifiedLine = new JustifiedProofLine(targetFormula, justification);
    newEmptyLine.prepend(newJustifiedLine);
    completeProofUpdate();
  });
}

/*
 * Function handling universal introduction
 */
function introduceUniversal() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Declared variables for use by following code */
  let targetFormula;
  let newSkolemConstants = new Set([]);
  let universalCount;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting
       formula */
    let requestText = "Please enter the formula that you would like to "
        + "introduce using universal introduction rule:";
    requestFormulaInput(requestText, "introduceUniversalContinue");
  } else {
    targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.UNIVERSAL) {
      throw new ProofProcessingError("The selected target formula is "
          + "not a universal.");
    }
    introduceUniversalContinue();
  }

  /*
   * Catch user action to proceed with the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceUniversalContinue");
  $("#dynamicModalArea").on("click", "#introduceUniversalContinue",
      function() {
    let skolemConstants = getSkolemConstants(targetLine);
    targetFormula = parseFormula($("#additionalFormulaInput")[0].value,
        pithosData.proof.signature, skolemConstants);
    if (targetFormula.type !== formulaTypes.UNIVERSAL) {
      let error = new ProofProcessingError("The entered formula is not a "
          + "universal.");
      handleProofProcessingError(error);
      return;
    }
    introduceUniversalContinue();
  })

  function introduceUniversalContinue() {
    /* Ask the user how many outer universal quantifiers should be introduced */
    let modalBody =
         "<p>Please choose the number of outer quantifiers that should be "
         + "introduced by this rule application in the formula"
         + `${targetFormula.stringRep}:</p>`;
    universalCount = 0;
    for (let currFormula = targetFormula;
        currFormula.type === formulaTypes.UNIVERSAL;
        currFormula = currFormula.predicate) {
      modalBody +=
          `<div class="custom-control custom-radio">
             <input type="radio" id="universalRadio${universalCount}" class="custom-control-input">
             <label class="custom-control-label" for="universalRadio${universalCount}">${universalCount + 1}</label>
           </div>`
      universalCount++;
    }
    if (universalCount === 1) {
      introduceUniversalComplete(universalCount);
    } else {
      showModal("Input required", modalBody, undefined,
          "introduceUniversalComplete");
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceUniversalComplete");
  $("#dynamicModalArea").on("click", "#introduceUniversalComplete",
      function() {
    let numberIntroduced = 0;
    for (let i = 0; i < universalCount; i++) {
      if ($("#universalRadio" + i).is(":checked")) {
        numberIntroduced = i + 1;
        break;
      }
    }
    if (numberIntroduced === 0) {
      numberIntroduced = universalCount;
    }
    introduceUniversalComplete(numberIntroduced);
  });

  function introduceUniversalComplete(numberIntroduced) {
    let replacements = {};
    let currFormula = targetFormula;
    for (let i = 0; i < numberIntroduced;
        i++) {
      replacements[currFormula.variableString]
          = new Constant(`sk${pithosData.proof.signature.skolemNext}`);
      newSkolemConstants.add(`sk${pithosData.proof.signature.skolemNext}`);
      pithosData.proof.signature.skolemNext++;
      currFormula = currFormula.predicate;
    }
    let constList = [];
    newSkolemConstants.forEach(sk => constList.push(sk));
    let goalFormula = replaceVariables(currFormula, replacements);
    let initialLine = new JustifiedProofLine(new ConstantsList(constList),
        new SpecialJustification(justTypes.ALLI_CONST));
    let goalLine = new JustifiedProofLine(goalFormula,
        new SpecialJustification(justTypes.GOAL));
    let proofBox = new ProofBox(initialLine, goalLine, false,
        newSkolemConstants);
    if (targetLine instanceof EmptyProofLine) {
      /* Target line is an empty line - add new justified line */
      let newEmptyLine = new EmptyProofLine();
      targetLine.append(newEmptyLine);
      newEmptyLine.prepend(proofBox);
      let ruleJustificationLines = [initialLine, goalLine];
      let justification
          = new Justification(justTypes.UNIV_INTRO, ruleJustificationLines);
      let newJustifiedLine = new JustifiedProofLine(targetFormula,
          justification);
      newEmptyLine.prepend(newJustifiedLine);
    } else {
      /* Target line is a goal line - justify existing line */
      targetLine.prepend(proofBox);
      let ruleJustificationLines = [initialLine, goalLine];
      targetLine.justification
          = new Justification(justTypes.UNIV_INTRO, ruleJustificationLines);
    }
    completeProofUpdate();
  }
}

/*
 * Function handling universal elimination
 */
function eliminateUniversal() {
  let retrievedLines
      = retrieveLines(pithosData.proof, pithosData.selectedLinesSet);
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.UNIVERSAL) {
    throw new ProofProcessingError("The selected justification formula is "
        + "not a universal.");
  }
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Count the number of universal quantifiers in the justification formula
     and prepare modal allowing the user to choose the number of quantifiers
     to eliminate. */
  let modalBody = "<p>Please choose the number of outer quantifiers that "
       + "should be eliminated from the formula "
       + `${justificationFormula.stringRep}:</p>`;
  let universalCount = 0;
  for (let currFormula = justificationFormula;
      currFormula.type === formulaTypes.UNIVERSAL;
      currFormula = currFormula.predicate) {
    modalBody +=
        `<div class="custom-control custom-radio">
           <input type="radio" id="universalRadio${universalCount}" class="custom-control-input">
           <label class="custom-control-label" for="universalRadio${universalCount}">${universalCount + 1}</label>
         </div>`
    universalCount++;
  }
  /* Declared variables for use by following code */
  let numberEliminated;
  if (targetLine instanceof EmptyProofLine) {
    /* Target is an empty line - determine the number of outer qualifiers to
       eliminate. */
    if (universalCount === 1) {
      numberEliminated = 1;
      eliminateUniversalContinue(universalCount);
    } else {
      showModal("Input required", modalBody, undefined,
          "eliminateUniversalContinue");
    }
  } else {
    /* Target line is a goal line - automatically determine the target formula
       and check the rule application. */
    let targetFormula = targetLine.formula;
    if (!verifyUniversalElimination(justificationFormula, targetFormula)) {
      throw new ProofProcessingError("The selected target formula cannot be "
          + "derived from the selected justification formula using universal "
          + "elimination. Please check that only variables have been replaced "
          + "by terms and that same variables have not been replaced by "
          + "different terms.")
    }
    targetLine.justification
        = new Justification(justTypes.UNIV_ELIM, justificationLines);
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to proceed with the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateUniversalContinue");
  $("#dynamicModalArea").on("click", "#eliminateUniversalContinue",
      function() {
    numberEliminated = 0;
    for (let i = 0; i < universalCount; i++) {
      if ($("#universalRadio" + i).is(":checked")) {
        numberEliminated = i + 1;
        break;
      }
    }
    if (numberEliminated === 0) {
      numberEliminated = universalCount;
    }
    eliminateUniversalContinue(numberEliminated);
  });

  function eliminateUniversalContinue(numberEliminated) {
    /* Determine the terms that the quantified variables should be replaced
       for */
    let modalBody = "<p>Please enter the terms that should replace the "
         + "universally quantified variables in the formula "
         + `${justificationFormula.stringRep}:</p>`;
    let currFormula = justificationFormula;
    for (let i = 0; i < numberEliminated; i++) {
      modalBody +=
          `<label for="additionalTermInput${i}">Variable ${currFormula.variableString}</label>
           <input id="additionalTermInput${i}" class="additional-term-input form-control mb-2" type="text" placeholder="Please type your term here." value="" autocomplete="off">
           <div id="additionalTermParsed${i}" class="alert alert-dark" role="alert" style="word-wrap: break-word; ">
             The result of the parsing will appear here.
           </div>`
      currFormula = currFormula.predicate;
    }
    showModal("Input required", modalBody, undefined,
        "eliminateUniversalComplete", undefined, true);
  }

  /*
   * Catch user action to complete rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateUniversalComplete");
  $("#dynamicModalArea").on("click", "#eliminateUniversalComplete",
      function() {
    let replacements = {};
    let currFormula = justificationFormula;
    let skolemConstants = getSkolemConstants(pithosData.targetLine);
    for (let i = 0; i < numberEliminated; i++) {
      let variable = currFormula.variableString;
      let term = parseSeparateTerm($("#additionalTermInput" + i)[0].value,
          pithosData.proof.signature, skolemConstants);
      replacements[variable] = term;
      currFormula = currFormula.predicate;
    }
    let newFormula = replaceVariables(currFormula, replacements);
    let justification
        = new Justification(justTypes.UNIV_ELIM, justificationLines);
    let newLine = new JustifiedProofLine(newFormula, justification);
    targetLine.prepend(newLine);
    completeProofUpdate();
  });

  /*
   * Function checking universal elimination application
   */
  function verifyUniversalElimination(justificationFormula, targetFormula) {
    /* Determine the difference in the number of existential quantifiers */
    let justificationUniversalCount = 0;
    let currFormula = justificationFormula;
    while (currFormula.type === formulaTypes.UNIVERSAL) {
      justificationUniversalCount++;
      currFormula = currFormula.predicate;
    }
    let targetUniversalCount = 0;
    currFormula = targetFormula;
    while (currFormula.type === formulaTypes.UNIVERSAL) {
      targetUniversalCount++;
      currFormula = currFormula.predicate;
    }
    if (targetUniversalCount >= justificationUniversalCount) {
      /* Fail verification if there are no additional existential quantifiers
         in the justification formula */
      return false;
    }
    /* Attempt to match formulas to verify rule application */
    let eliminatedUniversalCount
        = justificationUniversalCount - targetUniversalCount;
    let universalVariablesSet = new Set([]);
    currFormula = justificationFormula;
    for (let i = 0; i < eliminatedUniversalCount; i++) {
      universalVariablesSet.add(currFormula.variableString);
      currFormula = currFormula.predicate;
    }
    return matchFormulasVariablesReplace(targetFormula, currFormula,
        universalVariablesSet, {});
  }
}

/*
 * Checks whether the the inputted formulas can be matched for the purposes
   of existential introduction and universal elimination (i.e. only terms
   have been replaced by variables or vice versa)
 * variablesSet contains textual representation of variables that are
   quantified and could be replaced by constants or vice versa
 * replacements dictionary stores pairs of variable names and corresponding
   terms
 */
function matchFormulasVariablesReplace(termsFormula, variablesFormula,
    variablesSet, replacements) {
  if (termsFormula.type !== variablesFormula.type
      && !(termsFormula instanceof Term && variablesFormula instanceof Term)) {
    return false;
  }
  if (termsFormula instanceof Term) {
    if (formulasDeepEqual(termsFormula, variablesFormula)) {
      /* Terms are identical - report match success */
      return true;
    }
    if (termsFormula.type === termTypes.VARIABLE) {
      /* termsFormula contains variable different from term in
         variablesFormula and hence the formulas do not match */
      return false;
    }
    if (termsFormula.type === termTypes.CONSTANT) {
      if (variablesFormula.type !== termTypes.VARIABLE
          || !variablesSet.has(variablesFormula.name)) {
        /* Constant does not correspond to a variable - formulas do not
           match */
        return false;
      }
      /* Constant corresponds with a variable - check whether the
         the replacement is consistent */
      if (!replacements.hasOwnProperty(variablesFormula.name)) {
        /* No previous replacement associated with the given variable
           has been logged - record the first */
        replacements[variablesFormula.name] = termsFormula;
        return true;
      }
      /* Replacement associated with the given variable has been logged -
         check whether the constants match */
      if (replacements[variablesFormula.name].type === termTypes.CONSTANT
          && formulasDeepEqual(replacements[variablesFormula.name],
              termsFormula)) {
        /* Successful match */
        return true;
      }
      /* Terms do not match - report failure */
      return false;
    }
    if (termsFormula.type === termTypes.FUNCTION) {
      if (variablesFormula.type === termTypes.CONSTANT) {
        /* Constant in variablesFormula formula cannot be matched to a
           function in the termsFormula formula */
        return false;
      }
      if (variablesFormula.type === termTypes.FUNCTION) {
        /* Check deep match - possible replacement must have
           occured inside function */
        if (termsFormula.name !== variablesFormula.name) {
          /* The names of functions do not match */
          return false;
        }
        return _.zipWith(termsFormula.terms, variablesFormula.terms,
            (t1, t2) => matchFormulasVariablesReplace(t1, t2,
                variablesSet, replacements))
            .reduce((b1, b2) => b1 && b2, true);
      }
      if (variablesFormula.type === termTypes.VARIABLE) {
        /* Function associated with a variable - check whether the replacement
           is valid */
        if (!variablesSet.has(variablesFormula.name)) {
          /* The encountered variable is not quantified - report failure */
          return false;
        }
        if (!replacements.hasOwnProperty(variablesFormula.name)) {
          /* No previous replacement associated with the given variable
             has been encountered - log the first */
          replacements[variablesFormula.name] = termsFormula;
          return true;
        }
        /* Replacement associated with a given variable has already occurred
           - check whether the corresponding functions match */
        if (replacements[variablesFormula.name].type === termTypes.FUNCTION
            && formulasDeepEqual(replacements[variablesFormula.name],
                termsFormula)) {
          /* Successful match */
          return true;
        }
        /* Terms do not match - report failure */
        return false;
      }
    }
  } else if (termsFormula instanceof Quantifier) {
    if (termsFormula.variableString !== variablesFormula.variableString) {
      return false;
    }
    if (variablesSet.has(termsFormula.variableString)) {
      /* Cannot match replacements associated with a variable that is
         already quantified at "deeper" level in the terms sub-formula */
      variablesSet.delete(termsFormula.variableString);
    }
    return matchFormulasVariablesReplace(termsFormula.predicate,
        variablesFormula.predicate, variablesSet, replacements);
  } else if (termsFormula.type === formulaTypes.RELATION) {
    if (termsFormula.name !== variablesFormula.name) {
      return false;
    }
    return _.zipWith(termsFormula.terms, variablesFormula.terms,
        (t1, t2) => matchFormulasVariablesReplace(t1, t2,
            variablesSet, replacements))
        .reduce((b1, b2) => b1 && b2, true);
  } else if (termsFormula instanceof Equality) {
    return matchFormulasVariablesReplace(termsFormula.term1,
            variablesFormula.term1, variablesSet, replacements)
        && matchFormulasVariablesReplace(termsFormula.term2,
            variablesFormula.term2, variablesSet, replacements);
  } else if (termsFormula.type === formulaTypes.NEGATION) {
    return matchFormulasVariablesReplace(termsFormula.operand,
        variablesFormula.operand, variablesSet, replacements);
  } else if (termsFormula instanceof BinaryConnective) {
    if (termsFormula.isAssociative) {
      let operandstermsFormula = [];
      extractOperands(termsFormula, operandstermsFormula,
          termsFormula.type);
      let operandsvariablesFormula = [];
      extractOperands(variablesFormula, operandsvariablesFormula,
          termsFormula.type);
      return _.zipWith(operandstermsFormula, operandsvariablesFormula,
          (f1, f2) => matchFormulasVariablesReplace(f1, f2, variablesSet,
              replacements))
          .reduce((b1, b2) => b1 && b2, true);
    } else {
      return matchFormulasVariablesReplace(termsFormula.operand1,
              variablesFormula.operand1, variablesSet, replacements)
          && matchFormulasVariablesReplace(termsFormula.operand2,
              variablesFormula.operand2, variablesSet, replacements);
    }
  } else {
    return formulasDeepEqual(termsFormula, variablesFormula);
  }
}