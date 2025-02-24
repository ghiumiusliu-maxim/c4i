# c4i.js

- c4i.js is a standalone browser library for computing the next best move in a game of Connect 4.
- It contains a function for analyzing a board position for a sequence of moves and returning the next best move as a column (0-6).

## Overview

- A move sequence is represented as a number string (`'4251'` for example), where each digit represents a column where a move was made.
- In c4i.js you can input a sequence of moves using columns numbered 0-6 and get a best column to move to as a result numbered 0-6 too.

## How to Use

### Getting Started

1. **Include the Library**  
   Add c4i.js to your HTML file:
   ```html
   <script src="c4i.js"></script>
   ```

2. **Call the getBestMove Function**  
   Use the `getBestMove(sequence)` function to compute the next best move. Give it a move sequence using columns 0-6. For example:
   ```js
   let sequence = "4251"; // Moves so far (0-6): first move in col 4, then col 2, etc.
   let bestMove = getBestMove(sequence);
   console.log("Best move (column):", bestMove);
   ```
   The function returns an integer from 0 to 6 indicating the best column to make a move to.

### Detailed Example

Below is an HTML example that demonstrates how to use the library:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Connect 4 Best Move</title>
    <script src="c4i.js"></script>
  </head>
  <body>
    <input id="moveInput" type="text" placeholder="Enter move sequence (e.g. 4251)" />
    <button id="calculateMove">Get Best Move</button>
    <div id="result"></div>
    <script>
      document.getElementById("calculateMove").addEventListener("click", function() {
        let sequence = document.getElementById("moveInput").value;
        try {
          let bestMove = getBestMove(sequence);
          document.getElementById("result").innerText = "Best move (column): " + bestMove;
        } catch (error) {
          document.getElementById("result").innerText = "Error: " + error.message;
        }
      });
    </script>
  </body>
</html>
```
In this example the user inputs a move sequence `'4251'` into the text field. When the button is clicked, the `getBestMove` function is called and the best move (as a column numbered from 0 to 6) is displayed.

---
**`Made with ♡ by Neo X.`**
