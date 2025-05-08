import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Write the credits to a temp file
    const filePath = path.join(process.cwd(), "app", "api", "dashboard", "data", "altMajor.json");
    fs.writeFileSync(filePath, JSON.stringify({ credits: body.credits }, null, 2));

    // Run masterDegree.py
    const pyPath = path.join(process.cwd(), "app", "api", "dashboard", "masterDegree.py");
    const degreeCSVPath = path.join(process.cwd(), "api", "consolidatedCrawler", "degreeRequirements.csv");

    const cmd = `python "${pyPath}" "${filePath}" "${degreeCSVPath}"`;
    const { stdout } = await execAsync(cmd);

    const majorsLine = stdout.split("\n").find(line => line.startsWith("Majors:")) || "";
    const minorLine = stdout.split("\n").find(line => line.startsWith("Minor:")) || "";

    const majors = majorsLine.replace("Majors:", "").split(/,(?![^()]*\))/).map(s => s.trim()).filter(Boolean);
    const minor = minorLine.replace("Minor:", "").trim();

    return NextResponse.json({ majors, minor });
  } catch (err) {
    console.error("Error in /api/dashboard:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
