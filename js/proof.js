"use strict";

/* Different types of special justifications */
const justTypes = Object.freeze({
  GIVEN: "given",
  ASS: "ass",
  ALLI_CONST: "∀I const",
  GOAL: "&lt;goal&gt;",
  CON_INTRO: "∧I",
  CON_ELIM: "∧E",
  DIS_INTRO: "∨I",
  DIS_ELIM: "∨E",
  IMP_INTRO: "→I",
  IMP_ELIM: "→E",
  NEG_INTRO: "¬I",
  NEG_ELIM: "¬E",
  DOUBLE_NEG_ELIM: "¬¬E",
  TOP_INTRO: "⊤I",
  BOT_INTRO: "⊥I",
  BOT_ELIM: "⊥E",
  BICONDL_INTRO: "↔I",
  BICONDL_ELIM: "↔E",
  EM: "EM",
  PC: "PC",
  EXIS_INTRO: "∃I",
  EXIS_ELIM: "∃E",
  UNIV_INTRO: "∀I",
  UNIV_ELIM: "∀E",
  UNIV_IMP_INTRO: "∀→I",
  UNIV_IMP_ELIM: "∀→E",
  EQ_SUB: "=sub",
  EQ_REFL: "refl",
  EQ_SYM: "=sym",
  TICK: "✓"
});


class Justification {
  constructor(type, linesArray) {
    this.type = type;
    this.linesArray = linesArray;
  }

  get stringRep() {
    let lineNumbers = this.linesArray.map(x => x.lineNumber);
    lineNumbers.sort();
    return `${this.type} (${lineNumbers.join(", ")})`
  }
}

class SpecialJustification {
  constructor(type) {
    this.type = type;
  }

  get stringRep() {
    return this.type;
  }
}

class ProofItem {
  constructor() {
    this.parent = null;
    this.next = null;
    this.prev = null;
  }

  prepend(proofItem) {
    proofItem.parent = this.parent;
    proofItem.next = this;
    proofItem.prev = this.prev;
    if (this.prev !== null) {
      this.prev.next = proofItem;
    } else {
      this.parent.components = proofItem;
    }
    this.prev = proofItem;
  }

  append(proofItem) {
    proofItem.parent = this.parent;
    proofItem.next = this.next;
    proofItem.prev = this;
    if (this.next !== null) {
      this.next.prev = proofItem;
    }
    this.next = proofItem;
  }

  delete() {
    if (this.prev !== null) {
      this.prev.next = this.next;
    } else {
      this.parent.components = this.next;
    }
    if (this.next !== null) {
      this.next.prev = this.prev;
    }
  }
}

class ProofLine extends ProofItem {
  constructor() {
    super();
    /* Line number to be updated on request using updateLines */
    this.lineNumber = 0;
  }
}

class JustifiedProofLine extends ProofLine {
  constructor(formula, justification) {
    super();
    this.formula = formula;
    this.justification = justification;
  }
}

class EmptyProofLine extends ProofLine {
  constructor() {
    super();
  }
}

class ProofBox extends ProofItem {
  constructor(initialLine, goalLine, nextAdjacent) {
    super();
    /* Initially mark as incomplete */
    this.complete = false;
    /* Add initial line to the box components */
    this.components = initialLine;
    initialLine.parent = this;
    /* Add empty line and the goal line */
    let emptyLine = new EmptyProofLine();
    initialLine.append(emptyLine);
    emptyLine.append(goalLine);
    this.nextAdjacent = nextAdjacent;
  }
}

class Proof extends ProofItem {
  constructor(initialProofLine, signature) {
    super();
    this.complete = false;
    this.components = initialProofLine;
    this.signature = signature;
  }
}

class ProofProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProofProcessingError';
  }
}

/*
 * Initialize proof using parsingResults from parseAll
 */
