"use strict"

jQuery(function($) {

  let signature = {
    constants: [],
    relationArities: {},
    functionArities: {}
  };

  $("#formulaGivenInput1").on("input", function(inputEvent) {
    let parsedFormula;
    try {
      parsedFormula = parseFormula(inputEvent.target.value, signature);
      console.log(parsedFormula)
    } catch (error) {
      if (error instanceof FormulaParsingError) {
        $("#formulaGivenParsed1").text(error.message);
        $("#formulaGivenParsed1").removeClass("alert-dark alert-success").addClass("alert-danger");
        return;
      } else {
        throw error;
      }
    }
    $("#formulaGivenParsed1").text(parsedFormula.stringRep);
    $("#formulaGivenParsed1").removeClass("alert-dark alert-danger").addClass("alert-success");
  });
});
