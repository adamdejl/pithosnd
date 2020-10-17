"use strict";

/*
 * Function handling existential introduction
 */
function introduceExistential() {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let requestText =
      "Please enter the formula that you would like to " +
      "derive using existential introduction rule from " +
      `${justificationFormula.stringRep}:`;
    requestFormulaInput(requestText, "introduceExistentialComplete");
  } else {
    /* Target line is a goal line - choose the goal formula automatically */
    let targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.EXISTENTIAL) {
      throw new ProofProcessingError(
        "The selected formula is not an " + "existential."
      );
    }
    if (
      !matchFormulasQuantifiers(
        targetFormula,
        justificationFormula,
        formulaTypes.EXISTENTIAL
      )
    ) {
      throw new ProofProcessingError(
        "The selected target formula cannot be " +
          "derived from the selected justification formula using existential " +
          "introduction. Please check that only closed terms have been " +
          "replaced by quantified variables and that terms replaced by " +
          "the same variable are identical."
      );
    }
    targetLine.justification = new Justification(
      justTypes.EXIS_INTRO,
      justificationLines
    );
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#introduceExistentialComplete");
  $("#dynamicModalArea").on(
    "click",
    "#introduceExistentialComplete",
    function () {
      let skolemConstants = getSkolemConstants(targetLine);
      let targetFormula = parseFormula(
        $("#additionalFormulaInput")[0].value,
        pithosData.proof.signature,
        skolemConstants
      );
      if (targetFormula.type !== formulaTypes.EXISTENTIAL) {
        let error = new ProofProcessingError(
          "The entered formula is not an " + "existential."
        );
        handleProofProcessingError(error);
        return;
      }
      if (
        !matchFormulasQuantifiers(
          targetFormula,
          justificationFormula,
          formulaTypes.EXISTENTIAL
        )
      ) {
        let error = new ProofProcessingError(
          "The selected target formula cannot " +
            "be derived from the selected justification formula using " +
            "existential introduction. Please check that only closed terms " +
            "have been replaced by quantified variables and that terms " +
            "replaced by the same variable are identical."
        );
        handleProofProcessingError(error);
        return;
      }
      let justification = new Justification(
        justTypes.EXIS_INTRO,
        justificationLines
      );
      let newLine = new JustifiedProofLine(targetFormula, justification);
      targetLine.prepend(newLine);
      completeProofUpdate();
    }
  );
}

/*
 * Function handling existential elimination
 */