function initializeProof(parsingResults) {
  let signature = parsingResults.signature;
  let parsedFormulas = parsingResults.formulas;
  let parsedGoal = parsedFormulas.pop();
  let i = 0;
  /* Check whether givens include the goal */
  for (; i < parsedFormulas.length; i++) {
    if (JSON.stringify(parsedFormulas[i]) === JSON.stringify(parsedGoal)) {
      break;
    }
  }
  let initialProofLines = parsedFormulas
      .map(x => new JustifiedProofLine(x,
          new SpecialJustification(justTypes.GIVEN)));
  if (i === parsedFormulas.length) {
    /* Givens do not include the goal */
    initialProofLines.push(new EmptyProofLine());
    initialProofLines.push(
        new JustifiedProofLine(parsedGoal,
            new SpecialJustification(justTypes.GOAL)));
  } else {
    /* Givens contain the goal, automatically complete proof with tick rule */
    let justification = new Justification("✓", [initialProofLines[i]]);
    initialProofLines
        .push(new JustifiedProofLine(parsedGoal, justification));
  }
  /* Construct proof */
  let proof = new Proof(initialProofLines[0], signature);
  initialProofLines[0].parent = proof;
  let prev = initialProofLines[0];
  for (let i = 1; i < initialProofLines.length; i++) {
    prev.append(initialProofLines[i]);
    prev = initialProofLines[i];
  }
  return proof;
}

/*
 * Updates line numbers of all proof lines and checks proof boxes for
   completeness
 */
function updateLines(proof) {
  checkCompletion(proof);
  updateLinesHelper(proof, 1);

  /*
   * Checks the individual proof items for completion and trims out
     unnecessary empty lines
   */
  function checkCompletion(proofItem) {
    let components = proofItem.components;
    let complete = true;
    /* Automatically justify goal if the goal formula has been proven
       right above the empty line above goal. */
    for (let component = components; component !== null;
        component = component.next) {
      if (component.next !== null && component.next.next !== null
          && component instanceof JustifiedProofLine
          && component.next instanceof EmptyProofLine
          && component.next.next instanceof JustifiedProofLine
          && component.next.next.justification.type === justTypes.GOAL) {
        let emptyLine = component.next;
        let goalLine = component.next.next;
        if (formulasDeepEqual(component.formula, goalLine.formula)) {
          /* The formulas are identical */
          emptyLine.delete();
          if (component.justification.type === justTypes.GIVEN
              || component.justification.type === justTypes.ASS) {
            let newJustification
                = new Justification(justTypes.TICK, [component])
            goalLine.justification = newJustification;
          } else {
            goalLine.delete();
          }
        }
      }
    }
    /* Determine whether any goal line remains in the current proof item */
    for (let component = components; component !== null;
        component = component.next) {
      if (component instanceof JustifiedProofLine
          && component.justification.type === justTypes.GOAL) {
        complete = false
      }
      if (component instanceof ProofBox) {
        checkCompletion(component);
        complete = complete && component.complete;
      }
    }
    if (complete) {
      /* Trim out relict empty lines in completed part of the proof */
      for (let component = components; component !== null;
          component = component.next) {
        if (component instanceof EmptyProofLine) {
          component.delete();
        }
      }
    }
    proofItem.complete = complete;
  }

  /*
   * Helper function for updateLines
   */
  function updateLinesHelper(proofItem, lineNumber) {
    let components = proofItem.components;
    for (let component = components; component !== null;
        component = component.next) {
      if (component instanceof ProofLine) {
        /* Update line number */
        component.lineNumber = lineNumber;
        lineNumber++;
      }
      if (component instanceof ProofBox) {
        lineNumber = updateLinesHelper(component, lineNumber);
      }
    }
    return lineNumber;
  }
}

/*
 * Converts proof to displayable HTML representation
 */
