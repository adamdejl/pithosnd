"use strict";

jQuery(function($) {

  /* Disable invalid buttons on reload */
  $("#removeGiven").attr("disabled", true);
  $("#startProof").attr("disabled", true);

  /*
   * Add new field for a given
   */
  $("#addGiven").click(function() {
    /* Disable the Start proof button */
    $("#startProof").attr("disabled", true);

    if (pithosData.numGivens === 0) {
      /* Add first given - hide no givens message and enable remove button */
      $("#noGiven").hide();
      $("#removeGiven").attr("disabled", false);
    }

    /* Insert form for new given */
    const givenCode =
        `<div id="given${pithosData.numGivens}" class="form-group given-group">
           <label for="givenInput${pithosData.numGivens}">#${pithosData.numGivens + 1}</label>
           <input id="givenInput${pithosData.numGivens}" class="given-input form-control mb-2" type="text" placeholder="Please type your formula here." value="" autocomplete="off">
           <div id="givenParsed${pithosData.numGivens}" class="given-parsed alert alert-dark" role="alert" style="word-wrap: break-word; ">
             The result of the parsing will appear here.
           </div>
         </div>`
    $(givenCode).insertBefore("#addGiven");
    pithosData.numGivens++;
  });

  /*
   * Remove the most recently added field for a given
   */
  $("#removeGiven").click(function() {
    if (pithosData.numGivens === 0) {
      return;
    }
    $("#given" + (pithosData.numGivens - 1)).remove();
    pithosData.numGivens--;
    if (pithosData.numGivens === 0) {
      $("#noGiven").show();
      $("#removeGiven").attr("disabled", true);
    }
    parseGivens();
  })

  /*
   * Parse all formulas on input
   */
  $("#inputArea").on("input", ".given-input, #goalInput", parseGivens);

  /*
   * Insert special character and parse all formulas after pressing
     toolbar button
   */
  $(document).on("mousedown", ".insert-char-btn", function(mouseDownEvent) {
    mouseDownEvent.preventDefault();
    let focusElement = $(":focus");
    if (focusElement.hasClass("given-input")
        || focusElement.hasClass("goal-input")
        || focusElement.hasClass("additional-formula-input")) {
      /* Insert character at the correct place */
      let cursorPosition = focusElement.prop('selectionStart');
      let value = focusElement[0].value;
      let textBeforeCursor = value.substring(0, cursorPosition);
      let textAfterCursor = value.substring(cursorPosition, value.length);
      focusElement[0].value = textBeforeCursor
          + mouseDownEvent.target.innerText + textAfterCursor;

      /* Set cursor correctly */
      focusElement[0].selectionEnd = cursorPosition + 1;

      if (focusElement.hasClass("additional-formula-input")) {
        parseAdditionalFormula();
      } else {
        /* Trigger parsing of all formulas */
        parseGivens();
      }
    }
  });

  /*
   * Start proof
   */
  $("#startProof").click(function() {
    let parsingResults = parseGivens();
    if (parsingResults !== null) {
      /* Reset all data */
      pithosData.selectedLinesSet = new Set([]);
      pithosData.lineNumToSelector = {};
      pithosData.selectedRuleData = null;
      pithosData.selectedButton = null;
      pithosData.freeSelection = true;
      $(".apply-rule").removeClass("btn-primary").addClass("btn-secondary");
      /* Initialize proof */
      pithosData.proof = initializeProof(parsingResults);
      updateLines(pithosData.proof);
      $("#proofContainer").html(proofToHTML(pithosData.proof));
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
    /* Locate the whole line element */
    while (target.tagName != "TR") {
      target = target.parentElement;
    }
    let targetSelector = $(target);
    /* Extract line number */
    let lineNumberElement = targetSelector.find("th")[0];
    let lineNumber = Number(lineNumberElement.innerText);
    if (pithosData.selectedLinesSet.has(lineNumber)) {
      /* Deselect line */
      pithosData.selectedLinesSet.delete(lineNumber);
      delete pithosData.lineNumToSelector[lineNumber];
      targetSelector.removeClass("text-primary");
    } else {
      /* Select line */
      pithosData.selectedLinesSet.add(lineNumber);
      pithosData.lineNumToSelector[lineNumber] = targetSelector;
      targetSelector.addClass("text-primary");
    }
    if (!pithosData.freeSelection && pithosData.selectedLinesSet.size
        === pithosData.selectedRuleData.numLines) {
      /* Update proof if certain rule is activated and the required number of
         proof lines has been selected */
      updateProof();
    }
  });

  /*
   * Select or deselect a line on enter keypress
   */
  $("#proofContainer").on("keypress", ".proof-line", function(keypressEvent) {
    const enterKey = 13;
    if (keypressEvent.which === enterKey) {
      $(keypressEvent.target).click();
    }
  });

  /*
   * Attempt to apply activated rule.
   */
  $(".apply-rule").click(function(clickEvent) {
    let target = clickEvent.target;
    if ($(target).hasClass("btn-primary")) {
      /* Deactivate selection of the rule */
      pithosData.freeSelection = true;
      $(target).removeClass("btn-primary").addClass("btn-secondary");
      return;
    }
    if (pithosData.selectedButton !== null) {
      /* Deactivate possible previous rule selection */
      $(pithosData.selectedButton)
          .removeClass("btn-primary")
          .addClass("btn-secondary");
    }
    /* Attempt to activate rule and save the information globally */
    $(target).removeClass("btn-secondary").addClass("btn-primary");
    let ruleData = rulesData[target.innerText];
    pithosData.freeSelection = false;
    pithosData.selectedRuleData = ruleData;
    pithosData.selectedButton = target;
    if (pithosData.selectedLinesSet.size === ruleData.numLines) {
      updateProof();
    } else if (pithosData.selectedLinesSet.size > ruleData.numLines) {
      showModal("Error", "You have selected too many lines for the "
          + `application of the rule ${target.innerText}. Please deselect `
          + "some of the lines or cancel the application of the current rule. "
          + "Expected number of selected lines for this rule is "
          +  `${ruleData.numLines}.`,
          ruleData.hint);
    } else if (pithosData.selectedLinesSet.size !== 0) {
      showModal("Warning", "You have selected too few lines for the "
          + `application of the rule ${target.innerText}. Expected number `
          + `of selected lines for this rule is ${ruleData.numLines}. `
          + "Please select additional lines or cancel the application of the "
          + "current rule.",
          ruleData.hint);
    }
  });

  /*
   * Parse additional formulas inputted in modals
   */
  $("#dynamicModalArea").on("input", "#additionalFormulaInput",
      parseAdditionalFormula);
  $("#dynamicModalArea").on("input", ".additional-term-input",
      parseAdditionalTerm);
});
