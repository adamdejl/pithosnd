"use strict";

/* Set up global object for status variables */
let pithosData = {
  numGivens: 0,
  proof: null,
  selectedLinesSet: new Set([]),
  lineNumToSelector: {},
  selectedRuleData: null,
  selectedButton: null,
  freeSelection: true,
  targetLine: null,
  proofUndoStack: [],
  proofRedoStack: []
}

/*
 * Parse all formulas and report the results of the parsing
 * Returns true on success, false on failure
 */
function parseGivens() {
  let signature = {
    constants: new Set([]),
    skolemNext: 1,
    relationArities: {},
    functionArities: {}
  };
  let errors = false;
  let parsingResults = {
    signature: signature,
    formulas: []
  }

  /* Parse all givens */
  for (let i = 0; i <= pithosData.numGivens; i++) {
    /* Backup signature in case of error in parsing */
    let signatureCopy = _.cloneDeep(signature);
    let parsedFormula;
    let inputElement;
    let outputElement;
    if (i < pithosData.numGivens) {
      /* Process given formula */
      inputElement = $("#givenInput" + i);
      outputElement = $("#givenParsed" + i);
    } else {
      /* Process goal formula */
      inputElement = $("#goalInput");
      outputElement = $("#goalParsed");
    }
    try {
      parsedFormula
          = parseFormula(inputElement[0].value, signature, new Set([]));
      parsingResults.formulas.push(parsedFormula);
    } catch (error) {
      if (error instanceof FormulaParsingError) {
        /* Show result and log error */
        errors = true;
        outputElement.text(error.message);
        outputElement
            .removeClass("alert-dark alert-success")
            .addClass("alert-danger");
        /* Restore original signature */
        signature = signatureCopy;
        continue;
      } else {
        throw error;
      }
    }
    /* Show result */
    outputElement.text(parsedFormula.stringRep);
    outputElement
        .removeClass("alert-dark alert-danger")
        .addClass("alert-success");
  }

  /* Disable or enable Start proof button depending on errors */
  if (errors) {
    $("#startProof").attr("disabled", true);
    return null;
  }
  $("#startProof").attr("disabled", false);
  return parsingResults;
}

/*
 * Parses additional formula entered to the input field in a modal
 */
