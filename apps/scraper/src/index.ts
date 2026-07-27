import "dotenv/config";

import { prisma } from "@energyradar/db";
import { getAldiData } from "./scrapers/aldi.js";
import { getEdekaData } from "./scrapers/edeka.js";

const edeka = await getEdekaData();
const aldi = await getAldiData();

console.log(`[Info] Total: ${edeka.length + aldi.length} products`);
