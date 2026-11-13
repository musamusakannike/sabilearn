module0 = {
    "title": "Module 0: Prerequisites & Digital Foundations",
    "description": "Essential digital logic and number system fundamentals needed to understand computer architecture from first principles.",
    "order": 0,
    "capstoneGoal": "Understand how electrical switches represent information, perform conversions between number systems, and build basic storage circuits.",
    "capstoneDifficulty": "medium",
    "topics": [
        {
            "title": "How Computers Think: From Transistors to Bits",
            "description": "Discover how tiny electrical switches combine to represent numbers, text, and instructions inside a computer.",
            "order": 1,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Mental Model: The Stadium Light Display",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Stadium Light Analogy\n\nImagine sitting in a football stadium at night. Across the field, thousands of spectators hold up colored flashlights. Individually, each light is simply **ON** or **OFF** — nothing more than a tiny toggle switch.\n\nYet, when coordinated together, those simple lights spell out giant words, display team logos, and animate moving pictures across the entire stadium stand."
                        },
                        {
                            "type": "text",
                            "content": "A computer works on the exact same principle. Inside your smartphone or laptop are billions of microscopic microscopic switches called **transistors**. Each transistor can either allow electric current to pass through (ON) or block it (OFF).\n\nBecause electricity has only two stable, reliable states in digital circuits — high voltage (typically ~3.3V or ~1.2V) and low voltage (~0V) — we assign symbols to these states:\n* **High Voltage (ON)** = `1`\n* **Low Voltage (OFF)** = `0`"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Formal Definitions: Bits, Bytes, and Words",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Defining the Units of Digital Information\n\n1. **Bit (Binary Digit)**: The smallest atomic unit of digital information. A bit can only hold either a `0` or a `1`.\n2. **Nibble**: A grouping of 4 bits (e.g., `1011`). A nibble represents exactly one hexadecimal digit.\n3. **Byte**: A grouping of 8 bits (e.g., `01000001`). One byte can represent $2^8 = 256$ unique values, which is enough to encode any character in standard ASCII (like the letter `'A'`).\n4. **Word**: The natural data size handled by a specific CPU's datapath in a single operation. In a 32-bit architecture, a word is 32 bits (4 bytes). In a 64-bit architecture, a word is 64 bits (8 bytes)."
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=3pXr3N_Wwp8",
                            "title": "Neso Academy - Binary Number System"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Concept Check",
                    "quiz": {
                        "question": "Why do modern digital computers use binary (base-2) rather than decimal (base-10) at the hardware level?",
                        "options": [
                            {
                                "text": "Electrical circuits can reliably distinguish between two voltage states (ON and OFF) much more accurately than ten distinct voltage levels.",
                                "isCorrect": True
                            },
                            {
                                "text": "Binary numbers take up less memory space on silicon chips than decimal numbers.",
                                "isCorrect": False
                            },
                            {
                                "text": "Decimal arithmetic requires complex software, while binary requires no programming languages.",
                                "isCorrect": False
                            },
                            {
                                "text": "Computer screens can only emit two frequencies of light.",
                                "isCorrect": False
                            }
                        ],
                        "explanation": "Physical transistors operate reliably as binary switches (saturated or cut-off). Attempting to distinguish 10 subtle voltage levels would lead to massive noise interference and signal corruption."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "How many distinct states can be represented by a group of 8 binary bits (1 byte)?",
                    "options": [
                        { "text": "256 states (from 0 to 255)", "isCorrect": True },
                        { "text": "128 states (from 0 to 127)", "isCorrect": False },
                        { "text": "64 states (from 0 to 63)", "isCorrect": False },
                        { "text": "512 states (from 0 to 511)", "isCorrect": False }
                    ],
                    "explanation": "Each bit has 2 possible values. For $n$ independent bits, the total number of combinations is $2^n$. For 8 bits, $2^8 = 256$ unique values (0 through 255)."
                },
                {
                    "question": "In computer architecture, what does the term 'word size' specifically denote?",
                    "options": [
                        { "text": "The maximum number of bits the processor's datapath, registers, and ALU can process in a single cycle", "isCorrect": True },
                        { "text": "The length of the longest string literal in a programming language", "isCorrect": False },
                        { "text": "The total capacity of the hard drive divided by 8", "isCorrect": False },
                        { "text": "The number of pins on the processor's physical socket", "isCorrect": False }
                    ],
                    "explanation": "Word size refers to the native width of registers and datapath buses in the CPU architecture (e.g., 32-bit or 64-bit words)."
                }
            ]
        },
        {
            "title": "Number Systems & Conversions Without Tears",
            "description": "Master conversions between Decimal (Base-10), Binary (Base-2), and Hexadecimal (Base-16) with fully worked step-by-step algorithms.",
            "order": 2,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Positional Notation: The Universal Blueprint",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Positional Number Systems\n\nIn our everyday life, we count in **Decimal (Base-10)** because humans have 10 fingers. When you see the number `743`, you intuitively know:\n\n$$743 = (7 \\times 10^2) + (4 \\times 10^1) + (3 \\times 10^0) = 700 + 40 + 3$$\n\nEvery positional number system follows the exact same formula. For any radix (base) $r$ with digits $d_n d_{n-1} \\dots d_0$:\n\n$$\\text{Value} = \\sum_{i=0}^{n} d_i \\cdot r^i$$\n\n* **Binary (Base-2)**: Digits $\{0, 1\}$. Place values: $2^0=1, 2^1=2, 2^2=4, 2^3=8, 2^4=16, 2^5=32, 2^6=64, 2^7=128$.\n* **Hexadecimal (Base-16)**: Digits $\{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, \\text{A}=10, \\text{B}=11, \\text{C}=12, \\text{D}=13, \\text{E}=14, \\text{F}=15\}$. Place values: $16^0=1, 16^1=16, 16^2=256, 16^3=4096$."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation 1: Decimal to Binary (Successive Division)",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Algorithm: Convert Decimal $(237)_{10}$ to Binary\n\nTo convert any integer from base-10 to base-2, repeatedly divide by $2$ and record the remainders from bottom to top (LSB to MSB):\n\n| Step | Division | Quotient | Remainder |\n|---|---|---|---|\n| 1 | $237 \\div 2$ | $118$ | **1** (LSB) |\n| 2 | $118 \\div 2$ | $59$ | **0** |\n| 3 | $59 \\div 2$ | $29$ | **1** |\n| 4 | $29 \\div 2$ | $14$ | **1** |\n| 5 | $14 \\div 2$ | $7$ | **0** |\n| 6 | $7 \\div 2$ | $3$ | **1** |\n| 7 | $3 \\div 2$ | $1$ | **1** |\n| 8 | $1 \\div 2$ | $0$ | **1** (MSB) |\n\nReading remainders backwards from bottom to top gives:  \n$$(237)_{10} = (11101101)_2$$\n\n**Verification Check**:\n$$128 + 64 + 32 + 0 + 8 + 4 + 0 + 1 = 237 \\quad \\checkmark$$"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation 2: Binary to Hexadecimal Shorthand",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The 4-Bit Grouping Rule\n\nBecause $16 = 2^4$, each hexadecimal digit corresponds to exactly **4 binary bits (one nibble)**.\n\nTake our binary result $(11101101)_2$:\n1. Split into groups of 4 bits starting from the right:\n   * Left group: `1110`\n   * Right group: `1101`\n2. Convert each 4-bit group to its decimal/hex value:\n   * `1110` $= 8 + 4 + 2 + 0 = 14 = \\mathbf{E}_{16}$\n   * `1101` $= 8 + 4 + 0 + 1 = 13 = \\mathbf{D}_{16}$\n\nTherefore:  \n$$(11101101)_2 = (\\text{ED})_{16}$$\n\n**Verification**:\n$$(\\text{ED})_{16} = (14 \\times 16^1) + (13 \\times 16^0) = 224 + 13 = 237_{10} \\quad \\checkmark$$"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=AlMkuzzNMmg",
                            "title": "Neso Academy - Conversion to Decimal Number System"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Practice Checkpoint",
                    "quiz": {
                        "question": "What is the hexadecimal representation of the binary number (10101111)_2?",
                        "options": [
                            { "text": "AF", "isCorrect": True },
                            { "text": "BF", "isCorrect": False },
                            { "text": "9E", "isCorrect": False },
                            { "text": "A15", "isCorrect": False }
                        ],
                        "explanation": "Divide into two 4-bit nibbles: (1010)_2 = 10 = 'A' in hex, and (1111)_2 = 15 = 'F' in hex. Combined: 'AF'."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "Convert the binary number (110101)_2 to decimal:",
                    "options": [
                        { "text": "53", "isCorrect": True },
                        { "text": "45", "isCorrect": False },
                        { "text": "55", "isCorrect": False },
                        { "text": "61", "isCorrect": False }
                    ],
                    "explanation": "Calculation: 1*(2^5) + 1*(2^4) + 0*(2^3) + 1*(2^2) + 0*(2^1) + 1*(2^0) = 32 + 16 + 0 + 4 + 0 + 1 = 53."
                },
                {
                    "question": "Convert decimal 189 to hexadecimal:",
                    "options": [
                        { "text": "BD", "isCorrect": True },
                        { "text": "CD", "isCorrect": False },
                        { "text": "AD", "isCorrect": False },
                        { "text": "BC", "isCorrect": False }
                    ],
                    "explanation": "Divide 189 by 16: 189 = 16 * 11 + 13. Since 11 is 'B' and 13 is 'D', (189)_10 = (BD)_16."
                },
                {
                    "question": "Convert the fractional binary number (0.101)_2 to its decimal equivalent:",
                    "options": [
                        { "text": "0.625", "isCorrect": True },
                        { "text": "0.525", "isCorrect": False },
                        { "text": "0.750", "isCorrect": False },
                        { "text": "0.650", "isCorrect": False }
                    ],
                    "explanation": "Negative powers of 2: 1*(2^-1) + 0*(2^-2) + 1*(2^-3) = 0.5 + 0 + 0.125 = 0.625."
                }
            ]
        },
        {
            "title": "Combinational Building Blocks: Gates, Multiplexers & Decoders",
            "description": "Learn how basic logic gates (AND, OR, NOT, XOR) combine to form decision-making hardware components.",
            "order": 3,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Everyday Analogy: Railway Track Switches",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Train Switch Analogy\n\nThink of a railway junction where trains arrive from two different tracks (Track A and Track B). A mechanical lever determines which train is allowed onto the main outbound line. If the lever is set to 0, Track A connects to the main line. If the lever is set to 1, Track B connects.\n\nIn computer hardware, this exact mechanism is called a **Multiplexer (MUX)**. It acts as an electronically controlled digital selector switch."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Fundamental Logic Gates",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Core Logic Gates\n\n1. **AND Gate**: Outputs `1` only if *all* inputs are `1` ($Y = A \\cdot B$).\n2. **OR Gate**: Outputs `1` if *at least one* input is `1` ($Y = A + B$).\n3. **NOT Gate (Inverter)**: Reverses the bit ($Y = \\overline{A}$).\n4. **XOR (Exclusive OR) Gate**: Outputs `1` if inputs are *different*; outputs `0` if inputs are identical ($Y = A \\oplus B = A\\overline{B} + \\overline{A}B$).\n\n**Truth Table for 2-Input XOR**:\n\n| $A$ | $B$ | $A \\oplus B$ |\n|---|---|---|\n| 0 | 0 | 0 |\n| 0 | 1 | 1 |\n| 1 | 0 | 1 |\n| 1 | 1 | 0 |"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Multiplexers and Decoders",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Multiplexers (MUX) & Decoders\n\n* **Multiplexer (Data Selector)**: A $2^n$-to-1 MUX has $2^n$ data inputs, $n$ select lines, and 1 output. For a 2:1 MUX:\n  $$Y = \\overline{S} \\cdot D_0 + S \\cdot D_1$$\n* **Decoder**: Converts an $n$-bit binary code into $2^n$ individual active output lines. For example, a 3-to-8 decoder takes a 3-bit register address and activates exactly one of 8 memory or register control lines."
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Gate Check",
                    "quiz": {
                        "question": "Which logic gate produces an output of 1 only when its two input bits are unequal (different)?",
                        "options": [
                            { "text": "XOR Gate", "isCorrect": True },
                            { "text": "AND Gate", "isCorrect": False },
                            { "text": "XNOR Gate", "isCorrect": False },
                            { "text": "OR Gate", "isCorrect": False }
                        ],
                        "explanation": "The XOR (Exclusive OR) gate outputs 1 when inputs differ (0 and 1, or 1 and 0), and 0 when they are equal (0 and 0, or 1 and 1)."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "How many selection lines are required for an 8-to-1 Multiplexer?",
                    "options": [
                        { "text": "3 selection lines", "isCorrect": True },
                        { "text": "4 selection lines", "isCorrect": False },
                        { "text": "8 selection lines", "isCorrect": False },
                        { "text": "2 selection lines", "isCorrect": False }
                    ],
                    "explanation": "A multiplexer with $2^n$ inputs requires $n$ selection lines. Since $8 = 2^3$, exactly 3 select lines ($S_2, S_1, S_0$) are needed."
                },
                {
                    "question": "What is the primary function of an n-to-2^n binary decoder in a CPU?",
                    "options": [
                        { "text": "To activate exactly one output line among 2^n possibilities based on an n-bit input address or opcode", "isCorrect": True },
                        { "text": "To add two binary numbers together without carry", "isCorrect": False },
                        { "text": "To compress data by a factor of n", "isCorrect": False },
                        { "text": "To convert analog signals to digital voltages", "isCorrect": False }
                    ],
                    "explanation": "Decoders translate binary coded inputs (like register numbers or memory addresses) into a single active control signal out of $2^n$ lines."
                }
            ]
        },
        {
            "title": "Sequential Circuits: How Hardware Remembers (Flip-Flops & Registers)",
            "description": "Understand the difference between combinational and sequential logic, clock signals, flip-flops, and how CPU registers store data.",
            "order": 4,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Core Concept: Memory Needs Feedback",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Combinational vs. Sequential Circuits\n\n* **Combinational Logic**: The output depends *solely* on current inputs (like a simple light switch). It has no memory of the past.\n* **Sequential Logic**: The output depends on *both* current inputs and past history. It contains **memory elements** built by looping an output back into an input (feedback loop)."
                        },
                        {
                            "type": "text",
                            "content": "### The Clock: The Heartbeat of the Processor\n\nAll actions in a digital computer are synchronized by an oscillating electronic signal called the **Clock**. The clock alternates continuously between 0 and 1 at gigahertz speeds (e.g., 3 GHz = 3 billion cycles per second).\n\nA **Flip-Flop** is an edge-triggered storage element that samples its input bit only on the rising (or falling) edge of the clock pulse, holding that value steady until the next clock cycle."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "From Flip-Flops to CPU Registers",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Building a Register\n\nIf one D flip-flop stores 1 bit, how does a CPU store a 32-bit integer? By arranging 32 D flip-flops in parallel sharing a common clock and load-enable signal.\n\nThis parallel bank of flip-flops is called a **Register**. Registers are the fastest storage locations in the entire computer because they sit directly on the CPU silicon die right beside the ALU."
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Memory Check",
                    "quiz": {
                        "question": "What enables a sequential circuit to store data across time, unlike a combinational circuit?",
                        "options": [
                            { "text": "Feedback loops that feed outputs back into inputs, synchronized by a clock signal", "isCorrect": True },
                            { "text": "Thicker copper wires with high electrical resistance", "isCorrect": False },
                            { "text": "Permanent magnetic charges stored inside individual logic gates", "isCorrect": False },
                            { "text": "Continuous execution of software loops in the operating system", "isCorrect": False }
                        ],
                        "explanation": "Sequential circuits store information using internal feedback loops (bistable states) governed by clock pulses."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "What is the key distinguishing characteristic of an edge-triggered D flip-flop?",
                    "options": [
                        { "text": "It only updates its stored output during the instant of a clock transition (rising or falling edge)", "isCorrect": True },
                        { "text": "It can only store zeros and never ones", "isCorrect": False },
                        { "text": "It does not require any clock input to change state", "isCorrect": False },
                        { "text": "It loses its stored data as soon as the clock signal is high", "isCorrect": False }
                    ],
                    "explanation": "Edge-triggered flip-flops sample data precisely at the rising (0->1) or falling (1->0) clock edge, making them immune to intermediate glitches during the clock cycle."
                },
                {
                    "question": "How are n-bit CPU registers constructed in computer hardware?",
                    "options": [
                        { "text": "By connecting n flip-flops in parallel with common clock and control lines", "isCorrect": True },
                        { "text": "By using n AND gates connected in a closed circle", "isCorrect": False },
                        { "text": "By storing electrical charges on magnetic tape inside the processor", "isCorrect": False },
                        { "text": "By using a single multiplexer without any feedback", "isCorrect": False }
                    ],
                    "explanation": "An $n$-bit register is formed by combining $n$ flip-flops in parallel, allowing all $n$ bits to be loaded or read simultaneously in a single clock cycle."
                }
            ]
        }
    ]
}
