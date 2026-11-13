module1 = {
    "title": "Module 1: Functional Blocks & The Von Neumann Machine",
    "description": "Understand the classical anatomy of a digital computer, the stored-program concept, system bus architecture, and the fundamental instruction cycle.",
    "order": 1,
    "capstoneGoal": "Deconstruct a computer into its five functional blocks, differentiate Von Neumann and Harvard paradigms, calculate addressable memory space, and trace the instruction fetch-decode-execute cycle.",
    "capstoneDifficulty": "medium",
    "topics": [
        {
            "title": "The Classical Computer Anatomy: 5 Functional Units",
            "description": "Examine the five functionally independent building blocks that constitute every modern digital computer.",
            "order": 1,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Restaurant Kitchen Analogy",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Commercial Kitchen Analogy\n\nTo understand how computer hardware is organized, picture a busy restaurant kitchen:\n\n1. **Input (The Waiter)**: Takes orders from customers and delivers raw ingredients from suppliers into the kitchen.\n2. **Memory (The Pantry & Prep Shelf)**: Stores the recipe books (programs) and ingredients (data) ready for fast access.\n3. **ALU (The Line Cook Station)**: Chops, blends, and fries — the physical station where actual cooking (arithmetic and logical computation) takes place.\n4. **Control Unit (The Executive Head Chef)**: Reads the recipe step by step, directs the line cooks, orchestrates the timers, and ensures orders are completed in correct sequence.\n5. **Output (The Serving Hatch)**: Delivers finished meals out to the waiting patrons in the dining room."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "The Five Functional Units Defined",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Hardware Functional Units\n\n* **Input Unit**: Accepts coded binary signals from human operators (keyboards, mouse, touchscreens) or digital sensors.\n* **Memory Unit**: Stores instructions and operands. Divided into fast primary memory (RAM) and large-capacity secondary memory (SSD/HDD).\n* **Arithmetic & Logic Unit (ALU)**: Contains combinational circuits (adders, comparators, bitwise shifters) that execute arithmetic operations (+, -, *, /) and logical tests (AND, OR, NOT, comparisons).\n* **Output Unit**: Converts processed binary results into human-perceptible forms (monitors, speakers, printers) or network signals.\n* **Control Unit (CU)**: Generates precise electrical timing and control signals that coordinate every functional unit in lockstep."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566926016-functional_units.png",
                            "title": "Figure 1: Basic Functional Units of a Digital Computer"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=Ol8D69VKX2k",
                            "title": "Neso Academy - Introduction to Computer Organization and Architecture"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Checkpoint Quiz",
                    "quiz": {
                        "question": "Which functional unit is responsible for decoding instructions and sending synchronization control signals across the computer?",
                        "options": [
                            { "text": "Control Unit (CU)", "isCorrect": True },
                            { "text": "Arithmetic and Logic Unit (ALU)", "isCorrect": False },
                            { "text": "Input Unit", "isCorrect": False },
                            { "text": "Random Access Memory (RAM)", "isCorrect": False }
                        ],
                        "explanation": "The Control Unit acts as the supervisor; it fetches and decodes instructions, then pulses control signals to coordinate the ALU, memory, and I/O devices."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "Which two functional units together constitute the Central Processing Unit (CPU)?",
                    "options": [
                        { "text": "Arithmetic & Logic Unit (ALU) and Control Unit (CU)", "isCorrect": True },
                        { "text": "Primary Memory and Secondary Storage", "isCorrect": False },
                        { "text": "Input Unit and Output Unit", "isCorrect": False },
                        { "text": "Control Unit and System Bus", "isCorrect": False }
                    ],
                    "explanation": "The core of the CPU is composed of the ALU (computational engine) and the Control Unit (orchestrator), along with internal registers."
                },
                {
                    "question": "Why are programs and data both stored in the memory unit prior to CPU execution?",
                    "options": [
                        { "text": "Because electronic primary memory operates at electronic speeds that match processor requirements, unlike slow external I/O devices", "isCorrect": True },
                        { "text": "Because the ALU cannot read electronic signals directly", "isCorrect": False },
                        { "text": "Because input devices do not produce binary numbers", "isCorrect": False },
                        { "text": "Because electricity cannot travel through copper wires without memory buffering", "isCorrect": False }
                    ],
                    "explanation": "Primary memory operates at electronic speeds directly matched to the CPU clock, eliminating the millions-of-cycles latency of external mechanical or peripheral I/O."
                }
            ]
        },
        {
            "title": "The Von Neumann Architecture vs. Harvard Architecture",
            "description": "Compare the seminal stored-program Von Neumann architecture against Harvard architecture, and understand the famous Von Neumann bottleneck.",
            "order": 2,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Stored-Program Revolution",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Stored-Program Concept\n\nBefore mathematician John von Neumann proposed this model in 1945, early computers (like the ENIAC) had to be **manually rewired** with patch cables and switches every time you wanted to run a different calculation! Reprogramming took days.\n\nVon Neumann's breakthrough idea was deceptively simple:\n> **Treat program instructions and program data as the same kind of binary bits, stored together in a single shared read/write memory.**\n\nTo change what the computer does, you don't rewire anything — you simply load a different list of numbers into memory!"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566927228-von_neumann_architecture.png",
                            "title": "Figure 2: Von Neumann Model Organization"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Von Neumann vs. Harvard Architecture",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Architectural Comparison\n\n| Feature | Von Neumann Architecture | Harvard Architecture |\n|---|---|---|\n| **Memory Structure** | Single unified memory for both instructions and data | Separate physical memories for instructions and data |\n| **Bus System** | Single shared bus for instructions and operands | Independent buses for instruction fetch and data transfer |\n| **Simultaneous Access** | Cannot fetch instruction and data at the same time | Can fetch instruction and access operand simultaneously |\n| **Hardware Complexity** | Simpler, lower pin count, cheaper | More complex, higher pin count, higher bandwidth |\n| **Common Usage** | General-purpose CPUs (desktop, laptops, servers) | Digital Signal Processors (DSPs), microcontrollers (PIC, AVR), and internal L1 CPU caches |"
                        },
                        {
                            "type": "text",
                            "content": "### The Von Neumann Bottleneck\n\nBecause instructions and data must travel over the **same shared physical bus**, the processor frequently sits idle waiting for memory transfers to complete. This throughput restriction is known as the **Von Neumann Bottleneck**.\n\nModern CPUs mitigate this by placing separate **L1 Instruction Caches (I-Cache)** and **L1 Data Caches (D-Cache)** on chip — effectively creating a *Modified Harvard Architecture* internally while maintaining a unified Von Neumann memory interface externally!"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=GRInNLx3Tug",
                            "title": "Neso Academy - Basics of Computer Architecture"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Concept Quiz",
                    "quiz": {
                        "question": "What is the primary cause of the 'Von Neumann Bottleneck' in computer systems?",
                        "options": [
                            {
                                "text": "The shared single bus between CPU and memory forces instructions and data to be transferred sequentially rather than simultaneously.",
                                "isCorrect": True
                            },
                            {
                                "text": "Transistors inside the ALU overheat when performing multiplication.",
                                "isCorrect": False
                            },
                            {
                                "text": "Program counters can only count up to 256.",
                                "isCorrect": False
                            },
                            {
                                "text": "Registers cannot store negative numbers.",
                                "isCorrect": False
                            }
                        ],
                        "explanation": "Because instructions and data share a single memory bus, the CPU cannot fetch a new instruction while simultaneously reading or writing a data operand in main memory."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "How does Harvard architecture avoid the structural conflict of fetching an instruction while accessing data?",
                    "options": [
                        { "text": "By employing physically separated memories and dedicated buses for instructions and data", "isCorrect": True },
                        { "text": "By increasing the clock speed of the ALU by 10x", "isCorrect": False },
                        { "text": "By executing all instructions backwards", "isCorrect": False },
                        { "text": "By eliminating registers entirely from the CPU core", "isCorrect": False }
                    ],
                    "explanation": "Harvard architecture has separate memory arrays and independent buses for instructions and data, allowing simultaneous memory access in the same clock cycle."
                },
                {
                    "question": "Modern microprocessors typically use which architectural strategy in their internal cache hierarchy?",
                    "options": [
                        { "text": "Modified Harvard: Separate Level-1 instruction and data caches, backed by a unified main memory", "isCorrect": True },
                        { "text": "Pure Von Neumann with no cache memories", "isCorrect": False },
                        { "text": "Pure Harvard with physically separate external RAM sticks for instructions and data", "isCorrect": False },
                        { "text": "Analogue computing for arithmetic and digital only for control", "isCorrect": False }
                    ],
                    "explanation": "Modern processors use split L1 caches (L1-I and L1-D) to eliminate pipeline contention while retaining a unified memory space in RAM for ease of programming."
                }
            ]
        },
        {
            "title": "The System Bus: Data, Address, and Control Highways",
            "description": "Understand the tri-part bus structure connecting CPU, Memory, and I/O, and learn how to calculate maximum addressable memory capacity.",
            "order": 3,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The 3 Dedicated Highways",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Postal Highway Analogy\n\nImagine a large warehouse dispatching mail:\n1. **Address Bus (The GPS Coordinates)**: Tells the couriers *which specific house* or shelf to visit. It is **unidirectional** — the CPU dictates the address.\n2. **Data Bus (The Delivery Truck Payload)**: Carries the actual contents of the letter or package. It is **bidirectional** — data travels into the CPU (read) or out to memory/peripherals (write).\n3. **Control Bus (The Traffic Signal & Work Order)**: Commands whether to 'Deliver' (Write) or 'Pick Up' (Read), along with clock synchronization pulses and ready acknowledgments."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566926698-processor_memory_bus.png",
                            "title": "Figure 3: Interconnection Bus between Processor and Memory"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Calculation Formula: Address Bus vs. Memory Capacity",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Mathematical Formulation\n\nIf a microprocessor has an address bus of width $k$ bits, it can output $2^k$ distinct memory addresses.\n\nIf the memory is **byte-addressable** (each address holds 1 byte = 8 bits), then:\n\n$$\\text{Max Addressable Memory Capacity} = 2^k \\text{ bytes}$$\n\n$$\\begin{aligned}\n2^{10} \\text{ bytes} &= 1 \\text{ KB} (1,024 \\text{ B}) \\\\\n2^{20} \\text{ bytes} &= 1 \\text{ MB} (1,048,576 \\text{ B}) \\\\\n2^{30} \\text{ bytes} &= 1 \\text{ GB} (1,073,741,824 \\text{ B}) \\\\\n2^{32} \\text{ bytes} &= 4 \\text{ GB} \\\\\n2^{64} \\text{ bytes} &= 16 \\text{ Exabytes} (18.4 \\times 10^{18} \\text{ B})\n\\end{aligned}$$"
                        },
                        {
                            "type": "text",
                            "content": "### Worked Example: The Historic 8086 Processor\n\n**Problem**: The Intel 8086 microprocessor has a 20-bit address bus and a 16-bit data bus. How much memory can it directly address, and how much data can it transfer in a single memory cycle?\n\n**Step 1: Addressable Capacity**\n$$\\text{Address lines } k = 20 \\implies \\text{Number of locations} = 2^{20} = 1,048,576$$\nWith byte-addressable memory:\n$$\\text{Total capacity} = 2^{20} \\times 1 \\text{ byte} = 1 \\text{ Megabyte (1 MB)}$$\n\n**Step 2: Bus Transfer Width**\n$$\\text{Data lines} = 16 \\text{ bits} = 2 \\text{ bytes (1 word)}$$\nIn one cycle, the 8086 can transfer up to 16 bits (2 bytes) of data simultaneously."
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Bus Width Quiz",
                    "quiz": {
                        "question": "A custom embedded processor has a 24-bit address bus and an 8-bit data bus. What is its maximum directly addressable byte memory capacity?",
                        "options": [
                            { "text": "16 MB", "isCorrect": True },
                            { "text": "24 MB", "isCorrect": False },
                            { "text": "8 MB", "isCorrect": False },
                            { "text": "64 MB", "isCorrect": False }
                        ],
                        "explanation": "2^24 = 2^4 * 2^20 = 16 * 1 MB = 16 Megabytes."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "How many address lines are required to directly address a 4 GB byte-addressable physical memory space?",
                    "options": [
                        { "text": "32 lines", "isCorrect": True },
                        { "text": "30 lines", "isCorrect": False },
                        { "text": "64 lines", "isCorrect": False },
                        { "text": "16 lines", "isCorrect": False }
                    ],
                    "explanation": "Calculation: 4 GB = 4 * 2^30 bytes = 2^2 * 2^30 = 2^32 bytes. To uniquely address 2^32 locations requires exactly log2(2^32) = 32 address lines."
                },
                {
                    "question": "If a memory module has a capacity of 512 MB and is word-addressable where 1 word = 4 bytes (32 bits), how many address bits are needed to address all words?",
                    "options": [
                        { "text": "27 bits", "isCorrect": True },
                        { "text": "29 bits", "isCorrect": False },
                        { "text": "28 bits", "isCorrect": False },
                        { "text": "26 bits", "isCorrect": False }
                    ],
                    "explanation": "Step 1: Total words = (512 MB) / (4 bytes/word) = (512 * 2^20 bytes) / 4 bytes = 128 * 2^20 words = 2^7 * 2^20 = 2^27 words. Step 2: log2(2^27) = 27 address bits."
                },
                {
                    "question": "Why is the CPU address bus unidirectional while the data bus is bidirectional?",
                    "options": [
                        { "text": "The CPU exclusively generates memory/IO locations, whereas data must flow both into the CPU (reads) and out of the CPU (writes)", "isCorrect": True },
                        { "text": "Addresses require higher electrical voltage than data", "isCorrect": False },
                        { "text": "Memory modules are incapable of receiving electrical signals", "isCorrect": False },
                        { "text": "The control bus blocks signals traveling towards the CPU on the address bus", "isCorrect": False }
                    ],
                    "explanation": "In standard master-slave bus topologies, the CPU acts as the bus master and originates addresses, while data must travel in both directions (input and output)."
                }
            ]
        },
        {
            "title": "The Microscopic Step: Inside the Basic Instruction Cycle",
            "description": "Trace the fundamental Fetch-Decode-Execute instruction cycle through internal CPU registers: PC, MAR, MDR, and IR.",
            "order": 4,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Key Internal Registers",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Specialized Worker Registers\n\nInside the CPU are dedicated internal registers that make instruction execution possible:\n\n1. **Program Counter (PC)**: Holds the memory address of the *next* instruction to be fetched. It automatically increments after each fetch.\n2. **Memory Address Register (MAR)**: Connected directly to the CPU's address bus pins. Holds the address being accessed in RAM.\n3. **Memory Data Register (MDR)**: Connected directly to the CPU's data bus pins. Holds data read from or about to be written to RAM.\n4. **Instruction Register (IR)**: Holds the current machine instruction opcode while it is being decoded by the Control Unit."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566933553-instruction_cycle_flowchart.png",
                            "title": "Figure 4: Complete Instruction Execution Cycle Flowchart"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "The 3 Stages of the Machine Cycle",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step Micro-Operations\n\n```text\n+-------------------------------------------------------------+\n| 1. FETCH STAGE:                                             |\n|    T1: MAR <- PC                                            |\n|    T2: MDR <- Memory[MAR],  PC <- PC + 1                     |\n|    T3: IR  <- MDR                                           |\n+-------------------------------------------------------------+\n| 2. DECODE STAGE:                                            |\n|    Control Unit decodes the opcode in IR                    |\n|    Determines required operands and addressing mode         |\n+-------------------------------------------------------------+\n| 3. EXECUTE STAGE:                                           |\n|    ALU performs required operation                          |\n|    Result is written back to destination register or RAM    |\n+-------------------------------------------------------------+\n```"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Register Tracing Quiz",
                    "quiz": {
                        "question": "During the instruction fetch phase, what happens immediately after the instruction bytes arrive from memory into the MDR?",
                        "options": [
                            { "text": "The instruction is loaded into the Instruction Register (IR) for decoding.", "isCorrect": True },
                            { "text": "The ALU immediately multiplies the instruction by 2.", "isCorrect": False },
                            { "text": "The computer powers down into sleep mode.", "isCorrect": False },
                            { "text": "The data is permanently written to the hard drive.", "isCorrect": False }
                        ],
                        "explanation": "Once fetched from memory into MDR, the instruction opcode is placed into the Instruction Register (IR), where the Control Unit can decode its bit fields."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "What is the primary role of the Program Counter (PC) during the instruction cycle?",
                    "options": [
                        { "text": "To keep track of the memory address of the next instruction waiting to be executed", "isCorrect": True },
                        { "text": "To count how many times the user clicked the mouse", "isCorrect": False },
                        { "text": "To calculate arithmetic square roots", "isCorrect": False },
                        { "text": "To store intermediate results of ALU operations", "isCorrect": False }
                    ],
                    "explanation": "The Program Counter points to the next instruction in sequence, auto-incrementing unless modified by a jump or branch instruction."
                },
                {
                    "question": "In Register Transfer Language, which sequence represents a valid Instruction Fetch phase?",
                    "options": [
                        { "text": "MAR <- PC; MDR <- M[MAR], PC <- PC + 1; IR <- MDR", "isCorrect": True },
                        { "text": "IR <- PC; PC <- M[IR]; ALU <- MDR", "isCorrect": False },
                        { "text": "MDR <- PC; MAR <- MDR; PC <- IR", "isCorrect": False },
                        { "text": "ALU <- PC; M[MAR] <- ALU; IR <- PC", "isCorrect": False }
                    ],
                    "explanation": "The address in PC moves to MAR; memory at that address is read into MDR while PC increments; finally MDR transfers the opcode into IR."
                }
            ]
        }
    ]
}
