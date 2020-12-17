# nodesrv-mongodb-hockey-test
Reads data from Command line given MongoDB parameters and then creates a Server to have the data available.

How to test:
In directory, where index.js
- npm install mongodb
- npm install prompt
- node index.js

Prompt will ask you username, password, clustername, dbname, collectionname.

If successful, the data is then available with Browser. 
- All json data from localhost:5001/api/pelaajat.json
- Single player json example localhost:5001/api/pelaajat?nimi=Antti Hyokkaaja
- All data with html and some score counting localhost:5001/peli

Quit Server with CTRL+C.

