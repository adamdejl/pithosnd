"use strict";

/* "Enumeration" representing different types of terms */
const termTypes = Object.freeze({
  GENERIC: "generic",
  CONSTANT: "constant",
  VARIABLE: "variable",
  FUNCTION: "function",
  CONSTANTS_LIST: "constants list"
});

class Term {
  constructor() {
    this.type = termTypes.GENERIC;
  }

  get stringRep() {
    return "<Generic term>";
  }
}

class Constant extends Term {
  constructor(name) {
    super();
    this.type = termTypes.CONSTANT;
    this.name = name;
  }

  get stringRep() {
    return this.name;
  }
}

class Variable extends Term {
  constructor(name) {
    super();
    this.type = termTypes.VARIABLE;
    this.name = name;
  }

  get stringRep() {
    return this.name;
  }
}

class Function extends Term {
  constructor(name, terms) {
    super();
    this.type = termTypes.FUNCTION;
    this.name = name;
    this.terms = terms;
  }

  get stringRep() {
    var str = this.name + "(";
    /* Add string representations of the terms separated by commas */
    this.terms.forEach(term => str += term.stringRep +  ", ");
    /* Trim trailing comma and space, add closing bracket */
    str = str.substring(0, str.length - 2) + ")";
    return str;
  }
}

/*
 * Class representing constants list for (A)I const lines
 */
class ConstantsList extends Term {
  constructor(names) {
    super();
    this.type = termTypes.CONSTANTS_LIST;
    this.names = names;
  }

  get stringRep() {
    return this.names.join(", ");
  }
}

/* "Enumeration" representing different types of formulas */
const formulaTypes = Object.freeze({
  GENERIC: "generic",
  PROPOSITIONAL_VARIABLE: "propositional variable",
  RELATION: "relation",
  EQUALITY: "equality",
  TOP: "top",
  BOTTOM: "bottom",
  NEGATION: "negation",
  CONJUNCTION: "conjunction",
  DISJUNCTION: "disjunction",
  IMPLICATION: "implication",
  BICONDITIONAL: "biconditional",
  EXISTENTIAL: "existential",
  UNIVERSAL: "universal"
});

class Formula {
  constructor() {
    this.type = formulaTypes.GENERIC
    this.priority = -1;
  }

  get stringRep() {
    return "<Generic formula>";
  }
}

class PropositionalVariable extends Formula {
  constructor(name) {
    super();
    this.type = formulaTypes.PROPOSITIONAL_VARIABLE;
    this.name = name;
    this.priority = 0;
  }

  get stringRep() {
    return this.name;
  }
}

class Relation extends Formula {
  constructor(name, terms) {
    super();
    this.type = formulaTypes.RELATION;
    this.name = name;
    this.terms = terms;
    this.priority = 0;
  }

  get stringRep() {
    var str = this.name + "(";
    /* Add string representations of the terms separated by commas */
    this.terms.forEach(term => str += term.stringRep +  ", ");
    /* Trim trailing comma and space, add closing bracket */
    str = str.substring(0, str.length - 2) + ")";
    return str;
  }
}

class Equality extends Formula {
  constructor(term1, term2) {
    super();
    this.type = formulaTypes.EQUALITY;
    this.term1 = term1;
    this.term2 = term2;
    this.priority = 0;
  }

  get stringRep() {
    return this.term1.stringRep + " = " + this.term2.stringRep;
  }
}

class Top extends Formula {
  constructor() {
    super();
    this.type = formulaTypes.TOP;
    this.priority = 0;
  }

  get stringRep() {
    return "⊤";
  }
}

class Bottom extends Formula {
  constructor() {
    super();
    this.type = formulaTypes.BOTTOM;
    this.priority = 0;
  }

  get stringRep() {
    return "⊥";
  }
}

class Negation extends Formula {
  constructor(operand) {
    super();
    this.type = formulaTypes.NEGATION;
    this.operand = operand;
    this.priority = 1;
  }

