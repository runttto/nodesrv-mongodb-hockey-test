const http = require('http');
const path = require('path');
const fs = require('fs');
const prompt = require('prompt');

var allPlayers = [];

prompt.start();

prompt.get(['username', 'password', 'clustername', 'dbname', 'collectionname'], function (err, result) {
  if (err) {
      console.log(err);
      throw err;
  }
  getDBContent(result.username, result.password, result.clustername, result.dbname, result.collectionname);
});

function getDBContent(username, password, clustername, dbname, collectionname) {
  var MongoClient = require('mongodb').MongoClient;

  // Read only here
  var url = `mongodb+srv://${username}:${password}@${clustername}.ew0fe.mongodb.net`;
    
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db(`${dbname}`);
    dbo.collection(`${collectionname}`).find({}).toArray(function(err, result) {
      if (err) throw err;
      allPlayers = result;
      db.close();
      createServer();
    });
  });
} 

function createServer() {
    const server = http.createServer((req, res) => {
        let filePath = path.join(
            __dirname, 
            'public', 
            req.url
        );
    
        let extName = path.extname(filePath);
    
        // Default
        let contentType = 'text/html';
    
        switch (extName) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;        
        }
    
        fs.readFile(filePath, (err, content) => {
            if (err) {
                // Page not found, created here.
                if (err.code == 'ENOENT') {
                    // An example of json here, can contain anything.
                    if (req.url === '/api/pelaajat.json') {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(JSON.stringify(allPlayers));
                    } else if (req.url.includes('/api/pelaajat?') && 
                        req.url.includes('=')) {
                        if (getPlayerFromUrl(req.url)) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(getPlayerFromUrl(req.url));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end('<h1 style="font-family:tahoma;color:gray">Ei pelaajaa</h1><p style="color:blue">Tarkista nimi</p>');
                        }
                    } else if (req.url === '/peli') {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write('<ul>');
                        res.write(`${ showPlayers() }`);
                        res.end('</ul>');
                    }
                } else {
                    // Other server error
                    res.writeHead(500);
                    res.end(`Server error: ${err.code}`);
                }
            } else {
                // Success (if existing content from path)
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf8');
            }
        });
        console.log(filePath);
    });
    
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`Server port is ${PORT}`));
}

function getPlayerFromUrl(url) {
    var foundPlayer = '';
    const first = url.split('?');
    const second = first[1].split('=');
    var success = false;
    var count = 0;
    for (player in allPlayers) {
        const third = second[1].split('%20');
        const fourth = third[0] + third[1];
        // Replace spaces and scandics
        if (fourth === allPlayers[count].nimi.replace(/\s/g, '').replace('ä', 
            '%C3%A4').replace('ö', '%C3%B6')) {
            foundPlayer = JSON.stringify(allPlayers[count]);
            success = true;
        }
        count++;
    }
    return foundPlayer;
}

function showPlayers() {
    /* Single Player example
      nimi:"Antti Hyökkääjä"
      tyyppi:"hyokkaaja"
      maalit:"1"
      syotot:"2"
      plusmiinus:"3"
      jaahyt:"4" */

    // Commented css out here.
    var retStr = '<link rel="stylesheet">'; // = '<link rel="stylesheet" href="./css/style.css">';
    retStr += '<p>Hy&oumlkk&auml&aumlj&aumlt</p>';
    var count = 0;
    var plrType = 'hyokkaaja'; // first value
    for (player in allPlayers) {
        if (plrType !== allPlayers[count].tyyppi) {
            if (allPlayers[count].tyyppi === 'puolustaja') {
                retStr += '<p>Puolustajat</p>';
            } else {
                retStr += '<p>Maalivahdit</p>';
            }
        }
        plrType = allPlayers[count].tyyppi;
        retStr += '<li><strong>' + allPlayers[count].nimi.replace('ä', 
            '&auml').replace('ö', '&ouml') + '</strong>' +
            '&emsp;Maalit: ' + allPlayers[count].maalit +
            '&emsp;Sy&oumlt&oumlt: ' + allPlayers[count].syotot +
            getPlayerOrGoalieSpecifics(plrType, count) +
            '&emsp;J&auml&aumlhyt: ' + allPlayers[count].jaahyt +
            '&emsp;Yhteens&auml: <strong>' + getPlayerScore(count) + '</strong>' + 
            '</li>';

        count++;
    }
    return retStr;
}

function getPlayerOrGoalieSpecifics(type, index) {
    if (type === 'maalivahti') {
        return '&emsp;Torjuntaprosentti: ' + allPlayers[index].torjuntaprosentti;
    }
    return '&emsp;Plusmiinus: ' + allPlayers[index].plusmiinus;
}

function getPlayerScore(index) {
    var sum = 0.0;
    sum += parseInt(allPlayers[index].maalit);
    sum += parseInt(allPlayers[index].syotot);
    sum -= parseInt(allPlayers[index].jaahyt) / 10;
    if (allPlayers[index].tyyppi === 'maalivahti') {
        sum += (parseInt(allPlayers[index].torjuntaprosentti) - 9000) / 10;
    } else {
        sum += parseInt(allPlayers[index].plusmiinus);
    }
    return sum;
}

