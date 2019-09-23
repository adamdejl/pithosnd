# Pithos ND
Web-based natural deduction proof assistant using Fitch notation
for constructing the proofs.

## Example of usage
The following GIF shows how, based on the premises `∀x[human(x) → mortal(x)]`
and `human(Socrates)` translatable to natural language as 
"all humans are mortal" and "Socrates is a human", we can derive
`mortal(Socrates)` (i.e. that Socrates is mortal). This example is based on
a famous argument attributed to Aristotle. Note that the proof could be
shortened by using the derived ∀→E rule.

<img src="https://adamdejl.github.io/pithosnd/images/pithosnd_demo.gif" alt="Pithos ND demo GIF" width="70%">
