import { AUTH_SERVER_BASE_URL } from './config'
import { AccessToken, RefreshToken } from './stores'
import { get } from 'svelte/store';

export const toFixedNumber = function (num, digits, base) {
  var pow = Math.pow(base || 10, digits);
  return Math.round(num * pow) / pow;
};

function uuid4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var rnd = Math.random() * 16 | 0, v = c === 'x' ? rnd : (rnd & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const getElementHeight = function (element) {
  return parseFloat(getComputedStyle(element).height.replace("px", ""));
};

export const toHMS = function (totalSeconds) {
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = Math.floor(totalSeconds % 60);
  let frac = toFixedNumber(totalSeconds % 60 - seconds, 2, 10);
  // If you want strings with leading zeroes:
  minutes = String(minutes).padStart(2, "0");
  hours = String(hours).padStart(2, "0");
  seconds = String(seconds).padStart(2, "0");
  frac = Number.parseFloat(frac).toFixed(2).substring(2);
  return hours + ":" + minutes + ":" + seconds + "." + frac;
};

export const roundToHundredth = (value) => {
  return Number(value.toFixed(2));
};

export const buildDefaultName = (syncData, ext) => {
  return syncData.first_name.toUpperCase().charAt(0) + syncData.last_name.toUpperCase().charAt(0) + syncData.date.replace(/-/g, '') + ext;
}

export const loginGetTokens = function (username, password) {
  return fetch(AUTH_SERVER_BASE_URL + '/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "email": username, "password": password })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.log('login error: ' + data.error);
        return { success: false, error: data.error };
      } else {
        AccessToken.set(data.accessToken);
        RefreshToken.set(data.refreshToken);
        return { success: true }
      }
    });
};

export const getNewAccessToken = function () {
  return fetch(AUTH_SERVER_BASE_URL + '/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + get(RefreshToken)
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        return {
          success: false,
          status: response.status,
          error: {
            message: data.error.message
          }
        }
      }
      AccessToken.set(data.accessToken);
      return {
        success: true,
      }
    });
}

export const fetchWithToken = function (url, method, data) {
  let options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + get(AccessToken),
    },
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options)
    .then(response => {
      if (response.status === 401) {
        // try to refresh the token.
        return getNewAccessToken()
          .then(result => {
            if (result.success) {
              // we have set the new tokens - try again.
              return fetchWithToken(url, method, data);
            } else {
              // failure to refresh the token.
              // result will look like this eg:
              // { success: false, status: 401, error: { message: 'Invalid token' } }
              return result;
            }
          })
      } else {
        // success - no need to refresh the token.
        return response.json()
      }
    }).catch(error => {
      // something more serious happened
      console.log(error);
    })
};

export const downloadBlob = function (blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.click();
  return a;
};

const formatSRTTimecode = (totalSeconds) => {
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = Math.floor(totalSeconds % 60);
  let frac = toFixedNumber(totalSeconds % 60 - seconds, 3, 10);
  // If you want strings with leading zeroes:
  minutes = String(minutes).padStart(2, "0");
  hours = String(hours).padStart(2, "0");
  seconds = String(seconds).padStart(2, "0");
  frac = Number.parseFloat(frac).toFixed(3).substring(2);
  return hours + ":" + minutes + ":" + seconds + "," + frac;
};

export const createSRT = (syncData) => {
  let srt = "";
  let seq = 1;
  for (let i = 0; i < syncData.lines.length; i++) {
    if (syncData.lines[i].audio) {
      srt += `${seq}\n${formatSRTTimecode(syncData.lines[i].start)} --> ${formatSRTTimecode(syncData.lines[i].end)}\n${syncData.lines[i].text}\n\n`
      seq++;
    }
  }
  return srt;
}

const setAttributes = (el, attribs) => {
  for (var key in attribs) {
    el.setAttribute(key, attribs[key]);
  }
};

export const createTimeStampTxt = (syncdata) => {
  let txt = "";
  for (let i = 0; i < syncdata.lines.length; i++) {
    if (syncdata.lines[i].start > 0) {
      txt += `${toHMS(syncdata.lines[i].start)}\t${syncdata.lines[i].text}\n`
    } else {
      txt += `           \t${syncdata.lines[i].text}\n`
    }
  }
  return txt;
}

