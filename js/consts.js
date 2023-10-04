DEFAULT_COLOR = "#f8b000"
BRONZE_COLOR = "#c29c6a"
SILVER_COLOR = "#b5cccc"
GOLD_COLOR = "#f9d000"
PLATINUM_COLOR = "#7fdde8"
DIAMOND_COLOR = "#3386ff"
OBSIDIAN_COLOR = "#7e1ed8"
OPAL_COLOR = "#c0313f"

// Based on https://help.stake.com/en/articles/4793501-stake-vip-program-overview
const vipRanksArray = [
    {rank: "None", value: 0, color: DEFAULT_COLOR},
    {rank: "Bronze", value: 10_000, color: BRONZE_COLOR},
    {rank: "Silver", value: 50_000, color: SILVER_COLOR},
    {rank: "Gold", value: 100_000, color: GOLD_COLOR},
    {rank: "Platinum_I", value: 250_000, color: PLATINUM_COLOR},
    {rank: "Platinum_II", value: 500_000, color: PLATINUM_COLOR},
    {rank: "Platinum_III", value: 1_000_000, color: PLATINUM_COLOR},
    {rank: "Platinum_IV", value: 2_500_000, color: PLATINUM_COLOR},
    {rank: "Platinum_V", value: 5_000_000, color: PLATINUM_COLOR},
    {rank: "Platinum_VI", value: 10_000_000, color: PLATINUM_COLOR},
    {rank: "Diamond_I", value: 25_000_000, color: DIAMOND_COLOR},
    {rank: "Diamond_II", value: 50_000_000, color: DIAMOND_COLOR},
    {rank: "Diamond_III", value: 100_000_000, color: DIAMOND_COLOR},
    {rank: "Diamond_IV", value: 250_000_000, color: DIAMOND_COLOR},
    {rank: "Diamond_V", value: 500_000_000, color: DIAMOND_COLOR},
    {rank: "Obsidian_I", value: 1_000_000_000, color: OBSIDIAN_COLOR}
    {rank: "Obsidian_II", value: 2_500_000_000, color: OBSIDIAN_COLOR}
    {rank: "Opal_I", value: 5_000_000_000, color: OPAL_COLOR}
    {rank: "Opal_II", value: 10_000_000_000, color: OPAL_COLOR}
];