  get stringRep() {
    var str = "¬";
    if (this.operand.priority <= this.priority) {
      str += this.operand.stringRep;
    } else {
      str += "(" + this.operand.stringRep + ")";
    }
    return str;
  }
}

class BinaryConnective extends Formula {
  constructor(symbol, operand1, operand2) {
    super();
    this.symbol = symbol;
    this.operand1 = operand1;
    this.operand2 = operand2;
    this.isAssociative = true;
  }

  get stringRep() {
    var str = "";
    /* Bracket operands only if necessary. Note that this code assumes that
       different binary operators have different priorities. */
    if (this.operand1.priority < this.priority
            || (this.isAssociative
                && this.operand1.priority == this.priority)) {
      str += this.operand1.stringRep;
    } else {
      str += "(" + this.operand1.stringRep + ")";
    }
    str += " " + this.symbol + " ";
    if (this.operand2.priority < this.priority
            || (this.isAssociative
                && this.operand2.priority == this.priority)) {
      str += this.operand2.stringRep;
    } else {
      str += "(" + this.operand2.stringRep + ")";
    }
    return str;
  }
}

class Conjunction extends BinaryConnective {
  constructor(conjunct1, conjunct2) {
    super("∧", conjunct1, conjunct2);
    this.type = formulaTypes.CONJUNCTION;
    this.priority = 2;
  }
}

class Disjunction extends BinaryConnective {
  constructor(disjunct1, disjunct2) {
    super("∨", disjunct1, disjunct2);
    this.type = formulaTypes.DISJUNCTION;
    this.priority = 3;
  }
}

class Implication extends BinaryConnective {
  constructor(antecedent, consequent) {
    super("→", antecedent, consequent);
    this.type = formulaTypes.IMPLICATION;
    this.isAssociative = false;
    this.priority = 4;
  }
}

class Biconditional extends BinaryConnective {
  constructor(operand1, operand2) {
    super("↔", operand1, operand2);
    this.type = formulaTypes.BICONDITIONAL;
    this.priority = 5;
  }
}

class Quantifier extends Formula {
  constructor(symbol, variableString, predicate) {
    super();
    this.symbol = symbol;
    this.variableString = variableString;
    this.predicate = predicate;
    this.priority = 1;
  }

  get stringRep() {
    var str = this.symbol + this.variableString;
    if (this.predicate.type == formulaTypes.UNIVERSAL
        || this.predicate.type == formulaTypes.EXISTENTIAL) {
      str += this.predicate.stringRep;
    } else {
      str += "[" + this.predicate.stringRep + "]";
    }
    return str;
  }
}

class Universal extends Quantifier {
  constructor(variable, predicate) {
    super("∀", variable, predicate);;
    this.type = formulaTypes.UNIVERSAL;
  }
}

class Existential extends Quantifier {
  constructor(variable, predicate) {
    super("∃", variable, predicate);
    this.type = formulaTypes.EXISTENTIAL;
  }
}

/* "Enumeration" representing different types of parse types */
const parseTypes = Object.freeze({
  UNARY: "unary",
  BINARY: "binary",
  QUANTIFIER: "quantifier"
});

class OperatorData {
  constructor(representingClass, parseType, priority) {
    this.representingClass = representingClass;
    this.parseType = parseType;
    this.priority = priority;
  }
}

const negationData = new OperatorData(Negation, parseTypes.UNARY, 1);
const conjunctionData = new OperatorData(Conjunction, parseTypes.BINARY, 2);
const disjunctionData = new OperatorData(Disjunction, parseTypes.BINARY, 3);
const implicationData = new OperatorData(Implication, parseTypes.BINARY, 4);
const biconditionalData = new OperatorData(Biconditional, parseTypes.BINARY, 5);
const universalData = new OperatorData(Universal, parseTypes.QUANTIFIER, 1);
const existentialData = new OperatorData(Existential, parseTypes.QUANTIFIER, 1);

