"use strict";

// TODO: "Classes" defined in this file seem to be slightly cumbersome
// and feature considerable code duplication. Consider alternatives.

class Term {
  constructor() {
    this.isConstant = false;
    this.isVariable = false;
    this.isFunction = false;
  }

  get stringRep() {
    return "generic term";
  }
}

class Constant extends Term {
  constructor(name) {
    super();
    this.isConstant = true;
    this.name = name;
  }

  get stringRep() {
    return this.name;
  }
}

class Variable extends Term {
  constructor(name) {
    super();
    this.isVariable = true;
    this.name = name;
  }

  get stringRep() {
    return this.name;
  }
}

class Function extends Term {
  constructor(name, operands) {
    super();
    this.isFunction = true;
    this.name = name;
    this.operands = operands;
  }

  get stringRep() {
    str = name + "(";
    /* Add string representations of the operands separated by commas */
    operands.forEach(operand => str += operand.stringRep +  ", ");
    /* Trim trailing comma and space */
    str = str.substring(0, str.length - 2) + ")";
    return str;
  }
}

class Formula {
  constructor() {
    this.isPropositionalVariable = false;
    this.isEquality = false;
    this.isTop = false;
    this.isBottom = false;
    this.isNegation = false;
    this.isConjunction = false;
    this.isDisjunction = false;
    this.isImplication = false;
    this.isBiconditional = false;
    this.isUniversal= false;
    this.isExistential = false;
  }

  get stringRep() {
    return "generic formula";
  }
}

class PropositionalVariable extends Formula {
  constructor(name) {
    super();
    this.isPropositionalVariable = true;
    this.name = name;
  }

  get stringRep() {
    return this.name;
  }
}

class Equality extends Formula {
  constructor(comparand1, comparand2) {
    super();
    this.isEquality = true;
    this.comparand1 = comparand1;
    this.comparand2 = comparand2;
  }

  get stringRep() {
    return comparand1.stringRep + " = " + comparand2.stringRep;
  }
}

class Top extends Formula {
  constructor() {
    super();
    this.isTop = true;
  }

  get stringRep() {
    return "⊤";
  }
}

class Bottom extends Formula {
  constructor() {
    super();
    this.isBottom = true;
  }

  get stringRep() {
    return "⊥";
  }
}

class Negation extends Formula {
  constructor(negand) {
    super();
    this.isNegation = true;
    this.negand = negand;
  }

  get stringRep() {
    return "¬" + negand.stringRep;
  }
}

class Conjunction extends Formula {
  constructor(conjunct1, conjunct2) {
    super();
    this.isConjunction = true;
    this.conjunct1 = conjunct1;
    this.conjunct2 = conjunct2;
  }

  get stringRep() {
    return conjunct1.stringRep + " ∧ " + conjunct2.stringRep;
  }
}

class Disjunction extends Formula {
  constructor(disjunct1, distjunct2) {
    super();
    this.isDisjunction = true;
    this.disjunct1 = disjunct1;
    this.distjunct2 = disjunct2;
  }

  get stringRep() {
    return disjunct1.stringRep + " ∨ " + disjunct2.stringRep;
  }
}

class Implication extends Formula {
  constructor(antecedent, consequent) {
    super();
    this.isImplication = true;
    this.antecedent = antecedent;
    this.consequent = consequent;
  }

  get stringRep() {
    return antecedent.stringRep + " → " + consequent.stringRep;
  }
}

class Biconditional extends Formula {
  constructor(operand1, operand2) {
    super();
    this.isBiconditional = true;
    this.operand1 = operand1;
    this.operand2 = operand2;
  }

  get stringRep() {
    return operand1.stringRep + " ↔ " + operand2.stringRep;
  }
}

class Universal extends Formula {
  constructor(variable, predicate) {
    super();
    this.isUniversal = true;
    this.variable = variable;
    this.predicate = predicate;
  }

  get stringRep() {
    return "∀" + variable.stringRep + ". " + predicate.stringRep;
  }
}

class Existential extends Formula {
  constructor(variable, predicate) {
    super();
    this.isExistential = true;
    this.variable = variable;
    this.predicate = predicate;
  }

  get stringRep() {
    return "∃" + variable.stringRep + ". " + predicate.stringRep;
  }
}
