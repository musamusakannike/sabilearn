module3 = {
    "title": "Module 3: Instruction Set Architecture & Control Unit Design",
    "description": "Bridge low-level software instructions to physical CPU execution: Register Transfer Language, addressing modes, RISC vs. CISC, and hardwired vs. microprogrammed control units.",
    "order": 3,
    "capstoneGoal": "Specify CPU micro-operations in RTL, compute Effective Addresses across diverse addressing modes, evaluate CPU performance using the Iron Law, and contrast control unit architectures.",
    "capstoneDifficulty": "medium",
    "topics": [
        {
            "title": "Register Transfer Language (RTL) & Micro-Operations",
            "description": "Learn the formal symbolic language used by computer architects to specify data transfers between CPU registers, buses, and memory.",
            "order": 1,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Why RTL is the Architect's Blueprint",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Blueprint of Machine Operations\n\nWhen a programmer writes `x = y + z;`, what physically happens inside the CPU? The operation is broken into atomic clock-cycle steps called **Micro-Operations**.\n\nTo document these micro-operations precisely without drawing millions of transistors, hardware engineers use **Register Transfer Language (RTL)**."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566932917-register_organization_8086.png",
                            "title": "Figure 10: CPU Internal Register Organization"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "RTL Syntax & Rules",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Core RTL Notation\n\n1. **Direct Register Transfer**:  \n   $$R_2 \\leftarrow R_1$$\n   Copies the contents of register $R_1$ into register $R_2$ on the active clock edge. $R_1$'s contents remain intact.\n\n2. **Conditional Transfer (Control Signal $P$)**:  \n   $$P: R_2 \\leftarrow R_1$$\n   If and only if boolean control condition $P = 1$, the transfer executes synchronized with the clock pulse.\n\n3. **Memory Transfers**:\n   * **Read**: $DR \\leftarrow M[AR]$ (Transfer data from memory at address $AR$ into Data Register $DR$)\n   * **Write**: $M[AR] \\leftarrow R_1$ (Store contents of $R_1$ into memory at address $AR$)\n\n4. **Simultaneous Transfers** (separated by commas):\n   $$T_2: MAR \\leftarrow PC, \\quad PC \\leftarrow PC + 1$$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "RTL Check",
                    "quiz": {
                        "question": "What does the RTL statement 'T: R1 <- R2, R2 <- R1' physically describe?",
                        "options": [
                            { "text": "A simultaneous exchange of data between registers R1 and R2 at clock timing T using temporary internal bus latches", "isCorrect": True },
                            { "text": "A fatal hardware short-circuit error", "isCorrect": False },
                            { "text": "R1 is cleared to zero", "isCorrect": False },
                            { "text": "The computer reboots", "isCorrect": False }
                        ],
                        "explanation": "In clocked digital systems, registers read their inputs on the clock edge while holding outputs stable, permitting a clean swap of register contents in a single cycle."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "In the conditional RTL statement 'P: R2 <- R1', what hardware generates signal P?",
                    "options": [
                        { "text": "The Control Unit (CU) timing and sequencing logic", "isCorrect": True },
                        { "text": "The hard drive spindle motor", "isCorrect": False },
                        { "text": "The user keyboard controller", "isCorrect": False },
                        { "text": "The monitor refresh circuit", "isCorrect": False }
                    ],
                    "explanation": "Condition P represents a control signal output produced by the CPU Control Unit to enable the load line of register R2."
                },
                {
                    "question": "What is the standard RTL notation for fetching an operand from RAM into the accumulator?",
                    "options": [
                        { "text": "AC <- M[AR]", "isCorrect": True },
                        { "text": "M[AR] <- AC", "isCorrect": False },
                        { "text": "PC <- M[AC]", "isCorrect": False },
                        { "text": "IR <- M[PC]", "isCorrect": False }
                    ],
                    "explanation": "M[AR] symbolizes the memory word whose address is stored in the Address Register (AR), which is loaded into Accumulator (AC)."
                }
            ]
        },
        {
            "title": "Instruction Formats & Addressing Modes Demystified",
            "description": "Explore 0, 1, 2, and 3-address formats, and master the Effective Address (EA) calculations across all major CPU addressing modes.",
            "order": 2,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Instruction Formats & Address Fields",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### How Instructions are Encoded\n\nA machine instruction consists of an **Opcode** (Operation Code) specifying what operation to perform, followed by zero or more **Address/Operand Fields**:\n\n* **3-Address Format**: `ADD R1, R2, R3` ($R_1 \\leftarrow R_2 + R_3$). High code density, longer instruction word.\n* **2-Address Format**: `ADD R1, R2` ($R_1 \\leftarrow R_1 + R_2$). Destination also serves as an operand.\n* **1-Address Format**: `ADD X` ($AC \\leftarrow AC + M[X]$). Implicit Accumulator ($AC$).\n* **0-Address Format**: `ADD` (Pops top two values from hardware Stack, adds them, and pushes result)."
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=tGZvB_YorIM",
                            "title": "Neso Academy - Machine Instructions & Addressing Modes"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Addressing Modes & Effective Address (EA) Formulas",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### What is the Effective Address (EA)?\n\nThe **Effective Address (EA)** is the actual physical memory address of the operand needed by the instruction.\n\n| Addressing Mode | Syntax Example | Effective Address Formula ($EA$) | Description |\n|---|---|---|---|\n| **Immediate** | `MOV R1, #50` | No $EA$ (Operand is inside instruction) | Constant embedded directly in opcode word |\n| **Direct (Absolute)** | `MOV R1, [1000]` | $EA = A$ | Address field $A$ points directly to operand |\n| **Indirect** | `MOV R1, @[1000]`| $EA = M[A]$ | Memory location $A$ holds the pointer to operand |\n| **Register** | `MOV R1, R2` | No memory $EA$ (Operand in register $R_2$) | Fast on-chip register access |\n| **Register Indirect** | `MOV R1, [R2]` | $EA = [R_2]$ | Register $R_2$ holds the memory address |\n| **Indexed** | `MOV R1, 100[IX]`| $EA = A + [IX]$ | Base address $A$ offset by Index Register $IX$ |\n| **PC-Relative** | `BRA +20` | $EA = [PC] + A$ | Program counter offset, used for position-independent branching |\n| **Base Register** | `MOV R1, [BR + 50]` | $EA = [BR] + A$ | Relocatable memory segmentation |"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Comprehensive Addressing Mode Trace",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step Problem: Given CPU & Memory State\n\n* Program Counter $PC = 200$\n* Base Register $R_1 = 400$\n* Index Register $XR = 100$\n* Instruction at memory location 200 has **Address Field $A = 500$**\n* Memory Contents:  \n  * $M[400] = 700$  \n  * $M[500] = 800$  \n  * $M[600] = 900$  \n  * $M[800] = 1200$\n\n**Calculate the Effective Address ($EA$) and Operand fetched for each mode**:\n\n1. **Direct Mode**:  \n   $EA = A = \\mathbf{500}$.  \n   Operand $= M[500] = \\mathbf{800}$.\n\n2. **Indirect Mode**:  \n   $EA = M[A] = M[500] = \\mathbf{800}$.  \n   Operand $= M[800] = \\mathbf{1200}$.\n\n3. **Register Indirect Mode (using $R_1$)**:  \n   $EA = [R_1] = \\mathbf{400}$.  \n   Operand $= M[400] = \\mathbf{700}$.\n\n4. **Indexed Mode (using $XR$)**:  \n   $EA = A + [XR] = 500 + 100 = \\mathbf{600}$.  \n   Operand $= M[600] = \\mathbf{900}$.\n\n5. **PC-Relative Mode**:  \n   $EA = [PC] + A = 200 + 500 = \\mathbf{700}$ (or if PC pre-incremented to 201, $201 + 500 = 701$)."
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Addressing Mode Quiz",
                    "quiz": {
                        "question": "Which addressing mode is most suitable for accessing elements of an array in a loop?",
                        "options": [
                            { "text": "Indexed addressing mode (Base address + Index register)", "isCorrect": True },
                            { "text": "Immediate addressing mode", "isCorrect": False },
                            { "text": "Direct addressing mode", "isCorrect": False },
                            { "text": "Stack addressing mode", "isCorrect": False }
                        ],
                        "explanation": "In indexed addressing, the base address of the array is fixed in the instruction while the index register increments in each loop iteration (A + IX)."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "In Indirect Addressing mode with address field A = 350, if memory location M[350] contains 1200, and memory location M[1200] contains 45, what is the Effective Address and the retrieved operand?",
                    "options": [
                        { "text": "Effective Address = 1200, Operand = 45", "isCorrect": True },
                        { "text": "Effective Address = 350, Operand = 1200", "isCorrect": False },
                        { "text": "Effective Address = 45, Operand = 350", "isCorrect": False },
                        { "text": "Effective Address = 1550, Operand = 0", "isCorrect": False }
                    ],
                    "explanation": "Indirect mode uses the address field to find a pointer: EA = M[A] = M[350] = 1200. The operand at that address is M[1200] = 45."
                },
                {
                    "question": "Why is PC-Relative addressing especially valuable for operating system loaders and shared libraries?",
                    "options": [
                        { "text": "It creates position-independent code (PIC) that can be loaded anywhere in memory without rewriting jump targets", "isCorrect": True },
                        { "text": "It speeds up arithmetic addition by 50%", "isCorrect": False },
                        { "text": "It bypasses the L1 cache", "isCorrect": False },
                        { "text": "It doubles the number of general-purpose registers", "isCorrect": False }
                    ],
                    "explanation": "Because branch targets are calculated as an offset relative to the current PC (PC + offset), the code works identically regardless of where in physical memory the OS places the program."
                },
                {
                    "question": "How many memory references are required to execute an instruction in Indirect Addressing mode (excluding the initial instruction fetch)?",
                    "options": [
                        { "text": "2 memory references (one to fetch the effective address, one to access the operand)", "isCorrect": True },
                        { "text": "1 memory reference", "isCorrect": False },
                        { "text": "0 memory references", "isCorrect": False },
                        { "text": "3 memory references", "isCorrect": False }
                    ],
                    "explanation": "Indirect addressing requires two memory cycles: the first read retrieves the effective address pointer from memory, and the second read accesses the actual operand."
                }
            ]
        },
        {
            "title": "CISC vs. RISC: The Architectural Philosophy Debate",
            "description": "Contrast Complex Instruction Set Computers (x86) and Reduced Instruction Set Computers (ARM, RISC-V), and evaluate processor performance using the Iron Law.",
            "order": 3,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Core Philosophy: Two Different Paths",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Two Competing Visions\n\n* **CISC (Complex Instruction Set Computer)**: *Example: Intel x86, AMD64*\n  * Philosophy: 'Provide rich, powerful instructions that do complex jobs in a single line of assembly.'\n  * Variable-length instructions (1 to 15 bytes in x86), many addressing modes, memory-to-memory operations.\n* **RISC (Reduced Instruction Set Computer)**: *Example: ARM, Apple Silicon (M-series), RISC-V, MIPS*\n  * Philosophy: 'Keep hardware simple, make all instructions the exact same fixed length (32 bits), and execute one instruction every single clock cycle.'\n  * **Load/Store Architecture**: Only dedicated `LOAD` and `STORE` instructions touch memory; all arithmetic happens strictly inside general-purpose registers."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "The Iron Law of Processor Performance",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Fundamental Performance Equation\n\nThe total CPU execution time for any program is governed by three factors:\n\n$$\\text{CPU Time} = \\text{Instruction Count (IC)} \\times \\text{Cycles Per Instruction (CPI)} \\times \\text{Clock Cycle Time } (t_{\\text{clk}})$$\n\n$$\\text{CPU Time} = \\frac{\\text{Instructions}}{\\text{Program}} \\times \\frac{\\text{Clock Cycles}}{\\text{Instruction}} \\times \\frac{\\text{Seconds}}{\\text{Clock Cycle}}$$\n\n* **CISC Strategy**: Minimize **Instruction Count ($IC$)** by packing multiple actions into heavy instructions, accepting a higher average **$CPI$** ($2$ to $10+$ cycles).\n* **RISC Strategy**: Minimize **$CPI$** (aiming for $CPI \\approx 1.0$) and **Clock Cycle Time** ($t_{clk}$), accepting a slightly larger instruction count ($IC$)."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: RISC vs. CISC Comparison",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Quantitative Problem\n\nA benchmark program runs on a CISC and a RISC processor:\n* **CISC Processor**: Runs at $2.0\\text{ GHz}$ ($t_{clk} = 0.5\\text{ ns}$). Requires $1,000,000$ instructions with an average $\\text{CPI} = 3.5$.\n* **RISC Processor**: Runs at $3.0\\text{ GHz}$ ($t_{clk} = 0.333\\text{ ns}$). Because instructions are simpler, the compiler generates $1,500,000$ instructions ($1.5\\times$), but with an average $\\text{CPI} = 1.1$.\n\n**Calculate CPU execution time for both**:\n\n**1. CISC Execution Time**:\n$$\\text{Time}_{\\text{CISC}} = 1,000,000 \\times 3.5 \\times 0.5\\text{ ns} = 3,500,000 \\times 0.5\\text{ ns} = \\mathbf{1.75\\text{ milliseconds}}$$\n\n**2. RISC Execution Time**:\n$$\\text{Time}_{\\text{RISC}} = 1,500,000 \\times 1.1 \\times 0.333\\text{ ns} = 1,650,000 \\times 0.333\\text{ ns} = \\mathbf{0.55\\text{ milliseconds}}$$\n\n**Conclusion**: The RISC machine completes the program $\\frac{1.75}{0.55} = \\mathbf{3.18\\times\\text{ faster}}$ despite executing 500,000 more instructions!"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "RISC vs CISC Quiz",
                    "quiz": {
                        "question": "What is meant by a 'Load/Store Architecture' in RISC processors?",
                        "options": [
                            { "text": "Arithmetic and logic instructions can only operate on registers; memory access is restricted exclusively to load and store instructions", "isCorrect": True },
                            { "text": "The computer can only run software downloaded from an app store", "isCorrect": False },
                            { "text": "Registers cannot hold numbers, only memory addresses", "isCorrect": False },
                            { "text": "Instructions are loaded and stored on magnetic tape", "isCorrect": False }
                        ],
                        "explanation": "In a pure load/store architecture, operands must first be loaded into registers; arithmetic occurs strictly register-to-register, simplifying datapath design and enabling pipelining."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "If a processor has an average CPI of 1.25 and runs at a clock frequency of 2.5 GHz, what is its execution throughput in MIPS (Million Instructions Per Second)?",
                    "options": [
                        { "text": "2,000 MIPS", "isCorrect": True },
                        { "text": "2,500 MIPS", "isCorrect": False },
                        { "text": "3,125 MIPS", "isCorrect": False },
                        { "text": "1,000 MIPS", "isCorrect": False }
                    ],
                    "explanation": "Formula: MIPS = Clock Rate (MHz) / CPI = 2,500 MHz / 1.25 = 2,000 MIPS."
                },
                {
                    "question": "Why do RISC architectures enforce fixed instruction lengths (e.g. exactly 32 bits for every instruction)?",
                    "options": [
                        { "text": "It simplifies instruction fetch and decoding, allowing the CPU to easily pipeline the next instruction before the current one finishes decoding", "isCorrect": True },
                        { "text": "Memory sticks can only store 32-bit numbers", "isCorrect": False },
                        { "text": "Variable length instructions cause electrical fires", "isCorrect": False },
                        { "text": "It eliminates the need for an ALU", "isCorrect": False }
                    ],
                    "explanation": "Fixed-length instructions allow the processor to know the exact boundary of the next instruction immediately, enabling rapid, parallel instruction fetch in a pipeline."
                }
            ]
        },
        {
            "title": "CPU Control Unit: Hardwired vs. Microprogrammed Design",
            "description": "Examine the two fundamental control unit architectures: high-speed hardwired state machines vs. flexible microprogrammed control memory.",
            "order": 4,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Two Schools of Control Design",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Orchestrator's Dilemma\n\nThe Control Unit must output dozens of synchronized control signals every clock cycle (e.g., `MAR_load`, `PC_increment`, `ALU_add`, `Memory_read`). How do we generate this complex timing choreography?\n\n1. **Hardwired Control Unit**: Built entirely using physical logic gates, flip-flop state registers, and decoders. It is extremely fast, but hardwired into the silicon permanently — changes require replacing the chip!\n2. **Microprogrammed Control Unit**: Maurice Wilkes' breakthrough idea: treat control generation as software! Store micro-instructions (control words) inside an on-chip **Control Read-Only Memory (ROM)**. To update or fix a bug, you simply update the microcode!"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566934109-hardwired_control_unit.png",
                            "title": "Figure 11: Hardwired Control Unit State Machine Architecture"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Horizontal vs. Vertical Microprogramming",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Microinstruction Formats\n\n* **Horizontal Microprogramming**: Every bit in the control word directly controls one physical wire/signal.  \n  * *Advantage*: Zero decode delay, maximum parallelism.  \n  * *Disadvantage*: Very wide control words (e.g., 64 to 128+ bits), wasting expensive ROM space.\n* **Vertical Microprogramming**: Control signals are grouped into encoded fields (e.g., 3 bits feed a 3-to-8 decoder to activate 1 of 8 ALU functions).  \n  * *Advantage*: Much narrower control words (e.g., 16 to 32 bits), compact ROM.  \n  * *Disadvantage*: Requires decoder gates, introducing slight propagation delay."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566935367-microprogrammed_control_unit.png",
                            "title": "Figure 12: Microprogrammed Control Unit Organization"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=UVumk3Vc1Fo",
                            "title": "Neso Academy - ALU, Data Path & Control Unit"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "CU Check",
                    "quiz": {
                        "question": "What is the primary advantage of a Hardwired Control Unit over a Microprogrammed Control Unit?",
                        "options": [
                            { "text": "Significantly higher operational speed because control signals propagate directly through combinational logic gates without ROM read latency", "isCorrect": True },
                            { "text": "It is much easier to modify after manufacturing", "isCorrect": False },
                            { "text": "It requires less chip area for complex CISC instruction sets", "isCorrect": False },
                            { "text": "It eliminates the need for an instruction register", "isCorrect": False }
                        ],
                        "explanation": "Hardwired control circuits operate at raw silicon switching speeds without the clock delay of accessing internal control ROM, making them the preferred choice for high-speed RISC processors."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "In a microprogrammed control unit, what special register holds the address of the next microinstruction to be fetched from Control ROM?",
                    "options": [
                        { "text": "Control Address Register (CAR) / Microprogram Sequencer", "isCorrect": True },
                        { "text": "Program Counter (PC)", "isCorrect": False },
                        { "text": "Stack Pointer (SP)", "isCorrect": False },
                        { "text": "Index Register (IX)", "isCorrect": False }
                    ],
                    "explanation": "The Control Address Register (CAR) tracks the address inside internal Control ROM (micro-memory), while the standard PC tracks instructions in main system RAM."
                },
                {
                    "question": "If a horizontal microinstruction uses 48 unencoded control bits and a vertical version groups these into 6 independent fields of 8 mutually exclusive actions each, how many bits does the vertical microinstruction require?",
                    "options": [
                        { "text": "18 bits (6 fields x 3 bits each)", "isCorrect": True },
                        { "text": "24 bits", "isCorrect": False },
                        { "text": "12 bits", "isCorrect": False },
                        { "text": "48 bits", "isCorrect": False }
                    ],
                    "explanation": "To select 1 of 8 actions in each field requires log2(8) = 3 bits. For 6 fields: 6 * 3 = 18 bits, reducing the word width from 48 bits down to 18 bits."
                }
            ]
        }
    ]
}