function eliminateExistential() {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.EXISTENTIAL) {
    throw new ProofProcessingError(
      "The selected justification formula is " + "not an existential."
    );
  }
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Ask the user how many outer exists quantifiers should be eliminated */
  let modalBody =
    "<p>Please choose the number of outer quantifiers that should be " +
    `eliminated from the formula ${justificationFormula.stringRep}:</p>`;
  let existentialCount = 0;
  for (
    let currFormula = justificationFormula;
    currFormula.type === formulaTypes.EXISTENTIAL;
    currFormula = currFormula.predicate
  ) {
    modalBody += `<div class="custom-control custom-radio">
           <input type="radio" id="existentialRadio${existentialCount}" class="custom-control-input">
           <label class="custom-control-label" for="existentialRadio${existentialCount}">${
      existentialCount + 1
    }</label>
         </div>`;
    existentialCount++;
  }
  /* Declared for use by following code */
  let initialFormula;
  let newSkolemConstants = new Set([]);
  if (existentialCount === 1) {
    eliminateExistentialContinue(existentialCount);
  } else {
    showModal(
      "Input required",
      modalBody,
      undefined,
      "eliminateExistentialContinue"
    );
  }

  /*
   * Catch user action to proceed with the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateExistentialContinue");
  $("#dynamicModalArea").on(
    "click",
    "#eliminateExistentialContinue",
    function () {
      /* Determine the chosen number of quantifirs to eliminate */
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
    }
  );

  function eliminateExistentialContinue(numberEliminated) {
    /* Determine which variables should be replaced by the Skolem constants */
    let replacements = {};
    let currFormula = justificationFormula;
    for (let i = 0; i < numberEliminated; i++) {
      replacements[currFormula.variableString] = new Constant(
        `sk${pithosData.proof.signature.skolemNext}`
      );
      newSkolemConstants.add(`sk${pithosData.proof.signature.skolemNext}`);
      pithosData.proof.signature.skolemNext++;
      currFormula = currFormula.predicate;
    }
    /* Perform the replacement */
    initialFormula = replaceVariables(currFormula, replacements);
    if (targetLine instanceof EmptyProofLine) {
      /* Target line is an empty line - allow user to specify resulting
         formula */
      let requestText =
        "Please enter the formula that you would like to " +
        "introduce using existential elimination rule:";
      requestFormulaInput(requestText, "eliminateExistentialComplete");
    } else {
      /* Target line is a goal line - choose target formula automatically */
      let targetFormula = targetLine.formula;
      let initialLine = new JustifiedProofLine(
        initialFormula,
        new SpecialJustification(justTypes.ASS)
      );
      let goalLine = new JustifiedProofLine(
        targetFormula,
        new SpecialJustification(justTypes.GOAL)
      );
      let proofBox = new ProofBox(
        initialLine,
        goalLine,
        false,
        newSkolemConstants
      );
      targetLine.prepend(proofBox);
      let ruleJustificationLines = [
        justificationLines[0],
        initialLine,
        goalLine,
      ];
      targetLine.justification = new Justification(
        justTypes.EXIS_ELIM,
        ruleJustificationLines
      );
      completeProofUpdate();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateExistentialComplete");
  $("#dynamicModalArea").on(
    "click",
    "#eliminateExistentialComplete",
    function () {
      /* Complete rule application setting up user-provided formula as a new
       goal inside of the box for existential elimination */
      let skolemConstants = getSkolemConstants(targetLine);
      let targetFormula = parseFormula(
        $("#additionalFormulaInput")[0].value,
        pithosData.proof.signature,
        skolemConstants
      );
      let initialLine = new JustifiedProofLine(
        initialFormula,
        new SpecialJustification(justTypes.ASS)
      );
      let goalLine = new JustifiedProofLine(
        targetFormula,
        new SpecialJustification(justTypes.GOAL)
      );
      let proofBox = new ProofBox(
        initialLine,
        goalLine,
        false,
        newSkolemConstants
      );
      let newEmptyLine = new EmptyProofLine();
      targetLine.append(newEmptyLine);
      newEmptyLine.prepend(proofBox);
      let ruleJustificationLines = [
        justificationLines[0],
        initialLine,
        goalLine,
      ];
      let justification = new Justification(
        justTypes.EXIS_ELIM,
        ruleJustificationLines
      );
      let newJustifiedLine = new JustifiedProofLine(
        targetFormula,
        justification
      );
      newEmptyLine.prepend(newJustifiedLine);
      completeProofUpdate();
    }
  );
}

/*
 * Function handling universal introduction
 */
function introduceUniversal() {
  /* Handled by unified function for universal introduction and
     universal implication introduction */
  addUniversal(false);
}

/*
 * Function handling universal elimination
 */
function eliminateUniversal() {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.UNIVERSAL) {
    throw new ProofProcessingError(
      "The selected justification formula is " + "not a universal."
    );
  }
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Count the number of universal quantifiers in the justification formula
     and prepare modal allowing the user to choose the number of quantifiers
     to eliminate. */
  let modalBody =
    "<p>Please choose the number of outer quantifiers that " +
    "should be eliminated from the formula " +
    `${justificationFormula.stringRep}:</p>`;
  let universalCount = 0;
  for (
    let currFormula = justificationFormula;
    currFormula.type === formulaTypes.UNIVERSAL;
    currFormula = currFormula.predicate
  ) {
    modalBody += `<div class="custom-control custom-radio">
           <input type="radio" id="universalRadio${universalCount}" class="custom-control-input">
           <label class="custom-control-label" for="universalRadio${universalCount}">${
      universalCount + 1
    }</label>
         </div>`;
    universalCount++;
  }
  /* Declared variables for use by following code */
  let numberEliminated;
  if (targetLine instanceof EmptyProofLine) {
    /* Target is an empty line - determine the number of outer quantifiers to
       eliminate. */
    if (universalCount === 1) {
      /* Only one quuantifier to eliminate */
      numberEliminated = 1;
      eliminateUniversalContinue(universalCount);
    } else {
      showModal(
        "Input required",
        modalBody,
        undefined,
        "eliminateUniversalContinue"
      );
    }
  } else {
    /* Target line is a goal line - automatically determine the target formula
       and check the rule application. */
    let targetFormula = targetLine.formula;
    if (
      !matchFormulasQuantifiers(
        justificationFormula,
        targetFormula,
        formulaTypes.UNIVERSAL
      )
    ) {
      throw new ProofProcessingError(
        "The selected target formula cannot be " +
          "derived from the selected justification formula using universal " +
          "elimination. Please check that only variables have been replaced " +
          "by terms and that same variables have not been replaced by " +
          "different terms."
      );
    }
    targetLine.justification = new Justification(
      justTypes.UNIV_ELIM,
      justificationLines
    );
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to proceed with the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateUniversalContinue");
  $("#dynamicModalArea").on(
    "click",
    "#eliminateUniversalContinue",
    function () {
      /* Determine the user-provided number of quantifiers to eliminate */
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
    }
  );

  function eliminateUniversalContinue(numberEliminated) {
    /* Determine the terms that the quantified variables should be replaced
       for */
    let modalBody =
      "<p>Please enter the terms that should replace the " +
      "universally quantified variables in the formula " +
      `${justificationFormula.stringRep}:</p>`;
    let currFormula = justificationFormula;
    for (let i = 0; i < numberEliminated; i++) {
      modalBody += `<label for="additionalTermInput${i}">Variable ${currFormula.variableString}</label>
           <input id="additionalTermInput${i}" class="additional-term-input form-control mb-2" type="text" placeholder="Please type your term here." value="" autocomplete="off">
           <div id="additionalTermParsed${i}" class="alert alert-dark" role="alert" style="word-wrap: break-word; ">
             The result of the parsing will appear here.
           </div>`;
      currFormula = currFormula.predicate;
    }
    showModal(
      "Input required",
      modalBody,
      undefined,
      "eliminateUniversalComplete",
      undefined,
      true
    );
  }

  /*
   * Catch user action to complete rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateUniversalComplete");
  $("#dynamicModalArea").on(
    "click",
    "#eliminateUniversalComplete",
    function () {
      /* Complete rule application using the user-provided terms for each
       eliminated quantified variable */
      let replacements = {};
      let currFormula = justificationFormula;
      let skolemConstants = getSkolemConstants(pithosData.targetLine);
      for (let i = 0; i < numberEliminated; i++) {
        let variable = currFormula.variableString;
        let term = parseSeparateTerm(
          $("#additionalTermInput" + i)[0].value,
          pithosData.proof.signature,
          skolemConstants
        );
        replacements[variable] = term;
        currFormula = currFormula.predicate;
      }
      let newFormula = replaceVariables(currFormula, replacements);
      let justification = new Justification(
        justTypes.UNIV_ELIM,
        justificationLines
      );
      let newLine = new JustifiedProofLine(newFormula, justification);
      targetLine.prepend(newLine);
      completeProofUpdate();
    }
  );
}

