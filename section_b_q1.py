import time
import math
import matplotlib.pyplot as plt
import networkx as nx

# -------------------------------------------------------
# PART A: Topology Construction & Visualization
# -------------------------------------------------------

def build_ring(p):
    """Ring: node i connects to (i+1) mod p"""
    G = nx.Graph()
    for i in range(p):
        G.add_edge(i, (i + 1) % p)
    return G

def build_mesh(p):
    """2D Mesh: sqrt(p) x sqrt(p) grid with row and column links"""
    side = int(math.sqrt(p))
    G = nx.Graph()
    for r in range(side):
        for c in range(side):
            node = r * side + c
            if c + 1 < side:
                G.add_edge(node, r * side + (c + 1))  # right neighbor
            if r + 1 < side:
                G.add_edge(node, (r + 1) * side + c)  # bottom neighbor
    return G

def build_hypercube(d):
    """Hypercube: nodes connected if binary IDs differ by exactly 1 bit"""
    p = 2 ** d
    G = nx.Graph()
    for i in range(p):
        for bit in range(d):
            neighbor = i ^ (1 << bit)  # flip one bit
            if i < neighbor:
                G.add_edge(i, neighbor)
    return G

def visualize_topologies(p=16):
    """Draw all three topologies side by side"""
    d = int(math.log2(p))
    side = int(math.sqrt(p))
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.suptitle(f"Topology Visualization (p={p} nodes)", fontsize=14)

    # Ring - circular layout
    G_ring = build_ring(p)
    pos_ring = nx.circular_layout(G_ring)
    nx.draw(G_ring, pos_ring, ax=axes[0], with_labels=True,
            node_color='skyblue', node_size=500, font_size=8)
    axes[0].set_title(f"Ring (steps = p-1 = {p-1})")

    # Mesh - grid layout
    G_mesh = build_mesh(p)
    pos_mesh = {r * side + c: (c, -r) for r in range(side) for c in range(side)}
    nx.draw(G_mesh, pos_mesh, ax=axes[1], with_labels=True,
            node_color='lightgreen', node_size=500, font_size=8)
    axes[1].set_title(f"2D Mesh (steps = 2*(√p-1) = {2*(side-1)})")

    # Hypercube
    G_hyper = build_hypercube(d)
    pos_hyper = nx.spring_layout(G_hyper, seed=42)
    nx.draw(G_hyper, pos_hyper, ax=axes[2], with_labels=True,
            node_color='salmon', node_size=500, font_size=8)
    axes[2].set_title(f"Hypercube d={d} (steps = log2(p) = {d})")

    plt.tight_layout()
    plt.savefig("/home/wolf/Documents/pdc/Q1_topologies.png", dpi=100)
    plt.close()
    print("Topology visualization saved: q1_topologies.png")


# -------------------------------------------------------
# PART B: Algorithmic Implementation
# -------------------------------------------------------

# --- 1. Ring: Shift Algorithm ---
def ring_all_to_all(p):
    """
    p-1 step shift algorithm.
    Each node passes messages rightward; after p-1 steps everyone has all messages.
    """
    # node_msgs[i] = list of messages node i currently holds
    # each message is (original_sender, destination)
    node_msgs = {i: [(i, j) for j in range(p) if j != i] for i in range(p)}

    steps = p - 1

    for step in range(steps):
        new_msgs = {i: [] for i in range(p)}
        for i in range(p):
            right = (i + 1) % p
            for msg in node_msgs[i]:
                src, dest = msg
                if dest == right:
                    # Delivered! Node 'right' receives it
                    new_msgs[right].append(msg)
                else:
                    # Forward to right neighbor
                    new_msgs[right].append(msg)
            # Node i also keeps messages already delivered to it
        node_msgs = new_msgs

    return steps


# --- 2. 2D Mesh: Two-Phase Routing ---
def mesh_all_to_all(p):
    """
    Phase 1: Row-wise all-to-all (side-1 steps)
    Phase 2: Column-wise all-to-all (side-1 steps)
    Total = 2*(sqrt(p) - 1)
    """
    side = int(math.sqrt(p))

    # Initialize: node (r,c) has messages for all other nodes
    # We represent as a 2D grid of message lists
    grid = {}
    for r in range(side):
        for c in range(side):
            node_id = r * side + c
            # Each node holds messages for everyone
            grid[(r, c)] = [(node_id, j) for j in range(p) if j != node_id]

    print(f"  [Mesh] Phase 1: Row-wise exchange ({side-1} steps)...")
    # Phase 1: within each row, do all-to-all
    for step in range(side - 1):
        new_grid = {pos: [] for pos in grid}
        for r in range(side):
            for c in range(side):
                right_c = (c + 1) % side   # wrap-around (toroidal)
                for msg in grid[(r, c)]:
                    new_grid[(r, right_c)].append(msg)
        grid = new_grid

    print(f"  [Mesh] Phase 2: Column-wise exchange ({side-1} steps)...")
    # Phase 2: within each column, do all-to-all
    for step in range(side - 1):
        new_grid = {pos: [] for pos in grid}
        for r in range(side):
            for c in range(side):
                down_r = (r + 1) % side   # wrap-around (toroidal)
                for msg in grid[(r, c)]:
                    new_grid[(down_r, c)].append(msg)
        grid = new_grid

    total_steps = 2 * (side - 1)
    return total_steps


