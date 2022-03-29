process.stdin.resume();
process.stdin.setEncoding('utf8');
let data = '';

process.stdin.on('data', function (chunk) {
  data += chunk;
});

process.stdin.on('end', function () {
  const jsonLines = data.split('\n');
  const lineWithDependencyTable = jsonLines.find(json =>
    json.includes('{"type":"table"'),
  );

  if (!lineWithDependencyTable) {
    console.log('data:', data);
    throw new Error(
      `Did not receive output from 'yarn outdated'. data: ${data}`,
    );
  }
  const parsedData = JSON.parse(lineWithDependencyTable);
  const packageList = parsedData.data.body;

  const numberOfPackages = packageList?.length;

  const upToDate = [];
  const behindPatch = [];
  const behindMinor = [];
  const behindMajor = [];

  packageList?.forEach(package => {
    const [name, currentVersion, wanted, latestVersion] = package;
    const [currentMajor, currentMinor, currentPatch] = currentVersion;
    const [latestMajor, latestMinor, latestPatch] = latestVersion;

    if (currentMajor >= latestMajor) {
      if (currentMinor >= latestMinor) {
        if (currentPatch >= latestPatch) {
          upToDate.push(package);
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

  const numUpToDate = upToDate.length;
  const numBehindPatch = behindPatch.length;
  const numBehindMinor = behindMinor.length;
  const numBehindMajor = behindMajor.length;

  const percentUpToDate = (numUpToDate / numberOfPackages).toFixed(2);
  const percentBehindPatch = (numBehindPatch / numberOfPackages).toFixed(2);
  const percentBehindMinor = (numBehindMinor / numberOfPackages).toFixed(2);
  const percentBehindMajor = (numBehindMajor / numberOfPackages).toFixed(2);

  const results = {
    numberOfPackages,
    percentUpToDate,
    percentBehindPatch,
    percentBehindMinor,
    percentBehindMajor,
  };
  process.stdout.write(JSON.stringify(results, null, 4));
});
