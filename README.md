# Tico programming language

Tico is a dynamic procedural programming language, similar to JS with some abstraction of Python's features and exclusive features.
The language is written in Typescript, both compilation and runtime.

## Dynamic

As the language is written in Typescript/Javascript a lot of it's features is inherited like variables, functions, scope organization, functions inside functions, etc.

## Procedural

The language isn't object oriented, but procedural, that means that the program executes a command after the other, until it reaches the end of the program. Anything can be a command from simple variable declaration to a whole function being declared inside a function.

## Parsing

The actual parsing (or compilation) part of Tico parses a source code string into a AST (Abstract Syntax Tree), which is a way to represent the program into a tree-like structure, each node represents a command with another commands as it's children when needed.

For example the expression `14 + 15` is parsed into something like:

```bash
BranchNode
└──scope
   └──BinaryExpressionNode
      ├──left
      │  └──LiteralNode
      │     └──value: 14
      ├──operator: +
      └──right
         └──LiteralNode
            └──value: 15
```

Tico also supports operators precedence, So the expresion `30 * 90 + 15 * 10` will be parsed into something like:

```bash
BranchNode
└──scope
   └──BinaryExpressionNode
      ├──left
      │  └──BinaryExpressionNode
      │     ├──left
      │     │  └──LiteralNode
      │     │     └──value: 30
      │     ├──operator: "*"
      │     └──right
      │        └──LiteralNode
      │           └──value: 90
      ├──operator: "+"
      └──right
         └──BinaryExpressionNode
            ├──left
            │  └──LiteralNode
            │     └──value: 15
            ├──operator: "*"
            └──right
               └──LiteralNode
                  └──value: 10
```

## Mathematical operations

Tico supports simple mathematical operations, this section will go through all the supported operators.

### `+` Addition

Adds two numbers together

`616 + 242` equals `858`

`814 + 261` equals `1075`

`278 + 221` equals `499`

### `-` Subtraction

Subtracts two numbers together

`39 - 538` equals `-499`

`102 - 135` equals `-33`

`953 - 194` equals `759`

### `*` Multiplication

Multiplies two numbers together

`587 * 366` equals `214842`

`337 * 874` equals `294538`

`281 * 833` equals `234073`

### `/` Multiplication

Divides two numbers together

`760 / 546` equals `1.4`

`346 / 533` equals `0.6`

`775 / 166` equals `4.7`

### `**` Power

Calculates the result of a number to the power of another number

`8 ** 9` equals `134217728`

`7 ** 5` equals `16807`

`7 ** 1` equals `7`

### `%` Modulo/Remainder

Calculates the remainder of a number divided by another number

`13 % 8` equals `5`

`48 % 30` equals `18`

`-6 % 19` equals `-6`

### `//` Floor division

Calculates the division between two number and floor it to integer

`485 // 7` equals `69.0`

`39 // 34` equals `1.0`

`431 // 135` equals `3.0`

### `%%` Unsigned modulo

The modulo operation from javascript leaves the sign of the result untouched, meaning that negative values are just "mirrors" of the positive values.
This operator "wraps" the left number in the range of the right number.

`105 %% 318` equals `105.0`

`-472 %% 188` equals `92.0`

`-92 %% 174` equals `82.0`

The operator precedence is the follow, operators on top have higher priority that the operators on bottom:

1. `**` : Power
2. `*` : Multiplication
3. `/` : Division
4. `//` : Floor division
5. `%` : Modulo
6. `%%` : Unsigned modulo
7. `+` : Addition
8. `-` : Subtraction

## How useful is it?

I, the author, don't think that Tico could be useful in a real-world problem, as I developed it to test my actual programming and logic skills.

## Roadmap

- [ ] Language documentation;
- [x] Branching;
- [ ] Loops;
- [ ] Arrays and objects creation support;
- [ ] Exceptions throwing;
- [ ] Macros;
