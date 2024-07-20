/**
 * This module defines constants and configurations for the VIP ranking system.
 */

// Define color constants for each VIP rank
const COLORS = {
    DEFAULT: "#f8b000",
    BRONZE: "#c29c6a",
    SILVER: "#b5cccc",
    GOLD: "#f9d000",
    PLATINUM: "#7fdde8",
    DIAMOND: "#3386ff",
    OBSIDIAN: "#7e1ed8",
    OPAL: "#c0313f"
};

/**
 * Array of VIP ranks with their corresponding values and colors.
 * Based on https://help.stake.com/en/articles/4793501-stake-vip-program-overview
 * @type {Array<{rank: string, value: number, color: string}>}
 */
const vipRanksArray = [
    { rank: "None", value: 0, color: COLORS.DEFAULT },
    { rank: "Bronze", value: 10_000, color: COLORS.BRONZE },
    { rank: "Silver", value: 50_000, color: COLORS.SILVER },
    { rank: "Gold", value: 100_000, color: COLORS.GOLD },
    { rank: "Platinum_I", value: 250_000, color: COLORS.PLATINUM },
    { rank: "Platinum_II", value: 500_000, color: COLORS.PLATINUM },
    { rank: "Platinum_III", value: 1_000_000, color: COLORS.PLATINUM },
    { rank: "Platinum_IV", value: 2_500_000, color: COLORS.PLATINUM },
    { rank: "Platinum_V", value: 5_000_000, color: COLORS.PLATINUM },
    { rank: "Platinum_VI", value: 10_000_000, color: COLORS.PLATINUM },
    { rank: "Diamond_I", value: 25_000_000, color: COLORS.DIAMOND },
    { rank: "Diamond_II", value: 50_000_000, color: COLORS.DIAMOND },
    { rank: "Diamond_III", value: 100_000_000, color: COLORS.DIAMOND },
    { rank: "Diamond_IV", value: 250_000_000, color: COLORS.DIAMOND },
    { rank: "Diamond_V", value: 500_000_000, color: COLORS.DIAMOND },
    { rank: "Obsidian_I", value: 1_000_000_000, color: COLORS.OBSIDIAN },
    { rank: "Obsidian_II", value: 2_500_000_000, color: COLORS.OBSIDIAN },
    { rank: "Opal_I", value: 5_000_000_000, color: COLORS.OPAL },
    { rank: "Opal_II", value: 10_000_000_000, color: COLORS.OPAL },
];

// Make the constants available globally for Chrome extension context
window.COLORS = COLORS;
window.vipRanksArray = vipRanksArray;