/*
 * Function handling universal implication introduction
 */
function introduceUniversalImplication() {
  /* Handled by unified function for universal introduction and
     universal implication introduction */
  addUniversal(true);
}

/*
 * Function handling universal implication elimination
 */
function eliminateUniversalImplication() {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let justificationLines = retrievedLines.justificationLines;
  /* Determine which formula serves as an antecedent and which as universal
     implication */
  let justFormula1 = justificationLines[0].formula;
  let justFormula2 = justificationLines[1].formula;
  let unpacked1 = unpackUniversal(justFormula1);
  let unpacked2 = unpackUniversal(justFormula2);
  let innerFormula1 = unpacked1.innerFormula;
  let innerFormula2 = unpacked2.innerFormula;
  let varSet1 = unpacked1.variablesSet;
  let varSet2 = unpacked2.variablesSet;
  let universalFormula;
  let unpackedUniversal;
  let antecedentFormula;
  let replacements;
  let replacements1 = {};
  let replacements2 = {};
  if (
    unpacked2.isUniversalImplication &&
    matchFormulasVariablesReplace(
      justFormula1,
      innerFormula2.operand1,
      varSet2,
      replacements1
    )
  ) {
    /* Matched first formula to the antecedent of the second formula */
    universalFormula = justFormula2;
    unpackedUniversal = unpacked2;
    antecedentFormula = justFormula1;
    replacements = replacements1;
  } else if (
    unpacked1.isUniversalImplication &&
    matchFormulasVariablesReplace(
      justFormula2,
      innerFormula1.operand1,
      varSet1,
      replacements2
    )
  ) {
    /* Matched second formula to the antecedent of the first formula */
    universalFormula = justFormula1;
    unpackedUniversal = unpacked1;
    antecedentFormula = justFormula2;
    replacements = replacements2;
  } else {
    throw new ProofProcessingError(
      "The selected lines cannot be used as " +
        "a justification to universal implication elimination."
    );
  }
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Declare variable for use by following code */
  let underivableVarsSet = new Set([]);
  if (targetLine instanceof EmptyProofLine) {
    /* Target is an empty line - determine which variable replacements cannot
       be automatically derived */
    unpackedUniversal.variablesSet.forEach(function (variable) {
      if (!replacements.hasOwnProperty(variable)) {
        underivableVarsSet.add(variable);
      }
    });
    if (underivableVarsSet.size === 0) {
      /* Terms for all variables can be automatically derived */
      let newFormula = replaceVariables(
        unpackedUniversal.innerFormula.operand2,
        replacements
      );
      let justification = new Justification(
        justTypes.UNIV_IMP_ELIM,
        justificationLines
      );
      let newLine = new JustifiedProofLine(newFormula, justification);
      targetLine.prepend(newLine);
    } else {
      /* User needs to choose replacement terms for some of the variables */
      let modalBody =
        "<p>Some of the terms that should replace the " +
        "universally quantified variables could not be automatically " +
        "derived. Please enter the terms that should replace the " +
        "following variables in the formula " +
        `${unpackedUniversal.innerFormula.operand2.stringRep}:</p>`;
      let i = 0;
      underivableVarsSet.forEach(function (variable) {
        modalBody += `<label for="additionalTermInput${i}">Variable ${variable}</label>
             <input id="additionalTermInput${i}" class="additional-term-input form-control mb-2" type="text" placeholder="Please type your term here." value="" autocomplete="off">
             <div id="additionalTermParsed${i}" class="alert alert-dark" role="alert" style="word-wrap: break-word; ">
               The result of the parsing will appear here.
             </div>`;
        i++;
      });
      showModal(
        "Input required",
        modalBody,
        undefined,
        "eliminateUniversalImplicationComplete",
        undefined,
        true
      );
    }
  } else {
    /* Target is a goal line - check application and justify the goal line
       on success */
    let targetFormula = targetLine.formula;
    if (
      !matchFormulasVariablesReplace(
        targetFormula,
        unpackedUniversal.innerFormula.operand2,
        unpackedUniversal.variablesSet,
        replacements
      )
    ) {
      throw new ProofProcessingError(
        "The selected goal line cannot be derived " +
          "from the selected justification lines using universal implication " +
          "elimination."
      );
    }
    targetLine.justification = new Justification(
      justTypes.UNIV_IMP_ELIM,
      justificationLines
    );
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#eliminateUniversalImplicationComplete");
  $("#dynamicModalArea").on(
    "click",
    "#eliminateUniversalImplicationComplete",
    function () {
      /* Retrieve chosen replacement for each of the variables and eliminate
       the new formula */
      let additionalReplacements = {};
      let skolemConstants = getSkolemConstants(pithosData.targetLine);
      let i = 0;
      underivableVarsSet.forEach(function (variable) {
        let term = parseSeparateTerm(
          $("#additionalTermInput" + i)[0].value,
          pithosData.proof.signature,
          skolemConstants
        );
        additionalReplacements[variable] = term;
        i++;
      });
      let tmpFormula = replaceVariables(
        unpackedUniversal.innerFormula.operand2,
        replacements
      );
      let newFormula = replaceVariables(tmpFormula, additionalReplacements);
      let justification = new Justification(
        justTypes.UNIV_IMP_ELIM,
        justificationLines
      );
      let newLine = new JustifiedProofLine(newFormula, justification);
      targetLine.prepend(newLine);
      completeProofUpdate();
    }
  );

  /*
   * Performs analysis of the given formula and returns data necessary for
     further processing if the formula is a universal
   */
  function unpackUniversal(formula) {
    let formulaData = {
      isUniversalImplication: false,
      universalCount: 0,
      variablesSet: new Set([]),
      innerFormula: null,
    };
    if (formula.type !== formulaTypes.UNIVERSAL) {
      return formulaData;
    }
    let currFormula;
    for (
      currFormula = formula;
      currFormula.type === formulaTypes.UNIVERSAL;
      currFormula = currFormula.predicate
    ) {
      formulaData.variablesSet.add(currFormula.variableString);
      formulaData.universalCount++;
    }
    formulaData.innerFormula = currFormula;
    if (currFormula.type === formulaTypes.IMPLICATION) {
      formulaData.isUniversalImplication = true;
    }
    return formulaData;
  }
}

/*
 * Function handling equality substitution
 */
function applyEqualitySubstitution() {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let justificationLines = retrievedLines.justificationLines;
  let possibleReplacements = [];
  let justFormula1 = justificationLines[0].formula;
  let justFormula2 = justificationLines[1].formula;
  /* Determine possible equality substitutions */
  if (justFormula1.type === formulaTypes.EQUALITY) {
    if (
      formulaContainsTerm(justFormula2, justFormula1.term1) &&
      !formulasDeepEqual(justFormula1.term1, justFormula1.term2)
    ) {
      possibleReplacements.push({
        formula: justFormula2,
        replaced: justFormula1.term1,
        replacement: justFormula1.term2,
      });
    }
    if (
      formulaContainsTerm(justFormula2, justFormula1.term2) &&
      !formulasDeepEqual(justFormula1.term2, justFormula1.term1)
    ) {
      possibleReplacements.push({
        formula: justFormula2,
        replaced: justFormula1.term2,
        replacement: justFormula1.term1,
      });
    }
  }
  if (justFormula2.type === formulaTypes.EQUALITY) {
    if (
      formulaContainsTerm(justFormula1, justFormula2.term1) &&
      !formulasDeepEqual(justFormula2.term1, justFormula2.term2)
    ) {
      possibleReplacements.push({
        formula: justFormula1,
        replaced: justFormula2.term1,
        replacement: justFormula2.term2,
      });
    }
    if (
      formulaContainsTerm(justFormula1, justFormula2.term2) &&
      !formulasDeepEqual(justFormula2.term2, justFormula2.term1)
    ) {
      possibleReplacements.push({
        formula: justFormula1,
        replaced: justFormula2.term2,
        replacement: justFormula2.term1,
      });
    }
  }
  /* No possible replacements have been identified */
  if (possibleReplacements.length === 0) {
    throw new ProofProcessingError(
      "The selected justification formulas cannot " +
        "be used for application of the equality substitution rule. " +
        "Please check that at least one of the selected formulas is an " +
        "equality and that at least one of the terms in the equality " +
        "appears in the second selected formula."
    );
  }
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - prompt user for the intended
       substitution */
    let modalText =
      "Please enter the formula that you would like to introduce using " +
      "equality substitution or choose one of the automatic replacements.";
    let additionalContent = "";
    for (let i = 0; i < possibleReplacements.length; i++) {
      additionalContent += `<button id="replacement${i}" type="button" class="btn btn-outline-primary btn-block" data-dismiss="modal">Replace ${possibleReplacements[i].replaced.stringRep} for ${possibleReplacements[i].replacement.stringRep} in ${possibleReplacements[i].formula.stringRep}</button>`;
    }
    let button = `<button id="substituteEqualityFormula" type="button" class="disable-parse-error btn btn-outline-primary" data-dismiss="modal" disabled>Use entered formula</button>`;
    requestFormulaInput(modalText, undefined, button, additionalContent);
  } else {
    /* Target line is a goal line - automatically determine the target formula
       and check the rule application. */
    let targetFormula = targetLine.formula;
    let anyReplacementValid = possibleReplacements
      .map((r) => matchFormulasTermsReplace(targetFormula, r.formula, r))
      .reduce((b1, b2) => b1 || b2, false);
    if (!anyReplacementValid) {
      throw new ProofProcessingError(
        "The selected target formula cannot be " +
          "derived from the selected justification formulas using equality " +
          "substitution. Please check that only one term has been substituted " +
          "in accordance with the selected equality formula."
      );
    }
    targetLine.justification = new Justification(
      justTypes.EQ_SUB,
      justificationLines
    );
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete rule application
   */
  for (let i = 0; i < possibleReplacements.length; i++) {
    $("#dynamicModalArea").off("click", "#replacement" + i);
    $("#dynamicModalArea").on("click", "#replacement" + i, function () {
      equalitySubstitutionComplete(true, i);
    });
  }
  $("#dynamicModalArea").off("click", "#substituteEqualityFormula");
  $("#dynamicModalArea").on("click", "#substituteEqualityFormula", function () {
    equalitySubstitutionComplete(false);
  });

  function equalitySubstitutionComplete(automatic, replacementIndex) {
    let newFormula;
    if (automatic) {
      /* Perform chosen automatic replacement (replace all occurences of
         a variable) */
      let replacement = possibleReplacements[replacementIndex];
      newFormula = replaceTerm(
        replacement.formula,
        replacement.replaced,
        replacement.replacement
      );
    } else {
      /* Perform chosen custom replacement and check the validity of
         the rule application */
      let skolemConstants = getSkolemConstants(pithosData.targetLine);
      newFormula = parseFormula(
        $("#additionalFormulaInput")[0].value,
        pithosData.proof.signature,
        skolemConstants
      );
      let anyReplacementValid = possibleReplacements
        .map((r) => matchFormulasTermsReplace(newFormula, r.formula, r))
        .reduce((b1, b2) => b1 || b2, false);
      if (!anyReplacementValid) {
        let error = new ProofProcessingError(
          "The entered formula cannot be " +
            "derived from the selected justification formulas using equality " +
            "substitution. Please check that only one term has been " +
            "substituted in accordance with the selected equality formula."
        );
        handleProofProcessingError(error);
        return;
      }
    }
    let justification = new Justification(justTypes.EQ_SUB, justificationLines);
    let newLine = new JustifiedProofLine(newFormula, justification);
    targetLine.prepend(newLine);
    completeProofUpdate();
  }
}

/*
 * Function handling equality reflexivity application
 */
function applyEqualityReflexivity() {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting formula */
    let modalBody =
      "<p>Please enter tha term that you would like to apply  " +
      "equality reflexivity to:</p>";
    modalBody += `<input id="additionalTermInput0" class="additional-term-input form-control mb-2" type="text" placeholder="Please type your term here." value="" autocomplete="off">
        <div id="additionalTermParsed0" class="alert alert-dark" role="alert" style="word-wrap: break-word; ">
          The result of the parsing will appear here.
        </div>`;
    showModal(
      "Input required",
      modalBody,
      undefined,
      "applyEqualityReflexivityComplete",
      undefined,
      true
    );
  } else {
    /* Target line is a goal line - verify rule application and justify
       goal on success */
    let targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.EQUALITY) {
      throw new ProofProcessingError(
        "The selected target formula is not an " + "equality."
      );
    }
    if (!formulasDeepEqual(targetFormula.term1, targetFormula.term2)) {
      throw new ProofProcessingError(
        "The selected formula cannot be derived " + "using reflexivity."
      );
    }
    targetLine.justification = new SpecialJustification(justTypes.EQ_REFL);
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#applyEqualityReflexivityComplete");
  $("#dynamicModalArea").on(
    "click",
    "#applyEqualityReflexivityComplete",
    function () {
      /* Add equality with the inputted term on both sides */
      let skolemConstants = getSkolemConstants(pithosData.targetLine);
      let term = parseSeparateTerm(
        $("#additionalTermInput0")[0].value,
        pithosData.proof.signature,
        skolemConstants
      );
      let newFormula = new Equality(term, term);
      let justification = new SpecialJustification(justTypes.EQ_REFL);
      let newLine = new JustifiedProofLine(newFormula, justification);
      targetLine.prepend(newLine);
      completeProofUpdate();
    }
  );
}

