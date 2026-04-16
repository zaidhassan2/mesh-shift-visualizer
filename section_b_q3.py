# ============================================================
# Section B - Question 03
# All-to-All Personalized Communication on d-Dimensional Hypercube
# ============================================================

import math
import time
import threading
import matplotlib.pyplot as plt

# -------------------------------------------------------
# HYPERCUBE SETUP
# -------------------------------------------------------

def get_neighbor(node, bit):
    """Get neighbor of 'node' by flipping bit 'bit'"""
    return node ^ (1 << bit)

def build_neighbor_table(d):
    """
    For each node, list its d neighbors (one per dimension).
    neighbor_table[i][k] = neighbor of node i along dimension k
    """
    p = 2 ** d
    table = {}
    for i in range(p):
        table[i] = [get_neighbor(i, bit) for bit in range(d)]
    return table


# -------------------------------------------------------
# HYPERCUBE ALL-TO-ALL ALGORITHM
# Dimension-ordered exchange: d steps total
# -------------------------------------------------------

def hypercube_all_to_all(d, verbose=True):
    """
    All-to-all personalized communication on a d-dimensional hypercube.

    Algorithm:
      At step k (0-indexed), node i exchanges messages with its neighbor
      whose ID differs in bit k.

      After d steps, every node has all messages destined for it.

    Double buffering: 'current' holds messages during the step;
    we write results into 'next_data' then swap.
    A barrier syncs all threads between steps.
    """
    p = 2 ** d

    # Initialize: node i has messages for all j != i
    # msg format: (source, destination)
    node_data = {i: [(i, j) for j in range(p) if j != i] for i in range(p)}

    # Shared data protected by a lock when threads write to neighbors
    lock = threading.Lock()
    barrier = threading.Barrier(p)

    # Track stats
    messages_per_step = []
    step_times = []

    if verbose:
        print(f"\n  d={d}, p={p} nodes")
        print(f"  Total steps: {d}")

    for step in range(d):
        t_step_start = time.perf_counter()
        in_transit = 0

        # next_data will hold what each node has after this step
        next_data = {i: [] for i in range(p)}

        def worker(i):
            nonlocal in_transit
            neighbor = get_neighbor(i, step)
            send_msgs = []
            keep_msgs = []

            for (src, dest) in node_data[i]:
                # A message goes to neighbor if dest's bit 'step' matches neighbor's
                if (dest >> step) & 1 == (neighbor >> step) & 1:
                    send_msgs.append((src, dest))
                else:
                    keep_msgs.append((src, dest))

            # Write to next_data safely
            with lock:
                next_data[i].extend(keep_msgs)
                next_data[neighbor].extend(send_msgs)
                in_transit += len(send_msgs)

            barrier.wait()   # sync: everyone must finish step before next step

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(p)]
        for t in threads: t.start()
        for t in threads: t.join()

        node_data = next_data
        t_step_end = time.perf_counter()

        messages_per_step.append(in_transit)
        step_times.append((t_step_end - t_step_start) * 1000)

        if verbose:
            remaining = sum(len(node_data[i]) for i in range(p))
            print(f"  Step {step+1}: {in_transit} sent | {remaining} messages still moving")

    return node_data, messages_per_step, step_times


# -------------------------------------------------------
# CORRECTNESS VALIDATION
# -------------------------------------------------------

def validate(d, node_data):
    """
    Each node t should have received exactly (src, t) for all src != t.
    """
    p = 2 ** d
    correct = True

    for t in range(p):
        received_sources = set(src for (src, dest) in node_data[t] if dest == t)
        expected_sources = set(range(p)) - {t}
        if received_sources != expected_sources:
            print(f"  Node {t}: MISSING {expected_sources - received_sources}")
            correct = False

    if correct:
        print("\n  >> Hypercube all-to-all: CORRECT")
    else:
        print("\n  >> Hypercube all-to-all: INCORRECT")
    return correct


# -------------------------------------------------------
# PERFORMANCE ANALYSIS
# -------------------------------------------------------

def performance_analysis_hypercube():
    """
    Run hypercube all-to-all for d = 2, 3, 4, 5
    and plot:
      1) Messages in transit per step (for one d)
      2) Total execution time vs dimension d
    """

    # --- Plot 1: Messages in transit per step for d=4 ---
    print("\n  Running d=4 for transit plot...")
    _, transit_d4, _ = hypercube_all_to_all(4, verbose=False)

    # --- Plot 2: Execution time vs d ---
    dimensions = [2, 3, 4, 5]
    total_times = []
    for d in dimensions:
        t0 = time.perf_counter()
        hypercube_all_to_all(d, verbose=False)
        t1 = time.perf_counter()
        total_times.append((t1 - t0) * 1000)
        print(f"  d={d}: {(t1-t0)*1000:.2f} ms")

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    # Transit chart
    axes[0].plot(range(1, 5), transit_d4, marker='o', color='purple')
    axes[0].set_xlabel("Step Number")
    axes[0].set_ylabel("Messages In Transit")
    axes[0].set_title("Hypercube: Messages In Transit per Step (d=4)")

    # Time vs d
    p_values = [2**d for d in dimensions]
    axes[1].plot(p_values, total_times, marker='s', color='darkorange')
    axes[1].set_xlabel("Number of Nodes P = 2^d")
    axes[1].set_ylabel("Execution Time (ms)")
    axes[1].set_title("Hypercube: Execution Time vs Node Count")

    plt.tight_layout()
    plt.savefig("/home/wolf/Documents/pdc/Q3_hypercube_analysis.png", dpi=100)
    plt.close()
    print("  Hypercube analysis charts saved: q3_hypercube_analysis.png")

    # Print summary table
    print("\n  Summary:")
    print(f"  {'d':>4} {'p':>6} {'Steps':>8} {'Time (ms)':>12}")
    for i, d in enumerate(dimensions):
        print(f"  {d:>4} {2**d:>6} {d:>8} {total_times[i]:>12.2f}")


# -------------------------------------------------------
# SHORT ANALYSIS
# -------------------------------------------------------

def print_analysis():
    print("""
  Short Analysis (Q3):
  - At each step k, messages whose destination matches the neighbor's bit-k
    are forwarded; the rest stay. This progressively routes each message
    closer to its destination, one dimension at a time.
  - The number of in-flight messages decreases each step because after step k,
    messages have been correctly placed along dimension k and no longer need
    to move in that dimension.
  - The hypercube's binary addressing means d = log2(p) steps suffice,
    giving logarithmic critical-path length which scales very well.
  - Double buffering prevents race conditions: each thread writes to a
    separate 'next_data' structure, then all swap at the barrier.
  - The barrier after each step ensures no node reads stale data from the
    previous step while another node is still writing.
  - Global message complexity is O(p^2) total messages but only O(p log p)
    link-traversals due to the structured routing.
    """)


# -------------------------------------------------------
# MAIN
# -------------------------------------------------------

if __name__ == "__main__":
    print("="*60)
    print("  Section B Q3: All-to-All on d-Dimensional Hypercube")
    print("="*60)

    d = 4   # 16 nodes
    print(f"\n--- Running all-to-all for d={d} (p={2**d} nodes) ---")
    final_data, transit, step_times = hypercube_all_to_all(d, verbose=True)

    # Show final message counts per node
    print("\n  Final message counts per node:")
    for node in range(2**d):
        count = len(final_data[node])
        print(f"    Node {node:2d}: {count} messages received")

    # Correctness check
    validate(d, final_data)

    # Performance analysis
    print("\n--- Performance Analysis ---")
    performance_analysis_hypercube()

    print_analysis()
    print("\nDone.")
