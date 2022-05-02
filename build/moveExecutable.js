const { readFileSync, writeFileSync } = require("fs-extra");
const { moveSync } = require("fs-extra");
const { basename, parse, dirname, join } = require("path");
const { createHash } = require("crypto");

const artifactFolder = "artifacts";

exports.default = (context) => {
    context.artifactPaths.forEach((artifact) => {
        console.info(
            `[AfterBuild] Moving artifact "${basename(
                artifact
            )}" to "${artifactFolder}/${basename(artifact)}"`
        );

        let destination = artifact.split("/");
        destination.splice(destination.length - 1, 0, artifactFolder);
        destination = destination.join("/");

        moveSync(artifact, destination, { overwrite: true });
        createHashFiles(destination, ["md5", "sha256"]);
    });
};

function generateHash(file, alg, digest = "hex") {
    const buffer = readFileSync(file);
    return createHash(alg).update(buffer).digest(digest);
}

function createHashFiles(file, algs = ["md5"]) {
    const hashFilename = parse(file).name;
    algs.forEach((alg) => {
        const filePath = join(dirname(file), `${hashFilename}.${alg}`);
        const hash = generateHash(file, alg);
        createFile(filePath, hash);
    });
}

function createFile(filename, data) {
    writeFileSync(filename, data, { encoding: "utf8" });
}