/*
 * Function handling equality symmetry application
 */
function applyEqualitySymmetry() {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let justificationLines = retrievedLines.justificationLines;
  let justificationFormula = justificationLines[0].formula;
  if (justificationFormula.type !== formulaTypes.EQUALITY) {
    throw new ProofProcessingError(
      "The selected justification formula is not " + "an equality."
    );
  }
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Determine the formula that shoudl be introduced by this rule application */
  let newFormula = new Equality(
    justificationFormula.term2,
    justificationFormula.term1
  );
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - add newly introduced formula to the
       proof */
    let justification = new Justification(justTypes.EQ_SYM, justificationLines);
    let newLine = new JustifiedProofLine(newFormula, justification);
    targetLine.prepend(newLine);
  } else {
    /* Target is a goal line - verify corectness of the rule application and
       justify goal formula on success */
    let targetFormula = targetLine.formula;
    if (!formulasDeepEqual(targetFormula, newFormula)) {
      throw new ProofProcessingError(
        "The selected target formula cannot be " +
          "derived from the selected justification formula using equality " +
          "symmetry rule."
      );
    }
    targetLine.justification = new Justification(
      justTypes.EQ_SYM,
      justificationLines
    );
    if (targetLine.prev instanceof EmptyProofLine) {
      targetLine.prev.delete();
    }
  }
}

