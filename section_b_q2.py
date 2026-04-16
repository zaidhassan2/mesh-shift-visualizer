# ============================================================
# Section B - Question 02
# Circular Shift on a 2D Toroidal Mesh
# Uses threading + barriers for parallel simulation
# ============================================================

import math
import time
import threading
import matplotlib.pyplot as plt

# -------------------------------------------------------
# MESH SETUP
# -------------------------------------------------------

def make_grid(R, C):
    """
    Create the initial grid.
    Each node (r,c) stores its row-major ID as data.
    """
    grid = [[r * C + c for c in range(C)] for r in range(R)]
    return grid

def print_grid(grid, label="Grid"):
    """Pretty print the grid"""
    R = len(grid)
    C = len(grid[0])
    print(f"\n  [{label}]")
    for r in range(R):
        row_str = "  "
        for c in range(C):
            row_str += f"{grid[r][c]:>4}"
        print(row_str)


# -------------------------------------------------------
# CIRCULAR SHIFT ALGORITHM
# Uses row shift + column shift (two-phase approach)
# Uses double buffering so no node overwrites before sending
# -------------------------------------------------------

def circular_shift(R, C, K, verbose=True):
    """
    Perform a K-step circular shift on an R x C toroidal mesh.

    The global row-major shift by K is decomposed into:
      col_shift = K // C   (how many full rows to shift down)
      row_shift = K  % C   (remaining positions within a row)

    Double buffering: we work on a copy, then swap.
    A threading.Barrier syncs all workers between phases.
    """
    P = R * C
    K = K % P   # Avoid redundant full cycles (optimize large K)

    # Decompose K into row and column components
    row_shift_amount = K % C       # shift within each row (horizontal)
    col_shift_amount = K // C      # shift across rows (vertical)

    if verbose:
        print(f"\n  R={R}, C={C}, P={P}, K={K}")
        print(f"  Row shift amount   : {row_shift_amount}")
        print(f"  Column shift amount: {col_shift_amount}")

    # Initial grid
    grid = make_grid(R, C)
    if verbose:
        print_grid(grid, "Initial Layout")

    # ---- Phase 1: Row Shift ----
    # Each row independently shifts its data right by row_shift_amount
    # Using double buffering: read from 'grid', write into 'next_grid'
    barrier = threading.Barrier(R)   # one thread per row
    next_grid = [[0] * C for _ in range(R)]

    def row_shift_worker(r):
        """Worker for one row: shift right by row_shift_amount"""
        for c in range(C):
            new_c = (c + row_shift_amount) % C
            next_grid[r][new_c] = grid[r][c]
        barrier.wait()  # wait for ALL rows to finish before anyone proceeds

    threads = [threading.Thread(target=row_shift_worker, args=(r,)) for r in range(R)]
    for t in threads: t.start()
    for t in threads: t.join()

    # Swap grid <- next_grid
    for r in range(R):
        for c in range(C):
            grid[r][c] = next_grid[r][c]

    if verbose:
        print_grid(grid, "After Row Shift")

    # ---- Phase 2: Column Shift ----
    # Each column independently shifts its data down by col_shift_amount
    barrier2 = threading.Barrier(C)
    next_grid2 = [[0] * C for _ in range(R)]

    def col_shift_worker(c):
        """Worker for one column: shift down by col_shift_amount"""
        for r in range(R):
            new_r = (r + col_shift_amount) % R
            next_grid2[new_r][c] = grid[r][c]
        barrier2.wait()  # sync all columns

    threads2 = [threading.Thread(target=col_shift_worker, args=(c,)) for c in range(C)]
    for t in threads2: t.start()
    for t in threads2: t.join()

    # Swap grid <- next_grid2
    for r in range(R):
        for c in range(C):
            grid[r][c] = next_grid2[r][c]

    if verbose:
        print_grid(grid, "Final Layout (After Column Shift)")

    return grid


# -------------------------------------------------------
# CORRECTNESS CHECK
# -------------------------------------------------------

def check_correctness(final_grid, R, C, K):
    """
    The two-phase mesh shift gives:
      final[r][c] = original[(r - col_shift) % R][(c - row_shift) % C]
    where row_shift = K % C, col_shift = K // C.

    We verify:
      1. The result is a valid permutation of 0..P-1 (no data lost).
      2. Each position contains exactly the item predicted by the two-phase formula.
    """
    P = R * C
    K = K % P
    row_shift = K % C
    col_shift = K // C

    flat = [final_grid[r][c] for r in range(R) for c in range(C)]

    # Check valid permutation
    if sorted(flat) != list(range(P)):
        print("  ERROR: Not a valid permutation!")
        return False

    # Check each position matches two-phase formula
    all_correct = True
    for r in range(R):
        for c in range(C):
            # Item that should be at (r,c) after shift
            src_r = (r - col_shift) % R
            src_c = (c - row_shift) % C
            expected = src_r * C + src_c
            if final_grid[r][c] != expected:
                print(f"  MISMATCH at ({r},{c}): got {final_grid[r][c]}, expected {expected}")
                all_correct = False

    if all_correct:
        print("\n  >> Mesh circular shift: CORRECT")
    else:
        print("\n  >> Mesh circular shift: INCORRECT")
    return all_correct