# --- 3. Hypercube: Dimension-Ordered Exchange ---
def hypercube_all_to_all(d):
    """
    d steps total. In step k, each node exchanges with neighbor differing in bit k.
    After d steps, every node has all messages.
    """
    p = 2 ** d

    # node_data[i] = list of (src, dest) messages at node i
    node_data = {i: [(i, j) for j in range(p) if j != i] for i in range(p)}

    messages_in_transit = []  # track for plotting

    for step in range(d):
        in_transit = 0
        new_data = {i: list(node_data[i]) for i in range(p)}  # copy current state

        for i in range(p):
            neighbor = i ^ (1 << step)  # flip bit 'step'
            send_list = []
            keep_list = []

            for (src, dest) in node_data[i]:
                # Check if this message should go to neighbor's side
                # Messages are sent if their dest's bit 'step' matches neighbor's bit
                if (dest >> step) & 1 == (neighbor >> step) & 1:
                    send_list.append((src, dest))
                    in_transit += 1
                else:
                    keep_list.append((src, dest))

            # Update: node i keeps some, neighbor receives the rest
            new_data[i] = keep_list
            new_data[neighbor].extend(send_list)

        node_data = new_data
        messages_in_transit.append(in_transit)
        print(f"  [Hypercube] Step {step+1}/{d}: {in_transit} messages in transit")

    return d, node_data, messages_in_transit


# -------------------------------------------------------
# PART C: Comparative Analysis
# -------------------------------------------------------

def compare_topologies(p_values):
    """Print comparison table and generate bar chart"""
    print("\n" + "="*70)
    print(f"{'TOPOLOGY':<12} {'P':>5} {'STEPS':>8}  COMPLEXITY   WHY")
    print("="*70)

    ring_steps_list = []
    mesh_steps_list = []
    hyper_steps_list = []
    labels = []

    for p in p_values:
        side = int(math.sqrt(p))
        d = int(math.log2(p))
        # Validate: p must be power of 2 AND perfect square
        if 2**d != p or side*side != p:
            continue

        ring_s  = p - 1
        mesh_s  = 2 * (side - 1)
        hyper_s = d

        ring_steps_list.append(ring_s)
        mesh_steps_list.append(mesh_s)
        hyper_steps_list.append(hyper_s)
        labels.append(str(p))

        print(f"{'Ring':<12} {p:>5} {ring_s:>8}  Linear      Simple but slow for many nodes")
        print(f"{'Mesh':<12} {p:>5} {mesh_s:>8}  O(sqrt p)   Splits work into rows and columns")
        print(f"{'Hypercube':<12} {p:>5} {hyper_s:>8}  O(log2 p)   Fastest; logarithmic dimension routing")
        print("-"*70)

    # Bar chart comparison
    x = list(range(len(labels)))
    w = 0.25
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar([i - w for i in x], ring_steps_list,  w, label='Ring',      color='skyblue')
    ax.bar([i     for i in x], mesh_steps_list,  w, label='Mesh',      color='lightgreen')
    ax.bar([i + w for i in x], hyper_steps_list, w, label='Hypercube', color='salmon')
    ax.set_xlabel("Number of Nodes (p)")
    ax.set_ylabel("Communication Steps")
    ax.set_title("All-to-All Communication: Steps Comparison")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend()
    plt.tight_layout()
    plt.savefig("/home/wolf/Documents/pdc/Q1_comparison.png", dpi=100)
    plt.close()
    print("\nBar chart saved: q1_comparison.png")


# -------------------------------------------------------
# MAIN
# -------------------------------------------------------

if __name__ == "__main__":
    p = 16   # 16 nodes; also works as 4x4 mesh and d=4 hypercube
    d = 4

    print("="*60)
    print("  Section B Q1: All-to-All Personalized Communication")
    print("="*60)

    # Part A: visualize
    visualize_topologies(p)

    # Part B: run algorithms
    print(f"\n--- Ring (p={p}) ---")
    t0 = time.time()
    r_steps = ring_all_to_all(p)
    t1 = time.time()
    print(f"  Steps: {r_steps}  |  Time: {(t1-t0)*1000:.2f} ms")

    print(f"\n--- 2D Mesh (p={p}, 4x4) ---")
    t0 = time.time()
    m_steps = mesh_all_to_all(p)
    t1 = time.time()
    print(f"  Steps: {m_steps}  |  Time: {(t1-t0)*1000:.2f} ms")

    print(f"\n--- Hypercube (d={d}, p={p}) ---")
    t0 = time.time()
    h_steps, h_data, h_transit = hypercube_all_to_all(d)
    t1 = time.time()
    print(f"  Steps: {h_steps}  |  Time: {(t1-t0)*1000:.2f} ms")

    # Plot messages in transit for hypercube
    plt.figure(figsize=(7, 4))
    plt.plot(range(1, h_steps + 1), h_transit, marker='o', color='purple')
    plt.xlabel("Step Number")
    plt.ylabel("Messages In Transit")
    plt.title(f"Hypercube All-to-All: Messages in Transit per Step (p={p})")
    plt.tight_layout()
    plt.savefig("/home/wolf/Documents/pdc/Q1_hypercube_transit.png", dpi=100)
    plt.close()

    # Part C: comparison
    compare_topologies([4, 16, 64])

    print("\nDone. All charts saved.")
