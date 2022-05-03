const { exec } = require("child_process");

process.stdin.resume();
process.stdin.setEncoding("utf8");
let data = "";

process.stdin.on("data", function (chunk) {
  data += chunk;
});

process.stdin.on("end", function () {
  exec(
    "cat package.json | jq '.dependencies, .devDependencies | keys | length' | paste -s -d+ - | bc",
    (err, stdout) => {
      const jsonLines = data.split("\n");
      const lineWithDependencyTable = jsonLines.find((json) =>
        json.includes('{"type":"table"')
      );

      if (!lineWithDependencyTable) {
        console.log("data:", data);
        throw new Error(
          `Did not receive output from 'yarn outdated'. data: ${data}`
        );
      }
      const parsedData = JSON.parse(lineWithDependencyTable);
      const packageList = parsedData.data.body;

      const numberOfPackages = parseInt(stdout);

      const behindPatch = [];
      const behindMinor = [];
      const behindMajor = [];

      packageList?.forEach((package) => {
        const [name, currentVersion, wanted, latestVersion] = package;
        const [currentMajor, currentMinor, currentPatch] = currentVersion
          .split(".")
          .map((str) => parseInt(str));
        const [latestMajor, latestMinor, latestPatch] = latestVersion
          .split(".")
          .map((str) => parseInt(str));

        if (currentMajor >= latestMajor) {
          if (currentMinor >= latestMinor) {
            if (currentPatch >= latestPatch) {
              throw new Error(`package is not outdated: ${name}`);
            } else {
              behindPatch.push(package);
            }
          } else {
            behindMinor.push(package);
          }
        } else {
          behindMajor.push(package);
        }
      });

      const numBehindPatch = behindPatch.length;
      const numBehindMinor = behindMinor.length;
      const numBehindMajor = behindMajor.length;
      const numUpToDate =
        numberOfPackages - numBehindMajor - numBehindMinor - numBehindPatch;

      const percentUpToDate = (numUpToDate / numberOfPackages).toFixed(4);
      const percentBehindPatch = (numBehindPatch / numberOfPackages).toFixed(4);
      const percentBehindMinor = (numBehindMinor / numberOfPackages).toFixed(4);
      const percentBehindMajor = (numBehindMajor / numberOfPackages).toFixed(4);

      const results = {
        numberOfPackages,
        percentUpToDate,
        percentBehindPatch,
        percentBehindMinor,
        percentBehindMajor,
      };
      process.stdout.write(JSON.stringify(results, null, 4));
    }
  );
});
