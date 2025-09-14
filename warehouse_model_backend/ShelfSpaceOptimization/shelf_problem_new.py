# ShelfSpaceOptimization/shelf_problem_new.py

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import matplotlib.patches as mpatches

class FixedShelfPacker3DIncremental:
    """
    Incremental 3D shelf packer.
    - Honors existing placements and shelf compatibilities.
    - Uses persisted free_spaces to place only NEW items without moving old ones.
    - If no space is available for a new item, it is added to unplaced_items.
    - State is fully serializable via get_packing_result_json() and restorable via from_state().

    Expected persisted state format (same as your current get_packing_result_json()):
    {
      "shelves": [
        {
          "id": int,
          "width": number,
          "height": number,
          "depth": number,
          "placed_items": [
            {"x":..,"y":..,"z":..,"width":..,"height":..,"depth":..,"item_type":"..","color":".."}
          ],
          "free_spaces": [
            {"x":..,"y":..,"z":..,"width":..,"height":..,"depth":..}
          ]
        },
        ...
      ],
      "unplaced_items":[ ... ]
    }
    """
    def __init__(
        self,
        shelf_width,
        shelf_height,
        shelf_depth,
        shelf_count,
        compatibility_rules,
        selected_shelf_id=None,
        existing_state=None
    ):
        self.shelf_width = shelf_width
        self.shelf_height = shelf_height
        self.shelf_depth = shelf_depth
        self.shelf_count = shelf_count
        self.compatibility_rules = {k: set(v) for k, v in compatibility_rules.items()}
        self.selected_shelf_id = selected_shelf_id

        # new items queued to place (tuples like old class)
        self.items = []
        self.unplaced_items = []

        if existing_state:
            self._load_from_state(existing_state)
        else:
            self._init_empty_state()

        # derive/ensure per-shelf compatibility from existing items if not set
        for shelf in self.shelves:
            if not shelf.get("compatibility"):
                # If there are already items, union their allowed compatibilities
                if shelf["placed_items"]:
                    # take the first item's type as baseline
                    t0 = shelf["placed_items"][0][6]
                    shelf["compatibility"] = self.compatibility_rules.get(t0, {t0}).copy()
                else:
                    shelf["compatibility"] = set()

        # figure & axes for optional animation
        self.fig = plt.figure(figsize=(12, 8))
        self.ax = self.fig.add_subplot(111, projection='3d')
        self._animation_step_index = 0

    # ---------- State helpers ----------

    def _init_empty_state(self):
        self.shelves = [
            {
                "id": i,
                "width": self.shelf_width,
                "height": self.shelf_height,
                "depth": self.shelf_depth,
                "compatibility": set(),
                "placed_items": [],  # tuples (x, y, z, w, h, d, item_type, color)
                # default full space free
                "free_spaces": [(0, 0, 0, self.shelf_width, self.shelf_height, self.shelf_depth)],
            }
            for i in range(self.shelf_count)
        ]

    def _load_from_state(self, state_dict):
        shelves = state_dict.get("shelves", [])
        self.shelves = []
        for s in shelves:
            # read placed_items
            placed_raw = s.get("placed_items", [])
            placed = [
                (
                    pi["x"], pi["y"], pi["z"],
                    pi["width"], pi["height"], pi["depth"],
                    pi.get("item_type"), pi.get("color")
                )
                for pi in placed_raw
            ]

            # read free_spaces (prefer persisted)
            if s.get("free_spaces"):
                free = [
                    (fs["x"], fs["y"], fs["z"], fs["width"], fs["height"], fs["depth"])
                    for fs in s["free_spaces"]
                ]
            else:
                # If free spaces are not provided:
                # If no items: whole shelf free; otherwise we cannot reconstruct exactly—start with no free space.
                free = []
                if not placed:
                    free = [(0, 0, 0, s["width"], s["height"], s["depth"])]

            self.shelves.append({
                "id": s.get("id"),
                "width": s.get("width", self.shelf_width),
                "height": s.get("height", self.shelf_height),
                "depth": s.get("depth", self.shelf_depth),
                "compatibility": set(),         # will set later
                "placed_items": placed,         # tuples
                "free_spaces": free,            # tuples
            })

        # carry forward previous unplaced (optional)
        prev_unplaced = state_dict.get("unplaced_items", [])
        for ui in prev_unplaced:
            self.unplaced_items.append((
                ui["width"], ui["height"], ui["depth"],
                ui.get("item_type"), ui.get("color")
            ))

    @classmethod
    def from_state(cls, compatibility_rules, state_dict):
        """
        Convenience constructor when you only have state and compatibility.
        Takes global shelf dimensions from first shelf in state.
        """
        if not state_dict.get("shelves"):
            raise ValueError("State dict has no shelves")

        s0 = state_dict["shelves"][0]
        width = s0["width"]
        height = s0["height"]
        depth = s0["depth"]
        count = len(state_dict["shelves"])
        return cls(
            shelf_width=width,
            shelf_height=height,
            shelf_depth=depth,
            shelf_count=count,
            compatibility_rules=compatibility_rules,
            existing_state=state_dict
        )

    # ---------- Public API ----------

    def add_item(self, width, height, depth, item_type, color=None):
        self.items.append((width, height, depth, item_type, color))

    def place_all_new_items(self):
        """
        Attempts to place only the NEW items (self.items), respecting current
        placed items and free_spaces.
        """
        for _ in range(len(self.items)):
            self._place_next_item()

    # ---------- Packing internals ----------

    def _find_best_slot(self, item_type, width, height, depth):
        best = None
        min_waste = float("inf")

        for shelf in self.shelves:
            # Shelf compatibility: empty set means not yet restricted;
            # otherwise the item_type must be allowed.
            if shelf["compatibility"] and item_type not in shelf["compatibility"]:
                continue

            for i, (x, y, z, w, h, d) in enumerate(shelf["free_spaces"]):
                # axis-aligned rotations
                for rw, rh, rd in [
                    (width, height, depth),
                    (height, width, depth),
                    (depth, width, height),
                ]:
                    if rw <= w and rh <= h and rd <= d:
                        waste = (w - rw) * (h - rh) * (d - rd)
                        if waste < min_waste:
                            min_waste = waste
                            best = (shelf, i, x, y, z, rw, rh, rd)

        return best

    def _place_next_item(self):
        if not self.items:
            return

        width, height, depth, item_type, color = self.items.pop(0)
        fit = self._find_best_slot(item_type, width, height, depth)

        if not fit:
            # could not place — leave items fixed, record as unplaced
            self.unplaced_items.append((width, height, depth, item_type, color))
            return

        shelf, idx, x, y, z, w, h, d = fit

        # Initialize shelf compatibility if it was open
        if not shelf["compatibility"]:
            shelf["compatibility"] = self.compatibility_rules.get(item_type, {item_type}).copy()

        # Place the item
        shelf["placed_items"].append((x, y, z, w, h, d, item_type, color))

        # Split the free space (guillotine-style)
        del shelf["free_spaces"][idx]
        # split into three orthogonal leftover spaces
        # +X
        if shelf["width"] - (x + w) > 0:
            shelf["free_spaces"].append((x + w, y, z, shelf["width"] - (x + w), h, d))
        # +Y
        if shelf["height"] - (y + h) > 0:
            shelf["free_spaces"].append((x, y + h, z, w, shelf["height"] - (y + h), d))
        # +Z
        if shelf["depth"] - (z + d) > 0:
            shelf["free_spaces"].append((x, y, z + d, w, h, shelf["depth"] - (z + d)))

        # Optional: coalesce very small/degenerate spaces
        shelf["free_spaces"] = [
            fs for fs in shelf["free_spaces"] if fs[3] > 0 and fs[4] > 0 and fs[5] > 0
        ]

    # ---------- Visualization & Serialization ----------

    def _draw_frame(self):
        self.ax.clear()
        self.ax.set_title("3D Shelf Packing (Incremental — fixed items stay put)", fontsize=14)
        self.ax.set_xlabel("Width (X)")
        self.ax.set_ylabel("Height (Y)")
        self.ax.set_zlabel("Depth (Z)")

        self.ax.set_xlim(0, self.shelf_width)
        self.ax.set_ylim(0, self.shelf_height)
        self.ax.set_zlim(0, self.shelf_depth * self.shelf_count + 20)
        self.ax.view_init(elev=25, azim=-60)

        color_map = {
            "toxic": "red",
            "acid": "blue",
            "flammable": "orange",
            "biohazard": "purple",
            "explosive": "yellow",
            "corrosive": "brown",
            "normal": "green",
        }

        # Draw shelves & placed items
        for shelf in self.shelves:
            shelf_id = shelf["id"]
            if self.selected_shelf_id is not None and shelf_id != self.selected_shelf_id:
                continue

            x0, y0, z0 = 0, 0, shelf_id * self.shelf_depth
            x1 = self.shelf_width
            y1 = self.shelf_height
            z1 = z0 + self.shelf_depth

            edges = [
                [(x0, x1), (y0, y0), (z0, z0)],
                [(x0, x1), (y1, y1), (z0, z0)],
                [(x0, x1), (y0, y0), (z1, z1)],
                [(x0, x1), (y1, y1), (z1, z1)],
                [(x0, x0), (y0, y1), (z0, z0)],
                [(x1, x1), (y0, y1), (z0, z0)],
                [(x0, x0), (y0, y1), (z1, z1)],
                [(x1, x1), (y0, y1), (z1, z1)],
                [(x0, x0), (y0, y0), (z0, z1)],
                [(x1, x1), (y0, y0), (z0, z1)],
                [(x0, x0), (y1, y1), (z0, z1)],
                [(x1, x1), (y1, y1), (z0, z1)],
            ]
            for xe, ye, ze in edges:
                self.ax.plot3D(xe, ye, ze, color='blue', linewidth=1.0, alpha=0.3)

            for x, y, z, w, h, d, item_type, item_color in shelf["placed_items"]:
                z_offset = shelf_id * self.shelf_depth
                color = item_color if item_color else color_map.get(item_type, "gray")
                self.ax.bar3d(x, y, z_offset + z, w, h, d, color=color, alpha=0.7, edgecolor="black")

        # legend from seen types
        seen = {}
        for shelf in self.shelves:
            for _, _, _, _, _, _, item_type, item_color in shelf["placed_items"]:
                if item_type not in seen:
                    seen[item_type] = item_color if item_color else color_map.get(item_type, "gray")
        legend_patches = [mpatches.Patch(color=c, label=t) for t, c in seen.items()]
        if legend_patches:
            self.ax.legend(handles=legend_patches, loc='upper left', fontsize=7)

    def animate(self, save_path="static/shelf_incremental.gif"):
        """
        Optional: animate just the state (no per-item animation unless you
        call place_all_new_items() step by step externally). Here we
        simply render the final state to a single-frame GIF.
        """
        # If you want the original step-by-step effect, you can instead:
        # - Keep items in a queue and create frames by placing one per frame.

        # one-frame animation for compatibility with your current flow
        def _frame(_):
            self._draw_frame()
            return []

        anim = animation.FuncAnimation(
            self.fig, _frame, frames=1, interval=500, repeat=False, blit=False
        )
        anim.save(save_path, writer='pillow')
        plt.close(self.fig)

    def get_packing_result_json(self):
        shelves_data = []
        for shelf in self.shelves:
            shelves_data.append({
                "id": shelf["id"],
                "width": shelf["width"],
                "height": shelf["height"],
                "depth": shelf["depth"],
                "placed_items": [
                    {
                        "x": x, "y": y, "z": z,
                        "width": w, "height": h, "depth": d,
                        "item_type": item_type,
                        "color": color
                    }
                    for (x, y, z, w, h, d, item_type, color) in shelf["placed_items"]
                ],
                "free_spaces": [
                    {"x": x, "y": y, "z": z, "width": w, "height": h, "depth": d}
                    for (x, y, z, w, h, d) in shelf["free_spaces"]
                ],
            })

        result = {
            "shelves": shelves_data,
            "unplaced_items": [
                {
                    "width": width, "height": height, "depth": depth,
                    "item_type": item_type, "color": color
                }
                for (width, height, depth, item_type, color) in self.unplaced_items
            ]
        }
        return result
