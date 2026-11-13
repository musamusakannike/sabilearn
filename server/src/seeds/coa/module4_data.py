module4 = {
    "title": "Module 4: Memory System Design & Cache Architecture",
    "description": "Explore the memory hierarchy pyramid, semiconductor RAM/ROM, cache mapping algorithms (direct, associative, set-associative), AMAT calculations, and virtual memory paging with TLB.",
    "order": 4,
    "capstoneGoal": "Partition physical memory addresses into Tag, Set, and Offset fields, compute multi-level Average Memory Access Time (AMAT), and calculate Effective Access Time for virtual memory translation.",
    "capstoneDifficulty": "hard",
    "topics": [
        {
            "title": "The Memory Hierarchy & Semiconductor Technologies",
            "description": "Understand the speed, cost, and capacity trade-offs that dictate the memory hierarchy, and compare SRAM, DRAM, ROM, and memory interleaving.",
            "order": 1,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Memory Hierarchy Pyramid",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Fundamental Engineering Trade-off\n\nEvery computer architect faces an immutable physics dilemma:\n> **Fast memory is prohibitively expensive and small; cheap, vast memory is excruciatingly slow.**\n\nTo solve this, modern computers organize storage as a multi-tiered hierarchy:\n\n```text\n       /\\         [ CPU Registers: < 1 ns, a few KB ]\n      /  \\        [ L1 / L2 / L3 Caches: 1-10 ns, MBs ]\n     /    \\       [ Main Memory (DRAM): ~50-100 ns, 8-64 GB ]\n    /      \\      [ Solid-State Storage (NVMe SSD): ~10-100 us, TBs ]\n   /________\\     [ Secondary HDD / Cloud: milliseconds to seconds ]\n```"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566936518-memory_hierarchy.png",
                            "title": "Figure 13: The Computer Memory Hierarchy Pyramid"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=lQcU4WwVALI",
                            "title": "Neso Academy - Memory Hierarchy & Interfacing"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "SRAM vs. DRAM & Memory Interleaving",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Semiconductor Memory Technologies\n\n1. **SRAM (Static RAM)**: Each bit is a 6-transistor bistable flip-flop. Very fast (~1 ns), retains data as long as power is applied (no refreshing needed). Used for **CPU Caches**.\n2. **DRAM (Dynamic RAM)**: Each bit consists of a single transistor and a microscopic capacitor (1T-1C cell). Incredibly dense and inexpensive, but capacitors leak charge within milliseconds! Requires periodic **refresh cycles**. Used for **System Main Memory (RAM)**.\n\n### Memory Interleaving\n\nTo overcome DRAM's cycle-time bottleneck, memory is divided into multiple independent memory modules:\n* **High-Order Interleaving**: Upper address bits select the memory module; consecutive addresses reside in the same module.\n* **Low-Order Interleaving**: Lower address bits select the module; **consecutive addresses reside in consecutive modules**. This allows multiple memory words to be fetched simultaneously in parallel!"
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566936993-memory_interleaving.png",
                            "title": "Figure 14: Multiple Module Memory Interleaving"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Memory Type Quiz",
                    "quiz": {
                        "question": "Why does Dynamic RAM (DRAM) require periodic refreshing while Static RAM (SRAM) does not?",
                        "options": [
                            { "text": "DRAM stores bits as electrical charges on tiny capacitors that naturally leak charge over time, whereas SRAM uses bistable cross-coupled transistor flip-flops", "isCorrect": True },
                            { "text": "DRAM chips are exposed to open air inside the computer case", "isCorrect": False },
                            { "text": "SRAM chips generate their own internal electricity from magnetic fields", "isCorrect": False },
                            { "text": "DRAM can only store odd numbers", "isCorrect": False }
                        ],
                        "explanation": "DRAM cells rely on capacitive charge storage, which dissipates within tens of milliseconds and must be refreshed through periodic read-write cycles."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "What is the primary advantage of Low-Order Memory Interleaving over High-Order Interleaving?",
                    "options": [
                        { "text": "It places consecutive memory addresses across different memory banks, enabling concurrent parallel access to sequential words", "isCorrect": True },
                        { "text": "It reduces the physical size of RAM modules by 50%", "isCorrect": False },
                        { "text": "It permanently prevents memory leaks in software", "isCorrect": False },
                        { "text": "It eliminates the need for an address bus", "isCorrect": False }
                    ],
                    "explanation": "Because consecutive bytes or instructions occupy alternating modules in low-order interleaving, the CPU can overlap access to multiple words simultaneously, hiding memory latency."
                },
                {
                    "question": "Which memory technology is volatile (loses contents when power is turned off)?",
                    "options": [
                        { "text": "Both SRAM and DRAM", "isCorrect": True },
                        { "text": "Flash Memory only", "isCorrect": False },
                        { "text": "ROM (Read-Only Memory) only", "isCorrect": False },
                        { "text": "EEPROM only", "isCorrect": False }
                    ],
                    "explanation": "Both SRAM (cache) and DRAM (main memory) require electrical power to maintain their stored logic states; when powered off, their contents disappear."
                }
            ]
        },
        {
            "title": "Cache Memory Fundamentals & Locality of Reference",
            "description": "Discover why caches work: the physical principles of Temporal and Spatial Locality, and the metrics of Hit Ratio and Miss Rate.",
            "order": 2,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Magic of Locality",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Bookshelf Analogy\n\nWhen writing a research paper, you don't walk to the university library across campus every time you need to read a sentence. You grab 5 reference books, place them on your desk right beside your laptop, and consult them repeatedly.\n\nIn computer architecture, your desk is the **Cache Memory** and the university library is **Main Memory (DRAM)**.\n\nCache works because software programs exhibit the **Principle of Locality**:\n1. **Temporal Locality (Locality in Time)**: If a memory location was accessed recently, it is highly likely to be accessed again soon (e.g., loop counters, frequently called functions).\n2. **Spatial Locality (Locality in Space)**: If a memory location was accessed, nearby memory locations are likely to be accessed soon (e.g., sequentially executing instructions, iterating through an array)."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566937480-cache_memory_placement.png",
                            "title": "Figure 15: Placement and Role of Cache Memory"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=Ez_kyBS-y5w",
                            "title": "Neso Academy - Introduction to Cache Memory"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Cache Terminology & Metrics",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Key Metrics\n\n* **Block / Line**: The minimum fixed-size chunk of data transferred between main memory and cache (typically 32 to 64 bytes).\n* **Cache Hit**: The requested address is found in cache. Access time $= T_{\\text{hit}}$.\n* **Cache Miss**: The address is not in cache; must fetch the whole block from slow DRAM. Access time $= T_{\\text{hit}} + \\text{Miss Penalty}$.\n* **Hit Ratio ($H$)**: Fraction of memory accesses satisfied by the cache:\n  $$H = \\frac{\\text{Cache Hits}}{\\text{Total Accesses}}$$\n* **Miss Rate ($M$)**: $M = 1 - H$."
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Locality Quiz",
                    "quiz": {
                        "question": "A loop executing an instruction sequence repeatedly 1,000 times is a classic demonstration of which principle?",
                        "options": [
                            { "text": "Temporal Locality", "isCorrect": True },
                            { "text": "Spatial Locality", "isCorrect": False },
                            { "text": "Hardware Overflow", "isCorrect": False },
                            { "text": "Virtual Segmentation", "isCorrect": False }
                        ],
                        "explanation": "Temporal locality states that memory locations referenced recently are very likely to be referenced again in the near future (like loops and loop counters)."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "Stepping sequentially through a 1,000-element integer array primarily takes advantage of which cache principle?",
                    "options": [
                        { "text": "Spatial Locality (fetching one array element brings neighboring elements into the cache line)", "isCorrect": True },
                        { "text": "Temporal Locality only", "isCorrect": False },
                        { "text": "Hardwired decoding", "isCorrect": False },
                        { "text": "Dynamic frequency scaling", "isCorrect": False }
                    ],
                    "explanation": "Because array elements are stored consecutively in memory, loading the first element loads an entire cache block (e.g. 64 bytes), providing immediate cache hits for the adjacent elements."
                },
                {
                    "question": "If a CPU performs 10,000 memory reads and 9,600 of them are found in the L1 cache, what is the cache Hit Ratio and Miss Rate?",
                    "options": [
                        { "text": "Hit Ratio = 96.0%, Miss Rate = 4.0%", "isCorrect": True },
                        { "text": "Hit Ratio = 94.0%, Miss Rate = 6.0%", "isCorrect": False },
                        { "text": "Hit Ratio = 90.0%, Miss Rate = 10.0%", "isCorrect": False },
                        { "text": "Hit Ratio = 98.0%, Miss Rate = 2.0%", "isCorrect": False }
                    ],
                    "explanation": "Hit Ratio H = 9600 / 10000 = 0.96 (96%). Miss Rate M = 1 - 0.96 = 0.04 (4%)."
                }
            ]
        },
        {
            "title": "Cache Mapping Functions: Direct, Associative & Set-Associative",
            "description": "Master address field partitioning (Tag, Set/Line, Word Offset) for Direct Mapping, Fully Associative Mapping, and k-Way Set-Associative Mapping.",
            "order": 3,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "The Three Placement Policies",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Where Does a Memory Block Go in Cache?\n\nWhen Main Memory has 1,000,000 blocks and the cache only holds 1,000 lines, where should block $X$ be placed?\n\n1. **Direct Mapping**: Block $j$ of main memory maps to **exactly one specific cache line** $i$:\n   $$i = j \\bmod m \\quad (m = \\text{number of cache lines})$$\n   * *Address Split*: `[ Tag | Line Index | Word/Byte Offset ]`\n   * *Pros*: Simple hardware, fast lookup. *Cons*: **Conflict misses** occur if two active blocks map to the same line.\n\n2. **Fully Associative Mapping**: Block $j$ can be placed in **any free cache line** anywhere!\n   * *Address Split*: `[ Tag | Word/Byte Offset ]`\n   * *Pros*: Zero conflict misses. *Cons*: Requires expensive associative comparator circuits to check all tags simultaneously in parallel.\n\n3. **k-Way Set-Associative Mapping (The Industry Sweet Spot)**:\n   * Cache is divided into $v$ sets; each set contains $k$ cache lines.\n   * Block $j$ maps to set $s = j \\bmod v$, but can reside in **any of the $k$ lines** within that set!\n   * *Address Split*: `[ Tag | Set Index | Word/Byte Offset ]`"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=V_QS1HzJ8Bc",
                            "title": "Neso Academy - Direct Memory Mapping"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Comprehensive Address Bit Partitioning",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Complete Step-by-Step Problem\n\n**System Specifications**:\n* Main Memory: $4\\text{ GB}$ byte-addressable (requires $\\log_2(4\\text{ GB}) = \\mathbf{32\\text{ address bits}}$).\n* Cache Size: $64\\text{ KB}$.\n* Block Size (Line Size): $32\\text{ bytes}$.\n\n**Step 1: Common Word/Byte Offset Bits**\n$$\\text{Offset bits} = \\log_2(\\text{Block Size}) = \\log_2(32) = \\mathbf{5\\text{ bits}}$$\n\n**Step 2: Total Cache Lines**\n$$\\text{Total Lines } m = \\frac{\\text{Cache Size}}{\\text{Block Size}} = \\frac{64\\text{ KB}}{32\\text{ bytes}} = \\frac{65,536}{32} = 2048 = 2^{11} \\text{ lines}$$\n\n---\n\n#### Configuration A: Direct Mapped\n* Line Index bits $= \\log_2(2048) = \\mathbf{11\\text{ bits}}$\n* Tag bits $= 32 - (11 + 5) = 32 - 16 = \\mathbf{16\\text{ bits}}$\n* **Address Partition**: `[ 16 bits Tag | 11 bits Line | 5 bits Offset ]`\n\n#### Configuration B: 4-Way Set-Associative ($k = 4$)\n* Number of Sets $v = \\frac{m}{k} = \\frac{2048}{4} = 512 = 2^9 \\text{ sets}$\n* Set Index bits $= \\log_2(512) = \\mathbf{9\\text{ bits}}$\n* Tag bits $= 32 - (9 + 5) = 32 - 14 = \\mathbf{18\\text{ bits}}$\n* **Address Partition**: `[ 18 bits Tag | 9 bits Set | 5 bits Offset ]`\n\n#### Configuration C: Fully Associative\n* No index bits (can go anywhere)\n* Tag bits $= 32 - 5 = \\mathbf{27\\text{ bits}}$\n* **Address Partition**: `[ 27 bits Tag | 5 bits Offset ]`"
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=KhAh6thw_TI",
                            "title": "Neso Academy - Set Associative Mapping"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "Cache Partition Quiz",
                    "quiz": {
                        "question": "In a direct-mapped cache with 16-byte blocks, which bits of a 32-bit memory address specify the byte offset within the block?",
                        "options": [
                            { "text": "Bits 0 to 3 (the lowest 4 bits, since 2^4 = 16)", "isCorrect": True },
                            { "text": "Bits 28 to 31 (the highest 4 bits)", "isCorrect": False },
                            { "text": "Bits 4 to 15", "isCorrect": False },
                            { "text": "All 32 bits", "isCorrect": False }
                        ],
                        "explanation": "Block size = 16 bytes. log2(16) = 4 bits. Therefore, bits 0 through 3 are the byte offset."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "A system has a 24-bit physical address space, a 32 KB direct-mapped cache, and a block size of 64 bytes. What are the widths of the Tag, Line Index, and Offset fields?",
                    "options": [
                        { "text": "Tag = 9 bits, Line Index = 9 bits, Offset = 6 bits", "isCorrect": True },
                        { "text": "Tag = 10 bits, Line Index = 8 bits, Offset = 6 bits", "isCorrect": False },
                        { "text": "Tag = 12 bits, Line Index = 6 bits, Offset = 6 bits", "isCorrect": False },
                        { "text": "Tag = 8 bits, Line Index = 10 bits, Offset = 6 bits", "isCorrect": False }
                    ],
                    "explanation": "Offset = log2(64) = 6 bits. Number of lines = 32 KB / 64 B = (32 * 1024) / 64 = 512 lines. Line bits = log2(512) = 9 bits. Tag bits = 24 - 9 - 6 = 9 bits."
                },
                {
                    "question": "If the cache in the previous question is converted to an 8-way Set-Associative cache with the same total size (32 KB) and block size (64 bytes), what will be the new field widths?",
                    "options": [
                        { "text": "Tag = 12 bits, Set Index = 6 bits, Offset = 6 bits", "isCorrect": True },
                        { "text": "Tag = 10 bits, Set Index = 8 bits, Offset = 6 bits", "isCorrect": False },
                        { "text": "Tag = 9 bits, Set Index = 9 bits, Offset = 6 bits", "isCorrect": False },
                        { "text": "Tag = 15 bits, Set Index = 3 bits, Offset = 6 bits", "isCorrect": False }
                    ],
                    "explanation": "Number of sets = 512 lines / 8 lines per set = 64 sets. Set bits = log2(64) = 6 bits. Offset remains 6 bits. Tag bits = 24 - 6 - 6 = 12 bits."
                },
                {
                    "question": "Why does a Fully Associative cache eliminate conflict misses entirely?",
                    "options": [
                        { "text": "Because any incoming memory block can occupy any available cache frame without being restricted to a designated line or set", "isCorrect": True },
                        { "text": "Because it holds an infinite amount of data", "isCorrect": False },
                        { "text": "Because it doesn't use tags", "isCorrect": False },
                        { "text": "Because it only stores code and never data", "isCorrect": False }
                    ],
                    "explanation": "Conflict misses occur when multiple memory blocks map to the same set or line. Since fully associative cache has no set restrictions, blocks are never evicted unless the entire cache is 100% full (capacity miss)."
                }
            ]
        },
        {
            "title": "Cache Replacement, Write Policies & AMAT Performance",
            "description": "Evaluate cache replacement algorithms (LRU, FIFO), write policies (write-through vs. write-back), and calculate Average Memory Access Time (AMAT).",
            "order": 4,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Replacement Policies & Write Policies",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### What Happens When Cache is Full?\n\n* **LRU (Least Recently Used)**: Evicts the block that hasn't been accessed for the longest time. Highly effective because of temporal locality.\n* **FIFO (First-In, First-Out)**: Evicts the oldest loaded block regardless of recent usage.\n\n### Handling Writes\n\n* **Write-Through**: Every write updates **both the cache and main DRAM simultaneously**. Safe and consistent, but slow; requires a hardware *Write Buffer*.\n* **Write-Back (Copy-Back)**: Writes update **only the cache line**. A **Dirty Bit** is set to `1`. The block is written back to main DRAM only when it is eventually evicted! Much faster, but requires dirty bit tracking."
                        },
                        {
                            "type": "youtube",
                            "content": "https://www.youtube.com/watch?v=7lxAfszjy68",
                            "title": "Neso Academy - Cache Replacement Policies"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Average Memory Access Time (AMAT) Formula",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The AMAT Equation\n\n$$\\text{AMAT} = T_{\\text{hit}} + (\\text{Miss Rate } M \\times \\text{Miss Penalty})$$\n\nFor a two-level cache system (L1 and L2):\n$$\\text{AMAT} = T_{L1} + M_{L1} \\times (T_{L2} + M_{L2} \\times T_{\\text{DRAM}})$$"
                        },
                        {
                            "type": "text",
                            "content": "### Worked Calculation: Two-Level Cache AMAT\n\n**Given**:\n* L1 Cache Hit Time $T_{L1} = 1\\text{ ns}$, Miss Rate $M_{L1} = 5\\% = 0.05$\n* L2 Cache Hit Time $T_{L2} = 5\\text{ ns}$, Local Miss Rate $M_{L2} = 10\\% = 0.10$\n* Main Memory Access Time $T_{\\text{DRAM}} = 100\\text{ ns}$\n\n**Step 1: Compute Penalty for L1 Miss**\n$$\\text{L1 Miss Penalty} = T_{L2} + (M_{L2} \\times T_{\\text{DRAM}}) = 5\\text{ ns} + (0.10 \\times 100\\text{ ns}) = 5 + 10 = \\mathbf{15\\text{ ns}}$$\n\n**Step 2: Compute Total AMAT**\n$$\\text{AMAT} = 1\\text{ ns} + (0.05 \\times 15\\text{ ns}) = 1 + 0.75 = \\mathbf{1.75\\text{ ns}}$$\n\nWithout L1/L2 caches, every access would take $100\\text{ ns}$. The cache hierarchy speeds up memory access by $\\frac{100}{1.75} = \\mathbf{57.1\\times}$!"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "AMAT Quiz",
                    "quiz": {
                        "question": "If a CPU has a cache hit time of 2 ns, a miss penalty of 50 ns, and a cache hit ratio of 90%, what is the Average Memory Access Time (AMAT)?",
                        "options": [
                            { "text": "7.0 ns", "isCorrect": True },
                            { "text": "5.0 ns", "isCorrect": False },
                            { "text": "52.0 ns", "isCorrect": False },
                            { "text": "2.5 ns", "isCorrect": False }
                        ],
                        "explanation": "Miss Rate M = 1 - 0.90 = 0.10. AMAT = 2 ns + (0.10 * 50 ns) = 2 + 5 = 7.0 ns."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "A system with a single cache has a hit time of 1.2 ns and a miss penalty of 60 ns. What is the maximum acceptable miss rate to ensure AMAT does not exceed 3.0 ns?",
                    "options": [
                        { "text": "3.0%", "isCorrect": True },
                        { "text": "5.0%", "isCorrect": False },
                        { "text": "1.8%", "isCorrect": False },
                        { "text": "6.0%", "isCorrect": False }
                    ],
                    "explanation": "Equation: 1.2 + (M * 60) <= 3.0 -> 60 * M <= 1.8 -> M <= 1.8 / 60 = 0.03 (3.0%)."
                },
                {
                    "question": "What is the purpose of the 'Dirty Bit' in a Write-Back cache line?",
                    "options": [
                        { "text": "To flag whether the cache line has been modified by a write operation and must be written back to main memory upon replacement", "isCorrect": True },
                        { "text": "To mark a block containing software bugs", "isCorrect": False },
                        { "text": "To indicate that the block has been infected by malware", "isCorrect": False },
                        { "text": "To notify the operating system to shut down", "isCorrect": False }
                    ],
                    "explanation": "In write-back caches, data is written only to cache; the dirty bit indicates that the cached block is newer than the copy in DRAM, requiring a writeback when evicted."
                },
                {
                    "question": "Why is Least Recently Used (LRU) generally superior to First-In First-Out (FIFO) as a cache replacement policy?",
                    "options": [
                        { "text": "LRU aligns directly with temporal locality by prioritizing recently accessed blocks that are likely to be reused", "isCorrect": True },
                        { "text": "LRU requires zero silicon hardware", "isCorrect": False },
                        { "text": "FIFO suffers from Belady's anomaly in all cache hardware", "isCorrect": False },
                        { "text": "LRU executes in negative clock cycles", "isCorrect": False }
                    ],
                    "explanation": "FIFO blindly discards the oldest block even if it is currently in active high-frequency use. LRU protects actively referenced hot data."
                }
            ]
        },
        {
            "title": "Virtual Memory Management: Paging & TLB",
            "description": "Understand virtual address translation, page tables, page faults, and calculate Effective Access Time (EAT) with a Translation Lookaside Buffer (TLB).",
            "order": 5,
            "xp": 50,
            "isPublished": False,
            "contents": [
                {
                    "type": "group",
                    "content": "Why Virtual Memory is Necessary",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### The Illusion of Infinite Memory\n\nVirtual memory provides two massive benefits:\n1. **Illusion of Immense Space**: Allows a 4 GB RAM computer to run multiple programs that each think they own a continuous 64-bit address space, with unused pages parked on disk (swap space).\n2. **Memory Protection**: Isolates programs so a crashed app cannot corrupt the memory space of another app or the operating system kernel."
                        },
                        {
                            "type": "image",
                            "content": "https://pub-25cf731b17e245559cf292c270f8e8a1.r2.dev/topics/images/1794566936004-virtual_memory_paging.png",
                            "title": "Figure 16: Virtual Memory Address Translation and Paging"
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Address Translation & The TLB",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Paging Architecture\n* **Virtual Address**: Split into **Virtual Page Number ($p$)** and **Page Offset ($d$)**.\n* **Physical Address**: Split into **Physical Frame Number ($f$)** and identical **Page Offset ($d$)**.\n* **Page Table**: An in-memory lookup array indexed by $p$ that outputs frame $f$.\n\n### The Problem & The Solution: The TLB\nBecause the page table lives in DRAM, translating every memory address would double memory access time (1 access to read page table, 1 access to read data)!\n\nThe **Translation Lookaside Buffer (TLB)** is a blazing-fast, small on-chip associative cache that stores the most recent Page-to-Frame translations."
                        }
                    ]
                },
                {
                    "type": "group",
                    "content": "Worked Calculation: Effective Access Time (EAT) with TLB",
                    "blocks": [
                        {
                            "type": "text",
                            "content": "### Mathematical Formulation\n$$\\text{EAT} = [\\text{Hit Ratio } H \\times (t_{\\text{TLB}} + t_{\\text{mem}})] + [(1 - H) \\times (t_{\\text{TLB}} + 2 \\times t_{\\text{mem}})]$$\n\n### Step-by-Step Problem\n* TLB lookup time $t_{\\text{TLB}} = 10\\text{ ns}$\n* Main Memory access time $t_{\\text{mem}} = 80\\text{ ns}$\n* TLB Hit Ratio $H = 95\\% = 0.95$\n\n**Case 1: TLB Hit (95% of the time)**:\n* Access time $= t_{\\text{TLB}} + t_{\\text{mem}} = 10 + 80 = \\mathbf{90\\text{ ns}}$\n\n**Case 2: TLB Miss (5% of the time)**:\n* Access time $= t_{\\text{TLB}} + t_{\\text{mem}} (\\text{page table}) + t_{\\text{mem}} (\\text{operand}) = 10 + 80 + 80 = \\mathbf{170\\text{ ns}}$\n\n**Calculate EAT**:\n$$\\text{EAT} = (0.95 \\times 90\\text{ ns}) + (0.05 \\times 170\\text{ ns}) = 85.5 + 8.5 = \\mathbf{94.0\\text{ ns}}$$"
                        }
                    ]
                },
                {
                    "type": "quiz",
                    "content": "TLB Quiz",
                    "quiz": {
                        "question": "What is the primary function of the Translation Lookaside Buffer (TLB) in a modern CPU?",
                        "options": [
                            { "text": "An on-chip cache of recent virtual-to-physical page translations to avoid a slow page table lookup in main memory", "isCorrect": True },
                            { "text": "A temporary buffer for saving opened browser tabs", "isCorrect": False },
                            { "text": "A hardware unit that translates English into binary", "isCorrect": False },
                            { "text": "A storage area for user passwords", "isCorrect": False }
                        ],
                        "explanation": "The TLB caches recent page table mappings in fast associative hardware directly inside the Memory Management Unit (MMU)."
                    }
                }
            ],
            "mcqs": [
                {
                    "question": "In a 32-bit virtual memory architecture with a page size of 4 KB, how many bits are used for the Page Offset (d) and how many for the Virtual Page Number (p)?",
                    "options": [
                        { "text": "Page Offset = 12 bits, Page Number = 20 bits", "isCorrect": True },
                        { "text": "Page Offset = 10 bits, Page Number = 22 bits", "isCorrect": False },
                        { "text": "Page Offset = 16 bits, Page Number = 16 bits", "isCorrect": False },
                        { "text": "Page Offset = 8 bits, Page Number = 24 bits", "isCorrect": False }
                    ],
                    "explanation": "Page size = 4 KB = 4 * 1024 bytes = 2^12 bytes -> Offset d = 12 bits. Page Number p = 32 - 12 = 20 bits (representing 2^20 = 1,048,576 possible pages)."
                },
                {
                    "question": "If TLB search time is 5 ns, main memory access is 100 ns, and the TLB hit ratio is 90%, what is the Effective Access Time?",
                    "options": [
                        { "text": "115 ns", "isCorrect": True },
                        { "text": "105 ns", "isCorrect": False },
                        { "text": "125 ns", "isCorrect": False },
                        { "text": "195 ns", "isCorrect": False }
                    ],
                    "explanation": "Hit time = 5 + 100 = 105 ns. Miss time = 5 + 100 + 100 = 205 ns. EAT = 0.90 * 105 + 0.10 * 205 = 94.5 + 20.5 = 115 ns."
                },
                {
                    "question": "What catastrophic event occurs when the CPU references a valid virtual page that is currently not resident in physical RAM?",
                    "options": [
                        { "text": "A Page Fault trap is generated, causing the OS to fetch the page from disk into a free RAM frame", "isCorrect": True },
                        { "text": "The computer permanently damages its processor", "isCorrect": False },
                        { "text": "The entire hard drive is formatted", "isCorrect": False },
                        { "text": "The CPU enters an infinite loop until powered down", "isCorrect": False }
                    ],
                    "explanation": "A page fault is an architectural exception that triggers the OS kernel's virtual memory manager to load the missing page from secondary storage into RAM."
                }
            ]
        }
    ]
}
