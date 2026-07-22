import fs from "fs";
import path from "path";

const srcDir = "d:/AMIKOM/TUGAS SEM 6/Proyek Pemro/Nicky Frozen/frontend/src";

function search(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            search(fullPath);
        } else if (file.endsWith(".jsx") || file.endsWith(".js")) {
            const content = fs.readFileSync(fullPath, "utf-8");
            if (content.includes("delete") || content.includes("Hapus") || content.includes("Trash")) {
                console.log(`Found in: ${fullPath}`);
                // Print lines containing match
                const lines = content.split("\n");
                lines.forEach((line, idx) => {
                    if (line.includes("delete") || line.includes("Hapus") || line.includes("Trash")) {
                        console.log(`  Line ${idx + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

search(srcDir);
