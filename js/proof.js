"use strict";

/* Dictionary associating rule descriptions to the corresponding
   handling functions */
// TODO
const rulesDict = Object.freeze({

})

class Justification {
  constructor(rule, linesArray) {
    this.rule = rule;
    this.linesArray = linesArray;
  }

  get stringRep() {
    let lineNumbers = this.linesArray.map(x => x.lineNumber);
    lineNumbers.sort();
    return `${this.rule} (${lineNumbers.join(", ")})`
  }
}

class TextJustification {
  constructor(textJustification) {
    this.textJustification = textJustification;
  }

  get stringRep() {
    return this.textJustification;
  }
}

class ProofItem {
  constructor() {
    this.parent = null;
    this.complete = false;
  }
}

class JustifiedProofLine extends ProofItem {
  constructor(formula, justification) {
    /* Line number to be updated on request */
    super();
    this.lineNumber = 0;
    this.formula = formula;
    this.justification = justification;
  }
}

class EmptyProofLine extends ProofItem {
  constructor() {
    super();
  }
}

class ProofBox extends ProofItem {
  constructor(numColumns, initialLine, goalLine, nextAdjacent) {
    super();
    /* Add initial line to the box components */
    this.components = [initialLine];
    if (JSON.stringify(initialLine.formula)
        === JSON.stringify(goalLine.formula)) {
      /* Justify immediately if the initial and goal line carry identical
         formulas */
      let justification = new Justification("✓", [initialLine]);
      let tickLine = new JustifiedProofLine(initialLine.formula, justification);
      this.components.push(tickLine);
    } else {
      /* Add empty line and the goal line */
      this.components.push(new EmptyProofLine());
      this.components.push(goalLine);
    }
    this.nextAdjacent = nextAdjacent;
  }
}

class Proof extends ProofItem {
  constructor(initialProofLines, signature) {
    super();
    this.components = initialProofLines;
    this.signature = signature;
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
      .map(x => new JustifiedProofLine(x, new TextJustification("given")));
  if (i === parsedFormulas.length) {
    /* Givens do not include the goal */
    initialProofLines.push(new EmptyProofLine());
    initialProofLines.push(
        new JustifiedProofLine(parsedGoal, new TextJustification("goal")));
  } else {
    /* Givens contain the goal, automatically complete proof with tick rule */
    let justification = new Justification("✓", [initialProofLines[i]]);
    initialProofLines.push(new JustifiedProofLine(parsedGoal, justification));
  }
  /* Construct proof and set correct parent for all proof lines */
  let proof = new Proof(initialProofLines, signature);
  initialProofLines.map(x => x.parent = proof);
  return proof;
}

/*
 * Updates line numbers of all proof lines and checks proof boxes for
   completeness
 */
function updateLines(proof) {
  updateLinesHelper(proof, 1);
}

/*
 * Helper function for updateLines
 */
function updateLinesHelper(proofItem, lineNumber) {
  let components = proofItem.components;
  let complete = true;
  for (let i = 0; i < components.length; i++) {
    if (components[i] instanceof JustifiedProofLine) {
      /* Update line number */
      components[i].lineNumber = lineNumber;
      lineNumber++;
    } else if (components[i] instanceof EmptyProofLine) {
      complete = false;
    } else if (components[i] instanceof ProofBox) {
      lineNumber = updateLinesHelper(components[i], lineNumber);
      complete &= components[i].complete;
    }
  }
  proofItem.complete = complete;
  return lineNumber;
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
}

/*
 * Helper function for proofToHTML
 */
function proofToHTMLHelper(proofItem) {
  let proofHTML = "";
  let components = proofItem.components;
  let prevAdjacent = false;
  for (let i = 0; i < components.length; i++) {
    if (components[i] instanceof JustifiedProofLine) {
      proofHTML +=
          `<tr class="proof-line">
             <th class="shrink" scope="row">${components[i].lineNumber}</th>
             <td>${components[i].formula.stringRep}</td>
             <td class="shrink justification-cell">${components[i].justification.stringRep}</td>
           </tr>`;
    } else if (components[i] instanceof EmptyProofLine) {
      proofHTML +=
          `<tr colspan="3" class="proof-line">
             <th class="shrink" scope="row">–</th>
             <td>&lt;empty line&gt;</td>
             <td class="shrink justification-cell"></td>
           </tr>`;
    } else if (components[i] instanceof ProofBox) {
      if (!prevAdjacent) {
        proofHTML +=
            `<tr>
               <td class="box-cell" colspan="3">
                 <table class="proof-box">
                   <tbody>`;
      } else {
        proofHTML +=
            `<table class="proof-box">
               <tbody>`;
        prevAdjacent = false;
      }
      proofHTML += proofToHTMLHelper(components[i]);
      if (!components[i].nextAdjacent) {
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