export const createOpenDVTXML = (syncdata) => {
  // create OpenDVT XML string from syncdata
  var doc = document.implementation.createDocument("", "", null);
  var root = doc.createElement("OpenDVT");
  setAttributes(root, {
    'UUID': `{${uuid4()}}`,
    'ShortID': buildDefaultName(syncdata, ""),
    'Type': "Deposition",
    'Version': "1.4"
  })
  var information = doc.createElement("Information");
  setAttributes(information, {})

  var deponent = doc.createElement("Deponent");

  var firstname = doc.createElement("FirstName");
  firstname.appendChild(doc.createTextNode(syncdata.first_name));

  var middleInitial = doc.createElement("MiddleInitial");
  middleInitial.appendChild(doc.createTextNode(syncdata.middle_initial || ""));

  var lastname = doc.createElement("LastName");
  lastname.appendChild(doc.createTextNode(syncdata.last_name));

  deponent.appendChild(firstname);
  deponent.appendChild(middleInitial);
  deponent.appendChild(lastname);

  var firstPageNo = doc.createElement("FirstPageNo");
  firstPageNo.appendChild(doc.createTextNode(syncdata.lines[0].page_number));

  var lastPageNo = doc.createElement("LastPageNo");
  lastPageNo.appendChild(doc.createTextNode(syncdata.lines[syncdata.lines.length - 1].page_number));

  var maxLinesPerPage = doc.createElement("MaxLinesPerPage");
  maxLinesPerPage.appendChild(doc.createTextNode(syncdata.lines_per_page));

  var volume = doc.createElement("Volume");
  volume.appendChild(doc.createTextNode("1"));

  var takenon = doc.createElement("TakenOn");
  takenon.appendChild(doc.createTextNode(syncdata.date));

  information.appendChild(deponent);
  information.appendChild(firstPageNo);
  information.appendChild(lastPageNo);
  information.appendChild(maxLinesPerPage);
  information.appendChild(volume);
  information.appendChild(takenon);

  var lines = doc.createElement("Lines");
  setAttributes(lines, { 'Count': `${syncdata.lines.length}` });
  for (let i = 0; i < syncdata.lines.length; i++) {
    var line = doc.createElement("Line");
    setAttributes(line, { "ID": "${i}" });

    var stream = doc.createElement("Stream");
    stream.appendChild(doc.createTextNode("0"));

    var timeMs = doc.createElement("TimeMs");
    timeMs.appendChild(doc.createTextNode(Math.round(syncdata.lines[i].start * 1000)));

    var pageNo = doc.createElement("PageNo");
    pageNo.appendChild(doc.createTextNode(syncdata.lines[i].page_number));

    var lineNo = doc.createElement("LineNo");
    lineNo.appendChild(doc.createTextNode(syncdata.lines[i].line_number));

    var qa = doc.createElement("QA");
    qa.appendChild(doc.createTextNode("-"));

    var text = doc.createElement("Text");
    text.appendChild(doc.createTextNode(syncdata.lines[i].text));

    line.appendChild(stream);
    line.appendChild(timeMs);
    line.appendChild(pageNo);
    line.appendChild(lineNo);
    line.appendChild(qa);
    line.appendChild(text);
    lines.appendChild(line);
  }

  var streams = doc.createElement("Streams");
  setAttributes(streams, { 'Count': "1" });

  var stream = doc.createElement("Stream");
  setAttributes(stream, { "ID": "0" });

  var uri = doc.createElement("URI");
  uri.appendChild(doc.createTextNode(`D:\\Media\\${buildDefaultName(syncdata, ".mp4")}`));

  var uriRelative = doc.createElement("URIRelative");
  uriRelative.appendChild(doc.createTextNode(`\\Media${buildDefaultName(syncdata, ".mp4")}`));

  var volumeID = doc.createElement("VolumeID");
  volumeID.appendChild(doc.createTextNode(buildDefaultName(syncdata, "")));

  var FileSize = doc.createElement("FileSize");
  FileSize.appendChild(doc.createTextNode("2959985856"));

  var DurationMs = doc.createElement("DurationMs");
  DurationMs.appendChild(doc.createTextNode(Math.round(syncdata.duration * 1000)));

  var volumeLabel = doc.createElement("VolumeLabel");
  volumeLabel.appendChild(doc.createTextNode(buildDefaultName(syncdata, "")));

  stream.append(uri);
  stream.append(uriRelative);
  stream.append(volumeID);
  stream.append(FileSize);
  stream.append(DurationMs);
  stream.append(volumeLabel);
  streams.appendChild(stream);

  root.appendChild(information);
  root.appendChild(lines);
  root.appendChild(streams);

  doc.appendChild(root);

  var xmlString = new XMLSerializer().serializeToString(doc);
  return xmlString;
}

