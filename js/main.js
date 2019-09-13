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
        parseAll();
      }
    }
  });

  /*
   * Start proof
   */
  $("#startProof").click(function() {
    let parsingResults = parseAll();
    if (parsingResults !== null) {
      /* Reset all data */
      PithosData.selectedLinesSet = new Set([]);
      PithosData.lineNumToSelector = {};
      PithosData.selectedRuleData = null;
      PithosData.selectedButton = null;
      PithosData.freeSelection = true;
      $(".apply-rule").removeClass("btn-primary").addClass("btn-secondary");
      /* Initialize proof */
      PithosData.proof = initializeProof(parsingResults);
      updateLines(PithosData.proof);
      $("#proofContainer").html(proofToHTML(PithosData.proof));
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
    if (PithosData.selectedLinesSet.has(lineNumber)) {
      /* Deselect line */
      PithosData.selectedLinesSet.delete(lineNumber);
      delete PithosData.lineNumToSelector[lineNumber];
      targetSelector.removeClass("text-primary");
    } else {
      /* Select line */
      PithosData.selectedLinesSet.add(lineNumber);
      PithosData.lineNumToSelector[lineNumber] = targetSelector;
      targetSelector.addClass("text-primary");
    }
    if (!PithosData.freeSelection && PithosData.selectedLinesSet.size
        === PithosData.selectedRuleData.numLines) {
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
      PithosData.freeSelection = true;
      $(target).removeClass("btn-primary").addClass("btn-secondary");
      return;
    }
    if (PithosData.selectedButton !== null) {
      /* Deactivate possible previous rule selection */
      $(PithosData.selectedButton)
          .removeClass("btn-primary")
          .addClass("btn-secondary");
    }
    /* Attempt to activate rule and save the information globally */
    $(target).removeClass("btn-secondary").addClass("btn-primary");
    let ruleData = rulesData[target.innerText];
    PithosData.freeSelection = false;
    PithosData.selectedRuleData = ruleData;
    PithosData.selectedButton = target;
    if (PithosData.selectedLinesSet.size === ruleData.numLines) {
      updateProof();
    } else if (PithosData.selectedLinesSet.size > ruleData.numLines) {
      showModal("Error", "You have selected too many lines for the "
          + `application of the rule ${target.innerText}. Please deselect `
          + "some of the lines or cancel the application of the current rule. "
          + "Expected number of selected lines for this rule is "
          +  `${ruleData.numLines}.`,
          ruleData.hint);
    } else if (PithosData.selectedLinesSet.size !== 0) {
      showModal("Warning", "You have selected too few lines for the "
          + `application of the rule ${target.innerText}. Expected number `
          + `of selected lines for this rule is ${ruleData.numLines}. `
          + "Please select additional lines or cancel the application of the "
          + "current rule.",
          ruleData.hint);
    }
  });
});
