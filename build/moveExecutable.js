const fs = require("fs-extra");
const { basename } = require("path");

exports.default = (context) => {
    const exPath = "executables";
    context.artifactPaths.forEach((artifact) => {
        console.info(
            `[AfterBuild] Moving artifact "${basename(
                artifact
            )}" to "${exPath}/${basename(artifact)}"`
        );

        let destination = artifact.split("/");
        destination.splice(destination.length - 1, 0, exPath);
        destination = destination.join("/");

        fs.moveSync(artifact, destination, { overwrite: true });
    });
};