export const createOncueXML = (syncData) => {
  var doc = document.implementation.createDocument("", "", null);
  var root = doc.createElement("onCue");
  var deposition = doc.createElement("deposition");
  setAttributes(deposition,
    {
      'mediaId': "",
      'depoLastName': syncData.last_name,
      'depoFirstName': syncData.first_name,
      'date': syncData.date,
      'linesPerPage': syncData.lines_per_page.toString(),
    });

  var depoVideo = doc.createElement("depoVideo");
  setAttributes(depoVideo, {
    "ID": "1",
    "filename": syncData.media_path.replace(/^.*[\\\/]/, ''),
    "startTime": "0",
    "endTime": syncData.duration.toString(),
    "firstPGLN": `${syncData.lines[0].page_number.toString()}${syncData.lines[0].line_number.toString().padStart(2, '0')}`,
    "lastPGLN": `${syncData.lines[syncData.lines.length - 1].page_number.toString()}${syncData.lines[syncData.lines.length - 1].line_number.toString().padStart(2, '0')}`,
    "startTuned": "no",
    "stopTuned": "no"
  })

  for (let i = 0; i < syncData.lines.length; i++) {
    let l = syncData.lines[i];
    let lineEl = doc.createElement('depoLine');
    setAttributes(lineEl, {
      "prefix": "",
      "text": l.text.slice(2),
      "page": l.page_number.toString(),
      "line": l.line_number.toString(),
      "pgLN": `${l.page_number.toString()}${l.line_number.toString().padStart(2, '0')}`,
      "videoID": "1",
      "videoStart": l.start,
      "videoStop": l.end,
      "isEdited": "no",
      "isSynched": l.audio ? "yes" : "no",
      "isRedacted": "no"
    })
    depoVideo.appendChild(lineEl);
  }

  deposition.appendChild(depoVideo);
  root.appendChild(deposition);
  doc.appendChild(root);
  var xmlString = new XMLSerializer().serializeToString(doc);
  return xmlString;
}

export const findWitnessName = (txtContent) => {
  let removedBreaks = txtContent.replace(/(\r\n|\n|\r)/gm, " ")
  if (removedBreaks) {
    const re = /deposition of (?:\w+\. )?(?<first>[A-Za-z]+)(?<middle> [A-Z].?)? (?<last>[A-Za-z]+)/i;
    let m = txtContent.match(re);
    if (m) {
      return m.groups
    }
  }
  return null;
}

export const findNonAscii = (str) => {
  return [...str.matchAll(/[^\x00-\x7F]/g)];
}

function findMostCommonLeadingWhitespacePosition(lines) {
  let whitespaceCounts = {};
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let leadingWhitespace = line.match(/^\s*/)[0];
    if (leadingWhitespace) {
      if (whitespaceCounts[leadingWhitespace]) {
        whitespaceCounts[leadingWhitespace]++;
      } else {
        whitespaceCounts[leadingWhitespace] = 1;
      }
    }
  }
  let max = 0;
  let maxWhitespace = "";
  for (let whitespace in whitespaceCounts) {
    if (whitespaceCounts[whitespace] > max) {
      max = whitespaceCounts[whitespace];
      maxWhitespace = whitespace;
    }
  }
  return maxWhitespace;
}

