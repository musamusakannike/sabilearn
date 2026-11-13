module6 = {
    "title": "Module 6: Pipelining & High-Performance Architectures",
    "description": "Uncover how modern processors achieve massive throughput through instruction pipelining, resolve structural/data/control hazards, and scale across multicore multiprocessors with cache coherency.",
    "order": 6,
    "capstoneGoal": "Calculate pipeline speedup, efficiency, and throughput, resolve RAW/WAR/WAW hazards via forwarding, compute branch penalties on effective CPI, and trace the MESI cache coherence protocol.",
    "capstoneDifficulty": "hard",
    "topics": [
        {
            "title": "Pipelining Fundamentals & Performance Metrics",
            "description": "Understand the assembly-line principle of pipelining and calculate pipeline execution time, speedup ($S$), efficiency ($\\eta$), and throughput ($TP$).",
            "order": 1,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Factory Assembly Line Analogy",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Industrial Laundry Analogy\n\nImagine doing laundry for 4 roommates. Each batch takes:\n* Washing: 30 mins\n* Drying: 40 mins\n* Folding: 20 mins\n* Putting away: 10 mins\n* **Total per load = 100 mins**\n\nIf you wait for Roommate 1's laundry to be completely washed, dried, folded, and put away before starting Roommate 2, 4 loads take $4 \\times 100 = \\mathbf{400\\text{ mins}}$ (Non-pipelined).\n\n**The Pipelined Approach**: As soon as Load 1 moves to the dryer, immediately put Load 2 into the washing machine! After an initial startup delay, **one complete load finishes every 40 minutes** (the slowest stage period). Pipelining doesn't speed up an individual task — it dramatically multiplies **system throughput**!"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566939089-instruction_pipeline.png",
                            "title": "Figure 19: Instruction Pipeline Stages and Inter-Segment Registers"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=j8RKaeANQ-o",
                            "title": "Neso Academy - Instruction Pipelining"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Mathematical Formulations of Pipelining",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Mathematical Formulas ($k$ stages, $n$ instructions)\n\nLet clock period $t_p = \\max(t_i) + d$ (where $d$ is inter-segment register delay).\n\n1. **Total Time on $k$-stage Pipeline ($T_k$)**:\n   $$T_k = (k + n - 1) \\cdot t_p$$\n   *(Takes $k$ cycles to fill the pipe for instruction 1, then 1 instruction completes per cycle for the remaining $n-1$ instructions).*\n\n2. **Total Time Non-Pipelined ($T_1$)**:\n   $$T_1 = n \\cdot k \\cdot t_p$$\n\n3. **Speedup ($S$)**:\n   $$S = \\frac{T_1}{T_k} = \\frac{n \\cdot k \\cdot t_p}{(k + n - 1) \\cdot t_p} = \\frac{n \\cdot k}{k + n - 1}$$\n   As $n \\to \\infty$, the maximum theoretical speedup equals the number of stages:  \n   $$\\lim_{n \\to \\infty} S = \\mathbf{k}$$\n\n4. **Pipeline Efficiency ($\\eta$)**:\n   $$\\eta = \\frac{S}{k} = \\frac{n}{k + n - 1}$$\n\n5. **Throughput ($TP$)**:\n   $$TP = \\frac{n}{T_k} = \\frac{n}{(k + n - 1) \\cdot t_p} \\quad (\\text{instructions per second})$$"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: 5-Stage Pipeline Performance",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Problem: 5-Stage Pipeline Processing 100 Instructions\n\n* Number of stages $k = 5$ (IF, ID, EX, MEM, WB)\n* Number of instructions $n = 100$\n* Clock period $t_p = 2\\text{ ns}$ ($500\\text{ MHz}$)\n\n**1. Calculate Pipelined Execution Time ($T_k$)**:\n$$T_5 = (5 + 100 - 1) \\times 2\\text{ ns} = 104 \\times 2\\text{ ns} = \\mathbf{208\\text{ ns}}$$\n\n**2. Calculate Non-Pipelined Execution Time ($T_1$)**:\n$$T_1 = 100 \\times 5 \\times 2\\text{ ns} = 500 \\times 2\\text{ ns} = \\mathbf{1000\\text{ ns}}$$\n\n**3. Calculate Actual Speedup ($S$)**:\n$$S = \\frac{T_1}{T_5} = \\frac{1000\\text{ ns}}{208\\text{ ns}} = \\mathbf{4.808}$$\n\n**4. Calculate Efficiency ($\\eta$)**:\n$$\\eta = \\frac{S}{k} = \\frac{4.808}{5} = 0.9615 = \\mathbf{96.15\\%}$$\n\n**5. Calculate Throughput ($TP$)**:\n$$TP = \\frac{100}{208 \\times 10^{-9}\\text{ s}} = \\mathbf{480.77 \\times 10^6 \\text{ instructions/sec (480.8 MIPS)}}$$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Pipeline Check",
                    "quiz": {
                        "question": "What is the theoretical maximum speedup attainable by a 6-stage instruction pipeline as the number of instructions approaches infinity?",
                        "options": [
                            { "text": "6x", "isCorrect": True },
                            { "text": "36x", "isCorrect": False },
                            { "text": "5x", "isCorrect": False },
                            { "text": "Infinite speedup", "isCorrect": False }
                        ],
                        "explanation": "As the number of instructions n becomes very large, the speedup S = (n*k)/(k + n - 1) approaches k (where k is the number of pipeline stages, which is 6)."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "How many clock cycles are required to execute 50 instructions on an ideal 4-stage pipeline with no stalls or hazards?",
                    "options": [
                        { "text": "53 clock cycles", "isCorrect": True },
                        { "text": "200 clock cycles", "isCorrect": False },
                        { "text": "50 clock cycles", "isCorrect": False },
                        { "text": "54 clock cycles", "isCorrect": False }
                    ],
                    "explanation": "Formula: Cycles = k + n - 1 = 4 + 50 - 1 = 53 clock cycles."
                },
                {
                    "question": "If the delay of each pipeline segment is 10 ns, 15 ns, 25 ns, and 12 ns, and the inter-segment latch delay is 3 ns, what is the minimum clock cycle time tp for the pipeline?",
                    "options": [
                        { "text": "28 ns", "isCorrect": True },
                        { "text": "25 ns", "isCorrect": False },
                        { "text": "65 ns", "isCorrect": False },
                        { "text": "15 ns", "isCorrect": False }
                    ],
                    "explanation": "The clock period is dictated by the slowest stage plus register delay: tp = max(ti) + d = 25 ns + 3 ns = 28 ns."
                },
                {
                    "question": "Why does a pipelined CPU require inter-segment pipeline registers between each adjacent stage?",
                    "options": [
                        { "text": "To isolate stages from each other and store intermediate results so each stage can process a different instruction during the same clock cycle", "isCorrect": True },
                        { "text": "To heat the processor during cold weather", "isCorrect": False },
                        { "text": "To count the number of instructions fetched from the hard drive", "isCorrect": False },
                        { "text": "To convert analog signals to digital voltages", "isCorrect": False }
                    ],
                    "explanation": "Pipeline latches hold the outputs of stage i stable for stage i+1 to read during the next clock pulse, preventing signal contamination across stages."
                }
            ]
        },
        {
            "title": "Pipeline Hazards: Structural & Data Hazards",
            "description": "Diagnose structural resource contention, data dependencies (RAW, WAR, WAW), and learn how hardware forwarding and stalls resolve them.",
            "order": 2,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Three Pipeline Roadblocks",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### What Are Pipeline Hazards?\n\nA **Hazard** is any condition that prevents the next instruction from executing in its designated clock cycle, forcing the pipeline to insert idle cycles called **Stalls (or Bubbles)**.\n\nThere are 3 major classes of hazards:\n1. **Structural Hazards**: Two instructions need the same physical hardware resource at the same time.\n2. **Data Hazards**: An instruction depends on the result of an earlier instruction that is still in flight in the pipeline.\n3. **Control Hazards**: A branch instruction changes the Program Counter, rendering already-fetched instructions invalid."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Data Hazards: RAW, WAR, and WAW",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Three Types of Data Dependencies\n\n* **RAW (Read-After-Write / True Dependency)**:\n  ```text\n  I1: ADD R1, R2, R3    (Writes result to R1 in Cycle 5)\n  I2: SUB R4, R1, R5    (Needs to read R1 in Cycle 3!)\n  ```\n  *I2 attempts to read $R_1$ before $I_1$ has written it. This is the most common hazard in software.*\n\n* **WAR (Write-After-Read / Anti-Dependency)**:\n  $I_2$ tries to overwrite an operand before an earlier $I_1$ has finished reading it.\n\n* **WAW (Write-After-Write / Output Dependency)**:\n  $I_2$ tries to overwrite an output register before $I_1$ writes to it, which would leave the wrong final value in the register."
                        },
                        {
                            "type": "text",
                            "content": "### Solution: Hardware Forwarding (Bypassing)\n\nInstead of waiting for $I_1$ to write its result back to the register file in stage 5 (Write-Back), a specialized internal feedback bus routes the result directly from the output of the ALU (Execute stage) straight to the input of the next instruction's ALU stage!\n\nForwarding eliminates data stalls in almost all ALU-to-ALU operations."
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Data Hazard Quiz",
                    "quiz": {
                        "question": "Which data hazard represents a true data dependency where an instruction needs an operand produced by an immediately preceding instruction?",
                        "options": [
                            { "text": "RAW (Read-After-Write)", "isCorrect": True },
                            { "text": "WAR (Write-After-Read)", "isCorrect": False },
                            { "text": "WAW (Write-After-Write)", "isCorrect": False },
                            { "text": "Structural Resource Hazard", "isCorrect": False }
                        ],
                        "explanation": "RAW is a true dependency because program correctness strictly requires reading the updated value produced by the earlier write."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "How does a modern processor eliminate the Structural Hazard caused by the instruction fetch stage (IF) and the memory operand access stage (MEM) attempting to access memory at the same time?",
                    "options": [
                        { "text": "By implementing separate Level-1 Instruction (I-Cache) and Data (D-Cache) memories (Modified Harvard Architecture)", "isCorrect": True },
                        { "text": "By deleting all memory read instructions", "isCorrect": False },
                        { "text": "By slowing the clock frequency down to 1 MHz", "isCorrect": False },
                        { "text": "By running instructions in reverse order", "isCorrect": False }
                    ],
                    "explanation": "Splitting the L1 cache into independent I-Cache and D-Cache allows simultaneous instruction fetching and data reading/writing without any resource contention."
                },
                {
                    "question": "Consider the code sequence: 'LOAD R1, 0[R2]' followed immediately by 'ADD R3, R1, R4'. Can hardware forwarding eliminate all stall cycles in a standard 5-stage pipeline?",
                    "options": [
                        { "text": "No, because data from a LOAD is only available at the end of the MEM stage, requiring at least 1 unavoidable stall cycle (Load-Use Delay)", "isCorrect": True },
                        { "text": "Yes, forwarding completely eliminates all stalls for load instructions", "isCorrect": False },
                        { "text": "No, it requires 5 stall cycles", "isCorrect": False },
                        { "text": "Yes, because the ALU generates load data", "isCorrect": False }
                    ],
                    "explanation": "In a load-use hazard, data is not retrieved from cache until the end of the MEM stage, which arrives too late for the immediately following EX stage, necessitating 1 stall cycle even with forwarding."
                }
            ]
        },
        {
            "title": "Control Hazards & Branch Prediction",
            "description": "Understand the impact of branch instructions on the pipeline, calculate branch penalties on effective CPI, and explore static and dynamic branch prediction.",
            "order": 3,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Fog of the Fork: Control Hazards",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### What Happens When Code Branches?\n\nA standard pipeline assumes code flows sequentially ($PC, PC+4, PC+8$). But what happens when the CPU encounters `BEQ R1, R2, TARGET`?\n\nThe processor doesn't know whether the branch will be taken (and what the target address is) until Stage 3 (Execute) or Stage 4 (Memory)!\n\nBy that time, the pipeline has already speculatively fetched the next two sequential instructions. If the branch is taken, those speculative instructions are useless and must be **flushed (discarded)**, creating a **Branch Penalty** of wasted clock cycles."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Mathematical Formulation: Effective CPI with Branches",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Effective CPI Formula\n\n$$\\text{CPI}_{\\text{avg}} = \\text{CPI}_{\\text{ideal}} + (\\text{Branch Frequency } f_{\\text{branch}} \\times \\text{Branch Penalty } P)$$\n\n### Branch Prediction Strategies\n1. **Static Branch Prediction**: Fixed policy implemented in hardware.  \n   * *Example*: 'Predict all backward branches TAKEN (loops), predict forward branches NOT TAKEN (error checks).'\n2. **Dynamic Branch Prediction**: Hardware tracks runtime branch behavior using a **Branch History Table (BHT)** or **2-bit Saturating Counter State Machine**:\n   * States: Strongly Not Taken (00), Weakly Not Taken (01), Weakly Taken (10), Strongly Taken (11).\n   * Must be wrong twice consecutively to change its prediction! Achieves $> 90-95\\%$ prediction accuracy in modern processors."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Impact of Branch Stalls on CPI",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Step-by-Step Problem\n\n* Ideal $\\text{CPI}_{\\text{ideal}} = 1.0$\n* $20\\%$ of all executed instructions are conditional branches ($f_{\\text{branch}} = 0.20$)\n* Unconditional branch penalty without prediction is $3\\text{ stall cycles}$ ($P = 3$)\n\n**1. Calculate CPI Without Branch Prediction**:\n$$\\text{CPI}_{\\text{avg}} = 1.0 + (0.20 \\times 3) = 1.0 + 0.60 = \\mathbf{1.60}$$\n*Slowdown*: The processor takes $1.60$ cycles per instruction instead of $1.0$, a **$37.5\\%$ reduction in execution throughput**!\n\n**2. Calculate CPI With 90% Accurate Dynamic Branch Predictor**:\n* Misprediction rate $= 10\\% = 0.10$\n* Effective penalty $= 0.10 \\times 3\\text{ cycles} = 0.3\\text{ cycles}$\n$$\\text{CPI}_{\\text{avg}} = 1.0 + (0.20 \\times 0.3) = 1.0 + 0.06 = \\mathbf{1.06}$$\n*Performance Recovery*: Branch prediction restores the processor to near-ideal throughput ($1.06$ vs. $1.60$)!"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Branch Check",
                    "quiz": {
                        "question": "Why is a 2-bit saturating counter branch predictor preferred over a 1-bit predictor in inner loops?",
                        "options": [
                            { "text": "A 1-bit predictor mispredicts twice on every loop exit and re-entry, whereas a 2-bit counter requires two consecutive mispredictions before switching state", "isCorrect": True },
                            { "text": "A 2-bit counter requires no electrical current", "isCorrect": False },
                            { "text": "A 1-bit predictor cannot count to zero", "isCorrect": False },
                            { "text": "A 2-bit counter doubles the size of cache memory", "isCorrect": False }
                        ],
                        "explanation": "A 1-bit predictor changes its mind on the single loop exit, causing a misprediction on the final iteration AND on the next time the loop starts. A 2-bit saturating counter absorbs the single exit without flipping its prediction."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "A processor has an ideal CPI of 1.0. If 25% of instructions are branches, and each branch causes a 2-cycle penalty when mispredicted, what is the average CPI if the branch predictor has an 80% accuracy rate?",
                    "options": [
                        { "text": "1.10", "isCorrect": True },
                        { "text": "1.50", "isCorrect": False },
                        { "text": "1.25", "isCorrect": False },
                        { "text": "1.05", "isCorrect": False }
                    ],
                    "explanation": "Misprediction rate = 1 - 0.80 = 0.20. Stalls per branch = 0.20 * 2 = 0.4 cycles. CPI_avg = 1.0 + (0.25 * 0.4) = 1.0 + 0.10 = 1.10."
                },
                {
                    "question": "What is a Branch Target Buffer (BTB)?",
                    "options": [
                        { "text": "An on-chip cache that stores the target jump address of recent branch instructions so the target can be fetched immediately during the IF stage", "isCorrect": True },
                        { "text": "A physical switch on the motherboard", "isCorrect": False },
                        { "text": "A software file saved on the hard drive", "isCorrect": False },
                        { "text": "A buffer that stores deleted emails", "isCorrect": False }
                    ],
                    "explanation": "The BTB caches predicted branch target addresses indexed by the instruction PC, allowing the CPU to redirect instruction fetch to the target address with zero stall cycles."
                },
                {
                    "question": "What software optimization technique allows a compiler to eliminate branch stalls by filling the instruction slot immediately following a branch with a useful instruction that executes regardless of branch outcome?",
                    "options": [
                        { "text": "Delayed Branching (Branch Delay Slot)", "isCorrect": True },
                        { "text": "Loop unrolling only", "isCorrect": False },
                        { "text": "Dynamic frequency scaling", "isCorrect": False },
                        { "text": "Memory paging", "isCorrect": False }
                    ],
                    "explanation": "In delayed branching architectures (such as classic MIPS and SPARC), the instruction in the delay slot is always executed while the branch target address is being computed, eliminating wasted stall cycles."
                }
            ]
        },
        {
            "title": "Parallel Processing, Multiprocessors & Cache Coherency",
            "description": "Explore Flynn's Taxonomy (SISD, SIMD, MIMD), Shared Memory Multiprocessors (UMA vs. NUMA), the Cache Coherence problem, and the MESI protocol.",
            "order": 4,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Flynn’s Taxonomy of Computer Architectures",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Classifying Computing Systems\n\nIn 1966, Michael Flynn categorized all computer systems based on the multiplicity of their **Instruction Streams** and **Data Streams**:\n\n1. **SISD (Single Instruction, Single Data)**: Traditional uniprocessor (e.g., classical 8086). One instruction executes on one data operand at a time.\n2. **SIMD (Single Instruction, Multiple Data)**: Vector processors, GPU shader cores, Intel AVX, ARM NEON. A single instruction (e.g., `VADD`) is broadcast simultaneously to dozens of ALUs executing on different array elements in lockstep.\n3. **MISD (Multiple Instruction, Single Data)**: Extremely rare; used primarily in redundant fault-tolerant systems (e.g., Space Shuttle flight computers where 3 computers run different algorithms on identical sensor data to cross-check).\n4. **MIMD (Multiple Instruction, Multiple Data)**: Modern multicore processors and supercomputing clusters. Multiple autonomous cores each execute independent instruction streams on independent data."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Shared Memory Multiprocessors: UMA vs. NUMA",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Memory Organization in Multicore Systems\n\n* **UMA (Uniform Memory Access / Symmetric Multiprocessor - SMP)**:\n  * All processors share physical memory through a common bus or crossbar switch.\n  * **Every core accesses any RAM address in the exact same amount of time**.\n* **NUMA (Non-Uniform Memory Access)**:\n  * Memory is physically partitioned among processors.\n  * Accessing **local memory** on a core's own socket is extremely fast (~20 ns), while accessing **remote memory** across the interconnect fabric is slower (~100 ns). Highly scalable to hundreds of cores."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566939546-uma_multiprocessor.png",
                            "title": "Figure 20: Uniform Memory Access (UMA) Shared Memory Multiprocessor"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "The Cache Coherence Problem & The MESI Protocol",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Incoherence Danger\n\nIn a multicore CPU, each core has its own private L1 cache. If Core 1 and Core 2 both read variable `X = 5` from RAM, and then Core 1 writes `X = 10` into its private L1 cache:\n> **Core 2's cache still holds the stale value `X = 5`!** This is the **Cache Coherence Problem**.\n\n### The Solution: Snooping & The MESI Protocol\nIn a **Snooping Protocol**, all cache controllers continuously 'snoop' (listen to) transactions on the shared bus. Every cache line is tagged with one of 4 **MESI** states:\n\n* **M - Modified**: Line is present *only* in this cache and is dirty (modified). Must write back before anyone else reads.\n* **E - Exclusive**: Line is present *only* in this cache, but is clean (matches main RAM).\n* **S - Shared**: Line is present in this cache and potentially other cores' caches; matches main RAM.\n* **I - Invalid**: Line contents are stale and cannot be used."
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=r_ZE1XVT8Ao",
                            "title": "Neso Academy - Cache Coherence Problem & Cache Coherency Protocols"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Coherency Quiz",
                    "quiz": {
                        "question": "Under the MESI cache coherence protocol, what state does a cache line transition to if another processor broadcasts a write-invalidate message on the bus for that memory address?",
                        "options": [
                            { "text": "Invalid (I)", "isCorrect": True },
                            { "text": "Modified (M)", "isCorrect": False },
                            { "text": "Shared (S)", "isCorrect": False },
                            { "text": "Exclusive (E)", "isCorrect": False }
                        ],
                        "explanation": "When another core writes to a shared address, it broadcasts an invalidation on the bus, forcing all other caches holding that line to mark their copy Invalid (I)."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "Which architecture in Flynn's Taxonomy best describes modern Graphic Processing Units (GPUs) executing shader kernels across thousands of vector threads?",
                    "options": [
                        { "text": "SIMD (Single Instruction, Multiple Data)", "isCorrect": True },
                        { "text": "SISD (Single Instruction, Single Data)", "isCorrect": False },
                        { "text": "MISD (Multiple Instruction, Single Data)", "isCorrect": False },
                        { "text": "Symmetric Multiprocessing (SMP)", "isCorrect": False }
                    ],
                    "explanation": "GPUs broadcast a single instruction across thousands of lockstep arithmetic execution units operating on distinct vertices, pixels, or matrix elements (SIMD/SIMT)."
                },
                {
                    "question": "What is the primary difference between UMA and NUMA multiprocessor systems?",
                    "options": [
                        { "text": "In UMA, memory access time is equal for all cores to all memory locations, whereas in NUMA, access time depends on whether the memory bank is local or remote to the requesting core", "isCorrect": True },
                        { "text": "UMA systems do not have cache memories", "isCorrect": False },
                        { "text": "NUMA systems only run on single-core processors", "isCorrect": False },
                        { "text": "UMA systems can only execute addition", "isCorrect": False }
                    ],
                    "explanation": "NUMA scales by assigning memory banks locally to processor nodes; local accesses are fast, while remote accesses across the interconnect incur higher latency."
                }
            ]
        }
    ]
}
