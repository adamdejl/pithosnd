"use strict";

jQuery(function($) {

  /* Set up global object for status variables */
  let PithosData = {
    numGivens: 0,
    selectedLinesSet: new Set([])
  }

  /* Disable invalid buttons on reload */
  $("#removeGiven").attr("disabled", true);
  $("#startProof").attr("disabled", true);

  /*
   * Parse all formulas and report the results of the parsing
   * Returns true on success, false on failure
   */
  function parseAll() {
    let signature = {
      constants: [],
      relationArities: {},
      functionArities: {}
    };
    let errors = false;
    let parsingResults = {
      signature: signature,
      formulas: []
    }

    /* Parse all givens */
    for (let i = 0; i <= PithosData.numGivens; i++) {
      /* Backup signature in case of error in parsing */
      let signatureCopy = $.extend(true, {}, signature);
      let parsedFormula;
      let inputElement;
      let outputElement;
      if (i < PithosData.numGivens) {
        /* Process given formula */
        inputElement = $("#givenInput" + i);
        outputElement = $("#givenParsed" + i);
      } else {
        /* Process goal formula */
        inputElement = $("#goalInput");
        outputElement = $("#goalParsed");
      }
      try {
        parsedFormula = parseFormula(inputElement[0].value, signature);
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
   * Add new field for a given
   */
  $("#addGiven").click(function() {
    /* Disable the Start proof button */
    $("#startProof").attr("disabled", true);

    if (PithosData.numGivens === 0) {
      /* Add first given - hide no givens message and enable remove button */
      $("#noGiven").hide();
      $("#removeGiven").attr("disabled", false);
    }

    /* Insert form for new given */
    const givenCode =
        `<div id="given${PithosData.numGivens}" class="form-group given-group">
           <label for="givenInput${PithosData.numGivens}">#${PithosData.numGivens + 1}</label>
           <input id="givenInput${PithosData.numGivens}" class="given-input form-control mb-2" type="text" placeholder="Please type your formula here." value="" autocomplete="off">
           <div id="givenParsed${PithosData.numGivens}" class="given-parsed alert alert-dark" role="alert" style="word-wrap: break-word; ">
             The result of the parsing will appear here.
           </div>
         </div>`
    $(givenCode).insertBefore("#addGiven");
    PithosData.numGivens++;
  });

  /*
   * Remove the most recently added field for a given
   */
  $("#removeGiven").click(function() {
    if (PithosData.numGivens === 0) {
      return;
    }
    $("#given" + (PithosData.numGivens - 1)).remove();
    PithosData.numGivens--;
    if (PithosData.numGivens === 0) {
      $("#noGiven").show();
      $("#removeGiven").attr("disabled", true);
    }
    parseAll();
  })

  /*
   * Parse all formulas on input
   */
  $("#inputArea").on("input", ".given-input, #goalInput", parseAll);

  /*
   * Insert special character and parse all formulas
   */
  $(".insert-char-btn").on('mousedown', function(mouseDownEvent) {
    mouseDownEvent.preventDefault();
    let focusElement = $(":focus");
    if (focusElement.hasClass("given-input")
        || focusElement.hasClass("goal-input")) {
      /* Insert character at the correct place */
      let cursorPosition = focusElement.prop('selectionStart');
      let value = focusElement[0].value;
      let textBeforeCursor = value.substring(0, cursorPosition);
      let textAfterCursor = value.substring(cursorPosition, value.length);
      focusElement[0].value = textBeforeCursor
          + mouseDownEvent.target.innerText + textAfterCursor;

      /* Set cursor correctly */
      focusElement[0].selectionEnd = cursorPosition + 1;

      /* Trigger parsing of all formulas */
      parseAll();
    }
  });

  /*
   * Start proof
   */
  $("#startProof").click(function() {
    let parsingResults = parseAll();
    if (parsingResults !== null) {
      let proof = initializeProof(parsingResults);
      updateLines(proof);
      console.log(proof);
      let proofHTML = proofToHTML(proof);
      $("#proofContainer").html(proofHTML);
      $("#inputArea").hide();
      $("#proofArea").show();
    }
  });

  /*
   * Restart proof
   */
  $("#confirmRestart").click(function() {
    $("#proofArea").hide();
    $("#inputArea").show();
  })

  /*
   * Select or deselect a proof line
   */
  $("#proofContainer").on("click", ".proof-line", function(clickEvent) {
    let target = clickEvent.target;
    while (target.tagName != "TR") {
      target = target.parentElement;
    }
    let targetSelector = $(target);
    let lineNumberElement = targetSelector.find("th")[0];
    let lineNumber = Number(lineNumberElement.innerText);
    if (PithosData.selectedLinesSet.has(lineNumber)) {
      PithosData.selectedLinesSet.delete(lineNumber);
      targetSelector.removeClass("text-primary");
    } else {
      PithosData.selectedLinesSet.add(lineNumber);
      targetSelector.addClass("text-primary");
    }
  });
});
