const { exec } = require("child_process");

const COUNT_NUM_PACKAGES_CMD =
  "cat package.json | jq '.dependencies, .devDependencies | keys | length' | paste -s -d+ - | bc";

let data = "";

(() => {
  setup();
  main();
})();

function setup() {
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", function (chunk) {
    data += chunk;
  });
}

function main() {
  process.stdin.on("end", function () {
    exec(COUNT_NUM_PACKAGES_CMD, (err, stdout) => {
      const numberOfPackages = parseInt(stdout);
      const results = calcPercentBehind(data, numberOfPackages);
      process.stdout.write(JSON.stringify(results, null, 4));
    });
  });
}

const semverToArr = (semverStr) =>
  semverStr.split(".").map((str) => parseInt(str));

const sortPackages = (packageList) => {
  const behindPatch = [];
  const behindMinor = [];
  const behindMajor = [];

  const sortPackage = (package) => {
    const [name, currentVersion, wanted, latestVersion] = package;
    // handle forked packages (ex., bell, nslds-parser)
    if (latestVersion === "exotic") return;

    const [currentMajor, currentMinor, currentPatch] =
      semverToArr(currentVersion);
    const [latestMajor, latestMinor, latestPatch] = semverToArr(latestVersion);

    if (currentMajor < latestMajor) {
      behindMajor.push(package);
      return;
    }
    if (currentMinor < latestMinor) {
      behindMinor.push(package);
      return;
    }
    if (currentPatch < latestPatch) {
      behindPatch.push(package);
      return;
    }

    throw new Error(`package is not outdated: ${name}`);
  };

  packageList.forEach(sortPackage);

  return { behindPatch, behindMinor, behindMajor };
};

const calcPercentBehind = (yarnOutdatedOutput, numberOfPackages) => {
  const jsonLines = yarnOutdatedOutput.split("\n");
  const lineWithDependencyTable = jsonLines.find((json) =>
    json.includes('{"type":"table"')
  );

  if (!lineWithDependencyTable) {
    throw new Error(
      `Did not receive output from 'yarn outdated'. data: ${yarnOutdatedOutput}`
    );
  }
  const parsedData = JSON.parse(lineWithDependencyTable);
  const packageList = parsedData.data.body;

  const { behindPatch, behindMinor, behindMajor } = sortPackages(packageList);

  const numBehindPatch = behindPatch.length;
  const numBehindMinor = behindMinor.length;
  const numBehindMajor = behindMajor.length;
  const numUpToDate =
    numberOfPackages - numBehindMajor - numBehindMinor - numBehindPatch;

  const percentUpToDate = (numUpToDate / numberOfPackages).toFixed(4);
  const percentBehindPatch = (numBehindPatch / numberOfPackages).toFixed(4);
  const percentBehindMinor = (numBehindMinor / numberOfPackages).toFixed(4);
  const percentBehindMajor = (numBehindMajor / numberOfPackages).toFixed(4);

  return {
    numberOfPackages,
    percentUpToDate,
    percentBehindPatch,
    percentBehindMinor,
    percentBehindMajor,
  };
};
