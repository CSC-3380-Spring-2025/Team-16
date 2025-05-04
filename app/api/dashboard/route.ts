import { NextResponse } from "next/server";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    console.log("--- Starting Degree Match Process ---");

    const userCreditPath = path.resolve("app/api/dashboard/data/userCredit.json");
    const degreeCSVPath = path.resolve("api/consolidatedCrawler/degreeRequirements.csv");
    const scriptPath = path.resolve("app/api/dashboard/masterDegree.py");

    const command = `python "${scriptPath}" "${userCreditPath}" "${degreeCSVPath}"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) console.error("stderr:", stderr);
    console.log("stdout:", stdout);

    const lines = stdout.trim().split("\n");
    const majorsRaw = lines.find(line => line.startsWith("Majors:")) || "";
    const minorRaw = lines.find(line => line.startsWith("Minor:")) || "";

    const majors = majorsRaw.replace("Majors:", "").split(",").map(s => s.trim()).filter(Boolean);
    const minor = minorRaw.replace("Minor:", "").trim();

    return NextResponse.json({ majors, minor });
  } catch (error) {
    console.error("Error running degree match:", error);
    return NextResponse.json({ error: "Internal error running degree match" }, { status: 500 });
  }
}
