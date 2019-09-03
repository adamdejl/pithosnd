"use strict"

jQuery(function($) {

  let signature = {
    constants: [],
    relationArities: {},
    functionArities: {}
  }

  $("#formulaInput").on("input", function(inputEvent) {
    let parsedFormula;
    try {
      parsedFormula = parseFormula(inputEvent.target.value, signature);
      console.log(parsedFormula)
    } catch (error) {
      if (error instanceof FormulaParsingError) {
        $("#parsedOutput").text(error.message);
        return;
      } else {
        throw error;
      }
    }
    $("#parsedOutput").text(parsedFormula.stringRep);
  });
});
