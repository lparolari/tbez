const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const HTMLParser = require('node-html-parser');
var http = require('http');

const filePath = "data/reports.json";

const parseDate = (str) => {
  const day = str.split(" ")[0]
  const month = str.split(" ")[1]
  const year = str.split(" ")[2]

  const months = {
    "Gennaio": "01",
    "Febbraio": "02",
    "Marzo": "03",
    "Aprile": "04",
    "Maggio": "05",
    "Giugno": "06",
    "Luglio": "07",
    "Agosto": "08",
    "Settembre": "09",
    "Ottobre": "10",
    "Novembre": "11",
    "Dicembre": "12"
  }

  return new Date(year + "-" + months[month] + "-" + day).toISOString()
}

const tbnewsCallback = function(response) {
  var str = '';

  response.on('data', function(chunk) {
    str += chunk;
  });

  response.on('end', function() {
    const root = HTMLParser.parse(str);

    const newsContainers = root.getElementById("news_container").querySelectorAll(".video")

    for (const newsContainer of newsContainers) {
      const newsLink = newsContainer.getElementsByTagName("a")[0]
      const newsHref = newsLink.attributes.href

      http.request({
        host: 'www.teleboario.it',
        path: newsHref
      }, videoCallback).end();
    }
  });
}

const videoCallback = function(response) {
  var str = '';

  response.on('data', function(chunk) {
    str += chunk;
  });

  response.on('end', function() {
    const root = HTMLParser.parse(str);
    const vidPlayer = root.getElementById("video_notizia")
    const vidDesc = root.getElementById("video_text")

    const title = vidDesc.getElementsByTagName("h1")[0].text.trim()

    if (vidPlayer) {
      const poster = vidPlayer.attributes.poster
      const video = poster.substring(0, poster.indexOf(".mp4")) + ".mp4"
      const rawName = video.split("/")[video.split("/").length - 1]
      const publishedAt = parseDate(vidDesc.querySelector("div.mb-1").childNodes[2].text.replaceAll("|", "").trim())
      const size = vidDesc.querySelector("span").text.trim()

      console.log("Processing", title)

      const txt = fs.readFileSync(filePath, "utf8");
      const vids = JSON.parse(txt)

      const data = {
        id: uuidv4(),
        url: video,
        name: title,
        rawName: rawName,
        size,
        publishedAt,
      }

      fs.writeFileSync(filePath, JSON.stringify(vids.concat(data)));
    } else {
      console.log("Skipped", title)
    }

  });
}

const main = () => {
  fs.writeFileSync(filePath, "[]");
  http.request({
    host: 'www.teleboario.it',
    path: '/tbnews'
  }, tbnewsCallback).end();
}

main()
