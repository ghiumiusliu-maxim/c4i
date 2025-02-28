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

## How To Build

### Prerequisites:

- **Node.js and npm:**  
  Make sure you have [`Node.js and npm`](https://nodejs.org) installed.

- **Brotli:**  
  The build process requires the Brotli command-line tool.

  - **Linux:**  
    ```bash
    sudo apt update
    sudo apt install brotli
    ```

  - **Windows:**  
    You can install Brotli via [`Chocolatey`](https://chocolatey.org) by running:
    ```powershell
    choco install brotli
    ```
    Alternatively, download and install Brotli from its [`GitHub Releases`](https://github.com/google/brotli/releases).

### Building:

1. **Install Dependencies:**  
   In your project directory, run:
   ```bash
   npm install uglify-js simple-git node-fetch
   ```
    - Note that dependencies get cleaned after the build.

2. **Run the Build Script:**
   ```bash
   node build.js
   ```
   - Note that building this takes roughly 1.5 to 2 minutes on average hardware.

### Description:

**Functions of different files:**

   - File b128.js is my library for decoding a custom Base128 string.

   - File c4.js is my rewrite of [`PascalPons`](https://github.com/PascalPons) [`connect4 solver`](https://github.com/PascalPons/connect4) for web-browser JavaScript.
   - File build.js is for building c4i.js. Read more about it below.

**The build.js script performs the following steps:**

- Fetching Resources:  
  *It clones the [`brotlijs`](https://github.com/dominikhlbg/brotlijs) repository and downloads the [`book`](https://github.com/PascalPons/connect4/releases/download/book/7x6.book) file.*

- Compressing Book:  
  *It compresses the book file using Brotli.*

- Encoding Compressed Book:  
  *The compressed file is then encoded using my custom Base128 algorithm.*

- Processing brotli:  
  *The script processes `brotli.js` by removing specified line ranges and patching it with an encoded dictionary.*

- Generating c4i:  
  *It combines multiple source files, replaces a placeholder with the encoded book data, minifies the final output using [`UglifyJS`](https://www.npmjs.com/package/uglify-js) to produce `c4i.js`, and then removes all temporary files and directories created during the build.*

---

**`Made with ♡ by Neo X.`**