export const ingestTxtFile = (file) => {
  let reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      let text = e.target.result;
      let lines = text.split(/\r\n|\n|\r/);
      let leadingWhitespace = findMostCommonLeadingWhitespacePosition(lines);
      let ret = ""
      lines.forEach((line) => {
        if (line.trim().length > 0) {
          let m = line.match(/^\s+(?<line>\d{0,2})(?<text>.*)/);
          if (line.match(/^\s*/)[0].length <= leadingWhitespace.length + 1) {
            if (m) { ret += `${m.groups.line} ${m.groups.text}\n` }
            else { ret += `${line}\n` }
          }
        };
      });
      resolve(ret);
    }
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsText(file);
  });
}

export const prettyFormatDateTimeStr = (dateTimeStr) => {
  let d = new Date(dateTimeStr);
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let year = d.getFullYear();
  let hours = d.getHours();
  let minutes = d.getMinutes();
  let seconds = d.getSeconds();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
}

function getFilenameFromPath(path) {
  return path.replace(/^.*[\\\/]/, '');
}

export const createTrialBinderXML = (syncData) => {
  // create a "TrialBinder" .xml file for the given syncData
  // syncData is a JSON object with the following properties:
  //   media_path: the path to the media file
  //   duration: the duration of the media file
  //   lines: an array of objects with the following properties:
  //     page_number: the page number of the line
  //     line_number: the line number of the line
  //     text: the text of the line
  //     start: the start time of the line
  //     end: the end time of the line
  let layout = "";
  let text = "";
  let offsets = "";

  for (let i = 0; i < syncData.lines.length; i++) {
    let l = syncData.lines[i];
    text += `\n\t\t\t<Span ID="Span${i}">${l.text}</Span>`;
    offsets += `\n\t\t\t\t\t<Offset ID="Off-Line${l.page_number - 1}${String(l.line_number - 1).padStart(2, '0')}-0" Off="${Math.round(l.start * 1000)}" />`
    if (l.line_number === 1) {
      // if this is the first line of the page,
      // insert page tag
      layout +=
        `\n\t\t<Page ID="Page${l.page_number - 1}" Number="${l.page_number}">`;
    }
    // insert line tag in format <Line ID="Line000" Number="000" Indent=0>
    // followed by span tag in format <SpanRef IDREF="Span0" />
    layout += `\n\t\t\t<Line ID="Line${l.page_number - 1}${String(l.line_number - 1).padStart(2, '0')}" Number="${l.line_number}" Indent="0">`;
    layout += `\n\t\t\t\t<SpanRef IDREF="Span${i}" />`;
    layout += `\n\t\t\t</Line>`;
    if (l.line_number === syncData.lines_per_page || i === syncData.lines.length - 1) {
      // if this is the last line of the page or the last line of the deposition,
      // insert closing page tag
      layout += `\n\t\t</Page>`;
    }
  }

  let output = `<?xml version="1.0" standalone="no" ?>
<!DOCTYPE BinderTranscriptInfo SYSTEM "bndr2001_02_12.dtd">
<BinderTranscriptInfo>
  <StructureEntries>
  </StructureEntries>
  <Issues>
    <Issue ID="Iss000" Color="Pale green">00 Default issue</Issue>
  </Issues>
  <Annotations>
  </Annotations>
  <Transcript>
    <Head>
      <Title>Transcript</Title>
    </Head>
    <Body>
      <Layout>${layout}
      </Layout>
      <Text>
        <Speech Type="Other">${text}
        </Speech>
      </Text>
    </Body>
  </Transcript>
  <VideoEx>
    <VideoSources>
      <VideoSource ID="vs000" Type="file" Format="Mpeg2" Source="${getFilenameFromPath(syncData.media_path)}">
        <MediaLabel>Media 1</MediaLabel>
        <Offsets StartID="Off-Line000-0" EndID="Off-Line${syncData.lines[syncData.lines.length - 1].page_number}${String(syncData.lines[syncData.lines.length - 1].line_number - 1).padStart(2, "0")}-end" />${offsets}
        </Offsets>
      </VideoSource>
    </VideoSources>
  <VideoEx>
</BinderTranscriptInfo>`;

  return output;

}