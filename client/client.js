var sys = require("sys");
var wsc = require('./node-ws-client');

var serverAddress = '127.0.0.1', nClients = 65536, cFreqDef = 0.02, cFreq = cFreqDef, _isDoCreate=true;
var connected=0, received=0, receivedRaw=0,  ended=0, timedout=0, errors=0, disconnected=0, exceptions=0, connectedClients=0, _lastConnectedClients=-1, last_elapsed=0, elapsed_min = Infinity, elapsed_max=0, elapsed_total=0, elapsed_mean=0;
var clients = [];

function createClient(n) {
	var wsClient=null;
	
	try {
		var wsClient = wsc.createClient('ws://' + serverAddress + ':8080/'); // 127.0.0.1

		wsClient.addListener('connect', function() {
		  connected++;
		  connectedClients++;
		  if(_isDoCreate) createAnotherClient();
		});

		wsClient.addListener('data', function(data) {
			//sys.puts("Received data "+ n +": " + data);
			received++;
			data = JSON.parse(data);
			if(data.ts > 0) {
				var elapsed = Date.now() - data.ts;
				last_elapsed = elapsed;
				if(elapsed < elapsed_min) elapsed_min = elapsed;
				if(elapsed > elapsed_max) elapsed_max = elapsed;
				elapsed_total += elapsed; 
				elapsed_mean = elapsed_total / received;
			}
		});

                wsClient.socket.addListener('data', function(data) {
                        receivedRaw++;
                });
                wsClient.socket.addListener('end', function() {
			ended++;
                });
                wsClient.socket.addListener('timeout', function() {
			timedout++;
                });
                wsClient.socket.addListener('error', function(ex) {
			errors++;
                });
                wsClient.addListener('errorN', function() {
                        errors++;
                });

                wsClient.socket.addListener('close', function(had_error) {
                        if(had_error) errors++;
                });

		wsClient.addListener('close', function() {
			disconnected++;
			connectedClients--;
		});
		cFreq = cFreqDef;
	}
	catch(e) {
		cFreq = 0.1;
	}

	return wsClient;
}

function createAnotherClient() {
	if(nClients > connectedClients) clients.push(createClient(connectedClients));
}

var _doingClients = false;
function loadTest() {
	if(_doingClients) return;
	_doingClients = true;
	var clientsToDo = nClients-connectedClients;
	sys.puts("init "+ clientsToDo +" clients");
	for(var i=0; i< clientsToDo; i++) {
		try {
			clients.push(createClient(i));
			sys.puts(i);
		}
		catch(e) {
//			sys.puts("ERROR at " + i);
//			break;
			exceptions++;
		}
	}
	_doingClients = false;
}

process.on('uncaughtException', function (err) {
  //console.log('Runaway exception: ' + err.stack);
  exceptions++;
  cFreq = 0.1;
});

setInterval(function() {
	sys.puts("connected: " + connected +" received: "+ received +" receivedRaw: "+ receivedRaw + " ended: "+ ended +" timedout: "+ timedout +" errors: "+ errors +" disconnected: "+ disconnected +" exceptions: "+ exceptions +" connectedClients: "+ connectedClients);
	sys.puts("     last_elapsed: "+ last_elapsed +" elapsed_min: "+ elapsed_min +" elapsed_max: "+ elapsed_max +" elapsed_total: "+ elapsed_total +" elapsed_mean: "+ elapsed_mean);
}, 2000);

var _createHandle;
/*
_createHandle = setInterval(function() {
//	loadTest()
	createAnotherClient();
}, cFreq * 1000);
*/

setInterval(function() {
//      loadTest()
	if(_lastConnectedClients == connectedClients) {
		if(_createHandle) clearInterval(_createHandle);
		_isDoCreate = false;
	}
	_lastConnectedClients = connectedClients;
}, 60000);

//loadTest();
createAnotherClient();