/*
 * Function handling universal introduction and universal implication
   introduction rules
 */
function addUniversal(isImplication) {
  /* Unpack selected lines */
  let retrievedLines = retrieveLines(
    pithosData.proof,
    pithosData.selectedLinesSet
  );
  let targetLine = retrievedLines.targetLine;
  pithosData.targetLine = targetLine;
  /* Declared variables for use by following code */
  let targetFormula;
  let newSkolemConstants = new Set([]);
  let universalCount;
  if (targetLine instanceof EmptyProofLine) {
    /* Target line is an empty line - allow user to specify resulting
       formula */
    let requestText =
      "Please enter the formula that you would like to " +
      `introduce using universal ${isImplication ? "implication " : ""}` +
      "introduction rule:";
    requestFormulaInput(requestText, "addUniversalContinue");
  } else {
    targetFormula = targetLine.formula;
    if (targetFormula.type !== formulaTypes.UNIVERSAL) {
      throw new ProofProcessingError(
        "The selected target formula is " + "not a universal."
      );
    }
    addUniversalContinue();
  }

  /*
   * Catch user action to proceed with the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#addUniversalContinue");
  $("#dynamicModalArea").on("click", "#addUniversalContinue", function () {
    /* Parse the user-entered formula that should be introduced by
       universal (implication) introduction rule */
    let skolemConstants = getSkolemConstants(targetLine);
    targetFormula = parseFormula(
      $("#additionalFormulaInput")[0].value,
      pithosData.proof.signature,
      skolemConstants
    );
    if (targetFormula.type !== formulaTypes.UNIVERSAL) {
      let error = new ProofProcessingError(
        "The entered formula is not a " + "universal."
      );
      handleProofProcessingError(error);
      return;
    }
    addUniversalContinue();
  });

  function addUniversalContinue() {
    /* Prepare possibly useful modal body while counting the number of universal
       quantifiers */
    let modalBody =
      "<p>Please choose the number of outer quantifiers that should be " +
      "introduced by this rule application in the formula" +
      `${targetFormula.stringRep}:</p>`;
    universalCount = 0;
    let currFormula;
    for (
      currFormula = targetFormula;
      currFormula.type === formulaTypes.UNIVERSAL;
      currFormula = currFormula.predicate
    ) {
      modalBody += `<div class="custom-control custom-radio">
             <input type="radio" id="universalRadio${universalCount}" class="custom-control-input">
             <label class="custom-control-label" for="universalRadio${universalCount}">${
        universalCount + 1
      }</label>
           </div>`;
      universalCount++;
    }
    if (isImplication || universalCount === 1) {
      /* Automatically introduce all outer universal quantifiers */
      if (isImplication && currFormula.type !== formulaTypes.IMPLICATION) {
        let error = new ProofProcessingError(
          "The introduced formula does " +
            "not contain an implication at the outermost level after " +
            "universal quantifiers."
        );
        handleProofProcessingError(error);
        return;
      }
      addUniversalComplete(universalCount);
    } else {
      /* Ask the user how many outer universal quantifiers should be
         introduced */
      showModal("Input required", modalBody, undefined, "addUniversalComplete");
    }
  }

  /*
   * Catch user action to complete the rule application
   */
  /* Unbind possible previously bound events */
  $("#dynamicModalArea").off("click", "#addUniversalComplete");
  $("#dynamicModalArea").on("click", "#addUniversalComplete", function () {
    /* Determine the selected number of introduced quantifiers */
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
    addUniversalComplete(numberIntroduced);
  });

  function addUniversalComplete(numberIntroduced) {
    /* Replace variables corresponding to the introduced quantifiers
       for the skolem constants */
    let replacements = {};
    let currFormula = targetFormula;
    for (let i = 0; i < numberIntroduced; i++) {
      replacements[currFormula.variableString] = new Constant(
        `sk${pithosData.proof.signature.skolemNext}`
      );
      newSkolemConstants.add(`sk${pithosData.proof.signature.skolemNext}`);
      pithosData.proof.signature.skolemNext++;
      currFormula = currFormula.predicate;
    }
    /* Prepare the list of universal (implication) introduction constants */
    let constList = [];
    newSkolemConstants.forEach((sk) => constList.push(sk));
    /* Create proof box for universal (implication) introduction */
    let initialLine = new JustifiedProofLine(
      new ConstantsList(constList),
      new SpecialJustification(justTypes.ALLI_CONST)
    );
    let proofBox;
    let goalLine;
    let assumptionLine;
    let ruleJustificationLines;
    let justificationType;
    if (isImplication) {
      /* Performing universal implication introduction - add assumption in
         form of antecedent and only prove consequent */
      let antecedent = currFormula.operand1;
      let consequent = currFormula.operand2;
      let assumptionFormula = replaceVariables(antecedent, replacements);
      let goalFormula = replaceVariables(consequent, replacements);
      goalLine = new JustifiedProofLine(
        goalFormula,
        new SpecialJustification(justTypes.GOAL)
      );
      proofBox = new ProofBox(initialLine, goalLine, false, newSkolemConstants);
      assumptionLine = new JustifiedProofLine(
        assumptionFormula,
        new SpecialJustification(justTypes.ASS)
      );
      initialLine.append(assumptionLine);
      ruleJustificationLines = [initialLine, assumptionLine, goalLine];
      justificationType = justTypes.UNIV_IMP_INTRO;
    } else {
      /* Performning universal introduction - the only starting line
         is the Skolem constants line */
      let goalFormula = replaceVariables(currFormula, replacements);
      goalLine = new JustifiedProofLine(
        goalFormula,
        new SpecialJustification(justTypes.GOAL)
      );
      proofBox = new ProofBox(initialLine, goalLine, false, newSkolemConstants);
      ruleJustificationLines = [initialLine, goalLine];
      justificationType = justTypes.UNIV_INTRO;
    }
    if (targetLine instanceof EmptyProofLine) {
      /* Target line is an empty line - add new justified line */
      let newEmptyLine = new EmptyProofLine();
      targetLine.append(newEmptyLine);
      newEmptyLine.prepend(proofBox);
      let justification = new Justification(
        justificationType,
        ruleJustificationLines
      );
      let newJustifiedLine = new JustifiedProofLine(
        targetFormula,
        justification
      );
      newEmptyLine.prepend(newJustifiedLine);
    } else {
      /* Target line is a goal line - justify existing line */
      targetLine.prepend(proofBox);
      targetLine.justification = new Justification(
        justificationType,
        ruleJustificationLines
      );
    }
    completeProofUpdate();
  }
}