function parseAdditionalFormula() {
  /* Backup signature in case of error in parsing */
  let signatureCopy = _.cloneDeep(pithosData.proof.signature);
  let inputSelector = $("#additionalFormulaInput");
  let outputSelector = $("#additionalFormulaParsed");
  let skolemConstants = getSkolemConstants(pithosData.targetLine);
  let parsedFormula;
  try {
    parsedFormula = parseFormula(inputSelector[0].value, signatureCopy,
        skolemConstants);
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
 * Parses additional term entered to the input field in a modal
 */
function parseAdditionalTerm() {
  /* Backup signature in case of error in parsing */
  let signatureCopy = _.cloneDeep(pithosData.proof.signature);
  let errors = false;
  for (let i = 0; $("#additionalTermInput" + i).length === 1; i++) {
    let inputSelector = $("#additionalTermInput" + i);
    let outputSelector = $("#additionalTermParsed" + i);
    let skolemConstants = getSkolemConstants(pithosData.targetLine);
    let parsedTerm;
    try {
      parsedTerm = parseSeparateTerm(inputSelector[0].value, signatureCopy,
          skolemConstants);
    } catch (error) {
      if (error instanceof FormulaParsingError) {
        /* Show result and disable action buttons */
        $(".disable-parse-error").attr("disabled", true);
        outputSelector.text(error.message);
        outputSelector
            .removeClass("alert-dark alert-success")
            .addClass("alert-danger");
        errors = true;
        continue;
      } else {
        throw error;
      }
    }
    /* Show result on success */
    outputSelector.text(parsedTerm.stringRep);
    outputSelector
        .removeClass("alert-dark alert-danger")
        .addClass("alert-success");
  }
  /* Enable confirmation button on success */
  if (!errors) {
    $(".disable-parse-error").attr("disabled", false);
  }
}

/*
 * Shows modal alert
 */
function showModal(title, modalBody, hint, customId, customButtons,
    disableParseError) {
  $(".modal-backdrop").remove();
  let hintHTML = "";
  if (hint !== undefined) {
    hintHTML =
      `<hr>
       <h5>Hint</h5>
       ${hint}`;
  }
  let customIdHTML = "";
  if (customId !== undefined) {
    customIdHTML = ` id="${customId}"`;
  }
  let disableParse = "";
  let disableInitial = "";
  if (disableParseError === true) {
    disableParse = "disable-parse-error ";
    disableInitial = " disabled"
  }
  let defaultButton
      = `<button${customIdHTML} type="button" class="${disableParse}btn btn-outline-primary" data-dismiss="modal"${disableInitial}>OK</button>`;
  let buttons = defaultButton;
  if (customButtons !== undefined) {
    buttons = customButtons;
  }
  let template =
      `<div id="dynamicModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="dynamicModalLabel" aria-hidden="true">
  			 <div class="modal-dialog modal-dialog-centered" role="document">
  				 <div class="modal-content bg-light">
  					 <div class="modal-header">
  						 <h5 class="modal-title" id="dynamicModalLabel">${title}</h5>
  						 <button type="button" class="close" data-dismiss="modal" aria-label="Close">
  							 <span aria-hidden="true">&times;</span>
  						 </button>
  					 </div>
  					 <div class="modal-body">
  						 ${modalBody}${hintHTML}
  					 </div>
  					 <div class="modal-footer">
  						 ${buttons}
  					 </div>
  				 </div>
  			 </div>
  		 </div>`
  $("#dynamicModalArea").html(template);
  $("#dynamicModal").modal("show");
}

/*
 * Shows modal prompting user to enter additional formula required for
   one of the supported natural deduction ruless
 */
function requestFormulaInput(requestText, customId, buttons, additionalContent) {
  let additionalCode = "";
  if (additionalContent !== undefined) {
    additionalCode = additionalContent;
  }
  let modalBody =
      `<div class="py-2 text-center sticky-top bg-light">
         <div class="btn-group pb-1" role="group" aria-label="Insert logical connectives">
           <button type="button" class="btn btn-secondary insert-char-btn">¬</button>
           <button type="button" class="btn btn-secondary insert-char-btn">∧</button>
           <button type="button" class="btn btn-secondary insert-char-btn">∨</button>
           <button type="button" class="btn btn-secondary insert-char-btn">→</button>
           <button type="button" class="btn btn-secondary insert-char-btn">↔</button>
         </div>
         <div class="btn-group pb-1" role="group" aria-label="Insert quantifiers">
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
       </div>
       ${additionalCode}`
    showModal("Input required", modalBody, undefined, customId, buttons, true);
}

/*
 * Cancells selection of all lines
 */
function resetSelectedLines() {
  pithosData.selectedLinesSet
      .forEach(elem =>
          pithosData.lineNumToSelector[elem].removeClass("text-primary"));
  pithosData.selectedLinesSet = new Set([]);
}

/*
 * Applies previously specified rule to the proof, updates view and cleans up
   afterwards
 */
function updateProof() {
  pithosData.proofUndoStack.push(_.cloneDeep(pithosData.proof));
  $("#proofUndo").attr("disabled", false);
  let proofRedoStackCopy = pithosData.proofRedoStack.slice();
  pithosData.proofRedoStack = [];
  $("#proofRedo").attr("disabled", true);
  try {
    pithosData.selectedRuleData.handler();
  } catch (error) {
    if (error instanceof ProofProcessingError) {
      handleProofProcessingError(error);
      pithosData.proofUndoStack.pop();
      pithosData.proofRedoStack = proofRedoStackCopy;
      if (pithosData.proofRedoStack.length > 0) {
        $("#proofRedo").attr("disabled", false);
      }
      if (pithosData.proofUndoStack.length === 0) {
        $("#proofUndo").attr("disabled", true);
      }
    } else {
      throw error;
    }
  }
  updateLines(pithosData.proof);
  resetSelectedLines();
  $("#proofContainer").html(proofToHTML(pithosData.proof));
  pithosData.freeSelection = true;
  $(pithosData.selectedButton)
      .removeClass("btn-primary")
      .addClass("btn-secondary");
}

/*
 * Completes update of the proof in case of rules requiring additional input
 */
function completeProofUpdate() {
  updateLines(pithosData.proof);
  $("#proofContainer").html(proofToHTML(pithosData.proof));
}

/*
 * Shows informative error message on error
 */
function handleProofProcessingError(error) {
  showModal("Error", `<p>An error occured during application of the rule `
      + `${pithosData.selectedRuleData.name}:</p> <p>${error.message}</p>`,
      pithosData.selectedRuleData.hint);
}