const operatorDataDict = Object.freeze({
  "~": negationData,
  "˜": negationData,
  "¬": negationData,
  "!": negationData,
  "-": negationData,
  "∧": conjunctionData,
  "^": conjunctionData,
  ".": conjunctionData,
  "·": conjunctionData,
  "&": conjunctionData,
  "&&": conjunctionData,
  "∨": disjunctionData,
  "+": disjunctionData,
  "|": disjunctionData,
  "||": disjunctionData,
  "→": implicationData,
  "⇒": implicationData,
  "⊃": implicationData,
  "->": implicationData,
  ">": implicationData,
  "↔": biconditionalData,
  "⇔": biconditionalData,
  "≡": biconditionalData,
  "<->": biconditionalData,
  "<>": biconditionalData,
  "#": biconditionalData,
  "∀": universalData,
  "(A)": universalData,
  "∃": existentialData,
  "(E)": existentialData
});

const operandRepresentingClass = Object.freeze({
  "⊤": Top,
  "top": Top,
  "⊥": Bottom,
  "bottom": Bottom
});

class FormulaParsingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormulaParsingError';
  }
}

const OPERATOR_REGEX = new RegExp(''
    + /^\(A\)|^\(E\)|^->|^<->|^\(|^\[|^\)|^\]|^~|^˜|^¬|^!|^-|^∧|^\^|^\.|/.source
    + /^·|^&&|^&|^∨|^\+|^\|\||^\||^→|^⇒|^⊃|^>|^↔|^⇔|^≡|^<>|^#|^∀|^∃/.source
);
const OPERAND_REGEX = /^[^~˜¬!∧^.·&∨+|→⇒⊃\->↔⇔≡<#∀∃]+/;
const ONLY_OPERAND_REGEX = /^[^~˜¬!∧^.·&∨+|→⇒⊃\->↔⇔≡<#∀∃]+$/;
const QUANTIFIER_VAR_REGEX = /^[^~˜¬!∧^.·&∨+|→⇒⊃\->↔⇔≡<#∀∃()[\]]+/;
const RELATION_OR_FUNCTION_NAME_REGEX = /(^[^(]+?)(?:\[|\()/;
const BRACKETED_REGEX = /^(?:\[|\()(.+?)(?:\]|\))$/;

/*
 * Parses the formula given as a string with respect to the provided signature
 * Updates the signature with newly found constants, functions and relations
 */
function parseFormula(formulaString, signature, skolemConstants) {
  /* Initialize auxiliary object holding the data of the parser */
  var parserData = {
    operatorStack: [],
    formulaStack: [],
    variableStack: [],
    signature: signature,
    formulaString: formulaString,
    token: { str: null, isOperator: null },
    skolemConstants: skolemConstants
  }

  /* Trim spaces from the formula */
  parserData.formulaString = parserData.formulaString.replace(/ /g, "");
  if (formulaString === "") {
    throw new FormulaParsingError("Parsed formula is empty.")
  }
  while (parserData.formulaString !== "") {
    /* Determine the next token */
    extractToken(parserData);

    /* Process token */
    processToken(parserData);
  }

  /* Extract operatorStack and formulaStack for convenience */
  var operatorStack = parserData.operatorStack;
  var formulaStack = parserData.formulaStack;
  /* Process operators remaining in the stack */
  while (operatorStack.length > 0) {
    let processedOperator = operatorStack.pop();
    if (processedOperator === "(" || processedOperator === "["
        || processedOperator === ")" || processedOperator === "]") {
      throw new FormulaParsingError("Parsed formula contains mismatched "
          + "parentheses.")
    }
    commitOperator(processedOperator, parserData);
  }
  if (formulaStack.length !== 1) {
    throw new FormulaParsingError("Could not match operators to operands, "
        + "please check that operators are used with correct arities.");
  }
  return formulaStack.pop();
}

/*
 * Extracts next token from the formulaString wrapped in parserData
 */
function extractToken(parserData) {
  /* Extract parser data */
  var formulaString = parserData.formulaString;

  /* Attempt to extract an operator */
  let token = OPERATOR_REGEX.exec(formulaString);
  if (token === null) {
    /* No operator at the beginning of the string - extract operand instead */
    token = OPERAND_REGEX.exec(formulaString);
    if (token === null) {
      throw new FormulaParsingError("Parsing of the formula failed in an "
          + "unexpected way. Please contact the developer stating the "
          + "formula which you used. Sorry... Cause: Failed to extract token.");
    }
    token = token[0];
    /* Identify excess brackets and trim them off
     * Regex for operands can match additional closing bracktes matching
       opening bracktes that have already been parsed.
     * Example: function(a, b, c) = another(d, e))) */
    var index = 0;
    var openedBrackets = 0;
    var bracketEncountered = false;
    var equality = false;
    while (index < token.length
        && (openedBrackets !== 0 || !bracketEncountered || equality)) {
      if (token.charAt(index) === "("
          || token.charAt(index) === "[") {
        if (!bracketEncountered) {
          bracketEncountered = true;
        }
        openedBrackets++;
      } else if (token.charAt(index) === ")"
          || token.charAt(index) === "]") {
        if (openedBrackets === 0) {
          break;
        }
        openedBrackets--;
      }
      index++;
      if (index < token.length && token.charAt(index) === "=") {
        equality = true;
      }
    }
    parserData.token = {str: token.substr(0, index), isOperator: false};
    return;
  }
  parserData.token = {str: token[0], isOperator: true};
}

/*
 * Processes token wrapped in parserData
 */
function processToken(parserData) {
  /* Extract parser data */
  var token = parserData.token;
  var operatorStack = parserData.operatorStack;
  var formulaStack = parserData.formulaStack;

  var tokenString = token.str;
  if (token.isOperator) {
    if (tokenString in operatorDataDict) {
      /* Process known logical operator */
      processOperator(tokenString, parserData);
    } else if (tokenString.charAt(0) === "(" || tokenString.charAt(0) === "[") {
      /* Process opening bracket */
      operatorStack.push(tokenString.charAt(0));
      /* Consume bracket */
      parserData.formulaString = parserData.formulaString.substr(1);
    } else if (tokenString.charAt(0) === ")" || tokenString.charAt(0) === "]") {
      /* Process closing bracket */
      let currOperator = operatorStack.pop();
      while (currOperator !== "(" && currOperator !== "[") {
        if (currOperator === undefined) {
          throw new FormulaParsingError("Formula contains mismatched "
              + "parentheses.");
        }
        commitOperator(currOperator, parserData);
        currOperator = operatorStack.pop();
      }
      /* Consume bracket */
      parserData.formulaString = parserData.formulaString.substr(1);
    } else {
      /* Throw error if an unknown operator is encountered */
      throw new FormulaParsingError("Formula contains an unknown operator "
          + `'${tokenString}'.`);
    }
  } else {
    /* Parse operand */
    if (tokenString.includes("=")) {
      /* Parse equality */
      let terms = tokenString.split("=");
      if (terms.length !== 2) {
        throw new FormulaParsingError("Formula contains invalid equality.");
      }
      /* Parse terms in the equality */
      let term1;
      let term2;
      try {
        term1 = parseTerm(terms[0], parserData);
        term2 = parseTerm(terms[1], parserData);
      } catch (error) {
        if (error instanceof FormulaParsingError) {
          throw new FormulaParsingError("Formula contains invalid equality: "
              + error.message);
        } else {
          throw error;
        }
      }
      /* Add equality to the formula stack */
      formulaStack.push(new Equality(term1, term2));
    } else if (tokenString.includes("(") || tokenString.includes("[")) {
      /* Parse relation */
      processRelation(tokenString, parserData);
    } else if (tokenString in operandRepresentingClass) {
      /* Parse top or bottom */
      formulaStack.push(new operandRepresentingClass[tokenString]());
    } else {
      /* Parse propositional variable */
      formulaStack.push(new PropositionalVariable(tokenString));
    }
    parserData.formulaString = parserData.formulaString
        .substr(tokenString.length);
  }
}

/*
 * Processes encountered operator token
 * Adds operator and possibly quantifier variable to the operatorStack
   and variableStack, but doesn't construct subformula representation of
   the operator and its operands
 */
function processOperator(operatorString, parserData) {
  /* Extract parser data */
  var operatorStack = parserData.operatorStack;
  var variableStack = parserData.variableStack;

  /* Get pushed operator data */
  let operatorData = operatorDataDict[operatorString];
  /* Process operators with greater or equal priority */
  while (operatorStack.length > 0) {
    let topOperator = operatorStack.pop();
    if (topOperator === "(" || topOperator === "[") {
      operatorStack.push(topOperator);
      break;
    }
    let topOperatorData = operatorDataDict[topOperator];
    if (topOperatorData === undefined) {
      throw new FormulaParsingError("Parsing of the formula failed in an "
          + "unexpected way. Please contact the developer stating the "
          + "formula which you used. Sorry... Cause: Failed to "
          + "retrieve specification of top operator on operatorStack.");
    }
    /* Note: Higher priority value = lower priority */
    if (topOperatorData.priority > operatorData.priority ||
        (topOperatorData.parseType != parseTypes.BINARY &&
            operatorData.parseType != parseTypes.BINARY)) {
      operatorStack.push(topOperator);
      break;
    }
    commitOperator(topOperator, parserData);
  }
  /* Push new operator to the stack */
  operatorStack.push(operatorString);
  /* Consume the pushed operator */
  parserData.formulaString =
      parserData.formulaString.substr(operatorString.length);
  if (operatorData.parseType === parseTypes.QUANTIFIER) {
    /* Add quantifier variable to the stack and consume processed characters */
    let variable = QUANTIFIER_VAR_REGEX.exec(parserData.formulaString)
    if (variable === null) {
      throw new FormulaParsingError("Formula contains quantifier without "
          + "quantified variable.");
    }
    variable = variable[0];
    variableStack.push(variable);
    parserData.formulaString = parserData.formulaString.substr(variable.length);
  }
}

/*
 * Constructs subformula representation of the given operator and its
   operands
 */
function commitOperator(operator, parserData) {
  /* Extract parser data */
  var formulaStack = parserData.formulaStack;
  var variableStack = parserData.variableStack;

  /* Retrieve operator data */
  if (!(operator in operatorDataDict)) {
    throw new FormulaParsingError("Parsing of the formula failed in an "
              + "unexpected way. Please contact the developer stating the "
              + "formula which you used. Sorry... Cause: Got invalid "
              + `operator to process '${operator}'.`);
  }
  var operatorData = operatorDataDict[operator];
  /* Construct new formula out of the subformula(s) */
  switch(operatorData.parseType) {
    case parseTypes.UNARY:
      if (formulaStack.length === 0) {
        throw new FormulaParsingError("Cannot match operand to the operator "
            + `'${operator}', please check whether the formula is complete `
            + "and well-formed.");
      }
      let unary_operand = formulaStack.pop()
      formulaStack.push(new operatorData.representingClass(unary_operand));
      break;
    case parseTypes.BINARY:
      if (formulaStack.length <= 1) {
        throw new FormulaParsingError("Cannot match operand(s) to the operator "
            + `'${operator}', please check whether the formula is complete `
            + "and well-formed.")
      }
      let operand2 = formulaStack.pop();
      let operand1 = formulaStack.pop();
      formulaStack.push(new operatorData.representingClass(operand1, operand2));
      break;
    case parseTypes.QUANTIFIER:
      if (variableStack.length === 0 || formulaStack.length === 0) {
        throw new FormulaParsingError("Cannot match variable or operand to the "
            + `operator '${operator}', please check whether the formula is `
            + "complete and well-formed.")
      }
      let variable = variableStack.pop();
      let quantifiedFormula = formulaStack.pop();
      formulaStack.push(new operatorData.representingClass(variable,
          quantifiedFormula));
      break;
  }
}

function processRelation(relationString, parserData) {
  /* Extract parser data */
  var formulaStack = parserData.formulaStack;
  var signature = parserData.signature;

  /* Extract relation name */
  let relationName = RELATION_OR_FUNCTION_NAME_REGEX.exec(relationString);
  if (relationName == null) {
    throw new FormulaParsingError("Parsing of the formula failed in an "
        + "unexpected way. Please contact the developer stating the "
        + "formula which you used. Sorry... Cause: Failed to extract "
        + "relationName.");
  }
  relationName = relationName[1];
  /* Consume the relation name */
  relationString = relationString.substr(relationName.length);
  /* Parse the terms in the relation and check arity */
  try {
    var relationTerms = parseCommaSeparatedTerms(relationString,
        parserData);
  } catch (error) {
    if (error instanceof FormulaParsingError) {
      throw new FormulaParsingError(`Relation '${relationName}' is `
          + `malformed: ${error.message}`);
    } else {
      throw error;
    }
  }
  if (!(relationName in signature.relationArities)) {
    signature.relationArities[relationName] = relationTerms.length;
  } else if (relationTerms.length
        !== signature.relationArities[relationName]) {
    throw new FormulaParsingError(`Relation '${relationName}' `
        + "is used with conflicting arities.");
  }
  /* Add relation to the formula stack */
  formulaStack.push(new Relation(relationName, relationTerms));
}

function parseCommaSeparatedTerms(termsString, parserData) {
  /* Strip brackets */
  var termsResult = BRACKETED_REGEX.exec(termsString);
  if (termsResult == null) {
    throw new FormulaParsingError("Malformed parentheses or empty function "
        + "arguments list in term.");
  }
  var termsString = termsResult[1];
  var terms = [];
  while (termsString !== "") {
    if (termsString.charAt(0) === ",") {
      termsString = termsString.substr(1);
    }
    let openedBrackets = 0;
    let index = 0;
    while (termsString.charAt(index) !== "," || openedBrackets !== 0) {
      if (termsString.charAt(index) == "(") {
        openedBrackets++;
      } else if (termsString.charAt(index) == ")") {
        openedBrackets--;
      }
      index++;
      if (index >= termsString.length) {
        break;
      }
    }
    let term = parseTerm(termsString.substr(0, index), parserData);
    termsString = termsString.substr(index);
    terms.push(term);
  }
  return terms;
}

/*
 * Function capable of parsing distinct term outside of formula context
 */
function parseSeparateTerm(termString, signature, skolemConstants) {
  /* Initialize auxiliary object holding the data of the parser */
  let parserData = {
    operatorStack: [],
    formulaStack: [],
    variableStack: [],
    signature: signature,
    formulaString: null,
    token: { str: null, isOperator: null },
    skolemConstants: skolemConstants
  }
  /* Trim spaces from the formula */
  termString = termString.replace(/ /g, "");
  if (termString === "") {
    throw new FormulaParsingError("Parsed term is empty.")
  }
  if (!ONLY_OPERAND_REGEX.test(termString)) {
    throw new FormulaParsingError("Parsed term contains invalid characters.");
  }
  return parseTerm(termString, parserData);
}

function parseTerm(termString, parserData) {
  if (termString === "") {
    throw new FormulaParsingError("Encountered empty string term.");
  }
  /* Extract parser data */
  var variableStack = parserData.variableStack;
  var signature = parserData.signature;

  if (termString.includes("(") || termString.includes("[")) {
    /* Parse function */
    let functionName = RELATION_OR_FUNCTION_NAME_REGEX.exec(termString);
    if (functionName == null) {
      throw new FormulaParsingError("Encountered function without a function "
          + "name (identified by opening bracket).");
    }
    functionName = functionName[1];
    /* Consume the function name */
    termString = termString.substr(functionName.length);
    /* Parse the terms in the function and check arity */
    let functionTerms = parseCommaSeparatedTerms(termString, parserData);
    if (functionTerms === null) {
      throw new FormulaParsingError(`Function ${functionName} is malformed.`);
    }
    if (!(functionName in signature.functionArities)) {
      signature.functionArities[functionName] = functionTerms.length;
    } else if (functionTerms.length
          !== signature.functionArities[functionName]) {
      throw new FormulaParsingError(`Function '${functionName}' `
          + "is used with conflicting arities.");
    }
    return new Function(functionName, functionTerms);
  } else if (variableStack.includes(termString)) {
    /* Parse variable */
    return new Variable(termString);
  } else {
    /* Parse constant */
    let skolemConstants = parserData.skolemConstants;
    if (!skolemConstants.has(termString) && /^sk[0-9]+$/.test(termString)) {
      throw new FormulaParsingError(`The constant ${termString} uses name `
          + "reserved for a Skolem constant that cannot be used at this "
          + "point. Please choose a different constant name.");
    }
    signature.constants.add(termString);
    return new Constant(termString);
  }
}

/*
 * Checks for formula equality
 */
function formulasDeepEqual(formula1, formula2) {
  if (formula1.type !== formula2.type
      || formula1.stringRep !== formula2.stringRep) {
    return false;
  }
  if (formula1.type === termTypes.FUNCTION) {
    return _.zipWith(formula1.terms, formula2.terms,
        (t1, t2) => formulasDeepEqual(t1, t2))
        .reduce((b1, b2) => b1 && b2, true);
  }
  if (formula1 instanceof Term) {
    return formula1.stringRep ===formula2.stringRep;
  }
  if (formula1 instanceof Quantifier) {
    return formulasDeepEqual(formula1.predicate, formula2.predicate);
  }
  if (formula1.type === formulaTypes.RELATION) {
    return _.zipWith(formula1.terms, formula2.terms,
        (t1, t2) => formulasDeepEqual(t1, t2))
        .reduce((b1, b2) => b1 && b2, true);
  }
  if (formula1.type === formulaTypes.EQUALITY) {
    return formulasDeepEqual(formula1.term1, formula2.term1)
        && formulasDeepEqual(formula1.term2, formula2.term2);
  }
  if (formula1.type === formulaTypes.NEGATION) {
    return formulasDeepEqual(formula1.operand, formula2.operand);
  }
  if (formula1 instanceof BinaryConnective) {
    if (formula1.isAssociative) {
      let operands1 = [];
      extractOperands(formula1, operands1, formula1.type);
      let operands2 = [];
      extractOperands(formula2, operands2, formula2.type);
      return _.zipWith(operands1, operands2,
          (f1, f2) => formulasDeepEqual(f1, f2))
          .reduce((b1, b2) => b1 && b2, true);
    } else {
      return formulasDeepEqual(formula1.operand1, formula2.operand1)
          && formulasDeepEqual(formula1.operand2, formula2.operand2);
    }
  }
  return true;
}

/*
 * Extracts individual operands for associative operators from the provided
   formula
 */
function extractOperands(formula, extractionTarget, type) {
  if (formula.type !== type) {
    extractionTarget.push(formula);
  } else {
    extractOperands(formula.operand1, extractionTarget, type);
    extractOperands(formula.operand2, extractionTarget, type);
  }
}

/*
 * Creates a copy of the supplied formula with variables replaced by terms
   as specified by the given replacements dictionary
 */
function replaceVariables(formula, replacements) {
  let formulaClone = _.cloneDeep(formula);
  return replaceVariablesHelper(formulaClone, replacements, new Set([]));

  function replaceVariablesHelper(formula, replacements, shadowedVariables) {
    if (formula.type === termTypes.VARIABLE
        && replacements.hasOwnProperty(formula.name)
        && !shadowedVariables.has(formula.name)) {
      return replacements[formula.name];
    } else if (formula.type === termTypes.FUNCTION) {
      formula.terms = formula.terms.map(t => replaceVariablesHelper(t,
          replacements, shadowedVariables));
    } else if (formula instanceof Quantifier) {
      let newlyShadowed = !shadowedVariables.has(formula.variableString);
      shadowedVariables.add(formula.variableString)
      formula.predicate = replaceVariablesHelper(formula.predicate,
          replacements, shadowedVariables);
      if (newlyShadowed) {
        shadowedVariables.delete(formula.variableString);
      }
    } else if (formula instanceof BinaryConnective) {
      formula.operand1 = replaceVariablesHelper(formula.operand1, replacements,
          shadowedVariables);
      formula.operand2 = replaceVariablesHelper(formula.operand2, replacements,
          shadowedVariables);
    } else if (formula.type === formulaTypes.NEGATION) {
      formula.operand = replaceVariablesHelper(formula.operand, replacements,
          shadowedVariables);
    } else if (formula.type === formulaTypes.EQUALITY) {
      formula.term1 = replaceVariablesHelper(formula.term1, replacements,
          shadowedVariables);
      formula.term2 = replaceVariablesHelper(formula.term2, replacements,
          shadowedVariables);
    } else if (formula.type === formulaTypes.RELATION) {
      formula.terms = formula.terms.map(t => replaceVariablesHelper(t,
          replacements, shadowedVariables));
    }
    return formula;
  }
}

/*
 * Creates a copy of the supplied formula with term replaced by another term
 */
function replaceTerm(formula, replaced, replacement) {
  let formulaClone = _.cloneDeep(formula);
  let replacementClone = _.cloneDeep(replacement);
  return replaceTermHelper(formulaClone, replaced, replacementClone);

  function replaceTermHelper(formula, replaced, replacement) {
    if (formula instanceof Term && formulasDeepEqual(formula, replaced)) {
      return replacement;
    }
    if (formula.type === termTypes.FUNCTION) {
      formula.terms = formula.terms
          .map(t => replaceTermHelper(t, replaced, replacement));
    } else if (formula instanceof Quantifier) {
      formula.predicate
          = replaceTermHelper(formula.predicate, replaced, replacement);
    } else if (formula instanceof BinaryConnective) {
      formula.operand1
          = replaceTermHelper(formula.operand1, replaced, replacement);
      formula.operand2
          = replaceTermHelper(formula.operand2, replaced, replacement);
    } else if (formula.type === formulaTypes.NEGATION) {
      formula.operand
          = replaceTermHelper(formula.operand, replaced, replacement);
    } else if (formula.type === formulaTypes.EQUALITY) {
      formula.term1
          = replaceTermHelper(formula.term1, replaced, replacement);
      formula.term2
          = replaceTermHelper(formula.term2, replaced, replacement);
    } else if (formula.type === formulaTypes.RELATION) {
      formula.terms = formula.terms
          .map(t => replaceTermHelper(t, replaced, replacement));
    }
    return formula;
  }
}

/*
 * Checks whether the given formula contains specified term
 */
function formulaContainsTerm(formula, term) {
  if (formula instanceof Term) {
    if (formulasDeepEqual(formula, term)) {
      return true;
    }
    if (formula.type === formulaTypes.FUNCTION) {
      return formula.terms
          .map(t => formulaContainsTerm(t, term))
          .reduce((b1, b2) => b1 || b2, false);
    }
    return false;
  } else if (formula instanceof Quantifier) {
    return formulaContainsTerm(formula.predicate, term);
  } else if (formula instanceof BinaryConnective) {
    return formulaContainsTerm(formula.operand1, term)
        || formulaContainsTerm(formula.operand2, term);
  } else if (formula.type === formulaTypes.NEGATION) {
    return formulaContainsTerm(formula.operand, term);
  } else if (formula.type === formulaTypes.EQUALITY) {
    return formulaContainsTerm(formula.term1, term)
        || formulaContainsTerm(formula.term2, term);
  } else if (formula.type === formulaTypes.RELATION) {
    return formula.terms
        .map(t => formulaContainsTerm(t, term))
        .reduce((b1, b2) => b1 || b2, false);
  }
  return false;
}
