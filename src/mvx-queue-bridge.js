const fs = require("fs/promises");
const fssync = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getState, getActiveAccount, getAccountQueueDirs, ensureAccountDirs, PLATFORMS } = require("./account-manager");

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".avi", ".mkv"]);

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fssync.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function safeName(name) {
  return String(name || "asset")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "asset";
}

async function resolveAccount(accountId) {
  const state = await getState();
  if (!accountId) return getActiveAccount();
  const found = state.accounts.find((item) => item.id === accountId);
  if (!found) throw new Error("account_not_found");
  return found;
}

async function enqueue({ sourcePath, platform, accountId, caption = "", workflowRunId = "", contentId = "" }) {
  const normalizedPlatform = String(platform || "").toLowerCase();
  if (!PLATFORMS.includes(normalizedPlatform)) throw new Error("unsupported_platform");
  const source = path.resolve(String(sourcePath || ""));
  const stat = await fs.stat(source);
  if (!stat.isFile()) throw new Error("source_not_file");
  const extension = path.extname(source).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(extension)) throw new Error("unsupported_video_extension");

  const account = await resolveAccount(accountId);
  await ensureAccountDirs(account.id);
  const dirs = getAccountQueueDirs(account.id);
  const stem = safeName(`${workflowRunId || "mvx"}-${contentId || path.parse(source).name}`);
  let destination = path.join(dirs[normalizedPlatform].pending, `${stem}${extension}`);
  let suffix = 2;
  while (true) {
    try {
      await fs.access(destination);
      destination = path.join(dirs[normalizedPlatform].pending, `${stem}-${suffix}${extension}`);
      suffix += 1;
    } catch {
      break;
    }
  }

  await fs.copyFile(source, destination, fssync.constants.COPYFILE_EXCL);
  const captionPath = path.join(path.dirname(destination), `${path.parse(destination).name}.description`);
  if (caption) await fs.writeFile(captionPath, String(caption), "utf8");

  return {
    status: "queued",
    published: false,
    platform: normalizedPlatform,
    accountId: account.id,
    queuePath: destination,
    captionPath: caption ? captionPath : null,
    sha256: await sha256(destination),
    workflowRunId: workflowRunId || null,
    contentId: contentId || null,
  };
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  const result = await enqueue(payload);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}

module.exports = { enqueue };