# -------------------------------------------------------
# PERFORMANCE ANALYSIS
# -------------------------------------------------------

def performance_analysis():
    """
    1) Time vs K for fixed R=C=4
    2) Time vs grid size P for fixed K=5
    """

    # --- Time vs K ---
    R, C = 4, 4
    K_values = list(range(1, 16))
    times_k = []
    for K in K_values:
        t0 = time.perf_counter()
        for _ in range(50):   # repeat for stable timing
            circular_shift(R, C, K, verbose=False)
        t1 = time.perf_counter()
        times_k.append((t1 - t0) / 50 * 1000)  # ms

    # --- Time vs P ---
    K_fixed = 5
    sizes = [(2,2), (4,4), (8,8), (16,16)]
    times_p = []
    P_labels = []
    for (R2, C2) in sizes:
        t0 = time.perf_counter()
        for _ in range(20):
            circular_shift(R2, C2, K_fixed, verbose=False)
        t1 = time.perf_counter()
        times_p.append((t1 - t0) / 20 * 1000)
        P_labels.append(R2 * C2)

    # Plot Time vs K
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    axes[0].plot(K_values, times_k, marker='o', color='steelblue')
    axes[0].set_xlabel("Shift Amount K")
    axes[0].set_ylabel("Time (ms)")
    axes[0].set_title("Time vs K (R=C=4, fixed grid)")

    # Plot Time vs P
    axes[1].plot(P_labels, times_p, marker='s', color='darkorange')
    axes[1].set_xlabel("Grid Size P (= R x C)")
    axes[1].set_ylabel("Time (ms)")
    axes[1].set_title(f"Time vs Grid Size (K={K_fixed})")

    plt.tight_layout()
    plt.savefig("/home/wolf/Documents/pdc/Q2_performance.png", dpi=100)
    plt.close()
    print("Performance charts saved: q2_performance.png")

    # Print number of communication steps as function of R, C, K
    print("\n  Estimated neighbor communications per data item:")
    print(f"  {'R':>4} {'C':>4} {'K':>5} {'row_steps':>12} {'col_steps':>12} {'total':>8}")
    for (R2, C2) in [(4,4), (8,8)]:
        for K in [3, 5, 7]:
            P2 = R2 * C2
            rs = K % C2
            cs = K // C2
            print(f"  {R2:>4} {C2:>4} {K:>5} {rs:>12} {cs:>12} {rs+cs:>8}")


# -------------------------------------------------------
# SHORT ANALYSIS
# -------------------------------------------------------

def print_analysis():
    print("""
  Short Analysis (Q2):
  - Double buffering ensures each node reads from the old grid and writes
    to a separate new grid, so no data is lost or overwritten mid-step.
  - The barrier after each phase ensures all nodes finish their send/receive
    before anyone moves to the next phase, preventing race conditions.
  - The total number of neighbor steps = (K mod C) + (K // C), which is at
    most R + C - 2 for any K, much smaller than K itself for large K.
  - Toroidal wrap-around means edge nodes have the same degree as interior
    nodes, eliminating the edge effects of a plain mesh.
  - Using K' = K mod P avoids redundant full cycles, optimizing large K.
  - Grid size scales the total work as O(R+C) steps regardless of P.
    """)


# -------------------------------------------------------
# MAIN
# -------------------------------------------------------

if __name__ == "__main__":
    print("="*60)
    print("  Section B Q2: Circular Shift on 2D Toroidal Mesh")
    print("="*60)

    R, C, K = 4, 4, 6   # 4x4 grid, K=6 (matches Q1 from Section A)
    final = circular_shift(R, C, K, verbose=True)
    check_correctness(final, R, C, K)

    # Try another example
    print("\n--- Second example: R=4, C=4, K=5 ---")
    final2 = circular_shift(4, 4, 5, verbose=True)
    check_correctness(final2, 4, 4, 5)

    # Performance analysis
    print("\n--- Performance Analysis ---")
    performance_analysis()

    print_analysis()
    print("\nDone.")
