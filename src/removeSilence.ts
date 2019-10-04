import {
  exec,
  spawn,
  ChildProcess,
} from "child_process";
import * as path from "path";
import * as readline from "readline";
import * as shell from "shelljs";

interface TimeRange {
  beginning: number;
  duration?: number;
  end?: number;
}

interface SpawnResult {
  code: number;
  stdout: string[];
  stderr: string[];
}

const processName = "ffmpeg";

const spawnToPromise = (
  command: string,
  args: string[],
  printProgressToConsole: boolean,
  useExec?: boolean
): Promise<SpawnResult> => {
  return new Promise((resolve, reject) => {
    let childProcess: ChildProcess;
    if (useExec) {
      args.unshift(processName);
      childProcess = exec(args.join(" "));
    } else {
      const options = {
        shell: true,
      };
      childProcess = spawn(command, args, options);
    }

    const rlStdErr = readline.createInterface(childProcess.stderr);
    const rlStdOut = readline.createInterface(childProcess.stdout);
    
    const result: SpawnResult = {
      code: -1,
      stderr: [],
      stdout: [],
    };
    rlStdErr.on("line", line => {
      if (printProgressToConsole) {
        console.log(`${command}: stderr: ${line}`);
      }
      result.stderr.push(line);
    });
    rlStdOut.on("line", line => {
      if (printProgressToConsole) {
        console.log(`${command}: stdout: ${line}`);
      }
      result.stdout.push(line);
    });

    childProcess.on("close", code => {
      if (printProgressToConsole) {
        console.log(`${command} exited with code ${code}`);
      }
      result.code = code;
      resolve(result);
    });

    childProcess.on("error", err => {
      if (printProgressToConsole) {
        console.log(`${command} failed`, err);
      }
      reject(err);
    });
  });
}

const analyzeForSilence = async (
  inputFile: string,
  verbose?: boolean
): Promise<TimeRange[]> => {
  console.log(`Analyzing '${inputFile}' for silence`);
  const args = [
    "-y",
    "-nostats",
    "-i", inputFile,
    "-af", "silencedetect=n=-50dB:d=10",
    "-c:v", "copy",
    "-c:a", "libmp3lame",
    "-f", "mp4",
    "/dev/null",
  ];
  const silenceDetectResult = await spawnToPromise(processName, args, verbose);

  const silenceRanges: TimeRange[] = [];
  const reStart = /.*silence_start: ([0-9\.]+)/;
  const reEnd = /.*silence_end: ([0-9\.]+) \| silence_duration: ([0-9\.]+).*/;
  let beginning: number = null;
  for (const line of silenceDetectResult.stderr) {
    if (line.indexOf("silencedetect") !== -1) {
      const startMatch = reStart.exec(line);
      const endMatch = reEnd.exec(line);
      if (startMatch) {
        beginning = Number(startMatch[1]);
      } else if (endMatch) {
        const end = Number(endMatch[1]);
        const duration = Number(endMatch[2]);
        silenceRanges.push({
          beginning,
          duration,
          end,
        });
        beginning = null;
      }
    }
  }
  
  return silenceRanges;
};

const getNonSilentRanges = (
  silenceRanges: TimeRange[]
): TimeRange[] => {
  const nonSilentRanges: TimeRange[] = [];
  let previousRange: TimeRange = null;
  for (const currentRange of silenceRanges) {    
    const beginning = previousRange ? previousRange.end : 0;
    const end = currentRange.beginning;
    const duration = end - beginning;
    if (duration > 1) {
      nonSilentRanges.push({
        beginning,
        duration,
        end,
      });
    }

    previousRange = currentRange;
    if (!previousRange.end) {
      break;
    }    
  }

  if (previousRange.end) {
    nonSilentRanges.push({
      beginning: previousRange.end,
    });
  }
  return nonSilentRanges;
};

const createSegment = async (
  inputFile: string,
  outputFile: string,
  timeRange: TimeRange
): Promise<SpawnResult> => {
  const args1: string[] = [
    "-y",
    "-nostats",
    "-i", inputFile,
    "-ss", timeRange.beginning.toString(),
  ];
  if (timeRange.end) {
    args1.push("-to");
    args1.push(timeRange.end.toString());
  }
  const args: string[] = [
    ...args1,
    "-c", "copy",
    "-bsf:v", "h264_mp4toannexb",
    "-f", "mpegts",
    outputFile,
  ];

  const segmentResult = await spawnToPromise(processName, args, false);
  return segmentResult;
};

const combineSegments = async (
  outputFile: string,
  segmentFiles: string[],
  verbose: boolean
): Promise<SpawnResult> => {
  const args: string[] = [
    "-y",
    "-nostats",
    "-f", "mpegts",
    "-i", `"concat:${segmentFiles.join("|")}"`,
    "-c", "copy",
    "-bsf:a", "aac_adtstoasc",
    outputFile,
  ];

  const combineResult = await spawnToPromise(processName, args, verbose, true);
  return combineResult;
}

const removeSilences = async (
  inputFile: string,
  nonSilentRanges: TimeRange[],
  verbose?: boolean
): Promise<any> => {
  const parts = path.parse(inputFile);
  const outputDirectory = parts.dir;
  const outputFile = path.format({
    dir: outputDirectory,
    ext: parts.ext,
    name: `processed_${parts.name}`,
  });
  console.log(`silences found, creating ${outputFile}`);

  const segmentFiles: string[] = [];
  for (let i = 0; i < nonSilentRanges.length; i++) {
    const segmentFile = `/app/segment${i}_${parts.name}${parts.ext}`;
    segmentFiles.push(segmentFile);
    shell.exec(`mkfifo ${segmentFile}`);
    createSegment(inputFile, segmentFile, nonSilentRanges[i]);
  }

  await combineSegments(outputFile, segmentFiles, verbose);
  for (const segmentFile of segmentFiles) {
    shell.exec(`rm ${segmentFile}`);
  }
};

export const removeSilence = async(
  inputFile: string,
): Promise<any> => {
  const silenceRanges = await analyzeForSilence(inputFile);
  if (silenceRanges.length < 1) {
    console.log("no silences found");
    return;
  }

  const nonSilentRanges = getNonSilentRanges(silenceRanges);

  return await removeSilences(inputFile, nonSilentRanges);
};