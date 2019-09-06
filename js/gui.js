"use strict"

jQuery(function($) {

  let globalNumGivens = 0;

  /*
   * Add new field for a given
   */
  $("#addGiven").click(function() {
    /* Disable the Start proof button */
    $("#startProof").attr("disabled", true);

    if (globalNumGivens === 0) {
      /* Add first given - hide no givens message and enable remove button */
      $("#noGiven").hide();
      $("#removeGiven").attr("disabled", false);
    }

    /* Insert form for new given */
    const givenCode =
      `<div id="given${globalNumGivens}" class="form-group given-group">
        <label for="givenInput${globalNumGivens}">#${globalNumGivens + 1}</label>
        <input id="givenInput${globalNumGivens}" class="given-input form-control mb-2" type="text" placeholder="Please type your formula here." value="" autocomplete="off">
        <div id="givenParsed${globalNumGivens}" class="given-parsed alert alert-dark" role="alert" style="word-wrap: break-word; ">
          The result of the parsing will appear here.
        </div>
      </div>`
    $(givenCode).insertBefore("#addGiven");
    globalNumGivens++;
  });

  /*
   * Remove the most recently added field for a given
   */
  $("#removeGiven").click(function() {
    if (globalNumGivens === 0) {
      return;
    }
    $("#given" + (globalNumGivens - 1)).remove();
    globalNumGivens--;
    if (globalNumGivens === 0) {
      $("#noGiven").show();
      $("#removeGiven").attr("disabled", true);
    }
  })

  /*
   * Parse all formulas and report the results of the parsing
   */
  $("#inputArea").on("input", ".given-input, #goalInput", function(inputEvent) {
    let signature = {
      constants: [],
      relationArities: {},
      functionArities: {}
    };
    let errors = false;

    /* Parse all givens */
    for (let i = 0; i <= globalNumGivens; i++) {
      /* Backup signature in case of error in parsing */
      let signatureCopy = $.extend(true, {}, signature);
      let parsedFormula;
      let inputElement;
      let outputElement;
      if (i < globalNumGivens) {
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
    } else {
      $("#startProof").attr("disabled", false);
    }
    console.log(signature);
  });
});
