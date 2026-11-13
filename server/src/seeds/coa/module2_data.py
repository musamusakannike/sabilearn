module2 = {
    "title": "Module 2: Computer Arithmetic & Hardware Algorithms",
    "description": "Master fixed-point and floating-point arithmetic hardware algorithms: signed representations, fast adders, Booth multiplication, division, and the IEEE 754 standard.",
    "order": 2,
    "capstoneGoal": "Execute 2's complement arithmetic with overflow detection, trace Booth's algorithm and restoring division step-by-step, and encode real numbers into IEEE 754 single and double precision formats.",
    "capstoneDifficulty": "hard",
    "topics": [
        {
            "title": "Signed Number Representations & Overflow Detection",
            "description": "Compare Sign-Magnitude, 1's Complement, and 2's Complement systems, and master the hardware overflow detection rule.",
            "order": 1,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Why Two's Complement Rules Computing",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Mileage Odometer Analogy\n\nThink of a mechanical car odometer displaying `0000`. If you put the car in reverse and drive backwards one mile, the dials roll backwards to `9999`.\n\nIn an 8-bit digital circuit, if you start at `00000000` ($0$) and subtract $1$, the binary value wraps around to `11111111` ($255$ unsigned, or $-1$ signed). This natural cyclic rollover is the exact mechanical foundation of **Two's Complement Representation**!"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566928262-signed_number_rep.png",
                            "title": "Figure 5: Signed Number Binary Representations"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Formulas & Number Range",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Three Ways to Encode Negative Integers ($n$ bits)\n\n1. **Sign-Magnitude**: MSB is sign ($0 = +, 1 = -$), remaining $n-1$ bits are magnitude. *Flaw: Has two zeros ($+0$ and $-0$), requiring extra comparison hardware.*\n2. **One's Complement**: Invert all bits. *Flaw: Still has dual zeros (`0000` and `1111`) and requires end-around carry addition.*\n3. **Two's Complement (Universal Standard)**: Invert all bits and add 1:\n   $$-X = \\overline{X} + 1$$\n   * *Range for $n$ bits*: $[-2^{n-1}, +2^{n-1}-1]$\n   * For 8 bits: $[-128, +127]$. Notice there is only **one zero (`00000000`)**, and subtraction is performed using standard addition hardware: $A - B = A + (-B)$."
                        },
                        {
                            "type": "text",
                            "content": "### Hardware Overflow Detection Rule\n\nWhen adding two signed numbers of the **same sign**, an arithmetic overflow occurs if the result has the **opposite sign**.\n\nIn hardware, overflow $V$ is detected using an XOR gate on the carry-in ($C_{in}$) and carry-out ($C_{out}$) of the Most Significant Bit (MSB):\n\n$$V = C_{in} \\oplus C_{out}$$\n\nIf $V = 1$, an arithmetic overflow occurred (the result exceeds the register capacity)."
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=7towQUO9aZI",
                            "title": "Neso Academy - Overflow in Signed and Unsigned Numbers"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Adding With Overflow",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step Problem: Add (+80) and (+60) in an 8-bit Signed Register\n\n1. **Convert to 8-bit binary**:\n   * $+80_{10} = 01010000_2$\n   * $+60_{10} = 00111100_2$\n\n2. **Perform binary addition**:\n   ```text\n     Carry:   1 1 0 0 0 0 0 0\n              0 1 0 1 0 0 0 0   (+80)\n            + 0 0 1 1 1 1 0 0   (+60)\n            -------------------\n              1 0 0 0 1 1 0 0   (-116 in 2's complement!)\n   ```\n\n3. **Analyze Overflow Condition**:\n   * Sign bits of inputs were both `0` (positive), but the result MSB is `1` (negative).\n   * Carry into MSB ($C_{in}$) = $1$, Carry out of MSB ($C_{out}$) = $0$.\n   * $V = 1 \\oplus 0 = 1$ (**Overflow Detected!**)\n   * Expected sum is $+140$, which exceeds the 8-bit maximum limit of $+127$."
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Overflow Check",
                    "quiz": {
                        "question": "What is the result of negating the 8-bit two's complement binary number 00101010 (+42)?",
                        "options": [
                            { "text": "11010110 (-42)", "isCorrect": True },
                            { "text": "11010101 (-43)", "isCorrect": False },
                            { "text": "10101010", "isCorrect": False },
                            { "text": "01010110", "isCorrect": False }
                        ],
                        "explanation": "To negate in 2's complement: 1) Invert bits: ~00101010 = 11010101. 2) Add 1: 11010101 + 1 = 11010110 (-42)."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "What is the valid numerical range of integers that can be stored in a 16-bit signed two's complement register?",
                    "options": [
                        { "text": "-32,768 to +32,767", "isCorrect": True },
                        { "text": "-32,767 to +32,767", "isCorrect": False },
                        { "text": "0 to 65,535", "isCorrect": False },
                        { "text": "-65,536 to +65,535", "isCorrect": False }
                    ],
                    "explanation": "Formula: [-2^(n-1), +2^(n-1) - 1]. For n = 16: [-2^15, +2^15 - 1] = [-32,768, +32,767]."
                },
                {
                    "question": "An 8-bit ALU adds two signed numbers: A = 10001000 (-120) and B = 10010000 (-112). What is the resulting 8-bit pattern and is overflow flagged?",
                    "options": [
                        { "text": "00011000 with Overflow = 1", "isCorrect": True },
                        { "text": "00011000 with Overflow = 0", "isCorrect": False },
                        { "text": "11101000 with Overflow = 1", "isCorrect": False },
                        { "text": "10011000 with Overflow = 0", "isCorrect": False }
                    ],
                    "explanation": "Step 1: 10001000 + 10010000 = (1) 00011000. Carry into MSB is 0, carry out of MSB is 1. V = 0 XOR 1 = 1. Expected sum -232 is below -128, producing positive result +24 and triggering overflow."
                },
                {
                    "question": "Why does Two's Complement hardware not require separate circuits for addition and subtraction?",
                    "options": [
                        { "text": "Subtraction A - B is computed by inverting B, adding 1 to the carry-in of the first adder stage, and using the exact same adder datapath", "isCorrect": True },
                        { "text": "Because negative numbers are ignored by the ALU", "isCorrect": False },
                        { "text": "Because the control unit changes all subtraction operations into multiplication", "isCorrect": False },
                        { "text": "Because Two's Complement eliminates negative numbers completely", "isCorrect": False }
                    ],
                    "explanation": "An adder/subtractor circuit uses XOR gates on the B input controlled by a mode line (M): when M=1, XOR inverts B and M feeds 1 into Cin, automatically computing A + (~B + 1) = A - B."
                }
            ]
        },
        {
            "title": "Fast Adders: Ripple Carry vs. Carry Look-Ahead (CLA)",
            "description": "Analyze propagation delay in Ripple Carry Adders ($2n\\Delta$) and examine the carry generate/propagate logic of Carry Look-Ahead Adders.",
            "order": 2,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Domino Effect: Ripple Carry Adders",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Domino Problem\n\nA **Ripple Carry Adder (RCA)** connects Full Adders in series. The carry-out of stage $i$ becomes the carry-in of stage $i+1$.\n\nJust like a line of 32 falling dominoes, Stage 31 cannot produce its correct sum until the carry ripples through all preceding 30 stages! This delay makes the RCA a major speed bottleneck in high-performance CPUs."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566929055-ripple_carry_adder.png",
                            "title": "Figure 6: 4-Bit Ripple Carry Adder Circuit"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Carry Look-Ahead Logic: Generate & Propagate",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Mathematical Formulation\n\nA **Carry Look-Ahead Adder (CLA)** solves this bottleneck by calculating all carry bits simultaneously in parallel using two concepts:\n\n1. **Carry Generate ($G_i$)**: Stage $i$ will produce a carry regardless of any incoming carry if both input bits are 1:\n   $$G_i = A_i \\cdot B_i$$\n2. **Carry Propagate ($P_i$)**: Stage $i$ will pass along an incoming carry if either input bit is 1:\n   $$P_i = A_i \\oplus B_i$$\n\nThe carry equations are expanded directly in terms of the primary inputs:\n$$\\begin{aligned}\nC_1 &= G_0 + P_0 C_0 \\\\\nC_2 &= G_1 + P_1 G_0 + P_1 P_0 C_0 \\\\\nC_3 &= G_2 + P_2 G_1 + P_2 P_1 G_0 + P_2 P_1 P_0 C_0 \\\\\nC_4 &= G_3 + P_3 G_2 + P_3 P_2 G_1 + P_3 P_2 P_1 G_0 + P_3 P_2 P_1 P_0 C_0\n\\end{aligned}$$"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566929856-carry_lookahead_adder.png",
                            "title": "Figure 7: Carry Look-Ahead Logic Circuit"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Delay Comparison",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Calculation: 32-bit Ripple Carry vs. 32-bit Hierarchical CLA\n\nAssume each standard logic gate has a gate delay of $\\Delta = 1\\text{ ns}$.\n* In a full adder, the carry-out takes 2 gate levels ($2\\Delta$).\n\n**1. 32-bit Ripple Carry Adder Delay**:\n$$T_{\\text{RCA}} = 2n \\times \\Delta = 2 \\times 32 \\times 1\\text{ ns} = \\mathbf{64\\text{ ns}}$$\n\n**2. 32-bit Hierarchical CLA Delay** (organized as eight 4-bit CLA blocks with a block lookahead generator):\n* $P_i, G_i$ generation: $1\\text{ gate level} = 1\\text{ ns}$\n* Lookahead carry generator: $2\\text{ gate levels} = 2\\text{ ns}$\n* Sum generation: $2\\text{ gate levels} = 2\\text{ ns}$\n* Total delay: $T_{\\text{CLA}} \\approx \\mathbf{10\\text{ ns}}$\n\n**Speedup**:  \n$$\\text{Speedup} = \\frac{64\\text{ ns}}{10\\text{ ns}} = \\mathbf{6.4\\times \\text{ faster!}}$$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Adder Check",
                    "quiz": {
                        "question": "What is the logical condition under which a carry is 'generated' at stage i of a binary adder?",
                        "options": [
                            { "text": "Both inputs Ai and Bi are 1 (Gi = Ai AND Bi)", "isCorrect": True },
                            { "text": "At least one input is 0", "isCorrect": False },
                            { "text": "The previous carry was 0", "isCorrect": False },
                            { "text": "Ai is 1 and Bi is 0", "isCorrect": False }
                        ],
                        "explanation": "Gi = Ai AND Bi indicates that this bit position generates a carry-out independent of the carry-in from previous stages."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "If each full adder stage in a 16-bit Ripple Carry Adder introduces a carry propagation delay of 2 gate levels, what is the total worst-case carry propagation delay?",
                    "options": [
                        { "text": "32 gate levels", "isCorrect": True },
                        { "text": "16 gate levels", "isCorrect": False },
                        { "text": "8 gate levels", "isCorrect": False },
                        { "text": "64 gate levels", "isCorrect": False }
                    ],
                    "explanation": "Propagation delay = 2 gate delays per stage * 16 stages = 32 gate levels."
                },
                {
                    "question": "Why are single-level Carry Look-Ahead Adders typically limited to 4-bit blocks in silicon implementations?",
                    "options": [
                        { "text": "Because the fan-in (number of inputs) to the AND/OR gates grows impractically large beyond 4 bits", "isCorrect": True },
                        { "text": "Because computers cannot process numbers greater than 15", "isCorrect": False },
                        { "text": "Because XOR gates stop functioning above 4 bits", "isCorrect": False },
                        { "text": "Because 4 bits is the size of a floating-point exponent", "isCorrect": False }
                    ],
                    "explanation": "Equation for C4 requires a 5-input AND gate. Larger single-level CLAs exceed practical gate fan-in limits and cause signal degradation, necessitating multi-level hierarchical CLAs."
                },
                {
                    "question": "In a Carry Look-Ahead circuit with inputs A = 1010 and B = 1100, what are the Generate (G) and Propagate (P) bit vectors (from bit 3 to 0)?",
                    "options": [
                        { "text": "G = 1000, P = 0110", "isCorrect": True },
                        { "text": "G = 0110, P = 1000", "isCorrect": False },
                        { "text": "G = 1110, P = 0001", "isCorrect": False },
                        { "text": "G = 0001, P = 1110", "isCorrect": False }
                    ],
                    "explanation": "Bitwise AND: G3 = 1&1=1, G2 = 0&1=0, G1 = 1&0=0, G0 = 0&0=0 -> G = 1000. Bitwise XOR: P3 = 1^1=0, P2 = 0^1=1, P1 = 1^0=1, P0 = 0^0=0 -> P = 0110."
                }
            ]
        },
        {
            "title": "Signed Multiplication: Shift-and-Add & Booth’s Algorithm",
            "description": "Master binary multiplication: from elementary unsigned shift-and-add to Booth's algorithm for signed 2's complement numbers.",
            "order": 3,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "From Elementary School to Hardware Multiplication",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Shift-and-Add Multiplication\n\nMultiplying binary numbers on paper involves multiplying the multiplicand by each multiplier bit (which yields either the multiplicand itself or zero) and shifting left each time.\n\nIn hardware, we do the reverse to save silicon: we accumulate into an accumulator register ($A$), shift the combined $(A, Q)$ registers **right**, and check the least significant bit of the multiplier ($Q_0$)."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566930402-shift_add_multiplication.png",
                            "title": "Figure 8: Shift-and-Add Multiplication Datapath"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Booth’s Recoding Algorithm",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Why Booth's Algorithm is Brilliant\n\nStandard shift-and-add fails when multiplying signed negative numbers directly in Two's Complement. Booth's Algorithm handles both positive and negative numbers natively, and speeds up computation by replacing long strings of 1s with a single addition and subtraction!\n\n**The Rule Table**: Examine the pair of bits $(Q_0, Q_{-1})$:\n\n| $Q_0$ | $Q_{-1}$ | Action Required | Mathematical Meaning |\n|---|---|---|---|\n| 0 | 0 | Arithmetic Shift Right $(A, Q, Q_{-1})$ | Middle of string of zeros |\n| 0 | 1 | $A \\leftarrow A + M$, then ASR | End of string of ones |\n| 1 | 0 | $A \\leftarrow A - M$, then ASR | Beginning of string of ones |\n| 1 | 1 | Arithmetic Shift Right $(A, Q, Q_{-1})$ | Middle of string of ones |\n\n*Note on Arithmetic Shift Right (ASR): The sign bit of $A$ ($A_{n-1}$) is copied into itself to preserve the algebraic sign!*"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566931623-booths_algorithm_flowchart.png",
                            "title": "Figure 9: Flowchart for Booth's Algorithm"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=meSn0UXmgac",
                            "title": "Neso Academy - The Concept of Booth's Algorithm"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Fully Worked Example: (+7) x (-3) = -21 in 5-bit",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step Execution of Booth's Algorithm\n\n* Multiplicand $M = +7 = 00111_2$\n* $-M = 11001_2$ (2's complement of $M$)\n* Multiplier $Q = -3 = 11101_2$\n* Initial: $A = 00000_2$, $Q_{-1} = 0$, $\\text{Count} = 5$\n\n| Cycle | $A$ | $Q$ | $Q_{-1}$ | Operation |\n|---|---|---|---|---|\n| Initial | `00000` | `11101` | `0` | Start |\n| **1** | `11001` | `11101` | `0` | $(Q_0, Q_{-1}) = (1, 0) \\implies A = A - M$ (`00000 + 11001`) |\n| | `11100` | `11110` | `1` | ASR $(A, Q, Q_{-1})$, Count = 4 |\n| **2** | `00101` | `11110` | `1` | $(Q_0, Q_{-1}) = (0, 1) \\implies A = A + M$ (`11100 + 00111`) |\n| | `00010` | `11111` | `0` | ASR $(A, Q, Q_{-1})$, Count = 3 |\n| **3** | `11011` | `11111` | `0` | $(Q_0, Q_{-1}) = (1, 0) \\implies A = A - M$ (`00010 + 11001`) |\n| | `11101` | `11111` | `1` | ASR $(A, Q, Q_{-1})$, Count = 2 |\n| **4** | `11110` | `11111` | `1` | $(Q_0, Q_{-1}) = (1, 1) \\implies$ Only ASR, Count = 1 |\n| **5** | `11111` | `01111` | `1` | $(Q_0, Q_{-1}) = (1, 1) \\implies$ Only ASR, Count = 0 |\n\n**Final Combined Product $(A, Q)$**:  \n$$AQ = 1111101111_2$$\n\n**Verification**:\nNegative value! Take 2's complement of $1111101111_2$:\n$$\\text{Invert: } 0000010000 + 1 = 0000010101_2 = 16 + 4 + 1 = +21_{10}$$\nTherefore $AQ = \\mathbf{-21_{10}}$. **Exact Match!** $\\checkmark$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Booth Check",
                    "quiz": {
                        "question": "In Booth's algorithm, if the current least significant bit of the multiplier Q0 is 0 and Q-1 is 1, what arithmetic operation is performed on register A before the arithmetic shift right?",
                        "options": [
                            { "text": "A = A + M (Add Multiplicand)", "isCorrect": True },
                            { "text": "A = A - M (Subtract Multiplicand)", "isCorrect": False },
                            { "text": "A = A * 2", "isCorrect": False },
                            { "text": "No arithmetic operation, only shift", "isCorrect": False }
                        ],
                        "explanation": "The transition from 1 to 0 (looking from right to left, Q0=0, Q-1=1) represents the end of a block of ones, requiring addition of the multiplicand: A = A + M."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "Why does Booth's algorithm use an Arithmetic Shift Right (ASR) rather than a Logical Shift Right (LSR)?",
                    "options": [
                        { "text": "ASR replicates the sign bit (MSB), preserving the correct algebraic sign of negative intermediate sums", "isCorrect": True },
                        { "text": "ASR executes twice as fast in silicon", "isCorrect": False },
                        { "text": "LSR is only capable of shifting by 4 bits at a time", "isCorrect": False },
                        { "text": "ASR clears the accumulator to zero automatically", "isCorrect": False }
                    ],
                    "explanation": "Arithmetic Shift Right shifts bits to the right while maintaining the value of the most significant bit (sign extension), ensuring that negative two's complement numbers remain mathematically negative."
                },
                {
                    "question": "What is the primary performance advantage of Booth's recoding when multiplying by a number containing consecutive ones such as 00111100 (60)?",
                    "options": [
                        { "text": "It replaces 4 individual additions with just 1 subtraction and 1 addition, reducing ALU operations", "isCorrect": True },
                        { "text": "It bypasses the clock cycle entirely", "isCorrect": False },
                        { "text": "It converts 60 to a floating-point number", "isCorrect": False },
                        { "text": "It doubles the word size of the register", "isCorrect": False }
                    ],
                    "explanation": "Because 2^k + 2^(k-1) + ... + 2^m = 2^(k+1) - 2^m, a string of consecutive ones is computed using only two operations: subtraction at the start and addition at the end."
                },
                {
                    "question": "If multiplying two 8-bit Two's Complement numbers using Booth's algorithm, how many total shift cycles are required and what is the maximum bit-length of the final product?",
                    "options": [
                        { "text": "8 cycles, yielding a 16-bit product", "isCorrect": True },
                        { "text": "16 cycles, yielding an 8-bit product", "isCorrect": False },
                        { "text": "4 cycles, yielding an 8-bit product", "isCorrect": False },
                        { "text": "8 cycles, yielding a 32-bit product", "isCorrect": False }
                    ],
                    "explanation": "Booth's algorithm runs for exactly n cycles where n is the number of multiplier bits (8 cycles). The combined (A, Q) registers hold a 2n = 16-bit product."
                }
            ]
        },
        {
            "title": "Hardware Division: Restoring vs. Non-Restoring Techniques",
            "description": "Understand digital division algorithms: restoring subtraction vs. non-restoring optimization with step-by-step register tracing.",
            "order": 4,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Mental Model of Division",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Division as Repeated Subtraction\n\nDivision calculates:  \n$$\\text{Dividend} = (\\text{Divisor} \\times \\text{Quotient}) + \\text{Remainder}$$\n\nIn hardware, register $Q$ holds the dividend (and eventually receives the quotient), register $M$ holds the divisor, and register $A$ is an accumulator initialized to $0$."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Restoring vs. Non-Restoring Algorithms",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### 1. Restoring Division Algorithm\n\nIn each step:\n1. Shift left the combined $(A, Q)$ registers by 1 bit.\n2. Subtract divisor: $A \\leftarrow A - M$.\n3. Check sign of $A$:\n   * If $A < 0$ (sign bit is 1, division 'failed'): set $Q_0 = 0$, and **restore** $A$: $A \\leftarrow A + M$.\n   * If $A \\ge 0$ (sign bit is 0, division 'succeeded'): set $Q_0 = 1$ (no restoration needed).\n\n### 2. Non-Restoring Division Algorithm\n\nRestoring division wastes cycles adding back $M$. Non-restoring eliminates the restore step!\n* If $A$ is positive: Shift left $(A, Q)$, subtract $M$ ($A \\leftarrow A - M$).\n* If $A$ is negative: Shift left $(A, Q)$, **add $M$** ($A \\leftarrow A + M$).\n* In either case, set $Q_0 = 1$ if new $A$ is positive, or $0$ if new $A$ is negative."
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=kGYA3rvnWdU",
                            "title": "Neso Academy - The Concept of Restoring Division"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Divide 11 by 3 using Restoring Division",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step: Dividend = 11 (1011_2), Divisor = 3 (0011_2)\n\n* $M = 0011_2$, $-M = 1101_2$ (in 4-bit 2's complement)\n* Initial: $A = 00000_2$ (5 bits for sign), $Q = 1011_2$, $\\text{Count} = 4$\n\n| Cycle | $A$ | $Q$ | Operation Description |\n|---|---|---|---|\n| Start | `00000` | `1011` | Initial state |\n| **1** | `00001` | `011_` | Shift left $(A, Q)$ |\n| | `11110` | `011_` | $A = A - M$ (`00001 + 1101 = 11110` < 0) |\n| | `00001` | `0110` | Restore $A = A + M$, set $Q_0 = 0$ |\n| **2** | `00010` | `110_` | Shift left $(A, Q)$ |\n| | `11111` | `110_` | $A = A - M$ (`00010 + 1101 = 11111` < 0) |\n| | `00010` | `1100` | Restore $A = A + M$, set $Q_0 = 0$ |\n| **3** | `00101` | `100_` | Shift left $(A, Q)$ |\n| | `00010` | `100_` | $A = A - M$ (`00101 - 00011 = 00010` $\\ge 0$) |\n| | `00010` | `1001` | No restore! Set $Q_0 = 1$ |\n| **4** | `00101` | `001_` | Shift left $(A, Q)$ |\n| | `00010` | `001_` | $A = A - M$ (`00101 - 00011 = 00010` $\\ge 0$) |\n| | `00010` | `0011` | No restore! Set $Q_0 = 1$ |\n\n**Result**:\n* **Quotient $Q$** $= 0011_2 = \\mathbf{3_{10}}$\n* **Remainder $A$** $= 00010_2 = \\mathbf{2_{10}}$\n* **Verification**: $11 = (3 \\times 3) + 2 = 11 \\quad \\checkmark$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Division Check",
                    "quiz": {
                        "question": "What is the key optimization of the non-restoring division algorithm compared to restoring division?",
                        "options": [
                            { "text": "It skips the intermediate addition to restore register A on negative results, instead combining it with the subsequent shift and subtraction", "isCorrect": True },
                            { "text": "It requires no shift operations", "isCorrect": False },
                            { "text": "It only works on floating-point numbers", "isCorrect": False },
                            { "text": "It uses a hardware lookup table instead of an adder", "isCorrect": False }
                        ],
                        "explanation": "By recognizing that 2*(A - M) + M = 2A - M, non-restoring division removes the need to restore A after an unsuccessful subtraction, saving up to n additions."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "In restoring division, if register A becomes negative after subtracting divisor M, what two actions must be taken?",
                    "options": [
                        { "text": "Set Q0 = 0 and add M back to register A (restore)", "isCorrect": True },
                        { "text": "Set Q0 = 1 and subtract M again", "isCorrect": False },
                        { "text": "Clear register Q to 0 and halt", "isCorrect": False },
                        { "text": "Shift register A right by 2 bits", "isCorrect": False }
                    ],
                    "explanation": "A negative result indicates that the trial subtraction was invalid; hence quotient bit Q0 is recorded as 0 and A is restored by adding M."
                },
                {
                    "question": "At the conclusion of a non-restoring division algorithm, what final check must be performed if the remainder register A is negative?",
                    "options": [
                        { "text": "A final corrective addition of M must be added to A to produce the true positive remainder", "isCorrect": True },
                        { "text": "The quotient must be negated", "isCorrect": False },
                        { "text": "The divisor M must be discarded", "isCorrect": False },
                        { "text": "No action is ever needed", "isCorrect": False }
                    ],
                    "explanation": "If the final step in non-restoring division leaves register A negative, a single final corrective addition A = A + M is required to obtain the true remainder."
                },
                {
                    "question": "Dividing an 8-bit number by a 4-bit divisor requires how many shift-subtract iterations?",
                    "options": [
                        { "text": "8 iterations (equal to the number of dividend bits)", "isCorrect": True },
                        { "text": "4 iterations", "isCorrect": False },
                        { "text": "16 iterations", "isCorrect": False },
                        { "text": "2 iterations", "isCorrect": False }
                    ],
                    "explanation": "The division algorithm produces one quotient bit per cycle; thus an n-bit dividend requires n iterations."
                }
            ]
        },
        {
            "title": "Floating-Point Representation & The IEEE 754 Standard",
            "description": "Master scientific notation in binary, biased exponents, hidden bits, single/double precision formats, and convert decimal fractions to IEEE 754 hex.",
            "order": 5,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Need for Floating-Point",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Fixed-Point Dilemma\n\nIn fixed-point arithmetic, the decimal point is locked at a rigid position (e.g., 16 bits for integer, 16 bits for fraction). This means you cannot represent astronomical numbers (like the distance to the Sun: $1.496 \\times 10^{11}$ m) and atomic distances ($1.0 \\times 10^{-10}$ m) in the same register.\n\n**Scientific Notation** solves this by letting the point 'float':\n$$\\text{Number} = (-1)^{\\text{sign}} \\times \\text{Significand} \\times \\text{Base}^{\\text{Exponent}}$$"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "The IEEE 754 Standard Architecture",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Single vs. Double Precision Formats\n\n```text\nIEEE 754 Single Precision (32-bit):\n [ 1 bit Sign ] [ 8 bits Biased Exponent ] [ 23 bits Mantissa / Fraction ]\n\nIEEE 754 Double Precision (64-bit):\n [ 1 bit Sign ] [ 11 bits Biased Exponent ] [ 52 bits Mantissa / Fraction ]\n```\n\n| Parameter | Single Precision (Float) | Double Precision (Double) |\n|---|---|---|\n| **Total Width** | 32 bits | 64 bits |\n| **Sign Bit ($S$)** | 1 bit ($0 = +, 1 = -$) | 1 bit ($0 = +, 1 = -$) |\n| **Exponent ($E$)** | 8 bits | 11 bits |\n| **Exponent Bias** | **127** | **1023** |\n| **Fraction ($F$)** | 23 bits | 52 bits |\n| **Implicit Leading Bit** | $1.F$ (normalized) | $1.F$ (normalized) |\n| **Value Formula** | $(-1)^S \\times (1.F)_2 \\times 2^{E - 127}$ | $(-1)^S \\times (1.F)_2 \\times 2^{E - 1023}$ |"
                        },
                        {
                            "type": "text",
                            "content": "### Special IEEE 754 Values\n* **Zero ($+0$ / $-0$)**: $E = 0, F = 0$\n* **Denormalized Numbers**: $E = 0, F \\ne 0$ (Value: $(-1)^S \\times (0.F) \\times 2^{-126}$)\n* **Infinity ($+\\infty$ / $-\\infty$)**: $E = 255$ (single) or $2047$ (double), $F = 0$\n* **Not a Number (NaN)**: $E = 255, F \\ne 0$ (results from invalid math like $0/0$ or $\\sqrt{-1}$)"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=_NFaYk9R9jI",
                            "title": "Neso Academy - IEEE Standard for Floating-Point Arithmetic (IEEE 754)"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Convert (-18.625)_10 to IEEE 754 Hexadecimal",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step Conversion Algorithm\n\n**Step 1: Determine Sign Bit ($S$)**\nThe number is negative $\\implies \\mathbf{S = 1}$.\n\n**Step 2: Convert Magnitude to Binary**\n* Integer part: $18_{10} = 16 + 2 = 10010_2$\n* Fractional part: $0.625_{10} = 0.5 + 0.125 = 2^{-1} + 2^{-3} = 0.101_2$\n* Combined: $18.625_{10} = 10010.101_2$\n\n**Step 3: Normalize to Form $1.F \\times 2^e$**\nShift decimal point 4 places to the left:\n$$10010.101_2 = \\mathbf{1.0010101_2 \\times 2^4}$$\n* True exponent $e = 4$\n* Fraction bits $F = 00101010000000000000000$ (padded with zeros to 23 bits)\n\n**Step 4: Compute Biased Exponent ($E$)**\n$$E = e + \\text{Bias} = 4 + 127 = 131_{10}$$\n$$131_{10} = 128 + 2 + 1 = \\mathbf{10000011_2}$$\n\n**Step 5: Assemble 32-bit Pattern**\n```text\n [S] [     E     ] [           F            ]\n  1   10000011     00101010000000000000000\n```\n\n**Step 6: Convert to Hexadecimal**\n* `1100` = `C`\n* `0001` = `1`\n* `1001` = `9`\n* `0101` = `5`\n* `0000` = `0`\n* `0000` = `0`\n* `0000` = `0`\n* `0000` = `0`\n\n$$\\mathbf{(-18.625)_{10} = (C1950000)_{16}} \\quad \\checkmark$$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "IEEE 754 Check",
                    "quiz": {
                        "question": "What is the true exponent (unbiased) represented by the 8-bit biased exponent field E = 10000000 (128 decimal) in IEEE 754 single precision?",
                        "options": [
                            { "text": "+1", "isCorrect": True },
                            { "text": "128", "isCorrect": False },
                            { "text": "-1", "isCorrect": False },
                            { "text": "0", "isCorrect": False }
                        ],
                        "explanation": "True exponent e = E - Bias = 128 - 127 = +1."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "What decimal value does the 32-bit IEEE 754 pattern 0x41400000 represent?",
                    "options": [
                        { "text": "+12.0", "isCorrect": True },
                        { "text": "+24.0", "isCorrect": False },
                        { "text": "+6.0", "isCorrect": False },
                        { "text": "+10.5", "isCorrect": False }
                    ],
                    "explanation": "Hex 0x41400000 = 0 10000010 10000000000000000000000. S=0 (+). E = 130 -> e = 130 - 127 = 3. Mantissa = 1.1_2 = 1.5. Value = +1.5 * 2^3 = 1.5 * 8 = 12.0."
                },
                {
                    "question": "Why does the IEEE 754 format use a biased exponent (excess-127) rather than Two's Complement for the exponent field?",
                    "options": [
                        { "text": "It allows floating-point numbers to be compared for magnitude using simple unsigned integer comparison hardware", "isCorrect": True },
                        { "text": "It prevents division by zero errors", "isCorrect": False },
                        { "text": "It doubles the number of bits in the fraction", "isCorrect": False },
                        { "text": "It allows the CPU to run without a clock pulse", "isCorrect": False }
                    ],
                    "explanation": "A biased exponent ensures that smaller numbers always have smaller bit patterns in the exponent field, allowing hardware to sort and compare floating-point values using straightforward integer comparators."
                },
                {
                    "question": "In IEEE 754 double precision (64-bit), what is the exponent bias and the number of fraction bits?",
                    "options": [
                        { "text": "Bias = 1023, Fraction = 52 bits", "isCorrect": True },
                        { "text": "Bias = 127, Fraction = 23 bits", "isCorrect": False },
                        { "text": "Bias = 511, Fraction = 53 bits", "isCorrect": False },
                        { "text": "Bias = 2047, Fraction = 64 bits", "isCorrect": False }
                    ],
                    "explanation": "Double precision has a 1-bit sign, 11-bit exponent with bias 2^(11-1) - 1 = 1023, and a 52-bit fraction field."
                }
            ]
        },
        {
            "title": "Floating-Point Arithmetic Operations",
            "description": "Learn the 4-phase algorithm for floating-point addition and subtraction: exponent alignment, mantissa addition, normalization, and rounding.",
            "order": 6,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The 4-Step Addition & Subtraction Protocol",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### How Hardware Adds Two Floating-Point Numbers\n\nYou cannot directly add $1.5 \\times 10^3$ and $2.0 \\times 10^1$ without first converting them to the same exponent power ($1.5 \\times 10^3 + 0.02 \\times 10^3 = 1.52 \\times 10^3$).\n\nThe IEEE ALU follows 4 strict hardware stages:\n\n1. **Step 1: Check Zeros & Align Exponents**\n   * Compare exponents $E_1$ and $E_2$. Determine difference $d = |E_1 - E_2|$.\n   * Shift the significand of the *smaller* operand right by $d$ bit positions, and set its exponent to the larger exponent.\n2. **Step 2: Add or Subtract Significands**\n   * Perform addition or subtraction on the aligned significands based on the sign bits.\n3. **Step 3: Normalize the Result**\n   * If addition overflowed ($1x.xxxxx$), shift right by 1 and increment exponent.\n   * If subtraction caused leading zeros ($0.001xx$), shift left and decrement exponent until MSB is 1.\n4. **Step 4: Round & Check Underflow/Overflow**\n   * Round to nearest even using guard and round bits; flag overflow if $E > 254$ or underflow if $E < 1$."
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=kI4PjBbUaQ8",
                            "title": "Neso Academy - Floating Point Numbers - Solved Problems"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Adding 0.5 and 0.125 in Binary Floating-Point",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step Problem: Compute $A + B$\n* $A = 0.5_{10} = 1.0_2 \\times 2^{-1}$ ($E_A = -1$, $M_A = 1.000$)\n* $B = 0.125_{10} = 1.0_2 \\times 2^{-3}$ ($E_B = -3$, $M_B = 1.000$)\n\n**1. Alignment**:\n* Difference $d = (-1) - (-3) = 2$.\n* Shift $M_B$ right by 2 positions: $M_B = 0.010_2 \\times 2^{-1}$.\n\n**2. Add Significands**:\n$$M_{\\text{sum}} = M_A + M_B = 1.000_2 + 0.010_2 = 1.010_2$$\n\n**3. Normalize**:\n* Already normalized (leading 1 before point). Exponent remains $E = -1$.\n\n**4. Reconstruct Decimal**:\n$$1.010_2 \\times 2^{-1} = 0.101_2 = 0.5 + 0.125 = \\mathbf{0.625_{10}} \\quad \\checkmark$$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "FP Protocol Quiz",
                    "quiz": {
                        "question": "During floating-point addition, why is the significand of the number with the smaller exponent shifted to the right rather than the larger one shifted to the left?",
                        "options": [
                            { "text": "Shifting right only drops less significant fractional bits, whereas shifting left would corrupt high-order integer bits", "isCorrect": True },
                            { "text": "Hardware shifters can only physically move bits to the right", "isCorrect": False },
                            { "text": "The sign bit would be erased by left shifting", "isCorrect": False },
                            { "text": "Left shifting increases electrical capacitance in the ALU", "isCorrect": False }
                        ],
                        "explanation": "Right-shifting discards low-order bits (which can be retained in guard bits for rounding), preserving the most significant portions of the number."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "What is the primary role of Guard and Round bits during floating-point arithmetic?",
                    "options": [
                        { "text": "To retain intermediate precision bits shifted out during alignment so the final result can be rounded accurately", "isCorrect": True },
                        { "text": "To detect computer virus infections", "isCorrect": False },
                        { "text": "To protect the CPU from voltage spikes", "isCorrect": False },
                        { "text": "To store backup copies of the exponent", "isCorrect": False }
                    ],
                    "explanation": "Guard and Round bits extend precision to the right during alignment shifts, enabling unbiased rounding (e.g., Round to Nearest, Ties to Even) specified by IEEE 754."
                },
                {
                    "question": "How is floating-point multiplication performed between two numbers X1 = M1 * 2^E1 and X2 = M2 * 2^E2?",
                    "options": [
                        { "text": "Multiply significands (M1 * M2) and add exponents (E1 + E2 - Bias), then normalize", "isCorrect": True },
                        { "text": "Align exponents first, then multiply both exponents", "isCorrect": False },
                        { "text": "Add significands and subtract exponents", "isCorrect": False },
                        { "text": "Multiply exponents and divide significands", "isCorrect": False }
                    ],
                    "explanation": "In multiplication, exponents are added (subtracting one bias offset because both were biased) and significands are multiplied directly without prior alignment."
                },
                {
                    "question": "What happens if the result of a floating-point subtraction yields a significand of 0.000101 * 2^5?",
                    "options": [
                        { "text": "Post-normalization: shift significand left by 4 places and decrement exponent by 4 to get 1.010000 * 2^1", "isCorrect": True },
                        { "text": "The result is immediately discarded as zero", "isCorrect": False },
                        { "text": "The exponent is multiplied by 4", "isCorrect": False },
                        { "text": "An overflow flag is immediately raised", "isCorrect": False }
                    ],
                    "explanation": "Subtractive cancellation produces leading zeros. Normalization shifts left until the leading bit is 1, decrementing the exponent by the number of shifted positions."
                }
            ]
        }
    ]
}