/*
 * Function checking whether a quantified formula matches a formula with
   fewer quantifiers for the purposes of existential introduction and
   universal elimination rules
 */
function matchFormulasQuantifiers(
  quantifierFormula,
  otherFormula,
  quantifierFormulaType
) {
  /* Determine the difference in the number of outer quantifiers */
  let quantifierFormulaQuantifierCount = 0;
  let currFormula = quantifierFormula;
  while (currFormula.type === quantifierFormulaType) {
    quantifierFormulaQuantifierCount++;
    currFormula = currFormula.predicate;
  }
  let otherFormulaQuantifierCount = 0;
  currFormula = otherFormula;
  while (currFormula.type === quantifierFormulaType) {
    otherFormulaQuantifierCount++;
    currFormula = currFormula.predicate;
  }
  if (quantifierFormulaQuantifierCount <= otherFormulaQuantifierCount) {
    /* Fail verification if there are no additional quantifiers in the other
       formula */
    return false;
  }
  /* Attempt to match formulas to verify rule application */
  let quantifierCountDifference =
    quantifierFormulaQuantifierCount - otherFormulaQuantifierCount;
  let quantifiedVariablesSet = new Set([]);
  currFormula = quantifierFormula;
  for (let i = 0; i < quantifierCountDifference; i++) {
    quantifiedVariablesSet.add(currFormula.variableString);
    currFormula = currFormula.predicate;
  }
  return matchFormulasVariablesReplace(
    otherFormula,
    currFormula,
    quantifiedVariablesSet,
    {}
  );
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
function matchFormulasVariablesReplace(
  termsFormula,
  variablesFormula,
  variablesSet,
  replacements
) {
  if (
    termsFormula.type !== variablesFormula.type &&
    !(termsFormula instanceof Term && variablesFormula instanceof Term)
  ) {
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
      if (
        variablesFormula.type !== termTypes.VARIABLE ||
        !variablesSet.has(variablesFormula.name)
      ) {
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
      if (
        replacements[variablesFormula.name].type === termTypes.CONSTANT &&
        formulasDeepEqual(replacements[variablesFormula.name], termsFormula)
      ) {
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
        return _.zipWith(termsFormula.terms, variablesFormula.terms, (t1, t2) =>
          matchFormulasVariablesReplace(t1, t2, variablesSet, replacements)
        ).reduce((b1, b2) => b1 && b2, true);
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
        if (
          replacements[variablesFormula.name].type === termTypes.FUNCTION &&
          formulasDeepEqual(replacements[variablesFormula.name], termsFormula)
        ) {
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
    return matchFormulasVariablesReplace(
      termsFormula.predicate,
      variablesFormula.predicate,
      variablesSet,
      replacements
    );
  } else if (termsFormula.type === formulaTypes.RELATION) {
    if (termsFormula.name !== variablesFormula.name) {
      return false;
    }
    return _.zipWith(termsFormula.terms, variablesFormula.terms, (t1, t2) =>
      matchFormulasVariablesReplace(t1, t2, variablesSet, replacements)
    ).reduce((b1, b2) => b1 && b2, true);
  } else if (termsFormula instanceof Equality) {
    return (
      matchFormulasVariablesReplace(
        termsFormula.term1,
        variablesFormula.term1,
        variablesSet,
        replacements
      ) &&
      matchFormulasVariablesReplace(
        termsFormula.term2,
        variablesFormula.term2,
        variablesSet,
        replacements
      )
    );
  } else if (termsFormula.type === formulaTypes.NEGATION) {
    return matchFormulasVariablesReplace(
      termsFormula.operand,
      variablesFormula.operand,
      variablesSet,
      replacements
    );
  } else if (termsFormula instanceof BinaryConnective) {
    if (termsFormula.isAssociative) {
      let operandsTermsFormula = [];
      extractOperands(termsFormula, operandsTermsFormula, termsFormula.type);
      let operandsVariablesFormula = [];
      extractOperands(
        variablesFormula,
        operandsVariablesFormula,
        termsFormula.type
      );
      return _.zipWith(
        operandsTermsFormula,
        operandsVariablesFormula,
        (f1, f2) =>
          matchFormulasVariablesReplace(f1, f2, variablesSet, replacements)
      ).reduce((b1, b2) => b1 && b2, true);
    } else {
      return (
        matchFormulasVariablesReplace(
          termsFormula.operand1,
          variablesFormula.operand1,
          variablesSet,
          replacements
        ) &&
        matchFormulasVariablesReplace(
          termsFormula.operand2,
          variablesFormula.operand2,
          variablesSet,
          replacements
        )
      );
    }
  } else {
    return formulasDeepEqual(termsFormula, variablesFormula);
  }
}

/*
 * Checks whether the target formula can be derived by equality substitution
   using the given replacement
 */
function matchFormulasTermsReplace(
  targetFormula,
  justificationFormula,
  replacementObject
) {
  let replaced = replacementObject.replaced;
  let replacement = replacementObject.replacement;
  if (
    targetFormula.type !== justificationFormula.type &&
    !(targetFormula instanceof Term && justificationFormula instanceof Term)
  ) {
    /* Formulas types do not match and at least one of the formulas is not
       a term */
    return false;
  }
  if (targetFormula instanceof Term) {
    if (formulasDeepEqual(targetFormula, justificationFormula)) {
      /* Terms are identical - report match success */
      return true;
    }
    if (
      formulasDeepEqual(replaced, justificationFormula) &&
      formulasDeepEqual(replacement, targetFormula)
    ) {
      /* Terms correspond to a replacement - report success */
      return true;
    }
    if (
      targetFormula.type === termTypes.FUNCTION &&
      justificationFormula.type === termTypes.FUNCTION
    ) {
      if (targetFormula.name !== justificationFormula.name) {
        return false;
      }
      return _.zipWith(
        targetFormula.terms,
        justificationFormula.terms,
        (t1, t2) => matchFormulasTermsReplace(t1, t2, replacementObject)
      ).reduce((b1, b2) => b1 && b2, true);
    }
  } else if (targetFormula instanceof Quantifier) {
    if (targetFormula.variableString !== justificationFormula.variableString) {
      return false;
    }
    return matchFormulasTermsReplace(
      targetFormula.predicate,
      justificationFormula.predicate,
      replacementObject
    );
  } else if (targetFormula.type === formulaTypes.RELATION) {
    if (targetFormula.name !== justificationFormula.name) {
      return false;
    }
    return _.zipWith(
      targetFormula.terms,
      justificationFormula.terms,
      (t1, t2) => matchFormulasTermsReplace(t1, t2, replacementObject)
    ).reduce((b1, b2) => b1 && b2, true);
  } else if (targetFormula instanceof Equality) {
    return (
      matchFormulasTermsReplace(
        targetFormula.term1,
        justificationFormula.term1,
        replacementObject
      ) &&
      matchFormulasTermsReplace(
        targetFormula.term2,
        justificationFormula.term2,
        replacementObject
      )
    );
  } else if (targetFormula.type === formulaTypes.NEGATION) {
    return matchFormulasTermsReplace(
      targetFormula.operand,
      justificationFormula.operand,
      replacementObject
    );
  } else if (targetFormula instanceof BinaryConnective) {
    if (targetFormula.isAssociative) {
      let operandsTargetFormula = [];
      extractOperands(targetFormula, operandsTargetFormula, targetFormula.type);
      let operandsJustificationFormula = [];
      extractOperands(
        justificationFormula,
        operandsJustificationFormula,
        targetFormula.type
      );
      return _.zipWith(
        operandsTargetFormula,
        operandsJustificationFormula,
        (f1, f2) => matchFormulasTermsReplace(f1, f2, replacementObject)
      ).reduce((b1, b2) => b1 && b2, true);
    } else {
      return (
        matchFormulasTermsReplace(
          targetFormula.operand1,
          justificationFormula.operand1,
          replacementObject
        ) &&
        matchFormulasTermsReplace(
          targetFormula.operand2,
          justificationFormula.operand2,
          replacementObject
        )
      );
    }
  } else {
    return formulasDeepEqual(targetFormula, justificationFormula);
  }
}
