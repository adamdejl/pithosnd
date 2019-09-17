var assert = chai.assert;

describe('Formula', function() {
  describe('PropositionalVariable', function() {
    it('Parsing of "my_variable"', function() {
      let formula = "my_variable"
      let signature = {
        constants: new Set([]),
        skolemConstants: new Set([]),
        skolemNext: 1,
        relationArities: {},
        functionArities: {}
      };
      let parsedFormula = parseFormula(formula, signature)
      /* Correct type */
      assert.equal(parsedFormula.type, formulaTypes.PROPOSITIONAL_VARIABLE);

      /* Correct string representation */
      assert.equal(parsedFormula.stringRep, "my_variable");
      /* Correct result of the parsing */
      let propositionalVariable = new PropositionalVariable("my_variable");
      assert.deepEqual(parsedFormula, propositionalVariable);

      /* Unchanged signature */
      assert.equal(signature.constants.size, 0);
      assert.deepEqual(signature.relationArities, {});
      assert.deepEqual(signature.functionArities, {});
    });
  });

  describe('Negation', function() {
    it('Parsing of "¬a" and equivalent', function() {
      let formulas = ["~a", "˜a", "¬a", "!a", "-a",
                      "a~", "a˜", "a¬", "a!", "a-"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.NEGATION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "¬a");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("a");
        let negation = new Negation(propositionalVariableA);
        assert.deepEqual(parsedFormula, negation);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });

    it('Parsing of "¬¬¬a" and equivalent', function() {
      let formulas = ["~~~a", "˜˜˜a", "¬¬¬a", "!!!a", "---a",
                      "a~~~", "a˜˜˜", "a¬¬¬", "a!!!", "a---"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.NEGATION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "¬¬¬a");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("a");
        let negation1 = new Negation(propositionalVariableA);
        let negation2 = new Negation(negation1);
        let negation3 = new Negation(negation2);
        assert.deepEqual(parsedFormula, negation3);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });
  });

  describe('Conjunction', function() {
    it('Parsing of "A ∧ B" and equivalent', function() {
      let formulas = ["A ∧ B", "A ^ B", "A . B", "A · B", "A & B", "A && B"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.CONJUNCTION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "A ∧ B");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let conjunction
            = new Conjunction(propositionalVariableA, propositionalVariableB);
        assert.deepEqual(parsedFormula, conjunction);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });

    it('Parsing of "A ∧ B ∧ C ∧ D ∧ E" and equivalent', function() {
      let formulas = ["A ∧ B ∧ C ∧ D ∧ E", "A ^ B ^ C ^ D ^ E",
                      "A . B . C . D . E", "A · B · C · D · E",
                      "A & B & C & D & E", "A && B && C && D && E"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.CONJUNCTION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "A ∧ B ∧ C ∧ D ∧ E");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let propositionalVariableC = new PropositionalVariable("C");
        let propositionalVariableD = new PropositionalVariable("D");
        let propositionalVariableE = new PropositionalVariable("E");
        let conjunction1
            = new Conjunction(propositionalVariableA, propositionalVariableB);
        let conjunction2
            = new Conjunction(conjunction1, propositionalVariableC);
        let conjunction3
            = new Conjunction(conjunction2, propositionalVariableD);
        let conjunction4
            = new Conjunction(conjunction3, propositionalVariableE);
        assert.deepEqual(parsedFormula, conjunction4);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });
  });

  describe('Disjunction', function() {
    it('Parsing of "A ∨ B" and equivalent', function() {
      let formulas = ["A ∨ B", "A + B", "A | B", "A || B"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.DISJUNCTION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "A ∨ B");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let disjunction
            = new Disjunction(propositionalVariableA, propositionalVariableB);
        assert.deepEqual(parsedFormula, disjunction);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });

    it('Parsing of "A ∨ B ∨ C ∨ D ∨ E" and equivalent', function() {
      let formulas = ["A ∨ B ∨ C ∨ D ∨ E", "A + B + C + D + E",
                      "A | B | C | D | E", "A || B || C || D || E"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.DISJUNCTION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "A ∨ B ∨ C ∨ D ∨ E");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let propositionalVariableC = new PropositionalVariable("C");
        let propositionalVariableD = new PropositionalVariable("D");
        let propositionalVariableE = new PropositionalVariable("E");
        let disjunction1
            = new Disjunction(propositionalVariableA, propositionalVariableB);
        let disjunction2
            = new Disjunction(disjunction1, propositionalVariableC);
        let disjunction3
            = new Disjunction(disjunction2, propositionalVariableD);
        let disjunction4
            = new Disjunction(disjunction3, propositionalVariableE);
        assert.deepEqual(parsedFormula, disjunction4);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });
  });

  describe('Implication', function() {
    it('Parsing of "A → B" and equivalent', function() {
      let formulas = ["A → B", "A ⇒ B", "A ⊃ B", "A -> B", "A > B"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.IMPLICATION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "A → B");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let implication
            = new Implication(propositionalVariableA, propositionalVariableB);
        assert.deepEqual(parsedFormula, implication);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });

    it('Parsing of "A → B → C → D → E" and equivalent', function() {
      let formulas = ["A → B → C → D → E", "A ⇒ B ⇒ C ⇒ D ⇒ E",
                      "A ⊃ B ⊃ C ⊃ D ⊃ E", "A -> B -> C -> D -> E",
                      "A > B > C > D > E"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.IMPLICATION);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "(((A → B) → C) → D) → E");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let propositionalVariableC = new PropositionalVariable("C");
        let propositionalVariableD = new PropositionalVariable("D");
        let propositionalVariableE = new PropositionalVariable("E");
        let implication1
            = new Implication(propositionalVariableA, propositionalVariableB);
        let implication2
            = new Implication(implication1, propositionalVariableC);
        let implication3
            = new Implication(implication2, propositionalVariableD);
        let implication4
            = new Implication(implication3, propositionalVariableE);
        assert.deepEqual(parsedFormula, implication4);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });
  });

  describe('Biconditional', function() {
    it('Parsing of "A ↔ B" and equivalent', function() {
      let formulas = ["A ↔ B", "A ⇔ B", "A ≡ B", "A <-> B", "A <> B", "A # B"];
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.BICONDITIONAL);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "A ↔ B");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let biconditional
            = new Biconditional(propositionalVariableA, propositionalVariableB);
        assert.deepEqual(parsedFormula, biconditional);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });

    it('Parsing of "A ↔ B ↔ C ↔ D ↔ E" and equivalent', function() {
      let formulas = ["A ↔ B ↔ C ↔ D ↔ E", "A ⇔ B ⇔ C ⇔ D ⇔ E",
                      "A ≡ B ≡ C ≡ D ≡ E", "A <-> B <-> C <-> D <-> E",
                      "A <> B <> C <> D <> E", "A # B # C # D # E"];
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.BICONDITIONAL);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "A ↔ B ↔ C ↔ D ↔ E");
        /* Correct result of the parsing */
        let propositionalVariableA = new PropositionalVariable("A");
        let propositionalVariableB = new PropositionalVariable("B");
        let propositionalVariableC = new PropositionalVariable("C");
        let propositionalVariableD = new PropositionalVariable("D");
        let propositionalVariableE = new PropositionalVariable("E");
        let biconditional1
            = new Biconditional(propositionalVariableA, propositionalVariableB);
        let biconditional2
            = new Biconditional(biconditional1, propositionalVariableC);
        let biconditional3
            = new Biconditional(biconditional2, propositionalVariableD);
        let biconditional4
            = new Biconditional(biconditional3, propositionalVariableE);
        assert.deepEqual(parsedFormula, biconditional4);

        /* Unchanged signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {});
        assert.deepEqual(signature.functionArities, {});
      });
    });
  });

  describe('Universal', function() {
    it('Parsing of "∀item[computer(item)]" and equivalent', function() {
      let formulas = ["∀item[computer(item)]", "(A)item[computer(item)]"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.UNIVERSAL);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "∀item[computer(item)]");
        /* Correct result of the parsing */
        let variableItem = new Variable("item");
        let relation = new Relation("computer", [variableItem]);
        let universal = new Universal("item", relation)
        assert.deepEqual(parsedFormula, universal);

        /* Correctly updated signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {computer: 1});
        assert.deepEqual(signature.functionArities, {});
      });
    });

    it('Parsing of "∀x∀y∀z[related(x, y, z)]" and equivalent', function() {
      let formulas = ["∀x∀y∀z[related(x, y, z)]",
                      "(A)x(A)y(A)z[related(x, y, z)]"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.UNIVERSAL);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "∀x∀y∀z[related(x, y, z)]");
        /* Correct result of the parsing */
        let variableX = new Variable("x");
        let variableY = new Variable("y");
        let variableZ = new Variable("z");
        let relation
            = new Relation("related", [variableX, variableY, variableZ]);
        let universal3 = new Universal("z", relation);
        let universal2 = new Universal("y", universal3);
        let universal1 = new Universal("x", universal2);
        assert.deepEqual(parsedFormula, universal1);

        /* Correctly updated signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {related: 3});
        assert.deepEqual(signature.functionArities, {});
      });
    });
  });

  describe('Existential', function() {
    it('Parsing of "∃being[alien(being)]" and equivalent', function() {
      let formulas = ["∃being[alien(being)]", "(E)being[alien(being)]"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.EXISTENTIAL);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "∃being[alien(being)]");
        /* Correct result of the parsing */
        let variableBeing = new Variable("being");
        let relation = new Relation("alien", [variableBeing]);
        let existential = new Existential("being", relation)
        assert.deepEqual(parsedFormula, existential);

        /* Correctly updated signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {alien: 1});
        assert.deepEqual(signature.functionArities, {});
      });
    });

    it('Parsing of "∃x∃y∃z[related(x, y, z)]" and equivalent', function() {
      let formulas = ["∃x∃y∃z[related(x, y, z)]",
                      "(E)x(E)y(E)z[related(x, y, z)]"]
      formulas.forEach(function(formula) {
        let signature = {
          constants: new Set([]),
          skolemConstants: new Set([]),
          skolemNext: 1,
          relationArities: {},
          functionArities: {}
        };
        let parsedFormula = parseFormula(formula, signature);
        /* Correct type */
        assert.equal(parsedFormula.type, formulaTypes.EXISTENTIAL);

        /* Correct string representation */
        assert.equal(parsedFormula.stringRep, "∃x∃y∃z[related(x, y, z)]");
        /* Correct result of the parsing */
        let variableX = new Variable("x");
        let variableY = new Variable("y");
        let variableZ = new Variable("z");
        let relation
            = new Relation("related", [variableX, variableY, variableZ]);
        let existential3 = new Existential("z", relation);
        let existential2 = new Existential("y", existential3);
        let existential1 = new Existential("x", existential2);
        assert.deepEqual(parsedFormula, existential1);

        /* Correctly updated signature */
        assert.equal(signature.constants.size, 0);
        assert.deepEqual(signature.relationArities, {related: 3});
        assert.deepEqual(signature.functionArities, {});
      });
    });
  });

  describe('Equality', function() {
    it('Parsing of "funct(const, another(further), additional) = some"',
        function() {
      let formula = "funct(const, another(further), additional) = some";
      let signature = {
        constants: new Set([]),
        skolemConstants: new Set([]),
        skolemNext: 1,
        relationArities: {},
        functionArities: {}
      };
      let parsedFormula = parseFormula(formula, signature);
      /* Correct type */
      assert.equal(parsedFormula.type, formulaTypes.EQUALITY);

      /* Correct string representation */
      assert.equal(parsedFormula.stringRep,
          "funct(const, another(further), additional) = some");
      /* Correct result of the parsing */
      let constant = new Constant("const");
      let further = new Constant("further");
      let additional = new Constant("additional");
      let some = new Constant("some");
      let another = new Function("another", [further]);
      let funct = new Function("funct", [constant, another, additional])
      let equality = new Equality(funct, some);
      assert.deepEqual(parsedFormula, equality);

      /* Correctly updated signature */
      assert.deepEqual(signature.constants,
          new Set(["const", "further", "additional", "some"]));
      assert.deepEqual(signature.relationArities, {});
      assert.deepEqual(signature.functionArities, {funct: 3, another: 1});
    });
  });

  describe('Combined', function() {
    it('Parsing of "(A | B) ^ C -> (E)item[red(item, '
           + 'function(inner(constant), anotherconstant))] & D & E"',
        function() {
      let formula = "(A | B) ^ C -> (E)item[red(item, "
             + "function(inner(constant), anotherconstant))] & D & E";
      let signature = {
        constants: new Set([]),
        skolemConstants: new Set([]),
        skolemNext: 1,
        relationArities: {},
        functionArities: {}
      };
      let parsedFormula = parseFormula(formula, signature);
      /* Correct type */
      assert.equal(parsedFormula.type, formulaTypes.IMPLICATION);

      /* Correct string representation */
      assert.equal(parsedFormula.stringRep, "(A ∨ B) ∧ C → ∃item[red(item, "
               + "function(inner(constant), anotherconstant))] ∧ D ∧ E");
      /* Correct result of the parsing */
      let propositionalVariableA = new PropositionalVariable("A");
      let propositionalVariableB = new PropositionalVariable("B");
      let propositionalVariableC = new PropositionalVariable("C");
      let propositionalVariableD = new PropositionalVariable("D");
      let propositionalVariableE = new PropositionalVariable("E");
      let variableItem = new Variable("item");
      let constant = new Constant("constant");
      let anotherconstant = new Constant("anotherconstant")
      let disjunction
          = new Disjunction(propositionalVariableA, propositionalVariableB);
      let conjunction1 = new Conjunction(disjunction, propositionalVariableC);
      let inner = new Function("inner", [constant]);
      let funct = new Function("function", [inner, anotherconstant]);
      let red = new Relation("red", [variableItem, funct]);
      let existential = new Existential("item", red);
      let conjunction2 = new Conjunction(existential, propositionalVariableD);
      let conjunction3 = new Conjunction(conjunction2, propositionalVariableE);
      let implication = new Implication(conjunction1, conjunction3);
      assert.deepEqual(parsedFormula, implication);

      /* Correctly updated signature */
      assert.deepEqual(signature.constants,
          new Set(["constant", "anotherconstant"]));
      assert.deepEqual(signature.relationArities, {red: 2});
      assert.deepEqual(signature.functionArities, {function: 2, inner: 1});
    });

    it('Parsing of "A ∧ B ∧ C ∧ D ∧ (D → E) & ∀x[computer(x)]"', function() {
      let formula = "A ∧ B ∧ C ∧ D ∧ (D → E) & ∀x[computer(x)]";
      let signature = {
        constants: new Set([]),
        skolemConstants: new Set([]),
        skolemNext: 1,
        relationArities: {},
        functionArities: {}
      };
      let parsedFormula = parseFormula(formula, signature);
      /* Correct type */
      assert.equal(parsedFormula.type, formulaTypes.CONJUNCTION);

      /* Correct string representation */
      assert.equal(parsedFormula.stringRep,
          "A ∧ B ∧ C ∧ D ∧ (D → E) ∧ ∀x[computer(x)]");
      /* Correct result of the parsing */
      let propositionalVariableA = new PropositionalVariable("A");
      let propositionalVariableB = new PropositionalVariable("B");
      let propositionalVariableC = new PropositionalVariable("C");
      let propositionalVariableD = new PropositionalVariable("D");
      let propositionalVariableE = new PropositionalVariable("E");
      let variableX = new Variable("x");
      let conjunction1
          = new Conjunction(propositionalVariableA, propositionalVariableB);
      let conjunction2 = new Conjunction(conjunction1, propositionalVariableC);
      let conjunction3 = new Conjunction(conjunction2, propositionalVariableD);
      let implication
          = new Implication(propositionalVariableD, propositionalVariableE);
      let conjunction4 = new Conjunction(conjunction3, implication);
      let computer = new Relation("computer", [variableX]);
      let universal = new Universal("x", computer);
      let conjunction5 = new Conjunction(conjunction4, universal);
      assert.deepEqual(parsedFormula, conjunction5);

      /* Correctly updated signature */
      assert.deepEqual(signature.constants.size, 0);
      assert.deepEqual(signature.relationArities, {computer: 1});
      assert.deepEqual(signature.functionArities, {});
    });
  });
});