function proofToHTML(proof) {
  let innerHTML = proofToHTMLHelper(proof);
  let complete = "";
  if (proof.complete) {
    complete = " box-checked"
  }
  let proofHTML =
      `<table class="table table-borderless table-sm table-responsive">
         <tbody>
           <tr>
             <td class="box-cell">
               <table class="proof-table${complete}">
                 <tbody>
                   ${innerHTML}
                 </tbody>
               </table>
             </td>
           </tr>
         </tbody>
       </table>`
  return proofHTML;

  /*
   * Helper function for proofToHTML
   */
  function proofToHTMLHelper(proofItem) {
    let proofHTML = "";
    let components = proofItem.components;
    let prevAdjacent = false;
    for (let component = components; component !== null;
        component = component.next) {
      if (component instanceof JustifiedProofLine) {
        proofHTML +=
            `<tr class="proof-line" tabindex="0">
               <th class="shrink" scope="row">${component.lineNumber}</th>
               <td>${component.formula.stringRep}</td>
               <td class="shrink justification-cell">${component.justification.stringRep}</td>
             </tr>`;
      } else if (component instanceof EmptyProofLine) {
        proofHTML +=
            `<tr colspan="3" class="proof-line" tabindex="0">
               <th class="shrink" scope="row">${component.lineNumber}</th>
               <td>&lt;empty line&gt;</td>
               <td class="shrink justification-cell"></td>
             </tr>`;
      } else if (component instanceof ProofBox) {
        let complete = "";
        if (component.complete) {
          complete = " box-checked";
        }
        if (!prevAdjacent) {
          proofHTML +=
              `<tr>
                 <td class="box-cell" colspan="3">
                   <table class="proof-box${complete}">
                     <tbody>`;
        } else {
          proofHTML +=
              `<table class="proof-box${complete}">
                 <tbody>`;
          prevAdjacent = false;
        }
        proofHTML += proofToHTMLHelper(component);
        if (!component.nextAdjacent) {
          proofHTML += `</tbody>
                      </table>
                    </td>
                  </tr>`;
        } else {
          proofHTML += `</tbody>
                      </table>`;
          prevAdjacent = true;
        }
      }
    }
    return proofHTML;
  }
}

/*
 * Attempts to retrieve lines identified by set of line numbers from the
   proof object
 * Justification lines are returned in the order in which they have been
   inserted into the set
 * The function checks whether the justification lines are in scope for the
   target (goal or empty) line
 */
function retrieveLines(proof, linesSet) {
  let retrievedLines = {
    justificationLines: [],
    targetLine: null,
  }
  let extractedLines = {};
  extractLines(proof, linesSet, extractedLines);
  for (let lineNumber of linesSet.values()) {
    if (!(lineNumber in extractedLines)) {
      retrievedLines.success = false;
      throw new ProofProcessingError("Processing of the proof failed in an "
          + "unexpected way. Please contact the developer stating the actions "
          + "that you performed. Sorry... Cause: Failed to extract selected "
          + "proof line(s).");
    }
    if (extractedLines[lineNumber] instanceof JustifiedProofLine
        && extractedLines[lineNumber].justification.type !== justTypes.GOAL) {
      retrievedLines.justificationLines.push(extractedLines[lineNumber]);
    } else {
      if (retrievedLines.targetLine !== null) {
        throw new ProofProcessingError("Only one target (goal or empty) line "
            + "should be selected.")
      }
      retrievedLines.targetLine = extractedLines[lineNumber];
    }
  }
  if (retrievedLines.targetLine === null) {
    throw new ProofProcessingError("No target (goal or empty) line has been "
        + "selected.")
  }
  for (let justificationLine of retrievedLines.justificationLines) {
    if (!checkScope(justificationLine, retrievedLines.targetLine)) {
      throw new ProofProcessingError("One or more of the selected "
          + "justification lines is out of scope for the chosen target (goal "
          + "or empty) line. Please make sure that you are not using formulas "
          + "outside of their boxes.");
    }
  }
  return retrievedLines;

  /*
   * Extracts all proof lines with line numbers in linesSet to
     extractionTarget (in form lineNumber: lineObject)
   */
  function extractLines(proofItem, linesSet, extractionTarget) {
    let components = proofItem.components;
    for (let component = components; component !== null;
        component = component.next) {
      if (component instanceof ProofLine
          && linesSet.has(component.lineNumber)) {
        extractionTarget[component.lineNumber] = component;
      }
      if (component instanceof ProofBox) {
        extractLines(component, linesSet, extractionTarget);
      }
    }
  }

  /*
   * Checks whether a provided justification line is in scope for the
     given target line
   */
  function checkScope(justificationLine, targetLine) {
    if (justificationLine.lineNumber >= targetLine.lineNumber) {
      return false;
    }
    let currProofItem = targetLine.parent;
    while (currProofItem !== null) {
      for (let component = currProofItem.components; component !== null;
          component = component.next) {
        if (component instanceof ProofLine && component === justificationLine) {
          return true;
        }
      }
      currProofItem = currProofItem.parent;
    }
    return false;
  }
}
